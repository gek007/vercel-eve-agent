import { internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import {
  shopReadSchema,
  shopWriteSchema,
  type ShoppingWriteResult,
  type ShopProduct,
  type ShoppingOrder,
  type CartResult,
  type ShoppingReadResult,
} from "../lib/shop/contracts";
export function shopError(code: string, message: string): never {
  throw new ConvexError({ code, message });
}
export function productView(p: Doc<"shopProducts">): ShopProduct {
  return {
    id: p._id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    description: p.description,
    priceCents: p.priceCents,
    visual: p.visual,
    active: p.active,
  };
}
export function orderView(o: Doc<"shoppingOrders">): ShoppingOrder {
  return {
    id: o._id,
    reference: o.reference,
    createdAt: o.createdAt,
    status: o.status,
    currency: o.currency,
    totalCents: o.totalCents,
    source: o.source,
  };
}
export async function cartView(
  ctx: Pick<QueryCtx, "db">,
  ownerId: string,
): Promise<CartResult> {
  const cart = await ctx.db
    .query("shoppingCarts")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .unique();
  const items = await ctx.db
    .query("shoppingCartItems")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .take(41);
  const lines = [];
  for (const item of items) {
    const p = await ctx.db.get(item.productId);
    if (!p)
      shopError(
        "CART_CHANGED",
        "A product is no longer available. Remove it and review your cart.",
      );
    lines.push({ product: productView(p), quantity: item.quantity });
  }
  return {
    kind: "cart",
    revision: cart?.revision ?? 0,
    lines,
    quantity: lines.reduce((s, l) => s + l.quantity, 0),
    totalCents: lines.reduce(
      (s, l) => s + l.product.priceCents * l.quantity,
      0,
    ),
    currency: "USD",
  };
}
export const read = internalQuery({
  args: { ownerId: v.string(), input: v.any() },
  handler: async (
    ctx,
    { ownerId, input: raw },
  ): Promise<ShoppingReadResult> => {
    const input = shopReadSchema.parse(raw);
    if (input.operation === "catalog") {
      let products = (await ctx.db.query("shopProducts").take(200)).filter(
        (p) =>
          p.active &&
          (input.maxPriceCents === undefined ||
            p.priceCents <= input.maxPriceCents) &&
          (!input.category || p.category === input.category) &&
          `${p.name} ${p.description} ${p.sku}`
            .toLowerCase()
            .includes(input.search.toLowerCase()),
      );
      if (input.sort !== "featured")
        products = products.sort(
          (a, b) =>
            (a.priceCents - b.priceCents) *
            (input.sort === "price-asc" ? 1 : -1),
        );
      return {
        kind: "catalog",
        rows: products
          .slice(input.page * input.limit, (input.page + 1) * input.limit)
          .map(productView),
        total: products.length,
        page: input.page,
        limit: input.limit,
      };
    }
    if (input.operation === "cart") return cartView(ctx, ownerId);
    if (input.operation === "order") {
      const id = ctx.db.normalizeId("shoppingOrders", input.orderId);
      const o = id ? await ctx.db.get(id) : null;
      if (!o || o.ownerId !== ownerId)
        shopError("NOT_FOUND", "This order is not available to your account.");
      const items = await ctx.db
        .query("shoppingOrderItems")
        .withIndex("by_owner_order", (q) =>
          q.eq("ownerId", ownerId).eq("orderId", o._id),
        )
        .take(41);
      return {
        kind: "order",
        order: orderView(o),
        lines: items.map((l) => ({
          name: l.name,
          sku: l.sku,
          productId: l.productId,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
        })),
      };
    }
    const orders = await ctx.db
      .query("shoppingOrders")
      .withIndex("by_owner_date", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .take(1000);
    if (input.operation === "overview") {
      const cart = await cartView(ctx, ownerId);
      return {
        kind: "overview",
        cartQuantity: cart.quantity,
        orderCount: orders.length,
        completedSpendCents: orders
          .filter((o) => o.status === "completed")
          .reduce((s, o) => s + o.totalCents, 0),
        recentOrders: orders.slice(0, 5).map(orderView),
      };
    }
    const matches = orders.filter(
      (o) => !input.status || o.status === input.status,
    );
    return {
      kind: "orders",
      rows: matches
        .slice(input.page * input.limit, (input.page + 1) * input.limit)
        .map(orderView),
      total: matches.length,
      page: input.page,
      limit: input.limit,
    };
  },
});

export const write = internalMutation({
  args: { ownerId: v.string(), input: v.any() },
  handler: async (
    ctx,
    { ownerId, input: raw },
  ): Promise<ShoppingWriteResult> => {
    const input = shopWriteSchema.parse(raw);
    if (input.operation === "checkout") {
      const existing = await ctx.db
        .query("shoppingOrders")
        .withIndex("by_owner_checkout", (q) =>
          q.eq("ownerId", ownerId).eq("checkoutKey", input.checkoutKey),
        )
        .unique();
      if (existing)
        return {
          kind: "checkout",
          orderId: existing._id,
          reference: existing.reference,
          totalCents: existing.totalCents,
          simulated: true,
        };
      const cart = await cartView(ctx, ownerId);
      if (cart.revision !== input.revision)
        shopError(
          "CART_CHANGED",
          "Your cart changed. Review the latest items and totals before placing your order.",
        );
      if (!cart.lines.length)
        shopError(
          "EMPTY_CART",
          "Your cart is empty. Add a product before checking out.",
        );
      if (cart.totalCents !== input.expectedTotalCents)
        shopError(
          "CART_CHANGED",
          "Product prices changed. Review your updated total before placing your order.",
        );
      if (cart.lines.some((l) => !l.product.active))
        shopError(
          "CART_CHANGED",
          "A product is no longer available. Remove it before checkout.",
        );
      const prior = await ctx.db
        .query("shoppingOrders")
        .withIndex("by_owner_revision", (q) =>
          q.eq("ownerId", ownerId).eq("cartRevision", input.revision),
        )
        .first();
      if (prior)
        shopError("CART_CHANGED", "This cart has already been ordered.");
      const reference = `CC-${Date.now().toString(36).toUpperCase()}-${input.checkoutKey
        .replace(/[^a-z0-9]/gi, "")
        .slice(-5)
        .toUpperCase()}`;
      const id = await ctx.db.insert("shoppingOrders", {
        ownerId,
        reference,
        createdAt: Date.now(),
        status: "completed",
        currency: "USD",
        totalCents: cart.totalCents,
        source: "checkout",
        checkoutKey: input.checkoutKey,
        cartRevision: cart.revision,
      });
      for (const l of cart.lines) {
        const productId = ctx.db.normalizeId("shopProducts", l.product.id)!;
        await ctx.db.insert("shoppingOrderItems", {
          ownerId,
          orderId: id,
          productId,
          sku: l.product.sku,
          name: l.product.name,
          quantity: l.quantity,
          unitPriceCents: l.product.priceCents,
        });
      }
      const items = await ctx.db
        .query("shoppingCartItems")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect();
      for (const l of items) await ctx.db.delete(l._id);
      const c = await ctx.db
        .query("shoppingCarts")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .unique();
      if (c) await ctx.db.patch(c._id, { revision: c.revision + 1 });
      return {
        kind: "checkout",
        orderId: id,
        reference,
        totalCents: cart.totalCents,
        simulated: true,
      };
    }
    const fingerprint = JSON.stringify({
      operation: input.operation,
      productId: input.productId,
      quantity: input.quantity,
    });
    const receipt = await ctx.db
      .query("shoppingOperations")
      .withIndex("by_owner_operation", (q) =>
        q.eq("ownerId", ownerId).eq("operationId", input.operationId),
      )
      .unique();
    if (receipt) {
      if (receipt.fingerprint !== fingerprint)
        shopError(
          "INVALID_INPUT",
          "This operation ID was reused for a different cart change.",
        );
      return cartView(ctx, ownerId);
    }
    const id = ctx.db.normalizeId("shopProducts", input.productId),
      product = id ? await ctx.db.get(id) : null;
    if (!product || (!product.active && input.quantity !== 0))
      shopError("NOT_FOUND", "This product is not available.");
    const line = await ctx.db
      .query("shoppingCartItems")
      .withIndex("by_owner_product", (q) =>
        q.eq("ownerId", ownerId).eq("productId", product._id),
      )
      .unique();
    const quantity =
      input.operation === "cart.add"
        ? (line?.quantity ?? 0) + input.quantity
        : input.quantity;
    if (quantity > 20)
      shopError("INVALID_INPUT", "Choose at most 20 of each product.");
    if (!line && quantity > 0) {
      const count = (
        await ctx.db
          .query("shoppingCartItems")
          .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
          .take(41)
      ).length;
      if (count >= 40)
        shopError(
          "INVALID_INPUT",
          "Your cart can contain up to 40 different products.",
        );
    }
    if (quantity === 0) {
      if (line) await ctx.db.delete(line._id);
    } else if (line) await ctx.db.patch(line._id, { quantity });
    else
      await ctx.db.insert("shoppingCartItems", {
        ownerId,
        productId: product._id,
        quantity,
      });
    const c = await ctx.db
      .query("shoppingCarts")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .unique();
    if (c) await ctx.db.patch(c._id, { revision: c.revision + 1 });
    else await ctx.db.insert("shoppingCarts", { ownerId, revision: 1 });
    await ctx.db.insert("shoppingOperations", {
      ownerId,
      operationId: input.operationId,
      fingerprint,
    });
    return cartView(ctx, ownerId);
  },
});
