import React from 'react';
import {
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FONT_STACK} from '../fonts';
import type {Kart, Marka, Renkler} from '../types';
import {fitSize, outline, upper, withAlpha} from './util';

type CardProps = {c: Kart; r: Renkler; dur: number; index: number};

/** Giriş/çıkış ve hafif "nefes alma" hareketi. */
const Shell: React.FC<{dur: number; index: number; children: React.ReactNode; slam?: boolean}> = ({
  dur,
  index,
  children,
  slam,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f, fps, config: slam ? {damping: 12, stiffness: 300, mass: 0.6} : {damping: 9, stiffness: 170, mass: 0.7}});
  const exit = interpolate(f, [dur - 7, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const baseTilt = index % 2 === 0 ? -2 : 2;
  const scale = slam ? interpolate(enter, [0, 1], [2.3, 1]) : interpolate(enter, [0, 1], [0.2, 1]);
  const rot = slam ? 0 : interpolate(enter, [0, 1], [index % 2 === 0 ? -16 : 16, baseTilt]);
  const float = Math.sin(f / 16) * 7;
  const shake = slam && f < 10 ? Math.sin(f * 2.7) * (10 - f) * 2.2 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        top: 560,
        left: 0,
        right: 0,
        height: 740,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: (slam ? Math.min(1, enter * 3) : 1) * (1 - exit),
        transform: `translate(${shake}px, ${float + exit * 60}px) scale(${scale * (1 - exit * 0.4)}) rotate(${rot}deg)`,
      }}
    >
      {children}
    </div>
  );
};

const Panel: React.FC<{r: Renkler; children: React.ReactNode; width?: number; bg?: string}> = ({
  r,
  children,
  width = 880,
  bg,
}) => (
  <div
    style={{
      width,
      boxSizing: 'border-box',
      background: bg ?? r.acik,
      border: `7px solid ${r.koyu}`,
      borderRadius: 56,
      boxShadow: `16px 16px 0 ${r.ana}, 16px 16px 0 7px ${r.koyu}`,
      padding: '48px 56px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      fontFamily: FONT_STACK,
      color: r.koyu,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
);

const useBounce = (speed = 9, amp = 26) => {
  const f = useCurrentFrame();
  return -Math.abs(Math.sin(f / speed)) * amp;
};

const BigEmoji: React.FC<{e?: string; size?: number}> = ({e, size = 210}) => {
  const y = useBounce();
  const f = useCurrentFrame();
  if (!e) return null;
  return (
    <div style={{fontSize: size, lineHeight: 1.05, transform: `translateY(${y}px) rotate(${Math.sin(f / 11) * 8}deg)`}}>
      {e}
    </div>
  );
};

// ------------------------------------------------------------------ kart tipleri
const Hook: React.FC<CardProps> = ({c, r, dur, index}) => {
  const text = upper(c.metin ?? '');
  return (
    <Shell dur={dur} index={index} slam>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT_STACK, width: 960}}>
        <BigEmoji e={c.emoji} size={240} />
        <div
          style={{
            fontWeight: 800,
            fontSize: fitSize(text, 128, 960, 0.6),
            lineHeight: 1.02,
            color: r.vurgu,
            textAlign: 'center',
            transform: 'rotate(-3deg)',
            whiteSpace: 'pre-line',
            ...outline(r.koyu, 9, 14),
          }}
        >
          {text}
        </div>
      </div>
    </Shell>
  );
};

const EmojiCard: React.FC<CardProps> = ({c, r, dur, index}) => (
  <Shell dur={dur} index={index}>
    <Panel r={r}>
      <BigEmoji e={c.emoji} />
      {c.baslik && <div style={{fontSize: 46, fontWeight: 700, color: r.ana, lineHeight: 1}}>{upper(c.baslik)}</div>}
      <div style={{fontSize: fitSize(c.metin ?? '', 70, 760, 0.52), fontWeight: 800, lineHeight: 1.08}}>{c.metin}</div>
    </Panel>
  </Shell>
);

const Sayi: React.FC<CardProps> = ({c, r, dur, index}) => {
  const f = useCurrentFrame();
  const v = c.deger ?? 0;
  const p = interpolate(f, [4, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const shown = Number.isInteger(v) ? Math.round(v * p).toLocaleString('tr-TR') : (v * p).toFixed(1).replace('.', ',');
  const done = p >= 1;
  const punch = done ? 1 + Math.max(0, 0.12 - (f - 30) * 0.02) : 1;
  return (
    <Shell dur={dur} index={index}>
      <Panel r={r}>
        {c.emoji && <div style={{fontSize: 110, lineHeight: 1}}>{c.emoji}</div>}
        <div
          style={{
            fontSize: 210,
            fontWeight: 800,
            lineHeight: 0.95,
            color: r.ana,
            transform: `scale(${punch})`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {c.onek ?? ''}
          {shown}
          <span style={{fontSize: 120}}>{c.sonek ?? ''}</span>
        </div>
        <div style={{fontSize: fitSize(c.metin ?? '', 60, 760, 0.52), fontWeight: 700, lineHeight: 1.1}}>{c.metin}</div>
      </Panel>
    </Shell>
  );
};

const Liste: React.FC<CardProps> = ({c, r, dur, index}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = c.maddeler ?? [];
  return (
    <Shell dur={dur} index={index}>
      <Panel r={r}>
        {c.baslik && (
          <div style={{fontSize: 62, fontWeight: 800, lineHeight: 1.05, color: r.ana}}>
            {c.emoji ? `${c.emoji} ` : ''}
            {c.baslik}
          </div>
        )}
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch', marginTop: 6}}>
          {items.map((m, i) => {
            const startF = Math.round((m.s - c.s) * fps);
            const sp = spring({frame: f - startF, fps, config: {damping: 10, stiffness: 200}});
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  textAlign: 'left',
                  fontSize: 52,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  background: withAlpha(r.ana, 0.12),
                  borderRadius: 26,
                  padding: '14px 22px 8px',
                  opacity: f >= startF ? 1 : 0,
                  transform: `translateX(${(1 - sp) * (i % 2 ? 120 : -120)}px) scale(${0.7 + 0.3 * sp})`,
                }}
              >
                <span style={{fontSize: 58}}>{m.emoji ?? '✅'}</span>
                <span>{m.metin}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </Shell>
  );
};

const Taraf: React.FC<{t?: {emoji?: string; baslik?: string; metin?: string}; r: Renkler; bg: string; tilt: number; delay: number}> = ({
  t,
  r,
  bg,
  tilt,
  delay,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: f - delay, fps, config: {damping: 10, stiffness: 180}});
  return (
    <div
      style={{
        width: 410,
        minHeight: 520,
        boxSizing: 'border-box',
        background: bg,
        border: `7px solid ${r.koyu}`,
        borderRadius: 46,
        boxShadow: `12px 12px 0 ${r.koyu}`,
        padding: '40px 26px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        textAlign: 'center',
        color: r.koyu,
        transform: `rotate(${tilt * sp}deg) scale(${sp})`,
      }}
    >
      <div style={{fontSize: 150, lineHeight: 1}}>{t?.emoji}</div>
      <div style={{fontSize: fitSize(t?.baslik ?? '', 58, 350, 0.55), fontWeight: 800, lineHeight: 1}}>{t?.baslik}</div>
      <div style={{fontSize: fitSize(t?.metin ?? '', 40, 350, 0.5), fontWeight: 700, lineHeight: 1.12}}>{t?.metin}</div>
    </div>
  );
};

const Karsilastirma: React.FC<CardProps> = ({c, r, dur, index}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vs = spring({frame: f - 10, fps, config: {damping: 8, stiffness: 260}});
  return (
    <Shell dur={dur} index={index}>
      <div style={{position: 'relative', display: 'flex', gap: 40, fontFamily: FONT_STACK}}>
        <Taraf t={c.sol} r={r} bg={r.acik} tilt={-4} delay={0} />
        <Taraf t={c.sag} r={r} bg={r.vurgu} tilt={4} delay={5} />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 170,
            height: 170,
            marginLeft: -85,
            marginTop: -85,
            borderRadius: 999,
            background: r.ana,
            border: `7px solid ${r.koyu}`,
            color: r.acik,
            fontSize: 76,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 10,
            boxSizing: 'border-box',
            transform: `scale(${vs * (1 + Math.sin(f / 5) * 0.04)}) rotate(${(1 - vs) * 180 - 8}deg)`,
          }}
        >
          VS
        </div>
      </div>
    </Shell>
  );
};

const Balon: React.FC<CardProps> = ({c, r, dur, index}) => {
  const text = c.metin ?? '';
  return (
    <Shell dur={dur} index={index}>
      <div style={{position: 'relative', fontFamily: FONT_STACK, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {c.kim && (
          <div
            style={{
              alignSelf: 'flex-start',
              marginLeft: 40,
              marginBottom: -26,
              zIndex: 2,
              background: r.ana,
              color: r.acik,
              fontSize: 46,
              fontWeight: 800,
              padding: '10px 30px 4px',
              borderRadius: 20,
              border: `6px solid ${r.koyu}`,
              transform: 'rotate(-4deg)',
            }}
          >
            {c.emoji ? `${c.emoji} ` : ''}
            {c.kim}
          </div>
        )}
        <Panel r={r} width={860}>
          <div style={{fontSize: fitSize(text, 76, 740, 0.5), fontWeight: 800, lineHeight: 1.1}}>“{text}”</div>
        </Panel>
        <div
          style={{
            width: 0,
            height: 0,
            marginTop: -7,
            marginLeft: 380,
            borderLeft: '40px solid transparent',
            borderRight: '40px solid transparent',
            borderTop: `70px solid ${r.koyu}`,
          }}
        />
      </div>
    </Shell>
  );
};

const Basarim: React.FC<CardProps> = ({c, r, dur, index}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: f, fps, config: {damping: 14, stiffness: 150}});
  const shine = interpolate(f, [8, 30], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Shell dur={dur} index={index}>
      <div
        style={{
          width: 920,
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          padding: '30px 40px 26px 30px',
          boxSizing: 'border-box',
          borderRadius: 999,
          background: `linear-gradient(100deg, ${r.koyu} 0%, ${r.koyu} ${shine - 10}%, ${withAlpha(r.acik, 0.35)} ${shine}%, ${r.koyu} ${shine + 10}%, ${r.koyu} 100%)`,
          border: `7px solid ${r.vurgu}`,
          boxShadow: `0 0 60px ${withAlpha(r.vurgu, 0.55)}`,
          fontFamily: FONT_STACK,
          transform: `translateX(${(1 - sp) * -700}px)`,
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            width: 160,
            height: 160,
            borderRadius: 999,
            background: r.vurgu,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 96,
          }}
        >
          {c.emoji ?? '🏆'}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <div style={{fontSize: 36, fontWeight: 800, color: r.vurgu, letterSpacing: 2}}>
            {upper(c.baslik ?? 'Başarım açıldı')}
          </div>
          <div style={{fontSize: fitSize(c.metin ?? '', 58, 620, 0.52), fontWeight: 800, color: r.acik, lineHeight: 1.08}}>
            {c.metin}
          </div>
        </div>
      </div>
    </Shell>
  );
};

const Can: React.FC<CardProps> = ({c, r, dur, index}) => {
  const f = useCurrentFrame();
  const from = c.baslangic ?? 100;
  const to = c.bitis ?? 5;
  const p = interpolate(f, [8, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const val = from + (to - from) * p;
  const color = val > 60 ? '#38E54D' : val > 25 ? '#FFC93C' : '#FF4D4D';
  const low = val <= 25;
  return (
    <Shell dur={dur} index={index}>
      <Panel r={r}>
        <BigEmoji e={c.emoji} size={150} />
        <div style={{fontSize: 52, fontWeight: 800, lineHeight: 1}}>{c.baslik ?? 'CAN'}</div>
        <div
          style={{
            alignSelf: 'stretch',
            height: 90,
            borderRadius: 24,
            border: `7px solid ${r.koyu}`,
            background: withAlpha(r.koyu, 0.15),
            overflow: 'hidden',
            position: 'relative',
            transform: low ? `translateX(${Math.sin(f * 2.2) * 6}px)` : undefined,
          }}
        >
          <div style={{width: `${val}%`, height: '100%', background: color, borderRadius: 14}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 54,
              fontWeight: 800,
              color: r.koyu,
              paddingTop: 8,
            }}
          >
            {Math.round(val)} / 100
          </div>
        </div>
        <div style={{fontSize: fitSize(c.metin ?? '', 58, 760, 0.52), fontWeight: 800, lineHeight: 1.1}}>{c.metin}</div>
      </Panel>
    </Shell>
  );
};

const MAP: Record<Kart['tip'], React.FC<CardProps>> = {
  hook: Hook,
  emoji: EmojiCard,
  sayi: Sayi,
  liste: Liste,
  karsilastirma: Karsilastirma,
  balon: Balon,
  basarim: Basarim,
  can: Can,
};

const SFX: Partial<Record<Kart['tip'], string>> = {
  hook: 'sfx/whoosh.wav',
  karsilastirma: 'sfx/whoosh.wav',
  basarim: 'sfx/ding.wav',
};

/** Ortadaki, konuya göre değişen animasyonlu kartlar. */
export const Cards: React.FC<{kartlar: Kart[]; marka: Marka}> = ({kartlar, marka}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {kartlar.map((c, i) => {
        const from = Math.round(c.s * fps);
        const dur = Math.max(1, Math.round(c.e * fps) - from);
        const Comp = MAP[c.tip] ?? EmojiCard;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <Comp c={c} r={marka.renkler} dur={dur} index={i} />
            {marka.sesEfektleri && <Audio src={staticFile(SFX[c.tip] ?? 'sfx/pop.wav')} volume={0.32} />}
          </Sequence>
        );
      })}
    </>
  );
};
