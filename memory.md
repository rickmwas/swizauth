# Memory — Go Auth Engine Scaffolding & Core APIs

Last updated: 2026-06-08T23:50:00+03:00

## What was built

- **Verification, Reset, and MFA Workflows (Phase 2.3):**
  - Confirmed and enabled encryption keys (`MFA_ENCRYPTION_KEY` in `.env`), cryptography [crypto_service.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/service/crypto_service.go), and MFA credentials.
  - Built [verification_repository.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/repository/verification_repository.go) (token cycles) and [mfa_repository.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/repository/mfa_repository.go) (MFA & recovery codes).
  - Implemented token rotation (mitigating replays by revoking the whole session), email verifications, password resets, and MFA setup/verification.
- **Security & Rate Limiting (Phase 2.4):**
  - Added `INTERNAL_API_SECRET` configuration in [.env](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/.env) and required it on load in [config.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/domain/config.go).
  - Implemented [rate_limit.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/middleware/rate_limit.go) executing an atomic Redis Lua Token Bucket script, returning rate-limit headers.
  - Implemented [internal_auth.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/middleware/internal_auth.go) GIN middleware validating internal service bearer tokens.
  - Added internal verify payload in [user.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/domain/user.go) and route handler `InternalVerifyToken` in [auth_handler.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/internal/delivery/http/auth_handler.go).
  - Wired routes, internal endpoints, and rate-limiting rules (Login 10/min, Register 5/min, Reset request 5/min) in [main.go](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/auth-service/cmd/auth/main.go).

## Decisions made

- **Atomic Redis Lua Limiting:** Implemented the token bucket in a Lua script to prevent race conditions during high concurrent traffic.
- **Rate Limit Headers:** Standard headers (`X-RateLimit-*`) are injected into both throttled and successful requests.
- **IP & User rate-limit mapping:** Falls back to User ID rate limiting if the request is authenticated, else utilizes the Client IP.
- **Service-to-Service Secret Verification:** Created a separate `/api/v1/internal` route group guarded by a shared symmetric token `INTERNAL_API_SECRET`.

## Problems solved

- **Float/Number conversions in Lua-Go:** Multiplied float tokens by 1000 in Lua script before returning to Go as an `int64` to prevent float conversions issues.
- **Unused Import & Return bugs:** Fixed key parsing return count and unused import errors.

## Current state

- Phase 2.1, 2.2, 2.3, and 2.4 are completely implemented, verified, and stable.
- The `auth-service` Go codebase compiles cleanly and passes builds.
- The E2E integration tester successfully verifies all 15 test suites against running PG and Redis.
- Changes are fully committed and pushed to remote `dev` branch.

## Next session starts with

- **Phase 3: NestJS Admin API (`admin-service`)**
  - Scaffold NestJS project and prisma configurations.
  - Implement Organization CRUD routes and Invitation workflows.

## Open questions

None.
