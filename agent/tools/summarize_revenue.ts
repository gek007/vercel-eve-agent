import { defineTool } from "eve/tools";
import { revenueFilter } from "../../lib/data/contracts";
import { queryBusiness } from "../../lib/data/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Summarize completed order revenue in USD cents by month, product, customer, or region.",
  inputSchema: revenueFilter,
  async execute(input, ctx) {
    return queryBusiness(requireToolCaller(ctx), {
      operation: "revenue",
      ...input,
    });
  },
});
