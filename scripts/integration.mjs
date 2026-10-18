import assert from "node:assert/strict";
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import postgres from "postgres";
const state = JSON.parse(await readFile("data/test-state.json", "utf8"));
const app = "http://localhost:4310",
  sql = postgres(state.database, { max: 2 });
let checks = 0;
async function request(
  path,
  {
    method = "GET",
    body,
    headers = {},
    status = 200,
    origin = app,
    raw = false,
    key,
  } = {},
) {
  const response = await fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(method !== "GET" ? { Origin: app } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${response.status} ${text.slice(0, 300)}`,
  );
  checks++;
  return { response, data: raw ? text : JSON.parse(text || "null") };
}
function upload(title = "Integration document", access = "link", password) {
  const form = new FormData();
  form.set(
    "file",
    new File(
      [
        '<!doctype html><html><h1>Integration source</h1><script>document.body.dataset.script="works"</script></html>',
      ],
      "document.html",
      { type: "text/html" },
    ),
  );
  form.set(
    "metadata",
    JSON.stringify({ title, access, ...(password ? { password } : {}) }),
  );
  return form;
}
try {
  await request("/api/v1/documents", { status: 405 });
  const idem = randomUUID();
  let doc = (
    await request("/api/v1/documents", {
      method: "POST",
      body: upload(),
      status: 201,
      headers: { "Idempotency-Key": idem },
    })
  ).data;
  const key = doc.manageKey;
  assert.match(key, /^hsm_[\w-]{43}$/);
  assert.equal(doc.access, "link");
  let retry = await request("/api/v1/documents", {
    method: "POST",
    body: upload(),
    status: 201,
    headers: { "Idempotency-Key": idem },
  });
  assert.equal(retry.data.id, doc.id);
  assert.equal(retry.data.manageKey, key);
  const [cached] =
    await sql`SELECT response FROM htmlinks.idempotency_keys WHERE key=${idem}`;
  assert.ok(cached.response.sealed);
  assert.ok(!JSON.stringify(cached.response).includes(key));
  checks++;
  await request("/api/v1/documents", {
    method: "POST",
    body: upload("Different"),
    status: 409,
    headers: { "Idempotency-Key": idem },
  });
  await request("/api/v1/documents", {
    method: "POST",
    body: upload(),
    status: 400,
    headers: { "Idempotency-Key": "guessable" },
  });
  await request(`/api/v1/documents/${doc.id}`, { status: 401 });
  await request(`/api/v1/documents/${doc.id}`, {
    status: 404,
    key: "hsm_" + "x".repeat(43),
  });
  const metadata = await request(`/api/v1/documents/${doc.id}`, { key });
  assert.ok(!metadata.data.manageKey);
  assert.ok(!metadata.data.management_hash);
  let raw = await request(new URL(doc.url).pathname + "/raw", {
    raw: true,
  });
  assert.ok(raw.data.includes("Integration source"));
  assert.ok(
    raw.response.headers
      .get("content-security-policy")
      .includes("sandbox allow-scripts"),
  );
  assert.ok(
    !raw.response.headers
      .get("content-security-policy")
      .includes("allow-same-origin"),
  );
  const firstRevision = (
    await request(`/api/v1/documents/${doc.id}/revisions`, { key })
  ).data.revisions[0].id;
  await request(`/api/v1/documents/${doc.id}`, {
    method: "PATCH",
    key,
    status: 428,
    body: { title: "Renamed" },
  });
  await request(`/api/v1/documents/${doc.id}`, {
    method: "PATCH",
    key,
    status: 412,
    headers: { "If-Match": '"0"' },
    body: { title: "Renamed" },
  });
  doc = (
    await request(`/api/v1/documents/${doc.id}`, {
      method: "PATCH",
      key,
      headers: { "If-Match": doc.etag },
      body: { access: "password", password: "protected-document-password" },
    })
  ).data;
  const gate = await request(new URL(doc.url).pathname, {
    raw: true,
  });
  assert.ok(!gate.data.includes("Integration source"));
  assert.ok(!gate.data.includes("Integration document"));
  await request(new URL(doc.url).pathname + "/raw", {
    status: 403,
  });
  const unlock = await fetch(doc.url + "/unlock", {
    method: "POST",
    headers: {
      Origin: app,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ password: "protected-document-password" }),
    redirect: "manual",
  });
  assert.equal(unlock.status, 303);
  checks++;
  const cookie = unlock.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  await request(new URL(doc.url).pathname + "/raw", {
    raw: true,
    headers: { cookie },
  });
  doc = (
    await request(`/api/v1/documents/${doc.id}`, {
      method: "PATCH",
      key,
      headers: { "If-Match": doc.etag },
      body: { password: "changed-document-password" },
    })
  ).data;
  assert.equal(doc.access, "password");
  await request(new URL(doc.url).pathname + "/raw", {
    status: 403,
    headers: { cookie },
  });
  const file = new FormData();
  file.set(
    "file",
    new File(
      ["<!doctype html><html><h1>Replacement</h1></html>"],
      "replacement.html",
    ),
  );
  const originalUrl = doc.url;
  doc = (
    await request(`/api/v1/documents/${doc.id}/content`, {
      method: "PUT",
      key,
      headers: { "If-Match": doc.etag },
      body: file,
    })
  ).data;
  assert.equal(doc.url, originalUrl);
  assert.equal(doc.revision, 2);
  assert.equal(doc.access, "password");
  doc = (
    await request(`/api/v1/documents/${doc.id}/rollback`, {
      method: "POST",
      key,
      headers: { "If-Match": doc.etag },
      body: { revisionId: firstRevision },
    })
  ).data;
  assert.equal(doc.revision, 3);
  const other = (
    await request("/api/v1/documents", {
      method: "POST",
      status: 201,
      body: upload("Another author"),
    })
  ).data;
  await request(`/api/v1/documents/${other.id}/source`, { key, status: 404 });
  await request(`/api/v1/documents/${doc.id}/source`, { raw: true, key });
  await request(
    `/api/v1/documents/${doc.id}/revisions/${randomUUID()}/source`,
    { key, status: 404 },
  );
  const big = new FormData();
  big.set("file", new File([new Uint8Array(10485761)], "large.html"));
  await request("/api/v1/documents", {
    method: "POST",
    body: big,
    status: 413,
  });
  const pdf = new FormData();
  pdf.set("file", new File(["not html"], "slides.pdf"));
  await request("/api/v1/documents", {
    method: "POST",
    body: pdf,
    status: 415,
  });
  doc = (
    await request(`/api/v1/documents/${doc.id}`, {
      method: "DELETE",
      key,
      headers: { "If-Match": doc.etag },
    })
  ).data;
  await request(new URL(doc.url).pathname, { status: 404 });
  await request(`/api/v1/documents/${doc.id}`, { key, status: 404 });
  doc = (
    await request(`/api/v1/documents/${doc.id}/restore`, {
      method: "POST",
      key,
      headers: { "If-Match": doc.etag },
    })
  ).data;
  assert.equal(doc.deletedAt, null);
  await request("/api/v1/documents", { status: 405 });
  await request("/api/account", { status: 404, raw: true });
  await request("/api/setup", { status: 404, raw: true });
  const source = await request("/skill/scripts/htmlinks.mjs", { raw: true });
  assert.ok(source.data.includes(`const DEFAULT_URL = "${app}";`));
  await writeFile("data/downloaded-htmlinks.mjs", source.data);
  await writeFile(
    "data/cli-document.html",
    "<!doctype html><html><h1>Published by the skill</h1></html>",
  );
  async function cli(args, input = "") {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        HTMLINKS_CONFIG_DIR: "./data/test-credentials",
      };
      delete env.HTMLINKS_URL;
      delete env.HTMLINKS_TOKEN;
      delete env.HTMLINKS_MANAGEMENT_KEY;
      const child = spawn(
        process.execPath,
        ["data/downloaded-htmlinks.mjs", ...args],
        { env, stdio: ["pipe", "pipe", "pipe"] },
      );
      let out = "",
        err = "";
      child.stdout.on("data", (x) => (out += x));
      child.stderr.on("data", (x) => (err += x));
      child.stdin.end(input);
      child.on("exit", (code) =>
        code ? reject(new Error(err)) : resolve(JSON.parse(out)),
      );
    });
  }
  const configured = await cli([
    "config",
    "--hosting",
    "self-hosted",
    "--url",
    app,
  ]);
  assert.equal(configured.url, app);
  assert.equal((await cli(["config"])).hosting, "self-hosted");
  const cliDoc = await cli([
    "upload",
    "data/cli-document.html",
    "--title",
    "From the account-free skill",
  ]);
  assert.ok(!cliDoc.manageKey);
  const updated = await cli(["update", cliDoc.id, "data/cli-document.html"]);
  assert.equal(updated.url, cliDoc.url);
  assert.equal(updated.revision, 2);
  const listed = await cli(["list"]);
  assert.ok(listed.documents.some((d) => d.id === cliDoc.id));
  assert.ok(!JSON.stringify(listed).includes("hsm_"));
  const directories = await readdir("data/test-credentials");
  const fileStat = await stat(
    `data/test-credentials/${directories.find((x) => /^[a-f\d]{24}$/.test(x))}/${cliDoc.id}.json`,
  );
  assert.equal(fileStat.mode & 0o777, 0o600);
  const protectedDoc = await cli(
    [
      "upload",
      "data/cli-document.html",
      "--access",
      "password",
      "--password-stdin",
    ],
    "skill-test-password\n",
  );
  assert.equal(protectedDoc.access, "password");
  await request(new URL(protectedDoc.url).pathname + "/raw", {
    status: 403,
  });
  const protectedGate = await request(new URL(protectedDoc.url).pathname, {
    raw: true,
  });
  assert.ok(!protectedGate.data.includes("Published by the skill"));
  const protectedUpdate = await cli([
    "update",
    protectedDoc.id,
    "data/cli-document.html",
  ]);
  assert.equal(protectedUpdate.access, "password");
  assert.equal(protectedUpdate.url, protectedDoc.url);
  const unlockSkill = await fetch(protectedDoc.url + "/unlock", {
    method: "POST",
    headers: {
      Origin: app,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ password: "skill-test-password" }),
    redirect: "manual",
  });
  assert.equal(unlockSkill.status, 303);
  const skillCookie = unlockSkill.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const protectedHtml = await request(
    new URL(protectedDoc.url).pathname + "/raw",
    { raw: true, headers: { cookie: skillCookie } },
  );
  assert.match(protectedHtml.data, /Published by the skill/);
  const changedPassword = await cli(
    ["access", protectedDoc.id, "--mode", "password", "--password-stdin"],
    "skill-test-changed-password\n",
  );
  assert.equal(changedPassword.access, "password");
  await request(new URL(protectedDoc.url).pathname + "/raw", {
    status: 403,
    headers: { cookie: skillCookie },
  });
  checks += 6;
  checks += 4;
  const openapi = (await request("/api/openapi")).data;
  assert.equal(openapi.openapi, "3.1.0");
  assert.deepEqual(openapi.paths["/documents"].post.security, []);
  await writeFile(
    "data/browser-fixture.json",
    JSON.stringify({
      url: app,
      documentId: doc.id,
      publicUrl: cliDoc.url,
    }),
    { mode: 0o600 },
  );
  console.log(
    `Passed ${checks} integration checks: anonymous uploads, per-document keys, encrypted retries, password revocation, stable links, and the installed skill without an account.`,
  );
} finally {
  await sql.end();
}
