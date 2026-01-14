@echo off
chcp 65001 >nul
cls
echo ========================================
echo   WZK Inventory - Abrindo no Navegador
echo ========================================
echo.

timeout /t 2 /nobreak

start http://localhost:8080/login.html

echo Navegador aberto! Se não abrir, acesse:
echo http://localhost:8080/login.html
echo.
pause
