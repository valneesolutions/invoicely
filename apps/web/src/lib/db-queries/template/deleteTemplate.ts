import { db, schema } from "@invoicely/db";
import { and, eq } from "drizzle-orm";

export const deleteTemplateQuery = async (id: string, userId: string) => {
  await db
    .delete(schema.invoiceTemplates)
    .where(and(eq(schema.invoiceTemplates.id, id), eq(schema.invoiceTemplates.userId, userId)));
};
