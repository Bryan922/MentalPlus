@echo off
echo ========================================
echo    MENTALPLUS - Demarrage du serveur
echo ========================================
echo.
echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe ou non accessible.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detecte !
echo.
echo Demarrage du serveur sur le port 8000...
echo.
node simple-server.js

if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Impossible de demarrer le serveur.
    echo Verifiez que le port 8000 n'est pas deja utilise.
    pause
)