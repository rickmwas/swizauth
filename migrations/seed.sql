-- Seed database with mock tenant data for testing
-- Truncate existing data to start fresh
TRUNCATE public.organizations, auth.users, auth.roles, auth.permissions, auth.user_roles, auth.role_permissions, auth.sessions, auth.refresh_tokens, developer.applications, developer.api_keys, audit.audit_logs, security.security_events CASCADE;

-- 1. Create Organization (TerraSept Labs)
INSERT INTO public.organizations (id, name, slug, logo_url, status, plan, owner_id, created_at, updated_at)
VALUES (
    '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
    'TerraSept Labs',
    'TerraSept-labs',
    NULL,
    'active',
    'enterprise',
    NULL, -- owner_id set after user creation
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- 2. Create Permissions (Standard permissions matching roles scope)
INSERT INTO auth.permissions (id, name, description, module, created_at, updated_at)
VALUES 
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2001', 'users.read', 'Read user profiles and roles', 'users', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2002', 'users.create', 'Invite and create users', 'users', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2003', 'users.update', 'Modify user metadata and statuses', 'users', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2004', 'users.delete', 'Remove users and revoke roles', 'users', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2005', 'applications.read', 'View registered applications', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2006', 'applications.create', 'Register new client applications', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2007', 'applications.update', 'Update application redirect URLs and settings', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2008', 'applications.delete', 'Delete client applications', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2009', 'api_keys.read', 'View active and revoked API keys', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2010', 'api_keys.create', 'Create machine-to-machine access keys', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2011', 'api_keys.delete', 'Revoke API keys', 'developer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2012', 'audit_logs.read', 'Query audit logs history', 'audit', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2013', 'roles.read', 'View organization roles', 'roles', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2014', 'roles.create', 'Create new organization roles', 'roles', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2015', 'roles.update', 'Update organization roles and assign permissions', 'roles', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e2016', 'roles.delete', 'Delete organization roles', 'roles', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- 3. Create Roles
INSERT INTO auth.roles (id, organization_id, name, description, is_system, created_at, updated_at)
VALUES 
    ('018f4c2e-4b2a-71b3-b452-47c3d18e1001', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'admin', 'Organization Administrator', TRUE, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e1002', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member', 'Organization Member', TRUE, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'developer', 'Developer Access', TRUE, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- 4. Map Role Permissions
-- admin role gets all permissions
INSERT INTO auth.role_permissions (id, role_id, permission_id, created_at)
SELECT gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1001', id, NOW() - INTERVAL '3 days'
FROM auth.permissions;

-- member role gets read-only permissions
INSERT INTO auth.role_permissions (id, role_id, permission_id, created_at)
VALUES 
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1002', '018f4c2e-4b2a-71b3-b452-47c3d18e2001', NOW() - INTERVAL '3 days'), -- users.read
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1002', '018f4c2e-4b2a-71b3-b452-47c3d18e2005', NOW() - INTERVAL '3 days'), -- applications.read
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1002', '018f4c2e-4b2a-71b3-b452-47c3d18e2009', NOW() - INTERVAL '3 days'); -- api_keys.read

-- developer role gets developer management permissions
INSERT INTO auth.role_permissions (id, role_id, permission_id, created_at)
VALUES 
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2005', NOW() - INTERVAL '3 days'), -- applications.read
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2006', NOW() - INTERVAL '3 days'), -- applications.create
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2007', NOW() - INTERVAL '3 days'), -- applications.update
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2008', NOW() - INTERVAL '3 days'), -- applications.delete
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2009', NOW() - INTERVAL '3 days'), -- api_keys.read
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2010', NOW() - INTERVAL '3 days'), -- api_keys.create
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e1003', '018f4c2e-4b2a-71b3-b452-47c3d18e2011', NOW() - INTERVAL '3 days'); -- api_keys.delete

-- 5. Create Users (1 Admin, 11 Members. Password is "Password123!")
INSERT INTO auth.users (id, organization_id, email, phone, username, password_hash, first_name, last_name, avatar_url, email_verified, phone_verified, status, last_login_at, created_at, updated_at, deleted_at)
VALUES 
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0001', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'admin@terrasept.com', '+2348011111111', 'admin', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Adebayo', 'Okonkwo', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', TRUE, TRUE, 'active', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0002', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member01@terrasept.com', '+2348022222222', 'member01', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Fatima', 'Mensah', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member01', TRUE, FALSE, 'active', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0003', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member02@terrasept.com', '+2348033333333', 'member02', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Chidi', 'Kofi', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member02', TRUE, FALSE, 'active', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0004', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member03@terrasept.com', '+2348044444444', 'member03', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Zainab', 'Diallo', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member03', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0005', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member04@terrasept.com', '+2348055555555', 'member04', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Kwame', 'Nguesso', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member04', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0006', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member05@terrasept.com', '+2348066666666', 'member05', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Amara', 'Banda', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member05', FALSE, FALSE, 'active', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0007', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member06@terrasept.com', '+2348077777777', 'member06', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Tunde', 'Moyo', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member06', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0008', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member07@terrasept.com', '+2348088888888', 'member07', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Chioma', 'Keita', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member07', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0009', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member08@terrasept.com', '+2348099999999', 'member08', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Jelani', 'Toure', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member08', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0010', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member09@terrasept.com', '+2348012345678', 'member09', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Kofi', 'Osei', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member09', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0011', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member10@terrasept.com', '+2348087654321', 'member10', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Mariam', 'Sissoko', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member10', TRUE, FALSE, 'suspended', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
    ('018f4c2e-4b2a-71b3-b452-47c3d18e0012', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', 'member11@terrasept.com', '+2348099887766', 'member11', '$argon2id$v=19$m=65536,t=3,p=2$2ldR/ZZVZuyKuo/tFLYfmw$pKc/TYJIuxZTtBNx4fHK09WTl7hpA0PRCaWysx9ZUjY', 'Obinna', 'Okoro', 'https://api.dicebear.com/7.x/adventurer/svg?seed=member11', TRUE, FALSE, 'active', NULL, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NULL);

-- Update Organization Owner to Adebayo Okonkwo (Admin)
UPDATE public.organizations
SET owner_id = '018f4c2e-4b2a-71b3-b452-47c3d18e0001'
WHERE id = '018f4c2e-4b2a-71b3-b452-47c3d18e9507';

-- 6. Associate User Roles
INSERT INTO auth.user_roles (id, user_id, role_id, created_at)
VALUES 
    -- admin gets admin and developer roles
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0001', '018f4c2e-4b2a-71b3-b452-47c3d18e1001', NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0001', '018f4c2e-4b2a-71b3-b452-47c3d18e1003', NOW() - INTERVAL '3 days'),
    -- member01 gets member and developer roles
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0002', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0002', '018f4c2e-4b2a-71b3-b452-47c3d18e1003', NOW() - INTERVAL '2 days'),
    -- others get member role
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0003', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0004', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0005', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0006', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0007', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0008', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0009', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0010', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0011', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e0012', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', NOW() - INTERVAL '12 hours');

-- 7. Create Developer Applications
INSERT INTO developer.applications (id, organization_id, name, description, client_id, client_secret_hash, application_type, redirect_urls, status, created_at, updated_at)
VALUES 
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e3001',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'TerraSept Web Portal',
        'Customer-facing Next.js dashboard client',
        'client_web_123456',
        '1342fc60e36482ff16e4ed58ce384d3d2fc41eb59d0cf63e2f30e78486abaa2f', -- sha256 of secret_web_client_secret_value_123
        'web',
        '["http://localhost:3000/callback", "https://TerraSept.com/callback"]'::jsonb,
        'active',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e3002',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'TerraSept Mobile Client',
        'Flutter Android/iOS application',
        'client_mobile_789012',
        '194d211fbdbe77be6628bdcc201445204bc77d9647a2f96a84d1d6c098de604c', -- sha256 of secret_mobile_client_secret_value_123
        'mobile',
        '["TerraSept://callback"]'::jsonb,
        'active',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e3003',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'TerraSept Daemon Service',
        'Background sync worker service',
        'client_daemon_345678',
        'a0d49dda035c4b867c2339f042207df2923ecc62902a50c48bfde9927104296e', -- sha256 of secret_daemon_client_secret_value_123
        'service',
        '[]'::jsonb,
        'active',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );

-- 8. Create API Keys (2 Active, 1 Revoked)
INSERT INTO developer.api_keys (id, organization_id, name, key_hash, scopes, expires_at, revoked, created_at)
VALUES 
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e4001',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'Production Sync API Key',
        'cb3ed1370e05e3873200481d941b124885fa9d9370af0ab99006fb4093d530d5', -- sha256 of sk_live_key1_active
        '["users.read", "applications.read"]'::jsonb,
        NOW() + INTERVAL '30 days',
        FALSE,
        NOW() - INTERVAL '2 days'
    ),
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e4002',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'Developer Sandbox Token',
        'd4584e40a560b1ecbc8f36c9c8fb58c8233c4d13a3e0b4dd54179ef03e3dad78', -- sha256 of sk_live_key2_active
        '["users.read"]'::jsonb,
        NULL,
        FALSE,
        NOW() - INTERVAL '12 hours'
    ),
    (
        '018f4c2e-4b2a-71b3-b452-47c3d18e4003',
        '018f4c2e-4b2a-71b3-b452-47c3d18e9507',
        'Deprecated Legacy Key',
        '5a4b4f1f4421d3470ae75c902fff55344975bf01659b826c0c5090b0bd709aef', -- sha256 of sk_live_key3_revoked
        '["users.read", "users.create", "users.update", "users.delete"]'::jsonb,
        NOW() - INTERVAL '1 day',
        TRUE,
        NOW() - INTERVAL '3 days'
    );

-- 9. Create 15 Audit Logs (spanning 3 days)
INSERT INTO audit.audit_logs (id, organization_id, user_id, action, resource, resource_id, ip_address, metadata, created_at)
VALUES 
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'user.login', 'session', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', '197.210.64.1', '{"browser": "Chrome", "device": "MacBook Pro"}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'organization.created', 'organization', '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '197.210.64.1', '{"name": "TerraSept Labs", "plan": "enterprise"}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'role.created', 'role', '018f4c2e-4b2a-71b3-b452-47c3d18e1001', '197.210.64.1', '{"name": "admin", "is_system": true}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'role.created', 'role', '018f4c2e-4b2a-71b3-b452-47c3d18e1002', '197.210.64.1', '{"name": "member", "is_system": true}'::jsonb, NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'application.created', 'application', '018f4c2e-4b2a-71b3-b452-47c3d18e3001', '197.210.64.1', '{"name": "TerraSept Web Portal", "type": "web"}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'application.created', 'application', '018f4c2e-4b2a-71b3-b452-47c3d18e3002', '197.210.64.1', '{"name": "TerraSept Mobile Client", "type": "mobile"}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'api_key.created', 'api_key', '018f4c2e-4b2a-71b3-b452-47c3d18e4001', '197.210.64.1', '{"name": "Production Sync API Key"}'::jsonb, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'user.invited', 'user', '018f4c2e-4b2a-71b3-b452-47c3d18e0002', '197.210.64.1', '{"email": "member01@terrasept.com", "role": "member"}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'user.invited', 'user', '018f4c2e-4b2a-71b3-b452-47c3d18e0003', '197.210.64.1', '{"email": "member02@terrasept.com", "role": "member"}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0002', 'user.login', 'session', '018f4c2e-4b2a-71b3-b452-47c3d18e0002', '197.210.64.15', '{"browser": "Firefox", "device": "Windows Desktop"}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0002', 'application.created', 'application', '018f4c2e-4b2a-71b3-b452-47c3d18e3003', '197.210.64.15', '{"name": "TerraSept Daemon Service", "type": "service"}'::jsonb, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0002', 'api_key.created', 'api_key', '018f4c2e-4b2a-71b3-b452-47c3d18e4002', '197.210.64.15', '{"name": "Developer Sandbox Token"}'::jsonb, NOW() - INTERVAL '12 hours'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0003', 'user.login', 'session', '018f4c2e-4b2a-71b3-b452-47c3d18e0003', '197.210.70.4', '{"browser": "Safari", "device": "iPhone 15"}'::jsonb, NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0001', 'api_key.revoked', 'api_key', '018f4c2e-4b2a-71b3-b452-47c3d18e4003', '197.210.64.1', '{"name": "Deprecated Legacy Key"}'::jsonb, NOW() - INTERVAL '4 hours'),
    (gen_random_uuid(), '018f4c2e-4b2a-71b3-b452-47c3d18e9507', '018f4c2e-4b2a-71b3-b452-47c3d18e0003', 'user.logout', 'session', '018f4c2e-4b2a-71b3-b452-47c3d18e0003', '197.210.70.4', '{}'::jsonb, NOW() - INTERVAL '2 hours');
