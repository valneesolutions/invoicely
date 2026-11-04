import {
  createInvoiceItemSchema,
  createInvoiceSubItemSchema,
  type ZodCreateInvoiceSchema,
} from "@/zod-schemas/invoice/create-invoice";
import Papa from "papaparse";
type Item = ZodCreateInvoiceSchema["items"][number];
export interface CsvIssue {
  row: number;
  column: string;
  message: string;
}
export interface CsvImportResult {
  items: Item[];
  issues: CsvIssue[];
}
export const csvColumns = [
  "row_type",
  "item_ref",
  "name",
  "description",
  "text",
  "quantity",
  "unit_price",
  "amount",
  "hours",
];
export const invoiceCsvGuide = [
  {
    title: "Start here",
    text: "Keep the nine column headers unchanged. Replace the example data rows with your own. Rows with row_type comment are instructions only; keep or delete them. Put comment instructions in the text column and leave other fields blank.",
  },
  {
    title: "Parent items",
    text: "Use row_type item with a unique item_ref and a required name. Optional description is the parent description. quantity defaults to 1 and must be a positive whole number; unit_price defaults to 0 and must be nonnegative with at most two decimal places.",
  },
  {
    title: "Link sub-items",
    text: "Every child row uses its parent's item_ref. Child rows may appear before or after the parent. Multiple children share a reference; each parent reference must be unique. Leave columns not used by that row type blank.",
  },
  {
    title: "Text and names",
    text: "row_type text requires text. row_type name requires name. Both are descriptive and do not change the price.",
  },
  {
    title: "Hours",
    text: "row_type hours requires name and nonnegative hours (for example 2.5). Hours are descriptive and never add a charge. Use quantity_price for billable hourly work.",
  },
  {
    title: "Fixed amounts",
    text: "row_type priced requires name and a nonnegative amount. This amount is added once, independently of the parent's quantity.",
  },
  {
    title: "Quantity and price",
    text: "row_type quantity_price requires name, positive quantity (decimals allowed), and nonnegative unit_price. Its charge is quantity multiplied by unit_price, added once independently of the parent's quantity. For hourly work enter hours in quantity and the hourly rate in unit_price.",
  },
  {
    title: "Totals and currency",
    text: "Item total = parent quantity times parent unit_price plus fixed amounts and quantity_price charges. Zero prices are allowed. Enter plain numbers with decimal points, without currency symbols or thousands separators. Select the currency on the invoice; CSV does not set it.",
  },
  {
    title: "CSV text",
    text: 'Save as UTF-8 CSV. Quote fields containing commas or line breaks; double any quote within a quoted field. For example: "Review, testing and delivery". Spreadsheet apps normally handle quoting when saving CSV.',
  },
  {
    title: "Review and save",
    text: "Upload or paste, then review before adding items to the current draft. Invalid batches add nothing. Valid imports append to existing items and do not save the invoice. Save separately. Limit: 1 MB and 1,000 data rows; comment rows do not count toward the row limit.",
  },
] as const;

const number = (value: string | undefined) => (value?.trim() ? Number(value) : NaN);
export function parseInvoiceCsv(source: string): CsvImportResult {
  const issues: CsvIssue[] = [];
  if (source.length > 1024 * 1024)
    return { items: [], issues: [{ row: 1, column: "file", message: "CSV must be under 1 MB" }] };
  const parsed = Papa.parse<Record<string, string>>(source.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  for (const e of parsed.errors) issues.push({ row: (e.row ?? 0) + 2, column: "row", message: e.message });
  const headers = parsed.meta.fields ?? [];
  for (const h of ["row_type", "item_ref"])
    if (!headers.includes(h)) issues.push({ row: 1, column: h, message: "Required header is missing" });
  for (const h of headers)
    if (!csvColumns.includes(h)) issues.push({ row: 1, column: h, message: "Unknown or duplicate header" });
  const isComment = (row: Record<string, string>) => row.row_type?.trim() === "comment";
  const dataRows = parsed.data.filter((row) => !isComment(row));
  if (dataRows.length > 1000) issues.push({ row: 1, column: "file", message: "Use at most 1,000 rows per import" });
  const parents = new Map<string, Item>();
  const rows = parsed.data;
  rows.forEach((row, index) => {
    if (isComment(row)) return;
    const ref = row.item_ref?.trim() ?? "";
    if (!ref) issues.push({ row: index + 2, column: "item_ref", message: "Parent item reference is required" });
    if (row.row_type?.trim() !== "item") return;
    if (parents.has(ref)) {
      issues.push({ row: index + 2, column: "item_ref", message: "Duplicate parent item reference" });
      return;
    }
    const result = createInvoiceItemSchema.safeParse({
      name: row.name ?? "",
      description: row.description ?? "",
      quantity: row.quantity?.trim() ? number(row.quantity) : 1,
      unitPrice: row.unit_price?.trim() ? number(row.unit_price) : 0,
      subItems: [],
    });
    if (!result.success) {
      for (const e of result.error.issues)
        issues.push({
          row: index + 2,
          column: e.path[0] === "unitPrice" ? "unit_price" : String(e.path[0]),
          message: e.message,
        });
      return;
    }
    parents.set(ref, result.data);
  });
  rows.forEach((row, index) => {
    const type = row.row_type?.trim();
    if (type === "item" || isComment(row)) return;
    const parent = parents.get(row.item_ref?.trim() ?? "");
    if (!parent)
      issues.push({ row: index + 2, column: "item_ref", message: "Parent item was not found or is invalid" });
    const candidate =
      type === "text"
        ? { type, text: row.text ?? "" }
        : type === "hours"
          ? { type, name: row.name ?? "", hours: number(row.hours) }
          : type === "quantity_price"
            ? { type, name: row.name ?? "", quantity: number(row.quantity), unitPrice: number(row.unit_price) }
            : type === "priced"
              ? { type, name: row.name ?? "", amount: number(row.amount) }
              : { type, name: row.name ?? "" };
    const result = createInvoiceSubItemSchema.safeParse(candidate);
    if (!result.success)
      for (const e of result.error.issues)
        issues.push({
          row: index + 2,
          column:
            e.path[0] === "type"
              ? "row_type"
              : e.path[0] === "unitPrice"
                ? "unit_price"
                : String(e.path[0] ?? "row_type"),
          message: e.message,
        });
    else if (parent) parent.subItems!.push(result.data);
  });
  if (!dataRows.length) issues.push({ row: 2, column: "row", message: "Add at least one item" });
  return { items: issues.length ? [] : [...parents.values()], issues };
}
export const invoiceCsvTemplate = Papa.unparse({
  fields: csvColumns,
  data: [
    ...invoiceCsvGuide.map(({ title, text }) => ["comment", "", "", "", `${title}: ${text}`, "", "", "", ""]),
    ["item", "service-1", "Development", "Main service", "", 1, 0, "", ""],
    ["text", "service-1", "", "", "Review and delivery", "", "", "", ""],
    ["name", "service-1", "Support included", "", "", "", "", "", ""],
    ["priced", "service-1", "License", "", "", "", "", 25, ""],
    ["hours", "service-1", "Planning", "", "", "", "", "", 2.5],
    ["quantity_price", "service-1", "Implementation", "", "", 3.5, 100, "", ""],
  ],
});
