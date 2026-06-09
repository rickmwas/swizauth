package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents the auth.users database entity
type User struct {
	ID             uuid.UUID  `json:"id"`
	OrganizationID uuid.UUID  `json:"organization_id"`
	Email          string     `json:"email"`
	Phone          *string    `json:"phone,omitempty"`
	Username       *string    `json:"username,omitempty"`
	PasswordHash   string     `json:"-"`
	FirstName      string     `json:"first_name"`
	LastName       string     `json:"last_name"`
	AvatarURL      *string    `json:"avatar_url,omitempty"`
	EmailVerified  bool       `json:"email_verified"`
	PhoneVerified  bool       `json:"phone_verified"`
	Status         string     `json:"status"`
	LastLoginAt    *time.Time `json:"last_login_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"-"`
}

// Role represents the auth.roles database entity
type Role struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	IsSystem       bool      `json:"is_system"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Permission represents the auth.permissions database entity
type Permission struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Module      string    `json:"module"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// RegisterRequest defines the input required to sign up a new user
type RegisterRequest struct {
	OrganizationID string `json:"organization_id" binding:"required,uuid"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required"`
	FirstName      string `json:"first_name" binding:"required"`
	LastName       string `json:"last_name" binding:"required"`
}

// LoginRequest defines credentials payload for authentication
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterResponse represents the success payload on user registration
type RegisterResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	UserID  string `json:"user_id"`
}

// UserPublic represents the safe user profile fields exposed to clients
type UserPublic struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	Email          string    `json:"email"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
}

// LoginResponse represents the token and session info returned on authentication success
type LoginResponse struct {
	AccessToken  string      `json:"access_token,omitempty"`
	RefreshToken string      `json:"refresh_token,omitempty"`
	ExpiresIn    int64       `json:"expires_in,omitempty"` // in seconds
	User         *UserPublic `json:"user,omitempty"`
	MfaRequired  bool        `json:"mfa_required,omitempty"`
	MfaToken     string      `json:"mfa_token,omitempty"`
}

// RefreshRequest defines the input required to refresh an access token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// VerifyEmailRequest defines the input to verify a user's email
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// PasswordResetRequestRequest defines the input to request a password reset link
type PasswordResetRequestRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PasswordResetConfirmRequest defines the input to confirm a password reset
type PasswordResetConfirmRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// MfaSetupResponse represents the setup response containing the TOTP secret and QR URI
type MfaSetupResponse struct {
	Success   bool   `json:"success"`
	Secret    string `json:"secret"`
	QrCodeUri string `json:"qr_code_uri"`
}

// MfaConfirmRequest defines the input to confirm MFA setup
type MfaConfirmRequest struct {
	Code string `json:"code" binding:"required"`
}

// MfaConfirmResponse represents the recovery codes returned on successful MFA setup confirmation
type MfaConfirmResponse struct {
	Success       bool     `json:"success"`
	RecoveryCodes []string `json:"recovery_codes"`
}

// MfaVerifyRequest defines the input to authenticate a login session with MFA
type MfaVerifyRequest struct {
	MfaToken     string `json:"mfa_token" binding:"required"`
	Code         string `json:"code"`
	RecoveryCode string `json:"recovery_code"`
}

// InternalVerifyRequest defines the input for service-to-service token verification requests
type InternalVerifyRequest struct {
	Token string `json:"token" binding:"required"`
}


