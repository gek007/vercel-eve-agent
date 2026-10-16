# Clerk B2C billing setup

Verified on 2026-10-17 using the installed Clerk CLI.

- Application: `vercel-eve-agent`
- Application ID: `app_3KnYwZrfRDmhFDiDrJbe4xX983Y`
- Development instance ID: `ins_3KnYwgNPiHxuginFK4lUcnW44OX`
- Billing for individual users: enabled
- Billing for organizations: disabled
- Default `free_user` plan: created by Clerk
- Intended paid user plan slug: `pro`
- Pro pricing: waiting for the user's currency, amount, and billing interval

The project is linked locally through `clerk link`. Local Clerk state and keys
are ignored by Git. Development billing is configured separately from production
payment setup.

## Repeatable baseline

`config/clerk/b2c.json` expresses the B2C-only billing toggles. It intentionally
omits plan definitions so applying it preserves configured plans.

Preview and apply only to this application's development instance:

```sh
clerk config patch --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --file config/clerk/b2c.json --dry-run
clerk config patch --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --file config/clerk/b2c.json --yes
clerk config pull --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --keys billing
```

After pricing is provided, create `billing.plans.pro` using the CLI's current
configuration schema, with `payer_type: "user"`. Preview the patch before
applying it, and fetch billing configuration afterward to verify the result.
Clerk's `amount` field represents monthly price in cents; inspect the current
schema before setting annual pricing.

## Application integration requirements

Render a user-scoped Clerk PricingTable and manage subscriptions through Clerk.
The server must verify both the signed-in user and `has({ plan: 'pro' })` before
allowing protected requests. Pricing-table visibility is presentation, not
authorization. The default free plan must not grant agent access.

References: [Clerk B2C billing](https://clerk.com/docs/guides/billing/for-b2c),
the installed CLI's `clerk config schema --keys billing`, and the project design
specification.
