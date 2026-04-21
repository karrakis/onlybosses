]633;E;header;30c7a7c9-8c3d-493f-9276-242eba80cd54]633;Cimport * as React from 'react';
import { PartProps, partClass } from './types';

// ─── Giant Spider ────────────────────────────────────────────────────────────
// All spider parts use a nested inner transform that, combined with the
// compositor's outer translate(160,0) scale(-1,1), reproduces the original
// standalone SVG's translate(174,-64) scale(-1.2,1.2) exactly.
// This lets us copy original-SVG coordinates directly into path data.
export const SPIDER_T = 'translate(-14,-64) scale(1.2,1.2)';

export function SpiderLegs({ ghost }: { ghost?: boolean }) {
  // [rx, ry, kx, ky, tx, ty, amp(deg), dur(s), begin(s)]
  // Each leg pivots around its root (rx,ry). Knee joints are included so they
  // move with the leg rather than staying pinned to the spider body.
  const legs = [
    [100, 158, 156, 112, 200,  62,  2.5, 1.8, 0.00],
    [104, 178, 164, 158, 184, 126,  2.0, 2.1, 0.35],
    [106, 208, 162, 228, 181, 256,  2.5, 1.7, 0.70],
    [ 99, 250, 153, 282, 172, 306,  2.0, 2.3, 1.05],
    [ 56, 158,   0, 112, -44,  62, -2.5, 1.9, 0.18],
    [ 52, 178,  -8, 158, -28, 126, -2.0, 2.0, 0.52],
    [ 50, 208,  -6, 228, -25, 256, -2.5, 1.6, 0.87],
    [ 57, 250,   3, 282, -16, 306, -2.0, 2.2, 0.22],
  ];
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g transform={SPIDER_T} fill="none" strokeLinecap="round">
        {legs.map((leg, i) => {
          const [rx, ry, kx, ky, tx, ty, amp, dur, begin] = leg;
          const vals = `0 ${rx} ${ry}; ${amp} ${rx} ${ry}; 0 ${rx} ${ry}; ${-amp} ${rx} ${ry}; 0 ${rx} ${ry}`;
          return (
            <g key={i}>
              <animateTransform attributeName="transform" type="rotate"
                values={vals} dur={`${dur}s`} begin={`${begin}s`}
                repeatCount="indefinite"/>
              <path d={`M ${rx},${ry} L ${kx},${ky}`} stroke="black" strokeWidth="12"/>
              <path d={`M ${kx},${ky} L ${tx},${ty}`} stroke="black" strokeWidth="8"/>
              <path d={`M ${rx},${ry} L ${kx},${ky}`} stroke="white" strokeWidth="10"/>
              <path d={`M ${kx},${ky} L ${tx},${ty}`} stroke="white" strokeWidth="6"/>
              <circle cx={kx} cy={ky} r={6} fill="black" stroke="none"/>
            </g>
          );
        })}
      </g>
    </g>
  );
}

export function SpiderBody({ ghost }: { ghost?: boolean }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g transform={SPIDER_T} fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
        <ellipse cx="78" cy="118" rx="21" ry="20"/>
        <path d="M 78,130 C 120,132 107,292 78,295 C 49,292 36,132 78,130 Z"/>
      </g>
    </g>
  );
}

// Fine single-pixel hairs distributed around the body and head perimeter.
export function SpiderHairs({ ghost }: { ghost?: boolean }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g transform={SPIDER_T} fill="none" stroke="black" strokeWidth="1" strokeLinecap="round">
        {/* Head */}
        <line x1="78"  y1="98"  x2="78"  y2="91" />
        <line x1="93"  y1="103" x2="97"  y2="97" />
        <line x1="63"  y1="103" x2="59"  y2="97" />
        <line x1="99"  y1="118" x2="106" y2="116"/>
        <line x1="57"  y1="118" x2="50"  y2="116"/>
        {/* Body top */}
        <line x1="78"  y1="130" x2="78"  y2="123"/>
        <line x1="90"  y1="131" x2="93"  y2="124"/>
        <line x1="66"  y1="131" x2="63"  y2="124"/>
        {/* Body right side */}
        <line x1="120" y1="145" x2="126" y2="143"/>
        <line x1="121" y1="162" x2="128" y2="160"/>
        <line x1="122" y1="180" x2="129" y2="178"/>
        <line x1="123" y1="198" x2="130" y2="196"/>
        <line x1="122" y1="215" x2="129" y2="213"/>
        <line x1="120" y1="232" x2="127" y2="230"/>
        <line x1="116" y1="250" x2="122" y2="248"/>
        <line x1="109" y1="265" x2="115" y2="263"/>
        <line x1="100" y1="278" x2="105" y2="276"/>
        {/* Body left side */}
        <line x1="36"  y1="145" x2="30"  y2="143"/>
        <line x1="35"  y1="162" x2="28"  y2="160"/>
        <line x1="34"  y1="180" x2="27"  y2="178"/>
        <line x1="33"  y1="198" x2="26"  y2="196"/>
        <line x1="34"  y1="215" x2="27"  y2="213"/>
        <line x1="36"  y1="232" x2="29"  y2="230"/>
        <line x1="40"  y1="250" x2="33"  y2="248"/>
        <line x1="47"  y1="265" x2="40"  y2="263"/>
        <line x1="56"  y1="278" x2="50"  y2="276"/>
        {/* Body bottom */}
        <line x1="78"  y1="295" x2="78"  y2="302"/>
        <line x1="89"  y1="293" x2="92"  y2="299"/>
        <line x1="67"  y1="293" x2="64"  y2="299"/>
      </g>
    </g>
  );
}

// 8 eyes arranged in two arcs on the head — top arc + bottom arc.
export function SpiderEyes({ ghost }: { ghost?: boolean }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g transform={SPIDER_T}>
        <circle cx="65" cy="112" r="2.5" fill="black" stroke="none"/>
        <circle cx="73" cy="108" r="2.5" fill="black" stroke="none"/>
        <circle cx="83" cy="108" r="2.5" fill="black" stroke="none"/>
        <circle cx="91" cy="112" r="2.5" fill="black" stroke="none"/>
        <circle cx="66" cy="123" r="2.5" fill="black" stroke="none"/>
        <circle cx="74" cy="120" r="2.5" fill="black" stroke="none"/>
        <circle cx="82" cy="120" r="2.5" fill="black" stroke="none"/>
        <circle cx="90" cy="123" r="2.5" fill="black" stroke="none"/>
      </g>
    </g>
  );
}

// ─── Spider × Bone mode extra parts ──────────────────────────────────────────────
// When giant_spider + skeleton/lich: bone mode wins; spider adds extra limbs.

// Two extra arm pairs splaying out from the shoulders at 45° / 30° angles.
// Each pair pivots around the shoulder point with an independent animation.
export function SpiderBonusArms() {
  // Each entry: [shoulderX, shoulderY, elbowX, elbowY, handX, handY, amp, dur, begin]
  const arms = [
    // Back-side extras (behind body): upper-back shoulder, mid-back shoulder
    [110, 104,  136, 68,  158,  32,  3.5, 2.2, 0.0],
    [110, 104,  140,125,  162, 152,  3.0, 1.9, 0.5],
    // Front-side extras (in front of body)
    [ 46, 104,   20, 68,   -2,  32, -3.5, 2.0, 0.3],
    [ 46, 104,   22,125,    0, 152, -3.0, 2.3, 0.8],
  ];
  return (
    <g data-layer="bone">
      {arms.map((a, i) => {
        const [sx, sy, ex, ey, hx, hy, amp, dur, begin] = a;
        const vals = `0 ${sx} ${sy}; ${amp} ${sx} ${sy}; 0 ${sx} ${sy}; ${-amp} ${sx} ${sy}; 0 ${sx} ${sy}`;
        return (
          <g key={i}>
            <animateTransform attributeName="transform" type="rotate"
              values={vals} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite"/>
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="black" strokeWidth="9" strokeLinecap="round"/>
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#666" strokeWidth="5.5" strokeLinecap="round"/>
            <line x1={ex} y1={ey} x2={hx} y2={hy} stroke="black" strokeWidth="7" strokeLinecap="round"/>
            <line x1={ex} y1={ey} x2={hx} y2={hy} stroke="#666" strokeWidth="4" strokeLinecap="round"/>
            <circle cx={ex} cy={ey} r={5.5} fill="#555" stroke="black" strokeWidth="1.5"/>
          </g>
        );
      })}
    </g>
  );
}

// Two extra leg pairs branching from the hip area at diagonal angles.
export function SpiderBonusLegs() {
  const legs = [
    // Rear pair, back
    [90, 262,  124, 314,  142, 378,  2.5, 2.1, 0.1],
    [90, 262,  116, 332,  128, 400,  2.0, 1.8, 0.6],
    // Front pair, front
    [66, 262,   32, 314,   14, 378, -2.5, 2.3, 0.4],
    [66, 262,   40, 332,   28, 400, -2.0, 1.9, 0.9],
  ];
  return (
    <g data-layer="bone">
      {legs.map((l, i) => {
        const [rx, ry, kx, ky, fx, fy, amp, dur, begin] = l;
        const vals = `0 ${rx} ${ry}; ${amp} ${rx} ${ry}; 0 ${rx} ${ry}; ${-amp} ${rx} ${ry}; 0 ${rx} ${ry}`;
        return (
          <g key={i}>
            <animateTransform attributeName="transform" type="rotate"
              values={vals} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite"/>
            <line x1={rx} y1={ry} x2={kx} y2={ky} stroke="black" strokeWidth="11" strokeLinecap="round"/>
            <line x1={rx} y1={ry} x2={kx} y2={ky} stroke="#666" strokeWidth="7" strokeLinecap="round"/>
            <line x1={kx} y1={ky} x2={fx} y2={fy} stroke="black" strokeWidth="9" strokeLinecap="round"/>
            <line x1={kx} y1={ky} x2={fx} y2={fy} stroke="#666" strokeWidth="5.5" strokeLinecap="round"/>
            <circle cx={kx} cy={ky} r={6} fill="#555" stroke="black" strokeWidth="1.5"/>
          </g>
        );
      })}
    </g>
  );
}

// Six small spider eyes clustered around the two skull eye sockets.
// Drawn on the bone layer so they're always visible (even through ghost).
export function SpiderBoneEyes() {
  // Right socket centred ~(91,40), left socket ~(63,40) in compositor space.
  const eyes = [
    // Right cluster
    { cx: 101, cy: 33 }, { cx: 103, cy: 46 }, { cx: 95, cy: 53 },
    // Left cluster
    { cx:  53, cy: 33 }, { cx:  51, cy: 46 }, { cx:  59, cy: 53 },
  ];
  return (
    <g data-layer="bone">
      {eyes.map((e, i) => (
        <circle key={i} cx={e.cx} cy={e.cy} r="3" fill="#1a0000" stroke="black" strokeWidth="1"/>
      ))}
    </g>
  );
}

