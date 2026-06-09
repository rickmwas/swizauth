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

// Repository errors
var (
	ErrSessionNotFound = errors.New("session not found")
)

// SessionRepository executes atomic transactions on sessions and token storage
type SessionRepository interface {
	CreateSessionAndToken(ctx context.Context, s *domain.Session, tokenHash string, tokenExpiry time.Time) error
	GetSession(ctx context.Context, sessionID uuid.UUID) (*domain.Session, error)
	RevokeSession(ctx context.Context, sessionID uuid.UUID) error
	RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error
	GetRefreshToken(ctx context.Context, tokenHash string) (*domain.RefreshToken, error)
	RotateRefreshToken(ctx context.Context, oldTokenHash string, newTokenHash string, newTokenExpiry time.Time) (*domain.Session, error)
}

type sessionRepository struct {
	db *pgxpool.Pool
}

// NewSessionRepository instantiates concrete implementation of session repository
func NewSessionRepository(db *pgxpool.Pool) SessionRepository {
	return &sessionRepository{db: db}
}

// CreateSessionAndToken performs an atomic transaction inserting both active session record and refresh token
func (r *sessionRepository) CreateSessionAndToken(ctx context.Context, s *domain.Session, tokenHash string, tokenExpiry time.Time) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// 1. Insert Session record
	sessionQuery := `
		INSERT INTO auth.sessions (
			id, user_id, organization_id, device_name, browser, ip_address, 
			country, city, user_agent, last_activity_at, expires_at, 
			revoked, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	_, err = tx.Exec(ctx, sessionQuery,
		s.ID, s.UserID, s.OrganizationID, s.DeviceName, s.Browser, s.IPAddress,
		s.Country, s.City, s.UserAgent, s.LastActivityAt, s.ExpiresAt,
		s.Revoked, s.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert session in transaction: %w", err)
	}

	// 2. Insert RefreshToken record
	tokenID, err := uuid.NewV7()
	if err != nil {
		tokenID = uuid.New()
	}

	tokenQuery := `
		INSERT INTO auth.refresh_tokens (
			id, session_id, user_id, token_hash, expires_at, revoked, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.Exec(ctx, tokenQuery,
		tokenID, s.ID, s.UserID, tokenHash, tokenExpiry, false, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to insert refresh token in transaction: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetSession fetches a session metadata record by its ID
func (r *sessionRepository) GetSession(ctx context.Context, sessionID uuid.UUID) (*domain.Session, error) {
	query := `
		SELECT 
			id, user_id, organization_id, device_name, browser, ip_address::TEXT, 
			country, city, user_agent, last_activity_at, expires_at, 
			revoked, created_at
		FROM auth.sessions
		WHERE id = $1
	`

	var s domain.Session
	err := r.db.QueryRow(ctx, query, sessionID).Scan(
		&s.ID, &s.UserID, &s.OrganizationID, &s.DeviceName, &s.Browser, &s.IPAddress,
		&s.Country, &s.City, &s.UserAgent, &s.LastActivityAt, &s.ExpiresAt,
		&s.Revoked, &s.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to query session: %w", err)
	}

	return &s, nil
}

// RevokeSession flags a session and its associated refresh tokens as revoked in database
func (r *sessionRepository) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// Revoke Session
	sessionQuery := `UPDATE auth.sessions SET revoked = TRUE WHERE id = $1`
	_, err = tx.Exec(ctx, sessionQuery, sessionID)
	if err != nil {
		return fmt.Errorf("failed to revoke session in transaction: %w", err)
	}

	// Revoke Refresh Tokens
	tokenQuery := `UPDATE auth.refresh_tokens SET revoked = TRUE WHERE session_id = $1`
	_, err = tx.Exec(ctx, tokenQuery, sessionID)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh tokens in transaction: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// RevokeAllUserSessions flags all active sessions and refresh tokens of a user as revoked in database
func (r *sessionRepository) RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// Revoke active sessions
	sessionQuery := `UPDATE auth.sessions SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`
	_, err = tx.Exec(ctx, sessionQuery, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke user sessions: %w", err)
	}

	// Revoke active refresh tokens
	tokenQuery := `UPDATE auth.refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE`
	_, err = tx.Exec(ctx, tokenQuery, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke user refresh tokens: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetRefreshToken retrieves refresh token by hash
func (r *sessionRepository) GetRefreshToken(ctx context.Context, tokenHash string) (*domain.RefreshToken, error) {
	query := `
		SELECT id, session_id, user_id, token_hash, expires_at, revoked, created_at
		FROM auth.refresh_tokens
		WHERE token_hash = $1
	`
	var t domain.RefreshToken
	err := r.db.QueryRow(ctx, query, tokenHash).Scan(
		&t.ID, &t.SessionID, &t.UserID, &t.TokenHash, &t.ExpiresAt, &t.Revoked, &t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("refresh token not found")
		}
		return nil, fmt.Errorf("failed to query refresh token: %w", err)
	}
	return &t, nil
}

// RotateRefreshToken invalidates old refresh token, generates a new one, and returns current active session
func (r *sessionRepository) RotateRefreshToken(ctx context.Context, oldTokenHash string, newTokenHash string, newTokenExpiry time.Time) (*domain.Session, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// 1. Fetch old token with write lock
	var oldToken domain.RefreshToken
	queryOld := `
		SELECT id, session_id, user_id, token_hash, expires_at, revoked, created_at
		FROM auth.refresh_tokens
		WHERE token_hash = $1
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, queryOld, oldTokenHash).Scan(
		&oldToken.ID, &oldToken.SessionID, &oldToken.UserID, &oldToken.TokenHash, &oldToken.ExpiresAt, &oldToken.Revoked, &oldToken.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("refresh token not found")
		}
		return nil, fmt.Errorf("failed to fetch old token: %w", err)
	}

	// 2. Replay attack mitigation: If old token is already revoked, revoke the entire session
	if oldToken.Revoked {
		_, _ = tx.Exec(ctx, `UPDATE auth.sessions SET revoked = TRUE WHERE id = $1`, oldToken.SessionID)
		_, _ = tx.Exec(ctx, `UPDATE auth.refresh_tokens SET revoked = TRUE WHERE session_id = $1`, oldToken.SessionID)
		_ = tx.Commit(ctx)
		return nil, errors.New("refresh token already revoked, entire session terminated")
	}

	// 3. Mark old token as revoked
	_, err = tx.Exec(ctx, `UPDATE auth.refresh_tokens SET revoked = TRUE WHERE id = $1`, oldToken.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to revoke old token: %w", err)
	}

	// 4. Generate new refresh token row
	newTokenID, err := uuid.NewV7()
	if err != nil {
		newTokenID = uuid.New()
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO auth.refresh_tokens (
			id, session_id, user_id, token_hash, expires_at, revoked, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, newTokenID, oldToken.SessionID, oldToken.UserID, newTokenHash, newTokenExpiry, false, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to insert new refresh token: %w", err)
	}

	// 5. Update session activity
	_, err = tx.Exec(ctx, `
		UPDATE auth.sessions
		SET last_activity_at = $1
		WHERE id = $2 AND revoked = FALSE
	`, time.Now(), oldToken.SessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to update session activity: %w", err)
	}

	// 6. Return session details
	var s domain.Session
	querySession := `
		SELECT id, user_id, organization_id, device_name, browser, ip_address::TEXT, 
		       country, city, user_agent, last_activity_at, expires_at, revoked, created_at
		FROM auth.sessions
		WHERE id = $1
	`
	err = tx.QueryRow(ctx, querySession, oldToken.SessionID).Scan(
		&s.ID, &s.UserID, &s.OrganizationID, &s.DeviceName, &s.Browser, &s.IPAddress,
		&s.Country, &s.City, &s.UserAgent, &s.LastActivityAt, &s.ExpiresAt, &s.Revoked, &s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch session: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &s, nil
}
