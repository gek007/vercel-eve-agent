import { defineTool } from "eve/tools";
import { cartToolSchema } from "../../lib/shop/contracts";
import { mutateShop } from "../../lib/shop/client";
import { requireToolCaller } from "../lib/caller";
export default defineTool({
  description:
    "Change the current shopper’s cart only when explicitly requested. Add increments quantity; set assigns an absolute quantity, with zero removing an item. Ask for clarification before changing an ambiguous product or quantity. This does not place an order.",
  inputSchema: cartToolSchema,
  async execute(input, ctx) {
    const parsed = cartToolSchema.parse(input);
    return mutateShop(requireToolCaller(ctx), {
      operation: parsed.action === "add" ? "cart.add" : "cart.set",
      productId: parsed.productId,
      quantity: parsed.quantity,
      operationId: `${ctx.session.id}:${ctx.callId}`,
    });
  },
});
