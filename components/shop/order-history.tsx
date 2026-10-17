"use client";
import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import type { OrderPage, OrderDetail } from "@/lib/shop/contracts";
import { money } from "@/lib/format";
import { shopFetch } from "./http";
export function OrderHistory({
  initial,
  detail: initialDetail,
}: {
  initial: OrderPage;
  detail?: OrderDetail;
}) {
  const [data, setData] = useState(initial),
    [detail, setDetail] = useState(initialDetail),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function open(id: string) {
    setBusy(true);
    setError("");
    try {
      const r = await shopFetch<OrderDetail>({
        operation: "order",
        orderId: id,
      });
      setDetail(r);
      window.history.replaceState(
        null,
        "",
        `/orders?order=${encodeURIComponent(id)}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function page(n: number) {
    setBusy(true);
    try {
      setData(
        await shopFetch<OrderPage>({ operation: "orders", page: n, limit: 12 }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your orders</h1>
          <p>Good choices, all in one place.</p>
        </div>
        <Link className="button secondary" href="/shop">
          Back to the shop
        </Link>
      </div>
      {error && (
        <p className="error-notice" role="alert">
          {error}
        </p>
      )}
      {detail ? (
        <section className="panel order-detail">
          <button
            className="text-link"
            onClick={() => {
              setDetail(undefined);
              window.history.replaceState(null, "", "/orders");
            }}
          >
            <ArrowLeft size={15} />
            All orders
          </button>
          <header>
            <div>
              <h2>{detail.order.reference}</h2>
              <p>
                {new Date(detail.order.createdAt).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  dateStyle: "long",
                })}{" "}
                · Simulated order
              </p>
            </div>
            <span className={`status ${detail.order.status}`}>
              <span />
              {detail.order.status}
            </span>
          </header>
          {detail.lines.map((l, i) => (
            <div className="detail-line" key={i}>
              <div>
                <strong>{l.name}</strong>
                <small>
                  {l.sku} · {l.quantity} × {money(l.unitPriceCents)}
                </small>
              </div>
              <strong>{money(l.quantity * l.unitPriceCents)}</strong>
            </div>
          ))}
          <footer>
            <span>Total · USD</span>
            <strong>{money(detail.order.totalCents)}</strong>
          </footer>
          <p className="demo-checkout-note">
            This is a simulated order. No payment was taken.
          </p>
        </section>
      ) : !data.total ? (
        <div className="empty-state">
          <Package size={38} />
          <h2>Your first order starts here.</h2>
          <p>Find something you like in the shop, then place a demo order.</p>
          <Link className="button" href="/shop">
            Browse products
          </Link>
        </div>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date (UTC)</th>
                  <th>Status</th>
                  <th className="numeric">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.reference}</strong>
                      <small>Simulated order</small>
                    </td>
                    <td>
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <span className={`status ${o.status}`}>
                        <span />
                        {o.status}
                      </span>
                    </td>
                    <td className="numeric">{money(o.totalCents)}</td>
                    <td>
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() => void open(o.id)}
                      >
                        View order
                        <span className="sr-only"> {o.reference}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>{data.total} orders</span>
            <div>
              <button
                className="button secondary"
                disabled={busy || !data.page}
                onClick={() => void page(data.page - 1)}
              >
                Previous
              </button>
              <button
                className="button secondary"
                disabled={busy || (data.page + 1) * data.limit >= data.total}
                onClick={() => void page(data.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
