import { InternalServerError, NotFoundError } from "@/lib/effect/error/trpc";
import { getTemplateQuery } from "@/lib/db-queries/template/getTemplate";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { ERROR_MESSAGES } from "@/constants/issues";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

export const getTemplate = authorizedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const effect = Effect.gen(function* () {
      const template = yield* Effect.tryPromise({
        try: () => getTemplateQuery(input.id, ctx.auth.user.id),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      if (!template) {
        return yield* new NotFoundError({ message: ERROR_MESSAGES.TEMPLATE_NOT_FOUND });
      }

      return template;
    });

    return Effect.runPromise(
      effect.pipe(
        Effect.catchTags({
          NotFoundError: (error) => Effect.fail(new TRPCError({ code: "NOT_FOUND", message: error.message })),
          InternalServerError: (error) =>
            Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
        }),
      ),
    );
  });
