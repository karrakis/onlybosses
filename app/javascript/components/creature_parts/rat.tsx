import * as React from 'react';
import { PartProps, partClass } from './types';

// ─── Giant Rat ───────────────────────────────────────────────────────────────
// Upright bipedal posture — standing on hind legs so the body occupies the
// same canvas zone as the humanoid torso, sitting in front of wing layers.
//
// Draw order: RatTail → RatLegBack (hind, back one) → RatBody →
//             RatHead → RatLegBack (hind, front one) → RatLegFront×2 (paws)
// Standard viewBox 0 0 160 420.

export function RatTail({ ghost, anchorX = 40, anchorY = 250 }: PartProps & { anchorX?: number; anchorY?: number }) {
  // Tail path authored with root at (20, 250). anchorX/anchorY translate to attachment point.
  // Default anchorX=40 places root at body left-edge (path x=20 + dx=20 → canvas x=40).
  const dx = anchorX - 20;
  const dy = anchorY - 250;
  const t = (x: number, y: number) => `${x + dx},${y + dy}`;

  // Two curvature states: tight (curled) ↔ loose (slightly unfurled)
  const tight = `M ${t(20,250)} C ${t(6,268)} ${t(2,298)} ${t(10,328)} C ${t(18,355)} ${t(38,366)} ${t(54,360)} C ${t(70,354)} ${t(78,332)} ${t(70,310)} C ${t(64,290)} ${t(50,282)} ${t(46,265)}`;
  const loose  = `M ${t(20,250)} C ${t(9,264)} ${t(7,292)} ${t(15,320)} C ${t(23,348)} ${t(42,360)} ${t(57,356)} C ${t(70,350)} ${t(76,330)} ${t(70,312)} C ${t(64,294)} ${t(50,282)} ${t(46,265)}`;

  const anim = (
    <animate attributeName="d"
             values={`${tight};${loose};${tight}`}
             dur="2.4s" repeatCount="indefinite"
             calcMode="spline" keyTimes="0;0.5;1"
             keySplines="0.42,0,0.58,1;0.42,0,0.58,1"/>
  );

  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="#c8963c" strokeLinecap="round">
      <path d={tight} strokeWidth="6">{anim}</path>
      <path d={tight} stroke="#e8b870" strokeWidth="3">{anim}</path>
      <path d={`M ${t(8,288)} C ${t(12,286)} ${t(14,290)} ${t(12,292)}`}  strokeWidth="1" stroke="#a87030"/>
      <path d={`M ${t(12,314)} C ${t(16,312)} ${t(18,316)} ${t(16,318)}`}  strokeWidth="1" stroke="#a87030"/>
      <path d={`M ${t(22,342)} C ${t(26,340)} ${t(28,344)} ${t(26,346)}`}  strokeWidth="1" stroke="#a87030"/>
      <path d={`M ${t(42,360)} C ${t(46,358)} ${t(48,362)} ${t(46,364)}`}  strokeWidth="1" stroke="#a87030"/>
    </g>
  );
}

// Digitigrade standing hind leg.
// cx = hip x, topY = hip y.  Thigh down + slightly out → knee → shin back
// vertical → ankle → metatarsal extends forward (high pre-flip x = screen-left).
export function RatLegBack({ cx, topY, ghost }: { cx: number; topY: number; ghost?: boolean }) {
  const kneeX = cx + 8;   const kneeY = topY + 72;
  const ankleX = cx;      const ankleY = topY + 128;
  const footX = cx + 28;  const footY = topY + 146;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} strokeLinecap="round">
      <path d={`M ${cx},${topY} L ${kneeX},${kneeY}`}       stroke="black" strokeWidth="16"/>
      <path d={`M ${cx},${topY} L ${kneeX},${kneeY}`}       stroke="white" strokeWidth="12"/>
      <path d={`M ${kneeX},${kneeY} L ${ankleX},${ankleY}`} stroke="black" strokeWidth="12"/>
      <path d={`M ${kneeX},${kneeY} L ${ankleX},${ankleY}`} stroke="white" strokeWidth="8"/>
      <path d={`M ${ankleX},${ankleY} L ${footX},${footY}`} stroke="black" strokeWidth="9"/>
      <path d={`M ${ankleX},${ankleY} L ${footX},${footY}`} stroke="white" strokeWidth="5.5"/>
      <path d={`M ${footX},${footY} L ${footX+14},${footY-5}`}  fill="none" stroke="black" strokeWidth="3.5"/>
      <path d={`M ${footX},${footY} L ${footX+14},${footY+3}`}  fill="none" stroke="black" strokeWidth="3"/>
      <path d={`M ${footX},${footY} L ${footX+13},${footY+12}`} fill="none" stroke="black" strokeWidth="2.5"/>
      <circle cx={kneeX}  cy={kneeY}  r="7" fill="white" stroke="black" strokeWidth="2"/>
      <circle cx={ankleX} cy={ankleY} r="5" fill="white" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

// Short stubby paw — T-rex / rearing-rodent pose.
// cx = shoulder x, topY = shoulder y.
export function RatLegFront({ cx, topY, ghost }: { cx: number; topY: number; ghost?: boolean }) {
  const elbowX = cx + 14; const elbowY = topY + 44;
  const pawX   = cx + 18; const pawY   = topY + 76;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} strokeLinecap="round">
      <path d={`M ${cx},${topY} L ${elbowX},${elbowY}`}   stroke="black" strokeWidth="12"/>
      <path d={`M ${cx},${topY} L ${elbowX},${elbowY}`}   stroke="white" strokeWidth="8"/>
      <path d={`M ${elbowX},${elbowY} L ${pawX},${pawY}`} stroke="black" strokeWidth="10"/>
      <path d={`M ${elbowX},${elbowY} L ${pawX},${pawY}`} stroke="white" strokeWidth="6.5"/>
      <ellipse cx={pawX} cy={pawY+12} rx="10" ry="8"
               fill="white" stroke="black" strokeWidth="1.5"/>
      <path d={`M ${pawX+5},${pawY+17} L ${pawX+11},${pawY+23}`} fill="none" stroke="black" strokeWidth="2"/>
      <path d={`M ${pawX},${pawY+20}   L ${pawX+4},${pawY+27}`}  fill="none" stroke="black" strokeWidth="2"/>
      <path d={`M ${pawX-6},${pawY+17} L ${pawX-9},${pawY+23}`}  fill="none" stroke="black" strokeWidth="2"/>
      <circle cx={elbowX} cy={elbowY} r="5.5" fill="white" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

// Upright pear-shaped body — wide belly, narrow shoulders, no separate torso/neck.
export function RatBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 62,82 C 46,90 34,114 30,150 C 26,182 28,222 40,250
               C 50,268 64,278 78,279 C 92,278 106,268 116,250
               C 128,222 130,182 126,150 C 122,114 110,90 94,82 Z"/>
      <path d="M 56,132 C 54,128 57,125 60,128" fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 76,92 C 74,88 77,85 80,88"    fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 96,88 C 94,84 97,81 100,84"   fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 118,148 C 116,144 119,141 122,144" fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 38,242 C 36,238 39,235 42,238" fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 64,268 C 62,264 65,261 68,264" fill="none" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 92,274 C 90,270 93,267 96,270" fill="none" strokeWidth="1" strokeLinecap="round"/>
    </g>
  );
}

// Round rat head at the top of the canvas — two ears, whiskers, buckteeth.
// Cranium centred cx=76 cy=52.  Muzzle protrudes toward high x (→ screen-left = facing dir).
export function RatHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeLinejoin="round">
      {/* Far ear — drawn before cranium so cranium overlaps the base */}
      <ellipse cx="88" cy="25" rx="9"  ry="14"
               fill="#f0c8c8" stroke="black" strokeWidth="1.5"
               transform="rotate(14,88,25)"/>
      <ellipse cx="88" cy="25" rx="6"  ry="10"
               fill="#e89898" stroke="none"
               transform="rotate(14,88,25)"/>
      {/* Near ear — also before cranium */}
      <ellipse cx="62" cy="21" rx="12" ry="18"
               fill="#f0c8c8" stroke="black" strokeWidth="1.5"
               transform="rotate(-10,62,21)"/>
      <ellipse cx="62" cy="21" rx="8"  ry="13"
               fill="#e89898" stroke="none"
               transform="rotate(-10,62,21)"/>
      {/* Cranium */}
      <ellipse cx="76" cy="52" rx="28" ry="30" strokeWidth="2"/>
      {/* Muzzle */}
      <path d="M 86,57 C 96,53 112,55 118,63
               C 124,71 122,81 112,85
               C 102,89 86,87 80,79
               C 74,71 76,59 86,57 Z"
            strokeWidth="2"/>
      {/* Nostril */}
      <ellipse cx="116" cy="67" rx="3" ry="2.5" fill="#f0c0c0" stroke="black" strokeWidth="1"/>
      {/* Eye */}
      <circle cx="62" cy="46" r="7"  fill="black" stroke="none"/>
      <circle cx="60" cy="44" r="2"  fill="white" stroke="none"/>
      {/* Buckteeth */}
      <rect x="102" y="83" width="7"   height="11" rx="1.5" fill="#fffde8" stroke="#888" strokeWidth="1"/>
      <rect x="111" y="83" width="7"   height="11" rx="1.5" fill="#fffde8" stroke="#888" strokeWidth="1"/>
      <line x1="109" y1="83" x2="109" y2="94" stroke="#aaa" strokeWidth="0.8"/>
      {/* Whiskers */}
      <g fill="none" stroke="#666" strokeWidth="0.8" strokeLinecap="round">
        <line x1="108" y1="61" x2="134" y2="55"/>
        <line x1="108" y1="66" x2="136" y2="66"/>
        <line x1="108" y1="71" x2="133" y2="76"/>
        <line x1="106" y1="61" x2="82"  y2="56"/>
        <line x1="106" y1="66" x2="80"  y2="66"/>
        <line x1="106" y1="71" x2="82"  y2="76"/>
      </g>
    </g>
  );
}

// ── Rat chimera overlays — ears and whiskers only, drawn over the other creature's head ──
export function RatEars({ ghost, dy = 0 }: PartProps & { dy?: number }) {
  const e = (cx: number, cy: number) => ({ cx, cy: cy + dy });
  const fe = e(88, 25);
  const ne = e(62, 21);
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <ellipse cx={fe.cx} cy={fe.cy} rx="9"  ry="14"
               fill="#f0c8c8" stroke="black" strokeWidth="1.5"
               transform={`rotate(14,${fe.cx},${fe.cy})`}/>
      <ellipse cx={fe.cx} cy={fe.cy} rx="6"  ry="10"
               fill="#e89898" stroke="none"
               transform={`rotate(14,${fe.cx},${fe.cy})`}/>
      <ellipse cx={ne.cx} cy={ne.cy} rx="12" ry="18"
               fill="#f0c8c8" stroke="black" strokeWidth="1.5"
               transform={`rotate(-10,${ne.cx},${ne.cy})`}/>
      <ellipse cx={ne.cx} cy={ne.cy} rx="8"  ry="13"
               fill="#e89898" stroke="none"
               transform={`rotate(-10,${ne.cx},${ne.cy})`}/>
    </g>
  );
}

export function RatWhiskers({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="#666" strokeWidth="0.8" strokeLinecap="round">
      <line x1="108" y1="61" x2="134" y2="55"/>
      <line x1="108" y1="66" x2="136" y2="66"/>
      <line x1="108" y1="71" x2="133" y2="76"/>
      <line x1="106" y1="61" x2="82"  y2="56"/>
      <line x1="106" y1="66" x2="80"  y2="66"/>
      <line x1="106" y1="71" x2="82"  y2="76"/>
    </g>
  );
}

// ── Rat bone-mode parts ───────────────────────────────────────────────────────

export function RatRibcage() {
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      <line x1="78" y1="82" x2="78" y2="258" strokeWidth="2.5" strokeDasharray="3,4"/>
      <path d="M 78,98  C 88,95  102,101 112,109" strokeWidth="2.5"/>
      <path d="M 78,98  C 68,95  54,101  44,109"  strokeWidth="2.5"/>
      <path d="M 78,112 C 90,105 108,108 116,115" strokeWidth="2"/>
      <path d="M 78,128 C 91,120 112,122 119,130" strokeWidth="2"/>
      <path d="M 78,144 C 91,136 113,138 120,146" strokeWidth="2"/>
      <path d="M 78,160 C 91,152 112,153 119,162" strokeWidth="2"/>
      <path d="M 78,174 C 90,166 109,168 116,177" strokeWidth="2"/>
      <path d="M 116,115 C 119,140 120,158 116,177" strokeWidth="3"/>
      <path d="M 78,112 C 66,105 48,108  40,115" strokeWidth="1.5"/>
      <path d="M 78,128 C 65,120 44,122  37,130" strokeWidth="1.5"/>
      <path d="M 78,144 C 65,136 43,138  36,146" strokeWidth="1.5"/>
      <path d="M 78,160 C 65,152 44,153  37,162" strokeWidth="1.5"/>
      <path d="M 78,174 C 66,166 47,168  40,177" strokeWidth="1.5"/>
    </g>
  );
}

export function RatPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="2">
      <path d="M 52,244 C 48,236 56,228 78,226 C 100,228 108,236 104,244
               L 108,258 C 106,270 98,274 90,270 C 86,278 70,278 66,270
               C 58,274 50,270 48,258 Z"/>
    </g>
  );
}

export function RatSkullHead() {
  return (
    <g data-layer="bone">
      <ellipse cx="88" cy="25" rx="7" ry="12" fill="#333" stroke="#555" strokeWidth="1.5"
               transform="rotate(14,88,25)"/>
      <ellipse cx="62" cy="21" rx="9" ry="14" fill="#333" stroke="#555" strokeWidth="1.5"
               transform="rotate(-10,62,21)"/>
      <ellipse cx="76" cy="52" rx="28" ry="30" fill="#555" stroke="black" strokeWidth="2"/>
      <path d="M 86,57 C 96,53 112,55 118,63 C 124,71 122,81 112,85
               C 102,89 86,87 80,79 C 74,71 76,59 86,57 Z"
            fill="#555" stroke="black" strokeWidth="2"/>
      <ellipse cx="62" cy="46" rx="9"  ry="9" fill="#1a0000" stroke="none"/>
      <ellipse cx="90" cy="54" rx="7"  ry="7" fill="#1a0000" stroke="none"/>
      <ellipse cx="116" cy="67" rx="4" ry="3" fill="#333" stroke="none"/>
      <rect x="102" y="83" width="7"  height="10" rx="1.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="111" y="83" width="7"  height="10" rx="1.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <line x1="109" y1="83" x2="109" y2="93" stroke="#666" strokeWidth="0.8"/>
    </g>
  );
}

export function RatLegBackBone({ cx, topY }: { cx: number; topY: number }) {
  const kneeX = cx + 8;   const kneeY = topY + 72;
  const ankleX = cx;      const ankleY = topY + 128;
  const footX = cx + 28;  const footY = topY + 146;
  return (
    <g data-layer="bone" strokeLinecap="round">
      <path d={`M ${cx},${topY} L ${kneeX},${kneeY}`}       stroke="black" strokeWidth="16"/>
      <path d={`M ${cx},${topY} L ${kneeX},${kneeY}`}       stroke="#666"  strokeWidth="11"/>
      <path d={`M ${kneeX},${kneeY} L ${ankleX},${ankleY}`} stroke="black" strokeWidth="12"/>
      <path d={`M ${kneeX},${kneeY} L ${ankleX},${ankleY}`} stroke="#666"  strokeWidth="8"/>
      <path d={`M ${ankleX},${ankleY} L ${footX},${footY}`} stroke="black" strokeWidth="9"/>
      <path d={`M ${ankleX},${ankleY} L ${footX},${footY}`} stroke="#666"  strokeWidth="5.5"/>
      <path d={`M ${footX},${footY} L ${footX+14},${footY-5}`}  stroke="black" strokeWidth="3.5" strokeLinecap="round"/>
      <path d={`M ${footX},${footY} L ${footX+14},${footY+3}`}  stroke="black" strokeWidth="3"   strokeLinecap="round"/>
      <path d={`M ${footX},${footY} L ${footX+13},${footY+12}`} stroke="black" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={kneeX}  cy={kneeY}  r={8} fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx={ankleX} cy={ankleY} r={6} fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx={cx}     cy={topY}   r={6} fill="#555" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

export function RatLegFrontBone({ cx, topY }: { cx: number; topY: number }) {
  const elbowX = cx + 14; const elbowY = topY + 44;
  const pawX   = cx + 18; const pawY   = topY + 76;
  return (
    <g data-layer="bone" strokeLinecap="round">
      <path d={`M ${cx},${topY} L ${elbowX},${elbowY}`}   stroke="black" strokeWidth="12"/>
      <path d={`M ${cx},${topY} L ${elbowX},${elbowY}`}   stroke="#666"  strokeWidth="8"/>
      <path d={`M ${elbowX},${elbowY} L ${pawX},${pawY}`} stroke="black" strokeWidth="10"/>
      <path d={`M ${elbowX},${elbowY} L ${pawX},${pawY}`} stroke="#666"  strokeWidth="6"/>
      <path d={`M ${pawX+5},${pawY+17} L ${pawX+11},${pawY+23}`} stroke="black" strokeWidth="2" strokeLinecap="round"/>
      <path d={`M ${pawX},${pawY+20}   L ${pawX+4},${pawY+27}`}  stroke="black" strokeWidth="2" strokeLinecap="round"/>
      <path d={`M ${pawX-6},${pawY+17} L ${pawX-9},${pawY+23}`}  stroke="black" strokeWidth="2" strokeLinecap="round"/>
      <circle cx={elbowX} cy={elbowY} r={6}  fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx={cx}     cy={topY}   r={6}  fill="#555" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

