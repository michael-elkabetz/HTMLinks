import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "./config";
function filename(key: string) {
  if (!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.html$/.test(key))
    throw new Error("Invalid storage key");
  return path.join(
    /* turbopackIgnore: true */ process.env.STORAGE_PATH || "./data/uploads",
    key,
  );
}
async function cloud(key: string, method: string, body?: Uint8Array) {
  const base = process.env.SUPABASE_URL,
    token = process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket = process.env.SUPABASE_BUCKET || "hstore";
  if (!base || !token || !/^[a-zA-Z0-9_-]+$/.test(bucket))
    throw new Error("Supabase storage is not configured");
  filename(key);
  const result = await fetch(`${base}/storage/v1/object/${bucket}/${key}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: token,
      "Content-Type": "text/html; charset=utf-8",
    },
    body: body ? Buffer.from(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  if (!result.ok && !(method === "DELETE" && result.status === 404))
    throw new Error(`Storage ${method} failed: ${result.status}`);
  return result;
}
export async function writeArtifact(key: string, bytes: Uint8Array) {
  if (config().storage === "supabase") {
    await cloud(key, "POST", bytes);
    return;
  }
  const file = filename(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes, { flag: "wx", mode: 0o600 });
}
export async function readArtifact(key: string) {
  return config().storage === "supabase"
    ? Buffer.from(await (await cloud(key, "GET")).arrayBuffer())
    : readFile(/* turbopackIgnore: true */ filename(key));
}
export async function removeArtifact(key: string) {
  if (config().storage === "supabase") {
    await cloud(key, "DELETE");
    return;
  }
  try {
    await unlink(filename(key));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
