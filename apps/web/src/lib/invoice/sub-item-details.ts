import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { formatCurrencyText } from "@/constants/currency";
import { getSubItemAmount } from "./item-totals";
export type SubItem = NonNullable<ZodCreateInvoiceSchema["items"][number]["subItems"]>[number];
export function subItemDetails(sub: SubItem, currency: string): { label: string; value: string }[] {
  if (sub.type === "hours") return [{ label: "Hours", value: String(sub.hours) }];
  if (sub.type === "priced") return [{ label: "Amount", value: formatCurrencyText(currency, sub.amount) }];
  if (sub.type === "quantity_price")
    return [
      { label: "Quantity", value: String(sub.quantity) },
      { label: "Unit price", value: formatCurrencyText(currency, sub.unitPrice) },
      { label: "Amount", value: formatCurrencyText(currency, getSubItemAmount(sub).toNumber()) },
    ];
  return [];
}
