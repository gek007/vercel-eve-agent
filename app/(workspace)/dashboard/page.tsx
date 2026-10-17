import Link from "next/link";
import {
  ShoppingBasket,
  Package,
  Wallet,
  Bot,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { requireAuthenticatedPage } from "@/lib/auth/page";
import { queryShop } from "@/lib/shop/client";
import { money } from "@/lib/format";
import { AccessState } from "@/components/access-state";
export default async function Dashboard() {
  const caller = await requireAuthenticatedPage();
  let data;
  try {
    data = await queryShop(caller, { operation: "overview" });
  } catch {
    return (
      <AccessState message="Your account overview could not be loaded. Please try again." />
    );
  }
  if (data.kind !== "overview") return null;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="shop-kicker">A little look around</span>
          <h1>Your everyday, upgraded.</h1>
          <p>Your finds, your orders, and a little help from Scout.</p>
        </div>
        <Link className="button" href="/shop">
          Explore the shop <ArrowRight size={16} />
        </Link>
      </div>
      <div className="shopping-stats">
        {[
          {
            label: "In your cart",
            value: String(data.cartQuantity),
            note: "Ready for a closer look",
            icon: ShoppingBasket,
            href: "/cart",
          },
          {
            label: "Your orders",
            value: String(data.orderCount),
            note: "All your demo purchases",
            icon: Package,
            href: "/orders",
          },
          {
            label: "Completed purchases",
            value: money(data.completedSpendCents),
            note: "Simulated spending · USD",
            icon: Wallet,
            href: "/orders",
          },
        ].map((s) => (
          <Link href={s.href} key={s.label} className="stat">
            <div className="stat-heading">
              {s.label}
              <s.icon size={20} />
            </div>
            <div className="stat-value">{s.value}</div>
            <p>{s.note}</p>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your recent orders</h2>
              <p>Thoughtfully picked, recently purchased.</p>
            </div>
            <Link href="/orders" className="text-link">
              All orders <ArrowUpRight size={14} />
            </Link>
          </div>
          {!data.recentOrders.length ? (
            <div className="no-rows">
              No orders yet. Your first find is waiting in the shop.
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th className="numeric">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          className="order-reference"
                          href={`/orders?order=${encodeURIComponent(o.id)}`}
                        >
                          {o.reference}
                        </Link>
                        <small>Simulated order</small>
                      </td>
                      <td>
                        <span className={`status ${o.status}`}>
                          <span />
                          {o.status}
                        </span>
                      </td>
                      <td className="numeric">{money(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <aside className="assistant-card">
          <div className="assistant-symbol">
            <Bot size={24} />
          </div>
          <span className="assistant-caption">
            Meet your shopping companion
          </span>
          <h2>
            A good find
            <br />
            starts with Scout.
          </h2>
          <p>
            Find the right headphones, build a better desk, or check on an
            order. Just ask.
          </p>
          <Link className="button" href="/agent">
            Ask Scout <ArrowUpRight size={17} />
          </Link>
          <div className="assistant-example">
            “What would make my desk a little better?”
          </div>
        </aside>
      </div>
      <section className="shop-overview-note">
        <span className="status-dot" />
        <p>
          Development shop. Orders are simulated, so you can explore without a
          real purchase.
        </p>
      </section>
    </>
  );
}
