# Rebrand: SwizAuth → TSAuth (TerraSeptAuth)

Rename every occurrence of the brand name across the entire codebase — source code, configuration, documentation, SDK, deployment scripts, and context files.

## Naming Convention

| Context | Old | New |
|---|---|---|
| Display name (UI, docs) | SwizAuth | TSAuth |
| Full brand name | SwizAuth / SWIZAUTH | TerraSeptAuth / TSAUTH |
| Package scope (npm) | `@swizauth/` | `@tsauth/` |
| Go module path | `github.com/rickmwas/swizauth/` | `github.com/rickmwas/tsauth/` |
| CSS variable prefix | `--swizauth-` | `--tsauth-` |
| CSS class prefix | `.swizauth-` | `.tsauth-` |
| Cookie names | `swizauth_mfa_challenge` | `tsauth_mfa_challenge` |
| Fly.io app names | `swizauth-auth`, `swizauth-admin`, `swizauth-dashboard` | `tsauth-auth`, `tsauth-admin`, `tsauth-dashboard` |
| Database name | `swizauth` | `tsauth` |
| API domain | `api.swizauth.com` | `api.tsauth.com` |
| Email domains (test) | `@swizauth.local` | `@tsauth.local` |
| Parent company ref | SwizFusion | TerraSept |
| Docker container names | `swizauth-*` | `tsauth-*` |
| Document titles | `SWIZAUTH ...` | `TSAUTH ...` |

## User Review Required

> [!IMPORTANT]
> **Go module path change**: Renaming `github.com/rickmwas/swizauth/auth-service` → `github.com/rickmwas/tsauth/auth-service` will require the GitHub repo to also be renamed (or a redirect created) for `go get` to work. This plan updates the local `go.mod` and all import paths, but the remote repo rename is on you.

> [!WARNING]
> **Cookie name change**: Renaming `swizauth_mfa_challenge` → `tsauth_mfa_challenge` will invalidate any existing MFA challenge cookies in active sessions. Since this is pre-production, this should be fine.

> [!IMPORTANT]
> **Fly.io app names**: The plan updates `fly.toml` files, but you'll need to manually recreate or rename apps on Fly.io since app names are immutable there.

## Open Questions

1. Should the database name change from `swizauth` to `tsauth` in `.env` files, or do you want to keep the existing DB name for now and only rename the brand references?
2. The admin email `admin@swizfusion.com` — should this become `admin@terrasept.com`?

---

## Proposed Changes

### Component 1: Go Auth Service (`auth-service/`)

~27 occurrences across Go source and config.

#### [MODIFY] [go.mod](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/go.mod)
- `module github.com/rickmwas/swizauth/auth-service` → `module github.com/rickmwas/tsauth/auth-service`

#### [MODIFY] [main.go (auth)](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/cmd/auth/main.go)
- All import paths: `github.com/rickmwas/swizauth/` → `github.com/rickmwas/tsauth/`

#### [MODIFY] [main.go (tester)](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/cmd/tester/main.go)
- Import paths + test email domains `@swizauth.local` → `@tsauth.local`

#### [MODIFY] [auth_handler.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/http/auth_handler.go)
- Import paths

#### [MODIFY] [token_service.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/service/token_service.go)
- Import path

#### [MODIFY] All repository files (`user_repository.go`, `session_repository.go`, `organization_repository.go`, `onboarding_repository.go`, `mfa_repository.go`)
- Import paths

#### [MODIFY] [.env](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/.env) and [.env.example](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/.env.example)
- Database URL: `swizauth` → `tsauth`

#### [MODIFY] [fly.toml](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/fly.toml)
- `app = 'swizauth-auth'` → `app = 'tsauth-auth'`

---

### Component 2: NestJS Admin Service (`admin-service/`)

3 occurrences.

#### [MODIFY] [main.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/src/main.ts)
- Comment: `swizauth` → `tsauth`

#### [MODIFY] [http-exception.filter.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/src/common/filters/http-exception.filter.ts)
- Comment: `swizauth` → `tsauth`

#### [MODIFY] [fly.toml](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/admin-service/fly.toml)
- `app = 'swizauth-admin'` → `app = 'tsauth-admin'`

---

### Component 3: Next.js Dashboard (`dashboard/`)

~10 occurrences.

#### [MODIFY] [layout.tsx (root)](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/layout.tsx)
- Title: `SwizAuth` → `TSAuth`

#### [MODIFY] [layout.tsx (dashboard)](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/layout.tsx)
- Fallback org name: `SwizAuth Tenant` → `TSAuth Tenant`

#### [MODIFY] [layout.tsx (auth)](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/auth/layout.tsx)
- Footer copyright: `SwizAuth` → `TSAuth`

#### [MODIFY] [applications/page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/applications/page.tsx)
- UI copy: `SwizAuth` → `TSAuth` (2 occurrences)

#### [MODIFY] [actions.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/auth/actions.ts)
- Cookie name: `swizauth_mfa_challenge` → `tsauth_mfa_challenge` (4 occurrences)

#### [MODIFY] [fly.toml](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/fly.toml)
- `app = 'swizauth-dashboard'` → `app = 'tsauth-dashboard'`

---

### Component 4: SDK (`sdk/`)

~490 occurrences (heavy due to CSS variable/class prefix).

#### [MODIFY] [package.json](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/sdk/package.json)
- `"name": "@swizauth/js"` → `"name": "@tsauth/js"`
- `"author": "SwizAuth Team"` → `"author": "TSAuth Team"`
- keyword: `"swizauth"` → `"tsauth"`
- description: `SwizAuth` → `TSAuth`

#### [MODIFY] [src/types/index.ts](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/sdk/src/types/index.ts)
- `SwizAuthConfig` → `TSAuthConfig`
- `SwizAuthClientOptions` → `TSAuthClientOptions`

#### [MODIFY] [src/styles/swizauth.css](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/sdk/src/styles/swizauth.css)
- **Bulk rename**: all `--swizauth-` → `--tsauth-`, all `.swizauth-` → `.tsauth-`
- Comments: `SwizAuth` → `TSAuth`

#### [MODIFY] All other SDK source files referencing `SwizAuth`/`swizauth` class names and types

---

### Component 5: Marketing Site (`apps/marketing/`)

#### [MODIFY] [package.json](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/package.json)
- `"name": "swizauth-marketing"` → `"name": "tsauth-marketing"`

#### [MODIFY] [pages/index.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/pages/index.tsx)
- All display text: `SwizAuth` → `TSAuth`

#### [MODIFY] [pages/signup.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/apps/marketing/pages/signup.tsx)
- Display text

---

### Component 6: Deployment & Infrastructure

#### [MODIFY] [docker-compose.yml](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/docker-compose.yml)
- Container/DB names: `swizauth` → `tsauth`

#### [MODIFY] [docker-compose.prod.yml](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/docker-compose.prod.yml)
- Container/DB names

#### [MODIFY] [deploy-fly.ps1](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/scripts/deploy-fly.ps1)
- All `swizauth-*` app names → `tsauth-*`, `SwizAuth` → `TSAuth`, `swizfusion` → `terrasept`

#### [MODIFY] [deploy-fly.sh](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/scripts/deploy-fly.sh)
- Same as above

#### [MODIFY] [.env.prod](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/.env.prod)
- DB name reference

#### [MODIFY] [railway.json](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/railway.json)
- If contains brand refs

---

### Component 7: Context & Documentation (9 files)

#### [MODIFY] All context files:
- [project-overview.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/project-overview.md)
- [architecture.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/architecture.md)
- [code-standards.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/code-standards.md)
- [library-docs.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/library-docs.md)
- [ui-tokens.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/ui-tokens.md)
- [ui-rules.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/ui-rules.md)
- [ui-registry.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/ui-registry.md)
- [progress-tracker.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/progress-tracker.md)
- [build-plan.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/context/build-plan.md)

#### [MODIFY] Root documentation:
- [agents.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/agents.md)
- [DEPLOYMENT.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/DEPLOYMENT.md)
- [FLY_DEPLOYMENT.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/FLY_DEPLOYMENT.md)
- [PRODUCTION_CHECKLIST.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/PRODUCTION_CHECKLIST.md)
- [QUICK_START.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/QUICK_START.md)
- [SWIZAUTH PRD.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/SWIZAUTH%20PRD.md) — also rename file to `TSAUTH PRD.md`
- [SWIZAUTH System Architecture Document.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/SWIZAUTH%20System%20Architecture%20Document.md) — rename to `TSAUTH System Architecture Document.md`
- [SWIZAUTH OpenAPI Contract Specification.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/SWIZAUTH%20OpenAPI%20Contract%20Specification.md) — rename to `TSAUTH OpenAPI Contract Specification.md`
- [SWIZAUTH Database Design Specification.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/SWIZAUTH%20Database%20Design%20Specification.md) — rename to `TSAUTH Database Design Specification.md`
- [memory.md](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/memory.md)

---

### Component 8: Migrations

#### [MODIFY] [000001_init_schema.up.sql](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/migrations/000001_init_schema.up.sql)
- Comments only (if brand is in comments)

#### [MODIFY] [000001_init_schema.down.sql](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/migrations/000001_init_schema.down.sql)
- Comments only

---

## Verification Plan

### Automated Tests
- `cd auth-service && go build ./...` — verify Go compilation passes with new module path
- `cd admin-service && npm run build` — verify NestJS builds
- `cd dashboard && npm run build` — verify Next.js builds
- Run a global grep for any remaining `swizauth` or `SwizAuth` references (should be zero)

### Manual Verification
- Verify cookie name change works in auth flow
- Confirm dashboard title shows "TSAuth" in browser tab
