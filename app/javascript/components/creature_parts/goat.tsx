import * as React from 'react';
import { PartProps, partClass, SpiderLimbAnchor, LegAnchor, Pt, HeadPt, CrackSeg } from './types';

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
// ── GoatBody — flesh over GoatSkeletonBody, same 3/4 camera angle ───────────
// Mountain goat: warm off-white coat (#e8e2d4), tan shadow areas (#c8bfaa),
// dark horn/hoof (#1a1410). Both amber slit eyes visible (near larger).
// Drawing order: far hind → tail → far front → body barrel →
//                near hind → near front → neck → far ear →
//                head + snout → near ear → beard → horns → eyes.
export function GoatBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinecap="round" strokeLinejoin="round">

      {/* ── FAR HIND LEG ── */}
      {/* Thigh: hip(29,194)→stifle(40,250) */}
      <path d="M 22,195 C 22,218 30,238 34,252
               C 38,252 47,250 46,248
               C 46,231 40,210 36,193 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="0.8"/>
      {/* Gaskin: stifle(40,250)→hock(26,312) — Z-bend back */}
      <path d="M 33,253 C 24,276 18,298 18,314
               C 22,315 33,315 34,313
               C 36,297 41,272 47,250 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.8"/>
      {/* Cannon: hock(26,312)→fetlock(30,360) */}
      <path d="M 20,313 L 24,362 L 36,362 L 32,313 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.7"/>
      {/* Cloven hooves */}
      <path d="M 21,362 L 19,406 L 28,406 L 29,362 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
      <path d="M 29,362 L 29,406 L 37,406 L 37,362 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>

      {/* ── TAIL — short white bob ── */}
      <ellipse cx="16" cy="208" rx="6" ry="8"
               fill="#e8e4d8" stroke="#b0a890" strokeWidth="0.8"/>

      {/* ── FAR FRONT LEG ── */}
      {/* Upper: shoulder(102,178)→elbow(104,220) */}
      <path d="M 96,178 C 95,196 98,212 100,222
               L 110,221 C 109,209 110,193 109,177 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="0.8"/>
      {/* Forearm: elbow(104,220)→carpus(104,270) */}
      <path d="M 99,222 L 99,272 L 110,272 L 111,221 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.8"/>
      {/* Cannon: carpus(104,270)→fetlock(105,328) */}
      <path d="M 99,272 L 100,330 L 110,330 L 110,272 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.7"/>
      {/* Cloven hooves */}
      <path d="M 97,330 L 96,406 L 106,406 L 105,330 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
      <path d="M 105,330 L 106,406 L 115,406 L 113,330 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>

      {/* ── BODY BARREL ── */}
      <path d="M 110,163
               C 80,163 50,178 22,198
               C 13,205 10,218 16,234
               C 22,244 36,253 52,255
               C 65,258 84,256 100,248
               C 112,242 124,229 130,213
               C 134,202 130,183 122,173
               C 118,166 114,162 110,163 Z"
            fill="#e8e2d4" stroke="#9a8a70" strokeWidth="1"/>
      {/* Belly shading */}
      <path d="M 38,255 C 58,262 82,260 104,250"
            fill="none" stroke="#c8bfaa" strokeWidth="5"/>
      {/* Haunch muscle line */}
      <path d="M 22,198 C 18,210 18,224 24,234"
            fill="none" stroke="#b0a080" strokeWidth="1.5"/>
      {/* Shoulder/scapula contour */}
      <path d="M 114,163 C 118,170 118,182 114,192 C 110,200 106,206 106,214"
            fill="none" stroke="#b0a080" strokeWidth="1.5"/>

      {/* ── NEAR HIND LEG ── */}
      {/* Thigh: hip(42,192)→stifle(54,249) */}
      <path d="M 33,191 C 32,213 42,237 46,253
               C 52,255 64,252 62,248
               C 60,232 54,208 52,190 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="1"/>
      {/* Gaskin: stifle(54,249)→hock(39,312) */}
      <path d="M 44,254 C 34,278 28,298 28,315
               C 33,317 50,316 51,313
               C 52,297 56,273 62,250 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="1"/>
      {/* Cannon: hock(39,312)→fetlock(44,360) */}
      <path d="M 30,313 L 36,362 L 52,362 L 48,313 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.9"/>
      {/* Cloven hooves */}
      <path d="M 32,362 L 28,408 L 42,408 L 42,362 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
      <path d="M 42,362 L 42,408 L 55,408 L 51,362 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>

      {/* ── NEAR FRONT LEG ── */}
      {/* Upper: shoulder(114,176)→elbow(116,219) */}
      <path d="M 106,175 C 105,193 110,210 112,222
               C 118,224 126,221 124,218
               C 123,207 122,190 120,174 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="1"/>
      {/* Forearm: elbow(116,219)→carpus(116,270) */}
      <path d="M 111,222 L 110,273 L 124,273 L 125,220 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="1"/>
      {/* Cannon: carpus(116,270)→fetlock(117,328) */}
      <path d="M 110,273 L 110,330 L 124,330 L 125,273 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.9"/>
      {/* Cloven hooves */}
      <path d="M 107,330 L 106,408 L 120,408 L 117,330 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
      <path d="M 118,330 L 120,408 L 131,408 L 128,330 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>

      {/* ── NECK ── */}
      <path d="M 100,173
               C 104,157 110,140 115,124
               C 118,110 121,96 124,86
               L 133,90
               C 130,100 128,114 126,128
               C 122,144 118,160 123,174 Z"
            fill="#e8e2d4" stroke="#9a8a70" strokeWidth="0.9"/>
      {/* Throat/underside shading */}
      <path d="M 124,86 C 127,100 126,116 124,130 C 122,145 120,160 121,174"
            fill="none" stroke="#c8bfaa" strokeWidth="3.5"/>

      {/* ── FAR EAR ── */}
      <path d="M 112,36 C 107,26 102,22 100,28 C 98,36 104,50 113,52
               C 117,50 114,40 112,36 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="0.8"/>
      <path d="M 112,38 C 108,30 104,27 103,33 C 102,40 107,50 113,52"
            fill="none" stroke="#d09880" strokeWidth="1.2"/>

      {/* ── HEAD ── */}
      {/* Cranium */}
      <ellipse cx="128" cy="54" rx="24" ry="27"
               fill="#e8e2d4" stroke="#9a8a70" strokeWidth="1"/>
      {/* Poll/forehead shading */}
      <path d="M 112,34 C 118,26 130,24 140,30 C 142,38 136,48 126,50
               C 118,50 112,44 112,34 Z"
            fill="#c8bfaa" stroke="none"/>
      {/* Cheek / zygomatic line */}
      <path d="M 150,62 C 154,68 156,76 152,85"
            fill="none" stroke="#9a8a70" strokeWidth="1.2"/>
      {/* Snout — same path as skeleton premaxilla */}
      <path d="M 136,66 C 145,64 158,66 160,74 C 162,82 156,92 148,94
               C 140,96 134,90 133,82 C 132,74 133,68 136,66 Z"
            fill="#e8e2d4" stroke="#9a8a70" strokeWidth="0.9"/>
      {/* Bridge of nose shading */}
      <path d="M 138,67 C 146,65 155,67 159,73"
            fill="none" stroke="#c8bfaa" strokeWidth="2.5"/>
      {/* Nostrils */}
      <ellipse cx="157" cy="72" rx="2.5" ry="2"  fill="#2a1810"/>
      <ellipse cx="157" cy="80" rx="2"   ry="1.8" fill="#2a1810"/>
      {/* Mouth line */}
      <path d="M 136,82 C 142,86 150,88 156,85"
            fill="none" stroke="#9a8a70" strokeWidth="1"/>
      {/* Lower lip */}
      <path d="M 136,85 C 142,92 150,94 155,90"
            fill="#ddd5c0" stroke="#9a8a70" strokeWidth="0.8"/>

      {/* ── NEAR EAR ── */}
      <path d="M 143,34 C 150,22 158,18 160,26 C 162,34 156,48 146,50
               C 142,46 141,38 143,34 Z"
            fill="#e8e2d4" stroke="#9a8a70" strokeWidth="1"/>
      {/* Ear concha (inner surface pink-ish) */}
      <path d="M 144,37 C 150,26 157,23 158,30 C 158,38 153,46 146,48"
            fill="none" stroke="#d09880" strokeWidth="1.5"/>

      {/* ── BEARD ── */}
      <path d="M 150,100 L 148,116 M 153,98 L 152,114 M 155,97 L 155,113
               M 147,101 L 145,117 M 143,103 L 141,119"
            fill="none" stroke="#e8e2d4" strokeWidth="1.5" strokeLinecap="round"/>

      {/* ── HORNS ── */}
      {/* Far horn — darker, behind near */}
      <path d="M 123,32 C 120,22 113,14 108,10 C 104,8 101,12 104,20
               C 106,26 112,28 116,24"
            fill="none" stroke="#5a4010" strokeWidth="7" strokeLinecap="round"/>
      <path d="M 123,32 C 120,22 113,14 108,10 C 104,8 101,12 104,20
               C 106,26 112,28 116,24"
            fill="none" stroke="#9a7a20" strokeWidth="4.5" strokeLinecap="round"/>
      {/* Near horn — brighter, in front */}
      <path d="M 132,28 C 128,18 121,10 115,6 C 111,4 108,8 111,16
               C 113,23 119,25 123,21 C 127,18 126,12 121,10"
            fill="none" stroke="#5a4010" strokeWidth="9" strokeLinecap="round"/>
      <path d="M 132,28 C 128,18 121,10 115,6 C 111,4 108,8 111,16
               C 113,23 119,25 123,21 C 127,18 126,12 121,10"
            fill="none" stroke="#c8a030" strokeWidth="5.5" strokeLinecap="round"/>
      {/* Near horn highlight */}
      <path d="M 132,28 C 128,18 121,10 115,6"
            fill="none" stroke="#e8c84a" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Annulation rings */}
      <path d="M 130,24 C 127,22 124,22 122,24" fill="none" stroke="#5a4010" strokeWidth="2"/>
      <path d="M 126,17 C 123,15 120,15 118,17" fill="none" stroke="#5a4010" strokeWidth="1.6"/>
      <path d="M 120,11 C 117,9  114,9  113,11" fill="none" stroke="#5a4010" strokeWidth="1.2"/>

      {/* ── EYES ── */}
      {/* Far eye — smaller/dimmer */}
      <ellipse cx="118" cy="46" rx="6"   ry="5.5"
               fill="#c4850a" stroke="#2a1800" strokeWidth="0.8"/>
      <ellipse cx="118" cy="46" rx="4.5" ry="1.5"
               fill="#1a0800" stroke="none"/>
      <circle  cx="119" cy="45" r="1"
               fill="white" stroke="none" opacity="0.6"/>
      {/* Near eye — larger, prominent */}
      <ellipse cx="144" cy="47" rx="8" ry="7"
               fill="#c4850a" stroke="#2a1800" strokeWidth="1"/>
      <ellipse cx="144" cy="47" rx="6" ry="2"
               fill="#1a0800" stroke="none"/>
      <circle  cx="146" cy="45" r="1.5"
               fill="white" stroke="none" opacity="0.7"/>

    </g>
  );
}

// ── GoatSkeletonBody — quadruped mountain goat skeleton, 3/4 camera angle ─────
// Bone-mode foundation for the realistic goat. Angled ~45° toward camera:
//   • Both eye sockets visible on the skull (near socket larger/further forward)
//   • Near legs (high-x) drawn after far legs — painter's-algorithm depth
//   • Cloven hooves: each fetlock splits into two digit bones + hoof caps
//   • Z-shaped hind legs (stifle forward, hock back), straight forelegs
//   • Ribcage as closed rib-pair arcs, dashed spine, filled pelvis + scapulae
//
// Drawing order: far hind → far front → spine / ribcage / pelvis / scapulae →
//                near hind → near front → cervical vertebrae → skull → horns →
//                joint knobs.
export function GoatSkeletonBody() {
  return (
    <g data-layer="bone" strokeLinecap="round">

      {/* ── FAR HIND LEG ── */}
      {/* Hip → Stifle (stifle is forward / higher-x of hip) */}
      <line x1="29" y1="194" x2="40" y2="250" stroke="black" strokeWidth="9"/>
      <line x1="29" y1="194" x2="40" y2="250" stroke="#666"  strokeWidth="5"/>
      {/* Stifle → Hock (hock sweeps back / lower-x) */}
      <line x1="40" y1="250" x2="26" y2="312" stroke="black" strokeWidth="8"/>
      <line x1="40" y1="250" x2="26" y2="312" stroke="#666"  strokeWidth="4.5"/>
      {/* Hock → Fetlock */}
      <line x1="26" y1="312" x2="30" y2="360" stroke="black" strokeWidth="7"/>
      <line x1="26" y1="312" x2="30" y2="360" stroke="#555"  strokeWidth="4"/>
      {/* Fetlock → two digits (cloven hoof) */}
      <line x1="30" y1="360" x2="27" y2="403" stroke="black" strokeWidth="5.5"/>
      <line x1="30" y1="360" x2="27" y2="403" stroke="#555"  strokeWidth="2.5"/>
      <line x1="30" y1="360" x2="34" y2="403" stroke="black" strokeWidth="5.5"/>
      <line x1="30" y1="360" x2="34" y2="403" stroke="#555"  strokeWidth="2.5"/>
      <line x1="23" y1="403" x2="31" y2="405" stroke="#222"  strokeWidth="5"/>
      <line x1="31" y1="403" x2="39" y2="405" stroke="#222"  strokeWidth="5"/>

      {/* ── FAR FRONT LEG ── */}
      {/* Shoulder → Elbow */}
      <line x1="102" y1="178" x2="104" y2="220" stroke="black" strokeWidth="9"/>
      <line x1="102" y1="178" x2="104" y2="220" stroke="#666"  strokeWidth="5"/>
      {/* Elbow → Carpus (knee) */}
      <line x1="104" y1="220" x2="104" y2="270" stroke="black" strokeWidth="8"/>
      <line x1="104" y1="220" x2="104" y2="270" stroke="#666"  strokeWidth="4.5"/>
      {/* Carpus → Fetlock */}
      <line x1="104" y1="270" x2="105" y2="328" stroke="black" strokeWidth="7"/>
      <line x1="104" y1="270" x2="105" y2="328" stroke="#555"  strokeWidth="4"/>
      {/* Fetlock → two digits */}
      <line x1="105" y1="328" x2="102" y2="403" stroke="black" strokeWidth="5.5"/>
      <line x1="105" y1="328" x2="102" y2="403" stroke="#555"  strokeWidth="2.5"/>
      <line x1="105" y1="328" x2="109" y2="403" stroke="black" strokeWidth="5.5"/>
      <line x1="105" y1="328" x2="109" y2="403" stroke="#555"  strokeWidth="2.5"/>
      <line x1="98"  y1="403" x2="106" y2="405" stroke="#222"  strokeWidth="5"/>
      <line x1="106" y1="403" x2="114" y2="405" stroke="#222"  strokeWidth="5"/>

      {/* ── SPINE (dashed, withers → croup) ── */}
      <path d="M 108,172 C 88,168 62,176 42,186 C 34,190 26,196 22,203"
            fill="none" stroke="#ccc" strokeWidth="3" strokeDasharray="4,5"/>

      {/* ── RIBCAGE — six closed rib-pair arcs fanning from thoracic spine ── */}
      <path d="M 104,172 C 108,183 110,198 107,215 C 101,221 91,219 87,210
               C 83,201 83,187 88,178"
            fill="none" stroke="#bbb" strokeWidth="1.6"/>
      <path d="M 96,173 C 100,185 102,201 99,218 C 92,225 81,223 77,213
               C 73,204 73,190 78,181"
            fill="none" stroke="#bbb" strokeWidth="1.6"/>
      <path d="M 86,175 C 90,187 92,205 88,223 C 81,231 69,229 65,219
               C 61,209 61,195 66,184"
            fill="none" stroke="#bbb" strokeWidth="1.5"/>
      <path d="M 76,177 C 80,189 81,208 76,228 C 69,237 56,234 52,223
               C 48,212 49,198 55,187"
            fill="none" stroke="#aaa" strokeWidth="1.4"/>
      <path d="M 66,179 C 70,192 70,212 65,231 C 58,240 45,237 41,225
               C 37,214 38,200 44,189"
            fill="none" stroke="#aaa" strokeWidth="1.3"/>
      <path d="M 56,182 C 59,196 58,216 53,234 C 47,242 35,239 32,227"
            fill="none" stroke="#999" strokeWidth="1.2"/>
      {/* Sternum bar */}
      <path d="M 87,210 C 78,219 66,228 51,231"
            fill="none" stroke="#ccc" strokeWidth="2.2"/>

      {/* ── PELVIS ── */}
      <path d="M 22,200 C 17,193 24,182 36,181 L 47,184
               C 51,189 49,198 45,201 C 47,208 44,214 39,214
               C 34,216 27,213 24,208 C 19,204 19,201 22,200 Z"
            fill="#555" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* ── SCAPULAE ── */}
      {/* Far scapula (drawn behind near) */}
      <path d="M 101,178 C 104,166 106,153 102,147 C 98,145 91,150 90,160
               C 88,169 90,177 99,181 Z"
            fill="#444" stroke="black" strokeWidth="1" strokeLinejoin="round"/>
      {/* Near scapula */}
      <path d="M 113,175 C 117,162 118,149 114,143 C 110,141 104,147 102,157
               C 100,167 102,176 111,179 Z"
            fill="#555" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>

      {/* ── NEAR HIND LEG ── */}
      <line x1="42" y1="192" x2="54" y2="249" stroke="black" strokeWidth="11"/>
      <line x1="42" y1="192" x2="54" y2="249" stroke="#888"  strokeWidth="7"/>
      <line x1="54" y1="249" x2="39" y2="312" stroke="black" strokeWidth="9"/>
      <line x1="54" y1="249" x2="39" y2="312" stroke="#888"  strokeWidth="5.5"/>
      <line x1="39" y1="312" x2="44" y2="360" stroke="black" strokeWidth="8"/>
      <line x1="39" y1="312" x2="44" y2="360" stroke="#777"  strokeWidth="4.5"/>
      {/* Fetlock → two digits */}
      <line x1="44" y1="360" x2="40" y2="405" stroke="black" strokeWidth="7"/>
      <line x1="44" y1="360" x2="40" y2="405" stroke="#666"  strokeWidth="4"/>
      <line x1="44" y1="360" x2="49" y2="405" stroke="black" strokeWidth="7"/>
      <line x1="44" y1="360" x2="49" y2="405" stroke="#666"  strokeWidth="4"/>
      <line x1="35" y1="405" x2="44" y2="407" stroke="#222"  strokeWidth="8"/>
      <line x1="45" y1="405" x2="54" y2="407" stroke="#222"  strokeWidth="8"/>

      {/* ── NEAR FRONT LEG ── */}
      <line x1="114" y1="176" x2="116" y2="219" stroke="black" strokeWidth="11"/>
      <line x1="114" y1="176" x2="116" y2="219" stroke="#888"  strokeWidth="7"/>
      <line x1="116" y1="219" x2="116" y2="270" stroke="black" strokeWidth="9"/>
      <line x1="116" y1="219" x2="116" y2="270" stroke="#888"  strokeWidth="5.5"/>
      <line x1="116" y1="270" x2="117" y2="328" stroke="black" strokeWidth="8"/>
      <line x1="116" y1="270" x2="117" y2="328" stroke="#777"  strokeWidth="4.5"/>
      {/* Fetlock → two digits */}
      <line x1="117" y1="328" x2="113" y2="405" stroke="black" strokeWidth="7"/>
      <line x1="117" y1="328" x2="113" y2="405" stroke="#666"  strokeWidth="4"/>
      <line x1="117" y1="328" x2="122" y2="405" stroke="black" strokeWidth="7"/>
      <line x1="117" y1="328" x2="122" y2="405" stroke="#666"  strokeWidth="4"/>
      <line x1="108" y1="405" x2="117" y2="407" stroke="#222"  strokeWidth="8"/>
      <line x1="118" y1="405" x2="127" y2="407" stroke="#222"  strokeWidth="8"/>

      {/* ── CERVICAL VERTEBRAE (6 discs along dashed neck curve) ── */}
      <path d="M 120,90 C 120,105 117,122 115,140 C 113,153 111,162 110,172"
            fill="none" stroke="#ccc" strokeWidth="2.5" strokeDasharray="3,5"/>
      <circle cx="120" cy="90"  r="5"   fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="120" cy="105" r="4.5" fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="118" cy="120" r="4"   fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="116" cy="135" r="4"   fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="114" cy="150" r="3.5" fill="#555" stroke="black" strokeWidth="1.5"/>
      <circle cx="112" cy="163" r="3.5" fill="#555" stroke="black" strokeWidth="1.5"/>

      {/* ── SKULL ── */}
      {/* Cranium — slightly wide ellipse for 3/4 view */}
      <ellipse cx="128" cy="54" rx="24" ry="27"
               fill="#555" stroke="black" strokeWidth="2"/>
      {/* Nasal bone / premaxilla — long flat goat snout, narrows toward muzzle tip */}
      <path d="M 136,66 C 145,64 158,66 160,74 C 162,82 156,92 148,94
               C 140,96 134,90 133,82 C 132,74 133,68 136,66 Z"
            fill="#555" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Nares — two dark ovals near muzzle tip */}
      <ellipse cx="157" cy="72" rx="2.5" ry="2"  fill="#1a0000"/>
      <ellipse cx="157" cy="80" rx="2"   ry="1.8" fill="#1a0000"/>
      {/* Mandible — lower jaw drops below the snout, hinges at the back */}
      {/* Ramus (vertical back of jaw) */}
      <path d="M 134,82 C 132,88 132,96 134,104
               C 137,110 144,112 150,108
               C 155,104 158,96 156,88
               C 154,80 148,76 142,78 Z"
            fill="#444" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Diastema gap — goats have a toothless gap between incisors and molars */}
      {/* Lower incisor bar (front teeth, near muzzle tip) */}
      <rect x="147" y="106" width="10" height="4" rx="1.5"
            fill="#aaa" stroke="#555" strokeWidth="0.8"/>
      {/* Molar row (back, smaller individual teeth) */}
      <rect x="136" y="106" width="4" height="3.5" rx="1"
            fill="#999" stroke="#555" strokeWidth="0.7"/>
      <rect x="140" y="106" width="4" height="3.5" rx="1"
            fill="#999" stroke="#555" strokeWidth="0.7"/>
      <rect x="144" y="106" width="3" height="3.5" rx="1"
            fill="#999" stroke="#555" strokeWidth="0.7"/>
      {/* Near orbit (viewer-side, high-x — slightly larger) */}
      <ellipse cx="144" cy="47" rx="10" ry="9"
               fill="#111" stroke="#555" strokeWidth="1"/>
      {/* Far orbit */}
      <ellipse cx="118" cy="46" rx="8" ry="8"
               fill="#111" stroke="#444" strokeWidth="0.8"/>
      {/* Zygomatic arch */}
      <path d="M 149,62 C 156,68 158,77 152,85"
            fill="none" stroke="black" strokeWidth="1.5"/>
      {/* Nares */}
      <ellipse cx="154" cy="76" rx="2.5" ry="3"  fill="#1a0000"/>
      <ellipse cx="154" cy="84" rx="2"   ry="2.5" fill="#1a0000"/>

      {/* ── HORNS ── */}
      {/* Near horn — swept back and up from poll, with curl tip */}
      <path d="M 132,28 C 128,18 121,10 115,6 C 111,4 108,8 111,16
               C 113,23 119,25 123,21 C 127,18 126,12 121,10"
            fill="none" stroke="black" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M 132,28 C 128,18 121,10 115,6 C 111,4 108,8 111,16
               C 113,23 119,25 123,21 C 127,18 126,12 121,10"
            fill="none" stroke="#999" strokeWidth="3" strokeLinejoin="round"/>
      {/* Far horn — slightly shorter, behind near */}
      <path d="M 123,32 C 120,22 113,14 108,10 C 104,8 101,12 104,20
               C 106,26 112,28 116,24"
            fill="none" stroke="black" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M 123,32 C 120,22 113,14 108,10 C 104,8 101,12 104,20
               C 106,26 112,28 116,24"
            fill="none" stroke="#777" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Annulation rings on near horn */}
      <path d="M 130,24 C 127,22 124,22 122,24" fill="none" stroke="black" strokeWidth="1.5"/>
      <path d="M 126,17 C 123,15 120,15 118,17" fill="none" stroke="black" strokeWidth="1.2"/>
      <path d="M 120,11 C 117,9  114,9  113,11" fill="none" stroke="black" strokeWidth="1"/>

      {/* ── JOINT KNOBS ── */}
      <g fill="#555" stroke="black" strokeWidth="1.5">
        <circle cx="114" cy="176" r="7"/>  {/* near shoulder */}
        <circle cx="102" cy="178" r="6"/>  {/* far shoulder */}
        <circle cx="42"  cy="192" r="7"/>  {/* near hip */}
        <circle cx="29"  cy="194" r="6"/>  {/* far hip */}
        <circle cx="116" cy="219" r="6"/>  {/* near elbow */}
        <circle cx="104" cy="220" r="5"/>  {/* far elbow */}
        <circle cx="54"  cy="249" r="6"/>  {/* near stifle */}
        <circle cx="40"  cy="250" r="5"/>  {/* far stifle */}
        <circle cx="116" cy="270" r="6"/>  {/* near carpus */}
        <circle cx="104" cy="270" r="5"/>  {/* far carpus */}
        <circle cx="39"  cy="312" r="6"/>  {/* near hock */}
        <circle cx="26"  cy="312" r="5"/>  {/* far hock */}
        <circle cx="117" cy="328" r="5"/>  {/* near fetlock front */}
        <circle cx="105" cy="328" r="4"/>  {/* far fetlock front */}
        <circle cx="44"  cy="360" r="5"/>  {/* near fetlock hind */}
        <circle cx="30"  cy="360" r="4"/>  {/* far fetlock hind */}
      </g>

    </g>
  );
}



// ── GoatHornsChimera (ear-scale, for chimera overlay) ────────────────────────
// Horn bases anchored at the exact same points as RatEars:
//   far ear cx=88,cy=25 rotate(14);  near ear cx=62,cy=21 rotate(-10)
// dy shifts both to match each host species' crown height.
export function GoatHornsChimera({ ghost, dy = 0 }: PartProps & { dy?: number }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill="#c8b88a" stroke="black" strokeWidth="1.5" strokeLinejoin="round"
       transform={dy ? `translate(0,${dy})` : undefined}>
      {/* Far horn — base anchored at far ear centre (88,25) */}
      <path d="M 88,25 C 90,14 98,6 104,10 C 108,14 106,22 98,26
               C 95,24 90,24 88,25 Z"/>
      <path d="M 98,26 C 95,29 94,33 96,35"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Near horn — base anchored at near ear centre (62,21) */}
      <path d="M 62,21 C 60,10 52,2 46,6 C 42,10 44,18 52,22
               C 55,20 60,20 62,21 Z"/>
      <path d="M 52,22 C 55,25 56,29 54,31"
            fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  );
}

// ── GoatEyeOverlay — slit-pupil eye pasted over another creature's head ──────
// cy is the host eye's vertical centre (defaults to humanoid 46).
export function GoatEyeOverlay({ ghost, cy = 46 }: PartProps & { cy?: number }) {
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

// ── GoatLegBack — chimera rear leg pair drawn in GoatBody style ───────────────
// GoatBody hind geometry scaled to chimera y-space: hip y=194→258, ground y=408.
// Draw order: near first (behind), far second (in front).
// tx: optional x translate to align hips with the host body's leg anchors.
//   Default 0 = correct for pure-goat chimera hosts (humanoid, spider, etc.)
//   Pass tx=24 for rat host to align near-leg hip with rat's cx=66 anchor.
export function GoatLegBack({ ghost, tx = 0 }: PartProps & { tx?: number }) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinecap="round" strokeLinejoin="round"
       transform={tx ? `translate(${tx},0)` : undefined}>
      {/* ── NEAR HIND LEG (behind) ── */}
      <path d="M 33,258 C 32,274 42,289 46,300 C 52,301 64,299 62,296
               C 60,285 54,269 52,258 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="1"/>
      <path d="M 44,300 C 34,317 28,331 28,343 C 33,345 50,344 51,342
               C 52,331 56,315 62,299 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="1"/>
      <path d="M 30,343 L 36,378 L 52,378 L 48,343 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.9"/>
      <path d="M 32,378 L 28,408 L 42,408 L 42,378 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
      <path d="M 42,378 L 42,408 L 55,408 L 51,378 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
      {/* ── FAR HIND LEG (in front) ── */}
      <path d="M 22,259 C 22,275 30,289 34,299 C 38,299 47,297 46,296
               C 46,283 40,268 36,258 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="0.8"/>
      <path d="M 33,300 C 24,316 18,332 18,343 C 22,344 33,344 34,342
               C 36,331 41,314 47,297 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.8"/>
      <path d="M 20,342 L 24,377 L 36,377 L 32,342 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.7"/>
      <path d="M 21,377 L 19,408 L 28,408 L 29,377 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
      <path d="M 29,377 L 29,408 L 37,408 L 37,377 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
    </g>
  );
}

// ── GoatLegFront — chimera front leg pair drawn in GoatBody style ──────────────
// GoatBody front geometry scaled to chimera y-space: shoulder y=178→258, ground y=408.
// Scale factor ≈ 0.658. Both far (lighter) and near (heavier) legs shown.
export function GoatLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       strokeLinecap="round" strokeLinejoin="round">
      {/* ── FAR FRONT LEG (lighter) ── */}
      <path d="M 96,258 C 95,270 98,281 100,287 L 110,286
               C 109,278 110,269 109,258 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="0.8"/>
      <path d="M 99,287 L 99,320 L 110,320 L 111,287 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.8"/>
      <path d="M 99,320 L 100,358 L 110,358 L 110,320 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.7"/>
      <path d="M 97,358 L 96,408 L 106,408 L 105,358 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
      <path d="M 105,358 L 106,408 L 115,408 L 113,358 Z"
            fill="#1a1410" stroke="black" strokeWidth="0.8"/>
      {/* ── NEAR FRONT LEG (heavier) ── */}
      <path d="M 106,258 C 105,270 110,281 112,288 C 118,290 126,288 124,286
               C 123,279 122,269 120,258 Z"
            fill="#c8bfaa" stroke="#8a7a62" strokeWidth="1"/>
      <path d="M 111,288 L 110,322 L 124,322 L 125,287 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="1"/>
      <path d="M 110,322 L 110,359 L 124,359 L 125,322 Z"
            fill="#ddd5c0" stroke="#8a7a62" strokeWidth="0.9"/>
      <path d="M 107,359 L 106,408 L 120,408 L 117,359 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
      <path d="M 118,359 L 120,408 L 131,408 L 128,359 Z"
            fill="#1a1410" stroke="black" strokeWidth="1"/>
    </g>
  );
}

// ─── Spider limb anchors for goat body ───────────────────────────────────────
// Goat has 4 leg joints; each gets 2 spider limbs (one up-out, one down-out).
// Far-side anchors (lower x, behind body barrel) → layer:'back'.
// Near-side anchors (higher x, in front of body barrel) → layer:'front'.
// Anchor positions taken from GoatBody leg joint comments in goat.tsx.
export const GOAT_SPIDER_LIMB_ANCHORS: SpiderLimbAnchor[] = [
  // Far front shoulder (102, 178) — splay rightward, behind barrel
  { x: 102, y: 178, knee: { dx:  36, dy: -38 }, tip: { dx:  24, dy: -36 }, layer: 'back',  amp: 2.5, dur: 2.2, phase: 0.0 },
  { x: 102, y: 178, knee: { dx:  38, dy:  28 }, tip: { dx:  24, dy:  26 }, layer: 'back',  amp: 2.0, dur: 1.9, phase: 0.5 },
  // Near front shoulder (114, 176) — splay rightward, in front of barrel
  { x: 114, y: 176, knee: { dx:  36, dy: -38 }, tip: { dx:  24, dy: -36 }, layer: 'front', amp: 2.5, dur: 2.0, phase: 0.3 },
  { x: 114, y: 176, knee: { dx:  38, dy:  28 }, tip: { dx:  24, dy:  26 }, layer: 'front', amp: 2.0, dur: 2.3, phase: 0.8 },
  // Far hind hip (29, 194) — splay leftward, behind barrel
  { x:  29, y: 194, knee: { dx: -36, dy: -38 }, tip: { dx: -24, dy: -36 }, layer: 'back',  amp: 2.5, dur: 2.1, phase: 0.1 },
  { x:  29, y: 194, knee: { dx: -38, dy:  28 }, tip: { dx: -24, dy:  26 }, layer: 'back',  amp: 2.0, dur: 1.8, phase: 0.6 },
  // Near hind hip (42, 192) — splay leftward, in front of barrel
  { x:  42, y: 192, knee: { dx: -36, dy: -38 }, tip: { dx: -24, dy: -36 }, layer: 'front', amp: 2.5, dur: 2.3, phase: 0.4 },
  { x:  42, y: 192, knee: { dx: -38, dy:  28 }, tip: { dx: -24, dy:  26 }, layer: 'front', amp: 2.0, dur: 1.9, phase: 0.9 },
];

// ─── Slime goop silhouette pts ────────────────────────────────────────────────
export const GOAT_SLIME_GOOP_PTS: Pt[] = [
  [78,2],[124,8],[124,26],[130,100],[148,200],
  [112,262],[108,310],[96,414],[60,414],
  [48,310],[44,262],[28,200],[26,100],[30,26],[30,8],
];

// ─── Goat chimera leg anchors ─────────────────────────────────────────────────
// Used when goat is a chimera on another body.
// hind tx is set to 0 here; the compositor overrides it using the host's goatTx.
export const GOAT_CHIMERA_LEG_ANCHORS: LegAnchor[] = [
  { key: 'goat-leg-back',  layer: 'back',  slot: 'hind', type: 'goat-hind', tx: 0 },
  { key: 'goat-leg-front', layer: 'front', slot: 'fore', type: 'goat-fore', tx: 0 },
];

// ─── Head overlay anchors ─────────────────────────────────────────────────────
// Far eye (smaller/dimmer) + near eye (larger/prominent) from GoatBody.
// Cranium: cx=128 cy=54 rx=24 ry=27 → skull top cy=27 → crown at cx=128, cy=33.
export const GOAT_EYE_ANCHORS:  HeadPt[] = [{ cx: 118, cy: 46 }, { cx: 144, cy: 47 }];
export const GOAT_CROWN_ANCHOR: HeadPt   = { cx: 128, cy: 33 };

// Crack segments for lich mode.
// Skull: cranium cx=128 cy=54 rx=24 → top at y=27. Muzzle extends toward x=160.
// Neck vertebrae (120,90)→(112,163). Spine path from withers (108,172) to rump (22,203).
export const GOAT_CRACK_SEGS: CrackSeg[] = [
  { pts: [[126,27],[122,42],[128,54],[124,66],[130,78]], w: 1.2 },      // skull top down
  { pts: [[148,84],[152,96],[148,106]], w: 1.0 },                       // muzzle/jaw
  { pts: [[119,90],[115,110],[117,128],[115,146],[113,164]], w: 1.1 },  // neck vertebrae
  { pts: [[108,172],[94,176],[80,178],[66,181],[52,185],[38,190],[26,196]], w: 1.3 }, // spine
  { pts: [[99,181],[97,198],[95,212]], w: 1.0 },                        // far rib
  { pts: [[44,192],[50,222],[54,248],[46,282],[40,311]], w: 1.0 },      // near hind leg
];

// ─── ═══════════════════════ WING PARTS ═════════════════════════ ─────────────
