import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  Users,
  ChartNoAxesCombined,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { requireProPage } from "@/lib/auth/page";
import { queryBusiness } from "@/lib/data/client";
import { RevenueChart } from "@/components/revenue-chart";
import { OrdersTable } from "@/components/business-tables";
import { AccessState } from "@/components/access-state";
import { money, number } from "@/lib/format";
export default async function Dashboard() {
  const caller = await requireProPage();
  let result;
  try {
    result = await queryBusiness(caller, {
      operation: "revenue",
      groupBy: "month",
    });
  } catch {
    return (
      <AccessState message="We couldn’t reach your business data. Try again in a moment." />
    );
  }
  if (result.kind !== "revenue") return null;
  if (!result.seeded)
    return (
      <AccessState
        title="Your workspace is ready for data"
        message="Your private demo dataset hasn’t been prepared yet. Ask your workspace administrator to seed your account."
      />
    );
  const stats = [
    {
      label: "Completed revenue",
      value: money(result.revenueCents),
      detail: "Completed orders only",
      icon: Wallet,
    },
    {
      label: "Total orders",
      value: number(result.totalOrders),
      detail: `${number(result.completedOrders)} completed`,
      icon: ShoppingBag,
    },
    {
      label: "Customers",
      value: number(result.customers),
      detail: "Across 5 regions",
      icon: Users,
    },
    {
      label: "Average order value",
      value: money(result.averageOrderCents),
      detail: "Per completed order",
      icon: ChartNoAxesCombined,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your business at a glance</h1>
          <p>A little perspective on the numbers that matter.</p>
        </div>
        <span className="date-chip">
          <CalendarDays size={16} aria-hidden="true" />
          Jan 1 – Sep 30, 2026
        </span>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <section className="stat" key={label}>
            <div className="stat-heading">
              {label}
              <Icon size={17} aria-hidden="true" />
            </div>
            <div className="stat-value">{value}</div>
            <p>{detail}</p>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue over time</h2>
              <p>Completed orders, in USD</p>
            </div>
            <span className="legend">
              <span />
              Revenue
            </span>
          </div>
          <RevenueChart groups={result.groups} />
        </section>
        <section className="assistant-card">
          <div className="assistant-symbol">
            <Sparkles size={23} aria-hidden="true" />
          </div>
          <span className="assistant-caption">Meet your analyst</span>
          <h2>
            There’s a story
            <br />
            in your numbers.
          </h2>
          <p>
            Ask Ledger to find it. Explore trends, compare revenue, or get to
            know your best customers.
          </p>
          <Link className="button" href="/chat">
            Ask a question
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <div className="assistant-example">
            “Which products bring in the most revenue?”
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent orders</h2>
            <p>The latest activity in your demo business</p>
          </div>
          <Link className="text-link" href="/orders">
            View all orders
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <OrdersTable rows={result.recentOrders} />
      </section>
      <p className="data-footnote">
        Synthetic dataset · Revenue excludes pending and cancelled orders · All
        dates in UTC
      </p>
    </>
  );
}
