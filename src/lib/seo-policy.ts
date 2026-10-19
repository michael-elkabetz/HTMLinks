export function publicIndexingAllowed(origin: string, setting?: string) {
  const url = new URL(origin);
  if (url.protocol !== "https:") return false;
  if (setting === "0") return false;
  return (
    setting === "1" ||
    url.hostname === "www.htmlinks.com" ||
    url.hostname === "htmlinks.com"
  );
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
