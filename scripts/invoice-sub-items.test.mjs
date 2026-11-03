import assert from "node:assert/strict";
import { build } from "esbuild";
import test from "node:test";

const bundle = await build({
  stdin: {
    contents: `export * from './apps/web/src/zod-schemas/invoice/create-invoice'; export * from './apps/web/src/constants/pdf-helpers'; export * from './apps/web/src/lib/dashboard/financial-dashboard';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { createInvoiceItemSchema, getInvoiceItemTotal, getTotalValue, getDashboardInvoiceTotal } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
const item = { name: "Service", description: "", quantity: 3, unitPrice: 100 };
const subItems = [
  { type: "text", text: "Includes:\nReview and delivery" },
  { type: "name", name: "Support" },
  { type: "priced", name: "License", amount: 25.5 },
];

test("legacy items and optional sub-items remain valid", () => {
  assert.equal(createInvoiceItemSchema.safeParse(item).success, true);
  assert.equal(getInvoiceItemTotal(item), 300);
  assert.equal(getInvoiceItemTotal({ ...item, subItems: [] }), 300);
});
test("mixed sub-items add final amounts once and survive serialization", () => {
  const value = createInvoiceItemSchema.parse({ ...item, subItems });
  assert.deepEqual(JSON.parse(JSON.stringify(value)).subItems, subItems);
  assert.equal(getInvoiceItemTotal(value), 325.5);
  assert.equal(getInvoiceItemTotal({ ...item, unitPrice: 0, subItems }), 25.5);
  assert.equal(
    getInvoiceItemTotal({
      ...item,
      quantity: 1,
      unitPrice: 0.1,
      subItems: [{ type: "priced", name: "Extra", amount: 0.2 }],
    }),
    0.3,
  );
});
test("blank entries and invalid prices are rejected", () => {
  for (const sub of [
    { type: "text", text: " " },
    { type: "name", name: "" },
    { type: "priced", name: "X", amount: -1 },
    { type: "priced", name: "X", amount: "" },
    { type: "priced", name: "X", amount: Infinity },
  ]) {
    assert.equal(createInvoiceItemSchema.safeParse({ ...item, subItems: [sub] }).success, false);
  }
});
test("invoice and dashboard totals agree including taxes and mixed sub-items", () => {
  const invoice = {
    invoiceFields: {
      items: [{ ...item, subItems }],
      invoiceDetails: {
        billingDetails: [
          { type: "percentage", value: 10 },
          { type: "fixed", value: -5 },
        ],
      },
    },
  };
  assert.equal(getTotalValue(invoice.invoiceFields), 353.05);
  assert.equal(getDashboardInvoiceTotal(invoice), "353.05");
});
