-- Up Migration: Initialize TSAUTH schema and tables

-- 1. Create Custom Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS developer;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS security;

-- 2. Create Organizations Table (in public schema)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    status VARCHAR(50) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    owner_id UUID, -- Foreign key constraint added later to resolve circular dependency
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- 3. Create Users Table (in auth schema)
CREATE TABLE auth.users (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    username VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email),
    CONSTRAINT uq_users_org_username UNIQUE (organization_id, username)
);

-- Now add foreign key constraint on organizations.owner_id referencing auth.users.id
ALTER TABLE public.organizations 
    ADD CONSTRAINT fk_organizations_owner 
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Create Roles Table (in auth schema)
CREATE TABLE auth.roles (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_roles_org_name UNIQUE (organization_id, name)
);

-- 5. Create Permissions Table (in auth schema)
CREATE TABLE auth.permissions (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- 6. Create User Roles Junction Table (in auth schema)
CREATE TABLE auth.user_roles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

-- 7. Create Role Permissions Junction Table (in auth schema)
CREATE TABLE auth.role_permissions (
    id UUID PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

-- 8. Create Sessions Table (in auth schema)
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    browser VARCHAR(255),
    ip_address INET,
    country VARCHAR(100),
    city VARCHAR(100),
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 9. Create Refresh Tokens Table (in auth schema)
CREATE TABLE auth.refresh_tokens (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES auth.sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 10. Create Email Verification Tokens Table (in auth schema)
CREATE TABLE auth.email_verification_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 11. Create Password Reset Tokens Table (in auth schema)
CREATE TABLE auth.password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 12. Create MFA Configurations Table (in auth schema)
CREATE TABLE auth.mfa_configurations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method VARCHAR(100) NOT NULL,
    secret TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- 13. Create MFA Recovery Codes Table (in auth schema)
CREATE TABLE auth.mfa_recovery_codes (
    id UUID PRIMARY KEY,
    mfa_configuration_id UUID NOT NULL REFERENCES auth.mfa_configurations(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 14. Create Applications Table (in developer schema)
CREATE TABLE developer.applications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret_hash TEXT NOT NULL,
    application_type VARCHAR(100) NOT NULL,
    redirect_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- 15. Create API Keys Table (in developer schema)
CREATE TABLE developer.api_keys (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

-- 16. Create Audit Logs Table (in audit schema)
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id UUID,
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
);

-- 17. Create Security Events Table (in security schema)
CREATE TABLE security.security_events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
);

-- ==========================================
-- INDEXES FOR HIGH-TRAFFIC & EFFICIENT QUERYING
-- ==========================================

-- Organizations Indexes
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_plan ON public.organizations(plan);

-- Users Indexes
CREATE INDEX idx_users_org_id ON auth.users(organization_id);
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_users_status ON auth.users(status);

-- Roles Indexes
CREATE INDEX idx_roles_org_id ON auth.roles(organization_id);
CREATE INDEX idx_roles_name ON auth.roles(name);

-- Permissions Indexes
CREATE INDEX idx_permissions_module ON auth.permissions(module);

-- User Roles Junction Indexes
CREATE INDEX idx_user_roles_user_id ON auth.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON auth.user_roles(role_id);

-- Role Permissions Junction Indexes
CREATE INDEX idx_role_permissions_role_id ON auth.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON auth.role_permissions(permission_id);

-- Sessions Indexes
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_org_id ON auth.sessions(organization_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);
CREATE INDEX idx_sessions_revoked ON auth.sessions(revoked);

-- Refresh Tokens Indexes
CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON auth.refresh_tokens(session_id);
CREATE INDEX idx_refresh_tokens_expires_at ON auth.refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);

-- Applications Indexes
CREATE INDEX idx_applications_org_id ON developer.applications(organization_id);
CREATE INDEX idx_applications_status ON developer.applications(status);

-- API Keys Indexes
CREATE INDEX idx_api_keys_org_id ON developer.api_keys(organization_id);
CREATE INDEX idx_api_keys_expires_at ON developer.api_keys(expires_at);
CREATE INDEX idx_api_keys_revoked ON developer.api_keys(revoked);

-- Audit Logs Indexes
CREATE INDEX idx_audit_logs_org_id ON audit.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at);

-- Security Events Indexes
CREATE INDEX idx_security_events_org_id ON security.security_events(organization_id);
CREATE INDEX idx_security_events_severity ON security.security_events(severity);
CREATE INDEX idx_security_events_event_type ON security.security_events(event_type);
CREATE INDEX idx_security_events_created_at ON security.security_events(created_at);

-- Email Verification Tokens Indexes
CREATE INDEX idx_email_verification_tokens_user_id ON auth.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON auth.email_verification_tokens(expires_at);

-- Password Reset Tokens Indexes
CREATE INDEX idx_password_reset_tokens_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON auth.password_reset_tokens(expires_at);

-- MFA Configurations Indexes
CREATE INDEX idx_mfa_configurations_user_id ON auth.mfa_configurations(user_id);
CREATE INDEX idx_mfa_configurations_enabled ON auth.mfa_configurations(enabled);

-- MFA Recovery Codes Indexes
CREATE INDEX idx_mfa_recovery_codes_config_id ON auth.mfa_recovery_codes(mfa_configuration_id);
CREATE INDEX idx_mfa_recovery_codes_used ON auth.mfa_recovery_codes(used);
