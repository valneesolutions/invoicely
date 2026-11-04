import { createInvoiceSchema, type ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { normalizeInvoiceFields } from "@/lib/invoice/normalize-invoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import type { BatchItem } from "drizzle-orm/batch";
import { db, schema } from "@invoicely/db";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import Decimal from "decimal.js";

export interface InvoiceWriteOptions {
  status?: InvoiceStatusType;
  paidAt?: Date | null;
}

/** Build all child rows before submitting one transaction. The parent already exists within that transaction. */
export function invoiceDetailQueries(invoice: ZodCreateInvoiceSchema, invoiceId: string): BatchItem<"pg">[] {
  const f = uuid(),
    company = uuid(),
    client = uuid(),
    details = uuid(),
    metadata = uuid();
  const q: BatchItem<"pg">[] = [
    db.insert(schema.invoiceFields).values({ id: f, invoiceId }),
    db.insert(schema.invoiceCompanyDetails).values({ id: company, invoiceFieldId: f, ...invoice.companyDetails }),
    db.insert(schema.invoiceClientDetails).values({ id: client, invoiceFieldId: f, ...invoice.clientDetails }),
    db.insert(schema.invoiceDetails).values({ id: details, invoiceFieldId: f, ...invoice.invoiceDetails }),
    db
      .insert(schema.invoiceMetadata)
      .values({ id: metadata, invoiceFieldId: f, notes: invoice.metadata.notes, terms: invoice.metadata.terms }),
  ];
  if (invoice.companyDetails.metadata.length)
    q.push(
      db
        .insert(schema.invoiceCompanyDetailsMetadata)
        .values(invoice.companyDetails.metadata.map((x) => ({ id: uuid(), invoiceCompanyDetailsId: company, ...x }))),
    );
  if (invoice.clientDetails.metadata.length)
    q.push(
      db
        .insert(schema.invoiceClientDetailsMetadata)
        .values(invoice.clientDetails.metadata.map((x) => ({ id: uuid(), invoiceClientDetailsId: client, ...x }))),
    );
  if (invoice.invoiceDetails.billingDetails.length)
    q.push(
      db.insert(schema.invoiceDetailsBillingDetails).values(
        invoice.invoiceDetails.billingDetails.map((x) => ({
          id: uuid(),
          invoiceDetailsId: details,
          ...x,
          value: new Decimal(x.value),
        })),
      ),
    );
  if (invoice.items.length)
    q.push(
      db.insert(schema.invoiceItems).values(
        invoice.items.map((x) => ({
          id: uuid(),
          invoiceFieldId: f,
          ...x,
          unitPrice: new Decimal(x.unitPrice),
          subItems: x.subItems ?? [],
        })),
      ),
    );
  if (invoice.metadata.paymentInformation.length)
    q.push(
      db
        .insert(schema.invoiceMetadataPaymentInformation)
        .values(invoice.metadata.paymentInformation.map((x) => ({ id: uuid(), invoiceMetadataId: metadata, ...x }))),
    );
  return q;
}

export async function insertInvoiceQuery(
  input: ZodCreateInvoiceSchema,
  userId: string,
  id = uuid(),
  options: InvoiceWriteOptions = {},
) {
  const invoice = createInvoiceSchema.parse(normalizeInvoiceFields(input));
  await db.batch([
    db
      .insert(schema.invoices)
      .values({ id, userId, type: "server", status: options.status ?? "pending", paidAt: options.paidAt ?? null }),
    ...invoiceDetailQueries(invoice, id),
  ]);
  return id;
}

export async function replaceInvoiceQuery(input: ZodCreateInvoiceSchema, userId: string, id: string) {
  const invoice = createInvoiceSchema.parse(normalizeInvoiceFields(input));
  // Lock the owned parent and keep all its financial status and creation fields.
  // The ownership assertion aborts the batch if the invoice disappeared or belongs to somebody else.
  await db.batch([
    db
      .update(schema.invoices)
      .set({ updatedAt: new Date() })
      .where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId))),
    db.execute(
      sql`SELECT 1 / CASE WHEN EXISTS (SELECT 1 FROM ${schema.invoices} WHERE id = ${id} AND user_id = ${userId}) THEN 1 ELSE 0 END`,
    ),
    db.delete(schema.invoiceFields).where(eq(schema.invoiceFields.invoiceId, id)),
    ...invoiceDetailQueries(invoice, id),
  ]);
  return id;
}
