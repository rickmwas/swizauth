# Memory — Phase 1: Database & Core Setup

Last updated: 2026-06-08T19:14:30+03:00

## What was built

- Verified local environment containerization inside `docker-compose.yml` for PostgreSQL 16 on port 5432 and Redis 7 on port 6379.
- Created `migrations/000001_init_schema.up.sql` defining multi-tenant isolated schemas (`auth`, `developer`, `audit`, `security`), tables, composite unique constraints, soft deletes (`deleted_at` on `auth.users`), and 40+ database indexes.
- Created `migrations/000001_init_schema.down.sql` cleanly dropping all entities in reverse dependency order.
- Initialized local git repository, added remote `origin` pointing to `https://github.com/rickmwas/swizauth.git`, committed all phase 1 assets, and pushed to remote `main` and `dev` branches.
- Documented repository git branching policy under section 3 of `agents.md`.

## Decisions made

- **Owner-User Circular Dependency:** Created the `organizations` table with a nullable `owner_id UUID` column, then defined the `auth.users` table referencing `organizations.id`, and finally added the foreign key constraint on `organizations.owner_id` via `ALTER TABLE` to avoid circular creation locks.
- **UUIDv7 Responsibility:** Time-sorted UUIDv7 generation is delegated to application services (Go and NestJS). The database uses standard `UUID` types with no database-level defaults.
- **Composite Unique Constraints:** Enforced email and username uniqueness per tenant rather than globally using `UNIQUE (organization_id, email)` and `UNIQUE (organization_id, username)`.
- **Git Branching Policy:** Adopted the strategy to develop active features on the `dev` branch and merge changes to `main` only when stable/production-ready.

## Problems solved

- **Docker Startup Error:** Resolved a stopped Docker Desktop daemon blocker on the local machine by launching `C:\Program Files\Docker\Docker\Docker Desktop.exe` via PowerShell, checking backend WSL2 health, and verifying container state.
- **PowerShell Pipe Redirection:** Used `Get-Content <file> -Raw` in PowerShell to pipe the schema scripts into the Docker container `psql` shell safely.

## Current state

- PostgreSQL and Redis containers are healthy and running locally.
- DDL Up and Down migrations have been successfully verified and applied to the database instance.
- Redis responds successfully to `ping` with `PONG`.
- `progress-tracker.md` and `build-plan.md` have been updated to reflect Phase 1 completion.
- Local repository is on the `dev` branch tracking remote `origin/dev`.

## Next session starts with

- **Phase 2: Go Auth Engine (`auth-service`)**: Setting up Go project scaffolding, installing dependencies (`gin`, `pgx`, `redis`), and implementing core middleware (JSON logger, CORS, request ID, global panic recovery).

## Open questions

- None.
