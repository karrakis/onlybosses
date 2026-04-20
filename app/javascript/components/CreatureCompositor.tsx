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
function HorseBarrel({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2">
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
function HorseLeg({ cx, topY, ghost }: { cx: number; topY: number; ghost?: boolean }) {
  const kneeY = topY + 76;
  const hoofY = topY + 152;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2">
      <line x1={cx} y1={topY}   x2={cx - 2} y2={kneeY} stroke="black" strokeWidth="10" strokeLinecap="round"/>
      <line x1={cx} y1={topY}   x2={cx - 2} y2={kneeY} stroke="white" strokeWidth="6"  strokeLinecap="round"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}  y2={hoofY} stroke="black" strokeWidth="8"  strokeLinecap="round"/>
      <line x1={cx - 2} y1={kneeY} x2={cx}  y2={hoofY} stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
      {/* hoof */}
      <line x1={cx - 6} y1={hoofY - 2} x2={cx + 6} y2={hoofY} stroke="#333" strokeWidth="9" strokeLinecap="round"/>
      {/* knee knob */}
      <circle cx={cx - 2} cy={kneeY} r="5.5" fill="white" stroke="black" strokeWidth="1.5"/>
    </g>
  );
}

// ── Horse tail ────────────────────────────────────────────────────────────────
function HorseTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeLinecap="round">
      <path d="M 11,176 C 3,190 2,212 6,232 C 10,246 15,255 11,268 C 8,278 4,284 4,294"
            strokeWidth="7"/>
      <path d="M 14,178 C 8,192 8,212 12,228 C 16,240 21,248 18,260 C 15,269 11,276 12,284"
            strokeWidth="4"/>
      <path d="M 17,180 C 12,195 13,213 16,228 C 19,238 22,244 20,255"
            strokeWidth="2.5"/>
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

function LichEyes() {
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
      <circle className="eye-glow" cx="91" cy="40" r="12" fill="url(#cc-eyeGlow)" stroke="none" filter="url(#cc-redBloom)"/>
      <circle className="eye-glow" cx="63" cy="40" r="12" fill="url(#cc-eyeGlow)" stroke="none" filter="url(#cc-redBloom)"/>
      <circle className="eye-orb"  cx="91" cy="40" r="7"  fill="#dd2222" stroke="#ff6666" strokeWidth="0.8" filter="url(#cc-redBloom)"/>
      <circle className="eye-orb"  cx="63" cy="40" r="7"  fill="#dd2222" stroke="#ff6666" strokeWidth="0.8" filter="url(#cc-redBloom)"/>
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
  const isSkeleton = has('skeleton');
  const isLich     = has('lich');
  const isGhost    = has('ghost');
  const hasWings   = has('fly');

  // arms are a human/centaur feature — phoenixes and spiders don't have arms
  // (unless spider+boneMode, where bone arms are drawn regardless)
  const boneMode = isSkeleton || isLich;
  const boneSpider = isSpider && boneMode;

  const usesArms = (isHuman || isCentaur) && !(isSpider && !boneMode);

  // ghost affects only flesh-tagged parts
  const ghost = isGhost;

  // human legs are an explicit feature — suppressed by mermaid (fish tail),
  // phoenix (bird legs instead), and spider-only (8 spider legs instead).
  // spider+boneMode: bone legs still render (spider adds EXTRA legs on top).
  const usesHumanLegs = !isMermaid && !isPhoenix && !(isSpider && !boneMode);

  const parts: React.ReactNode[] = [];

  // ── 1. Wings go behind everything (handled by viewport as <object> layers)
  // Nothing to add inline for wings.

  // ── 2. Back-most elements first ───────────────────────────────
  if (!boneMode) {
    if (usesArms) {
      parts.push(<HumanoidArmBack key="arm-back" layer="flesh" ghost={ghost}/>);
    }
  } else {
    // boneSpider: bonus arms go behind the torso (back pair) alongside regular arm
    if (boneSpider) {
      parts.push(<SpiderBonusArms key="spider-bonus-arms"/>);
    }
    parts.push(<SkeletonArmBack key="arm-back-bone"/>);
  }

  if (isCentaur) {
    if (boneMode) {
      parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      parts.push(<HorseLegBone key="horse-leg-br" cx={38} topY={224}/>);
      parts.push(<HorseLegBone key="horse-leg-bn" cx={27} topY={222}/>);
    } else {
      parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      parts.push(<HorseLeg key="horse-leg-br" cx={38} topY={224} ghost={ghost}/>);
      parts.push(<HorseLeg key="horse-leg-bn" cx={27} topY={222} ghost={ghost}/>);
    }
  }

  // Phoenix tail goes before the back leg so legs render on top of it.
  // Apex is inside the torso area; torso is drawn later and covers the top half.
  if (isPhoenix && !boneMode) {
    parts.push(<PhoenixTail key="phoenix-tail" layer="flesh" ghost={ghost}/>);
  }

  if (!boneMode) {
    if (usesHumanLegs) {
      parts.push(<HumanoidLegBack key="leg-back" layer="flesh" ghost={ghost}/>);
    } else if (isPhoenix && !isSpider) {
      // For spider+phoenix the back leg is deferred to section 6 so it renders
      // in front of the spider abdomen, not behind it.
      parts.push(<PhoenixLegBack key="bird-leg-back" layer="flesh" ghost={ghost}/>);
    }
  } else if (!isMermaid) {
    if (boneSpider) {
      parts.push(<SpiderBonusLegs key="spider-bonus-legs"/>);
    }
    parts.push(<SkeletonLegBack key="leg-back-bone"/>);
  }

  // ── 3. Ribcage / pelvis drawn under torso (visible through ghost torso) ──
  // NOTE: intentionally omitted here — moved to after the main body so that
  // in centaur combos the skeleton floats in front of the horse barrel.

  // ── 4. Main body ──────────────────────────────────────────────
  if (isMermaid) {
    parts.push(<FishTail key="fish-tail" layer="flesh" ghost={ghost}/>);
  } else if (isSpider && !boneMode) {
    // Pure spider (no bone mode): spider body plan takes over.
    // Draw order: horse barrel (if centaur) → legs (over barrel) → abdomen.
    if (isCentaur) {
      parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost}/>);
    }
    parts.push(<SpiderLegs  key="spider-legs"  ghost={ghost}/>);
    parts.push(<SpiderBody  key="spider-body"  ghost={ghost}/>);
    parts.push(<SpiderHairs key="spider-hairs" ghost={ghost}/>);
  } else if (isCentaur) {
    // In bone mode the barrel is suppressed (bones replace flesh entirely).
    // Ghost overrides this: the faded barrel silhouette is a desirable effect.
    if (!boneMode || ghost) {
      parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost}/>);
    }
    if (!boneMode) {
      parts.push(<UprightTorso key="torso" layer="flesh" ghost={ghost}/>);
    }
  } else {
    if (!boneMode) {
      parts.push(<UprightTorso key="torso" layer="flesh" ghost={ghost}/>);
    }
  }

  // ── 4b. Skeleton internals — rendered AFTER horse barrel so they are
  //        always in the foreground (centaur lich/skeleton fix) ────────────
  // boneSpider: ribcage/pelvis still render over the humanoid torso.
  if (boneMode) {
    if (isCentaur) {
      parts.push(<HorseRibcage key="horse-ribcage"/>);
      parts.push(<HorsePelvis key="horse-pelvis"/>);
    }
    parts.push(<SkeletonRibcage key="ribcage"/>);
    parts.push(<SkeletonPelvis key="pelvis"/>);
    if (isLich) {
      parts.push(<SkeletonCracks key="cracks"/>);
    }
  }

  // ── 5. Head ───────────────────────────────────────────────────
  // Phoenix beak goes before head so the cranium overlaps the beak base.
  if (isPhoenix && !boneMode && !isSpider) {
    parts.push(<PhoenixBeak key="phoenix-beak" layer="flesh" ghost={ghost}/>);
  }
  if (isSpider && !boneMode) {
    // Pure spider: SpiderBody has the head ellipse; add eyes.
    parts.push(<SpiderEyes key="spider-eyes" ghost={ghost}/>);
  } else if (boneMode) {
    parts.push(<SkeletonSkull key="skull"/>);
    if (boneSpider) {
      // Extra 6 spider eyes around the skull sockets.
      parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
    }
  } else {
    parts.push(<HumanoidHead key="head" layer="flesh" ghost={ghost}/>);
  }

  // Lich crown + glowing eyes sit over skull
  if (isLich) {
    parts.push(<LichCrown key="lich-crown"/>);
    parts.push(<LichEyes key="lich-eyes"/>);
  }

  // ── 6. Front limbs (in front of body) ────────────────────────
  if (!boneMode) {
    if (usesArms) {
      parts.push(<HumanoidArmFront key="arm-front" layer="flesh" ghost={ghost}/>);
    }
  } else {
    parts.push(<SkeletonArmFront key="arm-front-bone"/>);
  }

  if (!boneMode) {
    if (usesHumanLegs) {
      parts.push(<HumanoidLegFront key="leg-front" layer="flesh" ghost={ghost}/>);
    } else if (isPhoenix) {
      if (isSpider) {
        // Both bird legs deferred here so they render in front of spider abdomen.
        parts.push(<PhoenixLegBack  key="bird-leg-back"  layer="flesh" ghost={ghost}/>);
      }
      parts.push(<PhoenixLegFront key="bird-leg-front" layer="flesh" ghost={ghost}/>);
    }
  } else if (!isMermaid) {
    parts.push(<SkeletonLegFront key="leg-front-bone"/>);
  }

  // ── 7. Joint knobs always last ────────────────────────────────
  if (boneMode) {
    parts.push(<SkeletonJointKnobs key="joint-knobs" includeHips={!isMermaid}/>);
  }

  // ── 8. Flames on top of everything ───────────────────────────
  if (isPhoenix) {
    parts.push(<PhoenixFlames key="phoenix-flames"/>);
  }

  return {
    parts,
    viewBox: isMermaid ? '-30 0 220 460' : (isSpider && !boneMode) ? '-70 0 310 330' : boneSpider ? '-30 -10 220 450' : isCentaur ? '0 0 160 405' : isPhoenix ? '-20 -30 200 450' : '0 0 160 420',
    width:   isMermaid ? 190 : (isSpider && !boneMode) ? 260 : isPhoenix ? 180 : 160,
    height:  isMermaid ? 460 : (isSpider && !boneMode) ? 280 : isCentaur ? 405 : isPhoenix ? 405 : 420,
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
