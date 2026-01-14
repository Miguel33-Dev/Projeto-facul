@echo off
chcp 65001 >nul
cls
echo ========================================
echo   WZK Inventory - Iniciando Servidor
echo ========================================
echo.

cd /d "c:\Users\fabri\OneDrive\Documentos\Projeto facul"

echo Iniciando servidor na porta 8080...
echo.

"C:\Program Files\nodejs\node.exe" server.js

pause
