#!/usr/bin/env pwsh
# Full rebuild and restart script for BrowserQuest

Write-Host "🛑 Stopping existing servers..." -ForegroundColor Yellow

# Stop servers on ports 8000 and 3000
try {
    $processes = Get-NetTCPConnection -LocalPort 8000,3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        $processes | ForEach-Object { 
            Write-Host "Stopping process $_" -ForegroundColor Red
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    } else {
        Write-Host "No servers running on ports 8000 or 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "No existing servers to stop" -ForegroundColor Green
}

Write-Host "`n Exporting maps..." -ForegroundColor Cyan
Write-Host "Waiting for map export to complete..." -ForegroundColor Yellow
$mapExport = Start-Process -FilePath "npm" -ArgumentList "run", "map:export" -Wait -PassThru -NoNewWindow
if ($mapExport.ExitCode -ne 0) {
    Write-Host " Map export failed!" -ForegroundColor Red
    exit 1
}
Write-Host " Map export completed successfully" -ForegroundColor Green

Write-Host "`n Building client..." -ForegroundColor Cyan
Write-Host "Waiting for client build to complete..." -ForegroundColor Yellow
$clientBuild = Start-Process -FilePath "npm" -ArgumentList "run", "build" -Wait -PassThru -NoNewWindow
if ($clientBuild.ExitCode -ne 0) {
    Write-Host " Client build failed!" -ForegroundColor Red
    exit 1
}
Write-Host " Client build completed successfully" -ForegroundColor Green

Write-Host "`n Starting servers..." -ForegroundColor Green
Write-Host "Starting both game server (port 8000) and client server (port 3000)..." -ForegroundColor Yellow

# Start both servers using the npm script (this runs in foreground)
npm run dev

Write-Host "`n✅ All done! Servers should be running." -ForegroundColor Green
Write-Host "🌐 Open http://localhost:3000 in your browser to play" -ForegroundColor Cyan