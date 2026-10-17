import { PricingTable, UserButton } from "@clerk/nextjs";
import Link from "next/link";
export default function PricingPage() {
  return (
    <main className="pricing-page">
      <nav className="public-nav">
        <Link href="/" className="brand">
          Ledger
          <span className="brand-dot" />
        </Link>
        <Link href="/dashboard">Workspace</Link>
        <UserButton />
      </nav>
      <div className="pricing-intro">
        <h1>A clearer picture of your business.</h1>
        <p>
          Pro gives you the business dashboard, data explorer, and your own
          analytics assistant. USD 20 per month.
        </p>
        <p className="muted">
          Development environment. Checkout uses test payments.
        </p>
      </div>
      <PricingTable for="user" />
      <p className="pricing-note">
        Already subscribed? <Link href="/dashboard">Open your workspace</Link>.
      </p>
    </main>
  );
}
