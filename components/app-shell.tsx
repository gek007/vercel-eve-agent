"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  CircuitBoard,
  LayoutDashboard,
  Boxes,
  Package,
  ShoppingBasket,
  Bot,
  CreditCard,
  ChevronRight,
} from "lucide-react";
const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/shop", label: "Shop", icon: Boxes },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/cart", label: "Cart", icon: ShoppingBasket },
  { href: "/agent", label: "Agent", icon: Bot },
  { href: "/billing", label: "Billing", icon: CreditCard },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    { has } = useAuth();
  const isPro = has?.({ plan: "pro" }) ?? false;
  const [quantity, setQuantity] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void fetch("/api/shop?operation=cart", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((r) => {
          if (active && r) setQuantity(r.quantity);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("shop:cart", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("shop:cart", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [path]);
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar shop-sidebar">
        <Link href="/" className="brand shop-brand">
          <CircuitBoard aria-hidden="true" />
          <span>
            Circuit &amp; Co.<small>Helpful tech, thoughtfully picked.</small>
          </span>
        </Link>
        <nav aria-label="Workspace navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={path.startsWith(href) ? "nav-link active" : "nav-link"}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
              {href === "/cart" && quantity > 0 ? (
                <span className="cart-badge" aria-label={`${quantity} items`}>
                  {quantity}
                </span>
              ) : path.startsWith(href) ? (
                <ChevronRight className="nav-chevron" size={16} />
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="scout-plan">
            <span className="pro-tag">
              {isPro ? "Pro member" : "Your companion"}
            </span>
            <p>
              {isPro
                ? "Scout is ready to help."
                : "Find a little extra help with Scout."}
            </p>
            <Link href="/billing">
              {isPro ? "Manage plan" : "Explore Pro"}
              <ChevronRight size={15} />
            </Link>
          </div>
          <div className="account-row">
            <UserButton showName />
            <span className="subtle-badge">Personal</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span className="shop-environment">
            <span className="status-dot" />
            Development shop · simulated orders
          </span>
          <div>
            <span className="member-label">
              {isPro ? "Pro member" : "Personal account"}
            </span>
            <UserButton />
          </div>
        </header>
        <main id="main-content" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
