import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const state = JSON.parse(await readFile("data/test-state.json", "utf8"));
const port = "4310";
const env = {
  ...process.env,
  DATABASE_URL: state.database,
  HTMLINKS_SECRET: state.instanceSecret,
  APP_URL: "http://localhost:4310",
  STORAGE_PATH: "./data/test-uploads",
  STORAGE_DRIVER: "filesystem",
};
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--port", port],
  { env, stdio: "inherit" },
);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code || 0));
