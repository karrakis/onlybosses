import * as React from 'react';
import { PartProps, partClass, Pt } from './types';

// ─── Giant Snake ─────────────────────────────────────────────────────────────
// Cobra-style: coiled lower body (y≈316–420), raised neck tube (y≈76–306),
// hood fans from neck upward and the head forms its upper cap (y≈76–212),
// cobra head (y≈18–76).
//
// Pre-flip coords (right-facing): snout at HIGH x (~113), back of skull LOW x.
// Spider leg attachments fall at standard shoulder anchors (cx=110/46, y=112)
// which sit inside the hood/neck zone — no special-casing needed.
// Standard viewBox 0 0 160 420.

// ── Five coiled loops — backmost layer.  Each loop is a round tube drawn as
// two arc half-strokes.  A solid fill base eliminates any donut-hole gaps.
// Loops A–E: A = innermost/top, E = outermost/bottom. Drawn E→A so inner loops
// paint on top of outer ones. The neck (SnakeBody) renders after and appears
// to drop into the top hole of loop A.
export function SnakeCoil({ ghost }: PartProps) {
  const cx = 78;
  type Loop = { cy: number; rx: number; ry: number; tw: number };
  const loops: Loop[] = [
    { cy: 304, rx: 28, ry:  9, tw: 14 },  // A — innermost / top
    { cy: 318, rx: 38, ry: 12, tw: 18 },  // B
    { cy: 332, rx: 48, ry: 15, tw: 22 },  // C
    { cy: 346, rx: 58, ry: 18, tw: 26 },  // D
    { cy: 360, rx: 68, ry: 20, tw: 30 },  // E — outermost / bottom
  ];
  // sweep=1 from left  → lower/front arc (passes through bottom)
  // sweep=1 from right → upper/back  arc (passes through top)
  const frontArc = (l: Loop) =>
    `M ${cx - l.rx},${l.cy} A ${l.rx},${l.ry} 0 0,1 ${cx + l.rx},${l.cy}`;
  const backArc  = (l: Loop) =>
    `M ${cx + l.rx},${l.cy} A ${l.rx},${l.ry} 0 0,1 ${cx - l.rx},${l.cy}`;

  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} fill="none" strokeLinecap="butt">
      {/* All loops E→A fully interleaved: each inner loop paints on top of
          the outer one, eliminating any back-arc bleed. */}
      {[...loops].reverse().map((l, i) => (
        <React.Fragment key={`loop-${i}`}>
          <path d={backArc(l)}  stroke="black"   strokeWidth={l.tw + 4}/>
          <path d={backArc(l)}  stroke="#1a3810" strokeWidth={l.tw}/>
          <path d={backArc(l)}  stroke="#2d5a1e" strokeWidth={l.tw - 5}/>
          <path d={frontArc(l)} stroke="black"   strokeWidth={l.tw + 4}/>
          <path d={frontArc(l)} stroke="#2d5a1e" strokeWidth={l.tw}/>
          <path d={frontArc(l)} stroke="#4a8c2e" strokeWidth={Math.max(4, l.tw - 8)}/>
          <path d={frontArc(l)} stroke="#c8b85a" strokeWidth={Math.max(2, Math.round(l.tw * 0.30))} opacity="0.65"/>
        </React.Fragment>
      ))}
    </g>
  );
}

// ── Neck tube — rises from coil top (y=306) straight up to head base (y=76).
// The section inside the hood (y=76–212) is covered by SnakeHood above it.
export function SnakeBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Tube outline — ~26px wide */}
      <path d="M 91,76 C 93,150 92,235 91,306 L 65,306 C 64,235 63,150 65,76 Z"
            fill="#2d5a1e" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
      {/* Belly stripe */}
      <path d="M 87,79 C 88,150 87,235 87,306 L 69,306 C 68,235 68,150 69,79 Z"
            fill="#c8b85a" stroke="none" opacity="0.75"/>
      {/* Scale marks on the exposed section below the hood (y≈213–306) */}
      <path d="M 89,220 C 92,216 96,218 94,222" fill="none" stroke="#1e3c14" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 89,238 C 92,234 96,236 94,240" fill="none" stroke="#1e3c14" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 88,256 C 91,252 95,254 93,258" fill="none" stroke="#1e3c14" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 87,274 C 90,270 94,272 92,276" fill="none" stroke="#1e3c14" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 86,292 C 89,288 93,290 91,294" fill="none" stroke="#1e3c14" strokeWidth="1.2" strokeLinecap="round"/>
    </g>
  );
}

// ── Front face of innermost coil loop A — drawn after the neck so it wraps
// visually in front of the neck base where the two meet around y=300.
export function SnakeCoilFront({ ghost }: PartProps) {
  // Loop A: cy=300, rx=28, ry=8, tw=14
  const arc = `M 50,300 A 28,8 0 0,1 106,300`;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} fill="none" strokeLinecap="butt">
      <path d={arc} stroke="black"   strokeWidth={18}/>
      <path d={arc} stroke="#2d5a1e" strokeWidth={14}/>
      <path d={arc} stroke="#4a8c2e" strokeWidth={6}/>
      <path d={arc} stroke="#c8b85a" strokeWidth={4} opacity="0.65"/>
    </g>
  );
}

// ── Cobra hood — fan that STARTS at the head ceiling (y=18) and expands
// downward.  The head is drawn after and forms the natural upper cap of the
// fan; the hood's outer wings peek out beside the head crown above y=76.
export function SnakeHood({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Outer dark silhouette — same top y as head crown */}
      <path d="M 62,18
               C 24,30 8,68 8,106
               C 8,138 26,170 52,190
               C 64,198 72,204 78,206
               C 84,204 92,198 104,190
               C 130,170 148,138 148,106
               C 148,68 132,30 94,18 Z"
            fill="#2d5a1e" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
      {/* Inner front-facing gold/cream surface */}
      <path d="M 68,22
               C 32,34 18,70 18,106
               C 18,136 36,166 60,184
               C 70,193 75,197 78,198
               C 81,197 86,193 96,184
               C 120,166 138,136 138,106
               C 138,70 124,34 88,22 Z"
            fill="#c8a830" stroke="none"/>
      {/* Spectacle markings — in the visible mid-hood zone below the head */}
      <ellipse cx="58" cy="112" rx="14" ry="16" fill="none" stroke="#3a2800" strokeWidth="2.5" opacity="0.82"/>
      <ellipse cx="98" cy="112" rx="14" ry="16" fill="none" stroke="#3a2800" strokeWidth="2.5" opacity="0.82"/>
      <path d="M 72,105 C 73,101 83,101 84,105" fill="none" stroke="#3a2800" strokeWidth="2" opacity="0.82"/>
      <ellipse cx="58" cy="112" rx="10" ry="11" fill="#3a2800" opacity="0.22"/>
      <ellipse cx="98" cy="112" rx="10" ry="11" fill="#3a2800" opacity="0.22"/>
    </g>
  );
}

// ── Cobra head — elongated snout pushed further forward (high x pre-flip).
// Eye at cx=94,cy=44. Hood is drawn before this and peaks out at same ceiling y=18.
export function SnakeHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Head profile — snout tip at x≈124, elongated jaw */}
      <path d="M 124,44
               C 128,34 122,18 106,14
               C 90,10 70,12 56,22
               C 42,30 36,44 40,58
               C 44,70 56,76 74,76
               C 88,76 106,72 116,66
               C 128,60 128,54 124,44 Z"
            fill="#2d5a1e" stroke="black" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Mouth line — jaw crease from snout tip to chin */}
      <path d="M 124,44 C 122,56 114,68 100,72"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Scale ridges on crown */}
      <path d="M 82,12 C 94,10 108,14 116,22" fill="none" stroke="#1e3c14" strokeWidth="2"   strokeLinecap="round"/>
      <path d="M 64,14 C 76,10 90,10 102,14"  fill="none" stroke="#1e3c14" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Eye — amber iris, vertical slit pupil */}
      <circle cx="94" cy="44" r="7" fill="#cc8800" stroke="black" strokeWidth="1.5"/>
      <ellipse cx="94" cy="44" rx="2.5" ry="6" fill="#1a0000"/>
      <circle cx="95.5" cy="41" r="1.2" fill="white" stroke="none"/>
      {/* Nostril slit — shifted forward to match snout */}
      <ellipse cx="120" cy="52" rx="2" ry="3.5" fill="#1a0000"
               stroke="black" strokeWidth="1" transform="rotate(-25,120,52)"/>
      {/* Forked tongue */}
      <path d="M 126,45 L 144,38" stroke="#cc0000" strokeWidth="2"   strokeLinecap="round" fill="none"/>
      <path d="M 144,38 L 152,31" stroke="#cc0000" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M 144,38 L 152,45" stroke="#cc0000" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </g>
  );
}

// ── Snake bone parts ──────────────────────────────────────────────────────────

// Spine + curved ribs. Ribs are wider in the hood zone (representing hood ribs)
// and narrow below. Spine runs full length to coil junction.
export function SnakeRibcage() {
  // [spineY, halfWidth] — wider in hood zone (y≈90–210), narrower below
  const ribs: [number, number][] = [
    [ 90, 15], [104, 22], [118, 30], [132, 36], [146, 38],
    [160, 36], [174, 30], [188, 22], [202, 15],
    [216, 12], [230, 10], [244,  8], [258,  7], [272,  5], [290,  4],
  ];
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      <line x1="78" y1="76" x2="78" y2="306" strokeWidth="2.5" strokeDasharray="3,4"/>
      {ribs.map(([y, hw], i) => (
        <React.Fragment key={i}>
          <path d={`M 78,${y} Q ${78 + hw * 0.6},${y - 4} ${78 + hw},${y + 5}`} strokeWidth="1.8"/>
          <path d={`M 78,${y} Q ${78 - hw * 0.6},${y - 4} ${78 - hw},${y + 5}`} strokeWidth="1.4"/>
        </React.Fragment>
      ))}
    </g>
  );
}

// Elongated cobra skull — matches SnakeHead profile in bone gray, with fang.
export function SnakeSkullHead() {
  return (
    <g data-layer="bone">
      {/* Skull outline */}
      <path d="M 124,44
               C 128,34 122,18 106,14
               C 90,10 70,12 56,22
               C 42,30 36,44 40,58
               C 44,70 56,76 74,76
               C 88,76 106,72 116,66
               C 128,60 128,54 124,44 Z"
            fill="#555" stroke="black" strokeWidth="2"/>
      {/* Jaw / mouth line */}
      <path d="M 124,44 C 122,56 114,68 100,72"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Eye socket */}
      <ellipse cx="94" cy="44" rx="11" ry="10" fill="#1a0000" stroke="none"/>
      {/* Nasal cavity */}
      <ellipse cx="120" cy="52" rx="3" ry="4" fill="#333" stroke="none"
               transform="rotate(-25,120,52)"/>
      {/* Fang — long curved hollow tube */}
      <path d="M 120,52 C 126,58 128,68 123,76"
            fill="none" stroke="#888" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 120,52 C 125,57 126,66 122,74"
            fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Cheekbone ridge */}
      <path d="M 90,26 C 100,22 112,26 118,34"
            fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  );
}

// ─── Slime goop silhouette pts ────────────────────────────────────────────────
export const SNAKE_SLIME_GOOP_PTS: Pt[] = [
  [78,10],[124,44],[148,106],[104,190],[91,306],[118,370],[78,390],[38,370],[22,306],[52,190],[8,106],[40,44],
];

