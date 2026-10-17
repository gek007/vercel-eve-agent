"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  ShoppingBasket,
  Minus,
  Plus,
  Trash2,
  Check,
  ArrowRight,
} from "lucide-react";
import type {
  CartResult,
  CheckoutResult,
  ShopWrite,
} from "@/lib/shop/contracts";
import { money } from "@/lib/format";
import { ProductArt } from "./product-art";
import { shopFetch, shopWrite, ShopRequestError } from "./http";
// Tab-scoped storage preserves reload recovery without another tab erasing it.
// Storage can be unavailable; the React retry state still protects same-tab retries.
function clearPendingCheckout(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* In-memory state is authoritative for this tab. */
  }
}
type PendingCheckout = Extract<ShopWrite, { operation: "checkout" }>;
export function Cart({ initial }: { initial: CartResult }) {
  const { userId } = useAuth();
  const [cart, setCart] = useState(initial),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [placed, setPlaced] = useState<CheckoutResult | null>(null),
    [retry, setRetry] = useState<PendingCheckout | null>(null);
  const key = `circuit-checkout:${userId}`;
  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(key);
        if (saved) setRetry(JSON.parse(saved));
      } catch {
        clearPendingCheckout(key);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId, key]);
  async function update(productId: string, quantity: number) {
    setBusy(productId);
    setError("");
    try {
      const result = await shopWrite({
        operation: "cart.set",
        productId,
        quantity,
        operationId: crypto.randomUUID(),
      });
      if (result.kind === "cart") setCart(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function checkout() {
    if (!userId) return;
    setBusy("checkout");
    setError("");
    const input = retry ?? {
      operation: "checkout" as const,
      checkoutKey: crypto.randomUUID(),
      revision: cart.revision,
      expectedTotalCents: cart.totalCents,
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(input));
    } catch {
      /* Continue with the same request retained in React state. */
    }
    setRetry(input);
    try {
      const result = await shopWrite(input);
      if (result.kind === "checkout") {
        setPlaced(result);
        clearPendingCheckout(key);
        setRetry(null);
        setCart(await shopFetch<CartResult>({ operation: "cart" }));
      }
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ShopRequestError && e.status < 500) {
        clearPendingCheckout(key);
        setRetry(null);
        setCart(await shopFetch<CartResult>({ operation: "cart" }));
      }
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your cart</h1>
          <p>A few good things, ready when you are.</p>
        </div>
        <Link className="text-link" href="/shop">
          Keep exploring <ArrowRight size={16} />
        </Link>
      </div>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      {placed && (
        <section className="order-success" role="status">
          <span>
            <Check size={25} />
          </span>
          <div>
            <h2>Your demo order is placed.</h2>
            <p>
              {placed.reference} · {money(placed.totalCents)} · No payment was
              taken.
            </p>
          </div>
          <Link
            className="button"
            href={`/orders?order=${encodeURIComponent(placed.orderId)}`}
          >
            View order
          </Link>
        </section>
      )}
      {retry && (
        <div className="shop-notice">
          <p>
            A checkout request is pending. Check its result safely using the
            same request.
          </p>
          <button
            className="button"
            disabled={!!busy}
            onClick={() => void checkout()}
          >
            Check order result
          </button>
        </div>
      )}
      {!cart.lines.length ? (
        <div className="empty-state">
          <ShoppingBasket size={38} />
          <h2>Your cart has room for something good.</h2>
          <p>Browse the collection and add your everyday essentials.</p>
          <Link className="button" href="/shop">
            Explore the shop
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          <section className="cart-lines panel" aria-label="Cart items">
            {cart.lines.map((l) => (
              <article className="cart-line" key={l.product.id}>
                <ProductArt
                  visual={l.product.visual}
                  category={l.product.category}
                />
                <div className="cart-line-copy">
                  <span className="product-category">{l.product.category}</span>
                  <h2>{l.product.name}</h2>
                  <p>{money(l.product.priceCents)} each</p>
                  <div className="quantity-control">
                    <button
                      disabled={!!busy || !!retry}
                      aria-label={`Decrease ${l.product.name} quantity`}
                      onClick={() => void update(l.product.id, l.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span aria-label={`${l.product.name} quantity`}>
                      {l.quantity}
                    </span>
                    <button
                      disabled={!!busy || !!retry || l.quantity >= 20}
                      aria-label={`Increase ${l.product.name} quantity`}
                      onClick={() => void update(l.product.id, l.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-line-end">
                  <strong>{money(l.product.priceCents * l.quantity)}</strong>
                  <button
                    className="icon-button"
                    disabled={!!busy || !!retry}
                    aria-label={`Remove ${l.product.name}`}
                    onClick={() => void update(l.product.id, 0)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </section>
          <aside className="order-summary panel">
            <h2>A little summary</h2>
            <div>
              <span>Subtotal ({cart.quantity} items)</span>
              <strong>{money(cart.totalCents)}</strong>
            </div>
            <div>
              <span>Shipping & tax</span>
              <span>Not simulated</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(cart.totalCents)}</strong>
            </div>
            <p className="demo-checkout-note">
              Demo checkout — no payment will be taken.
            </p>
            <button
              className="button"
              disabled={!!busy || !!retry || !userId}
              onClick={() => void checkout()}
            >
              {busy === "checkout" ? "Placing your order…" : "Place demo order"}
              <ArrowRight size={16} />
            </button>
            <p className="summary-footnote">
              Your order is saved to your account. All amounts are in USD.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
