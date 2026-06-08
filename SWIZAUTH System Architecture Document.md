# SWIZAUTH

# System Architecture Document (SAD)

Version: 1.0

------------------------------------------------------------------------

# 1. Architecture Philosophy {#architecture-philosophy}

SwizAuth follows a service-oriented architecture where authentication is isolated from business operations.

Goals:

- Security First
- Horizontal Scalability
- Multi-Tenant
- API-First
- Cloud Native
- Future Microservice Ready

------------------------------------------------------------------------

# 2. High-Level Architecture {#high-level-architecture}

                    +----------------+
                    |   Next.js UI   |
                    +--------+-------+
                             |
                             |
                    +--------v-------+
                    | NestJS Admin   |
                    | Management API |
                    +--------+-------+
                             |
                             |
                    +--------v-------+
                    |  Go Auth Core  |
                    | Identity Engine|
                    +--------+-------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v

+---------------+ +----------------+ \| PostgreSQL \| \| Redis Cache \| \| Primary Store \| \| Sessions/OTP \| +---------------+ +----------------+

------------------------------------------------------------------------

# 3. Core Services {#core-services}

## Service 1: Auth Engine (Go)

Purpose:

Identity Provider.

Responsibilities:

- Login
- Registration
- OAuth
- MFA
- Session Validation
- Token Issuance
- Permission Checks

Service Name:

auth-service

Port:

8080

Technology:

Go Gin PostgreSQL Redis

------------------------------------------------------------------------

## Service 2: Admin Service

Purpose:

Management Layer

Responsibilities:

- User Management
- Tenant Settings
- Billing
- Reports
- Audit Queries

Service Name:

admin-service

Technology:

NestJS

Port:

3001

------------------------------------------------------------------------

## Service 3: Dashboard

Purpose:

Frontend Interface

Technology:

Next.js

Port:

3000

Modules:

- Authentication Pages
- User Portal
- Organization Portal
- Security Center

------------------------------------------------------------------------

# 4. Future Services {#future-services}

notification-service

email-service

billing-service

audit-service

webhook-service

analytics-service

ai-security-service

------------------------------------------------------------------------

# 5. Request Flow {#request-flow}

## Login Flow

User \| v POST /login \| v Auth Service \| v Validate Password \| v Generate JWT \| v Store Refresh Token \| v Return Session

------------------------------------------------------------------------

## Protected Route Flow

Client \| v JWT Token \| v Auth Middleware \| v Verify Token \| v Load Permissions \| v Grant Access

------------------------------------------------------------------------

# 6. Authentication Strategy {#authentication-strategy}

Access Token

Lifetime:

15 Minutes

Purpose:

API Access

------------------------------------------------------------------------

Refresh Token

Lifetime:

30 Days

Purpose:

Session Renewal

Storage:

Database

Revocable:

Yes

------------------------------------------------------------------------

# 7. Authorization Strategy {#authorization-strategy}

RBAC

User \| v Role \| v Permissions

Example:

Teacher

Permissions:

students.read grades.create

------------------------------------------------------------------------

# 8. Multi-Tenant Strategy {#multi-tenant-strategy}

Tenant Isolation Key:

organization_id

Every business table must include:

organization_id

Example:

users

roles

applications

sessions

audit_logs

------------------------------------------------------------------------

# 9. Security Architecture {#security-architecture}

Password Hashing:

Argon2id

Encryption:

AES-256

JWT Signing:

RS256

MFA:

TOTP

Rate Limiting:

Redis

CSRF Protection:

Enabled

CORS:

Whitelist-Based

------------------------------------------------------------------------

# 10. Logging {#logging}

Structured JSON Logs

Log Fields:

request_id user_id organization_id endpoint latency

------------------------------------------------------------------------

# 11. Monitoring {#monitoring}

Metrics:

Authentication Success Rate

Failed Logins

Token Refreshes

Session Count

API Latency

Tools:

Prometheus

Grafana

------------------------------------------------------------------------

# 12. Deployment Architecture {#deployment-architecture}

Docker Containers

Services:

auth-service

admin-service

postgres

redis

dashboard

nginx

------------------------------------------------------------------------

# 13. Production Infrastructure {#production-infrastructure}

Cloud Provider:

AWS Azure DigitalOcean Hetzner

Components:

Load Balancer

Kubernetes

PostgreSQL Cluster

Redis Cluster

Object Storage

Monitoring Stack

------------------------------------------------------------------------

# 14. Future Evolution {#future-evolution}

Phase 1

Monolith Services

Phase 2

Service Extraction

Phase 3

Independent Scaling

Phase 4

Global Multi-Region Deployment
