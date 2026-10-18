import "server-only";
import { passwordVerify } from "./passwords";
import { sql } from "./db";
import { config } from "./config";
import { artifactCsp, digest, escapeHtml, secret } from "./security";
import { boundedBody, fail, rateLimit, sameOrigin, sourceKey } from "./http";
import { readArtifact } from "./storage";
import { viewerStyle, viewerBrand, lockMark, arrowMark } from "./viewer-theme";
function page(body: string, nonce: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>HTMLinks · Shared document</title><style nonce="${nonce}">${viewerStyle}</style></head><body>${body}</body></html>`;
}
function gate(content: string) {
  const app = config().app;
  return `<header class="gate-header">${viewerBrand(app)}<span class="shared-label">A page, shared with you.</span></header><main class="gate">${lockMark}${content}</main><footer class="gate-footer">Made to be shared. <a href="${escapeHtml(app)}">Made with HTMLinks ↗</a></footer>`;
}
function passwordForm(documentPath: string, invalid = false) {
  return `<p class="eyebrow">A shared document</p><h1>A little privacy,<br>please.</h1><p>This page is password protected.<br>Enter the password shared with you.</p><form method="POST" action="${documentPath}/unlock">${invalid ? '<p class="error" role="alert" id="password-error">That password didn’t work. Please try again.</p>' : ""}<label for="password">Document password</label><input id="password" type="password" name="password" minlength="8" maxlength="256" required autofocus autocomplete="current-password" placeholder="Enter your password"${invalid ? ' aria-invalid="true" aria-describedby="password-error"' : ""}><button class="button" type="submit">Open document ${arrowMark}</button></form><p class="hint">Need access? Ask the person who shared this page.</p>`;
}
function cookieName(id: string) {
  return `hsv_${id}`;
}
function readCookie(request: Request, id: string) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(cookieName(id) + "="))
      ?.split("=")[1] || ""
  );
}
function cookie(id: string, value: string, documentPath: string) {
  return `${cookieName(id)}=${value}; Path=${documentPath}; HttpOnly; SameSite=Lax; Max-Age=3600${config().app.startsWith("https:") ? "; Secure" : ""}`;
}
export async function viewer(request: Request, path: string[]) {
  const [id, action] = path;
  if (!id || !/^[\w-]{24}$/.test(id) || path.length > 2)
    fail(404, "NOT_FOUND", "Document not found.");
  const documentPath = `/rendered/${id}`;
  const [d] =
    await sql()`SELECT * FROM htmlinks.documents WHERE public_id=${id} AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at>now())`;
  if (!d) fail(404, "NOT_FOUND", "Document not found.");
  const nonce = secret();
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; font-src 'self'; frame-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
  };
  if (action === "handoff" && request.method === "POST") {
    sameOrigin(request, config().app);
    const form = new URLSearchParams(
      (await boundedBody(request, 2048)).toString(),
    );
    const token = secret();
    await sql().begin(async (tx) => {
      const [grant] =
        await tx`DELETE FROM htmlinks.viewer_grants WHERE digest=${digest(form.get("grant") || "")} AND document_id=${d.id} AND policy_version=${d.policy_version} AND kind='handoff' AND expires_at>now() RETURNING digest`;
      if (!grant)
        fail(
          403,
          "INVALID_GRANT",
          "Preview link expired. Request a new preview with your management key.",
        );
      await tx`INSERT INTO htmlinks.viewer_grants(digest,document_id,policy_version,kind,expires_at) VALUES (${digest(token)},${d.id},${d.policy_version},'session',now()+interval '1 hour')`;
    });
    return new Response(null, {
      status: 303,
      headers: {
        Location: documentPath,
        "Set-Cookie": cookie(id, token, documentPath),
        "Cache-Control": "no-store",
      },
    });
  }
  if (action === "unlock" && request.method === "POST") {
    sameOrigin(request, config().app);
    await rateLimit(`unlock-document:${d.id}`, 30, 300);
    await rateLimit(`unlock-source:${sourceKey(request)}`, 60, 300);
    const form = new URLSearchParams(
      (await boundedBody(request, 2048)).toString(),
    );
    const password = form.get("password") || "";
    if (
      d.access !== "password" ||
      password.length > 256 ||
      !(await passwordVerify(d.password_hash, password))
    )
      return new Response(page(gate(passwordForm(documentPath, true)), nonce), {
        status: 403,
        headers,
      });
    const token = secret();
    await sql()`INSERT INTO htmlinks.viewer_grants(digest,document_id,policy_version,kind,expires_at) VALUES (${digest(token)},${d.id},${d.policy_version},'session',now()+interval '1 hour')`;
    return new Response(null, {
      status: 303,
      headers: {
        Location: documentPath,
        "Set-Cookie": cookie(id, token, documentPath),
        "Cache-Control": "no-store",
      },
    });
  }
  if (request.method !== "GET")
    fail(405, "METHOD_NOT_ALLOWED", "Method not allowed.");
  let authorized = d.access === "link";
  if (!authorized)
    authorized = !!(
      await sql()`SELECT 1 FROM htmlinks.viewer_grants WHERE digest=${digest(readCookie(request, id))} AND document_id=${d.id} AND policy_version=${d.policy_version} AND kind='session' AND expires_at>now()`
    ).length;
  if (!authorized) {
    if (action) fail(403, "ACCESS_REQUIRED", "Unlock this document first.");
    const content =
      d.access === "password"
        ? passwordForm(documentPath)
        : `<p class="eyebrow">A shared document</p><h1>This page<br>is private.</h1><p>Ask its author for access, or use the skill to open your own document.</p><a class="button" href="${escapeHtml(config().app)}/#install">Get the skill ${arrowMark}</a>`;
    return new Response(page(gate(content), nonce), { headers });
  }
  if (action === "raw") {
    const [revision] =
      await sql()`SELECT storage_key FROM htmlinks.document_revisions WHERE id=${d.current_revision_id} AND document_id=${d.id}`;
    return new Response(
      new Uint8Array(await readArtifact(revision.storage_key)),
      {
        headers: {
          ...headers,
          "Content-Security-Policy": artifactCsp,
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
  if (action) fail(404, "NOT_FOUND", "Endpoint not found.");
  const title = escapeHtml(d.title);
  return new Response(
    page(
      `<header class="viewer-header">${viewerBrand(config().app)}<div class="document-meta"><span class="document-title">${title}</span><span class="revision">Version ${d.revision}</span></div><button class="fullscreen" id="fullscreen" type="button" aria-label="View document in full screen">Full screen ↗</button></header><iframe class="document-frame" id="document" title="${title}" sandbox="allow-scripts" allow="fullscreen" allowfullscreen src="${documentPath}/raw"></iframe><script nonce="${nonce}">document.getElementById('fullscreen').onclick=()=>document.getElementById('document').requestFullscreen();</script>`,
      nonce,
    ),
    { headers },
  );
}
