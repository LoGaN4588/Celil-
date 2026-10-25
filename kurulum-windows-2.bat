@echo off
REM Windows kurulumu 2. adim
cd /d "%~dp0"
py -3.12 -m venv .venv || python -m venv .venv
.venv\Scripts\python.exe -m pip install -r tools\requirements.txt -q
cd studio
call npm install --no-audit --no-fund
call npx remotion browser ensure
cd ..
.venv\Scripts\python.exe tools\reels.py efektler
.venv\Scripts\python.exe -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"
echo.
echo Kurulum bitti! Deneme: reels.bat hepsi son-bir-el
pause
