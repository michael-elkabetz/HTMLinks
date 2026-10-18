import assert from "node:assert/strict";

const app = "http://localhost:4310";
const password = "shared-viewer-test-password";
const source =
  '<!doctype html><html><h1>Shared-domain source</h1><script>document.body.dataset.inline="works"</script></html>';
const form = new FormData();
form.set("file", new File([source], "shared.html", { type: "text/html" }));
form.set(
  "metadata",
  JSON.stringify({
    title: "Shared-domain integration",
    access: "password",
    password,
  }),
);
const uploaded = await fetch(`${app}/api/v1/documents`, {
  method: "POST",
  body: form,
});
assert.equal(uploaded.status, 201);
const document = await uploaded.json();
assert.equal(document.url, `${app}/rendered/${document.publicId}`);

const gate = await fetch(document.url);
const gateHtml = await gate.text();
assert.equal(gate.status, 200);
assert.match(gateHtml, /aria-label="HTMLinks home"/);
assert.match(gateHtml, /viewBox="0 0 64 64"/);
assert.match(gateHtml, /#f8faf9/);
assert.ok(!gateHtml.includes("Shared-domain source"));
assert.ok(!gateHtml.includes("Shared-domain integration"));
assert.match(
  gateHtml,
  new RegExp(`action="/rendered/${document.publicId}/unlock"`),
);
assert.equal((await fetch(`${document.url}/raw`)).status, 403);

async function unlock(value, origin = app) {
  return fetch(`${document.url}/unlock`, {
    method: "POST",
    redirect: "manual",
    headers: {
      Origin: origin,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ password: value }),
  });
}
const wrong = await unlock("wrong-shared-password");
assert.equal(wrong.status, 403);
assert.match(await wrong.text(), /role="alert"/);
assert.equal((await unlock(password, "https://other.example")).status, 403);
const session = await unlock(password);
assert.equal(session.status, 303);
assert.equal(session.headers.get("location"), `/rendered/${document.publicId}`);
const setCookie = session.headers.getSetCookie()[0];
assert.ok(setCookie.includes(`Path=/rendered/${document.publicId};`));
assert.ok(setCookie.includes("HttpOnly; SameSite=Lax"));
const cookie = setCookie.split(";")[0];
const rendered = await fetch(document.url, { headers: { Cookie: cookie } });
const shell = await rendered.text();
assert.match(shell, /sandbox="allow-scripts"/);
assert.ok(!shell.includes("allow-same-origin"));
assert.ok(shell.includes(`src="/rendered/${document.publicId}/raw"`));
const raw = await fetch(`${document.url}/raw`, { headers: { Cookie: cookie } });
assert.equal(raw.status, 200);
assert.equal(await raw.text(), source);
assert.match(
  raw.headers.get("content-security-policy"),
  /^sandbox allow-scripts;/,
);
assert.ok(
  !raw.headers.get("content-security-policy").includes("allow-same-origin"),
);
assert.match(raw.headers.get("content-security-policy"), /connect-src 'none'/);

const legacy = await fetch(`${app}/d/${document.publicId}`, {
  redirect: "manual",
});
assert.equal(legacy.status, 308);
assert.equal(new URL(legacy.headers.get("location"), app).href, document.url);
assert.equal(
  (await fetch(`${app}/api/v1/documents/${document.id}`)).status,
  401,
);
const preview = await fetch(`${app}/api/v1/documents/${document.id}/preview`, {
  method: "POST",
  headers: { Authorization: `Bearer ${document.manageKey}` },
});
assert.equal(preview.status, 200);
const grant = await preview.json();
assert.equal(grant.action, `${document.url}/handoff`);
const handoff = await fetch(grant.action, {
  method: "POST",
  redirect: "manual",
  headers: { Origin: app, "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant: grant.grant }),
});
assert.equal(handoff.status, 303);
assert.ok(
  handoff.headers
    .getSetCookie()[0]
    .includes(`Path=/rendered/${document.publicId};`),
);
assert.equal(
  (await fetch(`${app}/fonts/hanken-grotesk-latin-400-normal.woff2`)).status,
  200,
);
assert.equal((await fetch("http://127.0.0.1:4310/")).status, 421);
console.log(
  "Passed shared-domain integration: canonical URLs, password delivery, scoped cookies, author preview, branding, and opaque raw-content sandbox.",
);
