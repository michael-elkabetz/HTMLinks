import test from "node:test";
import assert from "node:assert/strict";
import { setupStorage } from "./setup-supabase.mjs";

const env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "private-test-key",
  SUPABASE_BUCKET: "htmlinks",
};

test("setup creates a private bucket and verifies the stored setting", async () => {
  const calls = [];
  await setupStorage(env, async (url, options) => {
    calls.push({ url, ...options });
    return Response.json(
      calls.length === 1 ? [] : { id: "htmlinks", public: false },
    );
  });
  assert.deepEqual(
    calls.map(({ method }) => method),
    ["GET", "POST", "GET"],
  );
  assert.deepEqual(JSON.parse(calls[1].body), {
    id: "htmlinks",
    name: "htmlinks",
    public: false,
  });
  assert.equal(calls[2].url, `${env.SUPABASE_URL}/storage/v1/bucket/htmlinks`);
});

test("setup reuses an existing private bucket without modifying it", async () => {
  let calls = 0;
  await setupStorage(env, async () => {
    calls++;
    return Response.json([{ id: "htmlinks", public: false }]);
  });
  assert.equal(calls, 1);
});

test("setup rejects public buckets rather than silently accepting them", async () => {
  await assert.rejects(
    setupStorage(env, async () =>
      Response.json([{ id: "htmlinks", public: true }]),
    ),
    /bucket is public/,
  );
});

test("setup rejects missing settings and unsafe URLs before sending credentials", async () => {
  for (const invalid of [
    { ...env, SUPABASE_BUCKET: undefined },
    { ...env, SUPABASE_URL: "http://example.supabase.co" },
    { ...env, SUPABASE_URL: "https://example.supabase.co/other" },
  ])
    await assert.rejects(
      setupStorage(invalid, async () => assert.fail("Unexpected request")),
    );
});

test("setup does not expose provider error bodies", async () => {
  await assert.rejects(
    setupStorage(
      env,
      async () => new Response("sensitive details", { status: 401 }),
    ),
    { message: "Supabase Storage GET failed (401)." },
  );
});
