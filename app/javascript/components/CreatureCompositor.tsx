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

// ─── Part components (organised by creature) ──────────────────────────────────
import { Pt } from './creature_parts/types';
import {
  UprightTorso, HumanoidHead,
  HumanoidArmBack, HumanoidArmFront,
  HumanoidLegBack, HumanoidLegFront,
  HorseBarrel, HorseLeg, HorseTail,
  HorseRibcage, HorsePelvis, HorseLegBone,
  FishTail,
  PhoenixLegBack, PhoenixLegFront, PhoenixTail, PhoenixBeak,
  HarpyCrest, HarpyTeeth, HarpyLegBack, HarpyLegFront,
} from './creature_parts/humanoid';
import {
  SkeletonRibcage, SkeletonPelvis,
  SkeletonArmBack, SkeletonArmFront,
  SkeletonLegBack, SkeletonLegFront,
  SkeletonSkull, SkeletonJointKnobs, SkeletonCracks,
} from './creature_parts/skeleton';
import { LichCrown, LichEyes, PhoenixFlames } from './creature_parts/ethereal';
import {
  RatTail, RatLegBack, RatLegFront, RatBody, RatHead,
  RatEars, RatWhiskers,
  RatRibcage, RatPelvis, RatSkullHead,
  RatLegBackBone, RatLegFrontBone,
} from './creature_parts/rat';
import {
  SnakeCoil, SnakeBody, SnakeCoilFront, SnakeHood, SnakeHead,
  SnakeRibcage, SnakeSkullHead,
} from './creature_parts/snake';
import {
  SpiderLegs, SpiderBody, SpiderHairs, SpiderEyes,
  SpiderBonusArms, SpiderBonusLegs, SpiderBoneEyes,
} from './creature_parts/spider';
import { SlimeBody, SlimeGoop } from './creature_parts/slime';
import {
  GoatBody, GoatSkeletonBody,
  GoatHornsChimera, GoatEyeOverlay,
  GoatLegBack, GoatLegFront,
} from './creature_parts/goat';
import {
  ZombieBody, ZombieHead,
  ZombieArmBack, ZombieArmFront,
  ZombieLegBack, ZombieLegFront,
} from './creature_parts/zombie';


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
  /** True only when a pure (non-chimera) goat body is rendered — triggers goat wing positioning */
  goatBody: boolean;
  /** When true, both wings render behind the body (e.g. spider — wings on the underside) */
  wingsBackground: boolean;
  /**
   * Wing attachment point in compositor SVG element pixel space.
   * Wings (350×330 <object>, P0 at object-pixel (30,220)) are abs-positioned in the
   * outer container as:
   *   right wing: left = 270 + wingAnchorX - 30,  top = 60 + wingAnchorY - 220
   *   left wing:  left = 270 + wingAnchorX - 320, top = 60 + wingAnchorY - 220
   */
  wingAnchorX: number;
  wingAnchorY: number;
}

/**
 * Given a set of selected keyword names, returns the ordered list of SVG parts
 * that together form the creature portrait.
 *
 * Rules are processed in order — later rules can add/replace parts.
 */
export function compositeCreature(keywords: string[]): CompositorResult {
  const has = (k: string) => keywords.includes(k);

  // ── Modifiers: overlay on any body plan, don't compete for body slot ──────
  const boneMode = has('skeleton') || has('lich');
  const ghost    = has('ghost');
  const hasWings = has('fly');

  // ── Body plan: first match in priority order wins ─────────────────────────
  // Determines whose torso / head / limbs are used. Every other body-plan
  // keyword becomes a chimera contributor. 'human' is the implicit fallback.
  const BODY_PLANS = [
    'mermaid',       // fish tail — most distinct body plan
    'giant_spider',  // 8-legged — beats centaur (old behaviour preserved)
    'centaur',       // horse hindquarters
    'giant_snake',   // serpentine
    'giant_rat',     // quadruped
    'phoenix',       // bird legs + fire
    'harpy',         // bird legs + wings
    'goat',          // digitigrade
    'zombie',        // upright undead — intentionally beats plain human
    'slime',         // blob
  ] as const;
  type BodyPlan = typeof BODY_PLANS[number] | 'human';

  const body = (BODY_PLANS.find(b => has(b)) ?? 'human') as BodyPlan;

  // chimeraOf(k): this keyword is present alongside a higher-priority body plan.
  // Replaces the old ratChimera / goatChimera / slimeChimera computed flags.
  const chimeraOf = (k: string) => k !== body && has(k);

  // ── Biped appearance ──────────────────────────────────────────────────────
  // Body plans sharing an upright humanoid slot pick their flesh look here.
  // 'zombie' wins over 'human' everywhere an upright slot exists — including
  // when centaur, harpy, or mermaid is the dominant body plan.
  const bipedStyle: 'zombie' | 'human' = has('zombie') ? 'zombie' : 'human';

  // ── Convenience ───────────────────────────────────────────────────────────
  const boneSpider = body === 'giant_spider' && boneMode;

  // Body plans that carry paired arms (upright biped torso + hands)
  const hasBipedArms = body === 'mermaid' || body === 'centaur'
                    || body === 'zombie'   || body === 'human';

  // Goat legs graft onto upright hosts (not centaur/mermaid/snake/spider/rat/slime/goat)
  const goatLegChimera = chimeraOf('goat') && !boneMode &&
    (body === 'human' || body === 'zombie' || body === 'phoenix' || body === 'harpy');

  // Centaur barrel flesh colour follows chimera snake/rat colouring
  const horseFlesh = chimeraOf('giant_snake') ? { base: '#2d5a1e', hi: '#4a8c2e' }
                   : chimeraOf('giant_rat')   ? { base: '#c8963c', hi: '#e8b870' }
                   :                            { base: 'white',   hi: 'white'   };

  // ── Biped part helpers ────────────────────────────────────────────────────
  // All upright-torso slots (torso, head, arms, legs) run through bipedStyle so
  // zombie styling flows through centaur, mermaid, harpy, etc. automatically.
  const bpTorso    = (k: string) => bipedStyle === 'zombie'
    ? <ZombieBody       key={k} layer="flesh" ghost={ghost}/>
    : <UprightTorso     key={k} layer="flesh" ghost={ghost}/>;
  const bpHead     = (k: string) => bipedStyle === 'zombie'
    ? <ZombieHead       key={k} layer="flesh" ghost={ghost}/>
    : <HumanoidHead     key={k} layer="flesh" ghost={ghost}/>;
  const bpArmBack  = (k: string) => bipedStyle === 'zombie'
    ? <ZombieArmBack    key={k} layer="flesh" ghost={ghost}/>
    : <HumanoidArmBack  key={k} layer="flesh" ghost={ghost}/>;
  const bpArmFront = (k: string) => bipedStyle === 'zombie'
    ? <ZombieArmFront   key={k} layer="flesh" ghost={ghost}/>
    : <HumanoidArmFront key={k} layer="flesh" ghost={ghost}/>;
  const bpLegBack  = (k: string) => bipedStyle === 'zombie'
    ? <ZombieLegBack    key={k} layer="flesh" ghost={ghost}/>
    : <HumanoidLegBack  key={k} layer="flesh" ghost={ghost}/>;
  const bpLegFront = (k: string) => bipedStyle === 'zombie'
    ? <ZombieLegFront   key={k} layer="flesh" ghost={ghost}/>
    : <HumanoidLegFront key={k} layer="flesh" ghost={ghost}/>;

  const parts: React.ReactNode[] = [];

  // ── 1. Wings go behind everything (handled by viewport as <object> layers)
  // Nothing to add inline for wings.

  // ── 2. Back-most elements first ───────────────────────────────

  // Centaur: far-side horse legs go behind the barrel
  if (body === 'centaur') {
    if (boneMode) {
      // Bone mode: all 4 leg bones in one pass (no barrel layering needed)
      if (!chimeraOf('giant_rat')) parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      parts.push(
        <HorseLegBone key="horse-leg-br"    cx={38} topY={224}/>,
        <HorseLegBone key="horse-leg-ffar"  cx={80} topY={220}/>,
        <HorseLegBone key="horse-leg-bn"    cx={27} topY={222}/>,
        <HorseLegBone key="horse-leg-fnear" cx={72} topY={218}/>,
      );
    } else {
      if (!chimeraOf('giant_rat')) parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      // Far-side legs behind barrel; near-side legs deferred to §4 (after barrel)
      parts.push(
        <HorseLeg key="horse-leg-br"   cx={38} topY={224} ghost={ghost} fill={horseFlesh.base}/>,
        <HorseLeg key="horse-leg-ffar" cx={80} topY={220} ghost={ghost} fill={horseFlesh.base}/>,
      );
    }
  }

  // Rat tail: anchored to host body regardless of dominance
  if (body === 'giant_rat' || chimeraOf('giant_rat')) {
    const anchor = body === 'centaur'      ? { anchorX: 11, anchorY: 176 }
                 : body === 'giant_snake'  ? { anchorX: 78, anchorY: 306 }
                 : body === 'giant_spider' ? { anchorX: 80, anchorY: 290 }
                 :                           { anchorX: 40, anchorY: 250 };
    parts.push(<RatTail key="rat-tail" layer="flesh" ghost={ghost} {...anchor}/>);
  }

  // Snake coil sits behind the hood (only for snake-dominant body)
  if (body === 'giant_snake' && !boneMode) {
    parts.push(<SnakeCoil key="snake-coil" layer="flesh" ghost={ghost}/>);
  }

  // Back arm
  if (!boneMode) {
    if (hasBipedArms) parts.push(bpArmBack('arm-back'));
  } else {
    // boneSpider: bonus limbs behind torso
    if (boneSpider) parts.push(<SpiderBonusArms key="spider-bonus-arms"/>);
    if (body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat') {
      parts.push(<SkeletonArmBack key="arm-back-bone"/>);
    }
  }

  // Back leg
  if (body === 'giant_rat') {
    if (!boneMode) {
      // Goat chimera: goat hind legs replace rat's own hind legs (forepaws kept)
      if (chimeraOf('goat')) parts.push(<GoatLegBack key="goat-leg-back" layer="flesh" ghost={ghost} tx={24}/>);
      else                   parts.push(<RatLegBack  key="rat-hl-back"   cx={90} topY={258} ghost={ghost}/>);
    } else {
      parts.push(<RatLegBackBone key="rat-hl-back-b" cx={90} topY={258}/>);
    }
  } else if (!boneMode) {
    if (goatLegChimera) {
      parts.push(<GoatLegBack key="goat-leg-back" layer="flesh" ghost={ghost}/>);
    } else if (body === 'zombie' || body === 'human') {
      parts.push(bpLegBack('leg-back'));
    } else if (body === 'harpy') {
      parts.push(<HarpyLegBack key="leg-back" layer="flesh" ghost={ghost}/>);
    } else if (body === 'phoenix') {
      // Phoenix+spider: abdomen occludes back leg — defer both phoenix legs to §6
      if (!chimeraOf('giant_spider')) {
        parts.push(<PhoenixLegBack key="bird-leg-back" layer="flesh" ghost={ghost}/>);
      }
    }
  } else if (body !== 'mermaid' && body !== 'giant_snake' && body !== 'goat') {
    if (boneSpider) parts.push(<SpiderBonusLegs key="spider-bonus-legs"/>);
    parts.push(<SkeletonLegBack key="leg-back-bone"/>);
  }

  // ── 4. Main body ──────────────────────────────────────────────────────────
  switch (body) {
    case 'giant_rat':
      if (!boneMode) {
        parts.push(<RatBody key="rat-body" layer="flesh" ghost={ghost}/>);
        // Spider chimera: graft legs onto rat torso
        if (chimeraOf('giant_spider')) parts.push(<SpiderLegs key="spider-legs" ghost={ghost}/>);
      }
      break;

    case 'giant_snake':
      if (!boneMode) parts.push(<SnakeBody key="snake-body" layer="flesh" ghost={ghost}/>);
      break;

    case 'mermaid':
      parts.push(<FishTail key="fish-tail" layer="flesh" ghost={ghost}/>);
      break;

    case 'giant_spider':
      if (!boneMode) {
        // Centaur chimera: horse hindquarters sit under the spider body
        if (chimeraOf('centaur')) {
          parts.push(
            <HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost} fill={horseFlesh.base}/>,
            <HorseLeg key="horse-leg-bn"    cx={27} topY={222} ghost={ghost} fill={horseFlesh.base}/>,
            <HorseLeg key="horse-leg-fnear" cx={72} topY={218} ghost={ghost} fill={horseFlesh.base}/>,
          );
        }
        parts.push(
          <SpiderLegs  key="spider-legs"  ghost={ghost}/>,
          <SpiderBody  key="spider-body"  ghost={ghost}/>,
          <SpiderHairs key="spider-hairs" ghost={ghost}/>,
        );
      }
      break;

    case 'centaur':
      if (!boneMode || ghost) {
        parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost} fill={horseFlesh.base}/>);
      }
      if (!boneMode) {
        // Near-side legs in front of barrel, behind upright torso
        parts.push(
          <HorseLeg key="horse-leg-bn"    cx={27} topY={222} ghost={ghost} fill={horseFlesh.base}/>,
          <HorseLeg key="horse-leg-fnear" cx={72} topY={218} ghost={ghost} fill={horseFlesh.base}/>,
        );
        // Snake chimera supplies its own upper-body visual — upright torso suppressed
        if (!chimeraOf('giant_snake')) parts.push(bpTorso('torso'));
      }
      break;

    case 'goat':
      if (boneMode) parts.push(<GoatSkeletonBody key="goat-skeleton"/>);
      else          parts.push(<GoatBody key="goat-body" layer="flesh" ghost={ghost}/>);
      break;

    case 'slime':
      if (!boneMode) parts.push(<SlimeBody key="slime-body" layer="flesh" ghost={ghost}/>);
      break;

    default: // 'human', 'zombie', 'phoenix', 'harpy'
      if (!boneMode) parts.push(bpTorso('torso'));
      break;
  }

  // ── 4b. Skeleton internals ────────────────────────────────────────────────
  if (boneMode) {
    // Centaur always gets horse ribcage in addition to upright internals
    if (body === 'centaur') {
      parts.push(<HorseRibcage key="horse-ribcage"/>, <HorsePelvis key="horse-pelvis"/>);
    }
    // Upper-body internals (mutually exclusive; centaur block above doesn't exclude these)
    if (body === 'giant_rat') {
      parts.push(<RatRibcage key="rat-ribcage"/>, <RatPelvis key="rat-pelvis"/>);
    } else if (body === 'giant_snake' || chimeraOf('giant_snake')) {
      // Includes centaur+snake chimera: centaur gets horse+snake ribcage
      parts.push(<SnakeRibcage key="snake-ribcage"/>);
    } else if (body !== 'goat') {
      // GoatSkeletonBody (§4) is self-contained; skip humanoid internals for pure goat
      parts.push(<SkeletonRibcage key="ribcage"/>, <SkeletonPelvis key="pelvis"/>);
    }
    if (has('lich')) parts.push(<SkeletonCracks key="cracks"/>);
  }

  // ── 5. Head ───────────────────────────────────────────────────────────────
  // Harpy crest sits above the skull — draw before head in both flesh and bone modes.
  if (body === 'harpy') parts.push(<HarpyCrest key="harpy-crest" layer="flesh" ghost={ghost}/>);

  // Goat horns: chimera graft, drawn BEFORE head so skull overlaps horn base.
  if (chimeraOf('goat') && !boneMode) {
    const hornDy = body === 'giant_snake' ? -12 : body === 'giant_rat' ? -4 : 0;
    parts.push(<GoatHornsChimera key="goat-horns" layer="flesh" ghost={ghost} dy={hornDy}/>);
  }
  // Rat ears: chimera graft, drawn BEFORE head (head renders on top).
  // Suppressed when goat horns are present (horns replace the ear visual).
  if (chimeraOf('giant_rat') && !boneMode && body !== 'giant_spider' && !chimeraOf('goat')) {
    const earDy = body === 'giant_snake' ? -12 : -4;
    parts.push(<RatEars key="rat-ears" layer="flesh" ghost={ghost} dy={earDy}/>);
  }

  // Head dispatch
  switch (body) {
    case 'giant_rat':
      if (!boneMode) parts.push(<RatHead key="rat-head" layer="flesh" ghost={ghost}/>);
      else           parts.push(<RatSkullHead key="rat-skull"/>);
      break;

    case 'giant_snake':
      if (!boneMode) {
        parts.push(<SnakeHood key="snake-hood" layer="flesh" ghost={ghost}/>);
        parts.push(<SnakeHead key="snake-head" layer="flesh" ghost={ghost}/>);
      } else {
        parts.push(<SnakeSkullHead key="snake-skull"/>);
      }
      break;

    case 'giant_spider':
      if (!boneMode) parts.push(<SpiderEyes key="spider-eyes" ghost={ghost}/>);
      else {
        parts.push(<SkeletonSkull key="skull"/>);
        parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
      }
      break;

    case 'slime':
      // Pure slime: eyes are part of SlimeBody — no separate head
      break;

    case 'goat':
      // GoatBody / GoatSkeletonBody is self-contained (skull, horns, eyes all included)
      break;

    default: // mermaid, centaur, phoenix, harpy, zombie, human
      if (boneMode) {
        parts.push(<SkeletonSkull key="skull"/>);
        if (boneSpider) parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
      } else if (body === 'centaur' && chimeraOf('giant_snake')) {
        // Snake chimera on centaur: snake provides the upper-body head visual
        parts.push(<SnakeHood key="snake-hood" layer="flesh" ghost={ghost}/>);
        parts.push(<SnakeHead key="snake-head" layer="flesh" ghost={ghost}/>);
      } else {
        parts.push(bpHead('head'));
      }
      break;
  }

  // Goat chimera: overlay amber slit eye on top of host head
  if (chimeraOf('goat') && !boneMode) {
    const eyeCy = body === 'giant_rat' ? 46 : body === 'giant_snake' ? 44 : 46;
    parts.push(<GoatEyeOverlay key="goat-eye-overlay" layer="flesh" ghost={ghost} cy={eyeCy}/>);
  }
  // Spider chimera: 8-eye cluster over rat host head
  if (body === 'giant_rat' && chimeraOf('giant_spider') && !boneMode) {
    parts.push(<SpiderEyes key="spider-eyes" ghost={ghost}/>);
  }
  // Rat chimera: whiskers after head (suppressed when goat horns present)
  if (chimeraOf('giant_rat') && !boneMode && body !== 'giant_spider' && !chimeraOf('goat')) {
    parts.push(<RatWhiskers key="rat-whiskers" layer="flesh" ghost={ghost}/>);
  }
  // Harpy teeth: flesh-only (bone skull carries its own teeth)
  if (body === 'harpy' && !boneMode) {
    parts.push(<HarpyTeeth key="harpy-teeth" layer="flesh" ghost={ghost}/>);
  }
  // Lich crown + glowing eyes
  if (has('lich')) {
    parts.push(<LichCrown key="lich-crown"/>);
    const lichEyes = body === 'giant_snake' ? [{ cx: 94, cy: 44 }]
                   : body === 'giant_rat'   ? [{ cx: 62, cy: 46 }]
                   :                          undefined;
    parts.push(<LichEyes key="lich-eyes" eyes={lichEyes}/>);
  }

  // ── 6. Front limbs (in front of body) ────────────────────────────────────

  // Arms
  if (!boneMode && hasBipedArms) {
    parts.push(bpArmFront('arm-front'));
  } else if (boneMode && body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat') {
    parts.push(<SkeletonArmFront key="arm-front-bone"/>);
  }

  // Legs
  if (body === 'giant_rat') {
    if (!boneMode) {
      if (chimeraOf('goat')) {
        // Rat forepaws; goat hind legs were already deferred to §2
        parts.push(
          <RatLegFront  key="rat-paw-back"   cx={110} topY={112} ghost={ghost}/>,
          <RatLegFront  key="rat-paw-front"  cx={46}  topY={112} ghost={ghost}/>,
          <GoatLegFront key="goat-leg-front" layer="flesh" ghost={ghost}/>,
        );
      } else {
        parts.push(
          <RatLegBack  key="rat-hl-front"  cx={66}  topY={258} ghost={ghost}/>,
          <RatLegFront key="rat-paw-back"  cx={110} topY={112} ghost={ghost}/>,
          <RatLegFront key="rat-paw-front" cx={46}  topY={112} ghost={ghost}/>,
        );
      }
    } else {
      parts.push(
        <RatLegBackBone  key="rat-hl-front-b"  cx={66}  topY={258}/>,
        <RatLegFrontBone key="rat-paw-back-b"  cx={110} topY={112}/>,
        <RatLegFrontBone key="rat-paw-front-b" cx={46}  topY={112}/>,
      );
    }
  } else if (!boneMode) {
    if (goatLegChimera) {
      parts.push(<GoatLegFront key="goat-leg-front" layer="flesh" ghost={ghost}/>);
    } else if (body === 'zombie' || body === 'human') {
      parts.push(bpLegFront('leg-front'));
    } else if (body === 'harpy') {
      parts.push(<HarpyLegFront key="leg-front" layer="flesh" ghost={ghost}/>);
    } else if (body === 'phoenix') {
      // Back leg already in §2; just the front leg here
      parts.push(<PhoenixLegFront key="bird-leg-front" layer="flesh" ghost={ghost}/>);
    } else if (body === 'giant_spider' && chimeraOf('phoenix')) {
      // Both phoenix legs deferred here so they render in front of spider abdomen
      parts.push(
        <PhoenixLegBack  key="bird-leg-back"  layer="flesh" ghost={ghost}/>,
        <PhoenixLegFront key="bird-leg-front" layer="flesh" ghost={ghost}/>,
      );
    }
  } else if (body !== 'mermaid' && body !== 'giant_snake' && body !== 'goat') {
    parts.push(<SkeletonLegFront key="leg-front-bone"/>);
  }

  // ── 7. Joint knobs always last ────────────────────────────────────────────
  if (boneMode && body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat') {
    parts.push(<SkeletonJointKnobs key="joint-knobs" includeHips={body !== 'mermaid'}/>);
  }

  // ── 8. Slime goop overlay ─────────────────────────────────────────────────
  // Fires when slime is a chimera contributor (i.e. any creature + slime keyword).
  // Silhouette polygon is chosen based on the dominant body plan.
  if (chimeraOf('slime')) {
    let goopPts: Pt[];

    switch (body) {
      case 'giant_snake':
        goopPts = [
          [78, 10],  [124,44],  [148,106], [104,190], [91, 306],
          [118,370], [78, 390], [38, 370], [22, 306],
          [52, 190], [8,  106], [40, 44],
        ];
        break;
      case 'giant_spider':
        goopPts = [
          [80,  34],  [130, 60],  [155, 100], [155, 220],
          [130, 280], [80,  295], [28,  280], [2,   220],
          [2,   100], [28,  60],
        ];
        break;
      case 'giant_rat':
        goopPts = [
          [78,  18],  [118, 50],  [142, 100], [142, 168],
          [118, 280], [78,  300], [38,  280], [14,  168],
          [14,  100], [38,  50],
        ];
        break;
      case 'mermaid':
        goopPts = [
          [78,  18],  [120, 46],  [130, 108], [130, 220],
          [110, 320], [90,  430], [60,  430], [46,  320],
          [26,  220], [26,  108], [36,  46],
        ];
        break;
      case 'centaur':
        goopPts = [
          [78,   4],  [126,  40],  [130,  100], [82,   220], [80,   374],
          [72,   374],[27,   374], [10,   340], [10,   228], [4,    175],
          [16,   375],[38,   376], [80,   376], [90,   228], [96,   155],
          [130,  100],[110,  112], [26,   108],
        ];
        break;
      case 'goat':
        goopPts = [
          [78,  2],   [124, 8],  [124, 26], [130, 100], [148, 200],
          [112, 262], [108, 310],[96,  414], [60,  414],
          [48,  310], [44,  262],[28,  200], [26,  100], [30,  26], [30,  8],
        ];
        break;
      default: // human, zombie, phoenix, harpy, chimera biped hosts
        goopPts = [
          [78,  18],  [118, 44],  [130, 100], [148, 200],
          [130, 260], [110, 420], [66,  420], [46,  260],
          [28,  200], [26,  100], [36,  44],
        ];
    }
    parts.push(<SlimeGoop key="slime-goop" pts={goopPts}/>);
  }

  // ── 9. Flames on top of everything ───────────────────────────────────────
  if (has('phoenix')) parts.push(<PhoenixFlames key="phoenix-flames"/>);

  // ── Wing anchor ───────────────────────────────────────────────────────────
  const wingAnchorX = 80;
  const wingAnchorY = (body === 'giant_spider' && !boneMode) ? 90 : 125;

  return {
    parts,
    viewBox: body === 'mermaid'       ? '-30 0 220 460'
           : boneSpider               ? '-30 -10 220 450'
           : body === 'centaur'       ? '0 0 160 405'
           : body === 'phoenix'       ? '-20 -30 200 450'
           : body === 'harpy'         ? '0 -50 160 480'
           :                            '0 0 160 420',
    width:   body === 'mermaid'  ? 190 : body === 'phoenix' ? 180 : 160,
    height:  body === 'mermaid'  ? 460 : body === 'centaur' ? 405
           : body === 'phoenix'  ? 405 : body === 'harpy'   ? 480 : 420,
    hasWings,
    goatBody: body === 'goat',
    wingsBackground: body === 'giant_spider' && !boneMode,
    wingAnchorX,
    wingAnchorY,
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
