package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/rickmwas/tsauth/auth-service/internal/domain"
)

// Repository errors
var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
)

// UserRepository handles user persistence operations
type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, orgID uuid.UUID, email string) (*domain.User, error)
	GetUserByEmailGlobal(ctx context.Context, email string) (*domain.User, error)
	GetUserRolesAndPermissions(ctx context.Context, userID uuid.UUID) (roles []string, permissions []string, err error)
	UpdateLastLogin(ctx context.Context, userID uuid.UUID) error
	VerifyEmail(ctx context.Context, userID uuid.UUID) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
	GetUserByID(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	GetUserByUsernameInOrg(ctx context.Context, username string, orgID uuid.UUID) (*domain.User, error)
	GetUserByEmailInOrg(ctx context.Context, email string, orgID uuid.UUID) (*domain.User, error)
	UpdateUserProfile(ctx context.Context, userID uuid.UUID, updateData map[string]interface{}) error
}

type userRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository instantiates concrete repository implementation
func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

// CreateUser inserts a user record in the auth.users table, throwing ErrEmailAlreadyExists on conflict
func (r *userRepository) CreateUser(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO auth.users (
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	_, err := r.db.Exec(ctx, query,
		u.ID, u.OrganizationID, u.Email, u.Phone, u.Username, u.PasswordHash,
		u.FirstName, u.LastName, u.AvatarURL, u.EmailVerified,
		u.PhoneVerified, u.Status, u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
			return ErrEmailAlreadyExists
		}
		return fmt.Errorf("failed to insert user: %w", err)
	}

	return nil
}

// GetUserByEmail fetches a user record scoped to the target organization ID
func (r *userRepository) GetUserByEmail(ctx context.Context, orgID uuid.UUID, email string) (*domain.User, error) {
	query := `
		SELECT 
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, last_login_at, created_at, updated_at
		FROM auth.users
		WHERE organization_id = $1 AND email = $2 AND deleted_at IS NULL
	`

	var u domain.User
	err := r.db.QueryRow(ctx, query, orgID, email).Scan(
		&u.ID, &u.OrganizationID, &u.Email, &u.Phone, &u.Username, &u.PasswordHash,
		&u.FirstName, &u.LastName, &u.AvatarURL, &u.EmailVerified,
		&u.PhoneVerified, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	return &u, nil
}

// GetUserByEmailGlobal fetches a user record by email globally (across all organizations)
func (r *userRepository) GetUserByEmailGlobal(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT 
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, last_login_at, created_at, updated_at
		FROM auth.users
		WHERE email = $1 AND deleted_at IS NULL
	`

	var u domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.OrganizationID, &u.Email, &u.Phone, &u.Username, &u.PasswordHash,
		&u.FirstName, &u.LastName, &u.AvatarURL, &u.EmailVerified,
		&u.PhoneVerified, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to fetch user globally: %w", err)
	}

	return &u, nil
}


// GetUserRolesAndPermissions fetches role names and DISTINCT permission names associated with a user
func (r *userRepository) GetUserRolesAndPermissions(ctx context.Context, userID uuid.UUID) (roles []string, permissions []string, err error) {
	// Query user roles
	rolesQuery := `
		SELECT r.name
		FROM auth.roles r
		JOIN auth.user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`
	rows, err := r.db.Query(ctx, rolesQuery, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query roles: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	// Query user permissions
	permissionsQuery := `
		SELECT DISTINCT p.name
		FROM auth.permissions p
		JOIN auth.role_permissions rp ON p.id = rp.permission_id
		JOIN auth.user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1
	`
	rowsP, err := r.db.Query(ctx, permissionsQuery, userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query permissions: %w", err)
	}
	defer rowsP.Close()

	for rowsP.Next() {
		var perm string
		if err := rowsP.Scan(&perm); err != nil {
			return nil, nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}

	// Graceful slice instantiations
	if roles == nil {
		roles = []string{}
	}
	if permissions == nil {
		permissions = []string{}
	}

	return roles, permissions, nil
}

// UpdateLastLogin records timestamp of a successful authentication session
func (r *userRepository) UpdateLastLogin(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE auth.users
		SET last_login_at = $1, updated_at = $2
		WHERE id = $3 AND deleted_at IS NULL
	`
	now := time.Now()
	_, err := r.db.Exec(ctx, query, now, now, userID)
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}
	return nil
}

// VerifyEmail updates email_verified = true
func (r *userRepository) VerifyEmail(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE auth.users
		SET email_verified = TRUE, updated_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`
	_, err := r.db.Exec(ctx, query, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to verify email: %w", err)
	}
	return nil
}

// UpdatePassword updates the password hash
func (r *userRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `
		UPDATE auth.users
		SET password_hash = $1, updated_at = $2
		WHERE id = $3 AND deleted_at IS NULL
	`
	_, err := r.db.Exec(ctx, query, passwordHash, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}

// GetUserByID fetches a user record by their ID
func (r *userRepository) GetUserByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	query := `
		SELECT 
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, last_login_at, created_at, updated_at
		FROM auth.users
		WHERE id = $1 AND deleted_at IS NULL
	`

	var u domain.User
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&u.ID, &u.OrganizationID, &u.Email, &u.Phone, &u.Username, &u.PasswordHash,
		&u.FirstName, &u.LastName, &u.AvatarURL, &u.EmailVerified,
		&u.PhoneVerified, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to fetch user by id: %w", err)
	}

	return &u, nil
}


// GetUserByUsernameInOrg fetches a user by username within a specific organization
func (r *userRepository) GetUserByUsernameInOrg(ctx context.Context, username string, orgID uuid.UUID) (*domain.User, error) {
	query := `
		SELECT 
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, last_login_at, created_at, updated_at
		FROM auth.users 
		WHERE username = $1 AND organization_id = $2 AND deleted_at IS NULL
	`

	var u domain.User
	err := r.db.QueryRow(ctx, query, username, orgID).Scan(
		&u.ID, &u.OrganizationID, &u.Email, &u.Phone, &u.Username, &u.PasswordHash,
		&u.FirstName, &u.LastName, &u.AvatarURL, &u.EmailVerified,
		&u.PhoneVerified, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user by username in org: %w", err)
	}

	return &u, nil
}

// GetUserByEmailInOrg fetches a user by email within a specific organization
func (r *userRepository) GetUserByEmailInOrg(ctx context.Context, email string, orgID uuid.UUID) (*domain.User, error) {
	query := `
		SELECT 
			id, organization_id, email, phone, username, password_hash, 
			first_name, last_name, avatar_url, email_verified, 
			phone_verified, status, last_login_at, created_at, updated_at
		FROM auth.users 
		WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL
	`

	var u domain.User
	err := r.db.QueryRow(ctx, query, email, orgID).Scan(
		&u.ID, &u.OrganizationID, &u.Email, &u.Phone, &u.Username, &u.PasswordHash,
		&u.FirstName, &u.LastName, &u.AvatarURL, &u.EmailVerified,
		&u.PhoneVerified, &u.Status, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to query user by email in org: %w", err)
	}

	return &u, nil
}

// UpdateUserProfile updates user profile fields
func (r *userRepository) UpdateUserProfile(ctx context.Context, userID uuid.UUID, updateData map[string]interface{}) error {
	// Build dynamic update query
	setParts := make([]string, 0, len(updateData))
	args := make([]interface{}, 0, len(updateData)+1)
	argIndex := 1

	for field, value := range updateData {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	query := fmt.Sprintf(`
		UPDATE auth.users 
		SET %s 
		WHERE id = $%d AND deleted_at IS NULL
	`, strings.Join(setParts, ", "), argIndex)
	
	args = append(args, userID)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update user profile: %w", err)
	}

	return nil
}