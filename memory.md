# Memory — Stripe Billing Integration

Last updated: 2026-06-23 23:00

## What was built

*   **Database Schema sync**: Updated `admin-service/prisma/schema.prisma` mapping for `organizations` to include `plan` (with `'FREE'` default), `subscription_id`, `plan_expires_at`, and `billing_metadata`, and regenerated the Prisma client.
*   **NestJS Billing Integration**: Created a complete billing workspace in `admin-service` containing `BillingModule`, `BillingService`, `BillingController`, and `BillingWebhookController`. Enabled `{ rawBody: true }` in `main.ts` to support webhook signature checks.
*   **Stripe API Endpoints**: Implemented checkout session generation (`POST /billing/checkout`), customer portal session generation (`POST /billing/portal`), and unauthenticated webhook endpoint (`POST /billing/webhook`) handling subscription creation, updates, renewals, and cancellations.
*   **Access Limits Guard**: Implemented `PlanLimitsGuard` in `admin-service` enforcing limits (max 1 app / 5 members for `FREE`, 5 apps / 50 members for `STARTER`, unlimited for `PROFESSIONAL`/`ENTERPRISE`).
*   **Go Auth JWT Claims**: Updated Go `token_service.go` and `auth_handler.go` to fetch the organization plan and inject the active `"plan"` claim into generated access token JWTs.
*   **Dashboard Billing UI**: Created `dashboard/src/app/dashboard/billing/page.tsx` presenting active plan tags, usage meter progress bars, upgrade checkout cards, and Billing Portal redirects. Embedded a "Billing" navigation link in `SidebarNav.tsx`.

## Decisions made

*   **Payment Processor**: Chose **Stripe** using hosted Stripe Checkout and hosted Billing Portal to avoid custom UI construction for payment methods or invoices.
*   **Plan Caching**: Cached organization subscription plan state inside PostgreSQL, kept in sync by Stripe webhooks, allowing Go auth core to fetch plans during token generation with low database latency.
*   **JWT Claims**: Embedded the active plan in the JWT token payload, allowing the dashboard UI to decode claims client-side to dynamically render components.

## Problems solved

*   **Express metadata type error (TS1272)**: Replaced Express `Request` and `Response` parameter types in the decorated `BillingWebhookController` parameters with `any` to prevent typescript compilation warnings when `emitDecoratorMetadata` is enabled.
*   **Stripe SDK response wrappers**: Safely bypassed type metadata checks on Stripe invoices and subscriptions by utilizing target casts (e.g. `(subscription as any).current_period_end`).
*   **Dashboard dependency errors**: Replaced external `sonner` toast commands in `billing/page.tsx` with elegant inline status alerts (`bg-destructive/10`) to keep the dashboard project self-contained and compile-safe without new dependencies.

## Current state

*   **Build status**: Go `auth-service`, NestJS `admin-service`, and Next.js `dashboard` compile with **0 errors**.
*   **Testing**: All 22 E2E integration test cases pass successfully in `admin-service`.

## Next session starts with

1.  Deploying database and backend services using the provided Docker/Compose templates or Railway config.
2.  Configuring Stripe pricing IDs and keys in the service environment variables:
    *   `STRIPE_SECRET_KEY`
    *   `STRIPE_WEBHOOK_SECRET`
    *   `STRIPE_PRICE_STARTER`
    *   `STRIPE_PRICE_PROFESSIONAL`
3.  Forwarding Stripe events using Stripe CLI (`stripe listen --forward-to localhost:3001/api/v1/billing/webhook`) during local testing to perform a real subscription checkout.

## Open questions

*   None.