import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify, parseArgs } from "node:util";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: {
    image: { type: "string", default: "htmlinks:check" },
    "previous-image": { type: "string" },
  },
});
const image = values.image;
await mkdir(path.join(root, "data"), { recursive: true });
// Use the workspace, rather than /tmp, so Docker Desktop/Colima can mount it.
const work = await mkdtemp(path.join(root, "data/docker-check-"));
const projects = [];
const id = randomUUID().slice(0, 8);
const run = async (command, args, options = {}) =>
  (await exec(command, args, { maxBuffer: 20 * 1024 * 1024, ...options }))
    .stdout;
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
function project(directory, name, port, appImage = image) {
  const item = {
    directory,
    name,
    port,
    origin: `http://localhost:${port}`,
    env: {
      ...process.env,
      HTMLINKS_IMAGE: appImage,
      HTMLINKS_PORT: String(port),
    },
  };
  projects.push(item);
  return item;
}
const args = (p, command, files = []) => [
  "compose",
  "--project-directory",
  p.directory,
  "-p",
  p.name,
  "-f",
  path.join(p.directory, "compose.yaml"),
  ...files.flatMap((f) => ["-f", f]),
  ...command,
];
const compose = (p, command, files) =>
  run("docker", args(p, command, files), { env: p.env });
function composeInput(p, command, input) {
  const result = spawnSync("docker", args(p, command), {
    env: p.env,
    input,
    maxBuffer: 20 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr?.toString());
  return result.stdout;
}
async function request(p, route, options = {}, status = 200) {
  const response = await fetch(p.origin + route, {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(options.method ? { Origin: p.origin } : {}),
      ...options.headers,
    },
  });
  assert.equal(
    response.status,
    status,
    `${options.method || "GET"} ${route}: ${response.status} ${(response.status === status ? "" : await response.text()).slice(0, 300)}`,
  );
  return response;
}
async function upload(p, password) {
  const body = new FormData();
  body.set(
    "file",
    new File(
      ["<!doctype html><h1>Docker persisted document</h1>"],
      "docker.html",
      { type: "text/html" },
    ),
  );
  body.set(
    "metadata",
    JSON.stringify({
      title: "Docker check",
      access: password ? "password" : "link",
      ...(password ? { password } : {}),
    }),
  );
  return (
    await request(p, "/api/v1/documents", { method: "POST", body }, 201)
  ).json();
}
async function verifyDocuments(p, link, protectedDoc) {
  const linkPath = new URL(link.url).pathname;
  assert.match(
    await (await request(p, `${linkPath}/raw`)).text(),
    /Docker persisted document/,
  );
  const protectedPath = new URL(protectedDoc.url).pathname;
  await request(p, `${protectedPath}/raw`, {}, 403);
  const unlock = await request(
    p,
    `${protectedPath}/unlock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ password: "docker-check-password" }),
    },
    303,
  );
  const cookie = unlock.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.ok(cookie);
  assert.match(
    await (
      await request(p, `${protectedPath}/raw`, { headers: { cookie } })
    ).text(),
    /Docker persisted document/,
  );
  const metadata = await (
    await request(p, `/api/v1/documents/${link.id}`, {
      headers: { Authorization: `Bearer ${link.manageKey}` },
    })
  ).json();
  assert.equal(metadata.url, p.origin + linkPath);
  return metadata;
}

try {
  console.log("Packaging a standalone deployment bundle.");
  await run(process.execPath, [
    path.join(root, "scripts/package-deployment.mjs"),
    "--output",
    work,
  ]);
  const { version } = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  await run("tar", [
    "-xzf",
    path.join(work, `htmlinks-${version}.tar.gz`),
    "-C",
    work,
  ]);
  const p = project(
    path.join(work, "htmlinks"),
    `htmlinks-check-${id}`,
    await freePort(),
  );
  console.log("Initializing through Docker without a source checkout.");
  await run("sh", ["setup.sh", "--url", p.origin], {
    cwd: p.directory,
    env: p.env,
  });
  const initial = await readFile(path.join(p.directory, ".env"), "utf8");
  await run("sh", ["setup.sh"], { cwd: p.directory, env: p.env });
  assert.equal(await readFile(path.join(p.directory, ".env"), "utf8"), initial);
  const config = JSON.parse(await compose(p, ["config", "--format", "json"]));
  for (const role of ["migrate", "web", "maintenance"]) {
    assert.equal(config.services[role].image, image);
    assert.equal(config.services[role].build, undefined);
  }
  assert.equal(config.services.db.ports, undefined);
  assert.equal(config.services.web.ports[0].host_ip, "127.0.0.1");
  const cloud = JSON.parse(
    await run(
      "docker",
      [
        "compose",
        "--project-directory",
        p.directory,
        "-f",
        path.join(p.directory, "compose.cloud.yaml"),
        "config",
        "--format",
        "json",
      ],
      { env: p.env },
    ),
  );
  assert.equal(cloud.services.db, undefined);
  for (const role of ["migrate", "web", "maintenance"])
    assert.equal(cloud.services[role].image, image);
  if (values["previous-image"]) p.env.HTMLINKS_IMAGE = values["previous-image"];
  console.log(
    `Starting ${values["previous-image"] || image} and publishing documents.`,
  );
  await compose(p, ["up", "-d", "--wait", "--wait-timeout", "120"]);
  const link = await upload(p);
  const protectedDoc = await upload(p, "docker-check-password");
  await verifyDocuments(p, link, protectedDoc);
  assert.equal(
    (await compose(p, ["exec", "-T", "web", "id", "-u"])).trim(),
    "1000",
  );

  console.log("Upgrading/recreating application roles with persistent data.");
  await compose(p, ["stop", "web", "maintenance"]);
  await compose(p, ["rm", "-f", "migrate"]);
  p.env.HTMLINKS_IMAGE = image;
  await compose(p, ["up", "-d", "--wait", "--wait-timeout", "120"]);
  const current = await verifyDocuments(p, link, protectedDoc);
  const body = new FormData();
  body.set(
    "file",
    new File(
      ["<!doctype html><h1>Docker persisted document updated</h1>"],
      "updated.html",
    ),
  );
  const updated = await (
    await request(p, `/api/v1/documents/${link.id}/content`, {
      method: "PUT",
      body,
      headers: {
        Authorization: `Bearer ${link.manageKey}`,
        "If-Match": current.etag,
      },
    })
  ).json();
  assert.equal(updated.url, link.url);
  assert.equal(updated.revision, 2);

  console.log(
    "Backing up PostgreSQL and uploads, then restoring into a fresh instance.",
  );
  await compose(p, ["stop", "web", "maintenance"]);
  const dump = composeInput(p, [
    "exec",
    "-T",
    "db",
    "pg_dump",
    "-U",
    "hstore",
    "-d",
    "hstore",
    "-Fc",
  ]);
  const uploads = composeInput(p, [
    "run",
    "--rm",
    "--no-deps",
    "-T",
    "--user",
    "root",
    "--entrypoint",
    "tar",
    "web",
    "-C",
    "/app/data/uploads",
    "-czf",
    "-",
    ".",
  ]);
  const restoredDir = path.join(work, "restored");
  await mkdir(restoredDir);
  await run("tar", [
    "-xzf",
    path.join(work, `htmlinks-${version}.tar.gz`),
    "--strip-components=1",
    "-C",
    restoredDir,
  ]);
  const restored = project(
    restoredDir,
    `htmlinks-restore-${id}`,
    await freePort(),
  );
  await writeFile(
    path.join(restoredDir, ".env"),
    initial
      .replaceAll(p.origin, restored.origin)
      .replace(`HTMLINKS_PORT=${p.port}`, `HTMLINKS_PORT=${restored.port}`),
    { mode: 0o600 },
  );
  await compose(restored, ["up", "-d", "--wait", "--wait-timeout", "90", "db"]);
  composeInput(
    restored,
    [
      "exec",
      "-T",
      "db",
      "pg_restore",
      "-U",
      "hstore",
      "-d",
      "hstore",
      "--no-owner",
    ],
    dump,
  );
  composeInput(
    restored,
    [
      "run",
      "--rm",
      "--no-deps",
      "-T",
      "--user",
      "root",
      "--entrypoint",
      "tar",
      "web",
      "-C",
      "/app/data/uploads",
      "-xzf",
      "-",
    ],
    uploads,
  );
  await compose(restored, ["up", "-d", "--wait", "--wait-timeout", "120"]);
  await verifyDocuments(restored, link, protectedDoc);
  assert.match(
    await (await request(restored, `${new URL(link.url).pathname}/raw`)).text(),
    /document updated/,
  );
  const restoredHtml = await (await request(restored, "/")).text();
  assert.ok(restoredHtml.includes(restored.origin));
  assert.ok(!restoredHtml.includes(p.origin));

  console.log(
    "Running maintenance and verifying migration failure blocks startup.",
  );
  assert.match(
    await compose(p, [
      "run",
      "--rm",
      "--no-deps",
      "-T",
      "maintenance",
      "node",
      "scripts/maintenance.mjs",
    ]),
    /Maintenance complete/,
  );
  await compose(p, ["down"]);
  const badSql = path.join(work, "broken.sql");
  await writeFile(badSql, "THIS IS INTENTIONALLY INVALID SQL;\n");
  const override = path.join(work, "failure.yaml");
  await writeFile(
    override,
    JSON.stringify({
      services: {
        migrate: {
          volumes: [`${badSql}:/app/migrations/999_docker_failure.sql:ro`],
        },
      },
    }),
  );
  await assert.rejects(
    compose(p, ["up", "-d", "--wait", "--wait-timeout", "60"], [override]),
  );
  for (const role of ["web", "maintenance"]) {
    const running = await compose(p, ["ps", "--status", "running", "-q", role]);
    assert.equal(
      running.trim(),
      "",
      `${role} must remain stopped after migration failure`,
    );
  }
  const migration = (await compose(p, ["ps", "-a", "-q", "migrate"])).trim();
  assert.ok(migration);
  assert.notEqual(
    (
      await run("docker", [
        "inspect",
        "--format",
        "{{.State.ExitCode}}",
        migration,
      ])
    ).trim(),
    "0",
  );
  console.log(
    "Docker checks passed: bundle, initialization, publishing, passwords, persistence, upgrade/recreation, restore, runtime origin, maintenance, and migration failure.",
  );
} catch (error) {
  for (const p of projects) {
    console.error(
      await compose(p, ["logs", "--no-color", "--tail", "60"]).catch(
        () => "Unable to read container logs.",
      ),
    );
  }
  throw error;
} finally {
  for (const p of projects.reverse())
    await compose(p, ["down", "--volumes", "--remove-orphans"]).catch(() => {});
  await rm(work, { recursive: true, force: true });
}
