# SWIZAUTH MVP Build Plan

This build plan details the sequenced steps for implementing the SWIZAUTH multi-tenant identity and access management system.

---

## Phase 1: Database & Core Setup

### 1.1 Database Initialization
- [x] Install/Verify PostgreSQL (version 16+).
- [x] Create PostgreSQL schemas: `auth`, `developer`, `audit`, `security`.
- [x] Define and apply initial migration script:
  - Create table `organizations` with `id UUID PRIMARY KEY`, name, slug (unique), status, plan.
  - Create table `auth.users` with foreign key referencing `organizations(id)` and composite uniqueness (`organization_id`, `email`/`username`).
  - Create tables `auth.roles`, `auth.permissions`, and junction tables `auth.user_roles`, `auth.role_permissions`.
  - Create tables `auth.sessions` and `auth.refresh_tokens`.
  - Create tables `auth.email_verification_tokens`, `auth.password_reset_tokens`, `auth.mfa_configurations`, `auth.mfa_recovery_codes`.
  - Create tables `developer.applications`, `developer.api_keys`.
  - Create tables `audit.audit_logs` and `security.security_events`.
- [x] Create high-traffic indexes:
  - `auth.users(email)`
  - `auth.users(username)`
  - `auth.sessions(user_id)`
  - `auth.sessions(expires_at)`
  - `auth.refresh_tokens(token_hash)`
  - `developer.applications(client_id)`
  - `audit.audit_logs(user_id)`
  - `security.security_events(created_at)`

### 1.2 Redis Configuration
- [x] Configure local/production Redis connection pool.
- [x] Establish standard caching functions with namespace key formats (`ratelimit:`, `mfa:`, `session:`).

---

## Phase 2: Go Auth Engine (`auth-service`)

### 2.1 Project Scaffolding & Middleware
- [x] Initialize Go modules, install Gin, pgx, and redis clients.
- [x] Implement middleware stack:
  - Request ID Injection (UUIDv7 header).
  - Structured JSON logger middleware.
  - CORS middleware supporting whitelists.
  - Global Panic Recovery handler.

### 2.2 Registration & Session Core APIs
- [x] **Registration (`POST /auth/register`):**
  - Verify email/username availability per tenant.
  - Enforce password strength validation.
  - Hash password using `Argon2id`.
  - Save user record under target `organization_id`.
- [x] **Login (`POST /auth/login`):**
  - Authenticate credentials.
  - Track active logins, update `last_login_at`.
  - Issue RS256 signed Access Token (15-min life) and DB-stored Refresh Token (30-day life).
- [x] **Session Verification (`GET /auth/verify`):**
  - Extract and validate JWT bearer header.
  - Load organization, active roles, and granular permissions list into JWT claims context.
- [x] **Logout & Revocation (`POST /auth/logout`, `POST /auth/logout-all`):**
  - Mark single session or all user sessions as revoked in database and block list cache.

### 2.3 Verification, Reset, and MFA Workflows
- [x] **Token Actions (`POST /auth/refresh`):** Rotate and validate refresh tokens.
- [x] **Email Verification & Password Reset:** Generate expiring secure hashes, send trigger payloads, and update state fields on verification.
- [x] **MFA TOTP (`POST /mfa/enable`, `POST /mfa/verify`):** Create high-entropy secret, output base64 QR code, verify 6-digit input, and store encrypted secrets.

### 2.4 Security & Rate Limiting
- [x] **Rate Limiting Middleware:** Implement Redis-backed token bucket logic for Auth endpoints (Login: 10/min, Register: 5/min).
- [x] **Service-to-Service Security:** Guard internal routing endpoints (e.g. `/internal/verify-token`) via shared bearer secrets.

---

## Phase 3: NestJS Admin API (`admin-service`)

### 3.1 Project Setup & DB Layer
- [ ] Scaffold NestJS project, configure Prisma / TypeORM datasource client.
- [ ] Set up global error filter mapping standard HTTP codes to unified JSON structure:
  ```json
  { "success": false, "error": { "code": "NOT_FOUND", "message": "Resource not found" } }
  ```

### 3.2 Organization & Membership APIs
- [ ] **Organization Admin (`POST /organizations`, `GET /organizations/{id}`, `PATCH /organizations/{id}`):** CRUD operations on tenants.
- [ ] **Member Invitations (`POST /memberships/invite`, `POST /memberships/accept`):**
  - Generate invitation token and log records.
  - Implement join/registration binding.
- [ ] **Member Revocation (`DELETE /memberships/{id}`):** Remove member bindings and invalidate sessions.

### 3.3 Roles, Applications, and Logs APIs
- [ ] **RBAC Panel (`POST /roles`, `POST /permissions/assign`):** Dynamic role-permission bindings.
- [ ] **Application Setup (`POST /applications`, `POST /applications/{id}/rotate-secret`):** Client application CRUD, client credentials generator.
- [ ] **API Keys Manager (`POST /api-keys`, `DELETE /api-keys/{id}`):** Secure hashing and scoped rights validation logic.
- [ ] **Audit Queries (`GET /audit`):** Paginated search matching actions, users, and date filters.

---

## Phase 4: Next.js Dashboard & Auth Portal

### 4.1 UI Framework Setup
- [x] Initialize Next.js project with TailwindCSS.
- [x] Load HSL custom properties into `global.css` file matching target design systems tokens.
- [x] Configure Layout layouts, navbar grids, Sidebar menu panels.

### 4.2 Screens Implementation
- [x] **Auth Portal:** Design split-screen Login/Registration forms with disabled submit buttons during loading and clear inline form errors.
- [x] **Org Settings Dashboard:** Table of active members with actions menu (Role modification, Revoke member), dynamic pagination controls, and debounced search fields.
- [x] **Developer Panel:** Form to register applications, client key display modals, and interactive API Keys checklists.
- [x] **Audit Logs Dashboard:** Large tables showing actions history with date filtering controls and empty result panels.

