@echo off
:: Script d'automatisation du push Git pour MentalPlus

echo ============================
echo  PUSH AUTOMATIQUE SUR GITHUB
echo ============================
git status
echo.
git add .
echo.
set /p message="Message du commit (par défaut : 'Mise à jour complète du projet') : "
if "%message%"=="" set message=Mise à jour complète du projet
git commit -m "%message%"
echo.
git push origin master
echo.
echo ============================
echo   PUSH TERMINE !
echo ============================
pause