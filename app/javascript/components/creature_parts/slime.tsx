]633;E;header;30c7a7c9-8c3d-493f-9276-242eba80cd54]633;Cimport * as React from 'react';
import { PartProps, partClass, Pt } from './types';

// ─── Giant Slime ─────────────────────────────────────────────────────────────
// Standalone: a tall goopy blob filling the canvas, narrow at the "waist",
// two blobby eyes near the top, capped by a small tendril drip.
// As a chimera overlay: semi-transparent green goop anchored to creature surfaces.

export function SlimeBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Top tendril drip */}
      <path className="slime-drip-b"
            d="M 74,60 C 71,50 72,38 78,34 C 84,38 85,50 82,60 Z"
            fill="#1e6010" stroke="none"/>
      {/* Main blob — head lump → waist → pooling base */}
      <path className="slime-blob"
            d="M 8,415
               C 4,390 2,362 6,338
               C 10,312 4,292 14,278
               C 22,264 18,250 28,242
               C 36,234 40,220 46,208
               C 52,196 54,184 56,174
               C 58,162 56,148 58,136
               C 60,122 56,104 60,90
               C 64,76  70,62  78,60
               C 86,62  92,76  96,90
               C 100,104 96,122 98,136
               C 100,148 98,162 100,174
               C 102,184 104,196 110,208
               C 116,220 120,234 128,242
               C 138,250 134,264 142,278
               C 152,292 146,312 150,338
               C 154,362 152,390 152,415 Z"
            fill="#2d8a1e" stroke="#1a4a10" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Head highlight */}
      <path d="M 67,72 C 63,64 66,58 78,58 C 90,58 93,64 89,72 C 84,68 72,68 67,72 Z"
            fill="#5ab830" opacity="0.45"/>
      {/* Body highlight on the lit (back / high-x) side */}
      <path d="M 16,335 C 12,308 18,280 34,266
               C 46,256 60,260 66,278
               C 72,298 62,326 48,342
               C 34,358 20,362 16,335 Z"
            fill="#4ab830" opacity="0.32"/>
      {/* Eyes */}
      <ellipse cx="64"  cy="93" rx="8"  ry="10" fill="#0a2008" stroke="#1a4a10" strokeWidth="1.5"/>
      <ellipse cx="94"  cy="91" rx="10" ry="12" fill="#0a2008" stroke="#1a4a10" strokeWidth="1.5"/>
      <circle  cx="67"  cy="88" r="3"   fill="#66ff44" opacity="0.65"/>
      <circle  cx="98"  cy="86" r="3.5" fill="#66ff44" opacity="0.65"/>
    </g>
  );
}

// ── Slime chimera silhouette builder ─────────────────────────────────────────
// Given a convex-ish polygon of key body waypoints (pre-flip coords), this
// expands each point outward from the centroid, then weaves it into a closed
// cubic-spline matching the pure SlimeBody's organic edge style.
//
// Two expansion radii (pad, loosePad) produce the tight/loose states for SMIL.
// A fixed per-point "wobble" seed adds controlled irregularity so each edge
// segment has a slightly different curvature depth — no two sides look the same.


export function centroid(pts: Pt[]): Pt {
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  return [sx / pts.length, sy / pts.length];
}

export function expandPt([px, py]: Pt, [cx, cy]: Pt, pad: number, seed: number): Pt {
  const dx = px - cx, dy = py - cy;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  // seed drives ±20% variation in pad so adjacent points get different offsets
  const actual = pad * (1 + 0.20 * Math.sin(seed * 2.399));
  return [px + dx/len * actual, py + dy/len * actual];
}

export function slimeSilhouette(pts: Pt[], pad: number): string {
  const c = centroid(pts);
  const expanded = pts.map((p, i) => expandPt(p, c, pad, i));
  const n = expanded.length;
  // Build a closed cubic spline: each segment uses neighboring midpoints as
  // smooth 1/3-tension handles, matching the SlimeBody M…C…Z pattern.
  const segs: string[] = [];
  segs.push(`M ${expanded[0][0].toFixed(1)},${expanded[0][1].toFixed(1)}`);
  for (let i = 0; i < n; i++) {
    const p0 = expanded[i];
    const p1 = expanded[(i + 1) % n];
    // Control handles: pull 1/3 from the endpoint toward a lateral tangent,
    // seeded so each segment has unique curvature depth.
    const seed0 = i * 1.618 + 0.5;
    const seed1 = (i + 1) * 1.618 + 0.5;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const tension = 0.30 + 0.14 * Math.sin(seed0);
    const wobble0 = 8 * Math.sin(seed0 * 2.1);
    const wobble1 = 8 * Math.sin(seed1 * 2.1);
    const c1x = p0[0] + dx * tension - dy * tension + wobble0;
    const c1y = p0[1] + dy * tension + dx * tension + wobble0 * 0.5;
    const c2x = p1[0] - dx * tension + dy * tension + wobble1;
    const c2y = p1[1] - dy * tension - dx * tension + wobble1 * 0.5;
    segs.push(`C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`);
  }
  segs.push('Z');
  return segs.join(' ');
}

// Highlight blob: a smaller ellipse on the high-x (lit) side of the silhouette,
// grown from just the topmost high-x points of the polygon.
export function slimeHighlight(pts: Pt[], pad: number): string {
  const c = centroid(pts);
  // Take the 2-3 points closest to the top-right (high x, low y corner)
  const sorted = [...pts].sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]));
  const hpts = sorted.slice(0, Math.max(2, Math.floor(pts.length * 0.4)));
  const hc = centroid(hpts);
  // Build a small ellipse: semi-axes proportional to the highlight cluster spread
  const spread = hpts.reduce((mx, p) => {
    const d = Math.sqrt((p[0]-hc[0])**2 + (p[1]-hc[1])**2);
    return Math.max(mx, d);
  }, 0) + pad * 0.4;
  const rx = spread * 0.9, ry = spread * 0.65;
  // Offset toward the high-x side
  const ox = hc[0] + 6, oy = hc[1] - 4;
  return `M ${(ox+rx).toFixed(1)},${oy.toFixed(1)} C ${(ox+rx).toFixed(1)},${(oy-ry).toFixed(1)} ${(ox-rx).toFixed(1)},${(oy-ry).toFixed(1)} ${(ox-rx).toFixed(1)},${oy.toFixed(1)} C ${(ox-rx).toFixed(1)},${(oy+ry).toFixed(1)} ${(ox+rx).toFixed(1)},${(oy+ry).toFixed(1)} ${(ox+rx).toFixed(1)},${oy.toFixed(1)} Z`;
}

export function SlimeGoop({ pts, pad = 18 }: { pts: Pt[]; pad?: number }) {
  const loosePad = pad + 8;
  const tightPath = slimeSilhouette(pts, pad);
  const loosePath = slimeSilhouette(pts, loosePad);
  const hiTight   = slimeHighlight(pts, pad);
  const hiLoose   = slimeHighlight(pts, loosePad);
  const DUR = '3.4s';
  const KS  = '0.42,0,0.58,1;0.42,0,0.58,1';
  const anim = (t: string, l: string, begin = '0s') => (
    <animate attributeName="d" values={`${t};${l};${t}`}
             dur={DUR} begin={begin} repeatCount="indefinite"
             calcMode="spline" keyTimes="0;0.5;1" keySplines={KS}/>
  );
  return (
    <g data-layer="ethereal">
      {/* dark rim — gives depth to the edge */}
      <path d={tightPath} fill="none" stroke="#1a4a10" strokeWidth="3.5"
            strokeLinejoin="round" opacity="0.55">
        {anim(tightPath, loosePath)}
      </path>
      {/* main blob body */}
      <path d={tightPath} fill="#2d8a1e" stroke="none" opacity="0.52">
        {anim(tightPath, loosePath)}
      </path>
      {/* inner body: slightly smaller, lighter green — gives the rounded 3-D look */}
      <path d={slimeSilhouette(pts, pad - 6)} fill="#3da822" stroke="none" opacity="0.30">
        {anim(slimeSilhouette(pts, pad-6), slimeSilhouette(pts, loosePad-6), '0.4s')}
      </path>
      {/* refraction highlight */}
      <path d={hiTight} fill="#6ef030" stroke="none" opacity="0.38">
        {anim(hiTight, hiLoose, '0.8s')}
      </path>
    </g>
  );
}

