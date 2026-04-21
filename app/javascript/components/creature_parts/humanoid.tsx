]633;E;cat <<'HDR'\x0aimport * as React from 'react'\x3b\x0aimport { PartProps, partClass } from './types'\x3b\x0a\x0aHDR\x0a;30c7a7c9-8c3d-493f-9276-242eba80cd54]633;Cimport * as React from 'react';
import { PartProps, partClass } from './types';

// ─── ═══════════════════════ FLESH PARTS ════════════════════════ ─────────────

// ── Upright humanoid torso (shoulders, body, waist, neck) ────────────────────
export function UprightTorso({ ghost }: PartProps) {
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
export function HumanoidHead({ ghost }: PartProps) {
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

export function HumanoidLegFront({ ghost }: PartProps) {
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
export function HorseBarrel({ ghost, fill = 'white' }: PartProps & { fill?: string }) {
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
export function HorseLeg({ cx, topY, ghost, fill = 'white' }: { cx: number; topY: number; ghost?: boolean; fill?: string }) {
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

// ── Fish tail (mermaid) ───────────────────────────────────────────────────────
export function FishTail({ ghost }: PartProps) {
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
export function PhoenixLegBack({ ghost }: PartProps) {
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

export function PhoenixLegFront({ ghost }: PartProps) {
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
export function PhoenixTail({ ghost }: PartProps) {
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
export function PhoenixBeak({ ghost }: PartProps) {
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

