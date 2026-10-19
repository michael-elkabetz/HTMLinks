import "server-only";
export function config() {
  const app = new URL(process.env.APP_URL || "http://localhost:3000");
  if (
    app.username ||
    app.password ||
    app.pathname !== "/" ||
    app.search ||
    app.hash
  )
    throw new Error("Configure APP_URL without paths or credentials.");
  if (
    app.protocol !== "https:" &&
    !(
      app.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
    )
  )
    throw new Error("Non-loopback origins require HTTPS.");
  return {
    app: app.origin,
    maxBytes: Math.min(
      Number(process.env.MAX_UPLOAD_BYTES) || 10485760,
      10485760,
    ),
    storage: process.env.STORAGE_DRIVER || "filesystem",
  };
}
