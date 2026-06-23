$root = 'c:\Users\rickm\OneDrive\Desktop\swizauth\sdk\src'
$files = Get-ChildItem -Path $root -Recurse -File -Include '*.ts','*.tsx'

foreach ($file in $files) {
    $c = [System.IO.File]::ReadAllText($file.FullName)
    $original = $c
    
    # Fix PascalCase class/interface/type names
    $c = $c.Replace('TSAUTHClient', 'TSAuthClient')
    $c = $c.Replace('TSAUTHConfig', 'TSAuthConfig')
    $c = $c.Replace('TSAUTHClientOptions', 'TSAuthClientOptions')
    $c = $c.Replace('TSAUTHProvider', 'TSAuthProvider')
    
    if ($c -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $c)
        Write-Host "Fixed: $($file.FullName)"
    }
}

# Also fix the index.ts CSS import path (case mismatch)
$indexFile = 'c:\Users\rickm\OneDrive\Desktop\swizauth\sdk\src\index.ts'
$c = [System.IO.File]::ReadAllText($indexFile)
$c = $c.Replace("'./styles/TSAUTH.css'", "'./styles/tsauth.css'")
$c = $c.Replace("'./client/TSAUTHClient'", "'./client/TSAuthClient'")
$c = $c.Replace("'./react/TSAUTHProvider'", "'./react/TSAuthProvider'")
[System.IO.File]::WriteAllText($indexFile, $c)
Write-Host "Fixed index.ts import paths"

# Fix rollup output filenames
$rollupFile = 'c:\Users\rickm\OneDrive\Desktop\swizauth\sdk\rollup.config.js'
$c = [System.IO.File]::ReadAllText($rollupFile)
$c = $c.Replace('TSAUTH.umd.js', 'tsauth.umd.js')
$c = $c.Replace('TSAUTH.esm.js', 'tsauth.esm.js')
$c = $c.Replace("name: 'TSAUTH'", "name: 'TSAuth'")
[System.IO.File]::WriteAllText($rollupFile, $c)
Write-Host "Fixed rollup config"

Write-Host 'Done'
