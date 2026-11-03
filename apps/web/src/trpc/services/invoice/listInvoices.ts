import { resolveAssetBaseUrl, resolveStoredAssetUrl } from "@/lib/cloudflare/r2/asset-url";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { InternalServerError } from "@/lib/effect/error/trpc";
import { env } from "@invoicely/utilities";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const listInvoices = authorizedProcedure.query(async ({ ctx }) => {
  // List Invoices Effect
  const listInvoicesEffect = Effect.gen(function* () {
    // Fetch invoices from the database
    const invoices = yield* Effect.tryPromise({
      try: () => listInvoicesQuery(ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    // Map the invoices to the response format
    return invoices.map((invoice) => ({
      ...invoice,
      invoiceFields: {
        ...invoice.invoiceFields,
        companyDetails: {
          ...invoice.invoiceFields.companyDetails,
          logo: resolveStoredAssetUrl(
            invoice.invoiceFields.companyDetails.logo,
            resolveAssetBaseUrl({
              publicBaseUrl: env.NEXT_PUBLIC_ASSET_BASE_URL,
              endpoint: env.AWS_ENDPOINT_URL_S3,
              bucket: env.AWS_BUCKET_NAME,
            }),
          ),
          signature: resolveStoredAssetUrl(
            invoice.invoiceFields.companyDetails.signature,
            resolveAssetBaseUrl({
              publicBaseUrl: env.NEXT_PUBLIC_ASSET_BASE_URL,
              endpoint: env.AWS_ENDPOINT_URL_S3,
              bucket: env.AWS_BUCKET_NAME,
            }),
          ),
        },
        metadata: {
          notes: invoice.invoiceFields.metadata?.notes ?? "",
          terms: invoice.invoiceFields.metadata?.terms ?? "",
          paymentInformation: invoice.invoiceFields.metadata?.paymentInformation ?? [],
        },
        items: invoice.invoiceFields.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toNumber(),
          subItems: item.subItems ?? [],
        })),
        invoiceDetails: {
          ...invoice.invoiceFields.invoiceDetails,
          billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((billingDetail) => ({
            ...billingDetail,
            value: billingDetail.value.toNumber(),
          })),
        },
      },
    }));
  });

  // Run the effect
  return Effect.runPromise(
    listInvoicesEffect.pipe(
      Effect.catchTags({
        // If the invoice list retrieval fails, return an internal server error
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
