# Deep Clean Environment Script for Windows
Write-Host "Starting Deep Clean of Next.js Environment..." -ForegroundColor Yellow

# Stop any running node processes to prevent file locking
Write-Host "Stopping Node.js processes..." -ForegroundColor Cyan
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Remove cache directories
$items = @(".next", "node_modules", "package-lock.json", "npm-debug.log")
foreach ($item in $items) {
    if (Test-Path $item) {
        Write-Host "Removing $item..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $item
    }
}

Write-Host "Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

Write-Host "Re-installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Environment Stabilized. You can now run 'npm run dev'." -ForegroundColor Green
