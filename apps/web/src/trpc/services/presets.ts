import {
  listSavedClients,
  createSavedClient,
  updateSavedClient,
  deleteSavedClient,
  getPreferences,
  updatePreferences,
} from "@/lib/db-queries/account-presets";
import { savedClientSchema, paymentPreferencesSchema } from "@/zod-schemas/invoice/presets";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
const idInput = z.object({ id: z.string().uuid() });
export const clientsRouter = createTRPCRouter({
  list: authorizedProcedure.query(({ ctx }) => listSavedClients(ctx.auth.user.id)),
  create: authorizedProcedure
    .input(savedClientSchema)
    .mutation(({ ctx, input }) => createSavedClient(ctx.auth.user.id, input)),
  update: authorizedProcedure
    .input(savedClientSchema.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;
      const row = await updateSavedClient(ctx.auth.user.id, id, values);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      return row;
    }),
  delete: authorizedProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const row = await deleteSavedClient(ctx.auth.user.id, input.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
    return row;
  }),
});
export const preferencesRouter = createTRPCRouter({
  get: authorizedProcedure.query(({ ctx }) => getPreferences(ctx.auth.user.id)),
  update: authorizedProcedure
    .input(paymentPreferencesSchema)
    .mutation(({ ctx, input }) => updatePreferences(ctx.auth.user.id, input)),
});
