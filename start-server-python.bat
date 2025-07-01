@echo off
echo ========================================
echo    MENTALPLUS - Serveur Python
echo ========================================
echo.
echo Verification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python non trouve, essai avec python3...
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERREUR: Python n'est pas installe ou non accessible.
        echo Veuillez installer Python depuis https://python.org/
        pause
        exit /b 1
    ) else (
        echo Python3 detecte !
        echo.
        echo Demarrage du serveur sur le port 8000...
        echo.
        python3 server.py
    )
) else (
    echo Python detecte !
    echo.
    echo Demarrage du serveur sur le port 8000...
    echo.
    python server.py
)

if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Impossible de demarrer le serveur.
    echo Verifiez que le port 8000 n'est pas deja utilise.
    pause
)