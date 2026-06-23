# Code Standards and Conventions: TSAUTH

This document details the code style, TypeScript rules, Go conventions, logging parameters, and standard API responses for all services in TSAUTH.

---

## 1. Strict TypeScript Rules (NestJS & Next.js)
- **Zero `any` Policy:** Explicitly define all interfaces, types, and return parameters. Use `unknown` with type assertions/guards if type is unknown.
- **Strict Null Checks:** Ensure `strictNullChecks: true` is enabled in `tsconfig.json`. Explicitly handle `null` and `undefined`.
- **Return Type Annotations:** Every function, controller action, and service method must have an explicit return type.
- **DTO Validation:** NestJS APIs must use `class-validator` and `class-transformer` for request validation.
- **Imports:** Group imports logically (Node built-ins, third-party libraries, local absolute path aliases). Use absolute imports starting with `@/`.

---

## 2. Go Standards (Auth Core)
- **Standard Tooling:** Format all code using `gofmt` and lint with `golangci-lint`.
- **Error Handling:** Avoid discarding errors. Always bubble up errors with wrapping context or handle them explicitly.
- **Context Propagation:** Ensure `context.Context` is passed through middleware, service layers, and database queries for telemetry and deadline management.
- **Project Structure:** Follow standard Go clean architecture:
  - `/cmd` - Service entry points.
  - `/internal/domain` - Domain models and interfaces.
  - `/internal/delivery` - Http handlers & middleware.
  - `/internal/service` - Business logic implementation.
  - `/internal/repository` - Database access layer.

---

## 3. Structured JSON Logging
All application logs (Go & NestJS) must be output in structured JSON format to stdout.

### Log Schema Fields
- `timestamp`: ISO-8601 string.
- `level`: `INFO`, `WARN`, `ERROR`, `DEBUG`.
- `service`: `auth-service` | `admin-service` | `dashboard`.
- `request_id`: Tracing UUID injected by middleware.
- `user_id`: UUID of the authenticated user (optional).
- `organization_id`: UUID of the active organization (optional).
- `endpoint`: HTTP method + path (e.g. `POST /api/v1/auth/login`).
- `status`: HTTP status code returned.
- `latency_ms`: Duration of request execution in milliseconds.
- `message`: Human-readable log message.
- `error`: Error payload/stack trace (only on `ERROR` or `WARN` levels).

---

## 4. API Response and Error Format
All APIs must conform to the unified response contract defined in the OpenAPI Specification.

### Success Response
For actions returning boolean states or status updates:
```json
{
  "success": true,
  "message": "Registration successful",
  "user_id": "90e6e765-b1a9-4672-881b-a9a3b610c1c8"
}
```

### Error Response Contract
All error status codes (400, 401, 403, 404, 409, 429, 500) must return the following JSON structure:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters"
  }
}
```

#### Standard Error Codes
- `VALIDATION_ERROR` (400)
- `INVALID_CREDENTIALS` (401)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `EMAIL_EXISTS` (409)
- `USERNAME_EXISTS` (409)
- `ACCOUNT_LOCKED` (423)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)
