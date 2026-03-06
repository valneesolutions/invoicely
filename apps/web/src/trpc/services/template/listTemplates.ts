import { InternalServerError } from "@/lib/effect/error/trpc";
import { listTemplatesQuery } from "@/lib/db-queries/template/listTemplates";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

export const listTemplates = authorizedProcedure.query(async ({ ctx }) => {
  const effect = Effect.gen(function* () {
    const templates = yield* Effect.tryPromise({
      try: () => listTemplatesQuery(ctx.auth.user.id),
      catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
    });

    return templates;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.catchTags({
        InternalServerError: (error) =>
          Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
      }),
    ),
  );
});
