import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT_STACK} from '../fonts';
import type {Kelime, Renkler, Sayfa} from '../types';
import {outline, upper} from './util';

/** Altta, sesle birlikte kelime kelime beliren altyazı. */
export const Captions: React.FC<{kelimeler: Kelime[]; sayfalar: Sayfa[]; r: Renkler}> = ({
  kelimeler,
  sayfalar,
  r,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const page = sayfalar.find((p) => t >= p.s && t < p.e);
  if (!page) return null;
  const words = kelimeler.slice(page.a, page.b);
  const chars = words.reduce((n, w) => n + w.t.length + 1, 0);
  const size = chars > 16 ? 80 : 90;
  // Aynı anda yalnızca o an söylenen kelime parlar
  let activeIdx = -1;
  words.forEach((w, i) => {
    if (t >= w.s - 0.03) activeIdx = i;
  });
  if (activeIdx >= 0 && t > words[activeIdx].e + 0.25) activeIdx = -1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 1330,
        left: 70,
        right: 70,
        height: 240,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
        justifyContent: 'center',
        columnGap: 18,
        rowGap: 0,
        fontFamily: FONT_STACK,
      }}
    >
      {words.map((w, i) => {
        const startF = Math.round(w.s * fps);
        const visible = frame >= startF - 1;
        const pop = spring({frame: frame - startF + 1, fps, config: {damping: 11, stiffness: 260, mass: 0.5}});
        const active = i === activeIdx;
        const tilt = w.v ? (page.a + i) % 2 === 0 ? -4 : 4 : 0;
        return (
          <span
            key={page.a + i}
            style={{
              position: 'relative',
              display: 'inline-block',
              fontWeight: 800,
              fontSize: w.v ? size * 1.14 : size,
              lineHeight: 1.12,
              color: w.v ? r.vurgu : r.acik,
              opacity: visible ? 1 : 0,
              transform: `scale(${visible ? 0.55 + 0.45 * pop : 0.55}) rotate(${tilt * pop}deg) translateY(${active ? -6 : 0}px)`,
              padding: '6px 10px 0',
              ...outline(r.koyu, 6, 9),
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  inset: '6px -4px 4px',
                  background: r.ana,
                  borderRadius: 16,
                  zIndex: -1,
                  boxShadow: `0 7px 0 ${r.koyu}`,
                }}
              />
            )}
            {upper(w.t)}
          </span>
        );
      })}
    </div>
  );
};
