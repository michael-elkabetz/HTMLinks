import postgres from "postgres";
import { unlink } from "node:fs/promises";
import path from "node:path";
const sql = postgres(process.env.DATABASE_URL, { max: 2, prepare: false });
const days = Math.max(1, Number(process.env.RETENTION_DAYS) || 7);
async function remove(key) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.html$/.test(key))
    throw new Error("Invalid storage key");
  if (process.env.STORAGE_DRIVER === "supabase") {
    const url = process.env.SUPABASE_URL,
      token = process.env.SUPABASE_SERVICE_ROLE_KEY,
      bucket = process.env.SUPABASE_BUCKET || "hstore";
    if (!url || !token || !/^[\w-]+$/.test(bucket))
      throw new Error("Storage configuration missing");
    const result = await fetch(`${url}/storage/v1/object/${bucket}/${key}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, apikey: token },
      signal: AbortSignal.timeout(30000),
    });
    if (!result.ok && result.status !== 404)
      throw new Error(`Storage deletion failed: ${result.status}`);
  } else
    try {
      await unlink(
        path.join(process.env.STORAGE_PATH || "./data/uploads", key),
      );
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
}
async function run() {
  for (const w of await sql`SELECT id FROM htmlinks.workspaces`)
    await sql.begin(async (tx) => {
      await tx`SELECT id FROM htmlinks.workspaces WHERE id=${w.id} FOR UPDATE`;
      const docs =
        await tx`SELECT id FROM htmlinks.documents WHERE workspace_id=${w.id} AND deleted_at<now()-${days}*interval '1 day' FOR UPDATE`;
      for (const doc of docs) {
        await tx`INSERT INTO htmlinks.maintenance_jobs(storage_key,workspace_id,size) SELECT storage_key,workspace_id,size FROM htmlinks.document_revisions WHERE document_id=${doc.id} ON CONFLICT(storage_key) DO UPDATE SET size=EXCLUDED.size,available_at=now()`;
        await tx`DELETE FROM htmlinks.documents WHERE id=${doc.id}`;
      }
    });
  for (const job of await sql`SELECT storage_key FROM htmlinks.maintenance_jobs WHERE available_at<=now() ORDER BY available_at LIMIT 100`) {
    try {
      await sql.begin(async (tx) => {
        const [j] =
          await tx`SELECT * FROM htmlinks.maintenance_jobs WHERE storage_key=${job.storage_key} AND available_at<=now() FOR UPDATE SKIP LOCKED`;
        if (!j) return;
        if (
          !(
            await tx`SELECT 1 FROM htmlinks.document_revisions WHERE storage_key=${j.storage_key}`
          ).length
        ) {
          await remove(j.storage_key);
          if (j.size)
            await tx`UPDATE htmlinks.workspaces SET used_bytes=greatest(0,used_bytes-${j.size}) WHERE id=${j.workspace_id}`;
        }
        await tx`DELETE FROM htmlinks.maintenance_jobs WHERE storage_key=${j.storage_key}`;
      });
    } catch {
      await sql`UPDATE htmlinks.maintenance_jobs SET attempts=attempts+1,available_at=now()+interval '15 minutes' WHERE storage_key=${job.storage_key}`;
      console.error("Object cleanup deferred; check storage connectivity.");
    }
  }
  await sql`DELETE FROM htmlinks.viewer_grants WHERE expires_at<now()`;
  await sql`DELETE FROM htmlinks.idempotency_keys WHERE expires_at<now()`;
  await sql`DELETE FROM htmlinks.rate_limits WHERE resets_at<now()`;

  console.log("Maintenance complete.");
}
try {
  do {
    try {
      await run();
    } catch (e) {
      if (!process.argv.includes("--loop")) throw e;
      console.error("Maintenance failed; retrying next interval.");
    }
    if (!process.argv.includes("--loop")) break;
    await new Promise((r) => setTimeout(r, 300000));
  } while (true);
} finally {
  await sql.end();
}
