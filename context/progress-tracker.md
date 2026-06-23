# Progress Tracker: TSAUTH

Tracks the implementation status of features and services.

## Phase 1: Database and Core Setup
- [x] Initialize Database schemas & migrations (PostgreSQL)
- [x] Configure Redis connection pools

## Phase 2: Go Auth Engine (`auth-service`)
- [x] User Registration endpoint (`POST /auth/register`)
- [x] User Login endpoint (`POST /auth/login`)
- [x] JWT and Refresh Token cycle (`POST /auth/refresh`)
- [x] Logout & Token Revocation (`POST /auth/logout`, `/auth/logout-all`)
- [x] Session Verification middleware (`GET /auth/verify`)
- [x] Email Verification & Password Reset workflows
- [x] MFA Configuration & Verification endpoints (TOTP)
- [x] Redis-backed Rate Limiter integration
- [x] Service-to-service internal API auth handlers

## Phase 3: NestJS Admin API (`admin-service`)
- [x] Organization CRUD routes
- [x] Membership Invitation and Acceptance flow
- [x] User management routing & roles assignment
- [x] Application configuration API
- [x] API Key generation & management
- [x] Audit logs and query filters endpoint

## Phase 4: Next.js Dashboard & Auth Portal
- [x] Authentication Screens (Login, Register, Password Reset)
- [x] Organization Administration (Member list, Roles panel)
- [x] Developer Portal (Applications setup, API key management)
- [x] Audit Log Viewer with filter panels

## Phase 5: End-to-End Testing & Verification
- [x] Auth-service E2E tests (15 test cases — registration, login, MFA, refresh, rate limiting)
- [x] Admin-service cross-service E2E tests (19 test cases — orgs, RBAC, memberships, apps, API keys, audit)
- [x] Cross-service auth guard validation (Go auth-service ↔ NestJS admin-service S2S token verification)
- [x] PermissionsGuard 403 negative test
- [x] Audit permission name mismatch fix (`audit.read` → `audit_logs.read`)
- [x] Prisma v7 datasource API fix
- [x] Seed data extended with `roles.*` permissions
