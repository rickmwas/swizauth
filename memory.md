# Memory — Vercel SPA Routing and Next.js 16 Middleware Refactor

Last updated: 2026-06-26 21:38

## What was built

*   **Vercel SPA Routing Rule**: Updated `revamp-landing/vercel.json` with a simplified and robust rewrite rule (`/((?!assets/|manus-storage/|favicon.ico).*)` -> `/index.html`) to ensure direct route visits and refreshes are handled by the single-page application router.
*   **Vite Landing Page Router Links**: Converted all internal navigation links from HTML standard anchor tags (`<a>`) to wouter `<Link>` components in the `revamp-landing` pages (`Home.tsx`, `Pricing.tsx`, `Features.tsx`, `Security.tsx`, `About.tsx`, `Contact.tsx`, `Documentation.tsx`). This enables instant client-side route transitions without hard page reloads.
*   **Next.js 16 Proxy Migration**: Renamed the deprecated `dashboard/src/middleware.ts` to `dashboard/src/proxy.ts` and updated the exported function from `middleware` to `proxy` to conform to Next.js 16 specifications, resolving edge routing 404 errors.
*   **Dashboard MFA Back-to-Login Link**: Converted the standard anchor tag to Next.js's native `<Link>` component in `dashboard/src/app/auth/verify-mfa/page.tsx` to prevent unnecessary full-page refreshes.
*   **Local Development Redirection Dynamic Fallback**: Updated `getDashboardUrl` in `revamp-landing/client/src/const.ts` to dynamically resolve to `http://localhost:3000` when on localhost, preventing local redirects from going to the remote production URL.

## Decisions made

*   **Filesystem-First Routing**: Simplified Vercel rewrite configuration to rely on Vercel's native file-serving behavior, routing only missing assets to `/index.html` to prevent regex compiling errors.
*   **Wouter Client-Side Transitions**: Retained the standard `<a>` tags for external domain redirects (like the link to the dashboard portal) while forcing all internal landing page navigation through `wouter` to prevent page reloads.

## Problems solved

*   **SPA 404 on Direct Route Visits**: Fixed the Vercel edge router 404 errors by correcting the rewrite rule regex and migrating the pages to client-side `<Link>` tags.
*   **Turbopack Next.js 16 Build Failures**: Fixed the 404 routing error and Turbopack compiler error in the dashboard app by renaming the middleware/proxy file and function.
*   **Local Testing Redirection 404**: Fixed local landing page button clicks redirecting to production Vercel rather than local dashboard on port 3000.

## Current state

*   **Landing Page (`revamp-landing`)**: Compiles and check passes cleanly (`pnpm run check` is 100% clean).
*   **Dashboard (`dashboard`)**: Successfully builds for production (`npm run build` is 100% clean).

## Next session starts with

1. Redeploying the updated code to Vercel and verify that the routing works when clicking links and refreshing pages.
2. Checking that the sign-up redirect from the landing page correctly lands on the dashboard's `/auth/register` page without 404s.

## Open questions

*   None.