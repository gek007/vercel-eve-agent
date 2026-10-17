import { defineTool } from "eve/tools";
import { trendFilter } from "../../lib/data/contracts";
import { queryBusiness } from "../../lib/data/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Compare completed revenue over an inclusive UTC period to the preceding equal-length period.",
  inputSchema: trendFilter,
  async execute(input, ctx) {
    return queryBusiness(requireToolCaller(ctx), {
      operation: "trends",
      ...input,
    });
  },
});
