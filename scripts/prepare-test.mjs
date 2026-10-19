import postgres from "postgres";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error(
    "Integration preparation only runs against a loopback PostgreSQL instance.",
  );
const database = `htmlinks_test_${randomBytes(6).toString("hex")}`;
const sql = postgres(url.href, { max: 1 });
await sql.unsafe(`CREATE DATABASE ${database}`);
await sql.end();
url.pathname = `/${database}`;
const state = {
  database: url.href,
  instanceSecret: randomBytes(32).toString("base64url"),
};
await mkdir("data", { recursive: true });
await writeFile("data/test-state.json", JSON.stringify(state), { mode: 0o600 });
function migrate() {
  const result = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
    env: {
      ...process.env,
      MIGRATION_DATABASE_URL: state.database,
      DATABASE_URL: state.database,
    },
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("Integration migration failed");
}
migrate();
const check = postgres(state.database, { max: 1 });
try {
  const [before] =
    await check`SELECT applied_at FROM htmlinks.migrations WHERE name='001_initial.sql'`;
  await check`UPDATE htmlinks.workspaces SET used_bytes=137`;
  await check`ALTER SCHEMA htmlinks RENAME TO hstore`;
  migrate();
  const [after] =
    await check`SELECT applied_at FROM htmlinks.migrations WHERE name='001_initial.sql'`;
  const [workspace] = await check`SELECT used_bytes FROM htmlinks.workspaces`;
  assert.equal(after.applied_at.toISOString(), before.applied_at.toISOString());
  assert.equal(Number(workspace.used_bytes), 137);
  await check`UPDATE htmlinks.workspaces SET used_bytes=0`;
  migrate();
} finally {
  await check.end();
}
console.log(
  "Disposable database prepared; legacy schema upgrade preserves data and migration history.",
);
