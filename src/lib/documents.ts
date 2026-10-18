import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { capability } from "./auth";
import { passwordHash } from "./passwords";
import { sql } from "./db";
import { config } from "./config";
import { boundedBody, fail, json, readJson } from "./http";
import {
  digest,
  etag,
  precondition,
  secret,
  seal,
  unseal,
  requestFingerprint,
} from "./security";
import { htmlFile, metadata, patchMetadata } from "./validation";
import { readArtifact, writeArtifact } from "./storage";

type Document = {
  id: string;
  workspace_id: string;
  public_id: string;
  title: string;
  category: string;
  access: "private" | "link" | "password";
  password_hash: string | null;
  policy_version: number;
  version: number;
  revision: number;
  size: number;
  current_revision_id: string;
  expires_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};
function output(d: Document) {
  return {
    id: d.id,
    publicId: d.public_id,
    title: d.title,
    category: d.category,
    access: d.access,
    revision: d.revision,
    version: d.version,
    etag: etag(d.version),
    size: d.size,
    url: `${config().app}/rendered/${d.public_id}`,
    expiresAt: d.expires_at,
    deletedAt: d.deleted_at,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  };
}
function match(request: Request, doc: Document) {
  const status = precondition(request.headers.get("if-match"), doc.version);
  if (status)
    fail(
      status,
      status === 428 ? "PRECONDITION_REQUIRED" : "VERSION_CONFLICT",
      status === 428
        ? "Supply the current ETag in If-Match."
        : "The document changed. Fetch its current version and try again.",
    );
}
export async function documentApi(request: Request, path: string[]) {
  const method = request.method;
  if (path[0] !== "documents" || path.length > 5)
    fail(404, "NOT_FOUND", "Endpoint not found.");
  const id = path[1],
    action = path[2];
  if (id && !z.uuid().safeParse(id).success)
    fail(404, "NOT_FOUND", "Document not found.");
  if (path.length === 1 && method !== "POST")
    fail(
      405,
      "METHOD_NOT_ALLOWED",
      "Upload with POST. There is no public document index.",
    );
  const a = await capability(request, id);
  let current: Document | undefined;
  if (id) {
    const [row] =
      await sql()`SELECT * FROM htmlinks.documents WHERE id=${id} AND workspace_id=${a.workspaceId}`;
    current = row as Document | undefined;
    if (!current || (current.deleted_at && action !== "restore"))
      fail(404, "NOT_FOUND", "Document not found.");
  }
  if (id && !action && path.length === 2 && method === "GET")
    return json(output(current!), 200, { ETag: etag(current!.version) });
  if (id && action === "revisions" && path.length === 3 && method === "GET") {
    const revisions =
      await sql()`SELECT id,number,size,filename,checksum,created_at AS "createdAt" FROM htmlinks.document_revisions WHERE document_id=${id} AND workspace_id=${a.workspaceId} ORDER BY number DESC`;
    return json({ revisions });
  }
  if (
    id &&
    method === "GET" &&
    ((action === "source" && path.length === 3) ||
      (action === "revisions" && path.length === 5 && path[4] === "source"))
  ) {
    const revisionId =
      action === "source"
        ? current!.current_revision_id
        : z.uuid().parse(path[3]);
    const [revision] =
      await sql()`SELECT * FROM htmlinks.document_revisions WHERE id=${revisionId} AND document_id=${id} AND workspace_id=${a.workspaceId}`;
    if (!revision) fail(404, "NOT_FOUND", "Revision not found.");
    return new Response(
      new Uint8Array(await readArtifact(revision.storage_key)),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="document-${revision.number}.html"`,
          "Cache-Control": "private, no-store",
          "Content-Security-Policy": "sandbox; default-src 'none'",
        },
      },
    );
  }
  if (id && action === "preview" && path.length === 3 && method === "POST") {
    const token = secret();
    await sql()`INSERT INTO htmlinks.viewer_grants(digest,document_id,policy_version,kind,expires_at) VALUES (${digest(token)},${id},${current!.policy_version},'handoff',now()+interval '60 seconds')`;
    return json({
      action: `${config().app}/rendered/${current!.public_id}/handoff`,
      grant: token,
    });
  }
  const create = !id && path.length === 1 && method === "POST";
  const replace =
    !!id && action === "content" && path.length === 3 && method === "PUT";
  const rollback =
    !!id && action === "rollback" && path.length === 3 && method === "POST";
  if (create || replace || rollback) {
    let bytes: Buffer,
      filename: string,
      values: z.infer<typeof metadata> | undefined;
    if (rollback) {
      const { revisionId } = z
        .object({ revisionId: z.uuid() })
        .parse(await readJson(request));
      const [revision] =
        await sql()`SELECT * FROM htmlinks.document_revisions WHERE id=${revisionId} AND document_id=${id} AND workspace_id=${a.workspaceId}`;
      if (!revision) fail(404, "NOT_FOUND", "Revision not found.");
      bytes = await readArtifact(revision.storage_key);
      filename = revision.filename;
    } else {
      const body = await boundedBody(request, config().maxBytes + 65536);
      let form: FormData;
      try {
        form = await new Request("http://localhost", {
          method: "POST",
          headers: {
            "content-type": request.headers.get("content-type") || "",
          },
          body: new Uint8Array(body),
        }).formData();
      } catch {
        return fail(
          400,
          "INVALID_MULTIPART",
          "Send multipart/form-data with a file and optional metadata JSON.",
        );
      }
      const file = form.get("file");
      if (!(file instanceof File))
        fail(400, "FILE_REQUIRED", "The file field is required.");
      if (file.size > config().maxBytes)
        fail(
          413,
          "TOO_LARGE",
          `The maximum file size is ${config().maxBytes} bytes.`,
        );
      bytes = Buffer.from(await file.arrayBuffer());
      filename = file.name.slice(0, 200);
      const invalid = htmlFile(filename, bytes);
      if (invalid) fail(415, "UNSUPPORTED_FILE", invalid);
      if (create) {
        let raw: unknown;
        try {
          raw = JSON.parse(String(form.get("metadata") || "{}"));
        } catch {
          return fail(400, "INVALID_JSON", "metadata must contain JSON.");
        }
        values = metadata.parse({
          title: filename.replace(/\.html?$/i, ""),
          ...(raw as object),
        });
        if (values.password && values.access !== "password")
          fail(
            422,
            "INVALID_ACCESS",
            "Choose password access when setting a password.",
          );
        if (values.access === "password" && !values.password)
          fail(
            422,
            "PASSWORD_REQUIRED",
            "Password-protected documents require a password of at least 8 characters.",
          );
      }
    }
    if (!bytes.length || bytes.length > config().maxBytes)
      fail(413, "TOO_LARGE", "The file is empty or too large.");
    const documentId = id || randomUUID(),
      revisionId = randomUUID(),
      key = `${a.workspaceId}/${documentId}/${revisionId}.html`;
    const idem = request.headers.get("idempotency-key");
    if (
      idem &&
      (idem.length < 32 || idem.length > 128 || !/^[\w-]+$/.test(idem))
    )
      fail(
        400,
        "INVALID_IDEMPOTENCY_KEY",
        "Use a random retry key of 32–128 letters, numbers, underscores or hyphens.",
      );
    const fingerprint = requestFingerprint(
      `${method}:${path.join("/")}:${request.headers.get("if-match")}:${digest(bytes)}:${JSON.stringify(values)}`,
    );
    await sql()`INSERT INTO htmlinks.maintenance_jobs(storage_key,workspace_id,size,available_at) VALUES (${key},${a.workspaceId},0,now()+interval '1 hour')`;
    const managementKey = create ? `hsm_${secret()}` : undefined;
    const password = values?.password
      ? await passwordHash(values.password)
      : null;
    const result = await sql().begin(async (tx) => {
      if (idem) {
        await tx`SELECT pg_advisory_xact_lock(hashtextextended(${a.actorKey + ":" + idem},0))`;
        const [previous] =
          await tx`SELECT * FROM htmlinks.idempotency_keys WHERE actor_key=${a.actorKey} AND key=${idem} AND expires_at>now()`;
        if (previous) {
          if (previous.fingerprint !== fingerprint)
            fail(
              409,
              "IDEMPOTENCY_CONFLICT",
              "This idempotency key was used for a different request.",
            );
          await tx`DELETE FROM htmlinks.maintenance_jobs WHERE storage_key=${key}`;
          return {
            body: unseal(previous.response.sealed),
            status: previous.status,
          };
        }
      }
      const [workspace] =
        await tx`SELECT * FROM htmlinks.workspaces WHERE id=${a.workspaceId} FOR UPDATE`;
      if (
        Number(workspace.used_bytes) + bytes.length >
        Number(workspace.quota_bytes)
      )
        fail(
          409,
          "QUOTA_EXCEEDED",
          "This instance’s storage is full. Contact the operator or use another server.",
        );
      let row: Document;
      if (create) {
        const [d] =
          await tx`INSERT INTO htmlinks.documents(id,workspace_id,public_id,management_hash,title,category,access,password_hash,size,created_by,expires_at) VALUES (${documentId},${a.workspaceId},${secret().slice(0, 24)},${digest(managementKey!)},${values!.title},${values!.category},${values!.access},${password},${bytes.length},${a.userId},${values!.expiresAt || null}) RETURNING *`;
        row = d as Document;
      } else {
        const [d] =
          await tx`SELECT * FROM htmlinks.documents WHERE id=${documentId} AND workspace_id=${a.workspaceId} AND deleted_at IS NULL FOR UPDATE`;
        if (!d) fail(404, "NOT_FOUND", "Document not found.");
        row = d as Document;
        match(request, row);
        row.revision++;
      }
      await writeArtifact(key, bytes);
      await tx`INSERT INTO htmlinks.document_revisions(id,document_id,workspace_id,number,storage_key,checksum,size,filename,created_by) VALUES (${revisionId},${documentId},${a.workspaceId},${row.revision},${key},${digest(bytes)},${bytes.length},${filename},${a.userId})`;
      const [updated] =
        await tx`UPDATE htmlinks.documents SET current_revision_id=${revisionId},revision=${row.revision},size=${bytes.length},version=version+${create ? 0 : 1},updated_at=now() WHERE id=${documentId} RETURNING *`;
      await tx`UPDATE htmlinks.workspaces SET used_bytes=used_bytes+${bytes.length} WHERE id=${a.workspaceId}`;
      await tx`DELETE FROM htmlinks.maintenance_jobs WHERE storage_key=${key}`;
      await tx`INSERT INTO htmlinks.audit_events(workspace_id,actor_id,document_id,action) VALUES (${a.workspaceId},${a.userId},${documentId},${create ? "create" : rollback ? "rollback" : "replace"})`;
      const body = {
          ...output(updated as Document),
          ...(managementKey ? { manageKey: managementKey } : {}),
        },
        status = create ? 201 : 200;
      if (idem)
        await tx`INSERT INTO htmlinks.idempotency_keys(actor_key,key,fingerprint,response,status) VALUES (${a.actorKey},${idem},${fingerprint},${tx.json({ sealed: seal(body) })},${status}) ON CONFLICT(actor_key,key) DO UPDATE SET fingerprint=EXCLUDED.fingerprint,response=EXCLUDED.response,status=EXCLUDED.status,expires_at=now()+interval '24 hours'`;
      return { body, status };
    });
    return json(result.body, result.status, {
      ETag: (result.body as { etag: string }).etag,
    });
  }
  const patch = !!id && !action && path.length === 2 && method === "PATCH";
  const remove = !!id && !action && path.length === 2 && method === "DELETE";
  const restore =
    !!id && action === "restore" && path.length === 3 && method === "POST";
  if (patch || remove || restore) {
    const value = patch ? patchMetadata.parse(await readJson(request)) : {};
    if (
      value.password &&
      value.access !== "password" &&
      current!.access !== "password"
    )
      fail(
        422,
        "INVALID_ACCESS",
        "Choose password access when setting a password.",
      );
    const hash = value.password ? await passwordHash(value.password) : null;
    const result = await sql().begin(async (tx) => {
      const [raw] =
        await tx`SELECT * FROM htmlinks.documents WHERE id=${id!} AND workspace_id=${a.workspaceId} FOR UPDATE`;
      const d = raw as Document;
      if (!d || (d.deleted_at && !restore))
        fail(404, "NOT_FOUND", "Document not found.");
      match(request, d);
      if (
        restore &&
        (!d.deleted_at ||
          Date.now() - new Date(d.deleted_at).getTime() >
            (Number(process.env.RETENTION_DAYS) || 7) * 86400000)
      )
        fail(409, "NOT_RECOVERABLE", "This document cannot be restored.");
      const access = value.access || d.access,
        pass = access === "password" ? hash || d.password_hash : null;
      if (access === "password" && !pass)
        fail(
          422,
          "PASSWORD_REQUIRED",
          "Set a password of at least 8 characters.",
        );
      const policyChanged =
        remove ||
        restore ||
        access !== d.access ||
        !!hash ||
        value.expiresAt !== undefined;
      const [updated] =
        await tx`UPDATE htmlinks.documents SET title=${value.title || d.title},category=${value.category || d.category},access=${access},password_hash=${pass},expires_at=${value.expiresAt === undefined ? d.expires_at : value.expiresAt},deleted_at=${remove ? new Date() : restore ? null : d.deleted_at},version=version+1,policy_version=policy_version+${policyChanged ? 1 : 0},updated_at=now() WHERE id=${id!} RETURNING *`;
      await tx`INSERT INTO htmlinks.audit_events(workspace_id,actor_id,document_id,action) VALUES (${a.workspaceId},${a.userId},${id!},${remove ? "delete" : restore ? "restore" : "edit"})`;
      return output(updated as Document);
    });
    return json(result, 200, { ETag: result.etag });
  }
  return fail(404, "NOT_FOUND", "Endpoint not found.");
}
