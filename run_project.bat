@echo off
title Live Customer Churn Risk Assessment Engine Launcher
echo ========================================================
echo   Starting S7 Telemetry Engine (Backend + Frontend)
echo ========================================================
echo.

echo [1/2] Launching Backend Server on port 10000...
start "S7 Backend (Port 10000)" cmd /k "cd /d %~dp0backend && pnpm dev"

echo [2/2] Launching Frontend Application on port 5173...
start "S7 Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && pnpm dev"

echo.
echo ========================================================
echo   All services launched in separate windows!
echo   - Backend API:  http://localhost:10000
echo   - Frontend UI:   http://localhost:5173
echo   - Login:         admin@xenoproducts.com / Admin@123
echo ========================================================
echo.
pause
