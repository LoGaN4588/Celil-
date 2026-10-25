export type Renkler = {
  ana: string;
  vurgu: string;
  ikinci: string;
  koyu: string;
  acik: string;
};

export type Marka = {
  kullaniciAdi: string;
  renkler: Renkler;
  logo: string | null;
  sesEfektleri: boolean;
  muzik: string | null;
  muzikSeviyesi: number;
};

export type Kelime = {t: string; s: number; e: number; v: boolean};
export type Sayfa = {a: number; b: number; s: number; e: number};

export type Taraf = {emoji?: string; baslik?: string; metin?: string};
export type Madde = {metin: string; emoji?: string; s: number};

export type Kart = {
  tip:
    | 'hook'
    | 'emoji'
    | 'sayi'
    | 'liste'
    | 'karsilastirma'
    | 'balon'
    | 'basarim'
    | 'can';
  s: number;
  e: number;
  tetik?: string;
  metin?: string;
  emoji?: string;
  baslik?: string;
  // sayi
  deger?: number;
  onek?: string;
  sonek?: string;
  // liste
  maddeler?: Madde[];
  // karsilastirma
  sol?: Taraf;
  sag?: Taraf;
  // balon
  kim?: string;
  // can
  baslangic?: number;
  bitis?: number;
};

export type Kapak = {ust?: string; buyuk?: string; alt?: string; emoji?: string};

export type ReelProps = {
  marka: Marka;
  baslik: [string, string] | string[];
  ses: string | null;
  sure: number;
  kelimeler: Kelime[];
  sayfalar: Sayfa[];
  kartlar: Kart[];
  kapak: Kapak;
};
