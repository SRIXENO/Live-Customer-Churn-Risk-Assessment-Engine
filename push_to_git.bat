@echo off
title Push S7 Project to GitHub
echo ========================================================
echo   Pushing Live Engine to GitHub Repository
echo   Remote: https://github.com/SRIXENO/Live-Customer-Churn-Risk-Assessment-Engine.git
echo ========================================================
echo.

set PATH=C:\Users\mrvss\AppData\Local\Programs\Git\cmd;%PATH%
git status
echo.
echo Pushing commit(s) to origin main...
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo   [NOTICE] Authentication may be required.
    echo   If prompted, sign in via your browser or provide
    echo   your GitHub Personal Access Token (PAT).
    echo ========================================================
)
echo.
pause
