import { pathToFileURL } from "node:url";

export async function setupStorage(env = process.env, request = fetch) {
  const { SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: token } = env;
  const bucket = env.SUPABASE_BUCKET;
  if (!base || !token || !bucket || !/^[\w-]+$/.test(bucket))
    throw new Error(
      "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_BUCKET before setup.",
    );
  const url = new URL(base);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("SUPABASE_URL must be an HTTPS project origin.");
  const headers = {
    Authorization: `Bearer ${token}`,
    apikey: token,
    "Content-Type": "application/json",
  };
  async function call(path, method = "GET", body) {
    const response = await request(`${url.origin}/storage/v1${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        `Supabase Storage ${method} failed (${response.status}).`,
      );
    return response;
  }
  const buckets = await (await call("/bucket")).json();
  if (!Array.isArray(buckets))
    throw new Error("Supabase returned an invalid bucket list.");
  const existing = buckets.find((entry) => entry.id === bucket);
  if (existing) {
    if (existing.public !== false)
      throw new Error(
        "The configured bucket is public. Make it private before deploying HTMLinks.",
      );
    return "Private storage bucket verified.";
  }
  await call("/bucket", "POST", { id: bucket, name: bucket, public: false });
  const created = await (await call(`/bucket/${bucket}`)).json();
  if (created.public !== false)
    throw new Error("Storage bucket privacy could not be verified.");
  return "Private storage bucket created and verified.";
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (!process.env.MIGRATION_DATABASE_URL && !process.env.DATABASE_URL)
      throw new Error("Set DATABASE_URL before running Supabase setup.");
    console.log(await setupStorage());
  } catch (error) {
    console.error(
      error instanceof TypeError
        ? "Supabase setup failed. Check the project URL and network connection."
        : error.message,
    );
    process.exitCode = 1;
  }
}
