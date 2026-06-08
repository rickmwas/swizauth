# Progress Tracker: SWIZAUTH

Tracks the implementation status of features and services.

## Phase 1: Database and Core Setup
- [x] Initialize Database schemas & migrations (PostgreSQL)
- [x] Configure Redis connection pools

## Phase 2: Go Auth Engine (`auth-service`)
- [ ] User Registration endpoint (`POST /auth/register`)
- [ ] User Login endpoint (`POST /auth/login`)
- [ ] JWT and Refresh Token cycle (`POST /auth/refresh`)
- [ ] Logout & Token Revocation (`POST /auth/logout`, `/auth/logout-all`)
- [ ] Session Verification middleware (`GET /auth/verify`)
- [ ] Email Verification & Password Reset workflows
- [ ] MFA Configuration & Verification endpoints (TOTP)
- [ ] Redis-backed Rate Limiter integration
- [ ] Service-to-service internal API auth handlers

## Phase 3: NestJS Admin API (`admin-service`)
- [ ] Organization CRUD routes
- [ ] Membership Invitation and Acceptance flow
- [ ] User management routing & roles assignment
- [ ] Application configuration API
- [ ] API Key generation & management
- [ ] Audit logs and query filters endpoint

## Phase 4: Next.js Dashboard & Auth Portal
- [ ] Authentication Screens (Login, Register, Password Reset)
- [ ] Organization Administration (Member list, Roles panel)
- [ ] Developer Portal (Applications setup, API key management)
- [ ] Audit Log Viewer with filter panels
