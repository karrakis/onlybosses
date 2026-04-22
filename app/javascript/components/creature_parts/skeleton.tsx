import * as React from 'react';
import { PartProps, partClass, CrackSeg } from './types';

// ─── ═══════════════════════ BONE PARTS ═════════════════════════ ─────────────
// Bone parts are always tagged data-layer="bone" and are EXEMPT from ghost fade.
// They are rendered on top of flesh parts (to be visible when ghost fades flesh).

export function SkeletonRibcage() {
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

export function SkeletonPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="2">
      <path d="M 52,242 C 48,234 56,226 78,224 C 100,226 108,234 104,242
               L 108,256 C 106,268 98,272 90,268 C 86,276 70,276 66,268
               C 58,272 50,268 48,256 Z"/>
    </g>
  );
}

export function SkeletonArmBack() {
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

export function SkeletonArmFront() {
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

export function SkeletonLegBack() {
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

export function SkeletonLegFront() {
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

export function SkeletonSkull() {
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

export function SkeletonJointKnobs({ includeHips = true }: { includeHips?: boolean }) {
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

export function SkeletonCracks({ segs }: { segs: CrackSeg[] }) {
  return (
    <g data-layer="bone" fill="none" stroke="#cc0000" strokeLinecap="round" strokeLinejoin="round">
      {segs.map(({ pts, w = 1 }, i) => (
        <polyline key={i} points={pts.map(([x, y]) => `${x},${y}`).join(' ')} strokeWidth={w}/>
      ))}
    </g>
  );
}

export function PhoenixSkull() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinejoin="round">
      <circle cx="78" cy="116" r="3.5" strokeWidth="1.4"/>
      <circle cx="78" cy="110" r="3" strokeWidth="1.4"/>
      <circle cx="78" cy="104" r="2.6" strokeWidth="1.4"/>
      <ellipse cx="78" cy="98" rx="21" ry="20" strokeWidth="2"/>
      <ellipse cx="86" cy="92" rx="7" ry="7.5" fill="#1a0000" stroke="none"/>
      <path d="M 99,94 L 134,98 L 99,103" fill="none" stroke="black" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M 103,98 L 96,102" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  );
}

export function PhoenixRibcage() {
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      <line x1="78" y1="112" x2="78" y2="268" strokeWidth="2.5" strokeDasharray="3,4"/>
      <path d="M 78,128 C 88,123 99,126 107,134" strokeWidth="2.2"/>
      <path d="M 78,128 C 68,123 57,126 49,134" strokeWidth="1.6"/>
      <path d="M 78,146 C 89,140 102,142 110,150" strokeWidth="2"/>
      <path d="M 78,146 C 67,140 54,142 46,150" strokeWidth="1.5"/>
      <path d="M 78,166 C 89,160 102,161 109,170" strokeWidth="2"/>
      <path d="M 78,166 C 67,160 54,161 47,170" strokeWidth="1.5"/>
      <path d="M 78,186 C 88,181 99,182 106,191" strokeWidth="1.9"/>
      <path d="M 78,186 C 68,181 57,182 50,191" strokeWidth="1.4"/>
      <path d="M 78,206 C 86,202 95,204 101,212" strokeWidth="1.8"/>
      <path d="M 78,206 C 70,202 61,204 55,212" strokeWidth="1.3"/>
      <path d="M 107,134 C 111,158 111,186 101,212" strokeWidth="2.8"/>
    </g>
  );
}

export function PhoenixPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.8">
      <path d="M 64,186 C 60,180 66,172 78,171 C 90,172 96,180 92,186
               L 96,196 C 94,206 88,210 83,207 C 80,214 76,214 73,207
               C 68,210 62,206 60,196 Z"/>
    </g>
  );
}

export function PhoenixTailBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.4">
      <line x1="78" y1="236" x2="78" y2="290" stroke="#666" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="78" cy="248" r="3.6"/>
      <circle cx="78" cy="262" r="3.2"/>
      <circle cx="78" cy="276" r="2.8"/>
      <circle cx="78" cy="290" r="2.3"/>
    </g>
  );
}

export function PhoenixLegBackBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="66" y1="195" x2="58" y2="245" strokeWidth="8"/>
      <line x1="66" y1="195" x2="58" y2="245" stroke="#666" strokeWidth="4.8"/>
      <line x1="58" y1="245" x2="40" y2="195" strokeWidth="6"/>
      <line x1="58" y1="245" x2="40" y2="195" stroke="#666" strokeWidth="3.6"/>
      <path d="M 40,195 L 31,201" strokeWidth="2.4"/>
      <path d="M 40,195 L 32,208" strokeWidth="2.1"/>
      <path d="M 40,195 L 36,214" strokeWidth="1.9"/>
    </g>
  );
}

export function PhoenixLegFrontBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="94" y1="195" x2="102" y2="245" strokeWidth="8"/>
      <line x1="94" y1="195" x2="102" y2="245" stroke="#666" strokeWidth="4.8"/>
      <line x1="102" y1="245" x2="120" y2="195" strokeWidth="6"/>
      <line x1="102" y1="245" x2="120" y2="195" stroke="#666" strokeWidth="3.6"/>
      <path d="M 120,195 L 129,201" strokeWidth="2.4"/>
      <path d="M 120,195 L 128,208" strokeWidth="2.1"/>
      <path d="M 120,195 L 124,214" strokeWidth="1.9"/>
    </g>
  );
}

export function PhoenixJointKnobs() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.5">
      <circle cx="78" cy="116" r="4.5"/>
      <circle cx="66" cy="195" r="5.5"/>
      <circle cx="94" cy="195" r="5.5"/>
      <circle cx="58" cy="245" r="5"/>
      <circle cx="102" cy="245" r="5"/>
    </g>
  );
}

export function GoblinSkull() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinejoin="round">
      <circle cx="82" cy="84" r="3.2" strokeWidth="1.3"/>
      <circle cx="82" cy="90" r="2.8" strokeWidth="1.3"/>
      <ellipse cx="82" cy="68" rx="28" ry="30" strokeWidth="2"/>
      <path d="M 52,72 L 36,52 L 48,76" fill="#555" stroke="black" strokeWidth="2"/>
      <path d="M 112,72 L 128,52 L 116,76" fill="#555" stroke="black" strokeWidth="2"/>
      <ellipse cx="92" cy="63" rx="8" ry="9" fill="#1a0000" stroke="none"/>
      <path d="M 68,86 C 77,94 95,95 106,87" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M 72,87 L 76,93 L 80,87 M 82,88 L 86,94 L 90,88 M 92,88 L 96,94 L 100,88" fill="none" stroke="black" strokeWidth="1.2"/>
    </g>
  );
}

export function GoblinRibcage() {
  return (
    <g data-layer="bone" fill="none" stroke="#ccc" strokeLinecap="round">
      <path d="M 84,102 C 86,124 86,160 84,214" strokeWidth="2.4" strokeDasharray="3,4"/>
      <path d="M 84,120 C 94,116 104,120 112,128" strokeWidth="2"/>
      <path d="M 84,120 C 74,116 64,120 56,128" strokeWidth="1.5"/>
      <path d="M 84,138 C 95,132 106,136 114,144" strokeWidth="1.9"/>
      <path d="M 84,138 C 73,132 62,136 54,144" strokeWidth="1.4"/>
      <path d="M 84,158 C 95,152 106,155 113,164" strokeWidth="1.8"/>
      <path d="M 84,158 C 73,152 62,155 55,164" strokeWidth="1.35"/>
      <path d="M 84,178 C 94,173 103,176 109,184" strokeWidth="1.7"/>
      <path d="M 84,178 C 74,173 65,176 59,184" strokeWidth="1.3"/>
      <path d="M 112,128 C 116,146 116,166 109,184" strokeWidth="2.4"/>
    </g>
  );
}

export function GoblinPelvis() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.8">
      <path d="M 70,228 C 66,222 72,216 84,215 C 96,216 102,222 98,228
               L 101,238 C 100,248 94,252 89,249 C 86,256 82,256 79,249
               C 74,252 68,248 67,238 Z"/>
    </g>
  );
}

export function GoblinArmBackBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="102" y1="130" x2="116" y2="170" strokeWidth="8"/>
      <line x1="102" y1="130" x2="116" y2="170" stroke="#666" strokeWidth="5"/>
      <line x1="116" y1="170" x2="112" y2="214" strokeWidth="6.5"/>
      <line x1="116" y1="170" x2="112" y2="214" stroke="#666" strokeWidth="4"/>
      <ellipse cx="113" cy="222" rx="6" ry="8" fill="#555" stroke="black" strokeWidth="1.3"/>
    </g>
  );
}

export function GoblinArmFrontBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="58" y1="132" x2="44" y2="172" strokeWidth="8"/>
      <line x1="58" y1="132" x2="44" y2="172" stroke="#666" strokeWidth="5"/>
      <line x1="44" y1="172" x2="48" y2="214" strokeWidth="6.5"/>
      <line x1="44" y1="172" x2="48" y2="214" stroke="#666" strokeWidth="4"/>
      <ellipse cx="47" cy="222" rx="6" ry="8" fill="#555" stroke="black" strokeWidth="1.3"/>
    </g>
  );
}

export function GoblinLegBackBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="86" y1="258" x2="85" y2="312" strokeWidth="9"/>
      <line x1="86" y1="258" x2="85" y2="312" stroke="#666" strokeWidth="5.5"/>
      <line x1="85" y1="312" x2="84" y2="356" strokeWidth="7"/>
      <line x1="85" y1="312" x2="84" y2="356" stroke="#666" strokeWidth="4.3"/>
      <path d="M 90,355 L 79,355 C 75,355 74,362 78,369 C 83,372 89,370 92,367 C 93,363 92,358 90,355 Z" fill="#555"/>
    </g>
  );
}

export function GoblinLegFrontBone() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeLinecap="round">
      <line x1="64" y1="258" x2="65" y2="312" strokeWidth="9"/>
      <line x1="64" y1="258" x2="65" y2="312" stroke="#666" strokeWidth="5.5"/>
      <line x1="65" y1="312" x2="64" y2="356" strokeWidth="7"/>
      <line x1="65" y1="312" x2="64" y2="356" stroke="#666" strokeWidth="4.3"/>
      <path d="M 70,355 L 59,355 C 55,355 54,362 58,369 C 63,372 69,370 72,367 C 73,363 72,358 70,355 Z" fill="#555"/>
    </g>
  );
}

export function GoblinJointKnobs() {
  return (
    <g data-layer="bone" fill="#555" stroke="black" strokeWidth="1.4">
      <circle cx="102" cy="130" r="5.8"/>
      <circle cx="58"  cy="132" r="5.8"/>
      <circle cx="116" cy="170" r="5.2"/>
      <circle cx="44"  cy="172" r="5.2"/>
      <circle cx="86"  cy="258" r="6"/>
      <circle cx="64"  cy="258" r="6"/>
      <circle cx="85"  cy="312" r="5.6"/>
      <circle cx="65"  cy="312" r="5.6"/>
    </g>
  );
}

