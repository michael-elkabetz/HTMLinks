import { endpoint } from "@/lib/http";
import { viewer } from "@/lib/viewer";

export const runtime = "nodejs";

const handler = async (
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  return endpoint((r) => viewer(r, path))(request);
};

export const GET = handler;
export const POST = handler;
