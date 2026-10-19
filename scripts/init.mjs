import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { url: { type: "string" }, image: { type: "string" } },
});
const app = new URL(values.url || "http://localhost:3000");
if (
  app.username ||
  app.password ||
  app.pathname !== "/" ||
  app.search ||
  app.hash ||
  (app.protocol !== "https:" &&
    !(
      app.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
    ))
)
  throw new Error("Use an HTTPS origin, or HTTP on localhost, without a path.");
if (values.image && !/^[a-z0-9][a-z0-9./:@_-]*$/.test(values.image))
  throw new Error("Invalid image reference.");
const random = () => randomBytes(32).toString("base64url");
const dbPassword = random();
const content = [
  "# Generated locally. Never commit this file.",
  ...(values.image ? [`HTMLINKS_IMAGE=${values.image}`] : []),
  `POSTGRES_PASSWORD=${dbPassword}`,
  `DATABASE_URL=postgres://hstore:${dbPassword}@localhost:5439/hstore`,
  `HTMLINKS_SECRET=${random()}`,
  `APP_URL=${app.origin}`,
  ...(app.protocol === "http:" && app.port
    ? [`HTMLINKS_PORT=${app.port}`]
    : []),
  "STORAGE_DRIVER=filesystem",
  "STORAGE_PATH=./data/uploads",
  "MAX_UPLOAD_BYTES=10485760",
  "RETENTION_DAYS=7",
  "",
].join("\n");
try {
  await writeFile(".env", content, { flag: "wx", mode: 0o600 });
  console.log(
    "Created .env with unique secrets. Run docker compose up -d --wait, then install the skill from the landing page.",
  );
} catch (error) {
  if (error.code === "EEXIST")
    console.log(".env already exists; nothing changed.");
  else throw error;
}
