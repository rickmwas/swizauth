-- Migration: Add OAuth and widget configuration fields to applications table
-- Date: 2026-06-09

ALTER TABLE developer.applications 
ADD COLUMN IF NOT EXISTS allowed_origins JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS logout_urls JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS web_origins JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7);

-- Update application_type enum to include embedded_widget
ALTER TABLE developer.applications 
ALTER COLUMN application_type TYPE VARCHAR(100);

COMMENT ON COLUMN developer.applications.allowed_origins IS 'CORS allowed origins for client applications';
COMMENT ON COLUMN developer.applications.logout_urls IS 'Valid logout redirect URLs';
COMMENT ON COLUMN developer.applications.web_origins IS 'Valid web origins for CORS';
COMMENT ON COLUMN developer.applications.logo_url IS 'URL to application logo for branding';
COMMENT ON COLUMN developer.applications.primary_color IS 'Hex color for primary branding';
COMMENT ON COLUMN developer.applications.background_color IS 'Hex color for background branding';