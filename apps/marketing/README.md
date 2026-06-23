# TSAUTH Marketing Site

Minimal Next.js marketing site scaffold for TSAUTH.

Environment:
- `AUTH_SERVICE_URL` - URL to the running auth-service (default: http://localhost:8080)
- `DEFAULT_ORG_ID` - Temporary org id used for register flow when creating accounts (optional)

Run locally:

```bash
cd apps/marketing
npm install
npm run dev
```

Pages:
- `/` - landing
- `/signup` - signup form (posts to `/api/signup`)

Notes:
- The auth-service currently requires an `organization_id` for registration; a proper onboarding endpoint that creates organizations is planned (see repo TODOs).
