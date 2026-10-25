import type {CSSProperties} from 'react';

/** Kalın kontur efekti (her tarayıcıda çalışan text-shadow yöntemi). */
export const outline = (color: string, w = 5, drop = 10): CSSProperties => {
  const shadows: string[] = [];
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    shadows.push(`${(Math.cos(a) * w).toFixed(1)}px ${(Math.sin(a) * w).toFixed(1)}px 0 ${color}`);
  }
  shadows.push(`0 ${drop}px 0 ${color}`);
  return {textShadow: shadows.join(',')};
};

export const upper = (s: string) => s.toLocaleUpperCase('tr-TR');

/** Uzun yazılarda font boyutunu küçült. */
export const fitSize = (text: string, max: number, widthPx: number, ratio = 0.56) => {
  const longestLine = Math.max(...text.split('\n').map((l) => l.length), 1);
  return Math.min(max, Math.floor(widthPx / (longestLine * ratio)));
};

/** "*vurgulu* metin" -> parçalar */
export const splitStars = (s: string) => {
  const parts = s.split('*');
  return parts.map((p, i) => ({text: p, vurgu: i % 2 === 1})).filter((p) => p.text.length > 0);
};

export const withAlpha = (hex: string, alpha: number) => {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
};
