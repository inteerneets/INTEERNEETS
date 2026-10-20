@echo off
title INTEERNEETS WEB - Local Server
color 0A

echo.
echo   ========================================
echo        INTEERNEETS WEB - Local Server
echo   ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   [ERROR] Node.js is not installed!
    echo.
    echo   Please install Node.js from:
    echo   https://nodejs.org/
    echo.
    echo   Download the LTS version, run the installer,
    echo   then try this script again.
    echo.
    pause
    exit /b 1
)

echo   Starting local server...
echo.
start "" http://localhost:8000
node "%~dp0server.js"
pause
