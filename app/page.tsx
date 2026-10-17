import Link from "next/link";
import {
  CircuitBoard,
  ArrowRight,
  Bot,
  Package,
  ShoppingBasket,
} from "lucide-react";
import { ProductArt } from "@/components/shop/product-art";
import { shopCatalog } from "@/lib/shop/catalog";
import { money } from "@/lib/format";
export default function Home() {
  return (
    <main className="landing">
      <nav className="public-nav">
        <Link href="/" className="brand shop-brand">
          <CircuitBoard aria-hidden="true" />
          <span>Circuit &amp; Co.</span>
        </Link>
        <div className="public-links">
          <Link href="/shop">Shop</Link>
          <Link href="/pricing">Membership</Link>
          <Link href="/sign-in" className="button secondary">
            Sign in
          </Link>
        </div>
      </nav>
      <section className="shopping-hero">
        <div>
          <span className="shop-kicker">
            Helpful tech, thoughtfully picked.
          </span>
          <h1>
            Small upgrades.
            <br />
            Better everydays.
          </h1>
          <p>
            Find the things that make your desk calmer, your music better, and
            your day a little easier.
          </p>
          <div className="hero-actions">
            <Link className="button large" href="/shop">
              Explore the collection <ArrowRight size={18} />
            </Link>
            <Link className="text-link" href="/agent">
              Meet Scout
            </Link>
          </div>
        </div>
        <div className="hero-product-scene">
          <div className="scene-main">
            <ProductArt
              sku="CC-001"
              name="Arc wireless headphones"
              category="Audio"
            />
            <span>Made for your everyday.</span>
          </div>
          <div className="scene-note">
            <Bot size={24} />
            <div>
              <strong>A little help from Scout.</strong>
              <p>Good recommendations start with you.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="shop-featured">
        <div className="panel-heading">
          <div>
            <span className="shop-kicker">Considered essentials</span>
            <h2>A few good places to start.</h2>
          </div>
          <Link className="text-link" href="/shop">
            View the shop <ArrowRight size={16} />
          </Link>
        </div>
        <div className="featured-grid">
          {[
            shopCatalog[0],
            shopCatalog[8],
            shopCatalog[16],
            shopCatalog[33],
          ].map((p) => (
            <Link href="/shop" className="product-card" key={p.sku}>
              <ProductArt sku={p.sku} name={p.name} category={p.category} />
              <div className="product-copy">
                <span className="product-category">{p.category}</span>
                <h2>{p.name}</h2>
                <strong>{money(p.priceCents)}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="feature-strip">
        <div>
          <ShoppingBasket />
          <h2>A shop that feels personal.</h2>
          <p>
            Useful things, clear prices, and a cart that comes back with you.
          </p>
        </div>
        <div>
          <Bot />
          <h2>Find your fit with Scout.</h2>
          <p>
            Pro members get a shopping companion for recommendations and order
            help.
          </p>
        </div>
        <div>
          <Package />
          <h2>Explore at your own pace.</h2>
          <p>
            This development shop uses simulated orders. No real product payment
            is taken.
          </p>
        </div>
      </section>
      <footer className="landing-footer">
        <Link className="brand" href="/">
          Circuit &amp; Co.
        </Link>
        <span>Helpful tech, thoughtfully picked.</span>
        <Link href="/image-credits">Photo credits</Link>
        <Link href="/billing">Membership &amp; billing</Link>
      </footer>
    </main>
  );
}
