# Library and Tool Documentation: SWIZAUTH

This document explains how to interact with, initialize, and run commands for the core frameworks, UI packages, and databases in the SWIZAUTH workspace.

---

## 1. Go Core (Gin)
The Auth Engine is built in Go using the **Gin** HTTP web framework.

### Standard Operations
- **Router setup:** Always define API groups matching version prefixes (e.g., `r.Group("/api/v1")`).
- **Middleware:** Register custom handlers for CORS, Request ID generation, Rate Limiting, and JWT extraction.
- **SQL Interactions:** Use `pgx` or `sqlx` directly with PostgreSQL to prevent slow query performance. Write raw SQL queries matching the Database Design Specification.
- **Redis Connection:** Use `go-redis/v9` to interact with Redis for blacklisting JWT sessions, token buckets for rate limiting, and temporary MFA TOTP secret caches.

### Common Commands
- Run locally: `go run cmd/auth/main.go`
- Run tests: `go test ./...`
- Format code: `gofmt -w -s .`

---

## 2. Management Layer (NestJS)
The Admin Service is built using **NestJS**.

### Standard Patterns
- **Database Access:** Use **Prisma** or **TypeORM** for interacting with PostgreSQL. Configure the client to point to correct database schemas (`auth`, `security`, `audit`, `billing`).
- **Redis Integration:** Use `ioredis` with dynamic NestJS modules to cache authorization sets and access audits.
- **Validation:** Enforce validation on input DTOs using `@nestjs/common` pipes, `class-validator`, and `class-transformer`.
- **Error Filtering:** Register a global `HttpExceptionFilter` to convert standard NestJS exceptions (e.g., `BadRequestException`) into the unified `{ success: false, error: { code, message } }` payload.

### Common Commands
- Install dependencies: `npm install`
- Start dev server: `npm run start:dev`
- Run tests: `npm run test`

---

## 3. Frontend Portal (Next.js, Shadcn UI & TailwindCSS)
The Dashboard and Auth screens are built using the Next.js App Router, TailwindCSS, and Shadcn UI.

### Guidelines
- **Data Fetching:** Prefer React Server Components (RSC) for fetching initial pages and rendering tables (e.g. member lists, application settings).
- **Client Components:** Use `"use client"` ONLY for components needing interaction (forms, toggles, dialog modals).
- **Shadcn UI Installation:** Initialize and install individual components via the CLI:
  ```bash
  npx shadcn-ui@latest add button card dialog form input table toast dropdown-menu
  ```
- **Form State:** Use `react-hook-form` with `zod` for form schemas and client-side validation. Ensure inputs map exactly to the schema keys.

---

## 4. PostgreSQL and Redis Instances

### PostgreSQL (Port 5432)
- Ensure PostgreSQL 16+ is running.
- **Tenant Queries:** All SQL queries containing table filters must include `WHERE organization_id = $1`.
- **Soft Deletes:** Ensure soft-deleted records (`deleted_at IS NOT NULL`) are omitted from standard query results.

### Redis (Port 6379)
- **Key Prefixing:** Prevent cache collisions using structured key namespaces:
  - Rate limiting keys: `ratelimit:<ip_or_user_id>:<endpoint_name>`
  - MFA verification secret token cache: `mfa:secret:<user_id>`
  - Session verification blacklist: `session:revoked:<session_id>`
