# Project Overview: SWIZAUTH

SWIZAUTH is a multi-tenant Identity and Access Management (IAM) platform designed to power authentication, authorization, organization management, and developer identity services across all SwizFusion products and third-party applications.

The platform functions similarly to Auth0, Clerk, and Keycloak while remaining optimized for African businesses, startups, educational institutions, healthcare organizations, churches, and SaaS platforms. It serves as the centralized source of truth for user identities, permissions, organizations, sessions, API access, and security policies.

---

## Primary Goals
- **Centralized Authentication:** A single Identity Provider for all client services and users.
- **Multi-Tenant Identity Management:** Rigid organization isolation with standard user management controls.
- **Role-Based Access Control (RBAC):** Granular permission mapping to user roles.
- **OAuth & Social Login:** Standard social providers and internal OAuth authorization flows.
- **Session Management:** Secure tracking and remote session revocation of active user sessions.
- **API Access Management:** API keys for machine-to-machine integration and scoped tokens.
- **Developer Friendly Integration:** Simplified SDK integrations and clear documentation.

---

## User Types

1. **Platform Super Admin**
   - Controls the entire SwizAuth ecosystem.
   - Capabilities: Manage tenants, manage subscriptions, system monitoring, global security controls.

2. **Organization Owner**
   - Owns a tenant.
   - Capabilities: Manage organization settings, members, roles, billing, and custom domains.

3. **Organization Admin**
   - Capabilities: Invite members, assign roles, view reports, audit log querying.

4. **Organization Member**
   - Capabilities: Login, access assigned applications, manage personal profile.

5. **Developer**
   - Capabilities: Create applications, generate API keys, configure OAuth redirects, access SDKs.

---

## Scope for the MVP (V1)

### In Scope
- **Registration & Login:** Email/password, phone/OTP, and username/password registration and login flows.
- **Session Validation & Session Management:** Active sessions tracking, remote revocation, JWT access tokens (15-min expiry), and database-stored Refresh Tokens (30-day expiry).
- **Organizations (Tenants):** Core tenant isolation model via `organization_id`.
- **Role-Based Access Control (RBAC):** Roles, Permissions, User Roles, and Role Permissions mapping.
- **Email Verification & Password Reset:** Email verification flow and secure password reset token cycles.
- **Audit Logs:** System, admin, and security audit log collection.
- **Admin Dashboard:** Next.js management UI for tenants, applications, users, and roles.

### Out of Scope (Excluded)
- **Billing & Subscription Management:** Plans (Free, Starter, Business, Enterprise) will not be integrated with payment Gateways in MVP.
- **AI-Powered Security Insights:** Risk scoring, threat analysis, and anomaly detection are postponed.
- **Full OAuth Provider Implementation:** External application OAuth capabilities (client consent screens, authorization server code grants, etc.) are excluded.
- **White-label Custom Domains:** Multiple custom brand subdomains (e.g., `auth.school.com`) are postponed.
- **Webhooks Service:** The event dispatcher (`user.created`, `role.assigned` retries and logs) is deferred.
