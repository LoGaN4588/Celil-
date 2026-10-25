import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import type {Renkler} from '../types';
import {withAlpha} from './util';

const Symbol: React.FC<{kind: number; size: number; color: string}> = ({kind, size, color}) => {
  const sw = 7;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
      {kind === 0 && <polygon points="50,12 90,84 10,84" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />}
      {kind === 1 && <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth={sw} />}
      {kind === 2 && (
        <g stroke={color} strokeWidth={sw} strokeLinecap="round">
          <line x1="16" y1="16" x2="84" y2="84" />
          <line x1="84" y1="16" x2="16" y2="84" />
        </g>
      )}
      {kind === 3 && <rect x="14" y="14" width="72" height="72" rx="6" fill="none" stroke={color} strokeWidth={sw} />}
    </svg>
  );
};

/** Hareketli marka arka planı: renk lekeleri, piksel ızgara ve yüzen oyun kolu sembolleri. */
export const Background: React.FC<{r: Renkler; seed?: string}> = ({r, seed = 'bg'}) => {
  const f = useCurrentFrame();
  const blobs = [
    {c: r.ana, x: 20 + Math.sin(f / 70) * 12, y: 18 + Math.cos(f / 90) * 8, s: 900},
    {c: r.ikinci, x: 85 + Math.cos(f / 80) * 10, y: 55 + Math.sin(f / 65) * 10, s: 800},
    {c: r.ana, x: 30 + Math.sin(f / 95 + 2) * 14, y: 92 + Math.cos(f / 75) * 6, s: 850},
  ];
  const symbols = new Array(9).fill(0).map((_, i) => {
    const rx = random(`${seed}-x-${i}`);
    const ry = random(`${seed}-y-${i}`);
    const sp = 0.25 + random(`${seed}-s-${i}`) * 0.5;
    const y = ((ry * 2200 - f * sp * 2) % 2200 + 2200) % 2200 - 140;
    return {
      kind: i % 4,
      x: rx * 1000,
      y,
      rot: f * (random(`${seed}-r-${i}`) - 0.5) * 1.2,
      size: 70 + random(`${seed}-z-${i}`) * 90,
      color: [r.vurgu, r.ikinci, r.ana, r.acik][i % 4],
    };
  });
  return (
    <AbsoluteFill style={{backgroundColor: r.koyu, overflow: 'hidden'}}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.s,
            height: b.s,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${withAlpha(b.c, 0.45)} 0%, ${withAlpha(b.c, 0)} 65%)`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${withAlpha(r.acik, 0.06)} 2px, transparent 2px), linear-gradient(90deg, ${withAlpha(r.acik, 0.06)} 2px, transparent 2px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: `0px ${(f * 0.6) % 72}px`,
        }}
      />
      {symbols.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: s.x, top: s.y, opacity: 0.16, transform: `rotate(${s.rot}deg)`}}>
          <Symbol kind={s.kind} size={s.size} color={s.color} />
        </div>
      ))}
      <AbsoluteFill
        style={{background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${withAlpha(r.koyu, 0.75)} 100%)`}}
      />
    </AbsoluteFill>
  );
};
