-- Down Migration: Teardown TSAUTH schema and tables

-- 1. Drop Foreign Key on Organizations (resolves circular dependency on drop)
ALTER TABLE IF EXISTS public.organizations DROP CONSTRAINT IF EXISTS fk_organizations_owner;

-- 2. Drop Tables (Reverse Order of Creation / Dependencies)
DROP TABLE IF EXISTS security.security_events CASCADE;
DROP TABLE IF EXISTS audit.audit_logs CASCADE;
DROP TABLE IF EXISTS developer.api_keys CASCADE;
DROP TABLE IF EXISTS developer.applications CASCADE;
DROP TABLE IF EXISTS auth.mfa_recovery_codes CASCADE;
DROP TABLE IF EXISTS auth.mfa_configurations CASCADE;
DROP TABLE IF EXISTS auth.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS auth.email_verification_tokens CASCADE;
DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;
DROP TABLE IF EXISTS auth.sessions CASCADE;
DROP TABLE IF EXISTS auth.role_permissions CASCADE;
DROP TABLE IF EXISTS auth.user_roles CASCADE;
DROP TABLE IF EXISTS auth.permissions CASCADE;
DROP TABLE IF EXISTS auth.roles CASCADE;
DROP TABLE IF EXISTS auth.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- 3. Drop Custom Schemas
DROP SCHEMA IF EXISTS security CASCADE;
DROP SCHEMA IF EXISTS audit CASCADE;
DROP SCHEMA IF EXISTS developer CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;
