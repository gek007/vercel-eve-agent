import { defineTool } from "eve/tools";
import { z } from "zod";
import { queryShop } from "../../lib/shop/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Read the authenticated shopper’s cart, product prices, quantities, and authoritative USD total.",
  inputSchema: z.object({}).strict(),
  execute(_input, ctx) {
    return queryShop(requireToolCaller(ctx), { operation: "cart" });
  },
});
