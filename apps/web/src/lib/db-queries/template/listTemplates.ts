import { db, schema } from "@invoicely/db";
import { eq } from "drizzle-orm";

export const listTemplatesQuery = async (userId: string) => {
  return db
    .select({
      id: schema.invoiceTemplates.id,
      name: schema.invoiceTemplates.name,
      createdAt: schema.invoiceTemplates.createdAt,
    })
    .from(schema.invoiceTemplates)
    .where(eq(schema.invoiceTemplates.userId, userId))
    .orderBy(schema.invoiceTemplates.createdAt);
};
