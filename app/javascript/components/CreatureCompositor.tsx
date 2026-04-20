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
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      <path d="M 110,104 C 122,110 130,130 132,158 L 120,162
               C 118,135 112,116 100,108 Z"/>
      <path d="M 120,160 C 124,180 126,205 124,232 L 113,234
               C 114,208 112,182 108,162 Z"/>
      <ellipse cx="118" cy="244" rx="10" ry="12" transform="rotate(-10,118,244)"/>
    </g>
  );
}

function HumanoidArmFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" stroke-width="2" stroke-linejoin="round">
      <path d="M 50,104 C 38,110 30,128 28,155 L 40,160
               C 42,133 48,115 58,108 Z"/>
      <path d="M 40,158 C 36,178 34,202 36,228 L 47,226
               C 46,202 48,178 51,158 Z"/>
      <ellipse cx="41" cy="238" rx="10" ry="12" transform="rotate(10,41,238)"/>
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
  const isCentaur  = has('centaur');
  const isMermaid  = has('mermaid');
  const isSkeleton = has('skeleton');
  const isLich     = has('lich');
  const isGhost    = has('ghost');
  const hasWings   = has('fly');

  // ghost affects only flesh-tagged parts
  const ghost = isGhost;

  // ── decide body plan ───────────────────────────────────────────
  // bone-mode: skeleton or lich replace flesh limbs/torso with bone equivalents
  const boneMode = isSkeleton || isLich;

  const parts: React.ReactNode[] = [];

  // ── 1. Wings go behind everything (handled by viewport as <object> layers)
  // Nothing to add inline for wings.

  // ── 2. Back-most elements first ───────────────────────────────
  if (!boneMode) {
    parts.push(<HumanoidArmBack key="arm-back" layer="flesh" ghost={ghost}/>);
  } else {
    parts.push(<SkeletonArmBack key="arm-back-bone"/>);
  }

  if (isCentaur) {
    parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
    parts.push(<HorseLeg key="horse-leg-br" cx={38} topY={224} ghost={ghost}/>);
    parts.push(<HorseLeg key="horse-leg-bn" cx={27} topY={222} ghost={ghost}/>);
  }

  if (!boneMode) {
    if (isMermaid) {
      // No back leg — tail replaces legs
    } else {
      parts.push(<HumanoidLegBack key="leg-back" layer="flesh" ghost={ghost}/>);
    }
  } else {
    if (!isMermaid) {
      parts.push(<SkeletonLegBack key="leg-back-bone"/>);
    }
  }

  // ── 3. Ribcage / pelvis drawn under torso (visible through ghost torso) ──
  // NOTE: intentionally omitted here — moved to after the main body so that
  // in centaur combos the skeleton floats in front of the horse barrel.

  // ── 4. Main body ──────────────────────────────────────────────
  if (isMermaid) {
    parts.push(<FishTail key="fish-tail" layer="flesh" ghost={ghost}/>);
  } else if (isCentaur) {
    parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost}/>);
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
  if (boneMode) {
    parts.push(<SkeletonRibcage key="ribcage"/>);
    parts.push(<SkeletonPelvis key="pelvis"/>);
    if (isLich) {
      parts.push(<SkeletonCracks key="cracks"/>);
    }
  }

  // ── 5. Head ───────────────────────────────────────────────────
  if (boneMode) {
    parts.push(<SkeletonSkull key="skull"/>);
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
    parts.push(<HumanoidArmFront key="arm-front" layer="flesh" ghost={ghost}/>);
  } else {
    parts.push(<SkeletonArmFront key="arm-front-bone"/>);
  }

  if (!boneMode) {
    if (!isMermaid) {
      parts.push(<HumanoidLegFront key="leg-front" layer="flesh" ghost={ghost}/>);
    }
  } else {
    if (!isMermaid) {
      parts.push(<SkeletonLegFront key="leg-front-bone"/>);
    }
  }

  // ── 7. Joint knobs always last ────────────────────────────────
  if (boneMode) {
    parts.push(<SkeletonJointKnobs key="joint-knobs" includeHips={!isMermaid}/>);
  }

  return {
    parts,
    viewBox: isMermaid ? '-30 0 220 460' : isCentaur ? '0 0 160 405' : '0 0 160 420',
    width:   isMermaid ? 190 : 160,
    height:  isMermaid ? 460 : isCentaur ? 405 : 420,
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

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ overflow: 'visible', ...animStyle }}
    >
      <g transform="translate(160,0) scale(-1,1)">
        {parts}
      </g>
    </svg>
  );
}
