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
  if (parsed.data.length > 1000) issues.push({ row: 1, column: "file", message: "Use at most 1,000 rows per import" });
  const parents = new Map<string, Item>();
  const rows = parsed.data;
  rows.forEach((row, index) => {
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
    if (type === "item") return;
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
  if (!rows.length) issues.push({ row: 2, column: "row", message: "Add at least one item" });
  return { items: issues.length ? [] : [...parents.values()], issues };
}
export const invoiceCsvTemplate = Papa.unparse({
  fields: csvColumns,
  data: [
    ["item", "service-1", "Development", "Main service", "", 1, 0, "", ""],
    ["text", "service-1", "", "", "Review and delivery", "", "", "", ""],
    ["name", "service-1", "Support included", "", "", "", "", "", ""],
    ["priced", "service-1", "License", "", "", "", "", 25, ""],
    ["hours", "service-1", "Planning", "", "", "", "", "", 2.5],
    ["quantity_price", "service-1", "Implementation", "", "", 3.5, 100, "", ""],
  ],
});
