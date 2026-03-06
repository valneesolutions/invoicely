import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES } from "@/constants/issues";
import { db, schema } from "@invoicely/db";
import { v4 as uuidv4 } from "uuid";

export const insertTemplateQuery = async (name: string, data: ZodCreateInvoiceSchema, userId: string) => {
  const [inserted] = await db
    .insert(schema.invoiceTemplates)
    .values({
      id: uuidv4(),
      userId,
      name,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: schema.invoiceTemplates.id });

  if (!inserted) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ template record");
  }

  return inserted.id;
};
