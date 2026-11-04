import assert from "node:assert/strict";
import { build } from "esbuild";
import test from "node:test";

const bundle = await build({
  entryPoints: ["apps/web/src/lib/invoice/prepare-pdf-images.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { preparePdfImages } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
  "base64",
);

test("PDF images bypass opaque browser cache, embed bytes, reuse successes and preserve the invoice", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(png);
  });
  const input = { name: "Company", logo: "https://storage.example/cached-logo", signature: "blob:signature" };
  const output = await preparePdfImages(input);
  assert.equal(output.logo, `data:image/png;base64,${png.toString("base64")}`);
  assert.equal(output.signature, output.logo);
  assert.equal(input.logo, "https://storage.example/cached-logo");
  assert.equal(output.name, input.name);
  assert.equal(calls.length, 2);
  for (const [, options] of calls) {
    assert.equal(options.cache, "reload");
    assert.equal(options.mode, "cors");
    assert.equal(options.credentials, "omit");
  }
  assert.deepEqual(await preparePdfImages(input), output);
  assert.equal(calls.length, 2);
});

test("data images and empty optional images need no network", async (t) => {
  t.mock.method(globalThis, "fetch", () => {
    throw Error("Unexpected request");
  });
  const input = { logo: "data:image/png;base64,AAAA", signature: "" };
  assert.deepEqual(await preparePdfImages(input), input);
});

test("failed image retrieval is actionable and retried rather than cached or silently omitted", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (calls === 1) throw new TypeError("Failed to fetch");
    return new Response(png);
  });
  const input = { logo: "https://storage.example/retry-logo" };
  await assert.rejects(preparePdfImages(input), /Unable to load company logo.*Re-select/);
  assert.ok((await preparePdfImages(input)).logo.startsWith("data:image/png;base64,"));
  assert.equal(calls, 2);
});

test("HTTP failures and unsupported image bodies cannot create an incomplete PDF", async (t) => {
  t.mock.method(globalThis, "fetch", async (source) =>
    source.endsWith("missing") ? new Response("missing", { status: 404 }) : new Response("<html>Sign in</html>"),
  );
  await assert.rejects(preparePdfImages({ signature: "https://storage.example/missing" }), /company signature/);
  await assert.rejects(preparePdfImages({ logo: "https://storage.example/not-image" }), /company logo/);
});
