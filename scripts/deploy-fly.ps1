# SwizAuth Fly.io Deployment Script (PowerShell)
param(
    [string]$Region = "iad",
    [switch]$CreateApps,
    [switch]$SetSecrets
)

Write-Host "[FLY] Starting SwizAuth Fly.io Deployment..." -ForegroundColor Green

# Check if Fly CLI is installed
try {
    fly version | Out-Null
    Write-Host "[OK] Fly CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Fly CLI not found!" -ForegroundColor Red
    Write-Host "[INFO] Installing Fly CLI..." -ForegroundColor Yellow
    
    # Install Fly CLI for Windows
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        iwr https://fly.io/install.ps1 -useb | iex
    } else {
        curl -L https://fly.io/install.sh | sh
    }
    
    Write-Host "[INFO] Please restart your terminal and run this script again" -ForegroundColor Yellow
    exit 0
}

# Check if logged in to Fly
try {
    fly auth whoami | Out-Null
    Write-Host "[OK] Logged in to Fly.io" -ForegroundColor Green
} catch {
    Write-Host "[AUTH] Please log in to Fly.io:" -ForegroundColor Yellow
    fly auth login
}

# Generate secrets function
function Generate-Secret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

# Create apps if requested
if ($CreateApps) {
    Write-Host "[CREATE] Creating Fly.io applications..." -ForegroundColor Cyan
    
    # Create auth service app
    Set-Location auth-service
    Write-Host "[CREATE] Creating swizauth-auth app..." -ForegroundColor White
    fly apps create swizauth-auth --org personal
    Set-Location ..
    
    # Create admin service app  
    Set-Location admin-service
    Write-Host "[CREATE] Creating swizauth-admin app..." -ForegroundColor White
    fly apps create swizauth-admin --org personal
    Set-Location ..
    
    # Create dashboard app
    Set-Location dashboard
    Write-Host "[CREATE] Creating swizauth-dashboard app..." -ForegroundColor White
    fly apps create swizauth-dashboard --org personal
    Set-Location ..
    
    Write-Host "[OK] All applications created" -ForegroundColor Green
}

# Set secrets if requested
if ($SetSecrets) {
    Write-Host "[SECRETS] Setting up secrets..." -ForegroundColor Cyan
    
    # Generate secrets
    $internalSecret = Generate-Secret
    $mfaKey = Generate-Secret  
    $sessionSecret = Generate-Secret
    
    Write-Host "[SECRETS] Setting auth service secrets..." -ForegroundColor White
    Set-Location auth-service
    fly secrets set INTERNAL_API_SECRET="$internalSecret"
    fly secrets set MFA_ENCRYPTION_KEY="$mfaKey"
    Set-Location ..
    
    Write-Host "[SECRETS] Setting admin service secrets..." -ForegroundColor White
    Set-Location admin-service  
    fly secrets set INTERNAL_API_SECRET="$internalSecret"
    Set-Location ..
    
    Write-Host "[SECRETS] Setting dashboard secrets..." -ForegroundColor White
    Set-Location dashboard
    fly secrets set SESSION_SECRET="$sessionSecret"
    fly secrets set INTERNAL_API_SECRET="$internalSecret"
    Set-Location ..
    
    Write-Host "[OK] Secrets configured" -ForegroundColor Green
}

# Add PostgreSQL database
Write-Host "[DATABASE] Setting up PostgreSQL..." -ForegroundColor Cyan
Set-Location auth-service
try {
    fly postgres create swizauth-db --region $Region --initial-cluster-size 1
    Write-Host "[OK] PostgreSQL database created" -ForegroundColor Green
} catch {
    Write-Host "[WARN] PostgreSQL database may already exist" -ForegroundColor Yellow
}

# Attach database to services
Write-Host "[DATABASE] Attaching database to auth service..." -ForegroundColor White
fly postgres attach swizauth-db --app swizauth-auth
Set-Location ..

Set-Location admin-service
Write-Host "[DATABASE] Attaching database to admin service..." -ForegroundColor White  
fly postgres attach swizauth-db --app swizauth-admin
Set-Location ..

# Add Redis
Write-Host "[REDIS] Setting up Redis..." -ForegroundColor Cyan
Set-Location auth-service
try {
    fly redis create --name swizauth-redis --region $Region
    Write-Host "[OK] Redis instance created" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Redis instance may already exist" -ForegroundColor Yellow
}
Set-Location ..

# Deploy services
Write-Host "[DEPLOY] Deploying auth service..." -ForegroundColor Cyan
Set-Location auth-service
fly deploy
Set-Location ..

Write-Host "[DEPLOY] Deploying admin service..." -ForegroundColor Cyan
Set-Location admin-service
fly deploy  
Set-Location ..

Write-Host "[DEPLOY] Deploying dashboard..." -ForegroundColor Cyan
Set-Location dashboard
fly deploy
Set-Location ..

# Get app URLs
Write-Host "[INFO] Getting application URLs..." -ForegroundColor Cyan
$authUrl = fly apps list | Select-String "swizauth-auth" | ForEach-Object { ($_ -split '\s+')[1] }
$adminUrl = fly apps list | Select-String "swizauth-admin" | ForEach-Object { ($_ -split '\s+')[1] }  
$dashboardUrl = fly apps list | Select-String "swizauth-dashboard" | ForEach-Object { ($_ -split '\s+')[1] }

# Set service URLs as secrets
Write-Host "[CONFIG] Configuring service URLs..." -ForegroundColor White
Set-Location dashboard
fly secrets set NEXT_PUBLIC_AUTH_SERVICE_URL="https://$authUrl"
fly secrets set NEXT_PUBLIC_ADMIN_SERVICE_URL="https://$adminUrl"
Set-Location ..

Set-Location admin-service
fly secrets set AUTH_SERVICE_URL="https://$authUrl"  
fly secrets set CORS_ALLOWED_ORIGINS="https://$dashboardUrl"
Set-Location ..

Set-Location auth-service
fly secrets set CORS_ALLOWED_ORIGINS="https://$dashboardUrl,https://$adminUrl"
Set-Location ..

Write-Host ""
Write-Host "[SUCCESS] SwizAuth deployed to Fly.io!" -ForegroundColor Green
Write-Host ""
Write-Host "[URLS] Application URLs:" -ForegroundColor Cyan
Write-Host "   • Dashboard:     https://$dashboardUrl" -ForegroundColor White
Write-Host "   • Admin API:     https://$adminUrl" -ForegroundColor White  
Write-Host "   • Auth Service:  https://$authUrl" -ForegroundColor White
Write-Host ""
Write-Host "[NEXT] Next steps:" -ForegroundColor Cyan
Write-Host "   1. Connect to PostgreSQL and run seed data:" -ForegroundColor White
Write-Host "      fly postgres connect -a swizauth-db" -ForegroundColor Gray
Write-Host "      # Then run the contents of migrations/seed.sql" -ForegroundColor Gray
Write-Host "   2. Test authentication flows" -ForegroundColor White
Write-Host "   3. Configure custom domain (optional)" -ForegroundColor White
Write-Host ""
Write-Host "[LOGIN] Test Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@swizfusion.com" -ForegroundColor White
Write-Host "   Password: Password123!" -ForegroundColor White
Write-Host ""