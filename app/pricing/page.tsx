import { PricingTable, UserButton } from "@clerk/nextjs";
import Link from "next/link";
export default function PricingPage() {
  return (
    <main className="pricing-page">
      <nav className="public-nav">
        <Link href="/" className="brand">
          Circuit & Co.
          <span className="brand-dot" />
        </Link>
        <Link href="/dashboard">My account</Link>
        <UserButton />
      </nav>
      <div className="pricing-intro">
        <h1>A little extra help from Scout.</h1>
        <p>
          Pro gives you your own shopping companion for product recommendations,
          order help, and managing your cart. USD 20 per month.
        </p>
        <p className="muted">
          Development environment. Checkout uses test payments.
        </p>
      </div>
      <PricingTable for="user" />
      <p className="pricing-note">
        Already subscribed? <Link href="/dashboard">Open your account</Link>.
      </p>
    </main>
  );
}
