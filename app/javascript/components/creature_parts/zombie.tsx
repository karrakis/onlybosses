import * as React from 'react';
import { PartProps, partClass } from './types';

// ─── Zombie ───────────────────────────────────────────────────────────────────
// Upright biped — identical anchor points to the humanoid torso.
// Drop-in for any humanoid chimera slot. Coloured in muted undead gray-green.
//
// Key anchors (pre-flip, right-facing coordinates):
//   Shoulder back:  cx=110  y=112    Shoulder front: cx=46   y=112
//   Hip back:       cx=90   y=260    Hip front:      cx=66   y=260
//   Neck base:      cx=78   y=76
//   Ear far:        cx=88   y=25     Ear near:       cx=62   y=21
//   Eye centre:     cx=92   y=42     (far socket); cx=63 y=41 (near)
//   Tail root:      cx=40   y=250    (left-edge of torso, same as humanoid)

const ZS  = '#5c6b5c';  // zombie flesh — muted gray-green
const ZSH = '#7d927d';  // flesh highlight
const ZD  = '#3a4838';  // shadow / recess
const ZO  = '#1a1e1a';  // outline
const ZW  = '#5a1818';  // wound / exposed tissue

// ── Torso: identical silhouette to UprightTorso so all chimera anchors match ──
export function ZombieBody({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={ZS} stroke={ZO} strokeWidth="2" strokeLinejoin="round">
      {/* Torso body */}
      <path d="M 50,100 C 38,105 34,120 36,145 C 38,168 42,185 48,195
               L 50,230 L 110,230 L 112,195
               C 118,185 122,168 124,145 C 126,120 122,105 110,100 Z"/>
      {/* Waist / hip band */}
      <path d="M 50,225 L 48,258 L 112,258 L 110,225 Z"/>
      {/* Neck */}
      <path d="M 70,76 L 68,96 L 88,96 L 86,76 Z"/>
      {/* Rib impressions through rotten flesh */}
      <path d="M 68,110 C 78,108 92,108 102,112"
            fill="none" stroke={ZD} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M 66,124 C 76,122 93,122 103,126"
            fill="none" stroke={ZD} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M 66,138 C 76,136 93,136 103,140"
            fill="none" stroke={ZD} strokeWidth="1.0" strokeLinecap="round"/>
      {/* Wound gash */}
      <path d="M 74,168 C 79,163 86,166 84,173"
            fill="none" stroke={ZW} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Neck shadow crease */}
      <path d="M 72,82 C 76,79 82,80 84,84"
            fill="none" stroke={ZD} strokeWidth="1.2" strokeLinecap="round"/>
    </g>
  );
}

// ── Head: slack jaw, sunken sockets, milky eyes, missing teeth ────────────────
export function ZombieHead({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      {/* Cranium */}
      <ellipse cx="78" cy="48" rx="28" ry="30"
               fill={ZS} stroke={ZO} strokeWidth="2"/>
      {/* Cheek hollow */}
      <path d="M 96,55 C 101,60 101,70 96,76"
            fill="none" stroke={ZD} strokeWidth="2" strokeLinecap="round"/>
      {/* Far eye socket — deep and dark */}
      <ellipse cx="92" cy="42" rx="9"   ry="8"   fill="#20181e"/>
      {/* Near eye socket */}
      <ellipse cx="63" cy="41" rx="7.5" ry="7"   fill="#20181e"/>
      {/* Far milky iris */}
      <circle cx="92" cy="42" r="5.5" fill="#b6c4a4" stroke="none"/>
      <circle cx="90" cy="40" r="2.2" fill="#363030" stroke="none"/>
      {/* Near milky iris */}
      <circle cx="63" cy="41" r="4.5" fill="#b6c4a4" stroke="none"/>
      <circle cx="62" cy="40" r="1.8" fill="#363030" stroke="none"/>
      {/* Nose hollow */}
      <path d="M 76,57 C 74,63 77,67 78,65 C 79,67 82,63 80,57 Z"
            fill={ZD} stroke="none"/>
      {/* Slack lower jaw — hinged at cheek corners, hanging open */}
      <path d="M 65,72 C 63,80 64,90 68,93 C 72,96 84,96 88,93
               C 92,90 93,80 91,72"
            fill={ZS} stroke={ZO} strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Mouth void between upper and lower jaw */}
      <path d="M 67,72 C 68,83 72,91 78,92 C 84,91 88,83 89,72 Z"
            fill="#180a0a" stroke="none"/>
      {/* Upper teeth (y≈67): 4 slots, missing 2nd (x≈74) and 5th (x≈91) */}
      <rect x="67"   y="67" width="5"   height="7.5" rx="1" fill="#cacf96" stroke="#4a4a30" strokeWidth="0.8"/>
      {/* gap at x≈74: missing */}
      <rect x="79"   y="66" width="5.5" height="8.5" rx="1" fill="#ced296" stroke="#4a4a30" strokeWidth="0.8"/>
      <rect x="85.5" y="67" width="5"   height="7.5" rx="1" fill="#c2c68e" stroke="#4a4a30" strokeWidth="0.8"/>
      {/* gap at x≈91: missing */}
      {/* Lower teeth (y≈80): 4 slots, missing 1st (x≈70) and 3rd (x≈82) */}
      {/* gap at x≈70: missing */}
      <rect x="76"  y="80" width="4.5" height="6.5" rx="1" fill="#b8bc82" stroke="#4a4a30" strokeWidth="0.7"/>
      {/* gap at x≈82: missing */}
      <rect x="87"  y="79" width="5"   height="7"   rx="1" fill="#b4b87e" stroke="#4a4a30" strokeWidth="0.7"/>
      {/* Forehead wound */}
      <path d="M 83,22 C 87,20 90,25 87,29"
            fill="none" stroke={ZW} strokeWidth="1.6" strokeLinecap="round"/>
    </g>
  );
}

// ── Back arm: hangs down, steady — the far-side trailing arm ─────────────────
export function ZombieArmBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g fill={ZS} stroke={ZO} strokeWidth="2" strokeLinejoin="round">
        <animateTransform attributeName="transform" type="rotate"
          values="0 110 104; 2 110 104; 0 110 104; -2 110 104; 0 110 104"
          dur="3.4s" repeatCount="indefinite"/>
        {/* Upper arm */}
        <path d="M 110,104 C 124,110 132,132 132,160 L 120,158
                 C 120,132 114,112 100,106 Z"/>
        {/* Forearm */}
        <path d="M 120,158 C 124,178 124,208 120,236 L 110,234
                 C 114,206 114,176 110,158 Z"/>
        {/* Hand — curled, hanging */}
        <ellipse cx="115" cy="246" rx="10" ry="12"
                 transform="rotate(-6,115,246)"/>
        {/* Knuckle line */}
        <path d="M 109,242 C 112,239 116,240 119,243"
              fill="none" stroke={ZD} strokeWidth="1" strokeLinecap="round"/>
      </g>
    </g>
  );
}

// ── Front arm: outstretched forward — the near-side reaching arm ──────────────
export function ZombieArmFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}>
      <g fill={ZS} stroke={ZO} strokeWidth="2" strokeLinejoin="round">
        <animateTransform attributeName="transform" type="rotate"
          values="0 46 104; -3 46 104; 0 46 104; 1.5 46 104; 0 46 104"
          dur="3.0s" begin="0.6s" repeatCount="indefinite"/>
        {/* Upper arm — reaching outward at roughly 35° below horizontal */}
        <path d="M 46,104 C 34,108 22,126 18,150 L 30,156
                 C 34,135 42,118 54,107 Z"/>
        {/* Forearm — continues the reach */}
        <path d="M 30,156 C 24,178 18,205 12,228 L 22,232
                 C 28,210 34,182 40,158 Z"/>
        {/* Hand — fingers slightly spread in the reaching pose */}
        <ellipse cx="17" cy="239" rx="10" ry="12"
                 transform="rotate(-16,17,239)"/>
        {/* Splayed finger suggestions */}
        <path d="M 12,235 C 9,228 6,222 3,214"
              fill="none" stroke={ZO} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 16,236 C 13,229 11,222 9,214"
              fill="none" stroke={ZO} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 20,238 C 19,230 17,223 16,215"
              fill="none" stroke={ZO} strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </g>
  );
}

// ── Back leg: dragging, slightly stiff ───────────────────────────────────────
export function ZombieLegBack({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={ZS} stroke={ZO} strokeWidth="2" strokeLinejoin="round">
      {/* Thigh */}
      <path d="M 83,256 C 84,270 86,296 86,330 L 99,330
               C 100,296 100,270 100,256 Z"/>
      {/* Lower leg */}
      <path d="M 86,328 C 85,345 84,365 83,390 L 97,390
               C 98,366 99,346 99,328 Z"/>
      {/* Foot */}
      <path d="M 97,389 L 83,389 C 77,389 75,400 81,410
               C 87,413 95,411 100,407 C 102,403 100,394 97,389 Z"/>
      {/* Kneecap */}
      <circle cx="92" cy="332" r="5" fill={ZSH} stroke={ZO} strokeWidth="1.2"/>
    </g>
  );
}

// ── Front leg: shambling forward step ────────────────────────────────────────
export function ZombieLegFront({ ghost }: PartProps) {
  return (
    <g data-layer="flesh" className={partClass('flesh', ghost)}
       fill={ZS} stroke={ZO} strokeWidth="2" strokeLinejoin="round">
      {/* Thigh */}
      <path d="M 60,256 C 61,270 62,296 62,330 L 75,330
               C 76,296 76,270 76,256 Z"/>
      {/* Lower leg */}
      <path d="M 62,328 C 61,345 60,365 60,390 L 73,390
               C 74,366 75,346 75,328 Z"/>
      {/* Foot */}
      <path d="M 73,389 L 60,389 C 54,389 52,400 58,410
               C 64,413 72,411 77,407 C 79,403 77,394 73,389 Z"/>
      {/* Kneecap */}
      <circle cx="68" cy="332" r="5" fill={ZSH} stroke={ZO} strokeWidth="1.2"/>
    </g>
  );
}
