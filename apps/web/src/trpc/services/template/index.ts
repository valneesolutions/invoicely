import { createTRPCRouter } from "@/trpc/init";
import { insertTemplate } from "./insertTemplate";
import { listTemplates } from "./listTemplates";
import { getTemplate } from "./getTemplate";
import { deleteTemplate } from "./deleteTemplate";

export const templateRouter = createTRPCRouter({
  insert: insertTemplate,
  list: listTemplates,
  get: getTemplate,
  delete: deleteTemplate,
});
