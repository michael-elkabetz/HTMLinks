import { examples } from "@/lib/examples";
import { artifactCsp } from "@/lib/security";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const html = examples[kind as keyof typeof examples];
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": artifactCsp,
      "X-Robots-Tag": "noindex",
    },
  });
}
