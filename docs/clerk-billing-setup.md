# Clerk B2C billing setup

Verified on 2026-10-17 using the installed Clerk CLI.

- Application: `vercel-eve-agent`
- Application ID: `app_3KnYwZrfRDmhFDiDrJbe4xX983Y`
- Development instance ID: `ins_3KnYwgNPiHxuginFK4lUcnW44OX`
- Billing for individual users: enabled
- Billing for organizations: disabled
- Default `free_user` plan: created by Clerk
- Paid user plan slug: `pro`
- Pro pricing: USD 20/month (2,000 cents), recurring individual subscription
- Free trial: disabled

The project is linked locally through `clerk link`. Local Clerk state and keys
are ignored by Git. Development billing is configured separately from production
payment setup.

## Repeatable baseline

`config/clerk/b2c.json` expresses the B2C-only billing toggles and the verified
Pro user plan. Applying it as a partial patch preserves the default free plan.

Preview and apply only to this application's development instance:

```sh
clerk config patch --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --file config/clerk/b2c.json --dry-run
clerk config patch --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --file config/clerk/b2c.json --yes
clerk config pull --app app_3KnYwZrfRDmhFDiDrJbe4xX983Y --instance dev --keys billing
```

The Pro patch was previewed, applied, and fetched back from Clerk to verify
`payer_type: "user"`, `amount: 2000`, `currency: "usd"`, and recurring billing.
No annual price was configured. Inspect the current CLI schema before changing
pricing or enabling an annual option.

## Application integration requirements

Render a user-scoped Clerk PricingTable and manage subscriptions through Clerk.
The server must verify both the signed-in user and `has({ plan: 'pro' })` before
allowing protected requests. Pricing-table visibility is presentation, not
authorization. The default free plan must not grant agent access.

References: [Clerk B2C billing](https://clerk.com/docs/guides/billing/for-b2c),
the installed CLI's `clerk config schema --keys billing`, and the project design
specification.
