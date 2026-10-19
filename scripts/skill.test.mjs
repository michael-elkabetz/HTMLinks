import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";
const helper = path.resolve("skills/htmlinks/scripts/htmlinks.mjs");
function cli(directory, args, input = "", extra = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, HTMLINKS_CONFIG_DIR: directory };
    delete env.HTMLINKS_URL;
    delete env.HTMLINKS_MANAGEMENT_KEY;
    delete env.HSTORE_CONFIG_DIR;
    delete env.HSTORE_URL;
    delete env.HSTORE_MANAGEMENT_KEY;
    const child = spawn(process.execPath, [helper, ...args], {
      env: { ...env, ...extra },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (value) => (stdout += value));
    child.stderr.on("data", (value) => (stderr += value));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}
test("first use requires a destination; preference persists and invalid origins do not replace it", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "htmlinks-choice-"));
  try {
    const initial = await cli(directory, ["config"]);
    assert.equal(JSON.parse(initial.stdout).configured, false);
    assert.equal(
      JSON.parse(initial.stdout).managedUrl,
      "https://www.htmlinks.com",
    );
    const blocked = await cli(directory, ["upload", "missing.html"]);
    assert.equal(blocked.code, 1);
    assert.match(blocked.stderr, /Choose hosting/);
    assert.equal(
      (
        await cli(directory, [
          "config",
          "--hosting",
          "self-hosted",
          "--url",
          "https://docs.example.org",
        ])
      ).code,
      0,
    );
    const remembered = JSON.parse((await cli(directory, ["config"])).stdout);
    assert.equal(remembered.url, "https://docs.example.org");
    assert.equal(remembered.hosting, "self-hosted");
    assert.equal(
      (await stat(path.join(directory, "settings.json"))).mode & 0o777,
      0o600,
    );
    for (const url of [
      "http://remote.example.org",
      "https://docs.example.org/subpath",
      "https://user:password@docs.example.org",
      "https://docs.example.org/?token=secret",
    ]) {
      assert.equal(
        (
          await cli(directory, [
            "config",
            "--hosting",
            "self-hosted",
            "--url",
            url,
          ])
        ).code,
        1,
      );
    }
    assert.equal(
      JSON.parse((await cli(directory, ["config"])).stdout).url,
      remembered.url,
    );
    assert.equal(
      (await cli(directory, ["config", "--hosting", "managed"])).code,
      0,
    );
    assert.equal(
      JSON.parse((await cli(directory, ["config"])).stdout).hosting,
      "managed",
    );
    assert.equal(
      JSON.parse((await cli(directory, ["config"])).stdout).url,
      "https://www.htmlinks.com",
    );
    await writeFile(path.join(directory, "settings.json"), "invalid-json");
    assert.equal((await cli(directory, ["upload", "missing.html"])).code, 1);
    assert.equal(
      (
        await cli(directory, [
          "config",
          "--hosting",
          "self-hosted",
          "--url",
          "https://restored.example.org",
        ])
      ).code,
      0,
    );
    assert.equal(
      JSON.parse((await cli(directory, ["config"])).stdout).url,
      "https://restored.example.org",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test("remembered self-host receives password upload; override stays temporary and keys stay private", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "htmlinks-upload-"));
  const received = [];
  const id = "12345678-1234-1234-1234-123456789abc";
  const key = "hsm_" + "a".repeat(43);
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const part of req) chunks.push(part);
    received.push({
      method: req.method,
      body: Buffer.concat(chunks).toString(),
    });
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id,
        url: "https://app.example.org/rendered/demo",
        access: "password",
        revision: 1,
        etag: '"1"',
        manageKey: key,
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await cli(directory, ["config", "--hosting", "self-hosted", "--url", url]);
    const file = path.join(directory, "design.html");
    await writeFile(file, "<!doctype html><h1>Chosen artifact</h1>");
    const noPassword = await cli(directory, [
      "upload",
      file,
      "--access",
      "password",
    ]);
    assert.equal(noPassword.code, 1);
    assert.equal(received.length, 0);
    const result = await cli(
      directory,
      ["upload", file, "--access", "password", "--password-stdin"],
      "test-only-password\n",
    );
    assert.equal(result.code, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).access, "password");
    assert.match(received[0].body, /"access":"password"/);
    assert.match(received[0].body, /"password":"test-only-password"/);
    assert.ok(!result.stdout.includes(key));
    assert.ok(!result.stdout.includes("test-only-password"));
    const listed = await cli(directory, ["list"]);
    assert.ok(!listed.stdout.includes(key));
    assert.equal(JSON.parse(listed.stdout).documents[0].id, id);
    const override = JSON.parse(
      (
        await cli(directory, ["config"], "", {
          HTMLINKS_URL: "https://alternate.example.org",
        })
      ).stdout,
    );
    assert.equal(override.overrideUrl, "https://alternate.example.org");
    assert.equal(override.url, url);
    const saved = JSON.parse(
      await readFile(path.join(directory, "settings.json"), "utf8"),
    );
    assert.equal(saved.url, url);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test("legacy destination and saved document keys survive the rebrand", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "htmlinks-legacy-"));
  const legacy = path.join(home, ".config", "hstore");
  const url = "https://existing.example.org";
  const { createHash } = await import("node:crypto");
  const origin = createHash("sha256").update(url).digest("hex").slice(0, 24);
  const id = "12345678-1234-1234-1234-123456789abc";
  const key = "hsm_" + "b".repeat(43);
  try {
    await mkdir(path.join(legacy, origin), { recursive: true });
    await writeFile(
      path.join(legacy, "settings.json"),
      JSON.stringify({ hosting: "self-hosted", url }),
    );
    await writeFile(
      path.join(legacy, origin, `${id}.json`),
      JSON.stringify({ id, title: "Existing doc", manageKey: key }),
    );
    const env = { HOME: home, HTMLINKS_CONFIG_DIR: undefined };
    const config = await cli(undefined, ["config"], "", env);
    assert.equal(config.code, 0, config.stderr);
    assert.equal(JSON.parse(config.stdout).url, url);
    const list = await cli(undefined, ["list"], "", env);
    assert.equal(list.code, 0, list.stderr);
    assert.equal(JSON.parse(list.stdout).documents[0].id, id);
    assert.ok(!list.stdout.includes(key));
    const legacyEnv = await cli(undefined, ["config"], "", {
      ...env,
      HSTORE_CONFIG_DIR: legacy,
      HSTORE_URL: "https://legacy-override.example.org",
    });
    assert.equal(
      JSON.parse(legacyEnv.stdout).overrideUrl,
      "https://legacy-override.example.org",
    );
    const modernEnv = await cli(legacy, ["config"], "", {
      HTMLINKS_URL: "https://new-override.example.org",
      HSTORE_URL: "https://legacy-override.example.org",
    });
    assert.equal(
      JSON.parse(modernEnv.stdout).overrideUrl,
      "https://new-override.example.org",
    );
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
