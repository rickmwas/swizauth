package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/pquerna/otp/totp"
)

// TotpService defines methods for handling multi-factor authentication operations
type TotpService interface {
	GenerateSecret(email string) (secret string, qrCodeUri string, err error)
	VerifyCode(code string, secret string) bool
	GenerateRecoveryCodes() (plain []string, hashed []string, err error)
}

type totpService struct {
	issuer string
}

// NewTotpService instantiates concrete TOTP service
func NewTotpService(issuer string) TotpService {
	return &totpService{issuer: issuer}
}

// GenerateSecret creates a TOTP configuration key and otpauth URI
func (s *totpService) GenerateSecret(email string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.issuer,
		AccountName: email,
		Rand:        rand.Reader,
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to generate TOTP key: %w", err)
	}
	return key.Secret(), key.URL(), nil
}

// VerifyCode validates a 6-digit TOTP input code against the decrypted secret key
func (s *totpService) VerifyCode(code string, secret string) bool {
	return totp.Validate(code, secret)
}

// GenerateRecoveryCodes produces 8 alphanumeric recovery codes (plain and SHA-256 hashed)
func (s *totpService) GenerateRecoveryCodes() ([]string, []string, error) {
	var plain []string
	var hashed []string

	for i := 0; i < 8; i++ {
		bytes := make([]byte, 5)
		if _, err := rand.Read(bytes); err != nil {
			return nil, nil, fmt.Errorf("failed to read random bytes for recovery code: %w", err)
		}
		// Generate 10-character lowercase hex code
		code := fmt.Sprintf("%x", bytes)
		plain = append(plain, code)

		// Hash code using SHA-256 for secure DB storage
		h := sha256.New()
		h.Write([]byte(code))
		hashed = append(hashed, hex.EncodeToString(h.Sum(nil)))
	}

	return plain, hashed, nil
}
