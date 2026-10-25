import type {ReelProps} from './types';

// Remotion Studio önizlemesi için küçük örnek veri. Gerçek videolar `reels uret` ile üretilir.
const metin = 'Son bir el diyorsun ve saat sabahın *dördü.* Hadi itiraf et, herkes yaşadı.';
const kelimeler = metin.split(' ').map((t, i) => ({
  t: t.replace(/\*/g, ''),
  s: 0.2 + i * 0.42,
  e: 0.2 + i * 0.42 + 0.38,
  v: t.includes('*'),
}));

export const ornek: ReelProps = {
  marka: {
    kullaniciAdi: '@gamergamesofficial',
    renkler: {ana: '#8B5CF6', vurgu: '#B6FF3B', ikinci: '#22D3EE', koyu: '#0F0A24', acik: '#FFFFFF'},
    logo: null,
    sesEfektleri: true,
    muzik: null,
    muzikSeviyesi: 0.07,
  },
  baslik: ['Son bir el diyorsun ama...', "Saat sabahın 4'ü 💀"],
  ses: null,
  sure: 6,
  kelimeler,
  sayfalar: [
    {a: 0, b: 4, s: 0.2, e: 1.88},
    {a: 4, b: 8, s: 1.88, e: 3.56},
    {a: 8, b: 13, s: 3.56, e: 6},
  ],
  kartlar: [
    {tip: 'hook', s: 0, e: 3.5, emoji: '🕓', metin: 'Son bir el...\nSaat 04:00'},
    {tip: 'emoji', s: 3.5, e: 6, emoji: '🙋', baslik: 'İtiraf vakti', metin: 'Bunu herkes yaşadı'},
  ],
  kapak: {ust: 'Gamer gerçekleri', buyuk: '*Son bir el* asla son değil', emoji: '🎮'},
};
