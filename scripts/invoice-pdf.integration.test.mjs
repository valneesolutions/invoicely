import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
import test from "node:test";
import path from "node:path";

test("PDF templates keep all sub-items across pages and separate descriptions", async () => {
  const root = process.cwd(),
    output = path.resolve(`.tmp-pdf-tests-${randomUUID()}.mjs`);
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
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    for (const [template, mode] of [
      ["default", "light"],
      ["default", "dark"],
      ["vercel", "dark"],
    ]) {
      const subs = [
        { type: "text", text: "SUBITEM_START" },
        { type: "hours", name: "Planning", hours: 6.25 },
        { type: "priced", name: "License", amount: 5 },
        { type: "quantity_price", name: "Implementation", quantity: 2.5, unitPrice: 20 },
        ...Array.from({ length: 72 }, (_, i) => ({
          type: "name",
          name: `Entry ${String(i).padStart(3, "0")} with detailed content for the invoice`,
        })),
      ];
      const data = {
        ...defaults,
        metadata: null,
        invoiceDetails: { ...defaults.invoiceDetails, theme: { ...defaults.invoiceDetails.theme, template, mode } },
        items: [
          { name: "Service", description: "PARENT_DESCRIPTION_MARKER", quantity: 1, unitPrice: 0, subItems: subs },
        ],
      };
      const blob = await createPdfBlob({ invoiceData: data, template });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const pdf = await getDocument({ data: bytes, useSystemFonts: false }).promise;
      assert.ok(pdf.numPages > 1 && pdf.numPages < 10);
      let all = "";
      let firstPage;
      for (let page = 1; page <= pdf.numPages; page++) {
        const text = await (await pdf.getPage(page)).getTextContent();
        all += text.items.map((x) => x.str ?? "").join(" ");
        if (page === 1) firstPage = text.items;
      }
      for (const label of ["SUBITEM_START", "Planning", "6.25", "Quantity", "Unit price", "Entry 000", "Entry 071"])
        assert.ok(all.includes(label), `${template}/${mode}: missing ${label}`);
      const description = firstPage.find((x) => x.str?.includes("PARENT_DESCRIPTION_MARKER"));
      const first = firstPage.find((x) => x.str?.includes("SUBITEM_START"));
      assert.ok(description.transform[5] - first.transform[5] >= 10, "Sub-items must start below the main description");
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
    await fs.unlink(output).catch(() => {});
  }
});
