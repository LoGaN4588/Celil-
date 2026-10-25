import React from 'react';
import {Img, staticFile} from 'remotion';
import {FONT_STACK} from '../fonts';
import type {Marka} from '../types';
import {fitSize, outline, withAlpha} from './util';

export const Logo: React.FC<{marka: Marka; size: number}> = ({marka, size}) => {
  const r = marka.renkler;
  if (marka.logo) {
    return (
      <Img
        src={staticFile(marka.logo)}
        style={{width: size, height: size, objectFit: 'contain', borderRadius: size * 0.22}}
      />
    );
  }
  // Logo gelene kadar geçici rozet
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${r.ana}, ${r.ikinci})`,
        border: `${Math.max(3, size * 0.06)}px solid ${r.acik}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: r.acik,
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize: size * 0.46,
        lineHeight: 1,
        paddingTop: size * 0.06,
        boxSizing: 'border-box',
      }}
    >
      GG
    </div>
  );
};

export const Handle: React.FC<{marka: Marka; size?: number}> = ({marka, size = 34}) => {
  const r = marka.renkler;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 26px 8px 8px',
        borderRadius: 999,
        background: withAlpha(r.koyu, 0.7),
        border: `3px solid ${withAlpha(r.acik, 0.18)}`,
      }}
    >
      <Logo marka={marka} size={size * 1.7} />
      <span style={{fontFamily: FONT_STACK, fontWeight: 700, fontSize: size, color: r.acik, paddingTop: 4}}>
        {marka.kullaniciAdi}
      </span>
    </div>
  );
};

/** Üstte sabit duran 2 satırlık başlık. */
export const Header: React.FC<{marka: Marka; baslik: string[]}> = ({marka, baslik}) => {
  const r = marka.renkler;
  const [l1 = '', l2 = ''] = baslik;
  const s1 = fitSize(l1, 76, 940);
  const s2 = fitSize(l2, 80, 860);
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        fontFamily: FONT_STACK,
      }}
    >
      <Handle marka={marka} size={30} />
      <div
        style={{
          fontWeight: 800,
          fontSize: s1,
          lineHeight: 1.05,
          color: r.acik,
          textAlign: 'center',
          marginTop: 8,
          ...outline(r.koyu, 5, 7),
        }}
      >
        {l1}
      </div>
      {l2 && (
        <div
          style={{
            fontWeight: 800,
            fontSize: s2,
            lineHeight: 1.05,
            color: r.koyu,
            background: r.vurgu,
            padding: '10px 30px 2px',
            borderRadius: 18,
            transform: 'rotate(-2deg)',
            boxShadow: `8px 8px 0 ${r.ana}`,
            textAlign: 'center',
          }}
        >
          {l2}
        </div>
      )}
    </div>
  );
};
