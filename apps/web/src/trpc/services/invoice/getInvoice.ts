import { resolveAssetBaseUrl, resolveStoredAssetUrl } from "@/lib/cloudflare/r2/asset-url";
import { InternalServerError, NotFoundError } from "@/lib/effect/error/trpc";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { ERROR_MESSAGES } from "@/constants/issues";
import { env } from "@invoicely/utilities";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

const getInvoiceSchema = z.object({
  id: z.string(),
});

export const getInvoice = authorizedProcedure.input(getInvoiceSchema).query(async ({ input, ctx }) => {
  // Get Invoice Effect
  const getInvoiceEffect = Effect.gen(function* () {
    // Get the invoice
    const invoice = yield* Effect.tryPromise({
      try: () => getInvoiceQuery(input.id, ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    // Check if the invoice exists
    if (!invoice) {
      return yield* new NotFoundError({ message: ERROR_MESSAGES.INVOICE_NOT_FOUND });
    }

    // Return the invoice
    return {
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
    };
  });

  // Run the effect
  return Effect.runPromise(
    getInvoiceEffect.pipe(
      Effect.catchTags({
        // If the invoice is not found, return a not found error
        NotFoundError: (error) => Effect.fail(new TRPCError({ code: "NOT_FOUND", message: error.message })),
        // If the invoice retrieval fails, return an internal server error
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
