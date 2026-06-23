# Memory — Email Integration

Last updated: 2026-06-23 23:23

## What was built

*   **Go Auth SMTP Transactional Emails**: Created [email_service.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/service/email_service.go) implementing email delivery via the standard Go `net/smtp` package with `STARTTLS` security on port 587. Updated config models in [config.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/domain/config.go) to read SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`) and documented them in [.env.example](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/.env.example).
*   **Wired Auth Handlers**: Updated registration and password reset request handlers in [auth_handler.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/http/auth_handler.go) and [main.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/cmd/auth/main.go) to call the new `EmailService` instead of printing plaintext tokens.
*   **Next.js Resend Marketing Emailing**: Installed `resend` package in `apps/marketing`, created [resend.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/lib/resend.ts) client wrapper, and implemented endpoints `/api/newsletter` and `/api/contact` using Resend's free tier.
*   **Bound Marketing UI Forms**: Stateful inputs, loading overlays, spinner animations, and error/success notices were added to the Blog newsletter subscribe form ([page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/app/blog/page.tsx)) and the Contact page form ([page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/app/contact/page.tsx)).

## Decisions made

*   **SMTP for Transactional Emailing**: Selected SMTP as the Go-to-Supabase integration pattern since Supabase provides standard project SMTP credentials, avoiding complex vendor SDKs in the Go codebase.
*   **Logging Fallback**: Allowed the Go `auth-service` to fall back to logging verification links to stdout (current development behaviour) if `SMTP_HOST` is not set.
*   **Resend for Marketing**: Integrated Next.js marketing forms with Resend API for its developer-friendly free tier (3,000 free emails/month).

## Problems solved

*   **Next.js Static Generation API Key Error**: Next.js `next build` attempts to statically compile route configurations at build-time. Initializing Resend without a key threw a runtime error, breaking build scripts. Resolved by adding a default `"re_dummy_key_for_build"` fallback in `lib/resend.ts` if `RESEND_API_KEY` is undefined.

## Current state

*   **Build status**: Go `auth-service`, NestJS `admin-service`, Next.js `dashboard`, and Next.js `marketing` all compile and build successfully with **0 errors**.
*   **Testing**: All Go unit/mock compilations and NestJS unit tests pass successfully.
*   **Git State**: Changes are fully committed and pushed to `main` branch.

## Next session starts with

1.  Deploying database and backend services with SMTP variables configured (e.g. Supabase SMTP host, port, user, password, sender).
2.  Configuring `RESEND_API_KEY` in marketing environment variables (`apps/marketing/.env` or deployment variables).
3.  Performing a manual register and password reset flow to verify SMTP delivery to real inboxes.
4.  Submitting test newsletter and contact forms on the marketing site and checking the Resend dashboard log.

## Open questions

*   None.