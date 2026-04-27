import type { CSSProperties } from 'react';

export interface AnimationStyleSpec {
  animName: string;
  duration: string;
  easing: string;
  iterationCount?: string;
  fillMode?: string;
}

export function toAnimationStyle(spec?: AnimationStyleSpec | null): CSSProperties {
  if (!spec) return {};

  const parts = [
    spec.animName,
    spec.duration,
    spec.easing,
    spec.iterationCount,
    spec.fillMode,
  ].filter(Boolean);
  return { animation: parts.join(' ') };
}
