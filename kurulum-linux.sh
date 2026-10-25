#!/usr/bin/env bash
# Linux (Ubuntu/Debian) kurulumu
set -e
cd "$(dirname "$0")"
sudo apt-get update && sudo apt-get install -y ffmpeg python3-venv nodejs npm
python3 -m venv .venv
.venv/bin/pip install -r tools/requirements.txt -q
(cd studio && npm install --no-audit --no-fund)
.venv/bin/python tools/reels.py efektler
.venv/bin/python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"
(cd studio && npx remotion browser ensure)
echo "✅ Kurulum bitti! Deneme: ./reels hepsi son-bir-el"
