@echo off
title CodeUnderstander Launcher
echo =======================================================
echo          Starting CodeUnderstander Application
echo =======================================================
echo.

:: Automatically free ports 5000 and 3000 if lingering from a previous run
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %%a >nul 2>&1

echo Launching Backend (port 5000) and Frontend (port 3000)...
echo Press Ctrl+C in this window at any time to stop both servers.
echo.

:: Open browser automatically after a 3 second delay
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start both backend and frontend concurrently
npm start
