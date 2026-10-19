import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("package-deployment.mjs", import.meta.url),
);
test("release bundle contains only deployment files pinned to the release image", async () => {
  const output = await mkdtemp(path.join(tmpdir(), "htmlinks-package-"));
  try {
    const { version } = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    );
    const release = `${version}-rc.1`;
    execFileSync(process.execPath, [
      script,
      "--version",
      `v${release}`,
      "--output",
      output,
    ]);
    const filename = `htmlinks-${release}.tar.gz`;
    const archive = path.join(output, filename);
    execFileSync("tar", ["-xzf", archive, "-C", output]);
    const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
      .trim()
      .split("\n");
    assert.deepEqual(
      entries.sort(),
      [
        "htmlinks/",
        "htmlinks/.env.example",
        "htmlinks/LICENSE",
        "htmlinks/README.md",
        "htmlinks/compose.cloud.yaml",
        "htmlinks/compose.yaml",
        "htmlinks/setup.sh",
      ].sort(),
    );
    for (const file of [
      "compose.yaml",
      "compose.cloud.yaml",
      ".env.example",
      "setup.sh",
    ])
      assert.ok(
        (await readFile(path.join(output, "htmlinks", file), "utf8")).includes(
          `ghcr.io/michael-elkabetz/htmlinks:${release}`,
        ),
      );
    const hash = createHash("sha256")
      .update(await readFile(archive))
      .digest("hex");
    assert.equal(
      await readFile(path.join(output, "SHA256SUMS"), "utf8"),
      `${hash}  ${filename}\n`,
    );
    assert.notEqual(
      spawnSync(process.execPath, [
        script,
        "--version",
        "9.9.9",
        "--output",
        output,
      ]).status,
      0,
    );
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
