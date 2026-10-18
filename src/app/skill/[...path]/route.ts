import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import { skillSource } from "@/lib/skill-source";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const requested = (await params).path.join("/");
  const name =
    requested === "scripts/hstore.mjs" ? "scripts/htmlinks.mjs" : requested;
  if (!["SKILL.md", "scripts/htmlinks.mjs"].includes(name))
    return new Response("Not found", { status: 404 });
  let content = await readFile(
    path.join(process.cwd(), "skills/htmlinks", name),
    "utf8",
  );
  if (name.endsWith(".mjs"))
    content = skillSource(
      content,
      config().app,
      process.env.MANAGED_URL || config().app,
    );
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
