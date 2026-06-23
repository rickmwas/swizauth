# Rebrand Script: TSAUTH -> TSAuth / TerraSeptAuth
$root = 'c:\Users\rickm\OneDrive\Desktop\TSAUTH'
$excludeDirs = @('.git', 'node_modules', '.next', 'dist', '.gemini')
$includeExts = @('.go', '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.yml', '.yaml', '.toml', '.sql', '.sh', '.ps1', '.env')

# Get all target files
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $path = $_.FullName
    $excluded = $false
    foreach ($dir in $excludeDirs) {
        if ($path -match [regex]::Escape('\' + $dir + '\')) { $excluded = $true; break }
    }
    if (-not $excluded) {
        $ext = $_.Extension
        $name = $_.Name
        ($includeExts -contains $ext) -or ($name -match '^\.env') -or ($name -eq '.env.prod')
    }
}

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $original = $content
    
    # Go module path
    $content = $content -replace 'github\.com/rickmwas/TSAUTH/', 'github.com/rickmwas/tsauth/'
    
    # npm scope
    $content = $content -replace '@tsauth/', '@tsauth/'
    
    # CSS variable prefix
    $content = $content -replace '--tsauth-', '--tsauth-'
    
    # CSS class prefix
    $content = $content -replace '\.tsauth-', '.tsauth-'
    
    # API domain
    $content = $content -replace 'api\.TSAUTH\.com', 'api.tsauth.com'
    
    # Email domains
    $content = $content -replace '@TSAUTH\.local', '@tsauth.local'
    $content = $content -replace '@TerraSept\.com', '@terrasept.com'
    
    # Cookie names
    $content = $content -replace 'tsauth_mfa_challenge', 'tsauth_mfa_challenge'
    
    # Fly.io app names
    $content = $content -replace 'tsauth-dashboard', 'tsauth-dashboard'
    $content = $content -replace 'tsauth-admin', 'tsauth-admin'
    $content = $content -replace 'tsauth-auth', 'tsauth-auth'
    $content = $content -replace 'tsauth-db', 'tsauth-db'
    $content = $content -replace 'tsauth-redis', 'tsauth-redis'
    
    # Marketing package name
    $content = $content -replace 'tsauth-marketing', 'tsauth-marketing'
    
    # Docker container names
    $content = $content -replace 'tsauth-postgres', 'tsauth-postgres'
    
    # Database name in connection strings
    $content = $content -replace '/TSAUTH\?', '/tsauth?'
    $content = $content -replace 'tsauth_db', 'tsauth_db'
    
    # Parent company
    $content = $content -replace 'TerraSept', 'TerraSept'
    $content = $content -replace 'TerraSept', 'terrasept'
    
    # Brand name variants (case sensitive, specific to general)
    $content = $content -replace 'TSAUTH', 'TSAUTH'
    $content = $content -replace 'TSAUTH', 'TSAuth'
    $content = $content -replace 'TSAUTH', 'TSAuth'
    $content = $content -replace 'TSAUTH', 'tsauth'
    $content = $content -replace 'tsauth', 'tsauth'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $totalReplacements++
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host ""
Write-Host "Total files updated: $totalReplacements"
