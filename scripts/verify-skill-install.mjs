import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const repository = fileURLToPath(new URL("../", import.meta.url));
const directory = await mkdtemp(
  path.join(tmpdir(), "htmlinks-skills-install-"),
);
const env = {
  ...process.env,
  DISABLE_TELEMETRY: "1",
  HTMLINKS_CONFIG_DIR: path.join(directory, "preferences"),
};
delete env.HTMLINKS_URL;
delete env.HTMLINKS_MANAGEMENT_KEY;
delete env.HSTORE_URL;
delete env.HSTORE_MANAGEMENT_KEY;
delete env.HSTORE_CONFIG_DIR;
const options = { cwd: directory, env, timeout: 120000, maxBuffer: 2097152 };
const install = [
  "--yes",
  "skills@1.7.2",
  "add",
  repository,
  "--skill",
  "htmlinks",
  "--agent",
  "codex",
  "claude-code",
  "--yes",
  "--copy",
];
try {
  const listed = await run(
    "npx",
    ["--yes", "skills@1.7.2", "add", repository, "--list"],
    options,
  );
  assert.match(listed.stdout, /htmlinks/);
  await run("npx", install, options);
  const source = await readFile(
    path.join(repository, "skills/htmlinks/scripts/htmlinks.mjs"),
    "utf8",
  );
  for (const relative of [
    ".agents/skills/htmlinks",
    ".claude/skills/htmlinks",
  ]) {
    const skill = path.join(directory, relative);
    assert.match(
      await readFile(path.join(skill, "SKILL.md"), "utf8"),
      /name: htmlinks/,
    );
    const helper = path.join(skill, "scripts/htmlinks.mjs");
    assert.equal(await readFile(helper, "utf8"), source);
    const status = JSON.parse(
      (await run(process.execPath, [helper, "config"], options)).stdout,
    );
    assert.equal(status.configured, false);
  }
  const helper = path.join(
    directory,
    ".agents/skills/htmlinks/scripts/htmlinks.mjs",
  );
  await run(
    process.execPath,
    [
      helper,
      "config",
      "--hosting",
      "self-hosted",
      "--url",
      "https://docs.example.org",
    ],
    options,
  );
  await run("npx", install, options);
  const remembered = JSON.parse(
    (await run(process.execPath, [helper, "config"], options)).stdout,
  );
  assert.equal(remembered.hosting, "self-hosted");
  assert.equal(remembered.url, "https://docs.example.org");
  console.log(
    "Skills CLI discovery and installation passed for Codex and Claude Code. Helper files are complete; reinstall preserves the hosting choice.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
