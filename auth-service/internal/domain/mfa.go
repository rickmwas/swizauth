package domain

import (
	"time"

	"github.com/google/uuid"
)

// MfaConfiguration represents the auth.mfa_configurations database entity
type MfaConfiguration struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Method    string    `json:"method"`
	Secret    string    `json:"-"` // encrypted secret
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MfaRecoveryCode represents the auth.mfa_recovery_codes database entity
type MfaRecoveryCode struct {
	ID                 uuid.UUID `json:"id"`
	MfaConfigurationID uuid.UUID `json:"mfa_configuration_id"`
	CodeHash           string    `json:"-"`
	Used               bool      `json:"used"`
	CreatedAt          time.Time `json:"created_at"`
}
