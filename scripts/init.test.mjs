import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("init.mjs", import.meta.url));
test("initialization creates private, unique secrets and preserves existing settings", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "htmlinks-init-"));
  try {
    execFileSync(
      process.execPath,
      [script, "--url", "http://localhost:3888", "--image", "htmlinks:test"],
      { cwd },
    );
    const initial = await readFile(path.join(cwd, ".env"), "utf8");
    const env = Object.fromEntries(
      initial
        .split("\n")
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    );
    assert.equal(env.APP_URL, "http://localhost:3888");
    assert.equal(env.HTMLINKS_PORT, "3888");
    assert.equal(env.HTMLINKS_IMAGE, "htmlinks:test");
    assert.match(env.HTMLINKS_SECRET, /^[\w-]{43}$/);
    assert.match(env.POSTGRES_PASSWORD, /^[\w-]{43}$/);
    assert.notEqual(env.HTMLINKS_SECRET, env.POSTGRES_PASSWORD);
    assert.equal(new URL(env.DATABASE_URL).password, env.POSTGRES_PASSWORD);
    if (process.platform !== "win32")
      assert.equal((await stat(path.join(cwd, ".env"))).mode & 0o777, 0o600);
    execFileSync(
      process.execPath,
      [script, "--url", "https://changed.example"],
      { cwd },
    );
    assert.equal(await readFile(path.join(cwd, ".env"), "utf8"), initial);
    await rm(path.join(cwd, ".env"));
    execFileSync(process.execPath, [script], { cwd });
    assert.ok(
      !(await readFile(path.join(cwd, ".env"), "utf8")).includes(
        env.HTMLINKS_SECRET,
      ),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("initialization rejects unsafe origins and configuration injection without creating files", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "htmlinks-init-"));
  try {
    for (const args of [
      ["--url", "http://public.example"],
      ["--url", "https://user:password@example.com"],
      ["--url", "https://example.com/path"],
      ["--url", "https://example.com?query=1"],
      ["--image", "htmlinks:test\nHTMLINKS_SECRET=injected"],
    ]) {
      assert.notEqual(
        spawnSync(process.execPath, [script, ...args], { cwd }).status,
        0,
      );
      await assert.rejects(stat(path.join(cwd, ".env")), { code: "ENOENT" });
    }
    await writeFile(path.join(cwd, ".env"), "existing");
    execFileSync(process.execPath, [script], { cwd });
    assert.equal(await readFile(path.join(cwd, ".env"), "utf8"), "existing");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
