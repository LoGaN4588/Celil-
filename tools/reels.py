#!/usr/bin/env python3
"""Reels stüdyosu komut aracı.

Komutlar:
  yeni "<konu>"          Yeni bölüm klasörü oluşturur (episodes/<tarih-konu>/)
  kontrol <bölüm>        Metnin kelime sayısını ve tahmini süresini gösterir
  isle <bölüm>           Sesi temizler, Whisper ile kelime zamanlarını çıkarır
  uret <bölüm>           Videoyu, kapağı ve açıklamayı üretir
  hepsi <bölüm>          isle + uret
  logo <dosya>           Logoyu ekler ve marka renklerini logodan çıkarır
  efektler               Ses efektlerini (pop, whoosh) yeniden üretir

<bölüm> klasör adı ya da adın bir parçası olabilir (örn. "bir-el-daha").
"""
from __future__ import annotations

import datetime as dt
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"
BRAND_DIR = ROOT / "brand"
STUDIO = ROOT / "studio"
FPS = 30
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".mp4", ".mov", ".webm", ".caf", ".aiff", ".aif"}


# ----------------------------------------------------------------- yardımcılar
def log(msg: str) -> None:
    print(f"▸ {msg}", flush=True)


def fail(msg: str) -> None:
    print(f"✖ {msg}", file=sys.stderr)
    sys.exit(1)


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def save_json(p: Path, data) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def tr_lower(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


def norm(word: str) -> str:
    """Eşleştirme için kelimeyi sadeleştirir (küçük harf, noktalama yok)."""
    return "".join(ch for ch in tr_lower(word) if ch.isalnum())


def slugify(text: str) -> str:
    t = tr_lower(text)
    t = t.translate(str.maketrans("çğıöşüâîû", "cgiosuaiu"))
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:48].strip("-") or "bolum"


def find_episode(name: str) -> Path:
    p = Path(name)
    if p.is_dir() and (p / "episode.json").exists():
        return p.resolve()
    cands = sorted(d for d in EPISODES.iterdir() if d.is_dir() and name in d.name)
    if not cands:
        fail(f"'{name}' adında bölüm bulunamadı. episodes/ klasörüne bak.")
    if len(cands) > 1:
        exact = [d for d in cands if d.name == name]
        if exact:
            return exact[0]
        fail("Birden fazla bölüm eşleşti: " + ", ".join(d.name for d in cands))
    return cands[0]


def run(cmd: list[str], cwd: Path | None = None) -> None:
    r = subprocess.run(cmd, cwd=cwd)
    if r.returncode != 0:
        fail("Komut başarısız: " + " ".join(cmd[:4]) + " ...")


def ffprobe_duration(p: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


# ---------------------------------------------------------------- metin okuma
def parse_script(path: Path) -> list[dict]:
    """script.md -> [{metin, n, vurgu}] ; *yıldızlı* kelimeler vurgu=True."""
    lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith(">") or s.startswith("<!--"):
            continue
        lines.append(s)
    text = " ".join(lines)
    tokens = []
    emph = False
    for raw in text.split():
        starts = raw.startswith("*") or raw.lstrip("\"'“(«").startswith("*")
        clean = raw.replace("*", "")
        this_emph = emph or starts
        if raw.count("*") % 2 == 1:
            emph = not emph
        if not clean or not norm(clean):
            # tek başına noktalama: bir önceki kelimeye ekle
            if tokens and clean:
                tokens[-1]["metin"] += clean
            continue
        tokens.append({"metin": clean, "n": norm(clean), "vurgu": this_emph})
    return tokens


# -------------------------------------------------------------------- yeni
EPISODE_TEMPLATE = {
    "konu": "",
    "baslik": ["Birinci satır", "İkinci satır"],
    "kapak": {"ust": "Kısa üst yazı", "buyuk": "Büyük kapak yazısı", "emoji": "🎮"},
    "kartlar": [
        {"tetik": "metindeki ilk kelimeler", "tip": "hook", "metin": "Hook yazısı", "emoji": "😱"}
    ],
    "aciklama": "Instagram açıklaması buraya.",
    "etiketler": ["#oyun", "#gamer"],
}


def cmd_yeni(args: list[str]) -> None:
    if not args:
        fail('Kullanım: reels yeni "konu"')
    konu = " ".join(args)
    folder = EPISODES / f"{dt.date.today().isoformat()}-{slugify(konu)}"
    (folder / "raw").mkdir(parents=True, exist_ok=True)
    if not (folder / "script.md").exists():
        (folder / "script.md").write_text(
            f"# {konu}\n# (# ile başlayan satırlar okunmaz. *Yıldızlı* kelimeler vurgulanır.)\n\nMetin buraya.\n",
            encoding="utf-8",
        )
    if not (folder / "episode.json").exists():
        ep = dict(EPISODE_TEMPLATE, konu=konu)
        save_json(folder / "episode.json", ep)
    log(f"Bölüm hazır: {folder.relative_to(ROOT)}")
    log("Kaydını şu klasöre koy: " + str((folder / 'raw').relative_to(ROOT)))


def cmd_kontrol(args: list[str]) -> None:
    ep_dir = find_episode(args[0])
    toks = parse_script(ep_dir / "script.md")
    n = len(toks)
    lo, hi = n / 2.9, n / 2.3  # Türkçe konuşma hızı ~2.3-2.9 kelime/sn
    vurgu = [t["metin"] for t in toks if t["vurgu"]]
    print(f"Kelime sayısı : {n}")
    print(f"Tahmini süre  : {lo:.0f}-{hi:.0f} sn (hedef 45-60 sn)")
    print(f"Vurgular      : {', '.join(vurgu) or '-'}")
    hook = " ".join(t["metin"] for t in toks[:5])
    print(f"Hook (ilk ~1.5 sn): {hook} ...")


# -------------------------------------------------------------------- ses
CLEAN_FILTER = ",".join([
    "highpass=f=80",                 # uğultu / masa titreşimi
    "lowpass=f=15000",
    "afftdn=nf=-28:tn=1",            # arka plan gürültüsü (gürültü profilini takip eder)
    "deesser=i=0.35",                # sert "s" sesleri
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2",
    "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB",
    "areverse,silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB,areverse",
    "adelay=120|120",                # baştan küçük nefes payı
    "apad=pad_dur=0.35",
])


def clean_audio(src: Path, work: Path) -> Path:
    work.mkdir(parents=True, exist_ok=True)
    pre = work / "on-temiz.wav"
    out = work / "temiz.wav"
    log("ffmpeg: ses temizleniyor (gürültü, uğultu, sessizlik, sıkıştırma)…")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "48000",
         "-af", CLEAN_FILTER, str(pre)])
    # İki geçişli loudnorm: Instagram için -14 LUFS
    meas = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(pre), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
         "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rfind("{"): meas.rfind("}") + 1])
    ln = ("loudnorm=I=-14:TP=-1.5:LRA=11:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(pre), "-af", ln, "-ar", "48000", "-ac", "2", str(out)])
    pre.unlink(missing_ok=True)
    log(f"Temiz ses: {out.relative_to(ROOT)} ({ffprobe_duration(out):.1f} sn)")
    return out


def load_16k(path: Path):
    """Sesi ffmpeg ile 16 kHz mono float diziye çevirir (Whisper girişi)."""
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def transcribe(wav: Path, prompt: str, model_name: str) -> list[dict]:
    from faster_whisper import WhisperModel

    model_name = os.environ.get("REELS_WHISPER_MODEL", model_name)
    log(f"Whisper ({Path(model_name).name}) bilgisayarında çalışıyor… (ilk seferde model indirilir)")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        load_16k(wav), language="tr", word_timestamps=True, vad_filter=False, beam_size=5,
        initial_prompt=prompt[:800], condition_on_previous_text=False,
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            if norm(w.word):
                words.append({"metin": w.word.strip(), "n": norm(w.word), "s": round(w.start, 3),
                              "e": round(w.end, 3), "p": round(w.probability, 3)})
    log(f"Whisper {len(words)} kelime buldu.")
    return words


def align(script: list[dict], heard: list[dict], total: float) -> list[dict]:
    """Metindeki kelimelere Whisper zamanlarını eşler. Altyazıda metnin doğru yazımı kullanılır."""
    sw = [t["n"] for t in script]
    hw = [w["n"] for w in heard]
    times: list[list[float] | None] = [None] * len(script)
    sm = difflib.SequenceMatcher(None, sw, hw, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                h = heard[j1 + k]
                times[i1 + k] = [h["s"], h["e"]]
        elif op == "replace":
            s, e = heard[j1]["s"], heard[j2 - 1]["e"]
            lens = [max(len(script[i]["n"]), 1) for i in range(i1, i2)]
            tot = sum(lens)
            cur = s
            for k, i in enumerate(range(i1, i2)):
                d = (e - s) * lens[k] / tot
                times[i] = [cur, cur + d]
                cur += d
    # Duyulmayan kelimeler: komşuların arasına yerleştir
    i = 0
    n = len(script)
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < n and times[j] is None:
            j += 1
        left = times[i - 1][1] if i > 0 else 0.0
        right = times[j][0] if j < n else total
        if right - left < 0.12 * (j - i):
            right = left + 0.12 * (j - i)
        step = (right - left) / (j - i)
        for k in range(i, j):
            times[k] = [left + step * (k - i), left + step * (k - i + 1)]
        i = j
    out = []
    prev_end = 0.0
    for t, tm in zip(script, times):
        s = max(tm[0], prev_end)
        e = max(tm[1], s + 0.08)
        out.append({"t": t["metin"], "s": round(s, 3), "e": round(e, 3), "v": t["vurgu"]})
        prev_end = s
    matched = sum(b.size for b in sm.get_matching_blocks())
    log(f"Hizalama: metindeki {len(script)} kelimenin {matched} tanesi birebir duyuldu.")
    return out


def pages(words: list[dict], max_chars: int = 18, max_words: int = 4) -> list[dict]:
    """Altyazıyı ekranda birlikte görünen küçük gruplara böler."""
    groups = []
    cur: list[int] = []
    chars = 0
    for i, w in enumerate(words):
        gap = w["s"] - words[i - 1]["e"] if i else 0
        if cur and (chars + len(w["t"]) > max_chars or len(cur) >= max_words or gap > 0.45):
            groups.append(cur)
            cur, chars = [], 0
        cur.append(i)
        chars += len(w["t"]) + 1
        if re.search(r"[.!?…:;]$", w["t"]) or (w["t"].endswith(",") and len(cur) >= 2):
            groups.append(cur)
            cur, chars = [], 0
    if cur:
        groups.append(cur)
    out = []
    for gi, g in enumerate(groups):
        s = words[g[0]]["s"]
        nxt = words[groups[gi + 1][0]]["s"] if gi + 1 < len(groups) else words[g[-1]]["e"] + 0.8
        e = min(nxt, words[g[-1]]["e"] + 0.7)
        out.append({"a": g[0], "b": g[-1] + 1, "s": round(s, 3), "e": round(e, 3)})
    return out


def find_phrase(words: list[dict], phrase: str, start_idx: int) -> int | None:
    target = [norm(x) for x in phrase.split() if norm(x)]
    if not target:
        return None
    ns = [norm(w["t"]) for w in words]
    for i in range(start_idx, len(ns) - len(target) + 1):
        if ns[i:i + len(target)] == target:
            return i
    for i in range(0, len(ns) - len(target) + 1):  # sırası bozuksa baştan ara
        if ns[i:i + len(target)] == target:
            return i
    # gevşek eşleşme: ilk kelimenin başı tutsun
    for i in range(start_idx, len(ns)):
        if ns[i].startswith(target[0][:4]):
            return i
    return None


def resolve_cards(cards: list[dict], words: list[dict], total: float) -> list[dict]:
    out = []
    idx = 0
    for c in cards:
        c = dict(c)
        wi = find_phrase(words, c.get("tetik", ""), idx) if c.get("tetik") else None
        if wi is None:
            if out:
                log(f"⚠ Kart tetiği bulunamadı, önceki kartın ardına konuyor: \"{c.get('tetik')}\"")
                s = out[-1]["s"] + 2.5
            else:
                s = 0.0
        else:
            s = max(0.0, words[wi]["s"] - 0.12)
            idx = wi + 1
        if not out:
            s = 0.0
        c["s"] = round(s, 3)
        # liste maddelerinin kendi tetikleri
        if isinstance(c.get("maddeler"), list):
            items = []
            midx = wi or idx
            for k, m in enumerate(c["maddeler"]):
                m = {"metin": m} if isinstance(m, str) else dict(m)
                mi = find_phrase(words, m["tetik"], midx) if m.get("tetik") else None
                if mi is not None:
                    m["s"] = round(max(c["s"], words[mi]["s"] - 0.1), 3)
                    midx = mi + 1
                else:
                    m["s"] = round(c["s"] + 0.35 + 0.45 * k, 3)
                items.append(m)
            c["maddeler"] = items
        out.append(c)
    out.sort(key=lambda c: c["s"])
    for i, c in enumerate(out):
        c["e"] = round(out[i + 1]["s"] if i + 1 < len(out) else total, 3)
    return out


def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def cmd_isle(args: list[str]) -> None:
    ep_dir = find_episode(args[0])
    brand = load_json(BRAND_DIR / "brand.json")
    raws = sorted(p for p in (ep_dir / "raw").glob("*") if p.suffix.lower() in AUDIO_EXT)
    if not raws:
        fail(f"{(ep_dir / 'raw').relative_to(ROOT)} içinde ses kaydı yok.")
    src = max(raws, key=lambda p: p.stat().st_mtime)
    log(f"Kayıt: {src.name}")
    work = ep_dir / "work"
    wav = clean_audio(src, work)
    total = ffprobe_duration(wav)
    script = parse_script(ep_dir / "script.md")
    if not script:
        fail("script.md boş görünüyor.")
    heard = transcribe(wav, " ".join(t["metin"] for t in script), brand.get("whisper_model", "small"))
    save_json(work / "whisper.json", heard)
    words = align(script, heard, total)
    save_json(work / "kelimeler.json", {"sure": round(total, 3), "kelimeler": words})
    # SRT (yedek / başka yerlerde kullanmak için)
    pg = pages(words)
    srt = []
    for k, p in enumerate(pg, 1):
        srt.append(f"{k}\n{srt_time(p['s'])} --> {srt_time(p['e'])}\n" + " ".join(w["t"] for w in words[p["a"]:p["b"]]) + "\n")
    (work / "altyazi.srt").write_text("\n".join(srt), encoding="utf-8")
    if total < 40 or total > 65:
        log(f"⚠ Ses {total:.0f} sn. Hedef 45-60 sn.")
    log("Ses işleme bitti. Sıradaki adım: reels uret " + ep_dir.name)


# -------------------------------------------------------------------- render
def browser_args() -> list[str]:
    exe = os.environ.get("REMOTION_BROWSER")
    return [f"--browser-executable={exe}"] if exe else []


def npx() -> str:
    return "npx.cmd" if os.name == "nt" else "npx"


def cmd_uret(args: list[str]) -> None:
    ep_dir = find_episode(args[0])
    sadece_kapak = "--kapak" in args
    brand = load_json(BRAND_DIR / "brand.json")
    ep = load_json(ep_dir / "episode.json")
    kj = ep_dir / "work" / "kelimeler.json"
    if not kj.exists():
        fail("Önce sesi işle: reels isle " + ep_dir.name)
    k = load_json(kj)
    words, total = k["kelimeler"], k["sure"]

    pub = STUDIO / "public" / "ep" / ep_dir.name
    pub.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ep_dir / "work" / "temiz.wav", pub / "ses.wav")
    logo = None
    if brand.get("logo"):
        lp = ROOT / brand["logo"]
        if lp.exists():
            dst = STUDIO / "public" / "brand" / ("logo" + lp.suffix.lower())
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(lp, dst)
            logo = f"brand/{dst.name}"
    muzik = None
    if brand.get("muzik") and (ROOT / brand["muzik"]).exists():
        mp = ROOT / brand["muzik"]
        dst = STUDIO / "public" / "brand" / ("muzik" + mp.suffix.lower())
        shutil.copy2(mp, dst)
        muzik = f"brand/{dst.name}"

    baslik = ep.get("baslik", ["", ""])
    if isinstance(baslik, str):
        baslik = [baslik, ""]
    props = {
        "marka": {
            "kullaniciAdi": brand.get("kullanici_adi", ""),
            "renkler": brand["renkler"],
            "logo": logo,
            "sesEfektleri": bool(brand.get("ses_efektleri", True)),
            "muzik": muzik,
            "muzikSeviyesi": float(brand.get("muzik_seviyesi", 0.07)),
        },
        "baslik": (baslik + ["", ""])[:2],
        "ses": f"ep/{ep_dir.name}/ses.wav",
        "sure": total,
        "kelimeler": words,
        "sayfalar": pages(words),
        "kartlar": resolve_cards(ep.get("kartlar", []), words, total),
        "kapak": ep.get("kapak", {}),
    }
    save_json(pub / "props.json", props)
    save_json(ep_dir / "work" / "props.json", props)

    out = ep_dir / "out"
    out.mkdir(exist_ok=True)
    props_arg = f"--props={pub / 'props.json'}"
    log("Kapak üretiliyor…")
    run([npx(), "remotion", "still", "src/index.ts", "Cover", str(out / "kapak.png"), props_arg,
         "--log=error", *browser_args()], cwd=STUDIO)
    if not sadece_kapak:
        log(f"Video üretiliyor ({total:.1f} sn, 1080x1920, 30 fps)… bu birkaç dakika sürebilir.")
        run([npx(), "remotion", "render", "src/index.ts", "Reel", str(out / "video.mp4"), props_arg,
             "--codec=h264", "--crf=17", "--audio-codec=aac", "--audio-bitrate=256k",
             "--log=error", *browser_args()], cwd=STUDIO)

    tags = " ".join(ep.get("etiketler", []))
    aciklama = ep.get("aciklama", "").strip()
    (out / "aciklama.txt").write_text(f"{aciklama}\n\n{tags}\n", encoding="utf-8")
    shutil.copy2(ep_dir / "work" / "altyazi.srt", out / "altyazi.srt")
    log("Bitti! Dosyalar: " + str(out.relative_to(ROOT)))
    for f in sorted(out.iterdir()):
        print("   •", f.name)


def cmd_hepsi(args: list[str]) -> None:
    cmd_isle(args)
    cmd_uret(args)


# -------------------------------------------------------------------- logo
def cmd_logo(args: list[str]) -> None:
    from PIL import Image
    import colorsys

    if not args:
        fail("Kullanım: reels logo <dosya>")
    src = Path(args[0]).expanduser()
    if not src.exists():
        fail(f"Dosya yok: {src}")
    dst = BRAND_DIR / ("logo" + src.suffix.lower())
    shutil.copy2(src, dst)
    brand = load_json(BRAND_DIR / "brand.json")
    brand["logo"] = f"brand/{dst.name}"
    if src.suffix.lower() == ".svg":
        save_json(BRAND_DIR / "brand.json", brand)
        log("SVG logo eklendi. Renkleri brand/brand.json içinden elle ayarlayabilirsin.")
        return
    im = Image.open(dst).convert("RGBA")
    im.thumbnail((256, 256))
    b = im.tobytes()
    px = [tuple(b[i:i + 4]) for i in range(0, len(b), 4) if b[i + 3] > 200]
    small = Image.new("RGB", (len(px), 1))
    small.putdata([p[:3] for p in px])
    pal = small.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    counts = sorted(pal.getcolors(), reverse=True)
    palette = pal.getpalette()
    cols = []
    for cnt, idx in counts:
        r, g, b = palette[idx * 3: idx * 3 + 3]
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        cols.append({"hex": f"#{r:02X}{g:02X}{b:02X}", "h": h, "l": l, "s": s, "n": cnt})
    vivid = [c for c in cols if c["s"] > 0.35 and 0.25 < c["l"] < 0.8]
    vivid.sort(key=lambda c: c["n"] * (0.5 + c["s"]), reverse=True)
    r = brand["renkler"]
    if vivid:
        r["ana"] = vivid[0]["hex"]
        far = [c for c in vivid[1:] if min(abs(c["h"] - vivid[0]["h"]), 1 - abs(c["h"] - vivid[0]["h"])) > 0.12]
        if far:
            r["vurgu"] = far[0]["hex"]
        def hdist(a, b):
            return min(abs(a - b), 1 - abs(a - b))
        third = [c for c in far[1:] if hdist(c["h"], far[0]["h"]) > 0.12]
        if third:
            r["ikinci"] = third[0]["hex"]
        h, l, s = vivid[0]["h"], vivid[0]["l"], vivid[0]["s"]
        rr, gg, bb = colorsys.hls_to_rgb(h, 0.08, min(1, s * 0.8))
        r["koyu"] = f"#{int(rr*255):02X}{int(gg*255):02X}{int(bb*255):02X}"
    save_json(BRAND_DIR / "brand.json", brand)
    log(f"Logo eklendi: {brand['logo']}")
    log("Logodan çıkan renkler: " + ", ".join(f"{k}={v}" for k, v in r.items()))


# -------------------------------------------------------------------- efektler
def cmd_efektler(_args: list[str]) -> None:
    sfx = STUDIO / "public" / "sfx"
    sfx.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
         "aevalsrc='0.9*sin(2*PI*(260*t+5200*t*t))*exp(-30*t)':s=48000:d=0.16",
         "-af", "afade=t=out:st=0.12:d=0.04", str(sfx / "pop.wav")])
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anoisesrc=d=0.5:c=pink:r=48000:a=0.9",
         "-af", "bandpass=f=1400:w=1800,afade=t=in:d=0.28:curve=exp,afade=t=out:st=0.3:d=0.2,volume=1.6",
         str(sfx / "whoosh.wav")])
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i",
         "aevalsrc='0.5*(sin(2*PI*880*t)*lt(t,0.09)+sin(2*PI*1320*(t))*gte(t,0.09))*exp(-6*t)':s=48000:d=0.35",
         str(sfx / "ding.wav")])
    log("Ses efektleri üretildi: " + str(sfx.relative_to(ROOT)))


COMMANDS = {
    "yeni": cmd_yeni, "kontrol": cmd_kontrol, "isle": cmd_isle, "uret": cmd_uret,
    "hepsi": cmd_hepsi, "logo": cmd_logo, "efektler": cmd_efektler,
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(0 if len(sys.argv) < 2 else 1)
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd in {"kontrol", "isle", "uret", "hepsi"} and not args:
        fail(f"Kullanım: reels {cmd} <bölüm>")
    COMMANDS[cmd](args)


if __name__ == "__main__":
    main()
