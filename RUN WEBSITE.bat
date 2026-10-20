@echo off
title INTEERNEETS WEB - Local Preview
color 0A

echo.
echo  ============================================
echo    INTEERNEETS WEB - Local Website Preview
echo  ============================================
echo.
echo  Starting your website locally...
echo.

:: Check if Python is available (most common on Windows)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  Using Python to serve your site.
    echo.
    echo  -----------------------------------------------
    echo   Your website is running at:
    echo.
    echo       http://localhost:8000
    echo.
    echo   Open that link in your browser!
    echo   Press Ctrl+C to stop the server.
    echo  -----------------------------------------------
    echo.
    start "" "http://localhost:8000"
    python -m http.server 8000
    goto :end
)

:: Check if Python3 is available
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  Using Python3 to serve your site.
    echo.
    echo  -----------------------------------------------
    echo   Your website is running at:
    echo.
    echo       http://localhost:8000
    echo.
    echo   Open that link in your browser!
    echo   Press Ctrl+C to stop the server.
    echo  -----------------------------------------------
    echo.
    start "" "http://localhost:8000"
    python3 -m http.server 8000
    goto :end
)

:: Check if Node.js/npx is available
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  Using Node.js to serve your site.
    echo.
    echo  -----------------------------------------------
    echo   Your website is running at:
    echo.
    echo       http://localhost:8000
    echo.
    echo   Open that link in your browser!
    echo   Press Ctrl+C to stop the server.
    echo  -----------------------------------------------
    echo.
    start "" "http://localhost:8000"
    npx serve -l 8000 --no-clipboard
    goto :end
)

:: Nothing found — give instructions
echo  -----------------------------------------------
echo   Could not find Python or Node.js installed.
echo.
echo   To preview your site locally, install one of:
echo.
echo   Option A: Python (easiest)
echo     1. Go to https://www.python.org/downloads/
echo     2. Download and install Python
echo     3. IMPORTANT: Check "Add to PATH" during install
echo     4. Double-click this file again
echo.
echo   Option B: Node.js
echo     1. Go to https://nodejs.org
echo     2. Download and install the LTS version
echo     3. Double-click this file again
echo  -----------------------------------------------
echo.
pause

:end
