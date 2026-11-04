import { createInvoiceFieldKeyStringValuesSchema } from "./create-invoice";
import { z } from "zod";
export const savedClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required"),
  address: z.string(),
  metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
});
export const paymentPreferencesSchema = z.object({
  paymentInformation: z.array(createInvoiceFieldKeyStringValuesSchema),
});
export type SavedClientInput = z.infer<typeof savedClientSchema>;
export type PaymentPreferencesInput = z.infer<typeof paymentPreferencesSchema>;
