import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";

/** Repair absent optional sections in older/partially saved invoices without replacing their content. */
export function normalizeInvoiceFields(fields: ZodCreateInvoiceSchema, assetBaseUrl?: string): ZodCreateInvoiceSchema {
  const image = (url?: string | null, base64?: string) => {
    if (base64 && (!url || url.startsWith("blob:"))) return base64;
    if (url?.startsWith("blob:")) return undefined;
    if (url?.startsWith("/") && assetBaseUrl) return `${assetBaseUrl}/${url.replace(/^\/+/, "")}`;
    return url;
  };
  return {
    ...fields,
    companyDetails: {
      ...fields.companyDetails,
      metadata: fields.companyDetails.metadata ?? [],
      logo: image(fields.companyDetails.logo, fields.companyDetails.logoBase64),
      signature: image(fields.companyDetails.signature, fields.companyDetails.signatureBase64),
    },
    clientDetails: { ...fields.clientDetails, metadata: fields.clientDetails.metadata ?? [] },
    invoiceDetails: { ...fields.invoiceDetails, billingDetails: fields.invoiceDetails.billingDetails ?? [] },
    items: fields.items.map((item) => ({ ...item, subItems: item.subItems ?? [] })),
    metadata: {
      ...fields.metadata,
      notes: fields.metadata?.notes ?? "",
      terms: fields.metadata?.terms ?? "",
      paymentInformation: fields.metadata?.paymentInformation ?? [],
    },
  };
}
