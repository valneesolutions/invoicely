import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getItemAmount, Money } from "@/lib/invoice/item-totals";

export const getSubTotalValue = (data: ZodCreateInvoiceSchema) => {
  return data.items.reduce((sum, item) => sum.plus(getItemAmount(item)), new Money(0)).toNumber();
};

export const getInvoiceItemTotal = (item: ZodCreateInvoiceSchema["items"][number]) => getItemAmount(item).toNumber();

export const getTotalValue = (data: ZodCreateInvoiceSchema) => {
  const subtotal = getSubTotalValue(data);

  const billingRates = data.invoiceDetails.billingDetails;

  // Calculate the total value based of fixed/percentage billing rates also value can be positive or negative
  let total = new Money(subtotal);

  billingRates.forEach((rate) => {
    if (rate.type === "fixed") {
      // Add or subtract the fixed amount directly
      total = total.plus(rate.value);
    } else if (rate.type === "percentage") {
      // Calculate percentage of subtotal and add/subtract
      const percentageValue = new Money(subtotal).times(rate.value).dividedBy(100);
      total = total.plus(percentageValue);
    }
  });

  return total.toDecimalPlaces(2).toNumber();
};
