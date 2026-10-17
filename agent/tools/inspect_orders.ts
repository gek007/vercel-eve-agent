import { defineTool } from "eve/tools";
import { orderFilter } from "../../lib/data/contracts";
import { queryBusiness } from "../../lib/data/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Inspect the current member's orders with date, customer, and status filters.",
  inputSchema: orderFilter,
  async execute(input, ctx) {
    return queryBusiness(requireToolCaller(ctx), {
      operation: "orders",
      ...input,
    });
  },
});
