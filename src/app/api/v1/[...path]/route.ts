import { endpoint } from "@/lib/http";
import { documentApi } from "@/lib/documents";
export const runtime = "nodejs";
const handler = async (
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  return endpoint((r) => documentApi(r, path))(request);
};
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
