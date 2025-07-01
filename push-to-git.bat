@echo off
echo ========================================
echo Script de push vers GitHub - MentalPlus
echo ========================================
echo.

echo Verification de Git...
git --version
if %errorlevel% neq 0 (
    echo ERREUR: Git n'est pas installe ou pas dans le PATH
    echo Veuillez installer Git depuis: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo Verification du repository...
git remote -v
if %errorlevel% neq 0 (
    echo ERREUR: Ce dossier n'est pas un repository Git
    echo Initialisation du repository...
    git init
    git remote add origin https://github.com/Bryan922/MentalPlus.git
)

echo.
echo Ajout des fichiers...
git add .
if %errorlevel% neq 0 (
    echo ERREUR lors de l'ajout des fichiers
    pause
    exit /b 1
)

echo.
echo Status du repository:
git status

echo.
set /p commit_message="Entrez le message de commit (ou appuyez sur Entree pour un message par defaut): "
if "%commit_message%"=="" set commit_message="Mise a jour documentation agence et analyse technique Supabase"

echo.
echo Commit des modifications...
git commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo ERREUR lors du commit
    pause
    exit /b 1
)

echo.
echo Push vers GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo Tentative avec la branche master...
    git push -u origin master
    if %errorlevel% neq 0 (
        echo ERREUR lors du push
        echo Verifiez vos credentials GitHub
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Push termine avec succes!
echo Repository: https://github.com/Bryan922/MentalPlus
echo ========================================
pause