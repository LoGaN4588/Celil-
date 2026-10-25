# Reels Stüdyosu: Claude için çalışma talimatı

Kullanıcı (@gamergamesofficial) kod bilmiyor. Komutları **sen** çalıştır, sonucu sade Türkçe ile anlat.
Her şey yerelde çalışır: API anahtarı yok, bulut servisi yok.

## Marka
- Ayarlar: `brand/brand.json` (kullanıcı adı, renkler, logo, ses efektleri, müzik, Whisper modeli).
- Ton: **esprili / samimi**. Oyuncu dili, hafif ironi, "kanka" samimiyeti. Kaba ya da aşağılayıcı değil.
- Logo gelince: `./reels logo <dosya>`. Logoyu `brand/` içine kopyalar ve renkleri logodan çıkarır.
  Renk sonucunu göster; kullanıcı isterse `brand/brand.json` dosyasından elle düzelt.

## Akış
1. **Konu gelir → metin yaz.** `./reels yeni "konu"` ile klasörü aç. Sonra iki dosyayı doldur:
   - `episodes/<tarih-konu>/script.md`: okunacak metin.
     - 45-60 sn: **120-145 kelime**. Kontrol için `./reels kontrol <bölüm>` kullan.
     - İlk ~1.5 sn (ilk 4-6 kelime) **hook** olsun: şaşırtıcı, merak uyandıran ya da "bu ben" dedirten bir cümle.
     - Vurgulanacak kelimeleri `*yıldız*` içine al (cümle başına 0-1 vurgu, toplam ~10-18).
     - Kısa cümleler, konuşma dili. Sonda CTA ("yorumlara yaz", "takip et").
     - `#` ile başlayan satırlar okunmaz (not için).
     - Uydurma istatistik YAZMA. Sayı kullanacaksan ya gerçek ve bilinen olsun ya da açıkça şaka olsun.
   - `episodes/<tarih-konu>/episode.json`: başlık (2 satır), kapak, kartlar, Instagram açıklaması, etiketler.
   Metni kullanıcıya göster ve kaydı `episodes/<tarih-konu>/raw/` klasörüne koymasını söyle.
2. **Kullanıcı kaydı koyar** (her ses/video formatı olur: m4a, mp3, wav, mov...). Klasördeki en yeni dosya kullanılır.
3. `./reels isle <bölüm>`: ffmpeg ile temizlik (uğultu, gürültü, sert "s" sesleri, sıkıştırma, -14 LUFS, baştaki/sondaki sessizlik)
   + faster-whisper ile kelime zamanları + metinle hizalama. Altyazıda metnin doğru yazımı kullanılır.
4. `./reels uret <bölüm>`: Remotion ile `out/video.mp4` (1080x1920, 30 fps), `out/kapak.png`, `out/aciklama.txt`, `out/altyazi.srt`.
   (`./reels hepsi <bölüm>` = 3 + 4.) Sonra birkaç kare çıkarıp kontrol et (`ffmpeg -ss <sn> -i video.mp4 -frames:v 1 kare.png`).

## episode.json kartları
Her kartın `tetik` alanı metinden **birebir** bir kelime öbeğidir (2-4 kelime). Kart, o kelimeler söylendiği an çıkar
ve bir sonraki karta kadar ekranda kalır. İlk kart her zaman 0. saniyede başlar (hook). Kart başına 4-8 sn hedefle.

| tip | alanlar | ne zaman |
|---|---|---|
| `hook` | `emoji`, `metin` (`\n` ile 2 satır) | açılış, ilk kart |
| `emoji` | `emoji`, `baslik`, `metin` | genel vurgu, CTA |
| `sayi` | `deger`, `onek`, `sonek`, `emoji`, `metin` | sayı/oran (sayaç animasyonu) |
| `liste` | `baslik`, `emoji`, `maddeler: [{metin, emoji, tetik}]` | adımlar, ipuçları (madde kendi tetiğinde çıkar) |
| `karsilastirma` | `sol` / `sag`: `{emoji, baslik, metin}` | X vs Y |
| `balon` | `kim`, `emoji`, `metin` | alıntı, iç ses, diyalog |
| `basarim` | `emoji`, `baslik`, `metin` | oyun "başarım açıldı" esprisi |
| `can` | `baslik`, `baslangic`, `bitis`, `emoji`, `metin` | can/enerji barı düşüşü |

Başlık satırları kısa olsun: 1. satır ≤ 28, 2. satır ≤ 22 karakter. Kapakta `buyuk` içinde `*yıldız*` vurgu rengi yapar.
Örnek bölüm: `episodes/2026-10-25-son-bir-el/`.

## Teknik notlar
- Python aracı: `tools/reels.py` (`./reels` ya da Windows'ta `reels.bat`, varsa `.venv` kullanır).
- Remotion projesi: `studio/` (önizleme: `cd studio && npm run onizle`). Kartlar: `studio/src/components/Cards.tsx`.
- Ortam değişkenleri: `REELS_WHISPER_MODEL` (model adı ya da klasörü), `REMOTION_BROWSER` (özel Chrome yolu).
- Daha iyi Türkçe tanıma için `brand.json` → `"whisper_model": "medium"` ya da `"large-v3"` (daha yavaş).
