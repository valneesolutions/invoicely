import { replaceInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { InternalServerError, NotFoundError } from "@/lib/effect/error/trpc";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

const EditInvoiceSchema = z.object({
  id: z.string(),
  invoice: createInvoiceSchema,
});

export const editInvoice = authorizedProcedure.input(EditInvoiceSchema).mutation(async ({ input, ctx }) => {
  const { id, invoice } = input;

  // Edit Invoice Effect
  const editInvoiceEffect = Effect.gen(function* () {
    // Get the old invoice
    const oldInvoice = yield* Effect.tryPromise({
      try: () => getInvoiceQuery(id, ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    // Check if the invoice exists
    if (!oldInvoice) {
      return yield* new NotFoundError({ message: ERROR_MESSAGES.INVOICE_NOT_FOUND });
    }

    yield* Effect.tryPromise({
      try: () => replaceInvoiceQuery(invoice, ctx.auth.user.id, oldInvoice.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    // Return the success message
    return {
      success: true,
      message: SUCCESS_MESSAGES.INVOICE_EDITED,
    };
  });

  // Run the effect
  return Effect.runPromise(
    editInvoiceEffect.pipe(
      Effect.catchTags({
        NotFoundError: (error) => Effect.fail(new TRPCError({ code: "NOT_FOUND", message: error.message })),
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
