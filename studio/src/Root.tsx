import React from 'react';
import {CalculateMetadataFunction, Composition, Still} from 'remotion';
import {Cover} from './Cover';
import './fonts';
import {Reel} from './Reel';
import type {ReelProps} from './types';
import {ornek} from './ornek';

const FPS = 30;

const calc: CalculateMetadataFunction<ReelProps> = ({props}) => ({
  durationInFrames: Math.max(30, Math.ceil((props.sure + 0.4) * FPS)),
});

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel"
      component={Reel}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
      defaultProps={ornek}
      calculateMetadata={calc}
    />
    <Still id="Cover" component={Cover} width={1080} height={1920} defaultProps={ornek} />
  </>
);
