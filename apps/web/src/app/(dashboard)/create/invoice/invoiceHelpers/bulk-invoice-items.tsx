"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { parseInvoiceCsv, invoiceCsvTemplate, type CsvImportResult } from "@/lib/invoice/import-csv";
import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { SubItemSummary } from "@/components/invoice/sub-item-summary";
import { getInvoiceItemTotal } from "@/constants/pdf-helpers";
import { formatCurrencyText } from "@/constants/currency";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { toast } from "sonner";
type Item = ZodCreateInvoiceSchema["items"][number];
export function BulkInvoiceItems({
  form,
  append,
}: {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
  append: (items: Item[]) => void;
}) {
  const [open, setOpen] = useState(false),
    [source, setSource] = useState(""),
    [preview, setPreview] = useState<CsvImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const currency = form.watch("invoiceDetails.currency");
  const template = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF", invoiceCsvTemplate], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice-items-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
          Upload CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(true);
            setPreview(null);
          }}
        >
          Paste CSV
        </Button>
        <Button type="button" variant="ghost" onClick={template}>
          Download template
        </Button>
        <input
          ref={fileInput}
          aria-label="Upload item CSV"
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > 1024 * 1024) {
              toast.error("CSV must be under 1 MB");
              return;
            }
            try {
              const text = await file.text();
              setSource(text);
              setPreview(parseInvoiceCsv(text));
              setOpen(true);
            } catch {
              toast.error("Could not read CSV file");
            }
          }}
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import invoice items</DialogTitle>
            <DialogDescription>
              Review the CSV before adding it to this draft. Existing items stay in place. This does not save the
              invoice.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="invoice-csv" className="text-sm">
            CSV contents
          </label>
          <textarea
            id="invoice-csv"
            className="bg-background min-h-36 w-full rounded border p-3 font-mono text-xs"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPreview(null);
            }}
          />
          <Button type="button" variant="outline" onClick={() => setPreview(parseInvoiceCsv(source))}>
            Review CSV
          </Button>
          {preview && (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {preview.issues.length ? (
                <ul role="alert" className="text-destructive text-sm">
                  {preview.issues.map((issue, i) => (
                    <li key={i}>
                      Row {issue.row}, {issue.column}: {issue.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p>
                    {preview.items.length} items ·{" "}
                    {preview.items.reduce((n, item) => n + (item.subItems?.length ?? 0), 0)} sub-items
                  </p>
                  {preview.items.map((item, i) => (
                    <div key={i} className="rounded border p-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs whitespace-pre-wrap">{item.description}</p>
                      <p className="text-xs">
                        Quantity: {item.quantity} · Unit price: {formatCurrencyText(currency, item.unitPrice)}
                      </p>
                      {item.subItems?.map((sub, j) => (
                        <SubItemSummary key={j} sub={sub} currency={currency} />
                      ))}
                      <p className="text-sm">Total: {formatCurrencyText(currency, getInvoiceItemTotal(item))}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!preview || !!preview.issues.length || !preview.items.length}
              onClick={() => {
                if (!preview || preview.issues.length) return;
                append(structuredClone(preview.items));
                setOpen(false);
                setSource("");
                setPreview(null);
              }}
            >
              Add items to draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
