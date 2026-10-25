import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Background} from './components/Background';
import {Captions} from './components/Captions';
import {Cards} from './components/Cards';
import {Header} from './components/Header';
import type {ReelProps} from './types';

export const Reel: React.FC<ReelProps> = (p) => {
  const r = p.marka.renkler;
  return (
    <AbsoluteFill style={{backgroundColor: r.koyu}}>
      <Background r={r} />
      <Cards kartlar={p.kartlar} marka={p.marka} />
      <Header marka={p.marka} baslik={p.baslik} />
      <Captions kelimeler={p.kelimeler} sayfalar={p.sayfalar} r={r} />
      {p.ses && <Audio src={staticFile(p.ses)} />}
      {p.marka.muzik && <Audio src={staticFile(p.marka.muzik)} volume={p.marka.muzikSeviyesi} loop />}
    </AbsoluteFill>
  );
};
