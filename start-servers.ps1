# PowerShell script to start both BrowserQuest servers

Write-Host "Starting BrowserQuest servers..." -ForegroundColor Green

Write-Host "`nStarting game server on port 8000..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "server/js/main.js" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting client web server on port 3000..." -ForegroundColor Yellow  
Start-Process -FilePath "node" -ArgumentList "client-server.js" -WindowStyle Normal

Write-Host "`nBoth servers started!" -ForegroundColor Green
Write-Host "Game server: http://localhost:8000 (background service)" -ForegroundColor Cyan
Write-Host "Client: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nOpen your browser and go to http://localhost:3000 to play!" -ForegroundColor White

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")