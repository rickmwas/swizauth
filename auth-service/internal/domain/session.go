package domain

import (
	"time"

	"github.com/google/uuid"
)

// Session represents the auth.sessions database entity tracking active logins
type Session struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	DeviceName     *string   `json:"device_name,omitempty"`
	Browser        *string   `json:"browser,omitempty"`
	IPAddress      *string   `json:"ip_address,omitempty"`
	Country        *string   `json:"country,omitempty"`
	City           *string   `json:"city,omitempty"`
	UserAgent      *string   `json:"user_agent,omitempty"`
	LastActivityAt time.Time `json:"last_activity_at"`
	ExpiresAt      time.Time `json:"expires_at"`
	Revoked        bool      `json:"revoked"`
	CreatedAt      time.Time `json:"created_at"`
}

// RefreshToken represents the auth.refresh_tokens database entity tracking token validation hashes
type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	SessionID uuid.UUID `json:"session_id"`
	UserID    uuid.UUID `json:"user_id"`
	TokenHash string    `json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	Revoked   bool      `json:"revoked"`
	CreatedAt time.Time `json:"created_at"`
}

// VerifyResponse represents the returned payload of the session verify endpoint
type VerifyResponse struct {
	Authenticated bool       `json:"authenticated"`
	User          UserPublic `json:"user"`
	Organization  struct {
		ID uuid.UUID `json:"id"`
	} `json:"organization"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}
