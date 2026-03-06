import { ForbiddenError, InternalServerError } from "@/lib/effect/error/trpc";
import { insertTemplateQuery } from "@/lib/db-queries/template/insertTemplate";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

export const insertTemplate = authorizedProcedure
  .input(z.object({ name: z.string().min(1, "Template name cannot be empty"), data: createInvoiceSchema }))
  .mutation(async ({ ctx, input }) => {
    const effect = Effect.gen(function* () {
      if (!ctx.auth.user.allowedSavingData) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA });
      }

      const templateId = yield* Effect.tryPromise({
        try: () => insertTemplateQuery(input.name, input.data, ctx.auth.user.id),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      return { success: true, message: SUCCESS_MESSAGES.TEMPLATE_SAVED, templateId };
    });

    return Effect.runPromise(
      effect.pipe(
        Effect.catchTags({
          ForbiddenError: (error) => Effect.fail(new TRPCError({ code: "FORBIDDEN", message: error.message })),
          InternalServerError: (error) =>
            Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
        }),
      ),
    );
  });
