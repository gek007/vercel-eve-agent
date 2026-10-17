import { defineTool } from "eve/tools";
import { customerFilter } from "../../lib/data/contracts";
import { queryBusiness } from "../../lib/data/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Search the current member's customers by name, company, email, or region.",
  inputSchema: customerFilter,
  async execute(input, ctx) {
    return queryBusiness(requireToolCaller(ctx), {
      operation: "customers",
      ...input,
    });
  },
});
