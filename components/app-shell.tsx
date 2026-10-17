"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  Users,
  ShoppingBag,
  Sparkles,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Ask Ledger", icon: Sparkles },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <ChartNoAxesCombined aria-hidden="true" size={25} />
          Ledger
          <span className="brand-dot" />
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">L</span>
          <div>
            My workspace<small>Business intelligence</small>
          </div>
          <span className="pro-tag">Pro</span>
        </div>
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
              {href === "/chat" && <span className="new-tag">AI</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="dataset-note">
            <span className="status-dot" />
            <span>
              Demo workspace<small>Synthetic data, real insights</small>
            </span>
          </div>
          <Link href="/pricing" className="nav-link">
            <CreditCard size={19} aria-hidden="true" />
            Manage subscription
            <ArrowUpRight size={15} />
          </Link>
          <div className="account-row">
            <UserButton showName />
            <span className="subtle-badge">Personal</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <span>
            {navigation.find((n) => path.startsWith(n.href))?.label ??
              "Workspace"}
          </span>
          <div>
            <span className="demo-badge">Sample business data</span>
            <span className="topbar-divider" />
            USD <span className="muted">/ UTC</span><span className="mobile-account"><UserButton /></span>
          </div>
        </header>
        <main id="main-content" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
