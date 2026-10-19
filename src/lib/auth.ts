import "server-only";
import { sql } from "./db";
import { digest } from "./security";
import { fail, rateLimit, sourceKey } from "./http";
export const instanceId = "00000000-0000-4000-8000-000000000001";
export async function capability(request: Request, id?: string) {
  await rateLimit(`requests:${sourceKey(request)}`, 120);
  if (!id) {
    await rateLimit(`uploads:${sourceKey(request)}`, 20, 300);
    await rateLimit(
      "uploads-global",
      Number(process.env.MAX_DAILY_UPLOADS) || 500,
      86400,
    );
    return { userId: "anonymous", workspaceId: instanceId, actorKey: "upload" };
  }
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (hsm_[\w-]{43})$/)?.[1];
  if (!token)
    fail(
      401,
      "MANAGEMENT_KEY_REQUIRED",
      "Supply this document’s management key as a Bearer credential.",
    );
  const [d] =
    await sql()`SELECT id FROM htmlinks.documents WHERE id=${id} AND management_hash=${digest(token)}`;
  if (!d) fail(404, "NOT_FOUND", "Document not found.");
  return { userId: "capability", workspaceId: instanceId, actorKey: id };
}
