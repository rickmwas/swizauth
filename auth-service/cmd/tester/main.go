package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pquerna/otp/totp"

	"github.com/rickmwas/swizauth/auth-service/internal/domain"
)

const baseURL = "http://localhost:8080/api/v1"

func main() {
	log.Println("Starting SWIZAUTH Go Auth Engine E2E Integration Tester...")

	// 1. Load configuration
	cfg, err := domain.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	// 2. Connect to Database for seeding/instrumentation
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// 3. Clean up any previous test remnants
	cleanupDatabase(ctx, pool)

	// 4. Seed test organization
	orgID := uuid.New()
	_, err = pool.Exec(ctx, `
		INSERT INTO public.organizations (id, name, slug, status, plan, created_at, updated_at)
		VALUES ($1, 'Tester Org', 'tester-org', 'active', 'free', $2, $3)
	`, orgID, time.Now(), time.Now())
	if err != nil {
		log.Fatalf("Failed to seed testing organization: %v", err)
	}
	log.Printf("Seeded testing organization: %s\n", orgID)

	// Keep a list of test resources to clean up later
	var testUserID string

	defer func() {
		log.Println("Cleaning up testing resources...")
		cleanupDatabase(ctx, pool)
	}()

	// ----------------------------------------------------
	// TEST CASE 1: GET /health
	// ----------------------------------------------------
	log.Println("[TEST] 1. GET /health")
	resp, body := makeRequest("GET", "/health", nil, "")
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "status", "healthy")
	assertJSONField(body, "success", true)

	// ----------------------------------------------------
	// TEST CASE 2: POST /auth/register
	// ----------------------------------------------------
	log.Println("[TEST] 2. POST /auth/register")
	regPayload := map[string]interface{}{
		"organization_id": orgID.String(),
		"email":           "tester@swizauth.local",
		"password":        "SecurePass12345!",
		"first_name":      "EndToEnd",
		"last_name":       "Tester",
	}
	resp, body = makeRequest("POST", "/auth/register", regPayload, "")
	assertStatus(resp, http.StatusCreated)
	assertJSONField(body, "success", true)
	testUserID = getJSONField(body, "user_id").(string)
	log.Printf("Successfully registered user: %s\n", testUserID)

	// ----------------------------------------------------
	// TEST CASE 3: POST /auth/email/verify
	// ----------------------------------------------------
	log.Println("[TEST] 3. POST /auth/email/verify")
	// Seeding own known token hash in database to bypass email output scanning
	testVerifyToken := uuid.New().String()
	vHasher := sha256.New()
	vHasher.Write([]byte(testVerifyToken))
	testVHash := hex.EncodeToString(vHasher.Sum(nil))

	_, err = pool.Exec(ctx, `
		UPDATE auth.email_verification_tokens
		SET token_hash = $1
		WHERE user_id = $2
	`, testVHash, testUserID)
	if err != nil {
		log.Fatalf("Failed to instrument verification token in DB: %v", err)
	}

	verifyPayload := map[string]interface{}{
		"token": testVerifyToken,
	}
	resp, body = makeRequest("POST", "/auth/email/verify", verifyPayload, "")
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)

	// Assert database state
	var emailVerified bool
	err = pool.QueryRow(ctx, "SELECT email_verified FROM auth.users WHERE id = $1", testUserID).Scan(&emailVerified)
	if err != nil || !emailVerified {
		log.Fatalf("Assert failed: email_verified in DB is %t (expected true)", emailVerified)
	}
	log.Println("Email verification completed successfully")

	// ----------------------------------------------------
	// TEST CASE 4: POST /auth/login (First attempt, no MFA)
	// ----------------------------------------------------
	log.Println("[TEST] 4. POST /auth/login")
	loginPayload := map[string]interface{}{
		"email":    "tester@swizauth.local",
		"password": "SecurePass12345!",
	}
	resp, body = makeRequest("POST", "/auth/login", loginPayload, "")
	assertStatus(resp, http.StatusOK)
	accessToken := getJSONField(body, "access_token").(string)
	refreshToken := getJSONField(body, "refresh_token").(string)
	if accessToken == "" || refreshToken == "" {
		log.Fatalf("Failed to acquire authentication tokens")
	}

	// ----------------------------------------------------
	// TEST CASE 5: GET /auth/verify (Token verification)
	// ----------------------------------------------------
	log.Println("[TEST] 5. GET /auth/verify")
	resp, body = makeRequest("GET", "/auth/verify", nil, accessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "authenticated", true)

	// ----------------------------------------------------
	// TEST CASE 6: POST /auth/refresh (Token Refresh Rotation)
	// ----------------------------------------------------
	log.Println("[TEST] 6. POST /auth/refresh")
	// Wait a moment to ensure timestamp changes
	time.Sleep(1 * time.Second)
	refreshPayload := map[string]interface{}{
		"refresh_token": refreshToken,
	}
	resp, body = makeRequest("POST", "/auth/refresh", refreshPayload, "")
	assertStatus(resp, http.StatusOK)
	newAccessToken := getJSONField(body, "access_token").(string)
	newRefreshToken := getJSONField(body, "refresh_token").(string)
	if newAccessToken == "" || newRefreshToken == "" {
		log.Fatalf("Failed to rotate refresh token")
	}

	// ----------------------------------------------------
	// TEST CASE 7: Replay Attack Mitigation
	// ----------------------------------------------------
	log.Println("[TEST] 7. Replay Attack Mitigation on /auth/refresh")
	resp, body = makeRequest("POST", "/auth/refresh", refreshPayload, "")
	assertStatus(resp, http.StatusUnauthorized)
	// Session should now be marked as revoked in database
	var sessionRevoked bool
	err = pool.QueryRow(ctx, `
		SELECT revoked FROM auth.sessions 
		WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
	`, testUserID).Scan(&sessionRevoked)
	if err != nil || !sessionRevoked {
		log.Fatalf("Assert failed: replay token did not revoke active session in database")
	}
	log.Println("RTR Replay Attack detected and mitigated correctly (session revoked)")

	// Log back in to get a fresh access token for MFA setup
	resp, body = makeRequest("POST", "/auth/login", loginPayload, "")
	assertStatus(resp, http.StatusOK)
	accessToken = getJSONField(body, "access_token").(string)

	// ----------------------------------------------------
	// TEST CASE 8: POST /auth/mfa/setup
	// ----------------------------------------------------
	log.Println("[TEST] 8. POST /auth/mfa/setup")
	resp, body = makeRequest("POST", "/auth/mfa/setup", nil, accessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)
	totpSecret := getJSONField(body, "secret").(string)
	log.Printf("Generated pending TOTP secret: %s\n", totpSecret)

	// ----------------------------------------------------
	// TEST CASE 9: POST /auth/mfa/confirm
	// ----------------------------------------------------
	log.Println("[TEST] 9. POST /auth/mfa/confirm")
	// Generate valid code using standard TOTP library
	otpCode, err := totp.GenerateCode(totpSecret, time.Now())
	if err != nil {
		log.Fatalf("Failed to generate OTP code for test: %v", err)
	}

	confirmPayload := map[string]interface{}{
		"code": otpCode,
	}
	resp, body = makeRequest("POST", "/auth/mfa/confirm", confirmPayload, accessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)
	recoveryCodesInterface := getJSONField(body, "recovery_codes").([]interface{})
	var recoveryCodes []string
	for _, val := range recoveryCodesInterface {
		recoveryCodes = append(recoveryCodes, val.(string))
	}
	log.Printf("MFA Enabled. Recovery codes: %v\n", recoveryCodes)

	// ----------------------------------------------------
	// TEST CASE 10: POST /auth/login (Second attempt, MFA required)
	// ----------------------------------------------------
	log.Println("[TEST] 10. POST /auth/login with MFA enabled")
	resp, body = makeRequest("POST", "/auth/login", loginPayload, "")
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "mfa_required", true)
	mfaToken := getJSONField(body, "mfa_token").(string)
	if mfaToken == "" {
		log.Fatalf("Assert failed: mfa_token is empty")
	}

	// ----------------------------------------------------
	// TEST CASE 11: POST /auth/mfa/verify (OTP code authentication)
	// ----------------------------------------------------
	log.Println("[TEST] 11. POST /auth/mfa/verify with TOTP code")
	otpCodeVerify, _ := totp.GenerateCode(totpSecret, time.Now())
	verifyMfaPayload := map[string]interface{}{
		"mfa_token": mfaToken,
		"code":      otpCodeVerify,
	}
	resp, body = makeRequest("POST", "/auth/mfa/verify", verifyMfaPayload, "")
	assertStatus(resp, http.StatusOK)
	accessToken = getJSONField(body, "access_token").(string)
	if accessToken == "" {
		log.Fatalf("Failed to authenticate with OTP code")
	}

	// ----------------------------------------------------
	// TEST CASE 12: POST /auth/mfa/verify (Recovery code authentication)
	// ----------------------------------------------------
	log.Println("[TEST] 12. POST /auth/mfa/verify with Recovery code")
	// Get a new mfa_token by logging in again
	resp, body = makeRequest("POST", "/auth/mfa/login-again", loginPayload, "") // call standard login route
	resp, body = makeRequest("POST", "/auth/login", loginPayload, "")
	mfaToken = getJSONField(body, "mfa_token").(string)

	verifyRecoveryPayload := map[string]interface{}{
		"mfa_token":     mfaToken,
		"recovery_code": recoveryCodes[0], // use first recovery code
	}
	resp, body = makeRequest("POST", "/auth/mfa/verify", verifyRecoveryPayload, "")
	assertStatus(resp, http.StatusOK)
	accessToken = getJSONField(body, "access_token").(string)
	if accessToken == "" {
		log.Fatalf("Failed to authenticate with recovery code")
	}

	// Verify that the used recovery code is flagged as consumed
	var recoveryCodeUsed bool
	err = pool.QueryRow(ctx, `
		SELECT used FROM auth.mfa_recovery_codes
		WHERE code_hash = $1
	`, hashSHA256(recoveryCodes[0])).Scan(&recoveryCodeUsed)
	if err != nil || !recoveryCodeUsed {
		log.Fatalf("Assert failed: recovery code was not marked as used in DB")
	}
	log.Println("Recovery code verification and consumption successful")

	// ----------------------------------------------------
	// TEST CASE 13: POST /api/v1/internal/verify-token
	// ----------------------------------------------------
	log.Println("[TEST] 13. POST /internal/verify-token (S2S)")
	internalVerifyPayload := map[string]interface{}{
		"token": accessToken,
	}
	// Verify unauthorized behavior without bearer secret
	resp, body = makeRequest("POST", "/internal/verify-token", internalVerifyPayload, "")
	assertStatus(resp, http.StatusUnauthorized)

	// Verify success using config INTERNAL_API_SECRET
	req, _ := http.NewRequest("POST", baseURL+"/internal/verify-token", bytes.NewBuffer(marshalJSON(internalVerifyPayload)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.InternalApiSecret)

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		log.Fatalf("Internal verify HTTP request failed: %v", err)
	}
	respBodyBytes, _ := io.ReadAll(resp.Body)
	resp.Body.Close()

	assertStatus(resp, http.StatusOK)
	assertJSONField(respBodyBytes, "authenticated", true)
	log.Println("Internal verify endpoint (service-to-service auth) verified successfully")

	// ----------------------------------------------------
	// TEST CASE 14: POST /auth/password-reset/request & confirm
	// ----------------------------------------------------
	log.Println("[TEST] 14. POST /auth/password-reset")
	resetReqPayload := map[string]interface{}{
		"email": "tester@swizauth.local",
	}
	resp, body = makeRequest("POST", "/auth/password-reset/request", resetReqPayload, "")
	assertStatus(resp, http.StatusOK)

	// Instrument known reset token hash in DB
	testResetToken := uuid.New().String()
	rHasher := sha256.New()
	rHasher.Write([]byte(testResetToken))
	testRHash := hex.EncodeToString(rHasher.Sum(nil))

	_, err = pool.Exec(ctx, `
		UPDATE auth.password_reset_tokens
		SET token_hash = $1
		WHERE user_id = $2
	`, testRHash, testUserID)
	if err != nil {
		log.Fatalf("Failed to instrument reset token in DB: %v", err)
	}

	resetConfirmPayload := map[string]interface{}{
		"token":    testResetToken,
		"password": "NewSecurePass999!",
	}
	resp, body = makeRequest("POST", "/auth/password-reset/confirm", resetConfirmPayload, "")
	assertStatus(resp, http.StatusOK)

	// Authenticate with new password
	newLoginPayload := map[string]interface{}{
		"email":    "tester@swizauth.local",
		"password": "NewSecurePass999!",
	}
	resp, body = makeRequest("POST", "/auth/login", newLoginPayload, "")
	assertStatus(resp, http.StatusOK)
	log.Println("Password reset request and confirmation cycles completed successfully")

	// ----------------------------------------------------
	// TEST CASE 15: Token Rate Limiting Check
	// ----------------------------------------------------
	log.Println("[TEST] 15. Token Rate Limiting headers checking")
	// Make a quick call to `/auth/login` to inspect headers
	limitVal := resp.Header.Get("X-RateLimit-Limit")
	remVal := resp.Header.Get("X-RateLimit-Remaining")
	resetVal := resp.Header.Get("X-RateLimit-Reset")

	if limitVal == "" || remVal == "" || resetVal == "" {
		log.Fatalf("Assert failed: Rate Limiting headers missing. Limit='%s', Remaining='%s', Reset='%s'", limitVal, remVal, resetVal)
	}
	log.Printf("Rate limit headers present. Limit: %s, Remaining: %s, Reset: %s\n", limitVal, remVal, resetVal)

	log.Println("==========================================================")
	log.Println("ALL E2E INTEGRATION TEST SUITES PASSED SUCCESSFULLY!")
	log.Println("The Go Auth Core Engine is fully ready to ship to production!")
	log.Println("==========================================================")
}

func makeRequest(method, path string, payload map[string]interface{}, token string) (*http.Response, []byte) {
	var bodyReader io.Reader
	if payload != nil {
		bodyReader = bytes.NewBuffer(marshalJSON(payload))
	}

	req, err := http.NewRequest(method, baseURL+path, bodyReader)
	if err != nil {
		log.Fatalf("Failed to create HTTP request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("HTTP request to %s failed: %v", baseURL+path, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	return resp, bodyBytes
}

func marshalJSON(data interface{}) []byte {
	bytes, err := json.Marshal(data)
	if err != nil {
		log.Fatalf("JSON marshaling failed: %v", err)
	}
	return bytes
}

func assertStatus(resp *http.Response, expected int) {
	if resp.StatusCode != expected {
		log.Fatalf("Assert failed: HTTP status is %d (expected %d)", resp.StatusCode, expected)
	}
}

func getJSONField(body []byte, field string) interface{} {
	var m map[string]interface{}
	if err := json.Unmarshal(body, &m); err != nil {
		log.Fatalf("Failed to parse JSON body: %v. Body was: %s", err, string(body))
	}
	return m[field]
}

func assertJSONField(body []byte, field string, expected interface{}) {
	val := getJSONField(body, field)
	if fmt.Sprintf("%v", val) != fmt.Sprintf("%v", expected) {
		log.Fatalf("Assert failed: JSON field '%s' value is '%v' (expected '%v')", field, val, expected)
	}
}

func hashSHA256(input string) string {
	h := sha256.New()
	h.Write([]byte(input))
	return hex.EncodeToString(h.Sum(nil))
}

func cleanupDatabase(ctx context.Context, pool *pgxpool.Pool) {
	_, _ = pool.Exec(ctx, `DELETE FROM public.organizations WHERE slug = 'tester-org'`)
	_, _ = pool.Exec(ctx, `DELETE FROM auth.users WHERE email = 'tester@swizauth.local'`)
}
