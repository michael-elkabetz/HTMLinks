import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: { version: { type: "string" }, output: { type: "string" } },
});
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = (values.version || pkg.version).replace(/^v/, "");
if (
  !/^\d+\.\d+\.\d+(?:-[0-9a-z-]+(?:\.[0-9a-z-]+)*)?$/.test(version) ||
  version.split("-")[0] !== pkg.version
)
  throw new Error(
    "Release version must match package.json (an optional prerelease suffix is allowed).",
  );
const image = `ghcr.io/michael-elkabetz/htmlinks:${version}`;
const output = path.resolve(values.output || path.join(root, "release"));
const stage = await mkdtemp(path.join(tmpdir(), "htmlinks-bundle-"));
try {
  const folder = path.join(stage, "htmlinks");
  await mkdir(folder);
  for (const name of [
    "compose.yaml",
    "compose.cloud.yaml",
    ".env.example",
    "setup.sh",
  ]) {
    const source = await readFile(path.join(root, name), "utf8");
    const defaultImage = `ghcr.io/michael-elkabetz/htmlinks:${pkg.version}`;
    if (!source.includes(defaultImage))
      throw new Error(
        `Update the default image in ${name} to match package.json.`,
      );
    const content = source.replaceAll(defaultImage, image);
    await writeFile(path.join(folder, name), content);
  }
  await copyFile(
    path.join(root, "deploy/README.md"),
    path.join(folder, "README.md"),
  );
  await copyFile(path.join(root, "LICENSE"), path.join(folder, "LICENSE"));
  await mkdir(output, { recursive: true });
  const filename = `htmlinks-${version}.tar.gz`;
  const archive = path.join(output, filename);
  execFileSync("tar", ["-czf", archive, "-C", stage, "htmlinks"]);
  const hash = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  await writeFile(path.join(output, "SHA256SUMS"), `${hash}  ${filename}\n`);
  console.log(`Created ${archive} (${image})`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
