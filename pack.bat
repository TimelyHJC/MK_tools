@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Pack MK-tool
cd /d "%~dp0"

set "PS_EXE=powershell"
where pwsh >nul 2>nul
if not errorlevel 1 set "PS_EXE=pwsh"

echo [MK-tool] Packing...
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0pack.ps1"
if errorlevel 1 goto :fail

echo.
echo [MK-tool] Success. Press any key to open output folder...
pause >nul
explorer "%~dp0.."
exit /b 0

:fail
echo.
echo [MK-tool] Pack failed.
pause
exit /b 1
