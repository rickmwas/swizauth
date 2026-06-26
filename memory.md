# Memory — Local Integration Testing and Prisma 7 Refactor

Last updated: 2026-06-26 15:10

## What was built

*   **Prisma v7 Database Connection**: Configured `admin-service` to use `@prisma/adapter-pg` and `pg` inside [prisma.service.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/src/prisma/prisma.service.ts), and removed the obsolete `url` property from the `datasource` block in [schema.prisma](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/prisma/schema.prisma) to comply with Prisma v7 client initialization specifications.
*   **Local URL Validation**: Updated the `CreateApplicationDto` in [create-application.dto.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/src/applications/dto/create-application.dto.ts) to set `@IsUrl({ require_tld: false })` on redirect, origin, and logo URL arrays/fields. This allows local development URLs (e.g. `localhost:4000`) to pass schema validation.
*   **rotateSecret Status Code**: Added the `@HttpCode(200)` decorator to the `rotateSecret` POST endpoint in [applications.controller.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/src/applications/applications.controller.ts) so that it returns `200 OK` (which the E2E test suite asserts on) rather than NestJS's default `201 Created` code.
*   **Health Check Response Format**: Modified [health.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/http/health.go) in `auth-service` to include `Success: true` in the health and readiness responses to match E2E tester assertions.
*   **Tester Seed UUIDs**: Refactored the integration test suite in [main.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/cmd/tester/main.go) to use valid, static PostgreSQL UUIDs (`00000000-0000-0000-0000-0000000000xx`) for testing permissions instead of the old invalid string IDs (`e2e-perm-xxx`), and updated database cleanup query.

## Decisions made

*   **Host-level Application Execution**: Kept containerized database/cache dependencies (`tsauth-postgres` and `tsauth-redis`) running in Docker, but executed the Go/NestJS/Next.js services at the host level. This allows for live log viewing and faster feedback cycles in local development.
*   **Prisma PG Adapter**: Transitioned runtime `PrismaClient` initialization to use a PG driver pool adapter to support Prisma v7 runtime specifications on connection management.

## Problems solved

*   **Prisma Client Initialization Error**: Resolved the `PrismaClientInitializationError` thrown by NestJS upon start because the schema did not specify a connection URL. Fixed by migrating connections to runtime driver adapters.
*   **Tester Seed Failure (UUID Syntax)**: Resolved `invalid input syntax for type uuid` error when inserting test permissions by switching to compliant UUID strings.
*   **400 Bad Request on App Creation**: Fixed application registration failing local validation due TLD requirements on localhost URLs.

## Current state

*   **Database & Cache**: Local postgres/redis docker containers are healthy and seeded.
*   **Backend Services**: Go `auth-service` (port 8080) and NestJS `admin-service` (port 3001) are running as local background tasks.
*   **Frontend Applications**: Next.js `dashboard` (port 3000) and `marketing` (port 3002) are running as local background tasks.
*   **Testing Status**: All 34 E2E integration test cases are **passing successfully (100% success)**.

## Next session starts with

1. Performing manual register/reset verification checks using real environment credentials.
2. Proceeding with frontend feature additions or cloud deployment testing.

## Open questions

*   None.