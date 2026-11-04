import { clientsRouter, preferencesRouter } from "@/trpc/services/presets";
import { cloudflareRouter } from "@/trpc/services/cloudflare";
import { invoiceRouter } from "@/trpc/services/invoice";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  invoice: invoiceRouter,
  clients: clientsRouter,
  preferences: preferencesRouter,
  cloudflare: cloudflareRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
