import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
const children = [];
function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) =>
      code ? reject(new Error(`${script} exited with ${code}`)) : resolve(),
    );
  });
}
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server did not start: ${url}`);
}
try {
  await run("scripts/prepare-test.mjs");
  children.push(
    spawn(process.execPath, ["scripts/test-server.mjs"], {
      stdio: "inherit",
      env: process.env,
    }),
  );
  await ready("http://localhost:4310/api/health");
  await run("scripts/integration.mjs");
  await run("scripts/shared-viewer.integration.mjs");
} finally {
  for (const child of children) child.kill("SIGTERM");
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise((r) => child.once("exit", r)),
    ),
  );
  if (!process.argv.includes("--keep-database")) {
    const state = JSON.parse(
      await readFile("data/test-state.json", "utf8").catch(() => "null"),
    );
    if (state) {
      const u = new URL(state.database),
        name = u.pathname.slice(1);
      if (
        /^htmlinks_test_[a-f0-9]{12}$/.test(name) &&
        ["localhost", "127.0.0.1"].includes(u.hostname)
      ) {
        u.pathname = "/postgres";
        const sql = postgres(u.href, { max: 1 });
        try {
          await sql.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
        } finally {
          await sql.end();
        }
      }
    }
  }
}
