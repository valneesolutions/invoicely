import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import Decimal from "decimal.js";

export const getSubTotalValue = (data: ZodCreateInvoiceSchema) => {
  return data.items.reduce((acc, item) => acc + getInvoiceItemTotal(item), 0);
};

export const getInvoiceItemTotal = (item: ZodCreateInvoiceSchema["items"][number]) =>
  (item.subItems ?? [])
    .reduce(
      (sum, sub) => (sub.type === "priced" ? sum.plus(sub.amount) : sum),
      new Decimal(item.quantity).times(item.unitPrice),
    )
    .toNumber();

export const getTotalValue = (data: ZodCreateInvoiceSchema) => {
  const subtotal = getSubTotalValue(data);

  const billingRates = data.invoiceDetails.billingDetails;

  // Calculate the total value based of fixed/percentage billing rates also value can be positive or negative
  let total = subtotal;

  billingRates.forEach((rate) => {
    if (rate.type === "fixed") {
      // Add or subtract the fixed amount directly
      total += rate.value;
    } else if (rate.type === "percentage") {
      // Calculate percentage of subtotal and add/subtract
      const percentageValue = (subtotal * rate.value) / 100;
      total += percentageValue;
    }
  });

  return total;
};
