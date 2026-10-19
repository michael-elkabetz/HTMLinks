import { test } from "node:test";
import assert from "node:assert/strict";
import { skillSource } from "./skill-source.ts";

test("instance downloads rewrite production or legacy defaults without changing saved preference code", () => {
  for (const previous of [
    "http://localhost:3000",
    "https://www.htmlinks.com",
  ]) {
    const source = `const DEFAULT_URL = "${previous}";\nconst MANAGED_URL = "${previous}";\nconst preferences = "${previous}";`;
    const output = skillSource(
      source,
      "https://self.example.org",
      "https://managed.example.org",
    );
    assert.ok(
      output.startsWith('const DEFAULT_URL = "https://self.example.org";'),
    );
    assert.ok(
      output.includes('const MANAGED_URL = "https://managed.example.org";'),
    );
    assert.ok(output.endsWith(`const preferences = "${previous}";`));
  }
});
