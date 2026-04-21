import * as React from 'react';
import { PartProps, partClass } from './types';

// ─── Giant Spider ────────────────────────────────────────────────────────────
// All parts authored directly in the standard 160×420 compositor space.
// Coordinates are the result of baking the old SPIDER_T = translate(-14,-64) scale(1.2,1.2)
// into the path data so the visual output is identical but the special viewBox and
// inner-transform wrapper are no longer needed.

export function SpiderLegs({ ghost }: { ghost?: boolean }) {
  // [rx, ry, kx, ky, tx, ty, amp(deg), dur(s), begin(s)]
  // Each leg pivots around its root (rx,ry). Knee joints move with the leg.
  // Right legs (high x in compositor = screen-left, facing side):
  //   pairs 0-3 are the 4 right legs, top to bottom
  // Left legs (low x in compositor = screen-right):
  //   pairs 4-7 are the 4 left legs, top to bottom
  const legs = [
    [106, 126, 173,  70, 226,  10,  2.5, 1.8, 0.00],
    [111, 150, 183, 126, 207,  87,  2.0, 2.1, 0.35],
    [113, 186, 180, 210, 203, 243,  2.5, 1.7, 0.70],
    [105, 236, 170, 274, 192, 303,  2.0, 2.3, 1.05],
    [ 53, 126, -14,  70, -67,  10, -2.5, 1.9, 0.18],
    [ 48, 150, -24, 126, -48,  87, -2.0, 2.0, 0.52],
    [ 46, 186, -21, 210, -44, 243, -2.5, 1.6, 0.87],
    [ 54, 236, -10, 274, -33, 303, -2.0, 2.2, 0.22],
  ];
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g fill="none" strokeLinecap="round">
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
  // Cephalothorax ellipse centered at (80,78), abdomen tear-drop from y=92 to y=290.
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <ellipse cx="80" cy="78" rx="25" ry="24"/>
      <path d="M 80,92 C 130,94 114,286 80,290 C 45,286 29,94 80,92 Z"/>
    </g>
  );
}

// Fine single-pixel hairs distributed around the body and head perimeter.
export function SpiderHairs({ ghost }: { ghost?: boolean }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeWidth="1" strokeLinecap="round">
      {/* Head */}
      <line x1="80"  y1="54"  x2="80"  y2="45"  />
      <line x1="98"  y1="60"  x2="102" y2="52"  />
      <line x1="62"  y1="60"  x2="57"  y2="52"  />
      <line x1="105" y1="78"  x2="113" y2="75"  />
      <line x1="54"  y1="78"  x2="46"  y2="75"  />
      {/* Body top */}
      <line x1="80"  y1="92"  x2="80"  y2="84"  />
      <line x1="94"  y1="93"  x2="98"  y2="85"  />
      <line x1="65"  y1="93"  x2="62"  y2="85"  />
      {/* Body right side */}
      <line x1="130" y1="110" x2="137" y2="108" />
      <line x1="131" y1="130" x2="140" y2="128" />
      <line x1="132" y1="152" x2="141" y2="150" />
      <line x1="134" y1="174" x2="142" y2="171" />
      <line x1="132" y1="194" x2="141" y2="192" />
      <line x1="130" y1="214" x2="138" y2="212" />
      <line x1="125" y1="236" x2="132" y2="234" />
      <line x1="117" y1="254" x2="124" y2="252" />
      <line x1="106" y1="270" x2="112" y2="267" />
      {/* Body left side */}
      <line x1="29"  y1="110" x2="22"  y2="108" />
      <line x1="28"  y1="130" x2="20"  y2="128" />
      <line x1="27"  y1="152" x2="18"  y2="150" />
      <line x1="26"  y1="174" x2="17"  y2="171" />
      <line x1="27"  y1="194" x2="18"  y2="192" />
      <line x1="29"  y1="214" x2="21"  y2="212" />
      <line x1="34"  y1="236" x2="26"  y2="234" />
      <line x1="42"  y1="254" x2="34"  y2="252" />
      <line x1="53"  y1="270" x2="46"  y2="267" />
      {/* Body bottom */}
      <line x1="80"  y1="290" x2="80"  y2="298" />
      <line x1="93"  y1="288" x2="96"  y2="295" />
      <line x1="66"  y1="288" x2="63"  y2="295" />
    </g>
  );
}

// 8 eyes arranged in two arcs on the cephalothorax — top arc + bottom arc.
export function SpiderEyes({ ghost }: { ghost?: boolean }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <circle cx="64" cy="70" r="3" fill="black" stroke="none"/>
      <circle cx="74" cy="66" r="3" fill="black" stroke="none"/>
      <circle cx="86" cy="66" r="3" fill="black" stroke="none"/>
      <circle cx="95" cy="70" r="3" fill="black" stroke="none"/>
      <circle cx="65" cy="84" r="3" fill="black" stroke="none"/>
      <circle cx="75" cy="80" r="3" fill="black" stroke="none"/>
      <circle cx="84" cy="80" r="3" fill="black" stroke="none"/>
      <circle cx="94" cy="84" r="3" fill="black" stroke="none"/>
    </g>
  );
}

// ─── Spider × Bone mode extra parts ──────────────────────────────────────────
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
