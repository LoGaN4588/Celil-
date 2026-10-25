#!/usr/bin/env bash
# Mac kurulumu: bu dosyaya çift tıkla (ya da Terminal'de ./kurulum-mac.command)
set -e
cd "$(dirname "$0")"
echo "🎬 Reels stüdyosu kuruluyor…"
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew kuruluyor (Mac şifren istenebilir)…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; else eval "$(/usr/local/bin/brew shellenv)"; fi
fi
brew install ffmpeg node python@3.12
PY="$(brew --prefix python@3.12)/bin/python3.12"
"$PY" -m venv .venv
.venv/bin/pip install --upgrade pip -q
.venv/bin/pip install -r tools/requirements.txt -q
(cd studio && npm install --no-audit --no-fund)
.venv/bin/python tools/reels.py efektler
echo "Whisper modeli indiriliyor (bir kereye mahsus, ~500 MB)…"
.venv/bin/python -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"
(cd studio && npx remotion browser ensure)
echo "✅ Kurulum bitti! Deneme: ./reels hepsi son-bir-el"
