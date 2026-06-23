package domain

import (
	"encoding/hex"
	"fmt"
	"log"

	"github.com/caarlos0/env/v10"
	"github.com/joho/godotenv"
)

// Config holds all environmental configurations for the auth-service
type Config struct {
	Port                   int      `env:"PORT" envDefault:"8080"`
	Env                    string   `env:"ENV" envDefault:"development"`
	LogLevel               string   `env:"LOG_LEVEL" envDefault:"info"`
	CorsAllowedOrigins     []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:","`
	DatabaseURL            string   `env:"DATABASE_URL,required"`
	RedisURL               string   `env:"REDIS_URL,required"`
	RedisPassword          string   `env:"REDIS_PASSWORD"`
	RedisDB                int      `env:"REDIS_DB" envDefault:"0"`
	JwtPrivateKeyPath      string   `env:"JWT_PRIVATE_KEY_PATH,required"`
	JwtPublicKeyPath       string   `env:"JWT_PUBLIC_KEY_PATH,required"`
	JwtExpiryMinutes       int      `env:"JWT_EXPIRY_MINUTES" envDefault:"15"`
	RefreshTokenExpiryDays int      `env:"REFRESH_TOKEN_EXPIRY_DAYS" envDefault:"30"`
	MfaEncryptionKey       string   `env:"MFA_ENCRYPTION_KEY,required"`
	InternalApiSecret      string   `env:"INTERNAL_API_SECRET,required"`
	SmtpHost               string   `env:"SMTP_HOST"`
	SmtpPort               int      `env:"SMTP_PORT" envDefault:"587"`
	SmtpUser               string   `env:"SMTP_USER"`
	SmtpPass               string   `env:"SMTP_PASS"`
	SmtpSender             string   `env:"SMTP_SENDER"`
}

// LoadConfig parses environment variables and configures the service settings, failing fast on missing required variables
func LoadConfig() (*Config, error) {
	// Try loading .env file, ignore error if it doesn't exist
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying purely on environment variables")
	}

	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return nil, err
	}

	// Validate MFA_ENCRYPTION_KEY is valid hex of 32 bytes
	keyBytes, err := hex.DecodeString(cfg.MfaEncryptionKey)
	if err != nil {
		return nil, fmt.Errorf("MFA_ENCRYPTION_KEY must be a valid hex-encoded string: %w", err)
	}
	if len(keyBytes) != 32 {
		return nil, fmt.Errorf("MFA_ENCRYPTION_KEY must decode to exactly 32 bytes, got %d bytes", len(keyBytes))
	}

	return &cfg, nil
}

