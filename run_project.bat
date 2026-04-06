@echo off
echo ==========================================
echo    BNPL HACKATHON - SINGLE HOST START
echo ==========================================

echo [1/2] Initializing Database...
call node setup-sqlite.js
if %errorlevel% neq 0 (
    echo Error running setup-sqlite.js
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Starting Server...
echo The server will run at http://localhost:5001
echo.
call node server.js
pause
