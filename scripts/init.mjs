import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const random = () => randomBytes(32).toString("base64url"),
  dbPassword = random();
const content = `# Generated locally. Never commit this file.\nPOSTGRES_PASSWORD=${dbPassword}\nDATABASE_URL=postgres://hstore:${dbPassword}@localhost:5439/hstore\nHTMLINKS_SECRET=${random()}\nAPP_URL=http://localhost:3000\nSTORAGE_DRIVER=filesystem\nSTORAGE_PATH=./data/uploads\nMAX_UPLOAD_BYTES=10485760\nRETENTION_DAYS=7\n`;
try {
  await writeFile(".env", content, { flag: "wx", mode: 0o600 });
  console.log(
    "Created .env with unique secrets. Start Docker Compose and install the skill from the landing page. No account setup is needed.",
  );
} catch (error) {
  if (error.code === "EEXIST")
    console.log(".env already exists; nothing changed.");
  else throw error;
}
