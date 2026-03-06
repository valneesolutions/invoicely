import { ForbiddenError, InternalServerError } from "@/lib/effect/error/trpc";
import { deleteTemplateQuery } from "@/lib/db-queries/template/deleteTemplate";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

export const deleteTemplate = authorizedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const effect = Effect.gen(function* () {
      if (!ctx.auth.user.allowedSavingData) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA });
      }

      yield* Effect.tryPromise({
        try: () => deleteTemplateQuery(input.id, ctx.auth.user.id),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      return { success: true, message: SUCCESS_MESSAGES.TEMPLATE_DELETED };
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
