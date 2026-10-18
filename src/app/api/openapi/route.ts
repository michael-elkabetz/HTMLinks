import { config } from "@/lib/config";
export const dynamic = "force-dynamic";
export async function GET() {
  const auth = [{ managementKey: [] }],
    ref = { $ref: "#/components/schemas/Document" },
    error = { $ref: "#/components/schemas/Error" };
  const id = {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
  };
  const etag = {
    name: "If-Match",
    in: "header",
    required: true,
    schema: { type: "string" },
    example: '"1"',
  };
  const idem = {
    name: "Idempotency-Key",
    in: "header",
    required: false,
    schema: { type: "string", minLength: 32, maxLength: 128 },
  };
  const metadata = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1, maxLength: 160 },
      category: {
        enum: ["design", "presentation", "technical", "report", "other"],
      },
      access: { enum: ["private", "link", "password"] },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 256,
        writeOnly: true,
      },
      expiresAt: { type: ["string", "null"], format: "date-time" },
    },
  };
  const multipart = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          required: ["file"],
          properties: {
            file: { type: "string", format: "binary" },
            metadata: {
              type: "string",
              description: "JSON-encoded metadata; only read on creation.",
            },
          },
        },
      },
    },
  };
  function operation(
    summary: string,
    parameters: unknown[] = [],
    requestBody?: unknown,
    status = 200,
    schema: unknown = ref,
  ) {
    return {
      summary,
      security: auth,
      parameters,
      ...(requestBody ? { requestBody } : {}),
      responses: {
        [status]: {
          description: "Success",
          headers: { ETag: { schema: { type: "string" } } },
          content: { "application/json": { schema } },
        },
        default: {
          description:
            "Error; 401 unauthorized, 403 forbidden, 404 unavailable, 409 quota/idempotency, 412 stale ETag, 413 body limit, 415 file type, 422 validation, 428 missing ETag, 429 rate limit",
          content: { "application/json": { schema: error } },
        },
      },
    };
  }
  const jsonBody = (schema: unknown) => ({
    required: true,
    content: { "application/json": { schema } },
  });
  const paths: Record<string, unknown> = {
    "/documents": {
      post: {
        ...operation("Upload HTML without an account", [idem], multipart, 201, {
          ...ref,
          description: "Includes a secret manageKey on creation.",
        }),
        security: [],
      },
    },
    "/documents/{id}": {
      get: operation("Read metadata", [id]),
      patch: operation(
        "Change metadata or access",
        [id, etag],
        jsonBody(metadata),
      ),
      delete: operation("Soft delete and revoke access", [id, etag]),
    },
    "/documents/{id}/content": {
      put: operation(
        "Publish a replacement revision",
        [id, etag, idem],
        multipart,
      ),
    },
    "/documents/{id}/source": {
      get: {
        summary: "Download current HTML source",
        security: auth,
        parameters: [id],
        responses: {
          200: {
            description: "HTML attachment",
            content: { "text/html": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/documents/{id}/revisions": {
      get: operation("List revisions", [id], undefined, 200, {
        type: "object",
        properties: {
          revisions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                number: { type: "integer" },
                size: { type: "integer" },
                filename: { type: "string" },
                checksum: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      }),
    },
    "/documents/{id}/revisions/{revisionId}/source": {
      get: {
        summary: "Download revision HTML",
        security: auth,
        parameters: [
          id,
          {
            name: "revisionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "HTML attachment",
            content: { "text/html": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/documents/{id}/rollback": {
      post: operation(
        "Republish an earlier revision",
        [id, etag],
        jsonBody({
          type: "object",
          required: ["revisionId"],
          properties: { revisionId: { type: "string", format: "uuid" } },
        }),
      ),
    },
    "/documents/{id}/restore": {
      post: operation("Restore a recoverable document", [id, etag]),
    },
    "/documents/{id}/preview": {
      post: operation(
        "Create a single-use viewer handoff",
        [id],
        undefined,
        200,
        {
          type: "object",
          properties: {
            action: { type: "string", format: "uri" },
            grant: { type: "string" },
          },
        },
      ),
    },
  };
  const documentSchema = {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      publicId: { type: "string" },
      manageKey: {
        type: "string",
        description: "Returned only when creating a document; keep private.",
      },
      title: { type: "string" },
      category: { type: "string" },
      access: { enum: ["private", "link", "password"] },
      revision: { type: "integer" },
      version: { type: "integer" },
      etag: { type: "string" },
      size: { type: "integer" },
      url: { type: "string", format: "uri" },
      expiresAt: { type: ["string", "null"], format: "date-time" },
      deletedAt: { type: ["string", "null"], format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };
  const errorSchema = {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  };
  return Response.json({
    openapi: "3.1.0",
    info: {
      title: "HTMLinks API",
      version: "0.1.0",
      description:
        "Publish self-contained HTML. Anonymous uploads. Each document has its own secret management key.",
    },
    servers: [{ url: `${config().app}/api/v1` }],
    paths,
    components: {
      securitySchemes: { managementKey: { type: "http", scheme: "bearer" } },
      schemas: { Document: documentSchema, Error: errorSchema },
    },
  });
}
