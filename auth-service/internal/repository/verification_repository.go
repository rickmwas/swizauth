package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Verification errors
var (
	ErrTokenNotFound = errors.New("verification token not found")
)

// VerificationRepository handles operations on email verification and password reset tokens
type VerificationRepository interface {
	CreateEmailVerificationToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	GetEmailVerificationToken(ctx context.Context, tokenHash string) (userID uuid.UUID, tokenID uuid.UUID, expiresAt time.Time, used bool, err error)
	MarkEmailVerificationTokenUsed(ctx context.Context, tokenID uuid.UUID) error

	CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	GetPasswordResetToken(ctx context.Context, tokenHash string) (userID uuid.UUID, tokenID uuid.UUID, expiresAt time.Time, used bool, err error)
	MarkPasswordResetTokenUsed(ctx context.Context, tokenID uuid.UUID) error
}

type verificationRepository struct {
	db *pgxpool.Pool
}

// NewVerificationRepository instantiates verification repository
func NewVerificationRepository(db *pgxpool.Pool) VerificationRepository {
	return &verificationRepository{db: db}
}

func (r *verificationRepository) CreateEmailVerificationToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	query := `
		INSERT INTO auth.email_verification_tokens (id, user_id, token_hash, expires_at, used, created_at)
		VALUES ($1, $2, $3, $4, FALSE, $5)
	`
	_, err = r.db.Exec(ctx, query, id, userID, tokenHash, expiresAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to create email verification token: %w", err)
	}
	return nil
}

func (r *verificationRepository) GetEmailVerificationToken(ctx context.Context, tokenHash string) (userID uuid.UUID, tokenID uuid.UUID, expiresAt time.Time, used bool, err error) {
	query := `
		SELECT user_id, id, expires_at, used
		FROM auth.email_verification_tokens
		WHERE token_hash = $1
	`
	err = r.db.QueryRow(ctx, query, tokenHash).Scan(&userID, &tokenID, &expiresAt, &used)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, uuid.Nil, time.Time{}, false, ErrTokenNotFound
		}
		return uuid.Nil, uuid.Nil, time.Time{}, false, fmt.Errorf("failed to scan email verification token: %w", err)
	}
	return userID, tokenID, expiresAt, used, nil
}

func (r *verificationRepository) MarkEmailVerificationTokenUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `
		UPDATE auth.email_verification_tokens
		SET used = TRUE
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to update email verification token state: %w", err)
	}
	return nil
}

func (r *verificationRepository) CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	id, err := uuid.NewV7()
	if err != nil {
		id = uuid.New()
	}
	query := `
		INSERT INTO auth.password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at)
		VALUES ($1, $2, $3, $4, FALSE, $5)
	`
	_, err = r.db.Exec(ctx, query, id, userID, tokenHash, expiresAt, time.Now())
	if err != nil {
		return fmt.Errorf("failed to create password reset token: %w", err)
	}
	return nil
}

func (r *verificationRepository) GetPasswordResetToken(ctx context.Context, tokenHash string) (userID uuid.UUID, tokenID uuid.UUID, expiresAt time.Time, used bool, err error) {
	query := `
		SELECT user_id, id, expires_at, used
		FROM auth.password_reset_tokens
		WHERE token_hash = $1
	`
	err = r.db.QueryRow(ctx, query, tokenHash).Scan(&userID, &tokenID, &expiresAt, &used)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, uuid.Nil, time.Time{}, false, ErrTokenNotFound
		}
		return uuid.Nil, uuid.Nil, time.Time{}, false, fmt.Errorf("failed to scan password reset token: %w", err)
	}
	return userID, tokenID, expiresAt, used, nil
}

func (r *verificationRepository) MarkPasswordResetTokenUsed(ctx context.Context, tokenID uuid.UUID) error {
	query := `
		UPDATE auth.password_reset_tokens
		SET used = TRUE
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to update password reset token state: %w", err)
	}
	return nil
}
