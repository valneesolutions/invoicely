import { db, schema } from "@invoicely/db";
import { and, eq } from "drizzle-orm";

export const getTemplateQuery = async (id: string, userId: string) => {
  const [template] = await db
    .select()
    .from(schema.invoiceTemplates)
    .where(and(eq(schema.invoiceTemplates.id, id), eq(schema.invoiceTemplates.userId, userId)));

  return template ?? null;
};
