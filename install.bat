@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "target=%LOCALAPPDATA%\MK-tool"
if not exist "%target%" mkdir "%target%"

echo Copying MK-tool to %target%...
xcopy /E /Y /Q "%~dp0*" "%target%\" >nul 2>&1
if errorlevel 1 (
    echo Copy failed.
    pause
    exit /b 1
)
echo Done.
explorer "%target%"
start "" "chrome://extensions"
echo.
echo Open Chrome Extensions, enable Developer mode, click "Load unpacked", select the folder above.
pause
