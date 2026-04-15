@echo off
chcp 65001 >nul
title Pack MK-tool
cd /d "%~dp0"

echo [MK-tool] Packing...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pack.ps1"
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
