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

const authBaseURL = "http://localhost:8080/api/v1"
const adminBaseURL = "http://localhost:3001/api/v1"

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

	// ============================================================
	// PHASE 1: AUTH-SERVICE E2E TESTS
	// ============================================================
	log.Println("==========================================================")
	log.Println("PHASE 1: AUTH-SERVICE E2E TESTS")
	log.Println("==========================================================")

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
	req, _ := http.NewRequest("POST", authBaseURL+"/internal/verify-token", bytes.NewBuffer(marshalJSON(internalVerifyPayload)))
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
	log.Println("PHASE 1 COMPLETE: All Auth-Service tests passed!")
	log.Println("==========================================================")

	// ============================================================
	// PHASE 2: ADMIN-SERVICE CROSS-SERVICE E2E TESTS
	// ============================================================
	log.Println("")
	log.Println("==========================================================")
	log.Println("PHASE 2: ADMIN-SERVICE CROSS-SERVICE E2E TESTS")
	log.Println("==========================================================")

	// Seed RBAC data for the test user so JWT includes full permissions
	log.Println("[SETUP] Seeding permissions, role, and user_roles for admin-service tests...")

	// Seed all required permissions (using ON CONFLICT to be safe if seed.sql was already applied)
	permissionNames := []struct {
		id     string
		name   string
		module string
	}{
		{"e2e-perm-001", "users.read", "users"},
		{"e2e-perm-002", "users.create", "users"},
		{"e2e-perm-003", "users.update", "users"},
		{"e2e-perm-004", "users.delete", "users"},
		{"e2e-perm-005", "applications.read", "developer"},
		{"e2e-perm-006", "applications.create", "developer"},
		{"e2e-perm-007", "applications.update", "developer"},
		{"e2e-perm-008", "applications.delete", "developer"},
		{"e2e-perm-009", "api_keys.read", "developer"},
		{"e2e-perm-010", "api_keys.create", "developer"},
		{"e2e-perm-011", "api_keys.delete", "developer"},
		{"e2e-perm-012", "audit_logs.read", "audit"},
		{"e2e-perm-013", "roles.read", "roles"},
		{"e2e-perm-014", "roles.create", "roles"},
		{"e2e-perm-015", "roles.update", "roles"},
		{"e2e-perm-016", "roles.delete", "roles"},
	}

	now := time.Now()
	for _, p := range permissionNames {
		_, err = pool.Exec(ctx, `
			INSERT INTO auth.permissions (id, name, description, module, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (name) DO NOTHING
		`, p.id, p.name, "E2E test permission: "+p.name, p.module, now, now)
		if err != nil {
			log.Fatalf("Failed to seed permission '%s': %v", p.name, err)
		}
	}

	// Create an admin role for the test organization
	testRoleID := uuid.New()
	_, err = pool.Exec(ctx, `
		INSERT INTO auth.roles (id, organization_id, name, description, is_system, created_at, updated_at)
		VALUES ($1, $2, 'e2e_admin', 'E2E Test Admin Role', FALSE, $3, $4)
	`, testRoleID, orgID, now, now)
	if err != nil {
		log.Fatalf("Failed to seed e2e_admin role: %v", err)
	}

	// Map ALL permissions to the admin role
	_, err = pool.Exec(ctx, `
		INSERT INTO auth.role_permissions (id, role_id, permission_id, created_at)
		SELECT gen_random_uuid(), $1, id, $2
		FROM auth.permissions
	`, testRoleID, now)
	if err != nil {
		log.Fatalf("Failed to map permissions to e2e_admin role: %v", err)
	}

	// Assign the admin role to the test user
	_, err = pool.Exec(ctx, `
		INSERT INTO auth.user_roles (id, user_id, role_id, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3)
	`, testUserID, testRoleID, now)
	if err != nil {
		log.Fatalf("Failed to assign e2e_admin role to test user: %v", err)
	}
	log.Printf("RBAC seeded: role '%s' with all permissions assigned to user '%s'\n", testRoleID, testUserID)

	// Re-login with MFA to get a fresh JWT that contains the seeded permissions
	log.Println("[SETUP] Re-authenticating to obtain JWT with full admin permissions...")
	resp, body = makeRequest("POST", "/auth/login", newLoginPayload, "")
	assertStatus(resp, http.StatusOK)
	// MFA is enabled, so this returns mfa_required
	mfaToken = getJSONField(body, "mfa_token").(string)
	if mfaToken == "" {
		log.Fatalf("Setup failed: expected MFA challenge on re-login")
	}

	// Complete MFA verification
	otpCode, err = totp.GenerateCode(totpSecret, time.Now())
	if err != nil {
		log.Fatalf("Failed to generate OTP for admin re-login: %v", err)
	}
	resp, body = makeRequest("POST", "/auth/mfa/verify", map[string]interface{}{
		"mfa_token": mfaToken,
		"code":      otpCode,
	}, "")
	assertStatus(resp, http.StatusOK)
	adminAccessToken := getJSONField(body, "access_token").(string)
	if adminAccessToken == "" {
		log.Fatalf("Setup failed: no access token after MFA verify")
	}
	log.Println("Admin JWT obtained with full permissions for cross-service tests")

	// ─── Tracking variables for admin-service test artifacts ────
	var createdRoleID string
	var createdAppID string
	var createdApiKeyID string
	var invitedUserID string

	// Also create a "member" role for the invitation flow test
	memberRoleID := uuid.New()
	_, err = pool.Exec(ctx, `
		INSERT INTO auth.roles (id, organization_id, name, description, is_system, created_at, updated_at)
		VALUES ($1, $2, 'e2e_member', 'E2E Test Member Role', FALSE, $3, $4)
	`, memberRoleID, orgID, now, now)
	if err != nil {
		log.Fatalf("Failed to seed e2e_member role: %v", err)
	}

	// Assign read-only permissions to the member role
	for _, permName := range []string{"users.read", "applications.read", "api_keys.read"} {
		_, _ = pool.Exec(ctx, `
			INSERT INTO auth.role_permissions (id, role_id, permission_id, created_at)
			SELECT gen_random_uuid(), $1, id, $2
			FROM auth.permissions WHERE name = $3
		`, memberRoleID, now, permName)
	}

	// ----------------------------------------------------
	// TEST CASE 16: GET /organizations/:id
	// ----------------------------------------------------
	log.Println("[TEST] 16. GET /organizations/:id (admin-service)")
	resp, body = makeAdminRequest("GET", "/organizations/"+orgID.String(), nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	orgName := getJSONField(body, "name")
	if orgName != "Tester Org" {
		log.Fatalf("Assert failed: org name is '%v' (expected 'Tester Org')", orgName)
	}
	log.Println("Organization lookup via admin-service successful")

	// ----------------------------------------------------
	// TEST CASE 17: PATCH /organizations/:id
	// ----------------------------------------------------
	log.Println("[TEST] 17. PATCH /organizations/:id (admin-service)")
	resp, body = makeAdminRequest("PATCH", "/organizations/"+orgID.String(), map[string]interface{}{
		"name": "Tester Org Updated",
	}, adminAccessToken)
	assertStatus(resp, http.StatusOK)

	// Verify the update persisted
	resp, body = makeAdminRequest("GET", "/organizations/"+orgID.String(), nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	updatedName := getJSONField(body, "name")
	if updatedName != "Tester Org Updated" {
		log.Fatalf("Assert failed: org name after update is '%v' (expected 'Tester Org Updated')", updatedName)
	}
	log.Println("Organization update via admin-service successful")

	// ----------------------------------------------------
	// TEST CASE 18: POST /roles (Create custom role)
	// ----------------------------------------------------
	log.Println("[TEST] 18. POST /roles (admin-service)")
	resp, body = makeAdminRequest("POST", "/roles", map[string]interface{}{
		"name":        "e2e_custom_reviewer",
		"description": "Custom role created by E2E tester",
	}, adminAccessToken)
	assertStatus(resp, http.StatusCreated)
	createdRoleID = getJSONField(body, "id").(string)
	if createdRoleID == "" {
		log.Fatalf("Assert failed: role creation did not return an id")
	}
	log.Printf("Custom role created: %s\n", createdRoleID)

	// ----------------------------------------------------
	// TEST CASE 19: GET /roles (List org roles)
	// ----------------------------------------------------
	log.Println("[TEST] 19. GET /roles (admin-service)")
	resp, body = makeAdminRequest("GET", "/roles", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	rolesArray := parseJSONArray(body)
	if len(rolesArray) < 1 {
		log.Fatalf("Assert failed: expected at least 1 role, got %d", len(rolesArray))
	}
	log.Printf("Listed %d roles for the organization\n", len(rolesArray))

	// ----------------------------------------------------
	// TEST CASE 20: GET /permissions (List system permissions)
	// ----------------------------------------------------
	log.Println("[TEST] 20. GET /permissions (admin-service)")
	resp, body = makeAdminRequest("GET", "/permissions", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	permsArray := parseJSONArray(body)
	if len(permsArray) < 12 {
		log.Fatalf("Assert failed: expected at least 12 permissions, got %d", len(permsArray))
	}
	log.Printf("Listed %d system permissions\n", len(permsArray))

	// Get the first permission ID for the assign test
	firstPermID := permsArray[0]["id"].(string)

	// ----------------------------------------------------
	// TEST CASE 21: POST /permissions/assign
	// ----------------------------------------------------
	log.Println("[TEST] 21. POST /permissions/assign (admin-service)")
	resp, body = makeAdminRequest("POST", "/permissions/assign", map[string]interface{}{
		"role_id":        createdRoleID,
		"permission_ids": []string{firstPermID},
	}, adminAccessToken)
	assertStatus(resp, http.StatusCreated)
	assertJSONField(body, "success", true)
	assignedCount := getJSONField(body, "assigned")
	log.Printf("Assigned %v permission(s) to custom role\n", assignedCount)

	// ----------------------------------------------------
	// TEST CASE 22: POST /memberships/invite
	// ----------------------------------------------------
	log.Println("[TEST] 22. POST /memberships/invite (admin-service)")
	resp, body = makeAdminRequest("POST", "/memberships/invite", map[string]interface{}{
		"email":   "e2e-invited@swizauth.local",
		"role_id": memberRoleID.String(),
	}, adminAccessToken)
	assertStatus(resp, http.StatusCreated)
	assertJSONField(body, "success", true)
	invitationToken := getJSONField(body, "invitation_token").(string)
	if invitationToken == "" {
		log.Fatalf("Assert failed: invitation_token is empty")
	}
	log.Printf("Invitation token generated for e2e-invited@swizauth.local\n")

	// ----------------------------------------------------
	// TEST CASE 23: POST /memberships/accept
	// ----------------------------------------------------
	log.Println("[TEST] 23. POST /memberships/accept (admin-service, public)")
	resp, body = makeAdminRequest("POST", "/memberships/accept", map[string]interface{}{
		"token":      invitationToken,
		"username":   "e2e_invited_user",
		"password":   "InvitedPass123!",
		"first_name": "Invited",
		"last_name":  "Member",
	}, "") // No auth token — public endpoint
	assertStatus(resp, http.StatusCreated)
	assertJSONField(body, "success", true)
	invitedUserID = getJSONField(body, "user_id").(string)
	if invitedUserID == "" {
		log.Fatalf("Assert failed: invitation accept did not return a user_id")
	}
	log.Printf("Invitation accepted, new member registered: %s\n", invitedUserID)

	// ----------------------------------------------------
	// TEST CASE 24: GET /memberships (List org members)
	// ----------------------------------------------------
	log.Println("[TEST] 24. GET /memberships (admin-service)")
	resp, body = makeAdminRequest("GET", "/memberships?page=1&limit=50", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	membersData := getJSONField(body, "data").([]interface{})
	membersMeta := getJSONField(body, "meta").(map[string]interface{})
	totalMembers := membersMeta["total"].(float64)
	if len(membersData) < 2 {
		log.Fatalf("Assert failed: expected at least 2 members (admin + invited), got %d", len(membersData))
	}
	log.Printf("Listed %d members (total: %.0f) for the organization\n", len(membersData), totalMembers)

	// ----------------------------------------------------
	// TEST CASE 25: POST /applications (Create app)
	// ----------------------------------------------------
	log.Println("[TEST] 25. POST /applications (admin-service)")
	resp, body = makeAdminRequest("POST", "/applications", map[string]interface{}{
		"name":             "E2E Test Application",
		"description":      "Application created by E2E tester",
		"application_type": "web",
		"redirect_urls":    []string{"http://localhost:4000/callback"},
	}, adminAccessToken)
	assertStatus(resp, http.StatusCreated)
	createdAppID = getJSONField(body, "id").(string)
	clientID := getJSONField(body, "client_id").(string)
	clientSecret := getJSONField(body, "client_secret").(string)
	if createdAppID == "" || clientID == "" || clientSecret == "" {
		log.Fatalf("Assert failed: application creation missing id, client_id, or client_secret")
	}
	log.Printf("Application created: id=%s, client_id=%s\n", createdAppID, clientID)

	// ----------------------------------------------------
	// TEST CASE 26: GET /applications (List apps)
	// ----------------------------------------------------
	log.Println("[TEST] 26. GET /applications (admin-service)")
	resp, body = makeAdminRequest("GET", "/applications", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	appsArray := parseJSONArray(body)
	if len(appsArray) < 1 {
		log.Fatalf("Assert failed: expected at least 1 application, got %d", len(appsArray))
	}
	log.Printf("Listed %d applications for the organization\n", len(appsArray))

	// ----------------------------------------------------
	// TEST CASE 27: POST /applications/:id/rotate-secret
	// ----------------------------------------------------
	log.Println("[TEST] 27. POST /applications/:id/rotate-secret (admin-service)")
	resp, body = makeAdminRequest("POST", "/applications/"+createdAppID+"/rotate-secret", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	newClientSecret := getJSONField(body, "client_secret").(string)
	if newClientSecret == "" || newClientSecret == clientSecret {
		log.Fatalf("Assert failed: secret rotation did not produce a new distinct secret")
	}
	log.Println("Client secret rotation successful — new secret differs from original")

	// ----------------------------------------------------
	// TEST CASE 28: POST /api-keys (Create API key)
	// ----------------------------------------------------
	log.Println("[TEST] 28. POST /api-keys (admin-service)")
	resp, body = makeAdminRequest("POST", "/api-keys", map[string]interface{}{
		"name":   "E2E Test API Key",
		"scopes": []string{"users.read", "applications.read"},
	}, adminAccessToken)
	assertStatus(resp, http.StatusCreated)
	createdApiKeyID = getJSONField(body, "id").(string)
	apiKeyPlaintext := getJSONField(body, "key").(string)
	if createdApiKeyID == "" || apiKeyPlaintext == "" {
		log.Fatalf("Assert failed: API key creation missing id or plaintext key")
	}
	log.Printf("API key created: id=%s, key=%s...\n", createdApiKeyID, apiKeyPlaintext[:16])

	// ----------------------------------------------------
	// TEST CASE 29: GET /api-keys (List API keys)
	// ----------------------------------------------------
	log.Println("[TEST] 29. GET /api-keys (admin-service)")
	resp, body = makeAdminRequest("GET", "/api-keys", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	apiKeysArray := parseJSONArray(body)
	if len(apiKeysArray) < 1 {
		log.Fatalf("Assert failed: expected at least 1 API key, got %d", len(apiKeysArray))
	}
	log.Printf("Listed %d API keys for the organization\n", len(apiKeysArray))

	// ----------------------------------------------------
	// TEST CASE 30: DELETE /api-keys/:id (Revoke API key)
	// ----------------------------------------------------
	log.Println("[TEST] 30. DELETE /api-keys/:id (admin-service)")
	resp, body = makeAdminRequest("DELETE", "/api-keys/"+createdApiKeyID, nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)

	// Verify the key is marked as revoked in the database
	var apiKeyRevoked bool
	err = pool.QueryRow(ctx, `SELECT revoked FROM developer.api_keys WHERE id = $1`, createdApiKeyID).Scan(&apiKeyRevoked)
	if err != nil || !apiKeyRevoked {
		log.Fatalf("Assert failed: API key not marked as revoked in DB (revoked=%t)", apiKeyRevoked)
	}
	log.Println("API key revocation successful and verified in database")

	// ----------------------------------------------------
	// TEST CASE 31: GET /audit (Query audit logs)
	// ----------------------------------------------------
	log.Println("[TEST] 31. GET /audit (admin-service)")
	resp, body = makeAdminRequest("GET", "/audit?page=1&limit=50", nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	auditMeta := getJSONField(body, "meta").(map[string]interface{})
	auditData := getJSONField(body, "data").([]interface{})
	auditTotal := auditMeta["total"].(float64)
	log.Printf("Audit log query returned %d entries (total: %.0f)\n", len(auditData), auditTotal)

	// ----------------------------------------------------
	// TEST CASE 32: DELETE /memberships/:userId (Remove member)
	// ----------------------------------------------------
	log.Println("[TEST] 32. DELETE /memberships/:userId (admin-service)")
	resp, body = makeAdminRequest("DELETE", "/memberships/"+invitedUserID, nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)

	// Verify soft-deletion in database
	var memberStatus string
	err = pool.QueryRow(ctx, `SELECT status FROM auth.users WHERE id = $1`, invitedUserID).Scan(&memberStatus)
	if err != nil || memberStatus != "disabled" {
		log.Fatalf("Assert failed: removed member status is '%s' (expected 'disabled')", memberStatus)
	}
	log.Println("Member removal successful — user soft-deleted and status set to 'disabled'")

	// ----------------------------------------------------
	// TEST CASE 33: DELETE /roles/:id (Delete custom role)
	// ----------------------------------------------------
	log.Println("[TEST] 33. DELETE /roles/:id (admin-service)")
	resp, body = makeAdminRequest("DELETE", "/roles/"+createdRoleID, nil, adminAccessToken)
	assertStatus(resp, http.StatusOK)
	assertJSONField(body, "success", true)

	// Verify deletion in database
	var deletedRoleCount int
	err = pool.QueryRow(ctx, `SELECT COUNT(*) FROM auth.roles WHERE id = $1`, createdRoleID).Scan(&deletedRoleCount)
	if err != nil || deletedRoleCount != 0 {
		log.Fatalf("Assert failed: role still exists in DB after deletion (count=%d)", deletedRoleCount)
	}
	log.Println("Custom role deletion successful and verified in database")

	// ----------------------------------------------------
	// TEST CASE 34: 403 Negative Test (PermissionsGuard)
	// ----------------------------------------------------
	log.Println("[TEST] 34. 403 PermissionsGuard negative test (admin-service)")

	// Register a second user with no roles/permissions
	unprivRegPayload := map[string]interface{}{
		"organization_id": orgID.String(),
		"email":           "e2e-unprivileged@swizauth.local",
		"password":        "UnprivPass123!",
		"first_name":      "Unprivileged",
		"last_name":       "User",
	}
	resp, body = makeRequest("POST", "/auth/register", unprivRegPayload, "")
	assertStatus(resp, http.StatusCreated)

	// Login as unprivileged user (no MFA enabled for this user)
	unprivLoginPayload := map[string]interface{}{
		"email":    "e2e-unprivileged@swizauth.local",
		"password": "UnprivPass123!",
	}
	resp, body = makeRequest("POST", "/auth/login", unprivLoginPayload, "")
	assertStatus(resp, http.StatusOK)
	unprivToken := getJSONField(body, "access_token").(string)
	if unprivToken == "" {
		log.Fatalf("Setup failed: unprivileged user did not get an access token")
	}

	// Try to create a role — should get 403 Forbidden (no roles.create permission)
	resp, body = makeAdminRequest("POST", "/roles", map[string]interface{}{
		"name":        "should_fail_role",
		"description": "This should be blocked",
	}, unprivToken)
	assertStatus(resp, http.StatusForbidden)
	log.Println("403 PermissionsGuard correctly blocked unprivileged user from creating a role")

	// ============================================================
	// ALL TESTS PASSED
	// ============================================================
	log.Println("")
	log.Println("==========================================================")
	log.Println("ALL 34 E2E INTEGRATION TEST SUITES PASSED SUCCESSFULLY!")
	log.Println("Go Auth Engine + NestJS Admin Service are fully verified!")
	log.Println("The system is ready for production.")
	log.Println("==========================================================")
}

// ─── HTTP HELPERS ────────────────────────────────────────────

func doRequest(base, method, path string, payload map[string]interface{}, token string) (*http.Response, []byte) {
	var bodyReader io.Reader
	if payload != nil {
		bodyReader = bytes.NewBuffer(marshalJSON(payload))
	}

	req, err := http.NewRequest(method, base+path, bodyReader)
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
		log.Fatalf("HTTP request to %s failed: %v", base+path, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	return resp, bodyBytes
}

func makeRequest(method, path string, payload map[string]interface{}, token string) (*http.Response, []byte) {
	return doRequest(authBaseURL, method, path, payload, token)
}

func makeAdminRequest(method, path string, payload map[string]interface{}, token string) (*http.Response, []byte) {
	return doRequest(adminBaseURL, method, path, payload, token)
}

// ─── JSON / ASSERTION HELPERS ────────────────────────────────

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

func parseJSONArray(body []byte) []map[string]interface{} {
	var arr []map[string]interface{}
	if err := json.Unmarshal(body, &arr); err != nil {
		log.Fatalf("Failed to parse JSON array: %v. Body was: %s", err, string(body))
	}
	return arr
}

func hashSHA256(input string) string {
	h := sha256.New()
	h.Write([]byte(input))
	return hex.EncodeToString(h.Sum(nil))
}

// ─── DATABASE CLEANUP ────────────────────────────────────────

func cleanupDatabase(ctx context.Context, pool *pgxpool.Pool) {
	// Delete test users first (before org cascade) to ensure clean removal
	_, _ = pool.Exec(ctx, `DELETE FROM auth.users WHERE email IN ('tester@swizauth.local', 'e2e-invited@swizauth.local', 'e2e-unprivileged@swizauth.local')`)
	// Delete test organization (cascades to roles, sessions, applications, api_keys, audit_logs)
	_, _ = pool.Exec(ctx, `DELETE FROM public.organizations WHERE slug = 'tester-org'`)
	// Clean up E2E-seeded permissions (only remove if they have the e2e prefix IDs)
	_, _ = pool.Exec(ctx, `DELETE FROM auth.permissions WHERE id LIKE 'e2e-perm-%'`)
}
