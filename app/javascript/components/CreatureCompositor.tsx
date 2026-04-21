/**
 * CreatureCompositor
 *
 * Assembles a creature SVG inline from discrete part components, driven entirely
 * by the keyword set selected in the playground.
 *
 * ── Coordinate system ──────────────────────────────────────────────────────
 * All parts share a 160 × 420 canvas (same as humanoid.svg).
 * The root <g> carries `transform="translate(160,0) scale(-1,1)"` so geometry
 * is authored facing right and the mirror makes the creature face left.
 *
 * ── Part tagging ───────────────────────────────────────────────────────────
 * Every part <g> carries a `data-layer` attribute which is one of:
 *   "flesh"   – organic body (affected by ghost fade)
 *   "bone"    – skeletal (NOT affected by ghost fade; always visible)
 *   "ethereal"– overlay effects (crown, glow halos)
 *   "wing"    – wing layer (sits behind body)
 *
 * Effects scan the `data-layer` to decide what to animate.
 *
 * ── Anchor points ──────────────────────────────────────────────────────────
 * Key geometry, in pre-flip (right-facing) coords:
 *   Head base:          cx=78  y=76   (bottom of neck)
 *   Shoulder back:      cx=110 y=112
 *   Shoulder front:     cx=46  y=112
 *   Hip back:           cx=90  y=260
 *   Hip front:          cx=66  y=260
 *   Horse barrel top:   x=90  y=150  (front-top, connects to hip area)
 *   Horse hip back:     cx=32  y=220  (rear horse hips)
 *   Horse hip front:    cx=70  y=220  (front horse hips)
 *   Tail root:          cx=14  y=175  (rear of horse barrel)
 */

import * as React from 'react';

// ─── CSS injected once ────────────────────────────────────────────────────────

const COMPOSITOR_CSS = `
@keyframes ghost-fade {
  0%,100% { opacity: 1; }
  40%     { opacity: 0.15; }
  60%     { opacity: 0.15; }
}
@keyframes eye-pulse {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.4; }
}
@keyframes eye-grow {
  0%,100% { r: 7; }
  50%     { r: 9.5; }
}
.ghost-flesh { animation: ghost-fade 3s ease-in-out infinite; }
.eye-orb     { animation: eye-grow  2.2s ease-in-out infinite; }
.eye-glow    { animation: eye-pulse 2.2s ease-in-out infinite; }
@keyframes phoenix-glow {
  0%,100% { filter: drop-shadow(0 0 4px #ff5500) drop-shadow(0 0 10px #cc2200); }
  50%     { filter: drop-shadow(0 0 15px #ff8800) drop-shadow(0 0 30px #ff3300); }
}
.phoenix-on-fire { animation: phoenix-glow 1.8s ease-in-out infinite; }
@keyframes flame-a {
  0%,100% { transform: translateY(0)    rotate(-3deg); opacity: 0.9; }
  50%     { transform: translateY(-6px) rotate( 4deg); opacity: 0.7; }
}
@keyframes flame-b {
  0%,100% { transform: translateY(0)    rotate( 4deg); opacity: 0.85; }
  50%     { transform: translateY(-9px) rotate(-4deg); opacity: 0.65; }
}
@keyframes flame-c {
  0%,100% { transform: translateY(0)    rotate(-5deg); opacity: 0.8; }
  50%     { transform: translateY(-5px) rotate( 6deg); opacity: 0.9; }
}
.flame-a { animation: flame-a 0.45s ease-in-out infinite;        transform-box: fill-box; transform-origin: bottom center; }
.flame-b { animation: flame-b 0.65s ease-in-out 0.15s infinite;  transform-box: fill-box; transform-origin: bottom center; }
.flame-c { animation: flame-c 0.55s ease-in-out 0.30s infinite;  transform-box: fill-box; transform-origin: bottom center; }
@keyframes smoke-rise {
  0%   { transform: translateY(0);     opacity: 0.28; }
  100% { transform: translateY(-80px); opacity: 0;    }
}
.smoke-a { animation: smoke-rise 2.5s ease-out infinite; }
.smoke-b { animation: smoke-rise 2.5s ease-out 0.83s infinite; }
.smoke-c { animation: smoke-rise 2.5s ease-out 1.67s infinite; }
@keyframes slime-wobble {
  0%,100% { transform: scaleY(1)    scaleX(1); }
  33%     { transform: scaleY(1.02) scaleX(0.98); }
  66%     { transform: scaleY(0.98) scaleX(1.01); }
}
@keyframes slime-drip-kf {
  0%,75%,100% { transform: translateY(0);   opacity: 1; }
  90%          { transform: translateY(6px); opacity: 0.6; }
}
.slime-blob   { animation: slime-wobble  3.2s ease-in-out infinite;       transform-box: fill-box; transform-origin: center bottom; }
.slime-drip-a { animation: slime-drip-kf 3.0s ease-in-out infinite;       transform-box: fill-box; transform-origin: top center; }
.slime-drip-b { animation: slime-drip-kf 3.0s ease-in-out 1.0s infinite;  transform-box: fill-box; transform-origin: top center; }
.slime-drip-c { animation: slime-drip-kf 3.0s ease-in-out 2.0s infinite;  transform-box: fill-box; transform-origin: top center; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Layer = 'flesh' | 'bone' | 'ethereal' | 'wing';

interface PartProps {
  layer: Layer;
  // ghost = add ghost-flesh class to flesh-layer parts
  ghost?: boolean;
  // extra className forwarded to the <g>
  className?: string;
}

// Utility: build the data-layer + optional ghost class string
function partClass(layer: Layer, ghost?: boolean): string {
  const cls: string[] = [];
  if (ghost && layer === 'flesh') cls.push('ghost-flesh');
  return cls.join(' ');
}

// ─── ═══════════════════════ FLESH PARTS ════════════════════════ ─────────────

// ── Upright humanoid torso (shoulders, body, waist, neck) ────────────────────
function UprightTorso({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      {/* Torso */}
      <path d="M 50,100 C 38,105 34,120 36,145 C 38,168 42,185 48,195
               L 50,230 L 110,230 L 112,195
               C 118,185 122,168 124,145 C 126,120 122,105 110,100 Z"/>
      {/* Waist / hip band */}
      <path d="M 50,225 L 48,258 L 112,258 L 110,225 Z"/>
      {/* Neck */}
      <path d="M 70,76 L 68,96 L 88,96 L 86,76 Z"/>
    </g>
  );
}

// ── Humanoid head (no eye — head type supplies the eye) ──────────────────────
function HumanoidHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      <ellipse cx="78" cy="48" rx="28" ry="30"/>
      {/* Eye */}
      <circle cx="92" cy="46" r="5" fill="black" stroke="none"/>
      <circle cx="94" cy="46" r="1.5" fill="white" stroke="none"/>
    </g>
  );
}

// ── Humanoid arm (back = creature's left = screen-right pre-flip) ─────────────
function HumanoidArmBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
        <animateTransform attributeName="transform" type="rotate"
          values="0 110 104; 3 110 104; 0 110 104; -3 110 104; 0 110 104"
          dur="2.8s" repeatCount="indefinite"/>
        <path d="M 110,104 C 122,110 130,130 132,158 L 120,162
               C 118,135 112,116 100,108 Z"/>
        <path d="M 120,160 C 124,180 126,205 124,232 L 113,234
               C 114,208 112,182 108,162 Z"/>
        <ellipse cx="118" cy="244" rx="10" ry="12" transform="rotate(-10,118,244)"/>
      </g>
    </g>
  );
}

function HumanoidArmFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 104; -2.5 50 104; 0 50 104; 2.5 50 104; 0 50 104"
          dur="2.5s" begin="0.4s" repeatCount="indefinite"/>
        <path d="M 50,104 C 38,110 30,128 28,155 L 40,160
               C 42,133 48,115 58,108 Z"/>
        <path d="M 40,158 C 36,178 34,202 36,228 L 47,226
               C 46,202 48,178 51,158 Z"/>
        <ellipse cx="41" cy="238" rx="10" ry="12" transform="rotate(10,41,238)"/>
      </g>
    </g>
  );
}

// ── Humanoid legs ─────────────────────────────────────────────────────────────
function HumanoidLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      <path d="M 83,256 C 84,270 86,295 85,330 L 98,330
               C 99,295 100,270 100,256 Z"/>
      <path d="M 83,328 C 83,345 84,365 84,390 L 98,390
               C 98,365 99,345 98,328 Z"/>
      <path d="M 98,389 L 84,389 C 78,389 76,400 82,410
               C 88,413 96,411 101,407 C 103,403 101,394 98,389 Z"/>
    </g>
  );
}

function HumanoidLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      <path d="M 60,256 C 61,270 62,295 62,330 L 75,330
               C 76,295 76,270 76,256 Z"/>
      <path d="M 60,328 C 60,345 60,365 60,390 L 74,390
               C 74,365 75,345 75,328 Z"/>
      <path d="M 74,389 L 60,389 C 54,389 52,400 58,410
               C 64,413 72,411 77,407 C 79,403 77,394 74,389 Z"/>
    </g>
  );
}

// ── Horse barrel ──────────────────────────────────────────────────────────────
function HorseBarrel({ ghost, fill = 'white' }: PartProps & { fill?: string }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={fill} stroke="black" stroke-width="2">
      <path d="M 90,152 C 84,136 65,128 42,130
               C 22,132 8,148 8,172 C 8,200 18,222 38,228
               C 56,232 78,228 90,220 C 96,210 96,168 90,152 Z"/>
      {/* waist junction */}
      <path d="M 68,162 C 76,168 88,168 96,162"
            fill="none" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
    </g>
  );
}

// ── Horse legs ────────────────────────────────────────────────────────────────
function HorseLeg({ cx, topY, ghost, fill = 'white' }: { cx: number; topY: number; ghost?: boolean; fill?: string }) {
  const kneeY = topY + 76;
  const hoofY = topY + 152;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={fill} stroke="black" stroke-width="2">
      <line x1={cx} y1={topY}   x2={cx - 2} y2={kneeY} stroke="black" strokeWidth="10" strokeLinecap="round"/>
      <line x1={cx} y1={topY}   x2={cx - 2} y2={kneeY} stroke={fill}  strokeWidth="6"  strokeLinecap="round"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}  y2={hoofY} stroke="black" strokeWidth="8"  strokeLinecap="round"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}  y2={hoofY} stroke={fill}  strokeWidth="4.5" strokeLinecap="round"/>
      {/* hoof */}
      <line x1={cx - 6} y1={hoofY - 2} x2={cx + 6} y2={hoofY} stroke="#333" strokeWidth="9" strokeLinecap="round"/>
      {/* knee knob */}
      <circle cx={cx - 2} cy={kneeY} r="5.5" fill={fill} stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

// ── Horse tail ────────────────────────────────────────────────────────────────
function HorseTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" strokeLinecap="round">
      <path d="M 11,176 C 3,190 2,212 6,232 C 10,246 15,255 11,268 C 8,278 4,284 4,294"
            stroke="black" strokeWidth="7"/>
      <path d="M 14,178 C 8,192 8,212 12,228 C 16,240 21,248 18,260 C 15,269 11,276 12,284"
            stroke="black" strokeWidth="4"/>
      <path d="M 17,180 C 12,195 13,213 16,228 C 19,238 22,244 20,255"
            stroke="black" strokeWidth="2.5"/>
    </g>
  );
}

// ── Bone centaur parts ──────────────────────────────────────────────────────────────
// The horse barrel is replaced by an open ribcage + spine + pelvis basin.
// The back two legs become double-drawn dark bone shafts with knob joints.

function HorseRibcage() {
  // Horse spine runs from the withers (junction with human torso, ~x=90,y=152)
  // to the croup (~x=16,y=175). Six rib pairs fan out from it.
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      {/* Spine */}
      <path d="M 90,152 C 70,148 40,155 16,172" strokeWidth="3" strokeDasharray="3,4"/>
      {/* Ribs — right side (back of horse) */}
      <path d="M 72,152 C 75,162 78,178 76,192" strokeWidth="2"/>
      <path d="M 58,154 C 62,165 65,182 62,198" strokeWidth="2"/>
      <path d="M 44,158 C 49,169 52,186 48,202" strokeWidth="2"/>
      <path d="M 32,163 C 37,174 38,190 34,204" strokeWidth="1.5"/>
      <path d="M 22,169 C 26,179 26,193 22,206" strokeWidth="1.5"/>
      {/* Ribs — left side (belly of horse) */}
      <path d="M 72,152 C 68,162 66,178 68,192" strokeWidth="1.5"/>
      <path d="M 58,154 C 53,165 51,182 54,198" strokeWidth="1.5"/>
      <path d="M 44,158 C 38,169 36,186 40,202" strokeWidth="1.5"/>
      <path d="M 32,163 C 26,173 24,188 28,202" strokeWidth="1.2"/>
      <path d="M 22,169 C 16,178 14,191 18,204" strokeWidth="1.2"/>
      {/* Sternum bar */}
      <path d="M 68,192 C 56,197 42,200 26,204" strokeWidth="2.5"/>
    </g>
  );
}

function HorsePelvis() {
  // Basin centred around the croup/rump where back legs attach (~x=33 y=224).
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.8">
      <path d="M 52,215 C 44,210 26,212 18,218 C 12,224 14,234 20,240
               L 26,250 C 30,258 38,260 44,254 C 48,262 56,264 60,258
               C 66,252 62,240 56,232 C 60,224 58,218 52,215 Z"/>
    </g>
  );
}

// Bone replacement for HorseLeg: dark double-drawn shaft + knob joints + hoof cap.
function HorseLegBone({ cx, topY }: { cx: number; topY: number }) {
  const kneeY = topY + 76;
  const hoofY = topY + 152;
  return (
    <g data-layer="bone" strokeLinecap="round">
      <line x1={cx}     y1={topY}   x2={cx - 2} y2={kneeY} stroke="black" strokeWidth="11"/>
      <line x1={cx}     y1={topY}   x2={cx - 2} y2={kneeY} stroke="#666"  strokeWidth="7"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}     y2={hoofY} stroke="black" strokeWidth="9"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}     y2={hoofY} stroke="#666"  strokeWidth="5.5"/>
      <line x1={cx - 6} y1={hoofY - 2} x2={cx + 6} y2={hoofY} stroke="#333" strokeWidth="9" />
      <circle cx={cx - 2} cy={kneeY} r={6}   fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx={cx}     cy={topY}  r={5}   fill="#555" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

// ── Fish tail (mermaid) ───────────────────────────────────────────────────────
function FishTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2">
      {/* caudal fin upper lobe */}
      <path d="M 124,366 C 136,352 158,338 162,320 C 154,334 148,360 134,378 L 122,384 Z"/>
      {/* caudal fin lower lobe */}
      <path d="M 128,382 C 144,388 166,376 170,360 C 158,372 146,392 128,400 L 118,396 Z"/>
      {/* tail body */}
      <path d="M 90,152 C 84,136 65,128 42,130 C 98,242 104,258 116,282 124,316
               C 128,336 128,356 124,366 C 122,372 118,382 118,384
               C 116,388 122,394 128,400 C 122,402 112,398 108,390
               C 104,382 100,372 98,360 C 92,332 84,302 80,278
               C 76,262 72,250 68,244
               C 62,232 52,216 46,82
               C 52,72 62,64 78,64 C 94,64 104,72 110,82 Z"/>
    </g>
  );
}

// ── Phoenix bird legs ───────────────────────────────────────────────────────────
// Anchored at the humanoid hip positions (back cx=90 y=262, front cx=66 y=262).
// Reversed-knee bird leg: thigh goes down+out, lower goes back up, claws fan outward.
function PhoenixLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeLinecap="round">
      <path d="M 90,262 L 99,310" strokeWidth="7"/>
      <path d="M 99,310 L 108,268" strokeWidth="5"/>
      <path d="M 108,268 L 137,264" strokeWidth="3"/>
      <path d="M 108,268 L 135,271" strokeWidth="2"/>
      <path d="M 108,268 L 91,275"  strokeWidth="2"/>
    </g>
  );
}

function PhoenixLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeLinecap="round">
      <path d="M 66,262 L 57,310" strokeWidth="7"/>
      <path d="M 57,310 L 48,268" strokeWidth="5"/>
      <path d="M 48,268 L 19,264" strokeWidth="3"/>
      <path d="M 48,268 L 21,271" strokeWidth="2"/>
      <path d="M 48,268 L 65,275"  strokeWidth="2"/>
    </g>
  );
}

// Apex inside the torso area — about half the tail is hidden behind the torso/waist.
// A clipPath at y=258 (bottom of the waist band) hard-clips the top so the apex
// never becomes visible when the torso ghosts out.
// Drawn early in the stack so legs and torso both render on top.
function PhoenixTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <defs>
        <clipPath id="cc-tailClip">
          {/* Allow everything from the waist-band bottom downward */}
          <rect x="-50" y="258" width="300" height="200"/>
        </clipPath>
      </defs>
      <polygon points="78,180 26,400 130,400"
               fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round"
               clipPath="url(#cc-tailClip)"/>
    </g>
  );
}

// Drawn before head so the cranium overlaps the beak base.
function PhoenixBeak({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <polygon points="134,45 102,38 102,55"/>
    </g>
  );
}

// ─── Harpy parts ──────────────────────────────────────────────────────────────

// ── Harpy crest — five feather plumes radiating from the crown ───────────────
// Geometry copied from feather.svg: quill/rachis + yellow barbs (base) +
// green barbs (mid) + red barbs (tip).  One <defs> symbol reused five times
// with rotate+scale transforms to fan them from the crown.
// Quill pivot in feather-space: (50, 230).
// Each entry: [rotateDeg, baseCx, baseCy, scale]
function HarpyCrest({ ghost }: PartProps) {
  const feathers: [number, number, number, number][] = [
    [-25, 70, 25, 0.20],
    [-12, 74, 21, 0.23],
    [  0, 78, 19, 0.25],
    [ 12, 82, 21, 0.23],
    [ 25, 86, 25, 0.20],
  ];
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <defs>
        <g id="cc-feather">
          {/* Quill (calamus) */}
          <path d="M 49,225 Q 49.2,233 50,242 Q 50.8,233 51,225 Z" fill="#c8963c"/>
          {/* Rachis stem + highlight */}
          <rect x="49" y="14" width="2" height="211" rx="1" fill="#8b6014"/>
          <rect x="49.4" y="14" width="0.7" height="211" rx="0.35" fill="#d4a040" opacity="0.55"/>
          {/* Yellow barbs — base zone */}
          <g stroke="#f5c800" strokeWidth="0.9" fill="none" strokeLinecap="round">
            <path d="M 50,215 C 56,207 66,218 72,218"/>
            <path d="M 50,215 C 44,207 34,218 28,218"/>
            <path d="M 50,205 C 57,196 67,206 75,208"/>
            <path d="M 50,205 C 43,196 33,206 25,208"/>
            <path d="M 50,195 C 58,186 69,197 76,198"/>
            <path d="M 50,195 C 42,186 31,197 24,198"/>
            <path d="M 50,185 C 58,175 70,187 78,188"/>
            <path d="M 50,185 C 42,175 30,187 22,188"/>
            <path d="M 50,175 C 59,165 70,177 79,178"/>
            <path d="M 50,175 C 41,165 30,177 21,178"/>
          </g>
          {/* Green barbs — mid zone */}
          <g stroke="#3dba55" strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M 50,165 C 59,154 71,167 80,169"/>
            <path d="M 50,165 C 41,154 29,167 20,169"/>
            <path d="M 50,155 C 59,144 71,157 80,159"/>
            <path d="M 50,155 C 41,144 29,157 20,159"/>
            <path d="M 50,145 C 59,134 71,147 80,149"/>
            <path d="M 50,145 C 41,134 29,147 20,149"/>
            <path d="M 50,135 C 59,125 70,137 79,138"/>
            <path d="M 50,135 C 41,125 30,137 21,138"/>
            <path d="M 50,125 C 58,115 69,127 77,128"/>
            <path d="M 50,125 C 42,115 31,127 23,128"/>
            <path d="M 50,115 C 58,106 68,117 76,118"/>
            <path d="M 50,115 C 42,106 32,117 24,118"/>
          </g>
          {/* Red barbs — tip zone */}
          <g stroke="#e53030" strokeWidth="0.8" fill="none" strokeLinecap="round">
            <path d="M 50,105 C 57,97 67,106 74,108"/>
            <path d="M 50,105 C 43,97 33,106 26,108"/>
            <path d="M 50,95 C 56,88 64,96 70,97"/>
            <path d="M 50,95 C 44,88 36,96 30,97"/>
            <path d="M 50,85 C 55,79 63,86 68,87"/>
            <path d="M 50,85 C 45,79 37,86 32,87"/>
            <path d="M 50,75 C 54,70 60,76 64,77"/>
            <path d="M 50,75 C 46,70 40,76 36,77"/>
            <path d="M 50,65 C 53,61 57,66 60,66"/>
            <path d="M 50,65 C 47,61 43,66 40,66"/>
            <path d="M 50,55 C 52,53 54,55 55,56"/>
            <path d="M 50,55 C 48,53 46,55 45,56"/>
            <path d="M 50,45 C 51,43 53,45 54,45" strokeWidth="0.6"/>
            <path d="M 50,45 C 49,43 47,45 46,45" strokeWidth="0.6"/>
            <path d="M 50,35 C 51,33 52,34 52,35" strokeWidth="0.5"/>
            <path d="M 50,35 C 49,33 48,34 48,35" strokeWidth="0.5"/>
          </g>
        </g>
      </defs>
      {feathers.map(([rot, cx, cy, s], i) => (
        <use key={i} href="#cc-feather"
          transform={`translate(${cx},${cy}) rotate(${rot}) scale(${s}) translate(-50,-230)`}/>
      ))}
    </g>
  );
}

// ── Harpy teeth — sharp triangular fangs at the jaw line ─────────────────────
// Flesh-only: not drawn in bone mode (SkeletonSkull has its own teeth).
function HarpyTeeth({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="0.8" strokeLinejoin="round">
      <polygon points="70,70 73,78 76,70"/>
      <polygon points="76,70 79,78 82,70"/>
      <polygon points="82,70 85,78 88,70"/>
      <polygon points="88,70 91,78 94,70"/>
      <polygon points="94,70 97,78 100,70"/>
    </g>
  );
}

// ── Harpy legs — humanoid shafts with talon claws replacing the flat foot ────
// Three forward talons + one rear talon from an ankle knob.
function HarpyLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      {/* Thigh */}
      <path d="M 83,256 C 84,270 86,295 85,330 L 98,330
               C 99,295 100,270 100,256 Z"/>
      {/* Shin */}
      <path d="M 83,328 C 83,345 84,365 84,390 L 98,390
               C 98,365 99,345 98,328 Z"/>
      {/* Ankle knob */}
      <circle cx="91" cy="390" r="5" fill="white" stroke="black" strokeWidth="2"/>
      {/* Forward talons (3) */}
      <path d="M 91,390 L 112,394 L 120,407" fill="none" stroke="black" strokeWidth="3"   strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 91,390 L 111,404 L 116,418" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 91,390 L 106,413 L 108,426" fill="none" stroke="black" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"/>
      {/* Rear talon (1) */}
      <path d="M 91,390 L 72,394 L 64,406"   fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  );
}

function HarpyLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      {/* Thigh */}
      <path d="M 60,256 C 61,270 62,295 62,330 L 75,330
               C 76,295 76,270 76,256 Z"/>
      {/* Shin */}
      <path d="M 60,328 C 60,345 60,365 60,390 L 74,390
               C 74,365 75,345 75,328 Z"/>
      {/* Ankle knob */}
      <circle cx="67" cy="390" r="5" fill="white" stroke="black" strokeWidth="2"/>
      {/* Forward talons (3) */}
      <path d="M 67,390 L 88,394 L 96,407"   fill="none" stroke="black" strokeWidth="3"   strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 67,390 L 87,404 L 92,418"   fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 67,390 L 82,413 L 84,426"   fill="none" stroke="black" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"/>
      {/* Rear talon (1) */}
      <path d="M 67,390 L 48,394 L 40,406"   fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  );
}

// ─── ═══════════════════════ BONE PARTS ═════════════════════════ ─────────────
// Bone parts are always tagged data-layer="bone" and are EXEMPT from ghost fade.
// They are rendered on top of flesh parts (to be visible when ghost fades flesh).

function SkeletonRibcage() {
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      <line x1="78" y1="80" x2="78" y2="246" strokeWidth="2.5" strokeDasharray="3,4"/>
      <path d="M 78,96 C 88,94 102,100 112,108" strokeWidth="2.5"/>
      <path d="M 78,96 C 68,94 54,100 44,108"  strokeWidth="2.5"/>
      {/* right ribs */}
      <path d="M 78,108 C 90,101 108,104 116,110" strokeWidth="2"/>
      <path d="M 78,122 C 91,114 112,116 119,124" strokeWidth="2"/>
      <path d="M 78,136 C 91,128 113,130 120,138" strokeWidth="2"/>
      <path d="M 78,150 C 91,142 112,143 119,152" strokeWidth="2"/>
      <path d="M 78,164 C 90,156 109,158 116,167" strokeWidth="2"/>
      <path d="M 78,177 C 88,170 105,172 111,180" strokeWidth="2"/>
      <path d="M 116,110 C 119,135 120,155 111,180" strokeWidth="3"/>
      {/* left ribs */}
      <path d="M 78,108 C 66,101 48,104 40,110" strokeWidth="1.5"/>
      <path d="M 78,122 C 65,114 44,116 37,124" strokeWidth="1.5"/>
      <path d="M 78,136 C 65,128 43,130 36,138" strokeWidth="1.5"/>
      <path d="M 78,150 C 65,142 44,143 37,152" strokeWidth="1.5"/>
      <path d="M 78,164 C 66,156 47,158 40,167" strokeWidth="1.5"/>
      <path d="M 78,177 C 68,170 51,172 45,180" strokeWidth="1.5"/>
    </g>
  );
}

function SkeletonPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="2">
      <path d="M 52,242 C 48,234 56,226 78,224 C 100,226 108,234 104,242
               L 108,256 C 106,268 98,272 90,268 C 86,276 70,276 66,268
               C 58,272 50,268 48,256 Z"/>
    </g>
  );
}

function SkeletonArmBack() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="110" y1="112" x2="122" y2="162" strokeWidth="9"/>
      <line x1="110" y1="112" x2="122" y2="162" stroke="#666" strokeWidth="5.5"/>
      <line x1="122" y1="162" x2="117" y2="232" strokeWidth="7"/>
      <line x1="122" y1="162" x2="117" y2="232" stroke="#666" strokeWidth="4"/>
      <ellipse cx="116" cy="243" rx="8" ry="10" fill="#555" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

function SkeletonArmFront() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="46"  y1="112" x2="36"  y2="162" strokeWidth="9"/>
      <line x1="46"  y1="112" x2="36"  y2="162" stroke="#666" strokeWidth="5.5"/>
      <line x1="36"  y1="162" x2="41"  y2="232" strokeWidth="7"/>
      <line x1="36"  y1="162" x2="41"  y2="232" stroke="#666" strokeWidth="4"/>
      <ellipse cx="41" cy="243" rx="8" ry="10" fill="#555" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

function SkeletonLegBack() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="90" y1="262" x2="89" y2="326" strokeWidth="11"/>
      <line x1="90" y1="262" x2="89" y2="326" stroke="#666" strokeWidth="7"/>
      <line x1="89" y1="326" x2="88" y2="390" strokeWidth="9"/>
      <line x1="89" y1="326" x2="88" y2="390" stroke="#666" strokeWidth="5.5"/>
      <path d="M 95,389 L 81,389 C 75,389 73,400 79,410 C 85,413 93,411 98,407 C 100,403 98,394 95,389 Z"
            fill="#555"/>
    </g>
  );
}

function SkeletonLegFront() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="66"  y1="262" x2="67"  y2="326" strokeWidth="11"/>
      <line x1="66"  y1="262" x2="67"  y2="326" stroke="#666" strokeWidth="7"/>
      <line x1="67"  y1="326" x2="66"  y2="390" strokeWidth="9"/>
      <line x1="67"  y1="326" x2="66"  y2="390" stroke="#666" strokeWidth="5.5"/>
      <path d="M 73,389 L 59,389 C 53,389 51,400 57,410 C 63,413 71,411 76,407 C 78,403 76,394 73,389 Z"
            fill="#555"/>
    </g>
  );
}

function SkeletonSkull() {
  return (
    <g data-layer="bone">
      {/* Cervical vertebrae */}
      <circle cx="78" cy="81" r="4"   fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="78" cy="89" r="3.5" fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="78" cy="97" r="3"   fill="#555" stroke="black" strokeWidth="1.5"/>
      {/* Cranium */}
      <ellipse cx="78" cy="46" rx="28" ry="30" fill="#555" stroke="black" strokeWidth="2"/>
      {/* Cheekbone */}
      <path d="M 98,56 C 104,60 106,68 102,74" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Sockets */}
      <ellipse cx="91" cy="40" rx="10" ry="11" fill="#1a0000" stroke="none"/>
      <ellipse cx="63" cy="40" rx="10" ry="11" fill="#1a0000" stroke="none"/>
      {/* Nose */}
      <path d="M 76,58 C 74,64 77,67 78,65 C 79,67 82,64 80,58 Z" fill="#333" stroke="none"/>
      {/* Teeth */}
      <rect x="69"  y="71" width="4"   height="5.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="74"  y="70" width="4.5" height="6.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="79"  y="70" width="4.5" height="6.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="84"  y="70" width="4.5" height="6.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="89"  y="71" width="4.5" height="5.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
      <rect x="94"  y="72" width="3.5" height="4.5" rx="0.5" fill="#888" stroke="#444" strokeWidth="0.8"/>
    </g>
  );
}

function SkeletonJointKnobs({ includeHips = true }: { includeHips?: boolean }) {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.5">
      <circle cx="110" cy="112" r="7"/>
      <circle cx="46"  cy="112" r="7"/>
      <circle cx="122" cy="162" r="6"/>
      <circle cx="36"  cy="162" r="6"/>
      {includeHips && <>
        <circle cx="90"  cy="262" r="7"/>
        <circle cx="66"  cy="262" r="7"/>
        <circle cx="89"  cy="326" r="7"/>
        <circle cx="67"  cy="326" r="7"/>
      </>}
    </g>
  );
}

function SkeletonCracks() {
  return (
    <g data-layer="bone" fill="none" stroke="#cc0000" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="82,18 79,28 85,36 80,48 77,55" strokeWidth="1.2"/>
      <polyline points="94,32 90,42 96,52 92,66 96,74" strokeWidth="1"/>
      <polyline points="85,100 82,115 88,130 83,148 89,165 84,183 88,200 83,220 87,240" strokeWidth="1.3"/>
      <polyline points="70,228 75,238 68,250 73,262 69,272" strokeWidth="1"/>
      <polyline points="91,270 88,290 93,310 89,325" strokeWidth="1"/>
      <polyline points="68,330 71,350 66,370 70,390" strokeWidth="1"/>
      <polyline points="114,115 118,135 115,155 119,175 116,200" strokeWidth="1"/>
    </g>
  );
}

// ─── ═══════════════════════ ETHEREAL PARTS ══════════════════════ ────────────

function LichCrown() {
  return (
    <g data-layer="ethereal">
      <path d="M 52,22 L 52,10 L 58,18 L 64,4 L 70,18 L 76,6 L 82,18
               L 88,4 L 94,18 L 100,8 L 104,22 L 104,30 L 52,30 Z"
            fill="#555" stroke="black" strokeWidth="1.5" strokeLinejoin="miter"/>
      <polygon points="78,8 74,16 78,13 82,16" fill="#cc0000" stroke="#ff4444" strokeWidth="0.8"/>
    </g>
  );
}

function LichEyes({ eyes = [{ cx: 91, cy: 40 }, { cx: 63, cy: 40 }] }: { eyes?: { cx: number; cy: number }[] }) {
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
// One flame gradient + smoke blur filter shared across all tongues.
// Flame paths: base sits on the body contour, tip points toward lower y (up).
function PhoenixFlames() {
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

// ─── Giant Rat ───────────────────────────────────────────────────────────────
// Upright bipedal posture — standing on hind legs so the body occupies the
// same canvas zone as the humanoid torso, sitting in front of wing layers.
//
// Draw order: RatTail → RatLegBack (hind, back one) → RatBody →
//             RatHead → RatLegBack (hind, front one) → RatLegFront×2 (paws)
// Standard viewBox 0 0 160 420.

function RatTail({ ghost, anchorX = 20, anchorY = 250 }: PartProps & { anchorX?: number; anchorY?: number }) {
  // Tail path authored with root at (20, 250). Translate to anchor.
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
function RatLegBack({ cx, topY, ghost }: { cx: number; topY: number; ghost?: boolean }) {
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
function RatLegFront({ cx, topY, ghost }: { cx: number; topY: number; ghost?: boolean }) {
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
function RatBody({ ghost }: PartProps) {
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
function RatHead({ ghost }: PartProps) {
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
function RatEars({ ghost, dy = 0 }: PartProps & { dy?: number }) {
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

function RatWhiskers({ ghost }: PartProps) {
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

function RatRibcage() {
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

function RatPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="2">
      <path d="M 52,244 C 48,236 56,228 78,226 C 100,228 108,236 104,244
               L 108,258 C 106,270 98,274 90,270 C 86,278 70,278 66,270
               C 58,274 50,270 48,258 Z"/>
    </g>
  );
}

function RatSkullHead() {
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

function RatLegBackBone({ cx, topY }: { cx: number; topY: number }) {
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

function RatLegFrontBone({ cx, topY }: { cx: number; topY: number }) {
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
function SnakeCoil({ ghost }: PartProps) {
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
function SnakeBody({ ghost }: PartProps) {
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
function SnakeCoilFront({ ghost }: PartProps) {
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
function SnakeHood({ ghost }: PartProps) {
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
function SnakeHead({ ghost }: PartProps) {
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
function SnakeRibcage() {
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
function SnakeSkullHead() {
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

// ─── Giant Spider ────────────────────────────────────────────────────────────
// All spider parts use a nested inner transform that, combined with the
// compositor's outer translate(160,0) scale(-1,1), reproduces the original
// standalone SVG's translate(174,-64) scale(-1.2,1.2) exactly.
// This lets us copy original-SVG coordinates directly into path data.
const SPIDER_T = 'translate(-14,-64) scale(1.2,1.2)';

function SpiderLegs({ ghost }: { ghost?: boolean }) {
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

function SpiderBody({ ghost }: { ghost?: boolean }) {
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
function SpiderHairs({ ghost }: { ghost?: boolean }) {
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
function SpiderEyes({ ghost }: { ghost?: boolean }) {
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
function SpiderBonusArms() {
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
function SpiderBonusLegs() {
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
function SpiderBoneEyes() {
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

// ─── Giant Slime ─────────────────────────────────────────────────────────────
// Standalone: a tall goopy blob filling the canvas, narrow at the "waist",
// two blobby eyes near the top, capped by a small tendril drip.
// As a chimera overlay: semi-transparent green goop anchored to creature surfaces.

function SlimeBody({ ghost }: PartProps) {
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

type Pt = [number, number];

function centroid(pts: Pt[]): Pt {
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  return [sx / pts.length, sy / pts.length];
}

function expandPt([px, py]: Pt, [cx, cy]: Pt, pad: number, seed: number): Pt {
  const dx = px - cx, dy = py - cy;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  // seed drives ±20% variation in pad so adjacent points get different offsets
  const actual = pad * (1 + 0.20 * Math.sin(seed * 2.399));
  return [px + dx/len * actual, py + dy/len * actual];
}

function slimeSilhouette(pts: Pt[], pad: number): string {
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
function slimeHighlight(pts: Pt[], pad: number): string {
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

function SlimeGoop({ pts, pad = 18 }: { pts: Pt[]; pad?: number }) {
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

// ─── ════════════════════ GOAT / PAN PARTS ══════════════════════ ─────────────
// Goat and satyr anatomy. Canvas 160×420, pre-flip (right-facing).
// Key landmark heights: skull centre y=46, hip y=258, floor y=420.
//
// Goat horns: two swept lateral arcs from the forehead, filled #c8b88a (horn tan).
// Goat legs: digitigrade (reversed-knee) columns — wide furry thigh → shin angled
//   backward → fetlock knob → short pastern → cloven hoof (two separate toe pads).
// Goat eyes: amber iris (#c4850a) + thin horizontal slit pupil — the defining feature.
//
// ── GoatHorns (full size, for pure goat) ─────────────────────────────────────
// ── GoatBody — quadruped mountain goat with forelegs on a boulder ────────────
// Entirely stroke-based (no fills on the animal). Fur lines in gray and light
// green patches give the patchy coat. Oriented like the centaur body: side-view
// at a slight angle, front (high-x) elevated, back (low-x) lower.
//
// Draw order inside: far back leg → far barrel → near back leg → tail →
// boulder → belly → far front leg → near barrel/shoulder → near front leg →
// neck → ear → head → beard → horns → eye.
//
// Boulder sits at x≈18-164, y≈268-422 (right/front area, forelegs rest on top).
// Back legs reach ground at y≈405. Front legs rest on boulder at y≈276.
function GoatBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>

      {/* ── FAR BACK LEG ── */}
      {/* Thigh gray */}
      <path d="M 44,212 L 43,228 M 46,214 L 45,230 M 42,218 L 41,234
               M 45,222 L 44,238 M 43,228 L 42,244 M 41,232 L 40,248"
            fill="none" stroke="#aaa" strokeWidth="1.1" strokeLinecap="round"/>
      {/* Thigh green patch */}
      <path d="M 47,236 L 46,252 M 45,242 L 44,258 M 43,248 L 42,264
               M 41,244 L 40,260 M 46,250 L 45,266"
            fill="none" stroke="#8dc870" strokeWidth="1.1" strokeLinecap="round"/>
      {/* Far shin */}
      <path d="M 43,272 L 41,288 M 41,276 L 39,292 M 45,274 L 43,290
               M 39,282 L 38,298 M 42,288 L 41,304"
            fill="none" stroke="#999" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M 41,304 L 40,320 M 39,308 L 38,324 M 37,312 L 36,328
               M 40,316 L 39,332 M 38,320 L 37,336"
            fill="none" stroke="#aaa" strokeWidth="1.0" strokeLinecap="round"/>
      {/* Far fetlock tuft */}
      <path d="M 39,334 L 36,348 M 41,336 L 39,352 M 37,338 L 34,354
               M 43,337 L 42,353"
            fill="none" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Far hoof */}
      <path d="M 36,352 C 35,368 35,386 36,406 M 40,353 C 40,369 41,387 42,406"
            fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      <path d="M 35,405 L 44,405" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── FAR BARREL (rear half of body) ── */}
      <path d="M 48,152 L 62,150 M 46,156 L 60,154 M 48,160 L 63,158
               M 46,165 L 62,163 M 48,169 L 65,167"
            fill="none" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Far haunch curves */}
      <path d="M 42,158 C 41,170 42,186 44,200
               M 45,154 C 44,166 45,182 47,196
               M 48,151 C 47,163 48,179 50,193"
            fill="none" stroke="#8dc870" strokeWidth="1.2" strokeLinecap="round"/>

      {/* ── NEAR BACK LEG ── */}
      {/* Thigh gray */}
      <path d="M 55,208 L 54,224 M 57,210 L 56,226 M 53,212 L 52,228
               M 56,217 L 55,233 M 54,222 L 53,238 M 58,215 L 57,231"
            fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Thigh green */}
      <path d="M 58,232 L 57,248 M 56,237 L 55,253 M 60,234 L 59,250
               M 54,242 L 53,258 M 57,247 L 56,263"
            fill="none" stroke="#7ab060" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Near shin */}
      <path d="M 56,262 L 54,278 M 54,267 L 52,283 M 58,264 L 56,280
               M 52,273 L 50,289 M 55,278 L 53,294"
            fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 54,293 L 53,309 M 52,297 L 51,313 M 50,301 L 49,317
               M 53,305 L 52,321 M 51,309 L 50,325"
            fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Near fetlock */}
      <path d="M 53,330 L 50,344 M 55,332 L 53,348 M 51,334 L 48,350
               M 57,333 L 56,349"
            fill="none" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/>
      {/* Near hoof */}
      <path d="M 49,348 C 48,364 48,382 48,402 M 53,349 C 53,366 54,384 55,403"
            fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M 47,402 L 57,403" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── TAIL — short white puff ── */}
      <path d="M 42,150 L 39,138 M 44,149 L 41,136 M 40,152 L 37,139
               M 46,151 L 44,138 M 38,154 L 35,141 M 48,153 L 46,140"
            fill="none" stroke="#ddd" strokeWidth="1.3" strokeLinecap="round"/>

      {/* ── BOULDER ── */}
      <path d="M 60,276 C 50,268 28,268 16,282
               C 6,298 12,348 22,382
               C 32,412 86,422 136,414
               C 156,406 166,380 160,348
               C 154,316 148,280 130,270
               C 112,260 74,270 60,276 Z"
            fill="#515151" stroke="#282828" strokeWidth="1.5"/>
      {/* Top highlight */}
      <path d="M 48,273 C 78,263 112,262 136,272"
            fill="none" stroke="#909090" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Horizontal sweep curves — 3-D roundness */}
      <path d="M 18,295 C 54,285 102,283 150,291"
            fill="none" stroke="#363636" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 16,318 C 52,310 102,308 152,316"
            fill="none" stroke="#363636" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 20,342 C 56,334 104,332 152,340"
            fill="none" stroke="#363636" strokeWidth="1" strokeLinecap="round"/>
      <path d="M 26,366 C 60,358 108,356 150,364"
            fill="none" stroke="#363636" strokeWidth="1" strokeLinecap="round"/>
      {/* Left shadow edge */}
      <path d="M 14,288 C 18,312 24,342 32,372"
            fill="none" stroke="#1c1c1c" strokeWidth="2" strokeLinecap="round"/>
      {/* Vertical cracks for texture */}
      <path d="M 82,268 C 84,293 80,324 78,360"
            fill="none" stroke="#2c2c2c" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 122,268 C 124,295 126,326 124,364"
            fill="none" stroke="#2c2c2c" strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── BELLY ── */}
      <path d="M 54,210 L 60,212 M 64,209 L 70,211 M 74,208 L 80,210
               M 84,208 L 90,210 M 94,208 L 100,210 M 104,208 L 110,210"
            fill="none" stroke="#ccc" strokeWidth="1.0" strokeLinecap="round"/>
      <path d="M 66,211 L 70,215 M 78,210 L 82,214 M 90,209 L 94,213
               M 102,209 L 106,213"
            fill="none" stroke="#a0d060" strokeWidth="0.9" strokeLinecap="round"/>

      {/* ── FAR FRONT LEG (on boulder) ── */}
      <path d="M 100,208 L 99,224 M 102,210 L 101,226 M 98,212 L 97,228
               M 101,216 L 100,232 M 99,220 L 98,236"
            fill="none" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 99,232 L 98,248 M 101,235 L 100,251 M 97,238 L 96,254
               M 100,242 L 99,258 M 98,247 L 97,263"
            fill="none" stroke="#8dc870" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M 98,258 L 97,274 M 100,260 L 99,276 M 96,262 L 95,278"
            fill="none" stroke="#999" strokeWidth="1.1" strokeLinecap="round"/>

      {/* ── BARREL NEAR SIDE (front half) ── */}
      {/* Green mid-back patch */}
      <path d="M 64,150 L 80,148 M 66,154 L 82,152 M 64,158 L 82,156
               M 66,163 L 84,161 M 68,168 L 86,166"
            fill="none" stroke="#8dc870" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Gray front of barrel */}
      <path d="M 86,148 L 102,146 M 88,152 L 104,150 M 86,156 L 104,154
               M 88,161 L 106,159 M 86,166 L 106,164 M 88,170 L 108,168"
            fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Side flank — slightly diagonal downward */}
      <path d="M 68,170 L 72,186 M 74,168 L 78,184 M 80,167 L 84,183
               M 86,166 L 90,182 M 92,165 L 96,181 M 98,165 L 102,181"
            fill="none" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Shoulder curves */}
      <path d="M 100,164 C 104,176 108,192 112,208
               M 104,162 C 108,174 112,190 116,206
               M 96,166 C 98,178 100,194 102,210"
            fill="none" stroke="#8dc870" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 108,162 C 112,174 116,190 120,206"
            fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>

      {/* ── NEAR FRONT LEG (on boulder) ── */}
      <path d="M 112,205 L 111,221 M 114,207 L 113,223 M 110,209 L 109,225
               M 113,214 L 112,230 M 111,219 L 110,235"
            fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M 111,231 L 110,247 M 113,233 L 112,249 M 109,236 L 108,252
               M 112,240 L 111,256 M 110,244 L 109,260"
            fill="none" stroke="#7ab060" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 110,256 L 109,272 M 112,258 L 111,274 M 108,260 L 107,276"
            fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>

      {/* ── NECK ── */}
      <path d="M 112,152 C 116,140 122,128 126,112
               M 116,150 C 120,138 126,126 130,110
               M 110,155 C 114,143 120,130 124,114"
            fill="none" stroke="#999" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M 120,148 C 124,136 130,124 134,108
               M 118,152 C 122,140 128,128 132,112"
            fill="none" stroke="#8dc870" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 124,152 C 128,140 134,128 138,112
               M 126,154 C 130,142 136,130 140,114"
            fill="none" stroke="#aaa" strokeWidth="1.1" strokeLinecap="round"/>

      {/* ── EAR (near/low-x — slightly floppy) ── */}
      <path d="M 122,78 C 116,70 109,72 106,83
               C 103,94 108,105 117,104 C 124,101 125,88 122,78"
            fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 119,80 C 114,76 111,81 111,90 C 111,98 116,104 120,102"
            fill="none" stroke="#bbb" strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── HEAD ── */}
      {/* Crown — gray */}
      <path d="M 124,72 L 128,82 M 126,70 L 130,80 M 122,74 L 126,84
               M 128,70 L 132,80 M 130,72 L 134,82"
            fill="none" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Crown — green patch */}
      <path d="M 134,70 L 138,80 M 132,68 L 136,78 M 136,70 L 140,80
               M 138,68 L 142,78"
            fill="none" stroke="#8dc870" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Cheek */}
      <path d="M 138,82 L 146,84 M 136,86 L 144,88 M 138,90 L 146,92
               M 136,94 L 144,96 M 138,98 L 146,100 M 134,100 L 142,102"
            fill="none" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Muzzle */}
      <path d="M 146,84 L 154,86 M 144,88 L 152,90 M 146,92 L 154,94
               M 144,96 L 152,98"
            fill="none" stroke="#bbb" strokeWidth="1.0" strokeLinecap="round"/>
      {/* Nostrils */}
      <circle cx="153" cy="96" r="2" fill="#333" stroke="none"/>
      <circle cx="151" cy="100" r="1.5" fill="#444" stroke="none"/>

      {/* ── BEARD ── */}
      <path d="M 150,104 L 149,119 M 148,107 L 147,123 M 146,109 L 145,126
               M 152,103 L 151,118 M 144,110 L 143,127"
            fill="none" stroke="#ccc" strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── HORNS — no fill, sweep back from crown ── */}
      {/* Far horn (high-x) */}
      <path d="M 124,70 C 122,58 116,44 110,37 C 106,31 102,33 100,42"
            fill="none" stroke="#a08040" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M 100,42 C 99,48 102,56 106,54"
            fill="none" stroke="#a08040" strokeWidth="2" strokeLinecap="round"/>
      {/* Far horn annulation rings */}
      <path d="M 122,66 C 120,64 117,64 114,66
               M 118,59 C 116,57 113,57 111,59
               M 114,52 C 112,50 110,50 108,52"
            fill="none" stroke="#7a5c20" strokeWidth="1" strokeLinecap="round"/>
      {/* Near horn */}
      <path d="M 128,68 C 127,56 121,42 116,37 C 112,31 109,33 108,41"
            fill="none" stroke="#b09050" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 108,41 C 107,48 110,55 114,53"
            fill="none" stroke="#b09050" strokeWidth="1.8" strokeLinecap="round"/>
      {/* Near horn rings */}
      <path d="M 126,64 C 124,62 122,62 120,64
               M 122,57 C 120,55 118,55 116,57"
            fill="none" stroke="#9a7a30" strokeWidth="1" strokeLinecap="round"/>

      {/* ── GOAT EYE — amber iris, flat horizontal slit pupil ── */}
      <ellipse cx="140" cy="83" rx="7" ry="5.5"
               fill="#c4850a" stroke="#333" strokeWidth="1"/>
      <ellipse cx="140" cy="83" rx="5.5" ry="1.8"
               fill="#1a0800" stroke="none"/>
      <circle  cx="142" cy="81" r="1.5"
               fill="white" stroke="none" opacity="0.7"/>
    </g>
  );
}



// ── GoatHornsChimera (ear-scale, for chimera overlay) ────────────────────────
// Positioned like RatEars — drawn BEFORE the host head so the skull overlaps
// the horn base naturally. dy adjusts for each host species' crown height.
function GoatHornsChimera({ ghost, dy = 0 }: PartProps & { dy?: number }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#c8b88a" stroke="black" strokeWidth="1.5" strokeLinejoin="round"
       transform={dy ? `translate(0,${dy})` : undefined}>
      {/* Far horn */}
      <path d="M 95,26 C 98,14 110,8 116,13 C 120,18 116,27 106,30
               C 103,28 98,26 95,26 Z"/>
      <path d="M 106,30 C 102,33 101,37 104,39"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Near horn */}
      <path d="M 59,28 C 56,16 44,10 38,15 C 34,20 38,29 48,32
               C 51,30 56,28 59,28 Z"/>
      <path d="M 48,32 C 52,35 53,39 50,41"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  );
}

// ── GoatEyeOverlay — slit-pupil eye pasted over another creature's head ──────
// cy is the host eye's vertical centre (defaults to humanoid 46).
function GoatEyeOverlay({ ghost, cy = 46 }: PartProps & { cy?: number }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <ellipse cx="92" cy={cy} rx="7"   ry="6"
               fill="#c4850a" stroke="black" strokeWidth="1.5"/>
      <ellipse cx="92" cy={cy} rx="5.5" ry="1.8"
               fill="#1a0800" stroke="none"/>
      <circle  cx="94" cy={cy - 2} r="1.5"
               fill="white" stroke="none" opacity="0.7"/>
    </g>
  );
}

// ── GoatLegBack — chimera back digitigrade leg (fur-stroke style) ─────────────
// Connects at humanoid cx≈90, y=258. Thigh → reversed knee → fetlock → cloven hoof.
function GoatLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} fill="none" strokeLinecap="round">
      {/* Thigh gray */}
      <path d="M 90,258 L 89,274 M 92,260 L 91,276 M 88,262 L 87,278
               M 91,266 L 90,282 M 89,272 L 88,288 M 93,264 L 92,280"
            stroke="#aaa" strokeWidth="1.2"/>
      {/* Thigh green patch */}
      <path d="M 92,280 L 91,296 M 90,285 L 89,301 M 94,282 L 93,298
               M 88,288 L 87,304 M 91,292 L 90,308"
            stroke="#8dc870" strokeWidth="1.1"/>
      {/* Shin reversed */}
      <path d="M 90,308 L 88,324 M 88,312 L 86,328 M 92,310 L 90,326
               M 86,318 L 84,334 M 89,322 L 87,338"
            stroke="#999" strokeWidth="1.1"/>
      {/* Fetlock tuft */}
      <path d="M 87,340 L 84,354 M 89,342 L 87,358 M 85,344 L 82,360
               M 91,343 L 90,358"
            stroke="#ccc" strokeWidth="1.2"/>
      {/* Hoof */}
      <path d="M 83,358 C 82,374 82,390 83,406 M 87,358 C 87,374 88,390 90,406"
            stroke="#444" strokeWidth="2.2"/>
      <path d="M 82,405 L 91,405" stroke="#333" strokeWidth="2.5"/>
    </g>
  );
}

// ── GoatLegFront — chimera front digitigrade leg (fur-stroke style) ───────────
function GoatLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} fill="none" strokeLinecap="round">
      {/* Thigh gray */}
      <path d="M 66,258 L 65,274 M 68,260 L 67,276 M 64,262 L 63,278
               M 67,266 L 66,282 M 65,272 L 64,288 M 69,264 L 68,280"
            stroke="#888" strokeWidth="1.3"/>
      {/* Thigh green patch */}
      <path d="M 68,280 L 67,296 M 66,285 L 65,301 M 70,282 L 69,298
               M 64,288 L 63,304 M 67,292 L 66,308"
            stroke="#7ab060" strokeWidth="1.2"/>
      {/* Shin */}
      <path d="M 66,308 L 64,324 M 64,312 L 62,328 M 68,310 L 66,326
               M 62,318 L 60,334 M 65,322 L 63,338"
            stroke="#999" strokeWidth="1.2"/>
      {/* Fetlock tuft */}
      <path d="M 63,340 L 60,354 M 65,342 L 63,358 M 61,344 L 58,360
               M 67,343 L 66,358"
            stroke="#bbb" strokeWidth="1.2"/>
      {/* Hoof */}
      <path d="M 59,358 C 58,374 58,390 59,406 M 63,358 C 63,374 64,390 66,406"
            stroke="#444" strokeWidth="2.2"/>
      <path d="M 58,405 L 67,405" stroke="#333" strokeWidth="2.5"/>
    </g>
  );
}

// ─── ═══════════════════════ WING PARTS ═════════════════════════ ─────────────
// Wings are rendered as <object> layers in the viewport, not inline SVG.
// This component exists only so the compositor can signal "include wings".
// (Handled externally in CreatureViewport.)

// ─── ════════════════════ COMPOSITOR LOGIC ══════════════════════ ─────────────

export interface CompositorResult {
  /** Ordered list of JSX elements to render inside the root <g> */
  parts: React.ReactNode[];
  /** Width/height of the SVG canvas */
  viewBox: string;
  width: number;
  height: number;
  /** Whether wing <object> layers should be shown */
  hasWings: boolean;
}

/**
 * Given a set of selected keyword names, returns the ordered list of SVG parts
 * that together form the creature portrait.
 *
 * Rules are processed in order — later rules can add/replace parts.
 */
export function compositeCreature(keywords: string[]): CompositorResult {
  const has = (k: string) => keywords.includes(k);

  // ── presence flags ─────────────────────────────────────────────
  const isHuman   = has('human');
  const isCentaur  = has('centaur');
  const isMermaid  = has('mermaid');
  const isPhoenix  = has('phoenix');
  const isSpider   = has('giant_spider');
  const isHarpy    = has('harpy');
  const isRat      = has('giant_rat');
  const isSnake    = has('giant_snake');
  const isSkeleton = has('skeleton');
  const isLich     = has('lich');
  const isGhost    = has('ghost');
  const hasWings   = has('fly');
  const isSlime    = has('slime');
  const isGoat     = has('goat');
  // Slime chimera: slime + any other body-defining creature — the blob body is
  // suppressed and green goop overlays the host creature instead.
  const slimeChimera = isSlime && (isHuman || isCentaur || isMermaid || isPhoenix ||
                                   isSpider || isHarpy || isRat || isSnake || isGoat ||
                                   isSkeleton || isLich);
  // Goat chimera: goat + any other body-defining creature — horns, goat eyes, and
  // (where anatomy allows) goat legs are grafted onto the host body plan.
  const goatChimera = isGoat && (isHuman || isCentaur || isMermaid || isPhoenix ||
                                  isSpider || isHarpy || isRat || isSnake ||
                                  isSkeleton || isLich);

  // Centaur hindquarters inherit the dominant flesh color of the combined creature.
  const horseFlesh = isSnake ? { base: '#2d5a1e', hi: '#4a8c2e' }
                   : isRat   ? { base: '#c8963c', hi: '#e8b870' }
                   :           { base: 'white',   hi: 'white'   };

  // If rat is combined with another body-defining creature, only ears + whiskers + tail carry over.
  const ratChimera = isRat && (isHuman || isCentaur || isMermaid || isPhoenix || isSpider || isHarpy || isSnake || isGoat);

  // arms are a human/centaur feature — phoenixes and spiders don't have arms
  // (unless spider+boneMode, where bone arms are drawn regardless)
  const boneMode = isSkeleton || isLich;
  const boneSpider = isSpider && boneMode;

  const usesArms = (isHuman || isCentaur) && !(isSpider && !boneMode) && !isHarpy && !isRat && !(isSnake && !isCentaur);

  // ghost affects only flesh-tagged parts
  const ghost = isGhost;

  // Goat chimera: digitigrade legs replace normal legs on the host body.
  // Pure goat uses GoatBody (section 4) instead of individual leg pushes.
  const usesGoatLegs = isGoat && goatChimera && !isCentaur && !isMermaid
                     && !(isSnake && !isCentaur) && !(isSpider && !boneMode);

  // human legs are an explicit feature — suppressed by mermaid (fish tail),
  // phoenix (bird legs instead), spider-only, rat (own 4-leg plan), and goat.
  const usesHumanLegs = !isMermaid && !isPhoenix && !(isSpider && !boneMode) && !isRat && !isSnake && !usesGoatLegs && !(isSlime && !slimeChimera);

  const parts: React.ReactNode[] = [];

  // ── 1. Wings go behind everything (handled by viewport as <object> layers)
  // Nothing to add inline for wings.

  // ── 2. Back-most elements first ───────────────────────────────
  // Centaur hindquarters go before snake coil so coil renders on top of them.
  if (isCentaur) {
    if (boneMode) {
      // No barrel in bone mode — all 4 leg bones go here (no layering around barrel needed)
      if (!isRat) parts.push(<HorseTail    key="horse-tail"    layer="flesh" ghost={ghost}/>);
      parts.push(<HorseLegBone key="horse-leg-br"   cx={38} topY={224}/>);  // back far
      parts.push(<HorseLegBone key="horse-leg-ffar" cx={80} topY={220}/>);  // front far
      parts.push(<HorseLegBone key="horse-leg-bn"   cx={27} topY={222}/>);  // back near
      parts.push(<HorseLegBone key="horse-leg-fnear" cx={72} topY={218}/>); // front near
    } else {
      // Far-side legs (behind barrel) go here; near-side legs deferred to section 4 (after barrel)
      if (!isRat) parts.push(<HorseTail key="horse-tail"   layer="flesh" ghost={ghost}/>);
      parts.push(<HorseLeg key="horse-leg-br"   cx={38} topY={224} ghost={ghost} fill={horseFlesh.base}/>);  // back far
      parts.push(<HorseLeg key="horse-leg-ffar" cx={80} topY={220} ghost={ghost} fill={horseFlesh.base}/>);  // front far
      // Near-side legs + barrel deferred to section 4
    }
  }

  // Snake coil — backmost layer for upright cobra. Centaur body wins: no coil when centaur.
  if (isSnake && !isSpider && !isCentaur && !boneMode) {
    parts.push(<SnakeCoil key="snake-coil" layer="flesh" ghost={ghost}/>);
  }
  if (isRat) {
    // Always keep rat tail (replaces horse tail when centaur chimera).
    // Anchor: centaur hip → horse tail root (11,176); snake → neck base (78,306); pure rat → default (20,250).
    const ratTailAnchor = isCentaur ? { anchorX: 11, anchorY: 176 }
                        : isSnake   ? { anchorX: 78, anchorY: 306 }
                        : isSpider  ? { anchorX: 80, anchorY: 290 }
                        :             {};
    parts.push(<RatTail key="rat-tail" layer="flesh" ghost={ghost} {...ratTailAnchor}/>);
    // Legs only for pure rat — chimera uses the other creature's body plan
    if (!ratChimera) {
      if (!boneMode) {
        parts.push(<RatLegBack key="rat-hl-back" cx={90} topY={258} ghost={ghost}/>);
      } else {
        parts.push(<RatLegBackBone key="rat-hl-back-b" cx={90} topY={258}/>);
      }
    }
  } else if (!boneMode) {
    if (usesArms) {
      parts.push(<HumanoidArmBack key="arm-back" layer="flesh" ghost={ghost}/>);
    }
  } else if (!isRat) {
    // boneSpider: bonus arms go behind the torso (back pair) alongside regular arm
    if (boneSpider) {
      parts.push(<SpiderBonusArms key="spider-bonus-arms"/>);
    }
    if (!isSnake) {
      parts.push(<SkeletonArmBack key="arm-back-bone"/>);
    }
  }

  if (!isRat) {
    if (!boneMode) {
      if (usesGoatLegs) {
        parts.push(<GoatLegBack key="goat-leg-back" layer="flesh" ghost={ghost}/>);
      } else if (usesHumanLegs) {
        parts.push(isHarpy
          ? <HarpyLegBack  key="leg-back" layer="flesh" ghost={ghost}/>
          : <HumanoidLegBack key="leg-back" layer="flesh" ghost={ghost}/>
        );
      } else if (isPhoenix && !isSpider) {
        // For spider+phoenix the back leg is deferred to section 6 so it renders
        // in front of the spider abdomen, not behind it.
        parts.push(<PhoenixLegBack key="bird-leg-back" layer="flesh" ghost={ghost}/>);
      }
    } else if (!isMermaid) {
      if (boneSpider) {
        parts.push(<SpiderBonusLegs key="spider-bonus-legs"/>);
      }
      if (!isSnake) {
        parts.push(<SkeletonLegBack key="leg-back-bone"/>);
      }
    }
  }

  // ── 3. Ribcage / pelvis drawn under torso (visible through ghost torso) ──
  // NOTE: intentionally omitted here — moved to after the main body so that
  // in centaur combos the skeleton floats in front of the horse barrel.

  // ── 4. Main body ──────────────────────────────────────────────
  if (isRat && !ratChimera) {
    if (!boneMode) {
      parts.push(<RatBody key="rat-body" layer="flesh" ghost={ghost}/>);
    }
  } else if (isSnake && !isSpider && !isCentaur) {
    if (!boneMode) {
      parts.push(<SnakeBody key="snake-body" layer="flesh" ghost={ghost}/>);
    }
  } else if (isMermaid) {
    parts.push(<FishTail key="fish-tail" layer="flesh" ghost={ghost}/>);
  } else if (isSpider && !boneMode) {
    // Pure spider (no bone mode): spider body plan takes over.
    // Draw order: horse barrel (if centaur) → near-side horse legs → spider legs → abdomen.
    if (isCentaur) {
      parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost} fill={horseFlesh.base}/>);
      parts.push(<HorseLeg key="horse-leg-bn"    cx={27} topY={222} ghost={ghost} fill={horseFlesh.base}/>);  // back near
      parts.push(<HorseLeg key="horse-leg-fnear" cx={72} topY={218} ghost={ghost} fill={horseFlesh.base}/>);  // front near
    }
    parts.push(<SpiderLegs  key="spider-legs"  ghost={ghost}/>);
    parts.push(<SpiderBody  key="spider-body"  ghost={ghost}/>);
    parts.push(<SpiderHairs key="spider-hairs" ghost={ghost}/>);
  } else if (isCentaur) {
    // In bone mode the barrel is suppressed (bones replace flesh entirely).
    // Ghost overrides this: the faded barrel silhouette is a desirable effect.
    if (!boneMode || ghost) {
      parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost} fill={horseFlesh.base}/>);
    }
    if (!boneMode) {
      // Near-side legs in front of barrel, behind upright torso
      parts.push(<HorseLeg key="horse-leg-bn"    cx={27} topY={222} ghost={ghost} fill={horseFlesh.base}/>);  // back near
      parts.push(<HorseLeg key="horse-leg-fnear" cx={72} topY={218} ghost={ghost} fill={horseFlesh.base}/>);  // front near
      // Snake hood fills y=18–206 and replaces the human torso visually.
      // Harpy/phoenix/rat-chimera still need the torso for their upper body.
      if (!isSnake) {
        parts.push(<UprightTorso key="torso" layer="flesh" ghost={ghost}/>);
      }
    }
  } else if (isGoat && !goatChimera) {
    if (!boneMode) {
      // Full quadruped: includes boulder, all 4 legs, head, horns, eye — self-contained.
      parts.push(<GoatBody key="goat-body" layer="flesh" ghost={ghost}/>);
    }
  } else if (isSlime && !slimeChimera) {
    if (!boneMode) {
      parts.push(<SlimeBody key="slime-body" layer="flesh" ghost={ghost}/>);
    }
  } else {
    if (!boneMode) {
      parts.push(<UprightTorso key="torso" layer="flesh" ghost={ghost}/>);
    }
  }

  // ── 4b. Skeleton internals ──────────────────────────────────────────────
  if (boneMode) {
    if (isCentaur) {
      parts.push(<HorseRibcage key="horse-ribcage"/>);
      parts.push(<HorsePelvis key="horse-pelvis"/>);
    }
    if (isRat && !ratChimera) {
      parts.push(<RatRibcage key="rat-ribcage"/>);
      parts.push(<RatPelvis  key="rat-pelvis"/>);
    } else if (isSnake) {
      parts.push(<SnakeRibcage key="snake-ribcage"/>);
    } else {
      parts.push(<SkeletonRibcage key="ribcage"/>);
      parts.push(<SkeletonPelvis key="pelvis"/>);
    }
    if (isLich) {
      parts.push(<SkeletonCracks key="cracks"/>);
    }
  }

  // ── 5. Head ───────────────────────────────────────────────────
  // Harpy crest sits above the skull — draw before head in both flesh and bone modes.
  if (isHarpy) {
    parts.push(<HarpyCrest key="harpy-crest" layer="flesh" ghost={ghost}/>);
  }
  // Phoenix beak removed — fire + talons + wings are sufficient.
  // Goat chimera: horns go BEFORE the head so the skull overlaps the horn base.
  // dy adjusts for each host species' crown height (same approach as RatEars).
  if (goatChimera && !boneMode) {
    const hornDy = isSnake ? -12 : isRat ? -4 : 0;
    parts.push(<GoatHornsChimera key="goat-horns" layer="flesh" ghost={ghost} dy={hornDy}/>);
  }
  // Rat chimera: ears go BEFORE the head so the head renders on top of them.
  // dy shifts ears to match each head's crown height (rat crown ≈ y=22).
  if (ratChimera && !boneMode && !isSpider) {
    const earDy = isSnake ? -12 : -4;  // snake crown ≈ y=10; humanoid crown ≈ y=18
    parts.push(<RatEars key="rat-ears" layer="flesh" ghost={ghost} dy={earDy}/>);
  }
  if (isRat && !ratChimera) {
    if (!boneMode) {
      parts.push(<RatHead key="rat-head" layer="flesh" ghost={ghost}/>);
    } else {
      parts.push(<RatSkullHead key="rat-skull"/>);
    }
  } else if (isSnake) {
    if (!boneMode) {
      parts.push(<SnakeHood key="snake-hood" layer="flesh" ghost={ghost}/>);
      parts.push(<SnakeHead key="snake-head" layer="flesh" ghost={ghost}/>);
    } else {
      parts.push(<SnakeSkullHead key="snake-skull"/>);
    }
  } else if (isSpider && !boneMode) {
    parts.push(<SpiderEyes key="spider-eyes" ghost={ghost}/>);
  } else if (isSlime && !slimeChimera) {
    // Pure slime has no head — the eyes are part of SlimeBody itself.
  } else if (boneMode) {
    parts.push(<SkeletonSkull key="skull"/>);
    if (boneSpider) {
      parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
    }
  } else if (isGoat && !goatChimera) {
    // GoatBody (section 4) is self-contained — head, horns, eye all included.
  } else {
    parts.push(<HumanoidHead key="head" layer="flesh" ghost={ghost}/>
    );
  }
  // Goat chimera: overlay the amber slit eye on top of the host head.
  if (goatChimera && !boneMode) {
    // Each head type has its eye at a slightly different y.
    const eyeCy = isRat ? 46 : isSnake ? 44 : 46;
    parts.push(<GoatEyeOverlay key="goat-eye-overlay" layer="flesh" ghost={ghost} cy={eyeCy}/>);
  }
  // Rat chimera: whiskers after head so they show on top.
  if (ratChimera && !boneMode && !isSpider) {
    parts.push(<RatWhiskers key="rat-whiskers" layer="flesh" ghost={ghost}/>);
  }

  // Harpy teeth are flesh-only; bone mode skull carries its own teeth.
  if (isHarpy && !boneMode) {
    parts.push(<HarpyTeeth key="harpy-teeth" layer="flesh" ghost={ghost}/>);
  }

  // Lich crown + glowing eyes sit over skull
  if (isLich) {
    parts.push(<LichCrown key="lich-crown"/>);
    // Side-profile skulls have only one visible eye — avoid a floating second glow.
    const lichEyes = isSnake ? [{ cx: 94, cy: 44 }]
                   : isRat   ? [{ cx: 62, cy: 46 }]
                   :           undefined;  // default: two front-facing sockets
    parts.push(<LichEyes key="lich-eyes" eyes={lichEyes}/>);
  }

  // ── 6. Front limbs (in front of body) ────────────────────────
  if (!isRat) {
    if (!boneMode) {
      if (usesArms) {
        parts.push(<HumanoidArmFront key="arm-front" layer="flesh" ghost={ghost}/>);
      }
    } else {
      if (!isSnake) {
        parts.push(<SkeletonArmFront key="arm-front-bone"/>);
      }
    }
  }

  if (isRat && !ratChimera) {
    // Front hind leg (nearer to viewer, in front of body) + both stubby paws
    if (!boneMode) {
      parts.push(<RatLegBack  key="rat-hl-front"  cx={66}  topY={258} ghost={ghost}/>);
      parts.push(<RatLegFront key="rat-paw-back"  cx={110} topY={112} ghost={ghost}/>);
      parts.push(<RatLegFront key="rat-paw-front" cx={46}  topY={112} ghost={ghost}/>);
    } else {
      parts.push(<RatLegBackBone  key="rat-hl-front-b"  cx={66}  topY={258}/>);
      parts.push(<RatLegFrontBone key="rat-paw-back-b"  cx={110} topY={112}/>);
      parts.push(<RatLegFrontBone key="rat-paw-front-b" cx={46}  topY={112}/>);
    }
  } else if (!boneMode) {
    if (usesHumanLegs) {
      parts.push(isHarpy
        ? <HarpyLegFront  key="leg-front" layer="flesh" ghost={ghost}/>
        : <HumanoidLegFront key="leg-front" layer="flesh" ghost={ghost}/>
      );
    } else if (usesGoatLegs) {
      parts.push(<GoatLegFront key="goat-leg-front" layer="flesh" ghost={ghost}/>);
    } else if (isPhoenix) {
      if (isSpider) {
        // Both bird legs deferred here so they render in front of spider abdomen.
        parts.push(<PhoenixLegBack  key="bird-leg-back"  layer="flesh" ghost={ghost}/>);
      }
      parts.push(<PhoenixLegFront key="bird-leg-front" layer="flesh" ghost={ghost}/>);
    }
  } else if (!isMermaid && !isSnake) {
    parts.push(<SkeletonLegFront key="leg-front-bone"/>);
  }

  // ── 7. Joint knobs always last ────────────────────────────────
  if (boneMode && !isRat && !isSnake) {
    parts.push(<SkeletonJointKnobs key="joint-knobs" includeHips={!isMermaid}/>);
  }

  // ── 8. Slime goop overlay ─────────────────────────────────────
  // Bounding polygons in pre-flip coords. Points should outline the creature
  // silhouette in CLOCKWISE order (so the centroid-expansion pushes outward).
  // Include enough waypoints at extremities (head top, arm tips, feet, tail) so
  // that the expansion covers every limb without big concave dips.
  if (slimeChimera) {
    let goopPts: Pt[];

    if (isSnake && !isCentaur) {
      // Cobra: head crown → hood right → body right → coil base → coil base left → body left → hood left
      goopPts = [
        [78, 10],  // head crown
        [124,44],  // snout tip
        [148,106], // hood right shoulder
        [104,190], // hood base right
        [91, 306], // neck base right / coil right edge
        [118,370], // coil outer right
        [78, 390], // coil bottom
        [38, 370], // coil outer left
        [22, 306], // coil left edge
        [52, 190], // hood base left
        [8,  106], // hood left shoulder
        [40, 44],  // back of head
      ];
    } else if (isSpider && !isCentaur) {
      // Spider uses SPIDER_T = translate(-14,-64) scale(1.2,1.2)
      // Key world points: head top ~(80,34), abdomen bottom ~(80,294), legs reach x≈1-155, y≤30–306
      goopPts = [
        [80,  34],  // cephalothorax top
        [130, 60],  // right leg upper reach
        [155, 100], // right foreleg tip
        [155, 220], // right hindleg tip
        [130, 280], // right side abdomen
        [80,  295], // abdomen bottom
        [28,  280], // left side abdomen
        [2,   220], // left hindleg tip
        [2,   100], // left foreleg tip
        [28,  60],  // left leg upper reach
      ];
    } else if (isRat && !ratChimera) {
      // Upright rat: head crown → paw tip right → hind foot right → tail root → hind foot left → paw left
      goopPts = [
        [78,  18],  // head crown
        [118, 50],  // far ear
        [142, 100], // front paw right
        [142, 168], // paw bottom right
        [118, 280], // hind foot right
        [78,  300], // hind foot bottom
        [38,  280], // hind foot left
        [14,  168], // paw bottom left
        [14,  100], // front paw left
        [38,  50],  // near ear
      ];
    } else if (isMermaid) {
      goopPts = [
        [78,  18],   // head crown
        [120, 46],   // head right
        [130, 108],  // shoulder right (pre-flip)
        [130, 220],  // torso right
        [110, 320],  // tail upper right
        [90,  430],  // tail fin tip right
        [60,  430],  // tail fin tip left
        [46,  320],  // tail upper left
        [26,  220],  // torso left
        [26,  108],  // shoulder left
        [36,  46],   // head left
      ];
    } else if (isCentaur) {
      // Centaur: head → shoulder → near front hoof → far front hoof → barrel rear → hindleg right → hindleg left → barrel top
      goopPts = [
        [78,   4],   // head crown
        [126,  40],  // head (snout/face) if snake — we'll keep generic
        [130,  100], // shoulder right
        [82,   220], // front hoof right (cx=80, topY=220, hoof = topY+152=372) — cap at barrel
        [80,   374], // front hoof right tip
        [72,   374], // front hoof left tip (cx=72 near leg)
        [27,   374], // back near hoof tip (cx=27, topY=222)
        [10,   340], // back near knee
        [10,   228], // horse barrel rear
        [4,    175], // tail root
        [16,   375], // back far hoof (cx=38, topY=224, hoof bottom=376)
        [38,   376], // back far hoof tip
        [80,   376], // front far hoof tip (cx=80)
        [90,   228], // barrel front-top
        [96,   155], // barrel front-top (junction with torso)
        [130,  100], // shoulder
        [110,  112], // shoulder back
        [26,   108], // shoulder front
      ];
    } else if (isGoat && !goatChimera) {
      // Pure goat (Pan/satyr): horn tips → arm reach → wide thighs → cloven hooves
      goopPts = [
        [78,  2],    // horn tip crown (between the two horns)
        [124, 8],    // far horn tip
        [124, 26],   // far horn base
        [130, 100],  // shoulder right
        [148, 200],  // arm/elbow right
        [112, 262],  // hip right (thigh top, wide)
        [108, 310],  // knee right (out-knee of digitigrade)
        [96,  414],  // hoof right
        [60,  414],  // hoof left
        [48,  310],  // knee left
        [44,  262],  // hip left
        [28,  200],  // arm/elbow left
        [26,  100],  // shoulder left
        [30,  26],   // near horn base
        [30,  8],    // near horn tip
      ];
    } else {
      // Generic humanoid (human, harpy, phoenix, goat-chimera host, rat-chimera host etc.)
      // Head crown → arm tips → hip → feet
      goopPts = [
        [78,  18],   // head crown
        [118, 44],   // head right
        [130, 100],  // shoulder right
        [148, 200],  // elbow/wrist right
        [130, 260],  // hip right
        [110, 420],  // foot right
        [66,  420],  // foot left
        [46,  260],  // hip left
        [28,  200],  // elbow/wrist left
        [26,  100],  // shoulder left
        [36,  44],   // head left
      ];
    }
    parts.push(<SlimeGoop key="slime-goop" pts={goopPts}/>);
  }

  // ── 9. Flames on top of everything ───────────────────────────
  if (isPhoenix) {
    parts.push(<PhoenixFlames key="phoenix-flames"/>);
  }

  return {
    parts,
    viewBox: isMermaid ? '-30 0 220 460' : (isSpider && !boneMode) ? '-70 0 310 330' : boneSpider ? '-30 -10 220 450' : isCentaur ? '0 0 160 405' : isPhoenix ? '-20 -30 200 450' : isHarpy ? '0 -50 160 480' : isRat ? '0 0 160 420' : '0 0 160 420',
    width:   isMermaid ? 190 : (isSpider && !boneMode) ? 260 : isPhoenix ? 180 : 160,
    height:  isMermaid ? 460 : (isSpider && !boneMode) ? 280 : isCentaur ? 405 : isPhoenix ? 405 : isHarpy ? 480 : 420,
    hasWings,
  };
}

// ─── CreatureCompositor component ────────────────────────────────────────────

interface CreatureCompositorProps {
  keywords: string[];
  animStyle?: React.CSSProperties;
}

export default function CreatureCompositor({ keywords, animStyle = {} }: CreatureCompositorProps) {
  // Inject CSS once
  React.useEffect(() => {
    const id = 'creature-compositor-css';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = COMPOSITOR_CSS;
      document.head.appendChild(tag);
    }
  }, []);

  const { parts, viewBox, width, height } = compositeCreature(keywords);
  const isOnFire = keywords.includes('phoenix');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ overflow: 'visible', ...animStyle }}
    >
      <g transform="translate(160,0) scale(-1,1)" className={isOnFire ? 'phoenix-on-fire' : undefined}>
        {parts}
      </g>
    </svg>
  );
}
