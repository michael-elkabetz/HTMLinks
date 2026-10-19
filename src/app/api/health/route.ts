import { sql } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  try {
    await sql()`SELECT 1 FROM htmlinks.migrations LIMIT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
