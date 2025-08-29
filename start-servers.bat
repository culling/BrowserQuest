@echo off
echo Starting BrowserQuest servers...

echo.
echo Starting game server on port 8000...
start "Game Server" cmd /k "node server/js/main.js"

timeout /t 2 /nobreak > nul

echo.
echo Starting client web server on port 3000...
start "Client Server" cmd /k "node client-server.js"

echo.
echo Both servers starting...
echo Game server: http://localhost:8000 (background service)
echo Client: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul