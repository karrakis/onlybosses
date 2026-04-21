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
  // isSkeleton / isLich are rendering modes, not separate body plans.
  // goat + skeleton → pure goat in bone mode (GoatSkeletonBody), not a chimera.
  const goatChimera = isGoat && (isHuman || isCentaur || isMermaid || isPhoenix ||
                                  isSpider || isHarpy || isRat || isSnake);

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
  const usesHumanLegs = !isMermaid && !isPhoenix && !(isSpider && !boneMode) && !isRat && !isSnake && !usesGoatLegs && !(isSlime && !slimeChimera) && !(isGoat && !goatChimera);

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
    const ratTailAnchor = isCentaur ? { anchorX: 11,  anchorY: 176 }
                        : isSnake   ? { anchorX: 78,  anchorY: 306 }
                        : isSpider  ? { anchorX: 80,  anchorY: 290 }
                        :             { anchorX: 40,  anchorY: 250 };
    parts.push(<RatTail key="rat-tail" layer="flesh" ghost={ghost} {...ratTailAnchor}/>);
    // Legs only for pure rat — chimera uses the other creature's body plan
    if (!ratChimera) {
      if (!boneMode) {
        parts.push(<RatLegBack key="rat-hl-back" cx={90} topY={258} ghost={ghost}/>);
      } else {
        parts.push(<RatLegBackBone key="rat-hl-back-b" cx={90} topY={258}/>);
      }
    } else if (isGoat && !boneMode) {
      // rat+goat: goat hind legs anchored at rat's hip positions (near cx=66, far cx≈90)
      parts.push(<GoatLegBack key="goat-leg-back" layer="flesh" ghost={ghost} tx={24}/>);
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
    if (!isSnake && !(isGoat && !goatChimera)) {
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
      if (!isSnake && !(isGoat && !goatChimera)) {
        parts.push(<SkeletonLegBack key="leg-back-bone"/>);
      }
    }
  }

  // ── 3. Ribcage / pelvis drawn under torso (visible through ghost torso) ──
  // NOTE: intentionally omitted here — moved to after the main body so that
  // in centaur combos the skeleton floats in front of the horse barrel.

  // ── 4. Main body ──────────────────────────────────────────────
  if (isRat && (!ratChimera || isGoat)) {
    if (!boneMode) {
      parts.push(<RatBody key="rat-body" layer="flesh" ghost={ghost}/>);
      // Spider chimera: graft spider legs onto rat torso (body/head suppressed — rat anatomy wins).
      if (isSpider) {
        parts.push(<SpiderLegs key="spider-legs" ghost={ghost}/>);
      }
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
    if (boneMode) {
      parts.push(<GoatSkeletonBody key="goat-skeleton"/>);
    } else {
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
    } else if (!(isGoat && !goatChimera)) {
      // GoatSkeletonBody (section 4) has its own ribcage — skip humanoid skeleton internals.
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
  // Suppressed for rat+goat — goat horns replace the ears.
  if (ratChimera && !boneMode && !isSpider && !isGoat) {
    const earDy = isSnake ? -12 : -4;  // snake crown ≈ y=10; humanoid crown ≈ y=18
    parts.push(<RatEars key="rat-ears" layer="flesh" ghost={ghost} dy={earDy}/>);
  }
  if (isRat && (!ratChimera || isGoat)) {
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
  } else if (isGoat && !goatChimera) {
    // GoatSkeletonBody / GoatBody (section 4) is self-contained — skull, horns, eyes all included.
  } else if (boneMode) {
    parts.push(<SkeletonSkull key="skull"/>);
    if (boneSpider) {
      parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
    }
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
  // Spider chimera on rat host: 8-eye cluster over the rat head.
  if (isSpider && !boneMode && isRat) {
    parts.push(<SpiderEyes key="spider-eyes" ghost={ghost}/>);
  }
  // Rat chimera: whiskers after head so they show on top.
  if (ratChimera && !boneMode && !isSpider && !isGoat) {
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
      if (!isSnake && !(isGoat && !goatChimera)) {
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
  } else if (isRat && isGoat && !boneMode) {
    // rat+goat: keep rat's stubby forepaws, goat hind legs already pushed in section 2
    parts.push(<RatLegFront key="rat-paw-back"  cx={110} topY={112} ghost={ghost}/>);
    parts.push(<RatLegFront key="rat-paw-front" cx={46}  topY={112} ghost={ghost}/>);
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
  } else if (!isMermaid && !isSnake && !(isGoat && !goatChimera)) {
    parts.push(<SkeletonLegFront key="leg-front-bone"/>);
  }

  // ── 7. Joint knobs always last ────────────────────────────────
  if (boneMode && !isRat && !isSnake && !(isGoat && !goatChimera)) {
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
      // Cephalothorax top ~(80,54), abdomen bottom ~(80,290); legs extend x≈-67 to 226 (overflow: visible)
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

  // ── Wing anchor ────────────────────────────────────────────────────────────
  // Attachment point in SVG element pixel space (1:1 with standard 160×420 viewBox).
  // Spider: cephalothorax/abdomen junction ~(80,90); humanoid/others: mid-back (80,125).
  const wingAnchorX = 80;
  const wingAnchorY = (isSpider && !boneMode) ? 90 : 125;

  return {
    parts,
    viewBox: isMermaid ? '-30 0 220 460' : boneSpider ? '-30 -10 220 450' : isCentaur ? '0 0 160 405' : isPhoenix ? '-20 -30 200 450' : isHarpy ? '0 -50 160 480' : '0 0 160 420',
    width:   isMermaid ? 190 : isPhoenix ? 180 : 160,
    height:  isMermaid ? 460 : isCentaur ? 405 : isPhoenix ? 405 : isHarpy ? 480 : 420,
    hasWings,
    goatBody: isGoat && !goatChimera,
    wingsBackground: isSpider && !boneMode,
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
