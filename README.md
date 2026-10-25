# 🎮 @gamergamesofficial: Reels Stüdyosu

Kendi sesinle senkron, animasyonlu Instagram Reels üreten stüdyo. Her şey **kendi bilgisayarında** çalışır,
API anahtarı gerekmez.

**Örnek çıktı:** [`episodes/2026-10-25-son-bir-el/out/video.mp4`](episodes/2026-10-25-son-bir-el/out/video.mp4)
(deneme sesi bilgisayar sesidir; kendi kaydınla çok daha iyi olur).

## Kurulum (bir kere)
- **Mac:** `kurulum-mac.command` dosyasına çift tıkla.
- **Windows:** önce `kurulum-windows.bat`, sonra `kurulum-windows-2.bat` dosyasına çift tıkla.
- **Linux:** `./kurulum-linux.sh`

Kurulum ffmpeg, Node.js, Python, Remotion ve Whisper modelini (~500 MB) indirir.

## Nasıl çalışır?
1. Claude'a konuyu söyle → 45-60 sn'lik metni yazar (`script.md`, vurgular `*yıldızlı*`).
2. Metni oku, kaydı `episodes/<tarih-konu>/raw/` klasörüne koy (telefondan m4a/mp3/mov olur).
3. Claude çalıştırır: `./reels hepsi <tarih-konu>`
   - ffmpeg sesi temizler (gürültü, uğultu, ses seviyesi -14 LUFS)
   - Whisper bilgisayarında her kelimenin zamanını çıkarır
   - Remotion 1080x1920 / 30 fps video + kapak üretir
4. Çıktılar `episodes/<tarih-konu>/out/` içinde:
   `video.mp4` · `kapak.png` · `aciklama.txt` (Instagram açıklaması + etiketler) · `altyazi.srt`

## Video düzeni
- **Üstte:** sabit 2 satırlık başlık + logo ve kullanıcı adı
- **Ortada:** konuya göre değişen, sesle zamanlanan animasyonlu kartlar (emoji, sayaç, liste, VS, konuşma balonu, "başarım açıldı", can barı)
- **Altta:** sesle kelime kelime beliren altyazı; vurgulu kelimeler renkli ve zıplayan

## Komutlar
| Komut | Ne yapar |
|---|---|
| `./reels yeni "konu"` | yeni bölüm klasörü |
| `./reels kontrol <bölüm>` | kelime sayısı / tahmini süre |
| `./reels isle <bölüm>` | ses temizleme + Whisper |
| `./reels uret <bölüm>` | video + kapak + açıklama |
| `./reels hepsi <bölüm>` | hepsi birden |
| `./reels logo <dosya>` | logoyu ekle, renkleri logodan al |

Windows'ta `./reels` yerine `reels.bat` yaz.
