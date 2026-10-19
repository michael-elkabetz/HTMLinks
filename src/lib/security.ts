import {
  createHash,
  randomBytes,
  timingSafeEqual,
  createHmac,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
export function secret() {
  return randomBytes(32).toString("base64url");
}
export function digest(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export const artifactCsp =
  "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
export function etag(version: number) {
  return `"${version}"`;
}
export function precondition(value: string | null, version: number) {
  if (!value) return 428;
  return value === etag(version) ? 0 : 412;
}

function encryptionKey() {
  const instanceSecret =
    process.env.HTMLINKS_SECRET || process.env.HSTORE_SECRET;
  if (!instanceSecret || instanceSecret.length < 32)
    throw new Error(
      "HTMLINKS_SECRET must contain at least 32 random characters.",
    );
  return createHash("sha256").update(instanceSecret).digest();
}
export function seal(value: unknown) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64url");
}
export function unseal(value: string) {
  const bytes = Buffer.from(value, "base64url"),
    decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      bytes.subarray(0, 12),
    );
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  );
}

export function requestFingerprint(value: string) {
  return createHmac("sha256", encryptionKey()).update(value).digest("hex");
}
