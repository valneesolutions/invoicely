import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
import test from "node:test";
import path from "node:path";

test("PDF templates keep all sub-items across pages and separate descriptions", async () => {
  const root = process.cwd(),
    output = path.resolve(`.tmp-pdf-tests-${randomUUID()}.mjs`);
  const logo = await fs.readFile("apps/web/public/official/logo-icon.png");
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "image/png" });
    response.end(logo);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const imageUrl = `http://127.0.0.1:${server.address().port}/logo.png`;
  try {
    await build({
      stdin: {
        contents: `export {createPdfBlob} from './apps/web/src/lib/invoice/create-pdf-blob';export {createInvoiceSchemaDefaultValues as defaults} from './apps/web/src/zod-schemas/invoice/create-invoice';`,
        resolveDir: root,
      },
      outfile: output,
      bundle: true,
      platform: "node",
      format: "esm",
      jsx: "automatic",
      packages: "external",
      tsconfig: "apps/web/tsconfig.json",
      plugins: [
        {
          name: "local-fonts",
          setup(b) {
            b.onLoad({ filter: /pdf-fonts\.ts$/ }, async ({ path }) => ({
              contents: (await fs.readFile(path, "utf8")).replaceAll('"/fonts/', `"${root}/apps/web/public/fonts/`),
              loader: "ts",
            }));
          },
        },
      ],
    });
    const source = (await fs.readFile(output, "utf8"))
      .replaceAll('currency-symbol-map/map"', 'currency-symbol-map/map.js"')
      .replace(
        'import { toWords } from "number-to-words";',
        'import words from "number-to-words";const {toWords}=words;',
      );
    await fs.writeFile(output, source);
    const { createPdfBlob, defaults } = await import(output);
    // PDF.js only needs the DOMMatrix constructor for module initialization when extracting text in Node.
    globalThis.DOMMatrix ??= class {};
    const { getDocument, OPS } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    for (const [template, mode] of [
      ["default", "light"],
      ["default", "dark"],
      ["vercel", "dark"],
    ]) {
      const subs = [
        { type: "text", text: "SUBITEM_START" },
        { type: "hours", name: "Planning", hours: 6.25 },
        { type: "hours", name: "Planning next", hours: 0.25 },
        { type: "priced", name: "License", amount: 5 },
        { type: "priced", name: "Additional license", amount: 1234567.89 },
        { type: "quantity_price", name: "Implementation", quantity: 2.5, unitPrice: 20 },
        {
          type: "quantity_price",
          name: "Wrapped subject " + "requiring detailed review and verification ".repeat(8) + "END_WRAPPED_SUBJECT",
          quantity: 1,
          unitPrice: 0,
        },
        { type: "quantity_price", name: "Implementation next", quantity: 0.25, unitPrice: 999999.99 },
        ...Array.from({ length: 72 }, (_, i) => ({
          type: "name",
          name: `Entry ${String(i).padStart(3, "0")} with detailed content for the invoice`,
        })),
      ];
      const data = {
        ...defaults,
        metadata: null,
        companyDetails: { ...defaults.companyDetails, logo: imageUrl },
        invoiceDetails: { ...defaults.invoiceDetails, theme: { ...defaults.invoiceDetails.theme, template, mode } },
        items: [
          {
            name: "Service",
            description:
              "PARENT_DESCRIPTION_MARKER\nA multiline description with additional context.\nFinal description line.",
            quantity: 1,
            unitPrice: 0,
            subItems: subs,
          },
        ],
      };
      const blob = await createPdfBlob({ invoiceData: data, template });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocument({ data: bytes, useSystemFonts: false }).promise;
      assert.ok(pdf.numPages > 1 && pdf.numPages < 10);
      const operations = await (await pdf.getPage(1)).getOperatorList();
      assert.ok(operations.fnArray.includes(OPS.paintImageXObject), `${template}/${mode}: logo must be embedded`);
      let all = "";
      const positioned = [];
      let firstPage;
      for (let page = 1; page <= pdf.numPages; page++) {
        const text = await (await pdf.getPage(page)).getTextContent();
        all += text.items.map((x) => x.str ?? "").join(" ");
        positioned.push(...text.items.map((x) => ({ ...x, page })));
        if (page === 1) firstPage = text.items;
      }
      for (const label of [
        "SUBITEM_START",
        "Planning",
        "6.25",
        "Quantity",
        "Unit price",
        "Entry 000",
        "Entry 071",
        "END_WRAPPED_SUBJECT",
        "Final description line.",
      ])
        assert.ok(all.includes(label), `${template}/${mode}: missing ${label}`);
      const description = firstPage.find((x) => x.str?.includes("PARENT_DESCRIPTION_MARKER"));
      const first = firstPage.find((x) => x.str?.includes("SUBITEM_START"));
      assert.ok(description.transform[5] - first.transform[5] >= 10, "Sub-items must start below the main description");
      for (const [label, count] of [
        ["Description", 1],
        ["Subject", 4],
        ["Hours", 1],
        ["Quantity", 1],
        ["Unit price", 1],
        ["Amount", 2],
      ])
        assert.equal(
          positioned.filter((x) => x.str === label).length,
          count,
          `${template}/${mode}: headers should appear once per group: ${label}`,
        );
      const order = [
        "SUBITEM_START",
        "Entry 000",
        "Entry 071",
        "Planning",
        "Planning next",
        "License",
        "Additional license",
        "Implementation",
        "Implementation next",
      ];
      const indices = order.map((label) =>
        positioned.findIndex((x) => x.str === label || x.str?.startsWith(label + " with")),
      );
      assert.ok(
        indices.every((value, i) => value >= 0 && (!i || value > indices[i - 1])),
        `${template}/${mode}: fixed group ordering and stable row ordering`,
      );
      const quantityHeader = positioned.find((x) => x.str === "Quantity");
      const quantityValue = positioned.find((x) => x.str === "2.5");
      assert.ok(
        quantityValue.transform[4] >= quantityHeader.transform[4] - 10,
        "Quantity values align under their column",
      );
      assert.ok(quantityValue.transform[4] > 300, "Sub-item numeric columns span the full parent width");
      for (const header of positioned.filter((x) =>
        ["Description", "Subject", "Hours", "Quantity", "Unit price", "Amount"].includes(x.str),
      )) {
        assert.ok(
          positioned.some(
            (x) =>
              x.page === header.page &&
              x.transform[5] < header.transform[5] &&
              x.transform[5] > header.transform[5] - 40,
          ),
          `${template}/${mode}: ${header.str} on page ${header.page} at ${header.transform[5]} must have content below on the same page`,
        );
      }
      if (process.env.PDF_ARTIFACT_DIR) {
        await fs.mkdir(process.env.PDF_ARTIFACT_DIR, { recursive: true });
        await fs.writeFile(
          path.join(process.env.PDF_ARTIFACT_DIR, `${template}-${mode}.pdf`),
          Buffer.from(await blob.arrayBuffer()),
        );
      }
      await pdf.destroy();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.unlink(output).catch(() => {});
  }
});
