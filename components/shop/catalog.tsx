"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Plus, ArrowRight, Check } from "lucide-react";
import type { CatalogPage } from "@/lib/shop/contracts";
import { money } from "@/lib/format";
import { ProductArt } from "./product-art";
import { shopFetch, shopWrite } from "./http";
const categories = [
  "All",
  "Audio",
  "Desk",
  "Charging",
  "Accessories",
  "Travel",
];
export function Catalog({ initial }: { initial: CatalogPage }) {
  const [data, setData] = useState(initial),
    [category, setCategory] = useState("All"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("featured"),
    [pending, setPending] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  async function load(page = 0, nextCategory = category) {
    setPending("load");
    setError("");
    try {
      setData(
        await shopFetch<CatalogPage>({
          operation: "catalog",
          search,
          sort,
          page,
          limit: 12,
          ...(nextCategory === "All" ? {} : { category: nextCategory }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  async function add(id: string, name: string) {
    setPending(id);
    setError("");
    try {
      await shopWrite({
        operation: "cart.add",
        productId: id,
        quantity: 1,
        operationId: crypto.randomUUID(),
      });
      setNotice(`${name} added to your cart.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  return (
    <>
      <section className="shop-intro">
        <div>
          <span className="shop-kicker">The everyday collection</span>
          <h1>Good things. Thoughtfully picked.</h1>
          <p>
            Useful tech and small upgrades for the way you work, listen, and go.
          </p>
        </div>
        <Link href="/agent" className="button secondary">
          Find your next favorite <ArrowRight size={16} />
        </Link>
      </section>
      <div className="catalog-controls">
        <div className="category-tabs" aria-label="Product categories">
          {categories.map((c) => (
            <button
              key={c}
              className={c === category ? "selected" : ""}
              disabled={!!pending}
              onClick={() => {
                setCategory(c);
                void load(0, c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="catalog-search"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <Search size={17} />
          <input
            id="product-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find something useful…"
          />
          <label className="sr-only" htmlFor="product-sort">
            Sort products
          </label>
          <select
            id="product-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
          <button className="button" disabled={!!pending}>
            Search
          </button>
        </form>
      </div>
      {error && (
        <p className="error-notice" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <div className="shop-notice" role="status">
          <Check size={16} />
          {notice}
          <Link href="/cart">View cart</Link>
        </div>
      )}
      <div className="catalog-count">
        {data.total} considered essentials <span>Prices in USD</span>
      </div>
      <div className="product-grid" aria-busy={pending === "load"}>
        {data.rows.map((p) => (
          <article className="product-card" key={p.id}>
            <ProductArt sku={p.sku} name={p.name} category={p.category} />
            <div className="product-copy">
              <span className="product-category">{p.category}</span>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <div className="product-actions">
                <strong>{money(p.priceCents)}</strong>
                <button
                  className="button secondary"
                  disabled={!!pending}
                  onClick={() => void add(p.id, p.name)}
                  aria-label={`Add ${p.name} to cart`}
                >
                  <Plus size={15} />
                  {pending === p.id ? "Adding…" : "Add to cart"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!data.rows.length && (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try a different search or category.</p>
        </div>
      )}
      <div className="pagination">
        <span>
          {data.total ? data.page * data.limit + 1 : 0}–
          {Math.min((data.page + 1) * data.limit, data.total)} of {data.total}
        </span>
        <div>
          <button
            className="button secondary"
            disabled={!!pending || data.page === 0}
            onClick={() => void load(data.page - 1)}
          >
            Previous
          </button>
          <button
            className="button secondary"
            disabled={!!pending || (data.page + 1) * data.limit >= data.total}
            onClick={() => void load(data.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
