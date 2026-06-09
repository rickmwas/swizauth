package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rickmwas/swizauth/auth-service/internal/domain"
)

var ErrOrganizationNotFound = errors.New("organization not found")

type OrganizationRepository interface {
	GetOrganizationByID(ctx context.Context, organizationID uuid.UUID) (*domain.Organization, error)
}

type organizationRepository struct {
	db *pgxpool.Pool
}

func NewOrganizationRepository(db *pgxpool.Pool) OrganizationRepository {
	return &organizationRepository{db: db}
}

func (r *organizationRepository) GetOrganizationByID(ctx context.Context, organizationID uuid.UUID) (*domain.Organization, error) {
	query := `
		SELECT id, name, slug, logo_url, status, plan, owner_id, created_at, updated_at
		FROM public.organizations
		WHERE id = $1
	`

	var org domain.Organization
	if err := r.db.QueryRow(ctx, query, organizationID).Scan(
		&org.ID,
		&org.Name,
		&org.Slug,
		&org.LogoURL,
		&org.Status,
		&org.Plan,
		&org.OwnerID,
		&org.CreatedAt,
		&org.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrOrganizationNotFound
		}
		return nil, fmt.Errorf("failed to fetch organization by id: %w", err)
	}

	return &org, nil
}
