import { defineTool } from "eve/tools";
import { z } from "zod";
import { queryShop } from "../../lib/shop/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "List the authenticated shopper’s own orders, or inspect a specific order ID returned by the list. Every order is simulated; no real charge or fulfillment occurs.",
  inputSchema: z
    .object({
      orderId: z.string().max(200).optional(),
      page: z.number().int().min(0).max(1000).default(0),
      limit: z.number().int().min(1).max(40).default(12),
    })
    .strict(),
  execute(input, ctx) {
    return queryShop(
      requireToolCaller(ctx),
      input.orderId
        ? { operation: "order", orderId: input.orderId }
        : { operation: "orders", page: input.page, limit: input.limit },
    );
  },
});
