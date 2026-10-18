import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLd, publicIndexingAllowed } from "./seo-policy.ts";

test("public discovery requires the managed host or an explicit HTTPS opt-in", () => {
  assert.equal(publicIndexingAllowed("https://www.htmlinks.com"), true);
  assert.equal(publicIndexingAllowed("https://htmlinks.com"), true);
  assert.equal(publicIndexingAllowed("https://staging.htmlinks.com"), false);
  assert.equal(
    publicIndexingAllowed("https://www.htmlinks.com.evil.test"),
    false,
  );
  assert.equal(publicIndexingAllowed("https://docs.example.org"), false);
  assert.equal(publicIndexingAllowed("https://docs.example.org", "1"), true);
  assert.equal(publicIndexingAllowed("https://www.htmlinks.com", "0"), false);
  assert.equal(publicIndexingAllowed("http://localhost:3000", "1"), false);
  assert.equal(publicIndexingAllowed("http://www.htmlinks.com"), false);
});

test("JSON-LD cannot terminate its HTML script element", () => {
  const value = { name: "</script><script>alert('x')</script>" };
  const encoded = jsonLd(value);
  assert.ok(!encoded.includes("<"));
  assert.deepEqual(JSON.parse(encoded), value);
});
