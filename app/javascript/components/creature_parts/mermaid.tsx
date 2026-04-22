import * as React from 'react';
import { PartProps, partClass, SpiderLimbAnchor, LegAnchor, Pt, HeadPt, CrackSeg } from './types';

// ─── ════════════════════ MERMAID PARTS ═════════════════════════ ─────────────
// Mermaid: humanoid upper body (torso, arms, head) with a fish tail replacing
// the legs from the hip down.
//
// Canvas: 160×420 base with viewBox "-30 0 220 460" (wider and taller than base
// to accommodate the swept caudal fin).
//
// Coordinate anchor landmarks (pre-flip, right-facing):
//   Hip back:  cx=90  y=260   — tail merges here (same as humanoid legs)
//   Hip front: cx=66  y=260   — tail merges here
//   Peduncle:  ~cx=78 y=370   — narrowest point before fin
//   Fin tips:  y≈430–450      — caudal lobes extend into expanded viewBox
//
// MermaidTail is analogous to HorseBarrel — it renders in the §4 main body
// slot, hangs below the humanoid torso, and has no discrete leg slots.
// Thus LEG_ANCHORS is empty for the mermaid body plan.
//
// MermaidShellBra renders as a flesh overlay in §5 (after torso, before head),
// analogous to HarpyTeeth.

// ── Mermaid fish tail ─────────────────────────────────────────────────────────
// Merges with the humanoid hip band at y=258–260. The body swells into a
// muscular fish trunk, narrows to a peduncle, then spreads into a wide
// bifurcated caudal fin reaching y≈440.
// Colors: deep teal body (#1e6e5a), mid blue-green scales (#22897a),
//         lighter highlight (#3db89a), fin (#0d5c8a / #1478b0).
export function MermaidTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>

      {/* ── Far caudal fin lobe (back, behind near lobe) ── */}
      {/* Sweeps upper-right from peduncle, partially behind near lobe */}
      <path d="M 94,372 C 106,358 124,344 142,330 C 156,320 168,316 172,308
               C 160,318 150,336 144,352 C 138,366 130,380 120,392
               L 104,390 Z"
            fill="#0d5c8a" stroke="#09406a" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* ── Near caudal fin lobe (front, overlaps far lobe) ── */}
      {/* Sweeps lower-right from peduncle, outermost fin */}
      <path d="M 98,388 C 110,394 128,398 148,392 C 164,386 174,374 176,362
               C 164,372 150,386 134,396 C 120,402 106,402 96,396
               L 96,390 Z"
            fill="#1478b0" stroke="#09406a" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* ── Tail body — main fish trunk ── */}
      {/* Top edge follows the humanoid hip band (y≈258), sides taper to peduncle ~y=374 */}
      <path d="
        M 52,258 C 48,264 46,274 48,290
        C 50,308 58,330 66,352
        C 72,368 76,376 78,384
        C 80,376 82,368 88,352
        C 98,328 108,304 112,284
        C 114,270 112,260 108,258
        Z"
            fill="#1e6e5a" stroke="#0f4035" strokeWidth="1.8" strokeLinejoin="round"/>

      {/* ── Lateral flank highlight — inner body shading ── */}
      <path d="M 68,268 C 66,284 68,308 72,332 C 76,350 78,366 78,378
               C 80,366 84,346 88,326 C 92,306 96,282 94,264"
            fill="none" stroke="#3db89a" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>

      {/* ── Scale row 1 (upper trunk ~y=280) ── */}
      <g fill="none" stroke="#3db89a" strokeWidth="1" strokeLinecap="round" opacity="0.75">
        <path d="M 60,278 C 63,273 70,272 74,276"/>
        <path d="M 74,278 C 77,273 84,272 88,276"/>
        <path d="M 88,278 C 91,273 98,272 102,276"/>
      </g>
      {/* ── Scale row 2 (~y=300) ── */}
      <g fill="none" stroke="#3db89a" strokeWidth="1" strokeLinecap="round" opacity="0.70">
        <path d="M 56,298 C 59,293 66,292 70,296"/>
        <path d="M 70,298 C 73,293 80,292 84,296"/>
        <path d="M 84,298 C 87,293 94,292 98,296"/>
      </g>
      {/* ── Scale row 3 (~y=320) ── */}
      <g fill="none" stroke="#3db89a" strokeWidth="1" strokeLinecap="round" opacity="0.65">
        <path d="M 58,318 C 61,313 68,312 72,316"/>
        <path d="M 72,318 C 75,313 82,312 86,316"/>
        <path d="M 86,318 C 89,313 95,312 98,316"/>
      </g>
      {/* ── Scale row 4 (~y=338) ── */}
      <g fill="none" stroke="#22897a" strokeWidth="0.9" strokeLinecap="round" opacity="0.60">
        <path d="M 62,336 C 65,331 71,330 75,334"/>
        <path d="M 75,336 C 78,331 84,330 88,334"/>
        <path d="M 88,336 C 91,331 96,330 99,334"/>
      </g>
      {/* ── Scale row 5 (~y=356) ── */}
      <g fill="none" stroke="#22897a" strokeWidth="0.9" strokeLinecap="round" opacity="0.55">
        <path d="M 66,354 C 69,349 74,348 77,352"/>
        <path d="M 77,354 C 80,349 85,348 88,352"/>
        <path d="M 88,354 C 91,349 95,348 97,352"/>
      </g>

      {/* ── Fin membrane veins — delicate strokes on both lobes ── */}
      <g fill="none" stroke="#1a96c8" strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
        {/* Far lobe veins */}
        <path d="M 96,376 C 108,360 124,342 140,330"/>
        <path d="M 98,382 C 112,368 128,352 144,342"/>
        <path d="M 100,388 C 116,378 132,366 146,356"/>
        {/* Near lobe veins */}
        <path d="M 100,392 C 116,400 132,404 148,396"/>
        <path d="M 102,396 C 116,406 130,408 148,400"/>
      </g>

    </g>
  );
}

// ── Mermaid shell bra ─────────────────────────────────────────────────────────
// Two clamshell cups in 3/4 view. Far cup (left in pre-flip) is smaller;
// near cup is larger, overlapping slightly. Ridges fan from the base.
// Rendered after the torso in §5 so it sits on top of the torso flesh.
// Colors: pearl white (#f4eddf), warm ridge line (#b8905a).
export function MermaidShellBra({ ghost }: PartProps) {
  // Fan ridge endpoints relative to each cup base
  const farBase  = { cx: 65, cy: 152 };
  const nearBase = { cx: 90, cy: 148 };

  // Far cup — 5 fan ridges
  const farRidges = [
    [farBase.cx - 12, farBase.cy - 8],
    [farBase.cx - 9,  farBase.cy - 12],
    [farBase.cx - 4,  farBase.cy - 14],
    [farBase.cx + 2,  farBase.cy - 13],
    [farBase.cx + 7,  farBase.cy - 9],
  ];
  // Near cup — 5 fan ridges
  const nearRidges = [
    [nearBase.cx - 14, nearBase.cy - 10],
    [nearBase.cx - 10, nearBase.cy - 15],
    [nearBase.cx - 4,  nearBase.cy - 17],
    [nearBase.cx + 3,  nearBase.cy - 16],
    [nearBase.cx + 9,  nearBase.cy - 10],
  ];

  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Far cup shell */}
      <ellipse cx={farBase.cx} cy={farBase.cy} rx="13" ry="10"
               fill="#f4eddf" stroke="#b8905a" strokeWidth="1.2"
               transform={`rotate(-8, ${farBase.cx}, ${farBase.cy})`}/>
      {/* Far cup ridges */}
      {farRidges.map(([x, y], i) => (
        <line key={i} x1={farBase.cx} y1={farBase.cy} x2={x} y2={y}
              stroke="#c4a06a" strokeWidth="0.7" strokeLinecap="round"/>
      ))}

      {/* Near cup shell */}
      <ellipse cx={nearBase.cx} cy={nearBase.cy} rx="16" ry="12"
               fill="#f4eddf" stroke="#b8905a" strokeWidth="1.4"
               transform={`rotate(-5, ${nearBase.cx}, ${nearBase.cy})`}/>
      {/* Near cup ridges */}
      {nearRidges.map(([x, y], i) => (
        <line key={i} x1={nearBase.cx} y1={nearBase.cy} x2={x} y2={y}
              stroke="#c4a06a" strokeWidth="0.8" strokeLinecap="round"/>
      ))}

      {/* Connecting strap between cups */}
      <path d={`M ${farBase.cx + 13},${farBase.cy - 2} C 74,${farBase.cy - 6} 80,${nearBase.cy - 4} ${nearBase.cx - 14},${nearBase.cy - 4}`}
            fill="none" stroke="#b8905a" strokeWidth="1.2" strokeLinecap="round"/>
    </g>
  );
}

// ── Mermaid fish-tail skeleton (bone mode) ────────────────────────────────────
// Fish vertebral anatomy: compressed disc-shaped vertebrae tapering from the
// pelvic junction (y≈262) to the peduncle (y≈372), each carrying short neural
// spines (dorsal) and haemal spines (ventral, caudal half only).
// The caudal skeleton terminates in a fan of hypural bones supporting the
// bifurcated fin, with an elongated urostyle at the apex.
// Authored right-facing; the root <g> mirror (translate(160,0) scale(-1,1))
// flips to left-facing in the display.
export function MermaidTailBone() {
  // Vertebrae: (cx, cy, rx, ry) — disc width halves as the tail tapers
  const verts: [number, number, number, number][] = [
    [80, 265, 16, 5.5],  // pelvic region — widest
    [80, 277, 14, 5.0],
    [79, 289, 13, 4.5],
    [79, 301, 12, 4.5],
    [78, 313, 11, 4.0],
    [78, 325, 10, 4.0],
    [78, 337,  9, 3.5],
    [78, 349,  8, 3.5],
    [78, 361,  7, 3.0],
    [78, 371,  6, 3.0],  // peduncle — narrowest
  ];

  return (
    <g data-layer="bone" strokeLinecap="round" strokeLinejoin="round">

      {/* Vertebral body discs */}
      {verts.map(([cx, cy, rx, ry], i) => (
        <ellipse key={`v${i}`} cx={cx} cy={cy} rx={rx} ry={ry}
                 fill="#555" stroke="black" strokeWidth="1"/>
      ))}

      {/* Neural spines — dorsal, projecting right in pre-flip space */}
      {verts.map(([cx, cy, , ry], i) => {
        const len = Math.max(4, 11 - i * 0.85);
        return (
          <line key={`ns${i}`}
                x1={cx + 4} y1={cy - ry}
                x2={cx + 5} y2={cy - ry - len}
                stroke="#555" strokeWidth="1.2"/>
        );
      })}

      {/* Haemal spines — ventral, absent in first two abdominal vertebrae */}
      {verts.slice(2).map(([cx, cy, , ry], i) => {
        const len = Math.max(4, 9 - i * 0.75);
        return (
          <line key={`hs${i}`}
                x1={cx - 3} y1={cy + ry}
                x2={cx - 4} y2={cy + ry + len}
                stroke="#555" strokeWidth="1.2"/>
        );
      })}

      {/* Urostyle — elongated terminal bone at column tip, apex of caudal skeleton */}
      <line x1={78} y1={372} x2={79} y2={390} stroke="black" strokeWidth="5" strokeLinecap="round"/>
      <line x1={78} y1={372} x2={79} y2={390} stroke="#666"  strokeWidth="3" strokeLinecap="round"/>

      {/* Hypural bones — fan supporting the far (upper-right) caudal lobe */}
      <path d="M 79,380 C 90,366 110,352 128,342" stroke="black" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M 79,380 C 90,366 110,352 128,342" stroke="#666"  strokeWidth="2.0" strokeLinecap="round"/>
      <path d="M 79,382 C 94,372 114,362 136,356" stroke="black" strokeWidth="3.0" strokeLinecap="round"/>
      <path d="M 79,382 C 94,372 114,362 136,356" stroke="#666"  strokeWidth="1.8" strokeLinecap="round"/>

      {/* Hypural bones — fan supporting the near (lower-right) caudal lobe */}
      <path d="M 79,384 C 96,388 118,392 140,388" stroke="black" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M 79,384 C 96,388 118,392 140,388" stroke="#666"  strokeWidth="2.0" strokeLinecap="round"/>
      <path d="M 79,387 C 96,398 118,406 138,402" stroke="black" strokeWidth="3.0" strokeLinecap="round"/>
      <path d="M 79,387 C 96,398 118,406 138,402" stroke="#666"  strokeWidth="1.8" strokeLinecap="round"/>

      {/* Secondary fin rays — lighter, branching detail on both lobes */}
      <path d="M 79,378 C 92,358 112,346 130,336" stroke="#777" strokeWidth="1.0" strokeLinecap="round"/>
      <path d="M 79,383 C 96,378 118,374 142,370" stroke="#777" strokeWidth="1.0" strokeLinecap="round"/>
      <path d="M 79,389 C 96,400 120,410 140,410" stroke="#777" strokeWidth="1.0" strokeLinecap="round"/>

      {/* Vestigial pelvic girdle — Y-shaped remnant at column top */}
      <path d="M 80,262 L 72,272 L 66,286" fill="none" stroke="#666" strokeWidth="2.0"/>
      <path d="M 80,262 L 88,272 L 94,286" fill="none" stroke="#666" strokeWidth="2.0"/>

    </g>
  );
}

// ─── Anchor exports ───────────────────────────────────────────────────────────
// These follow the same pattern as humanoid/rat/snake/goat so chimera dispatch
// in the compositor works without special-casing the mermaid body plan.

// No discrete leg slots — the fish tail replaces both legs as a single unit.
// Leg anchor array is intentionally empty; chimerism that replaces legs (e.g.
// goat hooves on a mermaid) would extend this in the future.
export const MERMAID_LEG_ANCHORS: LegAnchor[] = [];

// Spider chimera limb attachment points along the mermaid's upper body.
// Same layout as HUMANOID_SPIDER_LIMB_ANCHORS (shared torso/shoulder geometry).
export const MERMAID_SPIDER_LIMB_ANCHORS: SpiderLimbAnchor[] = [
  // Back shoulder — limbs fan upward-right (behind body)
  { x: 110, y: 104, knee: { dx:  28, dy: -18 }, tip: { dx:  26, dy: -24 }, layer: 'back',  amp: 3.0, dur: 2.1, phase: 0.0 },
  { x: 110, y: 104, knee: { dx:  32, dy:   8 }, tip: { dx:  28, dy:  16 }, layer: 'back',  amp: 2.5, dur: 1.9, phase: 0.5 },
  // Front shoulder — limbs fan upward-left (in front of body)
  { x:  46, y: 104, knee: { dx: -28, dy: -18 }, tip: { dx: -26, dy: -24 }, layer: 'front', amp: 3.0, dur: 2.3, phase: 0.8 },
  { x:  46, y: 104, knee: { dx: -24, dy:  21 }, tip: { dx: -22, dy:  27 }, layer: 'front', amp: 3.0, dur: 2.3, phase: 0.8 },
  // Back hip (90,262) — limbs fan downward into the tail area
  { x:  90, y: 262, knee: { dx:  34, dy:  52 }, tip: { dx:  18, dy:  64 }, layer: 'back',  amp: 2.5, dur: 2.1, phase: 0.1 },
  { x:  90, y: 262, knee: { dx:  26, dy:  70 }, tip: { dx:  12, dy:  68 }, layer: 'back',  amp: 2.0, dur: 1.8, phase: 0.6 },
  // Front hip (66,262) — limbs fan downward-left out of the tail
  { x:  66, y: 262, knee: { dx: -34, dy:  52 }, tip: { dx: -18, dy:  64 }, layer: 'front', amp: 2.5, dur: 2.3, phase: 0.4 },
  { x:  66, y: 262, knee: { dx: -26, dy:  70 }, tip: { dx: -12, dy:  68 }, layer: 'front', amp: 2.0, dur: 1.9, phase: 0.9 },
];

// Slime goop silhouette: wraps the wider mermaid silhouette (tail included).
export const MERMAID_SLIME_GOOP_PTS: Pt[] = [
  [78,18],[120,46],[130,108],[130,220],[110,320],[90,430],[60,430],[46,320],[26,220],[26,108],[36,46],
];

// Eye anchor centres (SkeletonSkull orbit centres — same as humanoid, shared head geometry).
export const MERMAID_EYE_ANCHORS: HeadPt[] = [{ cx: 91, cy: 40 }, { cx: 63, cy: 40 }];

// Crown anchor: center of the LichCrown base band.
export const MERMAID_CROWN_ANCHOR: HeadPt = { cx: 78, cy: 22 };

// Lich crack segments for mermaid in skeleton/lich mode.
// Upper body identical to humanoid; tail cracks replace the leg segments.
export const MERMAID_CRACK_SEGS: CrackSeg[] = [
  { pts: [[82,18],[79,28],[85,36],[80,48],[77,55]], w: 1.2 },           // skull top
  { pts: [[94,32],[90,42],[96,52],[92,66],[96,74]], w: 1.0 },           // cheek
  { pts: [[85,100],[82,115],[88,130],[83,148],[89,165],[84,183],[88,200],[83,220],[87,240]], w: 1.3 }, // spine
  { pts: [[78,258],[76,278],[80,300],[77,322],[80,344],[77,364],[80,382]], w: 1.2 }, // tail spine
  { pts: [[92,270],[96,292],[100,316],[104,338],[108,356],[118,374],[136,382]], w: 1.0 }, // far flank
  { pts: [[64,268],[60,290],[56,316],[54,340],[58,362],[66,378],[78,386]], w: 1.0 }, // near flank
  { pts: [[114,115],[118,135],[115,155],[119,175],[116,200]], w: 1.0 }, // far rib side
];
