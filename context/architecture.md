# Architecture Specification: TSAUTH

TSAUTH is built on a Service-Oriented Architecture (SOA) separating core identity verification from management interfaces.

---

## 1. Tech Stack & Ports
- **Frontend Dashboard (Port 3000):** Next.js, TailwindCSS, Shadcn UI
- **Management API (Port 3001):** NestJS
- **Auth Engine Core (Port 8080):** Go (Gin framework)
- **Primary Database:** PostgreSQL 16+
- **Cache & Session Store:** Redis

---

## 2. Service Boundaries

```
                    +----------------+
                    |   Next.js UI   |
                    +--------+-------+
                             |
                             | (JSON/REST APIs)
                    +--------v-------+
                    | NestJS Admin   |
                    | Management API |
                    +--------+-------+
                             |
                             | (Internal HTTP Calls / Auth DB Direct Access)
                    +--------v-------+
                    |  Go Auth Core  |
                    | Identity Engine|
                    +--------+-------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
+----------------+                      +----------------+
|   PostgreSQL   |                      |     Redis      |
| Primary Store  |                      |  OTP/RateLimit |
+----------------+                      +----------------+
```

### Auth Engine (Go - `auth-service`)
- **Port:** `8080`
- **Responsibilities:**
  - Fast-path authentication operations (Login, Register, Logout).
  - Session validation and DB-backed Refresh Token generation/revocation.
  - RS256 JWT Access Token issuance.
  - Multi-Factor Authentication (MFA) TOTP state validation.
  - Granular Permission and RBAC verification.
  - Internal validation endpoints (e.g. `/internal/verify-token`, `/internal/users/{id}`).

### Admin Service (NestJS - `admin-service`)
- **Port:** `3001`
- **Responsibilities:**
  - Organization settings management and tenant subscriptions/billing.
  - User and membership invitations and administration.
  - System reporting, security configuration, and audit logging database queries.
  - Standard CRUD operations for organizations, roles, applications, and permissions.

### Dashboard Layer (Next.js - `dashboard`)
- **Port:** `3000`
- **Modules:**
  - Login/Register/Reset flow templates.
  - **User Portal:** Profiles, credential management, active sessions list, MFA setup.
  - **Developer Portal:** Client Application creation, API Keys generation, Webhook registration.
  - **Organization Admin Portal:** Member lists, role administration, permission bindings, audit log viewer.

---

## 3. Multi-Tenant Strategy
TSAUTH implements tenant isolation via the Shared Database, Shared Schema (logical separation) model.

- **Tenant Isolation Key:** `organization_id` (UUIDv7) must be present in every organization-specific table.
- **Enforced Tables:** `users`, `roles`, `applications`, `sessions`, `audit_logs`, `security_events`, `api_keys`, etc.
- **Database Schemas:**
  - `auth`: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `mfa_configurations`, `mfa_recovery_codes`.
  - `developer`: `applications`, `api_keys`, `webhooks`, `webhook_deliveries`.
  - `audit`: `audit_logs`.
  - `security`: `security_events`.
  - `billing`: `subscriptions`.
  - `notifications`: `notifications`.

---

## 4. Security Architecture

### Cryptography & Auth Strategy
- **Password Hashing:** Argon2id.
- **Token Strategy:**
  - **Access Token:** RS256 Signed JWT, 15-minute lifetime. Used for authorization.
  - **Refresh Token:** High-entropy token (stored hashed in Database), 30-day lifetime. Used for session renewal.
  - **Database Encryption:** AES-256 for sensitive configurations (MFA secrets, API key hashes, Client secrets).

### JWT Claims Format
```json
{
  "sub": "user_id",
  "org": "organization_id",
  "email": "user@example.com",
  "roles": ["admin"],
  "permissions": ["users.read", "users.create"],
  "session_id": "uuid",
  "iat": 1717876800,
  "exp": 1717877700
}
```

### Rate Limiting (Redis-backed)
- **Login:** 10 requests / minute
- **Register:** 5 requests / minute
- **Password Reset:** 5 requests / minute
- **OAuth Endpoints:** 100 requests / minute
- **API Key Authenticated Routes:** 1000 requests / minute

---

## 5. Request Flows

### Login Flow
1. User submits credentials to `/auth/login` on `Go Auth Engine`.
2. Auth Engine validates password with `Argon2id`.
3. Creates new database session record in `sessions` table.
4. Generates RS256 JWT access token and database-backed refresh token.
5. Returns access token, refresh token, and expires_in duration to user.

### Token Verification Flow
1. Client makes request to protected route on `NestJS Admin Service` or client gateway with JWT in `Authorization: Bearer <token>` header.
2. The middleware verifies RS256 signature and checks expiration.
3. Performs local permission matching using claims (`org`, `roles`, `permissions`).
4. If valid, grants access; otherwise returns `401 Unauthorized` or `403 Forbidden`.
