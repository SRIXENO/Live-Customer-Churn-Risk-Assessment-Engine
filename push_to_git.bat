@echo off
title Push S7 Project to GitHub
echo ========================================================
echo   Pushing Live Engine to GitHub Repository
echo   Remote: https://github.com/SRIXENO/Live-Customer-Churn-Risk-Assessment-Engine.git
echo ========================================================
echo.

set PATH=C:\Users\mrvss\AppData\Local\Programs\Git\cmd;C:\Users\mrvss\AppData\Local\Programs\Git\mingw64\bin;%PATH%
git config user.name "SRIDHAR"
git config user.email "mrvssridhar3@gmail.com"
git config credential.helper manager

echo Current commit status:
git status -s
echo.
echo Attempting git push to origin main...
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo   [NOTICE] If GitHub requested login, complete the sign-in
    echo   in your browser window and run this script again.
    echo ========================================================
)
echo.
pause
