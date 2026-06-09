package repository

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgxpool"

    "github.com/rickmwas/swizauth/auth-service/internal/domain"
)

type OnboardingRepository interface {
    CreateOrgUserSession(ctx context.Context, org *domain.Organization, user *domain.User, session *domain.Session, refreshTokenHash string, refreshExpiry time.Time) error
}

type onboardingRepository struct{
    db *pgxpool.Pool
}

func NewOnboardingRepository(db *pgxpool.Pool) OnboardingRepository {
    return &onboardingRepository{db: db}
}

func (r *onboardingRepository) CreateOrgUserSession(ctx context.Context, org *domain.Organization, user *domain.User, session *domain.Session, refreshTokenHash string, refreshExpiry time.Time) error {
    tx, err := r.db.Begin(ctx)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }
    defer func(){ _ = tx.Rollback(ctx) }()

    // Insert organization
    orgQuery := `INSERT INTO public.organizations (id, name, slug, logo_url, status, plan, owner_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`
    _, err = tx.Exec(ctx, orgQuery, org.ID, org.Name, org.Slug, org.LogoURL, org.Status, org.Plan, org.OwnerID, org.CreatedAt, org.UpdatedAt)
    if err != nil {
        return fmt.Errorf("failed to insert organization: %w", err)
    }

    // Insert user
    userQuery := `INSERT INTO auth.users (id, organization_id, email, phone, username, password_hash, first_name, last_name, avatar_url, email_verified, phone_verified, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`
    _, err = tx.Exec(ctx, userQuery, user.ID, user.OrganizationID, user.Email, user.Phone, user.Username, user.PasswordHash, user.FirstName, user.LastName, user.AvatarURL, user.EmailVerified, user.PhoneVerified, user.Status, user.CreatedAt, user.UpdatedAt)
    if err != nil {
        return fmt.Errorf("failed to insert user: %w", err)
    }

    // Insert session
    sessionQuery := `INSERT INTO auth.sessions (id, user_id, organization_id, device_name, browser, ip_address, country, city, user_agent, last_activity_at, expires_at, revoked, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`
    _, err = tx.Exec(ctx, sessionQuery, session.ID, session.UserID, session.OrganizationID, session.DeviceName, session.Browser, session.IPAddress, session.Country, session.City, session.UserAgent, session.LastActivityAt, session.ExpiresAt, session.Revoked, session.CreatedAt)
    if err != nil {
        return fmt.Errorf("failed to insert session: %w", err)
    }

    // Insert refresh token
    tokenID, terr := uuid.NewV7()
    if terr != nil {
        tokenID = uuid.New()
    }
    tokenQuery := `INSERT INTO auth.refresh_tokens (id, session_id, user_id, token_hash, expires_at, revoked, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`
    _, err = tx.Exec(ctx, tokenQuery, tokenID, session.ID, session.UserID, refreshTokenHash, refreshExpiry, false, time.Now())
    if err != nil {
        return fmt.Errorf("failed to insert refresh token: %w", err)
    }

    if err := tx.Commit(ctx); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }
    return nil
}
