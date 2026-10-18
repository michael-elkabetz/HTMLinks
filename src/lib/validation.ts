import { z } from "zod";
export const metadata = z
  .object({
    title: z.string().trim().min(1).max(160),
    category: z
      .enum(["design", "presentation", "technical", "report", "other"])
      .default("design"),
    access: z.enum(["private", "link", "password"]).default("link"),
    password: z.string().min(8).max(256).optional(),
    expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
  })
  .strict();
export const patchMetadata = metadata
  .extend({
    category: metadata.shape.category.removeDefault(),
    access: metadata.shape.access.removeDefault(),
  })
  .partial()
  .strict();
export function htmlFile(name: string, bytes: Uint8Array) {
  if (!/\.html?$/i.test(name)) return "Upload an .html or .htm file.";
  if (!bytes.length || bytes.includes(0))
    return "Expected a nonempty UTF-8 HTML document.";
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return "HTML must use UTF-8 encoding.";
  }
  if (
    !/<(?:!doctype\s+html|html|head|body|main|section|div|h1)(?:\s|>)/i.test(
      text,
    )
  )
    return "The file does not appear to contain HTML.";
  return null;
}
