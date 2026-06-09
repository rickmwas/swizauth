# SwizAuth Local Production Deployment Script (PowerShell)
param(
    [switch]$Force
)

Write-Host "[DEPLOY] Starting SwizAuth Local Production Deployment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "[ERROR] .env.production file not found!" -ForegroundColor Red
    Write-Host "[INFO] Please copy .env.prod to .env.production and configure your values:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.prod .env.production" -ForegroundColor Cyan
    Write-Host "   # Edit .env.production with your actual values" -ForegroundColor Gray
    exit 1
}

Write-Host "[OK] Environment file found" -ForegroundColor Green

# Function to generate random hex string
function Generate-Secret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

# Function to check and generate secrets
function Check-AndGenerateSecret {
    param($VarName)
    
    $content = Get-Content ".env.production" -Raw
    $pattern = "^" + $VarName + "=(.*)$"
    $match = [regex]::Match($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    if (-not $match.Success -or $match.Groups[1].Value -like "*your_*" -or [string]::IsNullOrEmpty($match.Groups[1].Value)) {
        $newSecret = Generate-Secret
        $replacement = $VarName + "=" + $newSecret
        $newContent = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline)
        Set-Content ".env.production" $newContent -NoNewline
        Write-Host "[GENERATED] New secret for $VarName" -ForegroundColor Yellow
    }
}

Write-Host "[SECURITY] Checking secrets..." -ForegroundColor Cyan
Check-AndGenerateSecret "INTERNAL_API_SECRET"
Check-AndGenerateSecret "MFA_ENCRYPTION_KEY"
Check-AndGenerateSecret "SESSION_SECRET"

# Build and start services
Write-Host "[BUILD] Building Docker images..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml --env-file .env.production build

Write-Host "[DEPLOY] Starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

Write-Host "[WAIT] Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "[HEALTH] Checking service health..." -ForegroundColor Cyan

$services = @(
    @{url="http://localhost:8080/health"; name="Auth Service"},
    @{url="http://localhost:3001/health"; name="Admin Service"},
    @{url="http://localhost:3000/api/health"; name="Dashboard"}
)

foreach ($service in $services) {
    Write-Host "Checking $($service.name)..." -ForegroundColor White
    
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $service.url -Method Get -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] $($service.name) is healthy" -ForegroundColor Green
                break
            }
        } catch {
            if ($attempt -eq 5) {
                Write-Host "[ERROR] $($service.name) health check failed after 5 attempts" -ForegroundColor Red
                Write-Host "[LOGS] Checking logs..." -ForegroundColor Yellow
                $containerName = $service.name.ToLower().Replace(" ", "-").Replace("service", "service")
                docker-compose -f docker-compose.prod.yml --env-file .env.production logs --tail=20 $containerName
            } else {
                Write-Host "[RETRY] Attempt $attempt/5 failed, retrying in 10s..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            }
        }
    }
}

# Initialize database with seed data
Write-Host "[DATABASE] Initializing database..." -ForegroundColor Cyan
try {
    $result = docker exec swizauth-postgres-prod psql -U postgres -d swizauth -c "SELECT COUNT(*) FROM public.organizations;" 2>$null
    if ($result -match "\s+0\s+") {
        Write-Host "[SEED] Seeding database..." -ForegroundColor Yellow
        Get-Content "migrations\seed.sql" | docker exec -i swizauth-postgres-prod psql -U postgres -d swizauth
        Write-Host "[OK] Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] Database already contains data, skipping seed" -ForegroundColor Blue
    }
} catch {
    Write-Host "[WARN] Could not check database status, attempting to seed..." -ForegroundColor Yellow
    Get-Content "migrations\seed.sql" | docker exec -i swizauth-postgres-prod psql -U postgres -d swizauth
}

Write-Host ""
Write-Host "[SUCCESS] SwizAuth deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "[URLS] Service URLs:" -ForegroundColor Cyan
Write-Host "   • Dashboard:     http://localhost:3000" -ForegroundColor White
Write-Host "   • Admin API:     http://localhost:3001" -ForegroundColor White
Write-Host "   • Auth Service:  http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "[COMMANDS] Management Commands:" -ForegroundColor Cyan
Write-Host "   • View logs:     docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f" -ForegroundColor Gray
Write-Host "   • Stop services: docker-compose -f docker-compose.prod.yml --env-file .env.production down" -ForegroundColor Gray
Write-Host "   • Restart:       .\scripts\deploy-local.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "[LOGIN] Test Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@swizfusion.com" -ForegroundColor White
Write-Host "   Password: Password123!" -ForegroundColor White
Write-Host ""