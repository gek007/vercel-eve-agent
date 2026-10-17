import { defineTool } from "eve/tools";
import { z } from "zod";
import { queryShop } from "../../lib/shop/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Read the authenticated shopper’s cart count, personal order count, completed simulated spending, and recent orders.",
  inputSchema: z.object({}).strict(),
  execute(_input, ctx) {
    return queryShop(requireToolCaller(ctx), { operation: "overview" });
  },
});
