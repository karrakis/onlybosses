import * as React from 'react';
import { PartProps, partClass, SpiderLimbAnchor, LegAnchor, Pt, HeadPt, EarAnchor, CrackSeg } from './types';

// ─── ═══════════════════════ FLESH PARTS ════════════════════════ ─────────────

// ── Upright humanoid torso (shoulders, body, waist, neck) ────────────────────
// 3/4 camera. Key anchors (pre-flip, right-facing):
//   Neck top: cx≈78 y=76  |  Shoulder back: cx≈48 y=102  |  Shoulder front: cx≈112 y=102
//   Hip band bottom: y=258 (matches leg / mermaid tail junction exactly)
export function UprightTorso({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinecap="round" strokeLinejoin="round">

      {/* Neck — slightly tapered column */}
      <path d="M 70,76 C 68,82 67,92 68,98 L 88,98 C 89,92 88,82 86,76 Z"
            fill="#f0ece2" stroke="black" strokeWidth="1.8"/>

      {/* Main torso — organic 3/4 silhouette
          Back (far) shoulder ≈(48,102); front (near) shoulder ≈(112,102).
          Curves inward at mid-chest then widens slightly to the waist block. */}
      <path d="M 48,102 C 34,108 30,128 32,152 C 34,175 40,194 46,206
               L 48,232 L 112,232 L 114,206
               C 120,194 126,175 128,152
               C 130,128 126,108 112,102 Z"
            fill="#f0ece2" stroke="black" strokeWidth="2"/>

      {/* Hip band — slightly warmer tone, connects torso to leg anchors at y=258 */}
      <path d="M 48,228 L 46,258 L 114,258 L 112,228 Z"
            fill="#e4dac8" stroke="black" strokeWidth="1.8"/>

      {/* Clavicle arcs */}
      <path d="M 72,100 C 63,104 56,106 48,103"
            fill="none" stroke="#c4b8a0" strokeWidth="1.3"/>
      <path d="M 88,100 C 97,104 104,106 112,103"
            fill="none" stroke="#c4b8a0" strokeWidth="1.3"/>

      {/* Pectoral line — gentle arch across upper chest */}
      <path d="M 52,130 C 62,136 73,138 80,138 C 87,138 98,136 108,130"
            fill="none" stroke="#c4b8a0" strokeWidth="1.1"/>

      {/* Upper abdominal crease */}
      <path d="M 50,196 C 60,200 72,202 80,202 C 88,202 100,200 110,196"
            fill="none" stroke="#c4b8a0" strokeWidth="1.0"/>

      {/* Navel */}
      <ellipse cx="80" cy="218" rx="2.5" ry="2" fill="#c8bfaf" stroke="none"/>

    </g>
  );
}

// ── Humanoid head (no eye — head type supplies the eye) ──────────────────────
export function HumanoidHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <ellipse cx="78" cy="48" rx="28" ry="30"/>
      {/* Eye */}
      <circle cx="92" cy="46" r="5" fill="black" stroke="none"/>
      <circle cx="94" cy="46" r="1.5" fill="white" stroke="none"/>
    </g>
  );
}

// ── Humanoid arm (back = creature's left = screen-right pre-flip) ─────────────
export function HumanoidArmBack({ ghost }: PartProps) {
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

export function HumanoidArmFront({ ghost }: PartProps) {
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
export function HumanoidLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 83,256 C 84,270 86,295 85,330 L 98,330
               C 99,295 100,270 100,256 Z"/>
      <path d="M 83,328 C 83,345 84,365 84,390 L 98,390
               C 98,365 99,345 98,328 Z"/>
      <path d="M 98,389 L 84,389 C 78,389 76,400 82,410
               C 88,413 96,411 101,407 C 103,403 101,394 98,389 Z"/>
    </g>
  );
}

export function HumanoidLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 60,256 C 61,270 62,295 62,330 L 75,330
               C 76,295 76,270 76,256 Z"/>
      <path d="M 60,328 C 60,345 60,365 60,390 L 74,390
               C 74,365 75,345 75,328 Z"/>
      <path d="M 74,389 L 60,389 C 54,389 52,400 58,410
               C 64,413 72,411 77,407 C 79,403 77,394 74,389 Z"/>
    </g>
  );
}

// ── Goblin parts ─────────────────────────────────────────────────────────────
export const GOBLIN_EAR_ANCHORS: EarAnchor[] = [
  { cx: 52, cy: 72, layer: 'back' },
  { cx: 104, cy: 72, layer: 'back' },
];
export const HUMANOID_EAR_ANCHORS: EarAnchor[] = [
  { cx: 88, cy: 25, layer: 'back' },
  { cx: 62, cy: 21, layer: 'back' },
];

export function GoblinEars({ ghost, anchors = GOBLIN_EAR_ANCHORS }: PartProps & { anchors?: EarAnchor[] }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} strokeLinejoin="round">
      {anchors.map(({ cx, cy }, i) => {
        const leftSide = cx <= 80;
        return (
          <path
            key={`goblin-ear-${i}`}
            d={leftSide
              ? `M ${cx},${cy} L ${cx - 16},${cy - 20} L ${cx - 6},${cy + 2} Z`
              : `M ${cx},${cy} L ${cx + 16},${cy - 20} L ${cx + 6},${cy + 2} Z`}
            fill="#57a53c"
            stroke="black"
            strokeWidth="2"
          />
        );
      })}
    </g>
  );
}

export function GoblinTorso({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinecap="round" strokeLinejoin="round">
      <path d="M 56,116 C 42,124 38,142 42,164 C 46,186 54,206 60,224
               L 58,246 L 100,246 L 102,222
               C 108,204 114,182 116,164
               C 118,142 114,124 100,116 Z"
            fill="#57a53c" stroke="black" strokeWidth="2"/>
      <path d="M 60,240 L 58,258 L 100,258 L 98,240 Z"
            fill="#4a9233" stroke="black" strokeWidth="1.8"/>
      <path d="M 63,156 C 74,162 86,164 96,160" fill="none" stroke="#3d7f2b" strokeWidth="1.1"/>
      <path d="M 62,198 C 72,203 85,205 96,200" fill="none" stroke="#3d7f2b" strokeWidth="1.0"/>
    </g>
  );
}

export function GoblinHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)} strokeLinejoin="round">
      <path d="M 50,66 C 54,50 66,38 82,38 C 98,38 110,50 112,66
               C 114,82 106,96 90,100 C 74,104 56,98 52,84 Z"
            fill="#66b245" stroke="black" strokeWidth="2"/>
      <ellipse cx="92" cy="63" rx="4.6" ry="5.2" fill="black" stroke="none"/>
      <ellipse cx="72" cy="64" rx="3.6" ry="4.2" fill="black" stroke="none" opacity="0.7"/>
      <path d="M 66,82 C 75,93 93,94 104,84" fill="none" stroke="black" strokeWidth="2.4" strokeLinecap="round"/>
      <polygon points="74,84 77,90 80,84" fill="white" stroke="black" strokeWidth="0.9"/>
      <polygon points="82,86 85,92 88,86" fill="white" stroke="black" strokeWidth="0.9"/>
      <polygon points="90,86 93,92 96,86" fill="white" stroke="black" strokeWidth="0.9"/>
      <polygon points="98,84 101,90 104,84" fill="white" stroke="black" strokeWidth="0.9"/>
    </g>
  );
}

export function GoblinArmBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#66b245" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 102,130 C 112,136 120,148 122,164 L 114,168
               C 111,153 104,141 95,136 Z"/>
      <path d="M 114,166 C 118,178 120,192 119,210 L 111,212
               C 112,194 110,180 106,167 Z"/>
      <ellipse cx="114" cy="220" rx="7" ry="9" transform="rotate(-10,114,220)"/>
    </g>
  );
}

export function GoblinArmFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#66b245" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 58,132 C 48,138 42,150 40,166 L 48,170
               C 50,154 56,142 64,136 Z"/>
      <path d="M 48,168 C 44,180 42,194 43,212 L 51,210
               C 50,194 52,180 56,168 Z"/>
      <ellipse cx="46" cy="220" rx="7" ry="9" transform="rotate(10,46,220)"/>
    </g>
  );
}

export function GoblinLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#66b245" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 81,256 C 82,268 83,286 82,312 L 93,312
               C 94,286 95,268 95,256 Z"/>
      <path d="M 82,310 C 82,323 83,338 83,356 L 94,356
               C 94,338 95,323 94,310 Z"/>
      <path d="M 94,355 L 82,355 C 77,355 75,364 79,372
               C 84,374 91,373 95,369 C 96,365 96,359 94,355 Z"/>
    </g>
  );
}

export function GoblinLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#66b245" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <path d="M 61,256 C 62,268 63,286 63,312 L 74,312
               C 75,286 75,268 75,256 Z"/>
      <path d="M 63,310 C 63,323 63,338 63,356 L 74,356
               C 74,338 75,323 75,310 Z"/>
      <path d="M 74,355 L 62,355 C 57,355 55,364 59,372
               C 64,374 71,373 75,369 C 76,365 76,359 74,355 Z"/>
    </g>
  );
}

// ── Horse barrel ──────────────────────────────────────────────────────────────
export function HorseBarrel({ ghost, fill = 'white' }: PartProps & { fill?: string }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={fill} stroke="black" strokeWidth="2">
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
export function HorseLeg({ cx, topY, ghost, fill = 'white' }: { cx: number; topY: number; ghost?: boolean; fill?: string }) {
  const kneeY = topY + 76;
  const hoofY = topY + 152;
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={fill} stroke="black" strokeWidth="2">
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
export function HorseTail({ ghost }: PartProps) {
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

export function HorseRibcage() {
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

export function HorsePelvis() {
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
export function HorseLegBone({ cx, topY }: { cx: number; topY: number }) {
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

// ── Phoenix torso ─────────────────────────────────────────────────────────────
// Top-heavy vertical oval matching the original phoenix.svg.
// The head is rendered before this so the body bites into the head base.
// All y-coords shifted -20 vs the original SVG (which had -20 baked into its group transform).
export function PhoenixTorso({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinejoin="round">
      <path d="M 78,110 C 120,112 107,272 78,275 C 49,272 36,112 78,110 Z"
            fill="#d66379" stroke="black" strokeWidth="2"/>
    </g>
  );
}

// ── Phoenix bird legs ───────────────────────────────────────────────────────────
// Legs moved 33% toward each other from the prior stance (x shift: ±28).
// Lower leg + claw block is flipped 180deg around each knee, then claws are
// rebuilt with shorter two-joint claws that splay outward from each leg.
export function PhoenixLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeLinecap="round">
      {/* Hip and knee shifted toward center; lower leg rotated 180 around knee */}
      <path d="M 66,195 L 58,245" strokeWidth="7"/>
      <path d="M 58,245 L 40,195" strokeWidth="5"/>
      {/* Short outward talons (two joints each) */}
      <path d="M 40,195 L 34,198 L 30,204 L 28,210" strokeWidth="3"/>
      <path d="M 40,195 L 35,202 L 32,208 L 30,214" strokeWidth="2"/>
      <path d="M 40,195 L 37,205 L 35,211 L 34,217" strokeWidth="2"/>
    </g>
  );
}

export function PhoenixLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="none" stroke="black" strokeLinecap="round">
      {/* Hip and knee shifted toward center; lower leg rotated 180 around knee */}
      <path d="M 94,195 L 102,245" strokeWidth="7"/>
      <path d="M 102,245 L 120,195" strokeWidth="5"/>
      {/* Short outward talons (two joints each), mirrored rightward */}
      <path d="M 120,195 L 126,198 L 130,204 L 132,210" strokeWidth="3"/>
      <path d="M 120,195 L 125,202 L 128,208 L 130,214" strokeWidth="2"/>
      <path d="M 120,195 L 123,205 L 125,211 L 126,217" strokeWidth="2"/>
    </g>
  );
}

// Tail fan: apex at (78,237) is inside the body; clip hides everything above
// the body bottom (y=275) so only the fan below emerges.
// Drawn early in the stack so legs and torso both render on top.
export function PhoenixTail({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <defs>
        <clipPath id="cc-tailClip">
          <rect x="-50" y="255" width="300" height="200"/>
        </clipPath>
      </defs>
      <polygon points="78,217 52,292 104,292"
               fill="#e5788e" stroke="black" strokeWidth="2" strokeLinejoin="round"
               clipPath="url(#cc-tailClip)"/>
    </g>
  );
}

// Beak: drawn before head so the head ellipse overlaps its base (y shifted -20).
export function PhoenixBeak({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#f5a9b8" stroke="black" strokeWidth="2" strokeLinejoin="round">
      <polygon points="134,98 99,92 99,105"/>
    </g>
  );
}

// Head: ellipse matching original phoenix.svg (y shifted -20 vs original).
// Body is pushed after this so the oval bites into the head base.
export function PhoenixHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinejoin="round">
      <ellipse cx="78" cy="98" rx="21" ry="20"
               fill="#df6d84" stroke="black" strokeWidth="2"/>
      <circle cx="86" cy="92" r="3.5" fill="black" stroke="none"/>
      <circle cx="87" cy="91" r="1"   fill="white" stroke="none"/>
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
export function HarpyCrest({ ghost }: PartProps) {
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
export function HarpyTeeth({ ghost }: PartProps) {
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
export function HarpyLegBack({ ghost }: PartProps) {
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

export function HarpyLegFront({ ghost }: PartProps) {
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

// ─── Spider limb anchors for upright humanoid torso ───────────────────────────
// 8 anchors: 4 at shoulders (2 per side), 4 at hips (2 per side).
// layer:'back' anchors render before the body; layer:'front' render after.
// knee/tip offsets are relative to the root so geometry travels with the anchor.
export const HUMANOID_SPIDER_LIMB_ANCHORS: SpiderLimbAnchor[] = [
  // Back shoulder (110, 104) — upper limb fans upward-right (behind body)
  { x: 110, y: 104, knee: { dx:  26, dy: -36 }, tip: { dx:  22, dy: -36 }, layer: 'back',  amp: 3.5, dur: 2.2, phase: 0.0 },
  // Back shoulder — lower limb fans downward-right (in front of body)
  { x: 110, y: 104, knee: { dx:  30, dy:  21 }, tip: { dx:  22, dy:  27 }, layer: 'front', amp: 3.0, dur: 1.9, phase: 0.5 },
  // Front shoulder (46, 104) — upper limb fans upward-left (behind body)
  { x:  46, y: 104, knee: { dx: -26, dy: -36 }, tip: { dx: -22, dy: -36 }, layer: 'back',  amp: 3.5, dur: 2.0, phase: 0.3 },
  // Front shoulder — lower limb fans downward-left (in front of body)
  { x:  46, y: 104, knee: { dx: -24, dy:  21 }, tip: { dx: -22, dy:  27 }, layer: 'front', amp: 3.0, dur: 2.3, phase: 0.8 },
  // Back hip (90, 262) — two limbs fan downward-right (behind body)
  { x:  90, y: 262, knee: { dx:  34, dy:  52 }, tip: { dx:  18, dy:  64 }, layer: 'back',  amp: 2.5, dur: 2.1, phase: 0.1 },
  { x:  90, y: 262, knee: { dx:  26, dy:  70 }, tip: { dx:  12, dy:  68 }, layer: 'back',  amp: 2.0, dur: 1.8, phase: 0.6 },
  // Front hip (66, 262) — two limbs fan downward-left (in front of body)
  { x:  66, y: 262, knee: { dx: -34, dy:  52 }, tip: { dx: -18, dy:  64 }, layer: 'front', amp: 2.5, dur: 2.3, phase: 0.4 },
  { x:  66, y: 262, knee: { dx: -26, dy:  70 }, tip: { dx: -12, dy:  68 }, layer: 'front', amp: 2.0, dur: 1.9, phase: 0.9 },
];

// ─── Slime goop silhouette pts ────────────────────────────────────────────────
export const HUMANOID_SLIME_GOOP_PTS: Pt[] = [
  [78,18],[118,44],[130,100],[148,200],[130,260],[110,420],[66,420],[46,260],[28,200],[26,100],[36,44],
];
// ─── Leg anchors ──────────────────────────────────────────────────────────────
export const HUMANOID_LEG_ANCHORS: LegAnchor[] = [
  { key: 'leg-back',  layer: 'back',  slot: 'hind', type: 'biped', goatTx: 0 },
  { key: 'leg-front', layer: 'front', slot: 'fore', type: 'biped', goatTx: 0 },
];
export const HARPY_LEG_ANCHORS: LegAnchor[] = [
  { key: 'harpy-leg-back',  layer: 'back',  slot: 'hind', type: 'harpy', goatTx: 0 },
  { key: 'harpy-leg-front', layer: 'front', slot: 'fore', type: 'harpy', goatTx: 0 },
];
export const PHOENIX_LEG_ANCHORS: LegAnchor[] = [
  { key: 'bird-leg-back',  layer: 'front', variant: 'back',  slot: 'hind', type: 'phoenix', cx: 66, topY: 195, goatTx: 0 },
  { key: 'bird-leg-front', layer: 'front', variant: 'front', slot: 'fore', type: 'phoenix', cx: 94, topY: 195, goatTx: 0 },
];
export const GOBLIN_LEG_ANCHORS: LegAnchor[] = [
  { key: 'goblin-leg-back',  layer: 'back',  slot: 'hind', type: 'goblin', goatTx: 0 },
  { key: 'goblin-leg-front', layer: 'front', slot: 'fore', type: 'goblin', goatTx: 0 },
];

// Wing root anchor on the phoenix torso back (pre-flip canvas coords).
// External fly wings pin their path origin to this point via CreaturePlayground.
export const PHOENIX_WING_ANCHOR: HeadPt = { cx: 92, cy: 132 };
export const GOBLIN_WING_ANCHOR: HeadPt = { cx: 80, cy: 132 };

// ─── Head overlay anchors ─────────────────────────────────────────────────────
// Eye positions match the SkeletonSkull orbit centres.
// Crown anchor: center of the base band (authored at cx=78, cy=22).
export const HUMANOID_EYE_ANCHORS:  HeadPt[] = [{ cx: 91, cy: 40 }, { cx: 63, cy: 40 }];
export const HUMANOID_CROWN_ANCHOR: HeadPt   = { cx: 78, cy: 22 };

// Crack segments for lich mode. Points extracted from the humanoid SkeletonCracks geometry.
export const HUMANOID_CRACK_SEGS: CrackSeg[] = [
  { pts: [[82,18],[79,28],[85,36],[80,48],[77,55]], w: 1.2 },           // skull top
  { pts: [[94,32],[90,42],[96,52],[92,66],[96,74]], w: 1.0 },           // cheek
  { pts: [[85,100],[82,115],[88,130],[83,148],[89,165],[84,183],[88,200],[83,220],[87,240]], w: 1.3 }, // spine
  { pts: [[70,228],[75,238],[68,250],[73,262],[69,272]], w: 1.0 },      // pelvis
  { pts: [[91,270],[88,290],[93,310],[89,325]], w: 1.0 },               // back thigh
  { pts: [[68,330],[71,350],[66,370],[70,390]], w: 1.0 },               // front shin
  { pts: [[114,115],[118,135],[115,155],[119,175],[116,200]], w: 1.0 }, // far rib side
];

// ─── Phoenix anchor exports ───────────────────────────────────────────────────
// Anchors match the dedicated phoenix head/skull position.
// Slime goop wraps the compact bird-leg silhouette (thigh-stump + back-talons ~y=312).
export const PHOENIX_EYE_ANCHORS: HeadPt[] = [{ cx: 86, cy: 92 }];
export const PHOENIX_CROWN_ANCHOR: HeadPt = { cx: 78, cy: 74 };
export const PHOENIX_CRACK_SEGS: CrackSeg[] = [
  { pts: [[80,82],[77,92],[82,101],[78,110]], w: 1.2 },
  { pts: [[85,116],[82,130],[87,146],[83,162],[87,178],[84,194],[88,210]], w: 1.25 },
  { pts: [[66,184],[70,195],[64,208],[69,219]], w: 1.0 },
  { pts: [[92,186],[96,198],[91,211],[95,223]], w: 1.0 },
  { pts: [[62,205],[58,222],[54,237]], w: 0.95 },
  { pts: [[98,205],[102,222],[106,237]], w: 0.95 },
  { pts: [[78,236],[76,251],[80,266],[77,282]], w: 1.0 },
];
export const PHOENIX_SLIME_GOOP_PTS: Pt[] = [
  [78,18],[118,44],[130,100],[148,200],[130,260],
  [136,268],[100,312],[56,312],[20,268],
  [26,260],[28,200],[26,100],[36,44],
];

// ─── Harpy anchor exports ─────────────────────────────────────────────────────
// Harpy also uses bpHead at humanoid position; SkeletonLegBack/Front in bone mode.
// Slime goop wraps the full harpy silhouette including long talon-tipped legs (~y=428).
export const HARPY_EYE_ANCHORS:    HeadPt[]   = HUMANOID_EYE_ANCHORS;
export const HARPY_CROWN_ANCHOR:   HeadPt     = HUMANOID_CROWN_ANCHOR;
export const HARPY_CRACK_SEGS:     CrackSeg[] = HUMANOID_CRACK_SEGS;
export const HARPY_SLIME_GOOP_PTS: Pt[] = [
  [78,18],[118,44],[130,100],[148,200],[130,260],
  [102,256],[120,408],[84,428],[68,390],[40,408],[60,256],
  [28,260],[26,200],[26,100],[36,44],
];

// ─── Goblin anchor exports ───────────────────────────────────────────────────
export const GOBLIN_EYE_ANCHORS: HeadPt[] = [{ cx: 92, cy: 63 }];
export const GOBLIN_CROWN_ANCHOR: HeadPt = { cx: 82, cy: 44 };
export const GOBLIN_CRACK_SEGS: CrackSeg[] = [
  { pts: [[84,44],[80,54],[86,62],[82,72]], w: 1.2 },
  { pts: [[87,104],[84,120],[90,136],[86,154],[91,172],[87,190],[92,208]], w: 1.2 },
  { pts: [[96,130],[101,146],[99,164],[103,182]], w: 1.0 },
  { pts: [[68,132],[64,148],[67,165],[63,182]], w: 1.0 },
  { pts: [[86,250],[84,268],[88,286],[85,308]], w: 1.0 },
];
export const GOBLIN_SLIME_GOOP_PTS: Pt[] = [
  [82,38],[108,56],[122,110],[126,180],[112,258],[92,372],[64,372],[48,258],[38,180],[44,110],[58,56],
];

