# SWIZAUTH

# Database Design Specification (DDS)

Version: 1.0

------------------------------------------------------------------------

# 1. Database Overview {#database-overview}

Database Engine: PostgreSQL

Version: 16+

Design Principles:

- Multi-Tenant
- Security First
- Auditability
- Scalability
- Soft Deletes
- UUID-Based IDs

------------------------------------------------------------------------

# 2. Common Standards {#common-standards}

## Primary Keys

All tables use:

    id UUID PRIMARY KEY

Generated using UUIDv7.

------------------------------------------------------------------------

## Timestamps

Every table contains:

    created_at TIMESTAMPTZ
    updated_at TIMESTAMPTZ

------------------------------------------------------------------------

## Soft Deletes

Optional:

    deleted_at TIMESTAMPTZ

------------------------------------------------------------------------

# 3. Organizations {#organizations}

Represents a tenant.

Table:

organizations

Columns:

id UUID PK

name VARCHAR(255)

slug VARCHAR(255) UNIQUE

logo_url TEXT

status VARCHAR(50)

plan VARCHAR(50)

owner_id UUID

created_at

updated_at

Indexes:

slug

status

plan

------------------------------------------------------------------------

# 4. Users {#users}

Core identity table.

Table:

users

Columns:

id UUID PK

organization_id UUID FK

email VARCHAR(255)

phone VARCHAR(30)

username VARCHAR(100)

password_hash TEXT

first_name VARCHAR(100)

last_name VARCHAR(100)

avatar_url TEXT

email_verified BOOLEAN

phone_verified BOOLEAN

status VARCHAR(50)

last_login_at TIMESTAMPTZ

created_at

updated_at

deleted_at

Constraints:

UNIQUE (organization_id, email)

UNIQUE (organization_id, username)

Indexes:

organization_id

email

username

status

------------------------------------------------------------------------

# 5. Roles {#roles}

Table:

roles

Columns:

id UUID PK

organization_id UUID FK

name VARCHAR(100)

description TEXT

is_system BOOLEAN

created_at

updated_at

Indexes:

organization_id

name

------------------------------------------------------------------------

# 6. Permissions {#permissions}

Table:

permissions

Columns:

id UUID PK

name VARCHAR(255)

description TEXT

module VARCHAR(100)

created_at

updated_at

Examples:

users.read

users.create

users.delete

students.manage

inventory.update

Indexes:

name UNIQUE

module

------------------------------------------------------------------------

# 7. User Roles {#user-roles}

Many-to-many relationship.

Table:

user_roles

Columns:

id UUID PK

user_id UUID FK

role_id UUID FK

created_at

Indexes:

user_id

role_id

Unique:

(user_id, role_id)

------------------------------------------------------------------------

# 8. Role Permissions {#role-permissions}

Table:

role_permissions

Columns:

id UUID PK

role_id UUID FK

permission_id UUID FK

created_at

Unique:

(role_id, permission_id)

Indexes:

role_id

permission_id

------------------------------------------------------------------------

# 9. Sessions {#sessions}

Tracks active user sessions.

Table:

sessions

Columns:

id UUID PK

user_id UUID FK

organization_id UUID FK

device_name VARCHAR(255)

browser VARCHAR(255)

ip_address INET

country VARCHAR(100)

city VARCHAR(100)

user_agent TEXT

last_activity_at TIMESTAMPTZ

expires_at TIMESTAMPTZ

revoked BOOLEAN

created_at

Indexes:

user_id

organization_id

expires_at

revoked

------------------------------------------------------------------------

# 10. Refresh Tokens {#refresh-tokens}

Table:

refresh_tokens

Columns:

id UUID PK

session_id UUID FK

user_id UUID FK

token_hash TEXT

expires_at TIMESTAMPTZ

revoked BOOLEAN

created_at

Indexes:

user_id

session_id

expires_at

------------------------------------------------------------------------

# 11. Applications {#applications}

Applications registered by developers.

Table:

applications

Columns:

id UUID PK

organization_id UUID FK

name VARCHAR(255)

description TEXT

client_id VARCHAR(255)

client_secret_hash TEXT

application_type VARCHAR(100)

redirect_urls JSONB

status VARCHAR(50)

created_at

updated_at

Indexes:

organization_id

client_id

status

------------------------------------------------------------------------

# 12. OAuth Accounts {#oauth-accounts}

Social logins.

Table:

oauth_accounts

Columns:

id UUID PK

user_id UUID FK

provider VARCHAR(100)

provider_user_id VARCHAR(255)

email VARCHAR(255)

created_at

Unique:

(provider, provider_user_id)

Indexes:

user_id

provider

------------------------------------------------------------------------

# 13. API Keys {#api-keys}

Table:

api_keys

Columns:

id UUID PK

organization_id UUID FK

name VARCHAR(255)

key_hash TEXT

scopes JSONB

expires_at TIMESTAMPTZ

revoked BOOLEAN

created_at

Indexes:

organization_id

expires_at

revoked

------------------------------------------------------------------------

# 14. Audit Logs {#audit-logs}

Critical security table.

Table:

audit_logs

Columns:

id UUID PK

organization_id UUID FK

user_id UUID FK

action VARCHAR(255)

resource VARCHAR(255)

resource_id UUID

ip_address INET

metadata JSONB

created_at

Examples:

user.login

user.logout

role.assigned

password.changed

Indexes:

organization_id

user_id

action

created_at

------------------------------------------------------------------------

# 15. Security Events {#security-events}

Tracks threats.

Table:

security_events

Columns:

id UUID PK

organization_id UUID FK

user_id UUID FK

event_type VARCHAR(255)

severity VARCHAR(50)

ip_address INET

metadata JSONB

created_at

Examples:

failed_login

account_locked

brute_force_detected

suspicious_location

Indexes:

organization_id

severity

event_type

created_at

------------------------------------------------------------------------

# 16. Email Verification Tokens {#email-verification-tokens}

Table:

email_verification_tokens

Columns:

id UUID PK

user_id UUID FK

token_hash TEXT

expires_at TIMESTAMPTZ

used BOOLEAN

created_at

Indexes:

user_id

expires_at

------------------------------------------------------------------------

# 17. Password Reset Tokens {#password-reset-tokens}

Table:

password_reset_tokens

Columns:

id UUID PK

user_id UUID FK

token_hash TEXT

expires_at TIMESTAMPTZ

used BOOLEAN

created_at

Indexes:

user_id

expires_at

------------------------------------------------------------------------

# 18. MFA Configurations {#mfa-configurations}

Table:

mfa_configurations

Columns:

id UUID PK

user_id UUID FK

method VARCHAR(100)

secret TEXT

enabled BOOLEAN

created_at

updated_at

Indexes:

user_id

enabled

------------------------------------------------------------------------

# 19. MFA Recovery Codes {#mfa-recovery-codes}

Table:

mfa_recovery_codes

Columns:

id UUID PK

mfa_configuration_id UUID FK

code_hash TEXT

used BOOLEAN

created_at

Indexes:

mfa_configuration_id

used

------------------------------------------------------------------------

# 20. Notifications {#notifications}

Table:

notifications

Columns:

id UUID PK

organization_id UUID FK

user_id UUID FK

channel VARCHAR(50)

type VARCHAR(100)

status VARCHAR(50)

payload JSONB

sent_at TIMESTAMPTZ

created_at

Indexes:

organization_id

user_id

status

------------------------------------------------------------------------

# 21. Webhooks {#webhooks}

Table:

webhooks

Columns:

id UUID PK

organization_id UUID FK

name VARCHAR(255)

url TEXT

secret TEXT

events JSONB

active BOOLEAN

created_at

updated_at

Indexes:

organization_id

active

------------------------------------------------------------------------

# 22. Webhook Deliveries {#webhook-deliveries}

Table:

webhook_deliveries

Columns:

id UUID PK

webhook_id UUID FK

event_name VARCHAR(255)

response_code INTEGER

success BOOLEAN

attempts INTEGER

payload JSONB

created_at

Indexes:

webhook_id

success

created_at

------------------------------------------------------------------------

# 23. Subscriptions {#subscriptions}

Future Billing Module.

Table:

subscriptions

Columns:

id UUID PK

organization_id UUID FK

plan VARCHAR(50)

status VARCHAR(50)

starts_at TIMESTAMPTZ

ends_at TIMESTAMPTZ

created_at

Indexes:

organization_id

status

plan

------------------------------------------------------------------------

# 24. Database Schemas {#database-schemas}

Recommended:

auth

security

billing

audit

notifications

developer

Example:

auth.users

auth.roles

audit.audit_logs

security.security_events

billing.subscriptions

------------------------------------------------------------------------

# 25. Critical Indexes {#critical-indexes}

High Traffic Indexes:

users(email)

users(username)

sessions(user_id)

sessions(expires_at)

refresh_tokens(token_hash)

applications(client_id)

audit_logs(user_id)

security_events(created_at)

------------------------------------------------------------------------

# 26. Future Tables (V2) {#future-tables-v2}

passkeys

sso_providers

tenant_domains

consent_records

feature_flags

usage_metrics

billing_invoices

billing_payments

risk_scores

ai_security_insights

------------------------------------------------------------------------

# 27. Estimated Scale {#estimated-scale}

Target:

100,000+ users per tenant

10,000+ organizations

10M+ audit log records

1M+ active sessions

Horizontal scaling supported through:

- PostgreSQL Read Replicas
- Redis Clustering
- Service Separation
- Event-Driven Architecture
