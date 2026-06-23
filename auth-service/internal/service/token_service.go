package service

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/rickmwas/tsauth/auth-service/internal/domain"
)

// TokenService manages the lifecycle of access tokens and refresh tokens
type TokenService interface {
	GenerateAccessToken(user *domain.User, plan string, sessionID uuid.UUID, roles, permissions []string) (string, error)
	VerifyAccessToken(tokenStr string) (jwt.MapClaims, error)
	GenerateRefreshToken() (string, error)
	GenerateMfaToken(userID, orgID uuid.UUID) (string, error)
	VerifyMfaToken(tokenStr string) (userID uuid.UUID, orgID uuid.UUID, err error)
}

type tokenService struct {
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	expiryMin  int
}

// NewTokenService parses RS256 private and public keys from paths and sets the expiration duration
func NewTokenService(privateKeyPath, publicKeyPath string, expiryMin int) (TokenService, error) {
	privBytes, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key: %w", err)
	}

	privKey, err := jwt.ParseRSAPrivateKeyFromPEM(privBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse RSA private key: %w", err)
	}

	pubBytes, err := os.ReadFile(publicKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read public key: %w", err)
	}

	pubKey, err := jwt.ParseRSAPublicKeyFromPEM(pubBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse RSA public key: %w", err)
	}

	return &tokenService{
		privateKey: privKey,
		publicKey:  pubKey,
		expiryMin:  expiryMin,
	}, nil
}

// GenerateAccessToken builds and signs an RS256 Access Token containing standard and user claim elements
func (s *tokenService) GenerateAccessToken(user *domain.User, plan string, sessionID uuid.UUID, roles, permissions []string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":         user.ID.String(),
		"org":         user.OrganizationID.String(),
		"email":       user.Email,
		"plan":        plan,
		"roles":       roles,
		"permissions": permissions,
		"session_id":  sessionID.String(),
		"iat":         now.Unix(),
		"exp":         now.Add(time.Duration(s.expiryMin) * time.Minute).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenStr, err := token.SignedString(s.privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}

	return tokenStr, nil
}

// VerifyAccessToken decodes a bearer JWT checking the cryptographic validity of the signature
func (s *tokenService) VerifyAccessToken(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.publicKey, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token structure or expired claims")
}

// GenerateRefreshToken generates high-entropy random hex bytes representing a Refresh Token
func (s *tokenService) GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random refresh bytes: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// GenerateMfaToken issues a short-lived token for user undergoing MFA validation
func (s *tokenService) GenerateMfaToken(userID, orgID uuid.UUID) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":         userID.String(),
		"org":         orgID.String(),
		"mfa_pending": true,
		"iat":         now.Unix(),
		"exp":         now.Add(5 * time.Minute).Unix(), // 5 minute validity
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenStr, err := token.SignedString(s.privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign MFA token: %w", err)
	}

	return tokenStr, nil
}

// VerifyMfaToken decodes and validates the MFA login challenge token
func (s *tokenService) VerifyMfaToken(tokenStr string) (uuid.UUID, uuid.UUID, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.publicKey, nil
	})
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		mfaPending, _ := claims["mfa_pending"].(bool)
		if !mfaPending {
			return uuid.Nil, uuid.Nil, errors.New("missing mfa_pending flag")
		}

		userIDStr, _ := claims["sub"].(string)
		orgIDStr, _ := claims["org"].(string)

		userID, errU := uuid.Parse(userIDStr)
		orgID, errO := uuid.Parse(orgIDStr)
		if errU != nil || errO != nil {
			return uuid.Nil, uuid.Nil, errors.New("failed to parse claim UUIDs")
		}

		return userID, orgID, nil
	}

	return uuid.Nil, uuid.Nil, errors.New("invalid or expired claims")
}

