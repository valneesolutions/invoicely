import { cloudflareRouter } from "@/trpc/services/cloudflare";
import { templateRouter } from "@/trpc/services/template";
import { invoiceRouter } from "@/trpc/services/invoice";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  invoice: invoiceRouter,
  cloudflare: cloudflareRouter,
  template: templateRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
