package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/rickmwas/tsauth/auth-service/internal/delivery/middleware"
	deliveryHttp "github.com/rickmwas/tsauth/auth-service/internal/delivery/http"
	"github.com/rickmwas/tsauth/auth-service/internal/domain"
	"github.com/rickmwas/tsauth/auth-service/internal/repository"
	"github.com/rickmwas/tsauth/auth-service/internal/service"
)

func main() {
	// 1. Load configuration
	cfg, err := domain.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v\n", err)
	}

	// Set gin mode based on environment
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// 2. Validate cryptographic key files exist on disk
	if _, err := os.Stat(cfg.JwtPrivateKeyPath); err != nil {
		log.Fatalf("JWT Private key file missing or unreadable at '%s': %v\n", cfg.JwtPrivateKeyPath, err)
	}
	if _, err := os.Stat(cfg.JwtPublicKeyPath); err != nil {
		log.Fatalf("JWT Public key file missing or unreadable at '%s': %v\n", cfg.JwtPublicKeyPath, err)
	}

	ctx := context.Background()

	// 3. Connect to PostgreSQL via pgxpool
	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize database connection pool: %v\n", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Database ping failed: %v\n", err)
	}
	log.Println("Database connection pool established successfully")

	// 4. Connect to Redis
	var rdbOptions *redis.Options
	if opt, err := redis.ParseURL(cfg.RedisURL); err == nil {
		rdbOptions = opt
	} else {
		rdbOptions = &redis.Options{
			Addr:     cfg.RedisURL,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		}
	}
	rdb := redis.NewClient(rdbOptions)
	defer rdb.Close()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Redis ping failed: %v\n", err)
	}
	log.Println("Redis client connected successfully")

	// 4.1 Initialize Repositories
	userRepo := repository.NewUserRepository(dbPool)
	sessionRepo := repository.NewSessionRepository(dbPool)
	verificationRepo := repository.NewVerificationRepository(dbPool)
	mfaRepo := repository.NewMfaRepository(dbPool)
	organizationRepo := repository.NewOrganizationRepository(dbPool)
	onboardingRepo := repository.NewOnboardingRepository(dbPool)

	// 4.2 Initialize Services
	passwordSvc := service.NewPasswordService()
	tokenSvc, err := service.NewTokenService(cfg.JwtPrivateKeyPath, cfg.JwtPublicKeyPath, cfg.JwtExpiryMinutes)
	if err != nil {
		log.Fatalf("Failed to initialize TokenService: %v\n", err)
	}

	cryptoSvc, err := service.NewCryptoService(cfg.MfaEncryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize CryptoService: %v\n", err)
	}

	totpSvc := service.NewTotpService("TSAUTH")
	emailSvc := service.NewEmailService(cfg.SmtpHost, cfg.SmtpPort, cfg.SmtpUser, cfg.SmtpPass, cfg.SmtpSender, cfg.Env)

	// 4.3 Initialize HTTP Handlers
	authHandler := deliveryHttp.NewAuthHandler(
		userRepo,
		sessionRepo,
		verificationRepo,
		mfaRepo,
		organizationRepo,
		onboardingRepo,
		passwordSvc,
		tokenSvc,
		cryptoSvc,
		totpSvc,
		emailSvc,
		rdb,
	)

	healthHandler := deliveryHttp.NewHealthHandler(dbPool, rdb)

	// 5. Initialize Gin Engine without default logger/recovery middleware
	r := gin.New()

	// Attach custom middleware stack in order
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg.CorsAllowedOrigins))
	r.Use(middleware.Recovery())

	// 6. Define Routes
	// Health check endpoints (outside API versioning)
	r.GET("/health", healthHandler.HealthHandler)
	r.GET("/ready", healthHandler.ReadinessHandler)

	apiV1 := r.Group("/api/v1")
	{
		// Basic health check route (legacy)
		apiV1.GET("/health", healthHandler.HealthHandler)

		// Authentication Core Endpoints
		auth := apiV1.Group("/auth")
		{
			auth.POST("/register", middleware.RateLimiter(rdb, "register", 5, time.Minute), authHandler.Register)
			auth.POST("/onboard", authHandler.Onboard)
			auth.POST("/login", middleware.RateLimiter(rdb, "login", 10, time.Minute), authHandler.Login)
			auth.GET("/verify", authHandler.Verify)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/logout-all", authHandler.LogoutAll)

			// User profile and organization endpoints  
			auth.GET("/me", authHandler.Me)
			auth.PATCH("/profile", authHandler.UpdateProfile)
			auth.GET("/organizations", authHandler.Organizations)
			auth.POST("/switch-organization", authHandler.SwitchOrganization)

			// Refresh and Verification Endpoints
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/email/verify", authHandler.VerifyEmail)
			auth.POST("/password-reset/request", middleware.RateLimiter(rdb, "password_reset", 5, time.Minute), authHandler.PasswordResetRequest)
			auth.POST("/password-reset/confirm", authHandler.PasswordResetConfirm)

			// MFA Endpoints
			auth.POST("/mfa/setup", authHandler.MfaSetup)
			auth.POST("/mfa/confirm", authHandler.MfaConfirm)
			auth.POST("/mfa/verify", authHandler.MfaVerify)
		}

		// Internal Service-to-Service Endpoints
		internal := apiV1.Group("/internal")
		internal.Use(middleware.InternalAuth(cfg.InternalApiSecret))
		{
			internal.POST("/verify-token", authHandler.InternalVerifyToken)
		}
	}

	// Fallback 404 handler returning standard error format
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Resource not found",
			},
		})
	})

	// 7. Start HTTP Server
	serverAddr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Starting auth-service HTTP server on %s\n", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Server exited unexpectedly: %v\n", err)
	}
}
