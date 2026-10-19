#!/usr/bin/env node
import { readFile, writeFile, mkdir, rename, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
const DEFAULT_URL = "https://www.htmlinks.com";
const MANAGED_URL = "https://www.htmlinks.com";
const args = process.argv.slice(2),
  command = args.shift(),
  flags = {},
  positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    flags[key] = key === "password-stdin" ? true : args[++i];
    if (flags[key] === undefined) throw new Error(`Missing value for --${key}`);
  } else positional.push(args[i]);
}
async function main() {
  if (!command || ["help", "--help"].includes(command)) {
    console.log(
      `HTMLinks · No account or API key needed. Requires Node.js 22.22+.\n\nCommands:\n config [--hosting managed|self-hosted] [--url https://your-server]\n upload <file.html> [--title text] [--access link|password] [--password-stdin]\n get <id>\n list\n update <id> <file.html>\n edit <id> --title text\n access <id> --mode link|password [--password-stdin]\n revisions <id>\n rollback <id> --revision <revision-id>\n delete <id>\n restore <id>\n\nChoose your hosting on first use; the choice is remembered locally.\nHTMLINKS_URL overrides that choice for one invocation without changing it.\nOptional: --if-match '\"version\"', --idempotency-key <random-key>.\nManagement keys are saved locally and never printed. HTMLINKS_MANAGEMENT_KEY can\nsupply a key for a selected document. Passwords use --password-stdin, never arguments.`,
    );
    return;
  }
  const overrideUrl = process.env.HTMLINKS_URL || process.env.HSTORE_URL;
  const currentRoot = path.join(os.homedir(), ".config", "htmlinks");
  const legacyRoot = path.join(os.homedir(), ".config", "hstore");
  async function exists(directory) {
    try {
      await access(directory);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
  }
  const root =
    process.env.HTMLINKS_CONFIG_DIR ||
    process.env.HSTORE_CONFIG_DIR ||
    ((await exists(currentRoot)) || !(await exists(legacyRoot))
      ? currentRoot
      : legacyRoot);
  const settingsFile = path.join(root, "settings.json");
  function origin(value) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error("Supply a valid HTMLinks server origin.");
    }
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    )
      throw new Error(
        "The server URL must be a bare origin without credentials, a path, or query.",
      );
    if (
      parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
      )
    )
      throw new Error("HTTPS is required except on loopback.");
    return parsed.origin;
  }
  let settings;
  try {
    settings = JSON.parse(await readFile(settingsFile, "utf8"));
    if (!["managed", "self-hosted"].includes(settings.hosting))
      throw new Error(
        "Invalid HTMLinks hosting setting. Run config --hosting again.",
      );
    settings.url = origin(settings.url);
  } catch (error) {
    if (error.code !== "ENOENT" && !(command === "config" && flags.hosting))
      throw error;
  }
  async function configure(hosting, url) {
    if (!["managed", "self-hosted"].includes(hosting))
      throw new Error("Choose --hosting managed or self-hosted.");
    if (hosting === "self-hosted" && !url)
      throw new Error("Self-hosting requires --url with your server origin.");
    const next = { hosting, url: origin(url || MANAGED_URL) };
    await mkdir(root, { recursive: true, mode: 0o700 });
    const temp = path.join(root, `.${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(next), { mode: 0o600, flag: "wx" });
    await rename(temp, settingsFile);
    settings = next;
  }
  if (command === "config") {
    if (flags.hosting) await configure(flags.hosting, flags.url);
    else if (flags.url)
      throw new Error("Choose --hosting managed or self-hosted with --url.");
    console.log(
      JSON.stringify(
        {
          configured: !!settings,
          ...(settings || {}),
          managedUrl: origin(MANAGED_URL),
          installedFrom: origin(DEFAULT_URL),
          ...(overrideUrl ? { overrideUrl: origin(overrideUrl) } : {}),
        },
        null,
        2,
      ),
    );
    return;
  }
  if (!overrideUrl && !settings) {
    if (
      !process.stdin.isTTY ||
      !process.stdout.isTTY ||
      flags["password-stdin"]
    )
      throw new Error(
        "Choose hosting before uploading. Ask the user: free managed hosting or their own HTMLinks server? Then run config --hosting managed, or config --hosting self-hosted --url https://their-server. The choice is remembered.",
      );
    const { createInterface } = await import("node:readline/promises");
    const terminal = createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    try {
      const choice = (
        await terminal.question(
          `Where should HTMLinks upload?\n1. Managed (${origin(MANAGED_URL)})\n2. Self-hosted\nChoose 1 or 2: `,
        )
      ).trim();
      if (choice === "1") await configure("managed");
      else if (choice === "2")
        await configure(
          "self-hosted",
          (
            await terminal.question(
              `Your server origin (installed from ${origin(DEFAULT_URL)}): `,
            )
          ).trim(),
        );
      else throw new Error("Choose 1 or 2. No file was uploaded.");
    } finally {
      terminal.close();
    }
  }
  const base = new URL(origin(overrideUrl || settings.url));
  const directory = path.join(
    root,
    createHash("sha256").update(base.origin).digest("hex").slice(0, 24),
  );
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const id = positional[0],
    validId = /^[a-f\d-]{36}$/i;
  async function saved(documentId) {
    try {
      return JSON.parse(
        await readFile(path.join(directory, `${documentId}.json`), "utf8"),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      return null;
    }
  }
  async function save(doc, key) {
    if (!validId.test(doc.id || "") || !/^hsm_[\w-]{43}$/.test(key || ""))
      throw new Error("Server returned invalid document credentials.");
    const temp = path.join(directory, `.${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify({ ...doc, manageKey: key }), {
      mode: 0o600,
      flag: "wx",
    });
    await rename(temp, path.join(directory, `${doc.id}.json`));
  }
  if (command === "list") {
    const { readdir } = await import("node:fs/promises");
    const docs = [];
    for (const file of await readdir(directory)) {
      if (validId.test(file.replace(".json", ""))) {
        const { manageKey, ...doc } = JSON.parse(
          await readFile(path.join(directory, file), "utf8"),
        );
        void manageKey;
        docs.push(doc);
      }
    }
    console.log(JSON.stringify({ documents: docs }, null, 2));
    return;
  }
  const headers = {};
  let endpoint = "/api/v1/documents",
    method = "GET",
    body,
    key;
  const known = [
    "upload",
    "get",
    "update",
    "edit",
    "access",
    "revisions",
    "rollback",
    "delete",
    "restore",
  ];
  if (!known.includes(command)) throw new Error("Unknown command. Run help.");
  if (command !== "upload") {
    if (!validId.test(id || "")) throw new Error("Supply a document UUID.");
    key =
      process.env.HTMLINKS_MANAGEMENT_KEY ||
      process.env.HSTORE_MANAGEMENT_KEY ||
      (await saved(id))?.manageKey;
    if (!key)
      throw new Error(
        "This document’s management key is not stored locally. Use the original machine or configure HTMLINKS_MANAGEMENT_KEY securely.",
      );
    headers.Authorization = `Bearer ${key}`;
    endpoint += `/${id}`;
  }
  async function fetchJson(url, init = {}) {
    const response = await fetch(new URL(url, base), {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(60000),
    });
    const value = await response.json();
    if (!response.ok)
      throw new Error(
        `${response.status}: ${value.error?.message || "Request failed."}`,
      );
    return value;
  }
  if (
    ["update", "edit", "access", "rollback", "delete", "restore"].includes(
      command,
    )
  ) {
    let current;
    if (command === "restore") current = await saved(id);
    else current = await fetchJson(endpoint, { headers });
    headers["If-Match"] = flags["if-match"] || current?.etag;
    if (!headers["If-Match"])
      throw new Error("Supply --if-match with the document ETag.");
  }
  let password;
  if (flags["password-stdin"]) {
    const chunks = [];
    let n = 0;
    for await (const chunk of process.stdin) {
      n += chunk.length;
      if (n > 1024) throw new Error("Password input is too long.");
      chunks.push(chunk);
    }
    password = Buffer.concat(chunks)
      .toString("utf8")
      .replace(/\r?\n$/, "");
    if (password.length < 8 || password.length > 256)
      throw new Error("Passwords must be 8–256 characters.");
  }
  if (command === "upload" || command === "update") {
    const file = positional[command === "upload" ? 0 : 1];
    if (!file || !/\.html?$/i.test(file))
      throw new Error("Supply a self-contained .html or .htm file.");
    const bytes = await readFile(file);
    if (!bytes.length || bytes.length > 10485760)
      throw new Error("Files must be nonempty and at most 10 MiB.");
    body = new FormData();
    body.set(
      "file",
      new File([bytes], path.basename(file), { type: "text/html" }),
    );
    if (command === "upload") {
      const access = flags.access || (password ? "password" : "link");
      if (access === "password" && !password)
        throw new Error("Use --password-stdin to protect an upload.");
      body.set(
        "metadata",
        JSON.stringify({
          title: flags.title || path.basename(file).replace(/\.html?$/i, ""),
          category: flags.category || "design",
          access,
          ...(password ? { password } : {}),
        }),
      );
      method = "POST";
    } else {
      method = "PUT";
      endpoint += "/content";
    }
    headers["Idempotency-Key"] = flags["idempotency-key"] || randomUUID();
  } else if (command === "access") {
    if (!["link", "password"].includes(flags.mode))
      throw new Error("Choose --mode link or password.");
    if (flags.mode === "password" && !password)
      throw new Error("Use --password-stdin to set or change the password.");
    method = "PATCH";
    body = { access: flags.mode, ...(password ? { password } : {}) };
  } else if (command === "edit") {
    if (!flags.title) throw new Error("Supply --title.");
    method = "PATCH";
    body = { title: flags.title };
  } else if (command === "revisions") {
    endpoint += "/revisions";
  } else if (command === "rollback") {
    if (!flags.revision) throw new Error("Supply --revision.");
    method = "POST";
    endpoint += "/rollback";
    body = { revisionId: flags.revision };
  } else if (command === "delete") method = "DELETE";
  else if (command === "restore") {
    method = "POST";
    endpoint += "/restore";
  }
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const response = await fetchJson(endpoint, { method, headers, body });
  if (response.id) await save(response, response.manageKey || key);
  const { manageKey, ...result } = response;
  void manageKey;
  console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => {
  console.error(error.message || "Request failed.");
  process.exitCode = 1;
});
