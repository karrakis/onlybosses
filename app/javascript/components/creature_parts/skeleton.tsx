]633;E;header;30c7a7c9-8c3d-493f-9276-242eba80cd54]633;Cimport * as React from 'react';
import { PartProps, partClass } from './types';

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

export function SkeletonCracks() {
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

