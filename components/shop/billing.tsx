"use client";
import { PricingTable, useClerk } from "@clerk/nextjs";
import { CreditCard, Bot } from "lucide-react";
export function Billing({ isPro }: { isPro: boolean }) {
  const clerk = useClerk();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your membership</h1>
          <p>A little extra help for your everyday finds.</p>
        </div>
        <button
          className="button secondary"
          onClick={() => clerk.openUserProfile()}
        >
          <CreditCard size={16} />
          Manage subscription
        </button>
      </div>
      <section className="membership-card">
        <span className="chat-avatar">
          <Bot size={24} />
        </span>
        <div>
          <span className="shop-kicker">
            {isPro ? "Your Pro membership" : "Meet Scout"}
          </span>
          <h2>
            {isPro
              ? "Your shopping companion is ready."
              : "Good advice, whenever you need it."}
          </h2>
          <p>
            Shop, cart, and demo orders are included for every account. Pro adds
            Scout: product recommendations, order help, and a hand with your
            cart.
          </p>
        </div>
        <div className="membership-price">
          <strong>
            $20<span>/ month</span>
          </strong>
          <small>Individual membership · USD</small>
        </div>
      </section>
      <div className="billing-table">
        <PricingTable for="user" />
      </div>
      <p className="pricing-note">
        Development billing uses test payments. Product checkout is always
        simulated.
      </p>
    </>
  );
}
