# Rivo REBRANDING SCRIPT
# Run this in PowerShell to automatically rename everything from Rivo to Rivo

$projectPath = "c:\Users\aditya\OneDrive\Desktop\imagine cup\sensorysafe"

Write-Host "Starting Rivo to Rivo rebranding..." -ForegroundColor Green

# Step 1: Rename files
Write-Host "`nStep 1: Renaming files..." -ForegroundColor Yellow
if (Test-Path "$projectPath\Rivo.html") {
    Rename-Item "$projectPath\Rivo.html" "Rivo.html"
    Write-Host "  ✓ Renamed Rivo.html to Rivo.html" -ForegroundColor Green
}
if (Test-Path "$projectPath\Rivoazuremap.html") {
    Rename-Item "$projectPath\Rivoazuremap.html" "Rivoazuremap.html"
    Write-Host "  ✓ Renamed Rivoazuremap.html to Rivoazuremap.html" -ForegroundColor Green
}

# Step 2: Replace content in all files
Write-Host "`nStep 2: Replacing content in files..." -ForegroundColor Yellow

$files = Get-ChildItem -Path $projectPath -Include *.html,*.js,*.css,*.md,*.txt,*.json -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace Rivo with Rivo
    $content = $content -replace 'Rivo Navigation', 'Rivo'
    $content = $content -replace 'Rivo', 'Rivo'
    $content = $content -replace 'Rivo', 'Rivo'
    $content = $content -replace '--Rivo-', '--Rivo-'
    $content = $content -replace 'sensorysafe-backend', 'Rivo-backend'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Updated $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Rebranding complete! Rivo is now Rivo." -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open index.html and verify changes"
Write-Host "2. Test Rivo.html in browser"
Write-Host "3. Check that all links work"

Read-Host "`nPress Enter to exit"
