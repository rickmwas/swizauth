package http

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/rickmwas/swizauth/auth-service/internal/domain"
	"github.com/rickmwas/swizauth/auth-service/internal/repository"
	"github.com/rickmwas/swizauth/auth-service/internal/service"
)

// AuthHandler holds route handler methods and injected dependencies
type AuthHandler struct {
	userRepo         repository.UserRepository
	sessionRepo      repository.SessionRepository
	verificationRepo repository.VerificationRepository
	mfaRepo          repository.MfaRepository
	organizationRepo repository.OrganizationRepository
	onboardingRepo   repository.OnboardingRepository
	passwordSvc      service.PasswordService
	tokenSvc         service.TokenService
	cryptoSvc        service.CryptoService
	totpSvc          service.TotpService
	redis            *redis.Client
}

// NewAuthHandler instantiates a route handler controller
func NewAuthHandler(
	userRepo repository.UserRepository,
	sessionRepo repository.SessionRepository,
	verificationRepo repository.VerificationRepository,
	mfaRepo repository.MfaRepository,
	organizationRepo repository.OrganizationRepository,
	onboardingRepo repository.OnboardingRepository,
	passwordSvc service.PasswordService,
	tokenSvc service.TokenService,
	cryptoSvc service.CryptoService,
	totpSvc service.TotpService,
	rdb *redis.Client,
) *AuthHandler {
	return &AuthHandler{
		userRepo:         userRepo,
		sessionRepo:      sessionRepo,
		verificationRepo: verificationRepo,
		mfaRepo:          mfaRepo,
		organizationRepo: organizationRepo,
		onboardingRepo:   onboardingRepo,
		passwordSvc:      passwordSvc,
		tokenSvc:         tokenSvc,
		cryptoSvc:        cryptoSvc,
		totpSvc:          totpSvc,
		redis:            rdb,
	}
}

// Register registers a new user under an existing organization
// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	// Validate password strength criteria
	if err := h.passwordSvc.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	orgUUID, err := uuid.Parse(req.OrganizationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid organization_id format",
			},
		})
		return
	}

	// Encrypt credentials
	passwordHash, err := h.passwordSvc.HashPassword(req.Password)
	if err != nil {
		c.Error(fmt.Errorf("failed to hash password: %w", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Internal server error occurred",
			},
		})
		return
	}

	userID, err := uuid.NewV7()
	if err != nil {
		userID = uuid.New()
	}

	now := time.Now()
	emailClean := strings.ToLower(strings.TrimSpace(req.Email))
	user := &domain.User{
		ID:             userID,
		OrganizationID: orgUUID,
		Email:          emailClean,
		Username:       &emailClean,
		PasswordHash:   passwordHash,
		FirstName:      strings.TrimSpace(req.FirstName),
		LastName:       strings.TrimSpace(req.LastName),
		EmailVerified:  false,
		PhoneVerified:  false,
		Status:         "active",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	// Persist user record
	if err := h.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		if errors.Is(err, repository.ErrEmailAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "EMAIL_EXISTS",
					"message": "Email address already registered for this tenant",
				},
			})
			return
		}
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to create user record",
			},
		})
		return
	}

	// Generate and store Email Verification Token
	verificationToken := uuid.New().String()
	vHasher := sha256.New()
	vHasher.Write([]byte(verificationToken))
	vTokenHash := hex.EncodeToString(vHasher.Sum(nil))
	vExpiry := time.Now().Add(24 * time.Hour) // Expires in 24 hours

	if err := h.verificationRepo.CreateEmailVerificationToken(c.Request.Context(), userID, vTokenHash, vExpiry); err != nil {
		c.Error(fmt.Errorf("failed to create email verification token: %w", err))
	} else {
		// Log the plaintext verification token to stdout for development use
		fmt.Printf("{\"timestamp\":\"%s\",\"level\":\"INFO\",\"service\":\"auth-service\",\"message\":\"[DEVELOPMENT] Email verification link for %s: http://localhost:3000/auth/verify-email?token=%s\"}\n",
			time.Now().Format(time.RFC3339), user.Email, verificationToken)
	}

	c.JSON(http.StatusCreated, domain.RegisterResponse{
		Success: true,
		Message: "Registration successful",
		UserID:  userID.String(),
	})
}

// Onboard creates a new organization and user, establishes a session, and returns tokens.
// POST /api/v1/auth/onboard
func (h *AuthHandler) Onboard(c *gin.Context) {
	var req struct {
		Email           string `json:"email" binding:"required,email"`
		Password        string `json:"password" binding:"required"`
		OrganizationName string `json:"organization_name" binding:"required"`
		Slug            string `json:"slug"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid request body parameters"}})
		return
	}

	ctx := c.Request.Context()

	// Create org
	orgID, err := uuid.NewV7()
	if err != nil {
		orgID = uuid.New()
	}
	now := time.Now()
	org := &domain.Organization{
		ID: orgID,
		Name: req.OrganizationName,
		Slug: req.Slug,
		Status: "active",
		Plan: "FREE",
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Hash password
	passwordHash, err := h.passwordSvc.HashPassword(req.Password)
	if err != nil {
		c.Error(fmt.Errorf("failed to hash password: %w", err))
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "Internal server error occurred"}})
		return
	}

	userID, err := uuid.NewV7()
	if err != nil {
		userID = uuid.New()
	}

	emailClean := strings.ToLower(strings.TrimSpace(req.Email))
	user := &domain.User{
		ID: userID,
		OrganizationID: org.ID,
		Email: emailClean,
		Username: &emailClean,
		PasswordHash: passwordHash,
		EmailVerified: false,
		PhoneVerified: false,
		Status: "active",
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Create session data
	sessionID, err := uuid.NewV7()
	if err != nil {
		sessionID = uuid.New()
	}
	userAgent := c.GetHeader("User-Agent")
	ipAddress := c.ClientIP()
	sessionExpiry := time.Now().Add(30 * 24 * time.Hour)
	session := &domain.Session{
		ID: sessionID,
		UserID: user.ID,
		OrganizationID: org.ID,
		IPAddress: &ipAddress,
		UserAgent: &userAgent,
		LastActivityAt: time.Now(),
		ExpiresAt: sessionExpiry,
		Revoked: false,
		CreatedAt: time.Now(),
	}

	accessToken, err := h.tokenSvc.GenerateAccessToken(user, sessionID, []string{}, []string{})
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "Failed to issue access token"}})
		return
	}

	rawRefreshToken, err := h.tokenSvc.GenerateRefreshToken()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "Failed to issue refresh token"}})
		return
	}

	hasher := sha256.New()
	hasher.Write([]byte(rawRefreshToken))
	hashedRefreshToken := hex.EncodeToString(hasher.Sum(nil))

	// Perform transactional insert for org, user, session, and refresh token
	if err := h.onboardingRepo.CreateOrgUserSession(ctx, org, user, session, hashedRefreshToken, sessionExpiry); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_SERVER_ERROR", "message": "Failed to complete onboarding"}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"tokens": gin.H{
			"access_token": accessToken,
			"refresh_token": rawRefreshToken,
		},
		"user": gin.H{
			"id": user.ID.String(),
			"email": user.Email,
		},
		"organization": gin.H{
			"id": org.ID.String(),
			"name": org.Name,
			"slug": org.Slug,
			"plan": org.Plan,
		},
	})
}

// Login validates user credentials, updates metadata, and returns JWT tokens
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid email or password",
			},
		})
		return
	}

	ctx := c.Request.Context()
	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Fetch user details globally since organization ID is not in login body
	user, err := h.userRepo.GetUserByEmailGlobal(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INVALID_CREDENTIALS",
					"message": "Invalid email or password credentials",
				},
			})
			return
		}
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Authentication failed",
			},
		})
		return
	}

	// Verify status
	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "FORBIDDEN",
				"message": fmt.Sprintf("User account status is '%s'", user.Status),
			},
		})
		return
	}

	// Match password
	match, err := h.passwordSvc.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !match {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid email or password credentials",
			},
		})
		return
	}

	// Resolve roles & permissions
	roles, permissions, err := h.userRepo.GetUserRolesAndPermissions(ctx, user.ID)
	if err != nil {
		c.Error(fmt.Errorf("failed to fetch user roles/permissions: %w", err))
	}

	// Check if MFA is enabled for this user
	mfaConfig, err := h.mfaRepo.GetMfaConfig(ctx, user.ID)
	if err == nil && mfaConfig != nil && mfaConfig.Enabled {
		mfaToken, err := h.tokenSvc.GenerateMfaToken(user.ID, user.OrganizationID)
		if err != nil {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INTERNAL_SERVER_ERROR",
					"message": "Failed to initiate MFA challenge",
				},
			})
			return
		}

		c.JSON(http.StatusOK, domain.LoginResponse{
			MfaRequired: true,
			MfaToken:    mfaToken,
		})
		return
	}

	// Create Session ID
	sessionID, err := uuid.NewV7()
	if err != nil {
		sessionID = uuid.New()
	}

	// Parse user agent info
	userAgent := c.GetHeader("User-Agent")
	ipAddress := c.ClientIP()

	now := time.Now()
	sessionExpiry := now.Add(30 * 24 * time.Hour) // 30 Days

	session := &domain.Session{
		ID:             sessionID,
		UserID:         user.ID,
		OrganizationID: user.OrganizationID,
		IPAddress:      &ipAddress,
		UserAgent:      &userAgent,
		LastActivityAt: now,
		ExpiresAt:      sessionExpiry,
		Revoked:        false,
		CreatedAt:      now,
	}

	// Generate tokens
	accessToken, err := h.tokenSvc.GenerateAccessToken(user, sessionID, roles, permissions)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to issue access token",
			},
		})
		return
	}

	rawRefreshToken, err := h.tokenSvc.GenerateRefreshToken()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to issue refresh token",
			},
		})
		return
	}

	// Hash the refresh token before database storage (SHA-256)
	hasher := sha256.New()
	hasher.Write([]byte(rawRefreshToken))
	hashedRefreshToken := hex.EncodeToString(hasher.Sum(nil))

	// Commit Session to Database
	if err := h.sessionRepo.CreateSessionAndToken(ctx, session, hashedRefreshToken, sessionExpiry); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to establish login session",
			},
		})
		return
	}

	// Update last login timestamp asynchronously
	go func(uid uuid.UUID) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.userRepo.UpdateLastLogin(bgCtx, uid)
	}(user.ID)

	c.JSON(http.StatusOK, domain.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
		ExpiresIn:    900, // 15 Minutes in seconds
		User: &domain.UserPublic{
			ID:             user.ID,
			OrganizationID: user.OrganizationID,
			Email:          user.Email,
			FirstName:      user.FirstName,
			LastName:       user.LastName,
		},
	})
}

// Verify decodes and statelessly validates a bearer token, checking for revocation blacklists
// GET /api/v1/auth/verify
func (h *AuthHandler) Verify(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Missing or malformed Authorization header",
			},
		})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid or expired access token",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	orgIDStr, _ := claims["org"].(string)
	sessionIDStr, _ := claims["session_id"].(string)
	iatVal, _ := claims["iat"].(float64)
	iatTime := time.Unix(int64(iatVal), 0)

	ctx := c.Request.Context()

	// 1. Check if user-level logout-all has occurred since token was issued
	logoutAllKey := fmt.Sprintf("user:logout-all:%s", userIDStr)
	logoutAllVal, err := h.redis.Get(ctx, logoutAllKey).Result()
	if err == nil && logoutAllVal != "" {
		var logoutTimestamp int64
		if _, scanErr := fmt.Sscanf(logoutAllVal, "%d", &logoutTimestamp); scanErr == nil {
			if iatTime.Before(time.Unix(logoutTimestamp, 0)) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "UNAUTHORIZED",
						"message": "Token was invalidated by global logout",
					},
				})
				return
			}
		}
	}

	// 2. Check Redis session revocation blacklist
	revokedKey := fmt.Sprintf("session:revoked:%s", sessionIDStr)
	blacklisted, err := h.redis.Exists(ctx, revokedKey).Result()
	if err == nil && blacklisted > 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Session has been revoked",
			},
		})
		return
	}

	// 3. Falling back to DB check if no cached record exists (caching is reactive)
	sessionUUID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid session identifier",
			},
		})
		return
	}

	session, err := h.sessionRepo.GetSession(ctx, sessionUUID)
	if err != nil || session.Revoked || session.ExpiresAt.Before(time.Now()) {
		// Cache revocation to stop future DB hits
		_ = h.redis.Set(ctx, revokedKey, "true", 15*time.Minute).Err()

		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Session is revoked or expired",
			},
		})
		return
	}

	// Inject metadata into current Gin context for logger access
	c.Set("user_id", userIDStr)
	c.Set("organization_id", orgIDStr)

	// Format response payload
	var verifyResp domain.VerifyResponse
	verifyResp.Authenticated = true
	verifyResp.User.ID, _ = uuid.Parse(userIDStr)
	verifyResp.User.OrganizationID, _ = uuid.Parse(orgIDStr)
	verifyResp.User.Email, _ = claims["email"].(string)

	user, fetchErr := h.userRepo.GetUserByEmailGlobal(ctx, verifyResp.User.Email)
	if fetchErr == nil {
		verifyResp.User.FirstName = user.FirstName
		verifyResp.User.LastName = user.LastName
	}

	verifyResp.Organization.ID = verifyResp.User.OrganizationID

	// Map roles and permissions
	if rolesClaim, ok := claims["roles"].([]interface{}); ok {
		for _, r := range rolesClaim {
			if rStr, ok := r.(string); ok {
				verifyResp.Roles = append(verifyResp.Roles, rStr)
			}
		}
	}
	if permsClaim, ok := claims["permissions"].([]interface{}); ok {
		for _, p := range permsClaim {
			if pStr, ok := p.(string); ok {
				verifyResp.Permissions = append(verifyResp.Permissions, pStr)
			}
		}
	}

	if verifyResp.Roles == nil {
		verifyResp.Roles = []string{}
	}
	if verifyResp.Permissions == nil {
		verifyResp.Permissions = []string{}
	}

	c.JSON(http.StatusOK, verifyResp)
}

// Logout invalidates a single session ID in database and cache
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Authorization header is required",
			},
		})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid token",
			},
		})
		return
	}

	sessionIDStr, _ := claims["session_id"].(string)
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Malformed session claims",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Revoke in PostgreSQL
	if err := h.sessionRepo.RevokeSession(ctx, sessionID); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to revoke session",
			},
		})
		return
	}

	// Cache blacklist revocation in Redis (expire after 15 mins since JWT expires by then)
	revokedKey := fmt.Sprintf("session:revoked:%s", sessionIDStr)
	_ = h.redis.Set(ctx, revokedKey, "true", 15*time.Minute).Err()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// LogoutAll revokes all sessions of the authenticated user
// POST /api/v1/auth/logout-all
func (h *AuthHandler) LogoutAll(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Authorization header is required",
			},
		})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid token",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Malformed user claims",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Revoke all sessions in PostgreSQL
	if err := h.sessionRepo.RevokeAllUserSessions(ctx, userID); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to revoke user sessions",
			},
		})
		return
	}

	// Record global logout time in Redis to invalidate all previous JWTs instantly
	logoutAllKey := fmt.Sprintf("user:logout-all:%s", userIDStr)
	_ = h.redis.Set(ctx, logoutAllKey, fmt.Sprintf("%d", time.Now().Unix()), 15*time.Minute).Err()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// Refresh performs refresh token rotation
// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req domain.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Hash the incoming refresh token
	hasher := sha256.New()
	hasher.Write([]byte(req.RefreshToken))
	oldHash := hex.EncodeToString(hasher.Sum(nil))

	// Fetch old refresh token to check expiration
	oldToken, err := h.sessionRepo.GetRefreshToken(ctx, oldHash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid or expired refresh token",
			},
		})
		return
	}

	if oldToken.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Refresh token has expired",
			},
		})
		return
	}

	// Generate new refresh token
	newRawToken, err := h.tokenSvc.GenerateRefreshToken()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to generate new refresh token",
			},
		})
		return
	}

	newHasher := sha256.New()
	newHasher.Write([]byte(newRawToken))
	newHash := hex.EncodeToString(newHasher.Sum(nil))
	newExpiry := time.Now().Add(30 * 24 * time.Hour) // 30 days

	// Rotate token
	session, err := h.sessionRepo.RotateRefreshToken(ctx, oldHash, newHash, newExpiry)
	if err != nil {
		// RotateRefreshToken invalidates session if already revoked (replay)
		c.Error(err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": err.Error(),
			},
		})
		return
	}

	// Fetch user details for Access Token generation
	user, err := h.userRepo.GetUserByID(ctx, session.UserID)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to fetch user metadata",
			},
		})
		return
	}

	// Resolve roles & permissions
	roles, permissions, err := h.userRepo.GetUserRolesAndPermissions(ctx, user.ID)
	if err != nil {
		c.Error(err)
	}

	// Generate Access Token
	accessToken, err := h.tokenSvc.GenerateAccessToken(user, session.ID, roles, permissions)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to generate new access token",
			},
		})
		return
	}

	c.JSON(http.StatusOK, domain.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: newRawToken,
		ExpiresIn:    900,
		User: &domain.UserPublic{
			ID:             user.ID,
			OrganizationID: user.OrganizationID,
			Email:          user.Email,
			FirstName:      user.FirstName,
			LastName:       user.LastName,
		},
	})
}

// VerifyEmail confirms email verification using token
// POST /api/v1/auth/email/verify
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req domain.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	ctx := c.Request.Context()

	hasher := sha256.New()
	hasher.Write([]byte(req.Token))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	userID, tokenID, expiresAt, used, err := h.verificationRepo.GetEmailVerificationToken(ctx, tokenHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Email verification token not found",
			},
		})
		return
	}

	if used {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Email verification token has already been used",
			},
		})
		return
	}

	if expiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Email verification token has expired",
			},
		})
		return
	}

	// Update user verification status
	if err := h.userRepo.VerifyEmail(ctx, userID); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to verify email address",
			},
		})
		return
	}

	// Mark token as used
	_ = h.verificationRepo.MarkEmailVerificationTokenUsed(ctx, tokenID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Email address verified successfully",
	})
}

// PasswordResetRequest requests password reset token
// POST /api/v1/auth/password-reset/request
func (h *AuthHandler) PasswordResetRequest(c *gin.Context) {
	var req domain.PasswordResetRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	ctx := c.Request.Context()
	emailClean := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := h.userRepo.GetUserByEmailGlobal(ctx, emailClean)
	if err != nil {
		// Secure response: do not disclose if user exists
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "If the email is registered, a password reset link has been generated",
		})
		return
	}

	resetToken := uuid.New().String()
	hasher := sha256.New()
	hasher.Write([]byte(resetToken))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))
	expiresAt := time.Now().Add(1 * time.Hour) // expires in 1 hour

	if err := h.verificationRepo.CreatePasswordResetToken(ctx, user.ID, tokenHash, expiresAt); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to request password reset",
			},
		})
		return
	}

	// Log plaintext token for development
	fmt.Printf("{\"timestamp\":\"%s\",\"level\":\"INFO\",\"service\":\"auth-service\",\"message\":\"[DEVELOPMENT] Password reset link for %s: http://localhost:3000/auth/password-reset/confirm?token=%s\"}\n",
		time.Now().Format(time.RFC3339), user.Email, resetToken)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "If the email is registered, a password reset link has been generated",
	})
}

// PasswordResetConfirm resets password using token
// POST /api/v1/auth/password-reset/confirm
func (h *AuthHandler) PasswordResetConfirm(c *gin.Context) {
	var req domain.PasswordResetConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	// Validate password strength criteria
	if err := h.passwordSvc.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	ctx := c.Request.Context()

	hasher := sha256.New()
	hasher.Write([]byte(req.Token))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	userID, tokenID, expiresAt, used, err := h.verificationRepo.GetPasswordResetToken(ctx, tokenHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Password reset token not found",
			},
		})
		return
	}

	if used {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Password reset token has already been used",
			},
		})
		return
	}

	if expiresAt.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Password reset token has expired",
			},
		})
		return
	}

	// Hash password using Argon2id
	hashedPassword, err := h.passwordSvc.HashPassword(req.Password)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to update password",
			},
		})
		return
	}

	// Update user password
	if err := h.userRepo.UpdatePassword(ctx, userID, hashedPassword); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to update password in database",
			},
		})
		return
	}

	// Mark token as used
	_ = h.verificationRepo.MarkPasswordResetTokenUsed(ctx, tokenID)

	// Invalidate all active user sessions for safety when credentials change
	_ = h.sessionRepo.RevokeAllUserSessions(ctx, userID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password reset successfully",
	})
}

// MfaSetup generates a pending TOTP MFA secret
// POST /api/v1/auth/mfa/setup
func (h *AuthHandler) MfaSetup(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Bearer token required",
			},
		})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid access token",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid user claims",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Generate TOTP Secret and QR URI
	secret, qrCodeUri, err := h.totpSvc.GenerateSecret(email)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to generate TOTP secret",
			},
		})
		return
	}

	// Encrypt secret for DB storage using AES-256-GCM
	encryptedSecret, err := h.cryptoSvc.Encrypt(secret)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to secure TOTP configuration",
			},
		})
		return
	}

	// Save pending MFA Configuration to DB
	_, err = h.mfaRepo.CreateMfaConfig(ctx, userID, "totp", encryptedSecret)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to record MFA setup",
			},
		})
		return
	}

	c.JSON(http.StatusOK, domain.MfaSetupResponse{
		Success:   true,
		Secret:    secret,
		QrCodeUri: qrCodeUri,
	})
}

// MfaConfirm validates code and enables MFA
// POST /api/v1/auth/mfa/confirm
func (h *AuthHandler) MfaConfirm(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Bearer token required",
			},
		})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid access token",
			},
		})
		return
	}

	var req domain.MfaConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid user claims",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Get MFA configuration
	mfaConfig, err := h.mfaRepo.GetMfaConfig(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "MFA setup has not been initiated",
			},
		})
		return
	}

	// Decrypt the stored secret
	decryptedSecret, err := h.cryptoSvc.Decrypt(mfaConfig.Secret)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to retrieve encryption settings",
			},
		})
		return
	}

	// Validate code
	if !h.totpSvc.VerifyCode(req.Code, decryptedSecret) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid 6-digit verification code",
			},
		})
		return
	}

	// Generate recovery codes
	plainCodes, hashedCodes, err := h.totpSvc.GenerateRecoveryCodes()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to generate recovery codes",
			},
		})
		return
	}

	// Enable MFA in DB and persist recovery codes
	if err := h.mfaRepo.EnableMfaConfig(ctx, mfaConfig.ID, hashedCodes); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to complete MFA confirmation",
			},
		})
		return
	}

	c.JSON(http.StatusOK, domain.MfaConfirmResponse{
		Success:       true,
		RecoveryCodes: plainCodes,
	})
}

// MfaVerify verifies MFA OTP or recovery codes to issue access/refresh tokens
// POST /api/v1/auth/mfa/verify
func (h *AuthHandler) MfaVerify(c *gin.Context) {
	var req domain.MfaVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	if req.Code == "" && req.RecoveryCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Either TOTP code or recovery_code must be provided",
			},
		})
		return
	}

	ctx := c.Request.Context()

	// Verify short-lived MFA token
	userID, _, err := h.tokenSvc.VerifyMfaToken(req.MfaToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "MFA token has expired or is invalid",
			},
		})
		return
	}

	// Fetch MFA Config
	mfaConfig, err := h.mfaRepo.GetMfaConfig(ctx, userID)
	if err != nil || !mfaConfig.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "MFA is not enabled for this user",
			},
		})
		return
	}

	authenticated := false

	if req.Code != "" {
		// Decrypt secret
		decryptedSecret, err := h.cryptoSvc.Decrypt(mfaConfig.Secret)
		if err != nil {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INTERNAL_SERVER_ERROR",
					"message": "Internal verification error",
				},
			})
			return
		}
		// Validate TOTP
		if h.totpSvc.VerifyCode(req.Code, decryptedSecret) {
			authenticated = true
		}
	} else if req.RecoveryCode != "" {
		// Validate recovery code
		hCode := sha256.New()
		hCode.Write([]byte(strings.TrimSpace(req.RecoveryCode)))
		hashedCodeInput := hex.EncodeToString(hCode.Sum(nil))

		codes, err := h.mfaRepo.GetRecoveryCodes(ctx, mfaConfig.ID)
		if err == nil {
			for _, cRecord := range codes {
				if cRecord.CodeHash == hashedCodeInput {
					// Consume code
					if err := h.mfaRepo.UseRecoveryCode(ctx, cRecord.ID); err == nil {
						authenticated = true
					}
					break
				}
			}
		}
	}

	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid verification code",
			},
		})
		return
	}

	// Fetch complete user entity
	user, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "User lookup failed",
			},
		})
		return
	}

	// Resolve roles & permissions
	roles, permissions, err := h.userRepo.GetUserRolesAndPermissions(ctx, user.ID)
	if err != nil {
		c.Error(err)
	}

	// Generate Access and Refresh tokens
	sessionID, err := uuid.NewV7()
	if err != nil {
		sessionID = uuid.New()
	}

	userAgent := c.GetHeader("User-Agent")
	ipAddress := c.ClientIP()
	now := time.Now()
	sessionExpiry := now.Add(30 * 24 * time.Hour) // 30 Days

	session := &domain.Session{
		ID:             sessionID,
		UserID:         user.ID,
		OrganizationID: user.OrganizationID,
		IPAddress:      &ipAddress,
		UserAgent:      &userAgent,
		LastActivityAt: now,
		ExpiresAt:      sessionExpiry,
		Revoked:        false,
		CreatedAt:      now,
	}

	accessToken, err := h.tokenSvc.GenerateAccessToken(user, sessionID, roles, permissions)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to issue access token",
			},
		})
		return
	}

	rawRefreshToken, err := h.tokenSvc.GenerateRefreshToken()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to issue refresh token",
			},
		})
		return
	}

	hasher := sha256.New()
	hasher.Write([]byte(rawRefreshToken))
	hashedRefreshToken := hex.EncodeToString(hasher.Sum(nil))

	// Commit Session to Database
	if err := h.sessionRepo.CreateSessionAndToken(ctx, session, hashedRefreshToken, sessionExpiry); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to establish login session",
			},
		})
		return
	}

	// Update last login timestamp asynchronously
	go func(uid uuid.UUID) {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = h.userRepo.UpdateLastLogin(bgCtx, uid)
	}(user.ID)

	c.JSON(http.StatusOK, domain.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefreshToken,
		ExpiresIn:    900,
		User: &domain.UserPublic{
			ID:             user.ID,
			OrganizationID: user.OrganizationID,
			Email:          user.Email,
			FirstName:      user.FirstName,
			LastName:       user.LastName,
		},
	})
}

// InternalVerifyToken validates a user access token internally and returns detailed profile & RBAC claims
// POST /api/v1/internal/verify-token
func (h *AuthHandler) InternalVerifyToken(c *gin.Context) {
	var req domain.InternalVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	claims, err := h.tokenSvc.VerifyAccessToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid or expired access token",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	orgIDStr, _ := claims["org"].(string)
	sessionIDStr, _ := claims["session_id"].(string)
	iatVal, _ := claims["iat"].(float64)
	iatTime := time.Unix(int64(iatVal), 0)

	ctx := c.Request.Context()

	// 1. Check if user-level logout-all has occurred since token was issued
	logoutAllKey := fmt.Sprintf("user:logout-all:%s", userIDStr)
	logoutAllVal, err := h.redis.Get(ctx, logoutAllKey).Result()
	if err == nil && logoutAllVal != "" {
		var logoutTimestamp int64
		if _, scanErr := fmt.Sscanf(logoutAllVal, "%d", &logoutTimestamp); scanErr == nil {
			if iatTime.Before(time.Unix(logoutTimestamp, 0)) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"error": gin.H{
						"code":    "UNAUTHORIZED",
						"message": "Token was invalidated by global logout",
					},
				})
				return
			}
		}
	}

	// 2. Check Redis session revocation blacklist
	revokedKey := fmt.Sprintf("session:revoked:%s", sessionIDStr)
	blacklisted, err := h.redis.Exists(ctx, revokedKey).Result()
	if err == nil && blacklisted > 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Session has been revoked",
			},
		})
		return
	}

	// 3. Verify session state in database
	sessionUUID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid session identifier",
			},
		})
		return
	}

	session, err := h.sessionRepo.GetSession(ctx, sessionUUID)
	if err != nil || session.Revoked || session.ExpiresAt.Before(time.Now()) {
		_ = h.redis.Set(ctx, revokedKey, "true", 15*time.Minute).Err()

		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Session is revoked or expired",
			},
		})
		return
	}

	// Build success response payload
	var verifyResp domain.VerifyResponse
	verifyResp.Authenticated = true
	verifyResp.User.ID, _ = uuid.Parse(userIDStr)
	verifyResp.User.OrganizationID, _ = uuid.Parse(orgIDStr)
	verifyResp.User.Email, _ = claims["email"].(string)

	user, fetchErr := h.userRepo.GetUserByID(ctx, verifyResp.User.ID)
	if fetchErr == nil {
		verifyResp.User.FirstName = user.FirstName
		verifyResp.User.LastName = user.LastName
	}

	verifyResp.Organization.ID = verifyResp.User.OrganizationID

	// Map roles and permissions
	if rolesClaim, ok := claims["roles"].([]interface{}); ok {
		for _, r := range rolesClaim {
			if rStr, ok := r.(string); ok {
				verifyResp.Roles = append(verifyResp.Roles, rStr)
			}
		}
	}
	if permsClaim, ok := claims["permissions"].([]interface{}); ok {
		for _, p := range permsClaim {
			if pStr, ok := p.(string); ok {
				verifyResp.Permissions = append(verifyResp.Permissions, pStr)
			}
		}
	}

	if verifyResp.Roles == nil {
		verifyResp.Roles = []string{}
	}
	if verifyResp.Permissions == nil {
		verifyResp.Permissions = []string{}
	}

	c.JSON(http.StatusOK, verifyResp)
}

// Me returns the current authenticated user's profile, organization, and session
// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Missing or invalid authorization header",
			},
		})
		return
	}

	accessToken := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid access token",
			},
		})
		return
	}

	ctx := context.Background()

	// Get user details
	userIDStr, _ := claims["sub"].(string)
	userID, _ := uuid.Parse(userIDStr)
	user, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_NOT_FOUND",
				"message": "User not found",
			},
		})
		return
	}

	organization, err := h.organizationRepo.GetOrganizationByID(ctx, user.OrganizationID)
	if err != nil {
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Organization not found",
				},
			})
			return
		}
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to load organization",
			},
		})
		return
	}

	// Get session details
	sessionIDStr, _ := claims["session_id"].(string)
	sessionUUID, _ := uuid.Parse(sessionIDStr)
	session, err := h.sessionRepo.GetSession(ctx, sessionUUID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "SESSION_NOT_FOUND",
				"message": "Session not found",
			},
		})
		return
	}

	// Extract claims data
	var roles []string
	var permissions []string

	if rolesClaim, ok := claims["roles"].([]interface{}); ok {
		for _, r := range rolesClaim {
			if rStr, ok := r.(string); ok {
				roles = append(roles, rStr)
			}
		}
	}
	if permsClaim, ok := claims["permissions"].([]interface{}); ok {
		for _, p := range permsClaim {
			if pStr, ok := p.(string); ok {
				permissions = append(permissions, pStr)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": gin.H{
			"id":             user.ID.String(),
			"email":          user.Email,
			"username":       user.Username,
			"firstName":      user.FirstName,
			"lastName":       user.LastName,
			"avatarUrl":      user.AvatarURL,
			"emailVerified":  user.EmailVerified,
			"phoneVerified":  user.PhoneVerified,
			"organizationId": user.OrganizationID.String(),
			"roles":          roles,
			"permissions":    permissions,
			"lastLoginAt":    user.LastLoginAt,
			"createdAt":      user.CreatedAt,
			"updatedAt":      user.UpdatedAt,
		},
		"organization": gin.H{
			"id":      organization.ID.String(),
			"name":    organization.Name,
			"slug":    organization.Slug,
			"logoUrl": organization.LogoURL,
			"plan":    organization.Plan,
			"status":  organization.Status,
		},
		"session": gin.H{
			"id":              session.ID.String(),
			"userId":          session.UserID.String(),
			"organizationId":  session.OrganizationID.String(),
			"expiresAt":       session.ExpiresAt,
			"lastActivityAt":  session.LastActivityAt,
			"deviceName":      session.DeviceName,
			"browser":         session.Browser,
			"ipAddress":       session.IPAddress,
			"country":         session.Country,
			"city":            session.City,
		},
	})
}

// Organizations returns the list of organizations the user belongs to
// GET /api/v1/auth/organizations
func (h *AuthHandler) Organizations(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Missing or invalid authorization header",
			},
		})
		return
	}

	accessToken := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid access token",
			},
		})
		return
	}

	// Get user's organizations (for now, just return current one)
	// TODO: Implement multi-org membership when that feature is added
	ctx := context.Background()
	orgIDStr, _ := claims["org"].(string)
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid organization identifier in token",
			},
		})
		return
	}

	organization, err := h.organizationRepo.GetOrganizationByID(ctx, orgID)
	if err != nil {
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Organization not found",
				},
			})
			return
		}
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to load organizations",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"organizations": []gin.H{
			{
				"id":      organization.ID.String(),
				"name":    organization.Name,
				"slug":    organization.Slug,
				"logoUrl": organization.LogoURL,
				"plan":    organization.Plan,
				"status":  organization.Status,
			},
		},
	})
}

// SwitchOrganization switches the user's active organization context
// POST /api/v1/auth/switch-organization
func (h *AuthHandler) SwitchOrganization(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Missing or invalid authorization header",
			},
		})
		return
	}

	var req struct {
		OrganizationID string `json:"organization_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	accessToken := strings.TrimPrefix(authHeader, "Bearer ")
	if _, err := h.tokenSvc.VerifyAccessToken(accessToken); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid access token",
			},
		})
		return
	}

	// TODO: Implement actual organization switching logic
	// For now, just return error as multi-org membership isn't implemented yet
	c.JSON(http.StatusForbidden, gin.H{
		"success": false,
		"error": gin.H{
			"code":    "FEATURE_NOT_AVAILABLE",
			"message": "Organization switching is not yet implemented",
		},
	})
}

// UpdateProfile updates the current user's profile information
// PATCH /api/v1/auth/profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	// Must be authenticated via Access Token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Missing or invalid authorization header",
			},
		})
		return
	}

	var req struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email" binding:"required,email"`
		Username  string `json:"username" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body parameters",
			},
		})
		return
	}

	accessToken := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := h.tokenSvc.VerifyAccessToken(accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INVALID_TOKEN",
				"message": "Invalid access token",
			},
		})
		return
	}

	userIDStr, _ := claims["sub"].(string)
	userID, _ := uuid.Parse(userIDStr)
	orgIDStr, _ := claims["org"].(string)
	orgID, _ := uuid.Parse(orgIDStr)

	ctx := context.Background()

	// Check if username is being changed and ensure it's unique within the organization
	currentUser, err := h.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "USER_NOT_FOUND",
				"message": "User not found",
			},
		})
		return
	}

	// If username or email is changing, check for conflicts within the organization
	if req.Username != *currentUser.Username || strings.ToLower(req.Email) != currentUser.Email {
		// Check username uniqueness within organization
		existingUser, _ := h.userRepo.GetUserByUsernameInOrg(ctx, req.Username, orgID)
		if existingUser != nil && existingUser.ID != userID {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "USERNAME_EXISTS",
					"message": "Username already exists in this organization",
				},
			})
			return
		}

		// Check email uniqueness within organization
		existingUser, _ = h.userRepo.GetUserByEmailInOrg(ctx, strings.ToLower(req.Email), orgID)
		if existingUser != nil && existingUser.ID != userID {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "EMAIL_EXISTS",
					"message": "Email already exists in this organization",
				},
			})
			return
		}
	}

	// Update user profile
	updateData := map[string]interface{}{
		"first_name":   req.FirstName,
		"last_name":    req.LastName,
		"email":        strings.ToLower(strings.TrimSpace(req.Email)),
		"username":     req.Username,
		"updated_at":   time.Now(),
	}

	if err := h.userRepo.UpdateUserProfile(ctx, userID, updateData); err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "INTERNAL_SERVER_ERROR",
				"message": "Failed to update profile",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated successfully",
	})
}
