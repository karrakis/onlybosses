import * as React from 'react';
import { HeadPt } from './types';

// ─── ═══════════════════════ ETHEREAL PARTS ══════════════════════ ────────────

// Crown geometry is authored at center cx=78, base cy=22.
// anchor.cx/cy translates it to match the host head's skull top.
export function LichCrown({ anchor }: { anchor?: HeadPt } = {}) {
  const dx = (anchor?.cx ?? 78) - 78;
  const dy = (anchor?.cy ?? 22) - 22;
  const transform = (dx || dy) ? `translate(${dx},${dy})` : undefined;
  return (
    <g data-layer="ethereal" transform={transform}>
      <path d="M 52,22 L 52,10 L 58,18 L 64,4 L 70,18 L 76,6 L 82,18
               L 88,4 L 94,18 L 100,8 L 104,22 L 104,30 L 52,30 Z"
            fill="#555" stroke="black" strokeWidth="1.5" strokeLinejoin="miter"/>
      <polygon points="78,8 74,16 78,13 82,16" fill="#cc0000" stroke="#ff4444" strokeWidth="0.8"/>
    </g>
  );
}

export function LichEyes({ eyes = [{ cx: 91, cy: 40 }, { cx: 63, cy: 40 }] }: { eyes?: HeadPt[] }) {
  return (
    <g data-layer="ethereal">
      <defs>
        <radialGradient id="cc-eyeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ff4444"/>
          <stop offset="60%"  stopColor="#cc0000"/>
          <stop offset="100%" stopColor="#880000" stopOpacity="0"/>
        </radialGradient>
        <filter id="cc-redBloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {eyes.map(({ cx, cy }, i) => (
        <g key={i}>
          <circle className="eye-glow" cx={cx} cy={cy} r="12" fill="url(#cc-eyeGlow)" stroke="none" filter="url(#cc-redBloom)"/>
          <circle className="eye-orb"  cx={cx} cy={cy} r="7"  fill="#dd2222" stroke="#ff6666" strokeWidth="0.8" filter="url(#cc-redBloom)"/>
        </g>
      ))}
    </g>
  );
}

// ─── Phoenix flames ── rendered on top of all body parts ────────────────────
// Flame paths: base sits on the body contour, tip points toward lower y (up).
export function PhoenixFlames() {
  return (
    <g data-layer="ethereal">
      <defs>
        <linearGradient id="cc-flameGrad" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#ff3300" stopOpacity="0.9"/>
          <stop offset="50%"  stopColor="#ff8800" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#ffee55" stopOpacity="0"/>
        </linearGradient>
        <filter id="cc-smokeBlur"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>

      {/* ── Head crown ── */}
      <path className="flame-b" d="M 73,23 C 71,8 76,-11 78,-17 C 80,-11 85,8 83,23 Z"   fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 62,28 C 60,15 64,-1 66,-7   C 68,-1 72,15 70,28 Z"  fill="url(#cc-flameGrad)"/>
      <path className="flame-c" d="M 86,28 C 84,15 88,-1 90,-7   C 92,-1 96,15 94,28 Z"  fill="url(#cc-flameGrad)"/>

      {/* ── Shoulders ── */}
      <path className="flame-a" d="M 109,88 C 107,78 111,68 114,62 C 117,68 121,78 119,88 Z" fill="url(#cc-flameGrad)"/>
      <path className="flame-c" d="M 103,84 C 101,76 104,70 107,64 C 110,70 113,76 111,84 Z" fill="url(#cc-flameGrad)"/>
      <path className="flame-b" d="M 37,88 C 35,78 39,68 42,62   C 45,68 49,78 47,88 Z"     fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 45,84 C 43,76 46,70 49,64   C 52,70 55,76 53,84 Z"     fill="url(#cc-flameGrad)"/>

      {/* ── Torso sides ── */}
      <path className="flame-b" d="M 117,200 C 115,190 118,178 122,172 C 126,178 129,190 127,200 Z" fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 29,200 C 27,190 30,178 34,172   C 38,178 41,190 39,200 Z"   fill="url(#cc-flameGrad)"/>

      {/* ── Hip / waist ── */}
      <path className="flame-c" d="M 100,270 C 98,262 101,254 104,248 C 107,254 110,262 108,270 Z" fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 48,270 C 46,262 49,254 52,248   C 55,254 58,262 56,270 Z"   fill="url(#cc-flameGrad)"/>

      {/* ── Tail tip ── */}
      <path className="flame-b" d="M 72,400 C 70,387 74,372 78,365   C 82,372 86,387 84,400 Z"    fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 53,395 C 51,383 54,371 58,365   C 62,371 65,383 63,395 Z"    fill="url(#cc-flameGrad)"/>
      <path className="flame-c" d="M 93,395 C 91,383 94,371 98,365   C 102,371 105,383 103,395 Z" fill="url(#cc-flameGrad)"/>
      <path className="flame-c" d="M 36,385 C 34,374 37,366 40,360   C 43,366 46,374 44,385 Z"    fill="url(#cc-flameGrad)"/>
      <path className="flame-a" d="M 112,385 C 110,374 113,366 116,360 C 119,366 122,374 120,385 Z" fill="url(#cc-flameGrad)"/>

      {/* ── Smoke rising above head ── */}
      <circle className="smoke-a" cx="76" cy="-18" r="11" fill="#999" filter="url(#cc-smokeBlur)"/>
      <circle className="smoke-b" cx="84" cy="-22" r="9"  fill="#aaa" filter="url(#cc-smokeBlur)"/>
      <circle className="smoke-c" cx="70" cy="-20" r="8"  fill="#888" filter="url(#cc-smokeBlur)"/>
    </g>
  );
}

