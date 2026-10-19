import { test } from "node:test";
import assert from "node:assert/strict";
import {
  artifactCsp,
  digest,
  equal,
  escapeHtml,
  precondition,
  secret,
  seal,
  unseal,
} from "./security.ts";
import { htmlFile, metadata, patchMetadata } from "./validation.ts";
test("secrets are unguessable and hashes are stable SHA-256", () => {
  assert.notEqual(secret(), secret());
  assert.equal(secret().length, 43);
  assert.equal(
    digest("hello"),
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  );
  assert.equal(equal("hello", "hello"), true);
  assert.equal(equal("hello", "hell"), false);
});
test("ETags reject absent and stale writers", () => {
  assert.equal(precondition(null, 2), 428);
  assert.equal(precondition('"1"', 2), 412);
  assert.equal(precondition("*", 2), 412);
  assert.equal(precondition('"2"', 2), 0);
});
test("viewer escapes executable title markup and enforces an opaque script sandbox", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="bad()">'),
    "&lt;img src=x onerror=&quot;bad()&quot;&gt;",
  );
  assert.ok(artifactCsp.includes("sandbox allow-scripts;"));
  assert.ok(!artifactCsp.includes("allow-same-origin"));
  assert.ok(artifactCsp.includes("connect-src 'none'"));
  assert.ok(artifactCsp.includes("form-action 'none'"));
});
test("HTML validation rejects binary, invalid UTF-8 and unsupported files", () => {
  assert.ok(htmlFile("slides.pdf", Buffer.from("<html>")));
  assert.ok(htmlFile("slides.html", Buffer.from([0xff])));
  assert.ok(htmlFile("slides.html", Buffer.from([0])));
  assert.ok(htmlFile("slides.html", Buffer.from("ordinary text")));
  assert.equal(
    htmlFile(
      "slides.HTML",
      Buffer.from("<!doctype html><html><h1>OK</h1></html>"),
    ),
    null,
  );
});
test("publishing defaults to unlisted links and never accepts extra hidden fields", () => {
  assert.equal(metadata.parse({ title: "Hello" }).access, "link");
  assert.throws(() =>
    metadata.parse({ title: "Hello", workspaceId: "injected" }),
  );
  assert.throws(() => metadata.parse({ title: "Hello", password: "short" }));
});

test("metadata patches preserve omitted access and category", () => {
  const patch = patchMetadata.parse({ password: "replacement-password" });
  assert.equal(patch.access, undefined);
  assert.equal(patch.category, undefined);
  assert.equal(patch.password, "replacement-password");
  assert.deepEqual(patchMetadata.parse({ title: "Renamed" }), {
    title: "Renamed",
  });
});

test("the renamed instance secret decrypts legacy retry responses", () => {
  const modern = process.env.HTMLINKS_SECRET;
  const legacy = process.env.HSTORE_SECRET;
  try {
    delete process.env.HTMLINKS_SECRET;
    process.env.HSTORE_SECRET = "legacy-instance-secret".repeat(3);
    const response = { manageKey: "test-only-private-key" };
    const encrypted = seal(response);
    process.env.HTMLINKS_SECRET = process.env.HSTORE_SECRET;
    process.env.HSTORE_SECRET = "different-legacy-secret".repeat(3);
    assert.deepEqual(unseal(encrypted), response);
  } finally {
    if (modern === undefined) delete process.env.HTMLINKS_SECRET;
    else process.env.HTMLINKS_SECRET = modern;
    if (legacy === undefined) delete process.env.HSTORE_SECRET;
    else process.env.HSTORE_SECRET = legacy;
  }
});
