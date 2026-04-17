@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Check MK-tool
cd /d "%~dp0"

set "PS_EXE=powershell"
where pwsh >nul 2>nul
if not errorlevel 1 set "PS_EXE=pwsh"

echo [MK-tool] Checking...
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0check.ps1"
if errorlevel 1 goto :fail

echo.
echo [MK-tool] Check passed.
pause
exit /b 0

:fail
echo.
echo [MK-tool] Check failed.
pause
exit /b 1
