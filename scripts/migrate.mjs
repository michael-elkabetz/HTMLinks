import postgres from "postgres";
import { readFile, readdir } from "node:fs/promises";
const sql = postgres(
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  { max: 1, prepare: false },
);
try {
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(749218305)`;
    await tx`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'hstore') THEN
        IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'htmlinks') THEN
          RAISE EXCEPTION 'Both legacy and HTMLinks schemas exist; reconcile them before migrating';
        END IF;
        ALTER SCHEMA hstore RENAME TO htmlinks;
      END IF;
    END $$`;
    await tx`CREATE SCHEMA IF NOT EXISTS htmlinks`;
    await tx`CREATE TABLE IF NOT EXISTS htmlinks.migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
    for (const name of (await readdir("migrations"))
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      if (
        (await tx`SELECT 1 FROM htmlinks.migrations WHERE name=${name}`).length
      )
        continue;
      await tx.unsafe(await readFile(`migrations/${name}`, "utf8"));
      await tx`INSERT INTO htmlinks.migrations(name) VALUES (${name})`;
      console.log(`Applied ${name}`);
    }
  });
} finally {
  await sql.end();
}
