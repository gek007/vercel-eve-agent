# Circuit & Co. Shopping App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Convert Ledger into a functioning personal shopping demo with a persistent cart, simulated checkout, private orders, Clerk Billing, and the Pro-only Scout assistant.

**Architecture:** Extend the existing Next.js UI and signed server-to-Convex gateway. Add separate shopping tables and internal transactional functions; preserve analytics records and Eve session ownership. Clerk session checks authorize shopping while the existing Pro check continues to authorize Eve.

**Tech Stack:** Existing pinned Next.js 16, React 19, Convex 1.47, Clerk 7, Eve 0.80.1, OpenAI, Zod, Vitest, convex-test, and Playwright. No additional runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-17-shopping-app-design.md`

## Global Constraints

- Preserve the approved navy, ivory, mint, and coral theme.
- Clerk Pro billing remains USD 20/month using the existing development test gateway.
- Product checkout never charges money.
- All shopping workspace pages and shopping API operations require a real Clerk session.
- Only Agent pages and Eve requests require Clerk's actual `has({ plan: 'pro' })` entitlement.
- Use integer cents throughout. Limit quantities to 1–20 per product and carts to 40 distinct lines.
- Do not seed production. Preserve analytics records and existing private conversations.
- No live product charges, production activation, public redeployment, stock fulfillment, real shipping, refund processing, or external messages.
- Use installed Clerk/Vercel/Convex CLIs for service operations; fetch current documentation and read installed Eve guides before API changes.
- Preserve existing uncommitted theme changes and the user's generated `next-env.d.ts` changes. Stage only task-owned files.

## Review Focus

1. Two browser tabs change the cart before checkout: stale revision must refresh totals without placing an unexpected order. Test in Task 3.
2. Checkout succeeds but the response is lost: retrying the retained key must return one original order, even after the cart is cleared. Test in Tasks 3 and 4.
3. Durable Eve tool execution retries a cart increment: the same session/call identity must apply once. Test in Task 5.
4. Catalog price or active state changes after a cart is displayed: checkout must fail for review rather than silently buy at a different total. Test in Task 3; include expectedTotalCents in checkout input.
5. An existing free user follows an old chat link or guesses another user's order: shopping remains usable, while agent and foreign records remain denied. Test in Tasks 1, 4, and 6.

---

### Task 1: Separate signed-in shopping access from Pro agent access

**Files:** Modify `lib/auth/policy.ts`, `lib/auth/clerk.ts`, `lib/auth/page.ts`, `app/(workspace)/layout.tsx`; test `tests/auth.test.ts`, `tests/eve-access.test.ts`.

**Interfaces:** Produce `AuthenticatedCaller = {userId: string; issuer: string}`; retain `ProCaller` compatibility. Produce `enforceAuthenticated(identity, issuer): AuthenticatedCaller`, `requireAuthenticatedRequest(request): Promise<AuthenticatedCaller>`, and `requireAuthenticatedPage(): Promise<AuthenticatedCaller>`. Preserve `requireProRequest` and `requireProPage` signatures.

- [x] Write access tests: `expect(enforceAuthenticated(freeIdentity, issuer).userId).toBe('free')`; signed-out throws 401; `enforcePro(freeIdentity, issuer)` still throws 403; foreign Origin still fails before data access.
- [x] Run `npx vitest run tests/auth.test.ts tests/eve-access.test.ts`; observe missing helper failures before implementation.
- [x] Implement shared session authentication and separate entitlement enforcement. Change workspace layout to require signed-in access, while existing analytics pages and agent routes retain explicit Pro checks until retired/replaced.
- [x] Run the same tests; expect existing ownership and encoded-route checks plus new access cases to pass.
- [x] Commit task-owned changes as `feat: separate shopper access from Pro agent access`.

### Task 2: Add shopping catalog, order history, and idempotent demo seeding

**Files:** Create `lib/shop/contracts.ts`, `lib/shop/catalog.ts`, `convex/shopping.ts`, `convex/shopSeed.ts`, `scripts/seed-shop.ts`, `tests/shop-data.test.ts`; modify `convex/schema.ts`, generated Convex type declarations through CLI, and `package.json`/lockfile only for `seed:shop` script.

**Interfaces:** Define strict schemas for catalog filter `{search, category?, sort, page, limit}`, order filter `{page, limit, status?}`, and order detail `{orderId}`. Return `ShopProduct`, `CatalogPage`, `ShoppingOrder`, `OrderDetail`, `CartResult`, and `ShoppingOverview` types from `lib/shop/contracts.ts`. All private results exclude owner IDs. Produce internal `shopping.read({ownerId,input})` with operations `catalog`, `cart`, `orders`, `order`, and `overview`.

- [x] Write `tests/shop-data.test.ts` using convex-test: seed twice and assert 40 products, 24 historical orders per seeded owner, valid line totals, no duplicates, and an untouched existing analytics record. Assert unseeded users see the shared catalog but empty private orders.
- [x] Write foreign-detail and pagination tests: Bob cannot read Alice's order ID; invalid filters reject; second page does not repeat first-page order IDs.
- [x] Run `npx vitest run tests/shop-data.test.ts`; expect missing modules/schema/functions to fail.
- [x] Add the seven shopping tables specified in the design plus `shoppingOperations` indexed by owner/operation ID for durable cart-write receipts. Products use stable SKUs. Orders have `by_owner_date`, `by_owner_checkout`, and `by_owner_revision` indexes; items have `by_owner_order`; cart and item indexes enforce owner-scoped lookup conventions.
- [x] Implement 40 curated tech/desk product fixtures in five specified categories, priceCents, descriptions, and illustration keys. Produce deterministic 24-order history with immutable line snapshots. Seed catalog and each owner's history through internal mutations, preserving existing tables. CLI rejects production and requires explicit verified user ID.
- [x] Implement bounded catalog and order reads; `overview` returns cart quantity, order count, completed spending, and five recent orders. New accounts have zero-valued summaries. Signed-in users never need a seed for ordinary shopping.
- [x] Run the data tests; expect PASS. Regenerate Convex code using installed CLI when connected; do not hand-edit generated interfaces.
- [x] Commit as `feat: add shopping catalog and private demo order history`.

### Task 3: Implement persistent cart and atomic duplicate-safe checkout

**Files:** Extend `lib/shop/contracts.ts`, `convex/shopping.ts`; create `tests/shop-cart.test.ts`, `tests/shop-checkout.test.ts`.

**Interfaces:** Produce internal `shopping.write({ownerId,input})`. Write union: `cart.add {productId,quantity,operationId}`, `cart.set {productId,quantity,operationId}`, `checkout {checkoutKey,revision,expectedTotalCents}`. Cart set permits 0 to remove; add permits 1–20. `CartResult` contains revision, lines with catalog data, quantity, totalCents, and currency USD. Checkout returns `{orderId,reference,totalCents,simulated:true}`. Business errors use stable codes `INVALID_INPUT`, `NOT_FOUND`, `CART_CHANGED`, and `EMPTY_CART` mapped to HTTP 400/404/409.

- [x] Write cart tests for increment, absolute set, removal at zero, persistence, owner isolation, unknown/inactive products, quantity 21 rejection, and duplicate operation ID applying exactly once. Reusing an operation ID with a different input must fail.
- [x] Run `npx vitest run tests/shop-cart.test.ts`; observe expected missing implementation failures.
- [x] Implement cart mutations and owner-scoped receipts inside one transaction. Server supplies product prices. Each effective change increments the cart revision; duplicate receipts return the current cart without writing again.
- [x] Run cart tests and verify PASS.
- [x] Write checkout tests: empty rejection; successful immutable snapshots and cleared cart; same key after success returns the same order; different key with stale revision rejects; price/active-state change rejects without clearing; injected invalid line causes no partial writes; foreign owner key cannot retrieve Alice's order. Assert `ordersAfter.length === ordersBefore.length + 1` for duplicate submits.
- [x] Run `npx vitest run tests/shop-checkout.test.ts`; observe missing checkout behavior failures.
- [x] Implement checkout as one internal Convex mutation. Look up successful owner/key receipt before checking cart emptiness. Validate revision and expectedTotalCents, recompute active-product totals, insert order/items, clear lines, advance revision. Reject any invalid state before commit. Mark completed order as simulated; do not call payment APIs.
- [x] Run both suites and verify PASS; commit as `feat: add persistent cart and atomic demo checkout`.

### Task 4: Connect authenticated shopping API and build Circuit & Co. UI

**Files:** Create `lib/shop/client.ts`, `app/api/shop/route.ts`, `components/shop/catalog.tsx`, `components/shop/cart.tsx`, `components/shop/order-history.tsx`, `components/shop/product-art.tsx`, `app/(workspace)/shop/page.tsx`, `app/(workspace)/cart/page.tsx`, `app/(workspace)/billing/page.tsx`; replace shopping-facing contents of `app/(workspace)/dashboard/page.tsx`, `app/(workspace)/orders/page.tsx`; modify `components/app-shell.tsx`, `app/globals.css`, `app/page.tsx`, `app/layout.tsx`, `app/pricing/page.tsx`; retire `app/(workspace)/customers/page.tsx` with redirect. Test `tests/shop-api.test.ts`, `tests/e2e/shopping.spec.ts`.

**Interfaces:** Extend signed envelope allowlist with `shopping.read` and `shopping.write`; keep session and analytics operations unchanged. Produce `queryShop(caller,input): Promise<ShoppingReadResult>` and `mutateShop(caller,input): Promise<ShoppingWriteResult>` using shared gateway signing. `GET /api/shop` accepts validated query filters; `POST /api/shop` accepts the strict write union. Both derive identity from Clerk, never JSON. Render catalog/order/cart components with typed server initial results and refresh from authenticated API after writes.

- [x] Write API tests: unauthenticated GET/POST 401, free shopper allowed, malicious ownerId rejected, bad Origin denied, and typed backend conflicts map to 409. Signed gateway tampering remains rejected.
- [x] Run `npx vitest run tests/shop-api.test.ts tests/gateway.test.ts`; observe missing handler failures.
- [x] Implement internal gateway dispatch with strict operation validation and error mapping; share signing without loosening Pro requirements on old business/session callers. Keep owner IDs outside request schemas.
- [x] Build six-destination navigation and Circuit & Co. brand, mobile grid, Scout sidebar card, cart badge refreshed on navigation and writes. Product art uses reusable inline SVG illustrations keyed by catalog data with accessible product names supplied by card text.
- [x] Build catalog search/category/sort/pagination and pending Add controls; cart quantity/remove controls, totals, and explicit “Place demo order” with “Demo checkout — no payment will be taken”. Retain checkout key in per-user browser storage through network failure, reset only after definite success or a reviewed revision change. Disable duplicate submission while pending.
- [x] Build order history/detail, overview, signed-in Billing using Clerk's existing components, and shopping landing/upgrade copy. Keep Pro checks confined to Agent; make old Customers redirect to overview. Preserve the approved theme and current Clerk appearance configuration.
- [x] Write real-session Playwright journey: add known catalog SKU, set quantity 2, reload and assert persisted quantity/total, place demo order, assert new detail total and empty cart. Add lost-response retry coverage via Playwright response interception and confirm one order is created. Gate test on explicit fixture env; never skip it silently when reporting verification.
- [x] Run API/unit tests and real-session shopping test; inspect 1440px and 390px screenshots of Shop, Cart, Orders, Billing, and Overview with no page-level horizontal overflow.
- [x] Commit as `feat: build Circuit & Co shopping workspace`.

### Task 5: Turn Ledger into Scout with replay-safe cart tools

**Files:** Modify `agent/instructions.md`, `components/agent-chat.tsx`; replace analytics tool files with `agent/tools/search_products.ts`, `agent/tools/view_cart.ts`, `agent/tools/update_cart.ts`, `agent/tools/inspect_orders.ts`, `agent/tools/account_overview.ts`; move chat route to `app/(workspace)/agent/[[...sessionId]]/page.tsx`; make old chat catch-all redirect; modify `components/new-conversation-link.tsx`; test `tests/scout-tools.test.ts`, update `tests/e2e/chat.spec.ts`.

**Interfaces:** Tools use `requireToolCaller(ctx)` unchanged and Task 4 shopping clients. `update_cart` model input is `{action:'add'|'set',productId,quantity}`; server creates operationId `${ctx.session.id}:${ctx.callId}` using documented Eve ToolContext. No model-supplied checkout key or owner. No checkout/cancel/refund/subscription tool exists.

- [x] Read installed Eve `tools/overview.mdx`, `guides/session-context.md`, and current frontend/auth guides. Fetch current Next.js redirects and Clerk entitlement docs for routes being changed.
- [x] Write tool tests proving missing/non-Pro caller rejection, operation ID derived from context, unchanged owner scope, invalid quantity denial, and duplicate cart invocation receipt behavior. Assert exposed tool names exclude checkout and analytics tools.
- [x] Run `npx vitest run tests/scout-tools.test.ts`; observe expected missing tool failures.
- [x] Replace instructions with Scout's factual shopping behavior, explicit-request-only cart edits, ambiguity clarification, honest error reporting, and UI-only order placement. Replace starter prompts, author labels, visible tool activity copy, and session URL updates with `/agent`; redirect `/chat` including session IDs without revealing foreign sessions. Keep session-owner guard and transport unchanged.
- [x] Run tool and Eve ownership tests; expect PASS. Run `npm run build:eve` and inspect output for only the intended shopping tools.
- [x] Run real Pro chat: recommend an actual SKU, explicitly add quantity 1, confirm matching persisted cart; open new conversation and replay the old one. Test free user denied at `/agent` while `/shop` and `/billing` remain accessible.
- [x] Commit as `feat: add Scout shopping tools and protected agent experience`.

### Task 6: Seed development, verify full journeys, and document delivery

**Files:** Modify `README.md`, `docs/verification.md`, `docs/superpowers/specs/2026-10-17-shopping-app-design.md`, and this plan. Add integration assertions to `tests/e2e/shopping.spec.ts` and `tests/e2e/chat.spec.ts` as needed.

**Interfaces:** Consume previous tasks' documented scripts/routes; no new product interfaces.

- [x] Read current CLI help before service commands; use `npx convex dev --once` to deploy schema/functions to the existing development deployment. Use Clerk CLI to verify the demo user identity and current plan; never print secrets or demo passwords.
- [x] Run `npm run seed:shop -- --deployment dev --user VERIFIED_USER_ID` twice; query counts and verify 40 products, 24 seeded orders, no duplicates, and retained analytics counts.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run build:eve`; expect all exit 0. Coordinate build/dev server output to avoid corrupting a running `.next` directory; restart local development afterward if needed.
- [x] Run browser flows using real Clerk users: signed-out access, free shopping/Pro-denied Agent, Pro shopping/chat/replay, foreign order/session denial, billing route, old chat redirects, and mobile six-link navigation. Record actual outcomes and any provider-dependent failures without claiming unrun checks passed.
- [x] Inspect desktop/mobile screenshots and console errors; fix any clipping, missing states, misleading totals, or blocked navigation found. Do not broaden scope into real payments.
- [x] Update setup/seed commands, shopping model, simulated checkout limitations, verification evidence, and plan completion checkboxes. Commit as `docs: document verified shopping app and local setup`.
- [x] Request one whole-change independent review under the execution skill's review workflow, resolve confirmed findings, rerun affected checks, and report the local app URL and verification results. Preserve credentials and local settings; do not publish or push without user direction.
