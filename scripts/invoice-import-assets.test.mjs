import assert from "node:assert/strict";
import { build } from "esbuild";
import test from "node:test";
const bundle = await build({
  stdin: {
    contents: `export * from './apps/web/src/lib/invoice/normalize-invoice'; export * from './apps/web/src/lib/invoice/serial-task'; export * from './apps/web/src/lib/cloudflare/r2/asset-url'; export * from './apps/web/src/zod-schemas/invoice/create-invoice';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const {
  normalizeInvoiceFields,
  createSerialTaskQueue,
  resolveAssetBaseUrl,
  assetUrl,
  resolveStoredAssetUrl,
  createInvoiceSchema,
  createInvoiceSchemaDefaultValues: defaults,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

test("saved invoices with absent or partial metadata validate after import without losing content", () => {
  for (const metadata of [
    undefined,
    null,
    {},
    { notes: null, terms: null },
    { notes: "Retain this", paymentInformation: null },
  ]) {
    const source = { ...defaults, metadata };
    const before = structuredClone(source);
    const result = normalizeInvoiceFields(source);
    assert.equal(createInvoiceSchema.safeParse(result).success, true);
    assert.equal(result.metadata.notes, metadata?.notes ?? "");
    assert.equal(result.metadata.terms, "");
    assert.deepEqual(result.metadata.paymentInformation, []);
    assert.deepEqual(source, before);
  }
});
test("valid payment details and sub-items survive import", () => {
  const source = {
    ...defaults,
    metadata: { notes: "Notes", terms: "Terms", paymentInformation: [{ label: "Bank", value: "Account" }] },
    items: [
      {
        name: "Service",
        description: "",
        quantity: 1,
        unitPrice: 100,
        subItems: [{ type: "priced", name: "Extra", amount: 25 }],
      },
    ],
  };
  assert.deepEqual(normalizeInvoiceFields(source).metadata, source.metadata);
  assert.deepEqual(normalizeInvoiceFields(source).items, source.items);
});
test("local images recover base64 from expired blobs and retain valid data/HTTP images", () => {
  const base64 = "data:image/png;base64,aGVsbG8=";
  const data = {
    ...defaults,
    companyDetails: {
      ...defaults.companyDetails,
      logo: "blob:expired",
      logoBase64: base64,
      signature: "http://localhost/signature.png",
    },
  };
  assert.equal(normalizeInvoiceFields(data).companyDetails.logo, base64);
  assert.equal(normalizeInvoiceFields(data).companyDetails.signature, data.companyDetails.signature);
  assert.equal(
    normalizeInvoiceFields({ ...data, companyDetails: { ...data.companyDetails, logoBase64: undefined } })
      .companyDetails.logo,
    undefined,
  );
});
test("storage URLs work without a public build variable, custom domains and older relative URLs", () => {
  const base = resolveAssetBaseUrl({ publicBaseUrl: "", endpoint: "https://storage.example/", bucket: "assets" });
  assert.equal(base, "https://storage.example/assets");
  assert.equal(assetUrl(base, "user/logo one.png"), "https://storage.example/assets/user/logo%20one.png");
  assert.equal(resolveStoredAssetUrl("/user/logo.png", base), "https://storage.example/assets/user/logo.png");
  assert.equal(resolveStoredAssetUrl("data:image/png;base64,AAAA", base), "data:image/png;base64,AAAA");
  assert.equal(
    resolveAssetBaseUrl({ publicBaseUrl: "https://cdn.example/", endpoint: "", bucket: "" }),
    "https://cdn.example",
  );
});
test("PDF tasks run one at a time and recover after a failed render", async () => {
  const run = createSerialTaskQueue();
  let active = 0,
    maxActive = 0;
  const work = (fail) =>
    run(async () => {
      active++;
      maxActive = Math.max(active, maxActive);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      if (fail) throw new Error("render failed");
      return "PDF";
    });
  const results = await Promise.allSettled([work(false), work(true), work(false)]);
  assert.equal(maxActive, 1);
  assert.deepEqual(
    results.map((r) => r.status),
    ["fulfilled", "rejected", "fulfilled"],
  );
});
