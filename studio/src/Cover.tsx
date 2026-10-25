import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Background} from './components/Background';
import {Handle} from './components/Header';
import {fitSize, outline, splitStars, upper} from './components/util';
import {FONT_STACK} from './fonts';
import type {ReelProps} from './types';

/** Kapak görseli. Önemli her şey ortadaki 3:4 alanda (profil ızgarasında kesilmesin). */
export const Cover: React.FC<ReelProps> = (p) => {
  const r = p.marka.renkler;
  const k = p.kapak ?? {};
  const buyuk = k.buyuk ?? p.baslik.join(' ');
  const size = fitSize(buyuk.replace(/\*/g, ''), 150, 2300, 0.56);
  return (
    <AbsoluteFill style={{fontFamily: FONT_STACK}}>
      <Background r={r} seed="kapak" />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '300px 70px',
          gap: 34,
        }}
      >
        {k.emoji && <div style={{fontSize: 300, lineHeight: 1, transform: 'rotate(-8deg)'}}>{k.emoji}</div>}
        {k.ust && (
          <div
            style={{
              background: r.ana,
              color: r.acik,
              fontWeight: 800,
              fontSize: 58,
              padding: '14px 40px 4px',
              borderRadius: 999,
              border: `6px solid ${r.koyu}`,
              transform: 'rotate(2deg)',
            }}
          >
            {k.ust}
          </div>
        )}
        <div
          style={{
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1.0,
            textAlign: 'center',
            color: r.acik,
            ...outline(r.koyu, 9, 16),
          }}
        >
          {splitStars(upper(buyuk)).map((part, i) => (
            <span key={i} style={{color: part.vurgu ? r.vurgu : r.acik}}>
              {part.text}
            </span>
          ))}
        </div>
        {k.alt && (
          <div style={{fontWeight: 700, fontSize: 52, color: r.acik, ...outline(r.koyu, 4, 6)}}>{k.alt}</div>
        )}
        <div style={{marginTop: 20}}>
          <Handle marka={p.marka} size={40} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
