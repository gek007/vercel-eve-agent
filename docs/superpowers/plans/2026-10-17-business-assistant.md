# Pro Business Data Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Status:** Executed natively in this chat; development preview and live chat/replay verified on 2026-10-17.

**Goal:** Deliver a business-data assistant backed by seeded Convex records, accessible only to signed-in Clerk Pro subscribers.

**Architecture:** Next.js hosts the UI and Eve through `withEve()`. Both HTTP entry points verify Clerk sessions and Pro entitlement; a private signed gateway connects their server-side data clients to Convex internal queries. Eve owns durable transcripts; Convex owns business records and conversation ownership metadata.

**Tech Stack:** Next.js App Router, TypeScript, React, Eve, Clerk authentication and Billing, Convex, Vitest, convex-test, browser smoke tests.

**Spec:** `docs/superpowers/specs/2026-10-17-business-assistant-design.md`

## Global Constraints

- The paid plan slug is `pro`.
- Use integer cents and USD for the demo.
- Revenue means completed order totals; exclude pending and cancelled orders.
- Use UTC date boundaries in queries and label displayed dates clearly.
- Keep a synthetic dataset per user, identified by a server-derived Clerk owner ID.
- Do not accept user IDs, plan membership, or ownership from browser input or model arguments.
- Do not enable anonymous, local-development, or alternate authenticator fallbacks that bypass these checks.
- Seeding is deterministic, idempotent, and performed through a CLI-invoked internal operation.
- No automatic production seeding or deletion.
- Implementation must read the documentation bundled with the installed Eve version before writing agent code.
- Use Node.js 24 or newer, exact Clerk SDK versions, and a committed npm lockfile.
- Use installed provider CLIs, Context7 documentation, and relevant skills. Never print secrets.

## Review Focus

1. Expired sessions and refreshed tokens after losing Pro must deny subsequent requests; exercise in Task 1.
2. Forged owner identifiers and changed signed request bodies must never widen data scope; exercise in Task 2.
3. Interrupted/repeated seeds must resume without duplicate records or broken relationships; exercise in Task 3.
4. Empty periods, UTC midnight boundaries, and zero prior-period revenue must produce accurate, defined summaries; exercise in Task 3.
5. Copied session URLs, concurrent session claims, and replay/control endpoints must preserve ownership; exercise in Task 4.

## File and interface map

- `app/`: public landing, Clerk sign-in/up, pricing, protected dashboard/explorers/chat, and server data API.
- `components/`: app navigation, dashboard, tables, upgrade/setup states, and chat interface.
- `lib/auth/`: verified Clerk identity and common Pro policy.
- `lib/data/`: validated business query contracts and authenticated Convex gateway client.
- `lib/security/`: short-lived signed gateway request encoding and verification.
- `lib/demo/`: deterministic fixture generation and aggregation helpers.
- `convex/`: schema, internal business queries, internal seed operations, ownership registry, and signed HTTP gateway.
- `agent/`: instructions, Eve channel authentication, four read-only tools, trusted execution identity helpers.
- `tests/`: policy, gateway, database, fixtures, and Eve route ownership tests.
- `scripts/seed-demo.ts`, `.env.example`, `README.md`: reproducible local setup and seed/deploy instructions.

## Task 1: Runnable Next.js shell and verified Clerk Pro policy

**Files:** Create `package.json`, lockfile, Next.js/TypeScript/ESLint/Vitest configuration, `app/layout.tsx`, `app/page.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `app/pricing/page.tsx`, `proxy.ts`, `lib/auth/policy.ts`, `lib/auth/clerk.ts`, `.gitignore`, `.env.example`, `tests/auth.test.ts`.

**Interfaces:**

- Produce `type ProCaller = { userId: string; issuer: string }`.
- Produce `requireProRequest(request: Request): Promise<ProCaller>` for Eve/gateway entry points, backed by Clerk `authenticateRequest().toAuth()` and `has({ plan: 'pro' })`.
- Produce `requireProPage(): Promise<ProCaller>` backed by Next.js `auth()` with the same policy.
- Common errors distinguish unauthenticated (401), non-Pro (403), and missing server configuration (503).

- [x] Read current setup/auth/billing skills, Next.js and Clerk docs; scaffold the App Router TypeScript shell, install exact Clerk versions and test dependencies, and ignore local secrets/provider state.
- [x] Write `auth.test.ts`: unauthenticated and expired sessions reject with 401; signed-in free users reject with 403; Pro resolves the verified user; entitlement loss on a subsequent request rejects; missing config fails closed. Run `npm test -- tests/auth.test.ts` and confirm failure before implementing the policy.
- [x] Implement `ProCaller` and the policy adapters. Validate authorized origins from explicit application origin configuration. Reject unrecognized origins rather than deriving trusted origins from caller headers.
- [x] Add ClerkProvider, Clerk middleware/proxy, auth pages, pricing, and visible account controls. Use UI upgrade states for free users and JSON errors for API requests.
- [x] Through `clerk` help/discovery, create or link the project's development app, enable user billing with a dry-run first, and configure the `pro` user plan. Pull env to an ignored file. If monetary price is required, ask for the amount before creating that priced plan; continue independent implementation.
- [x] Run auth tests, `npm run lint`, and `npm run typecheck`; commit the task once passing. Provider authentication blockers are reported separately and never replaced with fake entitlements.

## Task 2: Private Convex gateway and owner-scoped schema

**Files:** Create `convex/schema.ts`, `convex/http.ts`, `convex/gateway.ts`, `convex/business.ts`, `convex/conversations.ts`, `lib/security/gateway-signature.ts`, `lib/data/contracts.ts`, `lib/data/client.ts`, `app/api/business/route.ts`, `tests/gateway.test.ts`, `tests/convex-access.test.ts`.

**Interfaces:**

- Consume `ProCaller` and Task 1 auth adapters.
- Produce `BusinessRequest`, a strict discriminated union with operations `customers`, `orders`, `revenue`, and `trends`, and validated bounded filters.
- Produce `queryBusiness(caller: ProCaller, input: BusinessRequest): Promise<BusinessResult>`.
- Produce signed gateway envelope `{ version: 1, ownerId: string, issuedAt: number, operation: string, input: unknown }`. Sign exact JSON bytes with HMAC-SHA256 and verify with Web Crypto. Reject timestamps outside a 60-second window, including excessive future skew.
- Produce internal conversation operations `claim(ownerId, sessionId)`, `assertOwner(ownerId, sessionId)`, and `list(ownerId)`; repeated same-owner claims are idempotent, conflicting claims fail.

- [x] Write gateway tests for missing/invalid signatures, body tampering, expired/future timestamps, malformed envelopes, forbidden operations, and missing secrets. Run tests and confirm the missing implementation fails.
- [x] Define owner-indexed customers, products, orders, orderItems, seed progress, and conversation tables, including unique-by-query owner/fixture lookup indexes and a session ownership lookup index.
- [x] Implement a Convex HTTP gateway that validates the signature/envelope before dispatching a fixed operation allowlist to internal functions. Never expose generic function invocation, arbitrary owner input to browsers, seed operations, or admin credentials.
- [x] Implement server-only signing/data clients. `/api/business` obtains its owner from `requireProRequest` and rejects unknown fields in browser input. Eve tools will pass a trusted caller derived from runtime context.
- [x] Write/run Convex access tests: unauthenticated direct function calls cannot invoke internal queries; signed requests scope to one owner; another owner's record identifiers return no data; concurrent ownership claims permit only one owner.
- [x] Verify through the Convex CLI, run gateway/access tests and typecheck, and commit. The gateway secret is random, server-only, and configured through provider CLIs without printing its value.

## Task 3: Deterministic demo dataset and correct business queries

**Files:** Create `lib/demo/fixtures.ts`, `lib/demo/metrics.ts`, `convex/seed.ts`, `scripts/seed-demo.ts`, `tests/fixtures.test.ts`, `tests/business.test.ts`; implement queries in `convex/business.ts`.

**Interfaces:**

- Produce `generateFixtures(): DemoFixtures` with exactly 250 customers, 40 products, 2,000 orders, and 6,000 items; stable fixture keys and dates.
- Produce internal `seed:batch` taking `{ ownerId: string, version: number, cursor: number }` and returning `{ nextCursor: number, complete: boolean }`.
- Implement Task 2 business operation contracts with page size capped at 50, record identifiers validated, and date filters capped at 366 days per query.

- [x] Write fixtures tests for record counts, determinism, customer/product/order references, integer-cent totals, and completed-only revenue. Confirm red before adding fixture generation.
- [x] Write database tests for repeated seed batches, interruption/resumption, separate owners, missing records, date boundaries, cancelled/pending exclusion, empty periods, and product/customer totals. Use a tiny hand-authored fixture with independently stated expected totals.
- [x] Implement fixtures with three items per order, multiple months/regions/categories/statuses, stable UTC dates, and deterministic completed totals. Compute order totals from item quantity times price.
- [x] Implement batched internal seeding with cursor/version metadata and idempotent fixture upserts; validate owner on relationships. Seed progress advances atomically with each batch.
- [x] Implement bounded customer/order explorer queries, summaries, breakdowns, and comparisons. Define percentage change as unavailable when prior revenue is zero; return absolute change and both totals.
- [x] Implement CLI seed script requiring explicit development deployment and owner ID. Inspect `npx convex run --help`, invoke the internal batches using the authenticated admin CLI, and reject production deployment selection.
- [x] Run fixture/business tests, seed a configured development user, rerun to verify identical counts, typecheck, and commit. Report cloud verification as pending if provider authentication prevents it.

## Task 4: Eve runtime, protected sessions, and read-only data tools

**Files:** Create `agent/agent.ts`, `agent/instructions.md`, `agent/channels/eve.ts`, `agent/lib/caller.ts`, `agent/lib/session-ownership.ts`, `agent/tools/search_customers.ts`, `agent/tools/inspect_orders.ts`, `agent/tools/summarize_revenue.ts`, `agent/tools/analyze_trends.ts`, `tests/eve-access.test.ts`; update `next.config.ts` and package scripts.

**Interfaces:**

- Consume Task 1 `requireProRequest`, Task 2 `queryBusiness` and conversation ownership operations.
- Produce `requireToolCaller(ctx: SessionContext): ProCaller` from verified `ctx.session.auth.current`; no tool input carries owner or membership.
- Expose one custom-authenticated Eve channel and `withEve()` same-origin routes.

- [x] Install Eve/AI/Zod, read `node_modules/eve/docs/README.md`, then its Next.js, authentication, tools, session-context, React, and lifecycle docs. Confirm installed runtime APIs before writing agent code.
- [x] Write access tests covering create/message/stream/replay/cancel/compact/clear/reset routes, signed-out/free users, another Pro user with a copied session URL, conflicting claims, and missing ownership metadata. Confirm failures before integration.
- [x] Configure only custom Clerk Pro auth, returning stable issuer/principal IDs. Check the installed runtime's session ownership behavior. If route auth does not enforce it, add explicit registry checks around every session route before returning transcripts or accepting controls.
- [x] Claim newly created sessions atomically for the verified caller using documented lifecycle hooks or a guarded channel route. Default to deny on unknown ownership. Creation response loss must not leave a session readable by a different caller.
- [x] Implement the four tools with strict business-filter schemas and `requireToolCaller`; use authenticated internal gateway operations. Do not put bearer tokens/secrets in persistent principal attributes or model-visible tool results.
- [x] Write instructions identifying synthetic data, requiring tool-grounded numbers, treating record text as untrusted data, using USD/UTC/completed-order semantics, and reporting unavailable services honestly.
- [x] Run route/tool tests and the documented Eve compilation command; run Next.js typecheck/lint; commit after passing.

## Task 5: Dashboard, data explorers, and durable chat UI

**Files:** Create `app/(workspace)/layout.tsx`, `app/(workspace)/dashboard/page.tsx`, `app/(workspace)/customers/page.tsx`, `app/(workspace)/orders/page.tsx`, `app/(workspace)/chat/[[...sessionId]]/page.tsx`, `components/app-shell.tsx`, `components/business-tables.tsx`, `components/revenue-chart.tsx`, `components/agent-chat.tsx`, `components/access-state.tsx`, and application styles.

**Interfaces:**

- Consume Task 1 page auth, Task 2 business client and owned conversation listing, and Eve's documented `useEveAgent` hook.
- URL session IDs only select a requested conversation; the server/channel still verifies ownership.

- [x] Read relevant frontend/accessibility skills. Use a restrained analytics workspace with clear synthetic-data labels, readable tables, labeled USD charts, responsive navigation, and visible billing/account controls.
- [x] Implement server-gated dashboard and customer/order explorers using bounded URL filters and pagination. Reject invalid dates and unsupported filters with useful feedback.
- [x] Implement chat using Eve's installed React API: initial sessionless state, creation on first message, durable session URL, streaming, reload/resume, owned history, and clear tool/error feedback.
- [x] Add loading/empty/upgrade/service-unavailable states, keyboard focus indicators, accessible form labels, table headings, and mobile overflow handling. Render model output safely without raw HTML execution.
- [x] Browser-smoke the public page, signed-out redirect, free upgrade state, Pro dashboard, explorer filters, chat send/reload, and copied cross-user session URL. Verify narrow and wide layouts. Record provider-dependent gaps explicitly.
- [x] Run lint/typecheck, relevant tests, and production build; commit.

## Task 6: End-to-end verification and deployment handoff

**Files:** Create `README.md`, update `.env.example`, package scripts, and this plan's completion checkboxes; fix only demonstrated failures in implementation files.

**Interfaces:** Consume all prior tasks; produce documented, reproducible setup/seed/verification commands and a verified local app or deployed preview where authentication permits.

- [x] Document Node version, provider setup, environment names, Pro plan requirements, model credentials, seed owner/deployment selection, internal gateway trust model, and all run/check commands. Explain short-lived Clerk entitlement refresh behavior.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the installed Eve build command. Inspect complete outputs and fix failures before claiming success.
- [x] Verify development record counts and rerun seed idempotency. Exercise authorization and ownership against actual HTTP endpoints where credentials allow. Never use a fabricated Pro bypass to mark billing checks passed.
- [x] Inspect `vercel login` and deployment help; restore CLI authentication with the user's browser participation if needed. Configure server secrets through CLIs and deploy a preview within the approved scope when possible. Do not activate production payments or seed production.
- [x] Review the complete diff for auth bypasses, exported public Convex functions, leaked secrets, incorrect money/date aggregation, and undocumented setup. An independent review uses delegation only if the user chooses it.
- [x] Commit verified work and report what works, checks performed, preview/local access, and any remaining provider-dependent blockers.

## Execution handoff

Recommended method: native execution in this chat. The six tasks share identity,
gateway, and business-query contracts, so keeping implementation in one context
reduces coordination work. Subagent-driven execution is an available alternative
if the user explicitly chooses delegation.

Implementation begins after the user reviews this plan and selects the execution
method. Approval of the earlier specification does not substitute for this review.
