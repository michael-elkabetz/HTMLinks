import "server-only";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { config } from "./config";
import { sql } from "./db";
import { digest } from "./security";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new HttpError(status, code, message);
}
export function json(
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", ...headers },
  });
}
export function endpoint(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await fn(request);
    } catch (error) {
      const id = randomUUID();
      if (error instanceof HttpError)
        return json(
          {
            error: { code: error.code, message: error.message, requestId: id },
          },
          error.status,
          error.status === 429 ? { "Retry-After": "60" } : {},
        );
      if (error instanceof ZodError)
        return json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: error.issues
                .map((x) => `${x.path.join(".")}: ${x.message}`)
                .join("; "),
              requestId: id,
            },
          },
          422,
        );
      console.error(
        "HTMLinks request failed",
        id,
        error instanceof Error
          ? {
              name: error.name,
              location: error.stack?.split("\n")[1],
              code: (error as Error & { code?: string }).code,
              message: error instanceof TypeError ? error.message : undefined,
            }
          : "UnknownError",
      );
      return json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message:
              "The request could not be completed. Check server configuration and logs.",
            requestId: id,
          },
        },
        500,
      );
    }
  };
}
export async function boundedBody(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max)
    fail(413, "TOO_LARGE", "Request is too large.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (reader)
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > max) {
          await reader.cancel();
          fail(413, "TOO_LARGE", "Request is too large.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  return Buffer.concat(chunks);
}
export async function readJson(request: Request) {
  try {
    return JSON.parse((await boundedBody(request, 32768)).toString());
  } catch (e) {
    if (e instanceof HttpError) throw e;
    return fail(400, "INVALID_JSON", "Expected a JSON request body.");
  }
}
export function sameOrigin(request: Request, origin = config().app) {
  if (request.headers.get("origin") !== origin)
    fail(403, "ORIGIN_REJECTED", "Request origin is not allowed.");
}
export async function rateLimit(key: string, limit = 30, seconds = 60) {
  const [row] =
    await sql()`INSERT INTO htmlinks.rate_limits (key,count,resets_at) VALUES (${digest(key)},1,now()+${seconds}*interval '1 second') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN htmlinks.rate_limits.resets_at<now() THEN 1 ELSE htmlinks.rate_limits.count+1 END, resets_at=CASE WHEN htmlinks.rate_limits.resets_at<now() THEN now()+${seconds}*interval '1 second' ELSE htmlinks.rate_limits.resets_at END RETURNING count`;
  if (row.count > limit)
    fail(429, "RATE_LIMITED", "Too many attempts. Try again later.");
}
export function sourceKey(request: Request) {
  return process.env.TRUST_PROXY === "1"
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "shared";
}
