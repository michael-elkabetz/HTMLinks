export function skillSource(
  source: string,
  appOrigin: string,
  managedOrigin: string,
) {
  return source
    .replace(
      /^const DEFAULT_URL = "[^"\r\n]*";$/m,
      () => `const DEFAULT_URL = ${JSON.stringify(appOrigin)};`,
    )
    .replace(
      /^const MANAGED_URL = "[^"\r\n]*";$/m,
      () => `const MANAGED_URL = ${JSON.stringify(managedOrigin)};`,
    );
}
