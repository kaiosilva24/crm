@echo off
echo ========================================
echo  REINICIANDO CRM - Sales Recovery
echo ========================================
echo.

echo [1/3] Parando processos na porta 3001...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001') DO TaskKill /PID %%P /F 2>nul

echo [2/3] Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo [3/3] Iniciando backend...
cd /d "%~dp0backend"
start "CRM Backend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Backend iniciado!
echo  Acesse: http://localhost:3001/api/health
echo ========================================
echo.
pause
