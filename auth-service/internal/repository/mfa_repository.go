package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rickmwas/swizauth/auth-service/internal/domain"
)

// MFA errors
var (
	ErrMfaConfigNotFound = errors.New("MFA configuration not found or disabled")
)

// MfaRepository handles operations on MFA configurations and recovery codes
type MfaRepository interface {
	CreateMfaConfig(ctx context.Context, userID uuid.UUID, method string, encryptedSecret string) (*domain.MfaConfiguration, error)
	GetMfaConfig(ctx context.Context, userID uuid.UUID) (*domain.MfaConfiguration, error)
	EnableMfaConfig(ctx context.Context, configID uuid.UUID, hashedRecoveryCodes []string) error
	GetRecoveryCodes(ctx context.Context, configID uuid.UUID) ([]domain.MfaRecoveryCode, error)
	UseRecoveryCode(ctx context.Context, codeID uuid.UUID) error
}

type mfaRepository struct {
	db *pgxpool.Pool
}

// NewMfaRepository instantiates MFA repository
func NewMfaRepository(db *pgxpool.Pool) MfaRepository {
	return &mfaRepository{db: db}
}

func (r *mfaRepository) CreateMfaConfig(ctx context.Context, userID uuid.UUID, method string, encryptedSecret string) (*domain.MfaConfiguration, error) {
	// Clean up any unconfirmed configurations to avoid duplicate pending entries
	_, err := r.db.Exec(ctx, `DELETE FROM auth.mfa_configurations WHERE user_id = $1 AND enabled = FALSE`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to prune pending MFA configs: %w", err)
	}

	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}

	now := time.Now()
	query := `
		INSERT INTO auth.mfa_configurations (id, user_id, method, secret, enabled, created_at, updated_at)
		VALUES ($1, $2, $3, $4, FALSE, $5, $6)
	`
	_, err = r.db.Exec(ctx, query, id, userID, method, encryptedSecret, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create MFA config: %w", err)
	}

	return &domain.MfaConfiguration{
		ID:        id,
		UserID:    userID,
		Method:    method,
		Secret:    encryptedSecret,
		Enabled:   false,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (r *mfaRepository) GetMfaConfig(ctx context.Context, userID uuid.UUID) (*domain.MfaConfiguration, error) {
	query := `
		SELECT id, user_id, method, secret, enabled, created_at, updated_at
		FROM auth.mfa_configurations
		WHERE user_id = $1
	`
	var m domain.MfaConfiguration
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&m.ID, &m.UserID, &m.Method, &m.Secret, &m.Enabled, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMfaConfigNotFound
		}
		return nil, fmt.Errorf("failed to retrieve MFA config: %w", err)
	}
	return &m, nil
}

func (r *mfaRepository) EnableMfaConfig(ctx context.Context, configID uuid.UUID, hashedRecoveryCodes []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// 1. Mark MFA configuration as enabled
	queryEnable := `
		UPDATE auth.mfa_configurations
		SET enabled = TRUE, updated_at = $1
		WHERE id = $2
	`
	_, err = tx.Exec(ctx, queryEnable, time.Now(), configID)
	if err != nil {
		return fmt.Errorf("failed to enable configuration: %w", err)
	}

	// Prune any existing recovery codes to prevent clutter
	_, err = tx.Exec(ctx, `DELETE FROM auth.mfa_recovery_codes WHERE mfa_configuration_id = $1`, configID)
	if err != nil {
		return fmt.Errorf("failed to clear pre-existing recovery codes: %w", err)
	}

	// 2. Insert new recovery codes
	queryCode := `
		INSERT INTO auth.mfa_recovery_codes (id, mfa_configuration_id, code_hash, used, created_at)
		VALUES ($1, $2, $3, FALSE, $4)
	`
	for _, hashed := range hashedRecoveryCodes {
		id, err := uuid.NewV7()
		if err != nil {
			id = uuid.New()
		}
		_, err = tx.Exec(ctx, queryCode, id, configID, hashed, time.Now())
		if err != nil {
			return fmt.Errorf("failed to insert recovery code: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *mfaRepository) GetRecoveryCodes(ctx context.Context, configID uuid.UUID) ([]domain.MfaRecoveryCode, error) {
	query := `
		SELECT id, mfa_configuration_id, code_hash, used, created_at
		FROM auth.mfa_recovery_codes
		WHERE mfa_configuration_id = $1 AND used = FALSE
	`
	rows, err := r.db.Query(ctx, query, configID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve recovery codes: %w", err)
	}
	defer rows.Close()

	var codes []domain.MfaRecoveryCode
	for rows.Next() {
		var c domain.MfaRecoveryCode
		err := rows.Scan(&c.ID, &c.MfaConfigurationID, &c.CodeHash, &c.Used, &c.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recovery code row: %w", err)
		}
		codes = append(codes, c)
	}

	return codes, nil
}

func (r *mfaRepository) UseRecoveryCode(ctx context.Context, codeID uuid.UUID) error {
	query := `
		UPDATE auth.mfa_recovery_codes
		SET used = TRUE
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, codeID)
	if err != nil {
		return fmt.Errorf("failed to mark recovery code as consumed: %w", err)
	}
	return nil
}
