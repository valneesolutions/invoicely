import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name cannot be empty"),
  data: createInvoiceSchema,
});

export type ZodCreateTemplateSchema = z.infer<typeof createTemplateSchema>;
