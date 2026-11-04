import assert from "node:assert/strict";
import { build } from "esbuild";
import test from "node:test";
const result = await build({
  stdin: {
    contents: `export * from './apps/web/src/lib/invoice/import-csv';export * from './apps/web/src/lib/invoice/item-totals';export * from './apps/web/src/lib/invoice/sub-item-groups';export * from './apps/web/src/zod-schemas/invoice/create-invoice';export * from './apps/web/src/lib/dashboard/financial-dashboard';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  tsconfig: "apps/web/tsconfig.json",
});
const {
  parseInvoiceCsv,
  invoiceCsvTemplate,
  getItemAmount,
  createInvoiceItemSchema,
  getDashboardInvoiceTotal,
  groupSubItems,
  invoiceCsvGuide,
} = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
test("template includes every sub-item type and totals fixed and quantity prices only", () => {
  const result = parseInvoiceCsv("\uFEFF" + invoiceCsvTemplate);
  assert.deepEqual(result.issues, []);
  assert.equal(result.items.length, 1);
  assert.deepEqual(
    result.items[0].subItems.map((s) => s.type),
    ["text", "name", "priced", "hours", "quantity_price"],
  );
  assert.equal(getItemAmount(result.items[0]).toNumber(), 375);
  for (const { title } of invoiceCsvGuide) assert.ok(invoiceCsvTemplate.includes(title));
});
test("PDF grouping uses fixed type order, preserves order within a type and does not mutate invoice data", () => {
  const items = [
    { type: "quantity_price", name: "Work", quantity: 2.5, unitPrice: 900 },
    { type: "hours", name: "Planning first", hours: 2 },
    { type: "name", name: "Delivery" },
    { type: "priced", name: "License", amount: 0 },
    { type: "text", text: "Details" },
    { type: "hours", name: "Planning second", hours: 1 },
  ];
  const before = structuredClone(items);
  const groups = groupSubItems(items);
  assert.deepEqual(
    groups.map((g) => g.type),
    ["text", "name", "hours", "priced", "quantity_price"],
  );
  assert.deepEqual(
    groups[2].items.map((i) => i.name),
    ["Planning first", "Planning second"],
  );
  assert.deepEqual(items, before);
  assert.deepEqual(groupSubItems([]), []);
  assert.deepEqual(
    groupSubItems([items[0]]).map((g) => g.type),
    ["quantity_price"],
  );
  const invoiceItem = { quantity: 2, unitPrice: 100, subItems: items };
  assert.equal(getItemAmount(invoiceItem).toNumber(), 2450);
  assert.equal(getItemAmount({ ...invoiceItem, subItems: groups.flatMap((g) => g.items) }).toNumber(), 2450);
});
test("CSV comments are ignored before reference validation and preserve error row references", () => {
  const source =
    "row_type,item_ref,name,quantity,unit_price,text\ncomment,,,,,Instructions\nitem,a,Service,1,0,\ncomment,,,,,More instructions\nquantity_price,a,Work,2.5,900,";
  const result = parseInvoiceCsv(source);
  assert.deepEqual(result.issues, []);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].subItems.length, 1);
  assert.equal(getItemAmount(result.items[0]).toNumber(), 2250);
  const bad = parseInvoiceCsv(source.replace("Work,2.5,900", "Work,-1,900"));
  assert.deepEqual(bad.items, []);
  assert.ok(bad.issues.some((i) => i.row === 5 && i.column === "quantity"));
  const multiline = parseInvoiceCsv(
    'row_type,item_ref,name,text\ncomment,,,"Instructions, line one\nline two"\nitem,a,Service,\ntext,a,,"Details, with commas\nand lines"',
  );
  assert.deepEqual(multiline.issues, []);
  assert.equal(multiline.items[0].subItems[0].text, "Details, with commas\nand lines");
  assert.ok(parseInvoiceCsv("row_type,item_ref,text\ncomment,,Instructions").issues.length);
});
test("CSV row limits count data rows only while file limits still include comments", () => {
  const header = "row_type,item_ref,name,text\n";
  const comments = "comment,,,Guide\n".repeat(1001);
  assert.deepEqual(parseInvoiceCsv(header + comments + "item,a,Service,").issues, []);
  assert.deepEqual(parseInvoiceCsv(header + "item,a,Service,\n" + "name,a,Child,\n".repeat(999)).issues, []);
  assert.ok(
    parseInvoiceCsv(header + "item,a,Service,\n" + "name,a,Child,\n".repeat(1000)).issues.some(
      (i) => i.column === "file",
    ),
  );
  assert.ok(parseInvoiceCsv(header + "comment,,," + "x".repeat(1024 * 1024)).issues.some((i) => i.column === "file"));
});
test("hours do not affect parent pricing; fractional quantity prices are final amounts", () => {
  const item = {
    name: "Service",
    description: "",
    quantity: 3,
    unitPrice: 100,
    subItems: [
      { type: "hours", name: "Planning", hours: 4.5 },
      { type: "quantity_price", name: "Work", quantity: 2.5, unitPrice: 0.2 },
    ],
  };
  assert.equal(createInvoiceItemSchema.safeParse(item).success, true);
  assert.equal(getItemAmount(item).toNumber(), 300.5);
  assert.equal(
    getDashboardInvoiceTotal({ invoiceFields: { items: [item], invoiceDetails: { billingDetails: [] } } }),
    "300.5",
  );
  assert.equal(createInvoiceItemSchema.safeParse({ ...item, quantity: 1.5 }).success, false);
});
test("quoted CSV commas, Unicode and multiline descriptions remain literal text", () => {
  const result = parseInvoiceCsv(
    'row_type,item_ref,name,description,text\r\nitem,a,"Service, one","Line 1\nLine 2",\r\ntext,a,,,"Crème, 配送"',
  );
  assert.deepEqual(result.issues, []);
  assert.equal(result.items[0].description, "Line 1\nLine 2");
  assert.equal(result.items[0].subItems[0].text, "Crème, 配送");
});
test("sub-items can refer to a parent later in the CSV, retaining child order", () => {
  const result = parseInvoiceCsv(
    "row_type,item_ref,name,quantity,unit_price,hours\nhours,a,Planning,,,1.5\nitem,a,Service,1,0,\nname,a,Delivery,,,",
  );
  assert.deepEqual(result.issues, []);
  assert.deepEqual(
    result.items[0].subItems.map((s) => s.name),
    ["Planning", "Delivery"],
  );
});
test("invalid parents, missing references, unknown types, blank amounts and invalid quantities reject the entire batch", () => {
  const inputs = [
    "row_type,item_ref,name\nitem,a,One\nitem,a,Two",
    "row_type,item_ref,name\nname,missing,Child",
    "row_type,item_ref,name\nitem,a,One\nunknown,a,Two",
    "row_type,item_ref,name,amount\nitem,a,One,\npriced,a,Extra,",
    "row_type,item_ref,name,quantity,unit_price\nitem,a,One,1,0\nquantity_price,a,Extra,-1,20",
  ];
  for (const csv of inputs) {
    const result = parseInvoiceCsv(csv);
    assert.ok(result.issues.length);
    assert.deepEqual(result.items, []);
    assert.ok(result.issues.every((e) => e.row > 0 && e.column));
  }
});
