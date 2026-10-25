@echo off
REM Windows kurulumu: bu dosyaya cift tikla.
cd /d "%~dp0"
echo Reels studyosu kuruluyor...
winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
echo.
echo Programlar kuruldu. Simdi bu pencereyi KAPAT ve kurulum-windows-2.bat dosyasina cift tikla.
pause
