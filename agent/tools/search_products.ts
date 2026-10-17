import { defineTool } from "eve/tools";
import { catalogFilter } from "../../lib/shop/contracts";
import { queryShop } from "../../lib/shop/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Search the shared Circuit & Co. catalog by text, category, and optional maximum budget in USD cents. Use product IDs from results for cart changes.",
  inputSchema: catalogFilter,
  execute(input, ctx) {
    return queryShop(requireToolCaller(ctx), {
      operation: "catalog",
      ...input,
    });
  },
});
