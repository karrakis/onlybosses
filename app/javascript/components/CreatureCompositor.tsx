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
import { Pt, SpiderLimbAnchor, LegAnchor, HeadPt, EarAnchor, CrackSeg } from './creature_parts/types';
import {
  UprightTorso, HumanoidHead,
  HumanoidArmBack, HumanoidArmFront,
  HumanoidLegBack, HumanoidLegFront,
  GoblinTorso, GoblinHead, GoblinArmBack, GoblinArmFront, GoblinLegBack, GoblinLegFront, GoblinEars,
  HorseBarrel, HorseLeg, HorseTail,
  HorseRibcage, HorsePelvis, HorseLegBone,
  PhoenixLegBack, PhoenixLegFront, PhoenixTail, PhoenixBeak, PhoenixHead, PhoenixTorso,
  HarpyCrest, HarpyTeeth, HarpyLegBack, HarpyLegFront,
  HUMANOID_SPIDER_LIMB_ANCHORS,
  HUMANOID_LEG_ANCHORS, HARPY_LEG_ANCHORS, PHOENIX_LEG_ANCHORS, GOBLIN_LEG_ANCHORS,
  HUMANOID_SLIME_GOOP_PTS,
  HUMANOID_EYE_ANCHORS, HUMANOID_CROWN_ANCHOR, HUMANOID_CRACK_SEGS, HUMANOID_EAR_ANCHORS,
  PHOENIX_WING_ANCHOR, GOBLIN_WING_ANCHOR,
  PHOENIX_EYE_ANCHORS, PHOENIX_CROWN_ANCHOR, PHOENIX_CRACK_SEGS, PHOENIX_SLIME_GOOP_PTS,
  HARPY_EYE_ANCHORS,   HARPY_CROWN_ANCHOR,   HARPY_CRACK_SEGS,   HARPY_SLIME_GOOP_PTS,
  GOBLIN_EYE_ANCHORS,  GOBLIN_CROWN_ANCHOR,  GOBLIN_CRACK_SEGS,  GOBLIN_SLIME_GOOP_PTS, GOBLIN_EAR_ANCHORS,
} from './creature_parts/humanoid';
import {
  MermaidTail, MermaidTailBone, MermaidShellBra,
  MERMAID_LEG_ANCHORS, MERMAID_SPIDER_LIMB_ANCHORS,
  MERMAID_SLIME_GOOP_PTS,
  MERMAID_EYE_ANCHORS, MERMAID_CROWN_ANCHOR, MERMAID_CRACK_SEGS,
} from './creature_parts/mermaid';
import {
  SkeletonRibcage, SkeletonPelvis,
  SkeletonArmBack, SkeletonArmFront,
  SkeletonLegBack, SkeletonLegFront,
  SkeletonSkull, SkeletonJointKnobs, SkeletonCracks,
  PhoenixSkull, PhoenixRibcage, PhoenixPelvis, PhoenixTailBone,
  PhoenixLegBackBone, PhoenixLegFrontBone, PhoenixJointKnobs,
  GoblinSkull, GoblinRibcage, GoblinPelvis,
  GoblinArmBackBone, GoblinArmFrontBone,
  GoblinLegBackBone, GoblinLegFrontBone, GoblinJointKnobs,
} from './creature_parts/skeleton';
import { LichCrown, LichEyes, PhoenixFlames } from './creature_parts/ethereal';
import {
  RatTail, RatLegBack, RatLegFront, RatBody, RatHead,
  RatEars, RatWhiskers,
  RatRibcage, RatPelvis, RatSkullHead,
  RatLegBackBone, RatLegFrontBone,
  RAT_LEG_ANCHORS, RAT_SLIME_GOOP_PTS,
  RAT_EYE_ANCHORS, RAT_CROWN_ANCHOR, RAT_CRACK_SEGS,
} from './creature_parts/rat';
import {
  SnakeCoil, SnakeBody, SnakeCoilFront, SnakeHood, SnakeHead,
  SnakeRibcage, SnakeSkullHead,
  SNAKE_SLIME_GOOP_PTS,
  SNAKE_EYE_ANCHORS, SNAKE_CROWN_ANCHOR, SNAKE_CRACK_SEGS,
} from './creature_parts/snake';
import {
  SpiderLegs, SpiderBody, SpiderHairs, SpiderEyes,
  SpiderBoneEyes, SpiderChimeraLimbs,
  SPIDER_SLIME_GOOP_PTS,
} from './creature_parts/spider';
import { SlimeBody, SlimeGoop } from './creature_parts/slime';
import {
  GoatBody, GoatSkeletonBody,
  GoatHornsChimera, GoatEyeOverlay,
  GoatLegBack, GoatLegFront,
  GOAT_SPIDER_LIMB_ANCHORS,
  GOAT_CHIMERA_LEG_ANCHORS, GOAT_SLIME_GOOP_PTS,
  GOAT_EYE_ANCHORS, GOAT_CROWN_ANCHOR, GOAT_CRACK_SEGS,
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
    'giant_snake',   // serpentine
    'giant_rat',     // quadruped
    'phoenix',       // bird legs + fire
    'harpy',         // bird legs + wings
    'goat',          // digitigrade
    'goblin',        // short hunched humanoid
    'zombie',        // upright undead — intentionally beats plain human
    'slime',         // blob
    'giant_spider',  // 8-legged — lowest priority; anything else takes the torso
  ] as const;
  type BodyPlan = typeof BODY_PLANS[number] | 'human';

  const body = (BODY_PLANS.find(b => has(b)) ?? 'human') as BodyPlan;
  // centaur is an anchor attachment, not a body plan — fires for any host torso
  const hasHindquarters = has('centaur');

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

  // Anchor lookup for spider chimera limbs — keyed by body plan.
  // Falls back to humanoid anchors for any body not explicitly listed.
  const SPIDER_LIMB_ANCHOR_MAP: Partial<Record<string, SpiderLimbAnchor[]>> = {
    mermaid: MERMAID_SPIDER_LIMB_ANCHORS,
    goat:    GOAT_SPIDER_LIMB_ANCHORS,
  };
  const _spiderAnchors    = SPIDER_LIMB_ANCHOR_MAP[body] ?? HUMANOID_SPIDER_LIMB_ANCHORS;
  const spiderBackAnchors  = _spiderAnchors.filter(a => a.layer === 'back');
  const spiderFrontAnchors = _spiderAnchors.filter(a => a.layer === 'front');
  const doSpiderChimera    = boneSpider || chimeraOf('giant_spider');

  // Body plans that carry paired arms (upright biped torso + hands)
  const hasBipedArms = body === 'mermaid'
                    || body === 'zombie' || body === 'human' || body === 'goblin';

  // Unified ear slots: host body defines two ear anchors; highest-priority ear
  // contributor fills those slots. Torso ownership does not grant ear priority.
  const HOST_EAR_ANCHOR_MAP: Partial<Record<BodyPlan | 'human', EarAnchor[]>> = {
    human:       HUMANOID_EAR_ANCHORS,
    zombie:      HUMANOID_EAR_ANCHORS,
    mermaid:     HUMANOID_EAR_ANCHORS,
    giant_rat:   HUMANOID_EAR_ANCHORS,
    giant_snake: HUMANOID_EAR_ANCHORS.map(({ cx, cy, layer }) => ({ cx, cy: cy - 12, layer })),
    // Phoenix side profile: anchors are on the rear skull edge opposite beak.
    // Shifted upward 10px along the skull line for boss-mode composition.
    phoenix:     [{ cx: 66, cy: 82, layer: 'back' }, { cx: 68, cy: 98, layer: 'back' }],
    harpy:       HUMANOID_EAR_ANCHORS,
    goat:        HUMANOID_EAR_ANCHORS,
    goblin:      GOBLIN_EAR_ANCHORS,
  };
  const hostEarAnchors = HOST_EAR_ANCHOR_MAP[body] ?? HUMANOID_EAR_ANCHORS;
  const backEarAnchors = hostEarAnchors.filter(a => a.layer === 'back');
  const frontEarAnchors = hostEarAnchors.filter(a => a.layer === 'front');

  const earContributor: 'goblin' | 'giant_rat' | null = has('goblin')
    ? 'goblin'
    : has('giant_rat')
      ? 'giant_rat'
      : null;

  // Horse barrel flesh colour tinted by coexisting snake/rat keywords
  const horseFlesh = has('giant_snake') ? { base: '#2d5a1e', hi: '#4a8c2e' }
                   : has('giant_rat')   ? { base: '#c8963c', hi: '#e8b870' }
                   :                      { base: 'white',   hi: 'white'   };

  // ── Biped part helpers ────────────────────────────────────────────────────
  // All upright-torso slots (torso, head, arms, legs) run through bipedStyle so
  // zombie styling flows through centaur, mermaid, harpy, etc. automatically.
  const bpTorso    = (k: string) => body === 'goblin'
    ? <GoblinTorso      key={k} layer="flesh" ghost={ghost}/>
    : (bipedStyle === 'zombie'
      ? <ZombieBody       key={k} layer="flesh" ghost={ghost}/>
      : <UprightTorso     key={k} layer="flesh" ghost={ghost}/>);
  const bpHead     = (k: string) => body === 'goblin'
    ? <GoblinHead       key={k} layer="flesh" ghost={ghost}/>
    : (bipedStyle === 'zombie'
      ? <ZombieHead       key={k} layer="flesh" ghost={ghost}/>
      : <HumanoidHead     key={k} layer="flesh" ghost={ghost}/>);
  const bpArmBack  = (k: string) => body === 'goblin'
    ? <GoblinArmBack    key={k} layer="flesh" ghost={ghost}/>
    : (bipedStyle === 'zombie'
      ? <ZombieArmBack    key={k} layer="flesh" ghost={ghost}/>
      : <HumanoidArmBack  key={k} layer="flesh" ghost={ghost}/>);
  const bpArmFront = (k: string) => body === 'goblin'
    ? <GoblinArmFront   key={k} layer="flesh" ghost={ghost}/>
    : (bipedStyle === 'zombie'
      ? <ZombieArmFront   key={k} layer="flesh" ghost={ghost}/>
      : <HumanoidArmFront key={k} layer="flesh" ghost={ghost}/>);

  // ── Leg rendering ──────────────────────────────────────────────────────────
  // Central dispatcher: converts a LegAnchor into the correct React node.
  // Component variant (back/front) is anchor.variant ?? anchor.layer.
  function renderLeg(anchor: LegAnchor): React.ReactNode {
    const v = anchor.variant ?? anchor.layer;
    if (boneMode) {
      switch (anchor.type) {
        case 'biped': case 'harpy':
          return v === 'back' ? <SkeletonLegBack  key={anchor.key}/> : <SkeletonLegFront key={anchor.key}/>;
        case 'goblin':
          return v === 'back' ? <GoblinLegBackBone key={anchor.key}/> : <GoblinLegFrontBone key={anchor.key}/>;
        case 'phoenix':
          return v === 'back' ? <PhoenixLegBackBone key={anchor.key}/> : <PhoenixLegFrontBone key={anchor.key}/>;
        case 'rat-hind':
          return <RatLegBackBone  key={anchor.key} cx={anchor.cx!} topY={anchor.topY!}/>;
        case 'rat-fore':
          return <RatLegFrontBone key={anchor.key} cx={anchor.cx!} topY={anchor.topY!}/>;
        default: return null;
      }
    }
    switch (anchor.type) {
      case 'biped':
        return v === 'back'
          ? (bipedStyle === 'zombie' ? <ZombieLegBack   key={anchor.key} layer="flesh" ghost={ghost}/> : <HumanoidLegBack  key={anchor.key} layer="flesh" ghost={ghost}/>)
          : (bipedStyle === 'zombie' ? <ZombieLegFront  key={anchor.key} layer="flesh" ghost={ghost}/> : <HumanoidLegFront key={anchor.key} layer="flesh" ghost={ghost}/>);
      case 'goblin':
        return v === 'back' ? <GoblinLegBack key={anchor.key} layer="flesh" ghost={ghost}/> : <GoblinLegFront key={anchor.key} layer="flesh" ghost={ghost}/>;
      case 'rat-hind':
        return <RatLegBack  key={anchor.key} cx={anchor.cx!} topY={anchor.topY!} ghost={ghost}/>;
      case 'rat-fore':
        return <RatLegFront key={anchor.key} cx={anchor.cx!} topY={anchor.topY!} ghost={ghost}/>;
      case 'goat-hind':
        return <GoatLegBack  key={anchor.key} layer="flesh" ghost={ghost} tx={anchor.tx ?? 0}/>;
      case 'goat-fore':
        return <GoatLegFront key={anchor.key} layer="flesh" ghost={ghost}/>;
      case 'harpy':
        return v === 'back' ? <HarpyLegBack  key={anchor.key} layer="flesh" ghost={ghost}/> : <HarpyLegFront key={anchor.key} layer="flesh" ghost={ghost}/>;
      case 'phoenix':
        return v === 'back' ? <PhoenixLegBack key={anchor.key} layer="flesh" ghost={ghost}/> : <PhoenixLegFront key={anchor.key} layer="flesh" ghost={ghost}/>;
      default: return null;
    }
  }

  // ── Leg anchor computation ────────────────────────────────────────────────
  // Each body owns its anchor geometry. Chimera goat overrides matching slots.
  const LEG_ANCHOR_MAP: Partial<Record<BodyPlan | 'human', LegAnchor[]>> = {
    human:     HUMANOID_LEG_ANCHORS,
    zombie:    HUMANOID_LEG_ANCHORS,
    goblin:    GOBLIN_LEG_ANCHORS,
    phoenix:   PHOENIX_LEG_ANCHORS,
    harpy:     HARPY_LEG_ANCHORS,
    giant_rat: RAT_LEG_ANCHORS,
    mermaid:   MERMAID_LEG_ANCHORS,
    // giant_snake, giant_spider, goat, slime: no discrete legs
  };
  let legAnchors: LegAnchor[] = LEG_ANCHOR_MAP[body] ?? [];

  // Centaur provides all four horse legs — suppress the body's own.
  if (hasHindquarters) legAnchors = [];

  // Goat chimera: replace non-immune slots with goat's components.
  // goatTx on the replaced anchor carries the host-specific offset (rat=24, others=0).
  if (chimeraOf('goat') && !boneMode) {
    const toReplace = legAnchors.filter(a => !a.goatImmune);
    const immune    = legAnchors.filter(a =>  a.goatImmune);
    const slotsGone = new Set(toReplace.map(a => a.slot));
    const hindTx    = toReplace.find(a => a.slot === 'hind')?.goatTx ?? 0;
    legAnchors = [
      ...immune,
      ...GOAT_CHIMERA_LEG_ANCHORS
        .filter(a => slotsGone.has(a.slot))
        .map(a => (a.slot === 'hind' ? { ...a, tx: hindTx } : a)),
    ];
  }

  // Phoenix + spider chimera: defer both bird legs to front so they render
  // in front of the spider abdomen. variant preserves original component selection.
  if (body === 'phoenix' && chimeraOf('giant_spider')) {
    legAnchors = legAnchors.map(a => ({ ...a, layer: 'front' as const, variant: a.layer }));
  }

  const backLegAnchors  = legAnchors.filter(a => a.layer === 'back');
  const frontLegAnchors = legAnchors.filter(a => a.layer === 'front');

  // ── Arm contributor system ────────────────────────────────────────────────
  // How many weapon-holding arm pairs each keyword contributes.
  // Mirrors creatures.jsonl max_hands. Skeleton/lich are render modifiers, not
  // arm contributors — they change style but not count.
  const MAX_HANDS: Partial<Record<string, number>> = {
    'human':      2,
    'zombie':     2,
    'centaur':    2,  // human upper body — chimera arms when not the sole body
    'mermaid':    2,
    'giant_rat':  2,  // forepaws count as hands
  };
  // Chimera keywords present that contribute arm pairs beyond the body plan's own.
  // Body plan handles its own primary pair; chimeras get additional pairs, rotated.
  // Special: centaur+human is a pure centaur (human is the fallback host, not a distinct creature);
  // centaur's arms ARE the human arms — skip to avoid double-counting.
  const extraArmKeywords = Object.keys(MAX_HANDS).filter(k => {
    if (!chimeraOf(k)) return false;
    if (k === 'centaur' && body === 'human') return false;
    return true;
  });

  // Render one arm for a chimera contributor.
  // In bone mode all extra arms use skeleton style regardless of contributor.
  // Back arm rotates around the far shoulder (110, 112).
  // Front arm rotates around the near shoulder (46, 112).
  const renderChimeraArmBack = (kw: string): React.ReactNode => {
    if (boneMode) return <SkeletonArmBack key={`arm-back-x-${kw}`}/>;
    switch (kw) {
      case 'zombie':    return <ZombieArmBack    key={`arm-back-x-${kw}`} layer="flesh" ghost={ghost}/>;
      case 'giant_rat': return <RatLegFront      key={`arm-back-x-${kw}`} cx={110} topY={112} ghost={ghost}/>;
      default:          return <HumanoidArmBack  key={`arm-back-x-${kw}`} layer="flesh" ghost={ghost}/>;
    }
  };
  const renderChimeraArmFront = (kw: string): React.ReactNode => {
    if (boneMode) return <SkeletonArmFront key={`arm-front-x-${kw}`}/>;
    switch (kw) {
      case 'zombie':    return <ZombieArmFront   key={`arm-front-x-${kw}`} layer="flesh" ghost={ghost}/>;
      case 'giant_rat': return <RatLegFront      key={`arm-front-x-${kw}`} cx={46}  topY={112} ghost={ghost}/>;
      default:          return <HumanoidArmFront key={`arm-front-x-${kw}`} layer="flesh" ghost={ghost}/>;
    }
  };

  const parts: React.ReactNode[] = [];

  // ── 1. Wings go behind everything (handled by viewport as <object> layers)
  // Nothing to add inline for wings.

  // ── 2. Back-most elements first ───────────────────────────────

  // Horse hindquarters: far-side legs go behind barrel
  if (hasHindquarters) {
    if (boneMode) {
      // Bone mode: all 4 leg bones in one pass (no barrel layering needed)
      if (!has('giant_rat')) parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      parts.push(
        <HorseLegBone key="horse-leg-br"    cx={38} topY={224}/>,
        <HorseLegBone key="horse-leg-ffar"  cx={80} topY={220}/>,
        <HorseLegBone key="horse-leg-bn"    cx={27} topY={222}/>,
        <HorseLegBone key="horse-leg-fnear" cx={72} topY={218}/>,
      );
    } else {
      if (!has('giant_rat')) parts.push(<HorseTail key="horse-tail" layer="flesh" ghost={ghost}/>);
      // Far-side legs behind barrel; near-side deferred to §3.5
      parts.push(
        <HorseLeg key="horse-leg-br"   cx={38} topY={224} ghost={ghost} fill={horseFlesh.base}/>,
        <HorseLeg key="horse-leg-ffar" cx={80} topY={220} ghost={ghost} fill={horseFlesh.base}/>,
      );
    }
  }

  // Rat tail: anchored to host body regardless of dominance
  if (body === 'giant_rat' || chimeraOf('giant_rat')) {
    const anchor = hasHindquarters         ? { anchorX: 11, anchorY: 176 }
                 : body === 'giant_snake'  ? { anchorX: 78, anchorY: 306 }
                 : body === 'giant_spider' ? { anchorX: 80, anchorY: 290 }
                 :                           { anchorX: 40, anchorY: 250 };
    parts.push(<RatTail key="rat-tail" layer="flesh" ghost={ghost} {...anchor}/>);
  }

  // Snake coil sits behind the hood (only for snake-dominant body)
  if (body === 'giant_snake' && !boneMode) {
    parts.push(<SnakeCoil key="snake-coil" layer="flesh" ghost={ghost}/>);
  }

  // Phoenix tail fan: apex is inside the torso, clipped at y=258 (waist-band bottom)
  // so the fan emerges below the torso/waist. Rendered early so everything sits on top.
  if (body === 'phoenix' && !boneMode) {
    parts.push(<PhoenixTail key="phoenix-tail" layer="flesh" ghost={ghost}/>);
  }

  // §3.5. Horse hindquarters — barrel + near-side legs (behind back arm and upright torso)
  // Fires for any body plan; centaur is no longer a competing body plan.
  if (hasHindquarters) {
    if (!boneMode || ghost) {
      parts.push(<HorseBarrel key="horse-barrel" layer="flesh" ghost={ghost} fill={horseFlesh.base}/>);
    }
    if (!boneMode) {
      parts.push(
        <HorseLeg key="horse-leg-bn"    cx={27} topY={222} ghost={ghost} fill={horseFlesh.base}/>,
        <HorseLeg key="horse-leg-fnear" cx={72} topY={218} ghost={ghost} fill={horseFlesh.base}/>,
      );
    }
  }

  // Spider chimera back-layer limbs — rendered before main body so they sit behind it.
  if (doSpiderChimera && spiderBackAnchors.length > 0) {
    parts.push(<SpiderChimeraLimbs key="spider-back" anchors={spiderBackAnchors} bone={boneMode} ghost={ghost}/>);
  }

  const phoenixNoSideArms = body === 'phoenix';

  // Back arm — primary pair from body plan, then extra chimera pairs (rotated)
  if (!boneMode) {
    if (hasBipedArms && !phoenixNoSideArms) parts.push(bpArmBack('arm-back'));
  } else {
    if (body === 'goblin' && !phoenixNoSideArms) {
      parts.push(<GoblinArmBackBone key="arm-back-bone"/>);
    } else if (body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat' && !phoenixNoSideArms) {
      parts.push(<SkeletonArmBack key="arm-back-bone"/>);
    }
  }
  // Extra chimera arm pairs: each numbered pair fans back/up by 22° from the shoulder pivot
  (!phoenixNoSideArms ? extraArmKeywords : []).forEach((kw, i) => {
    const rot = -(i + 1) * 22;
    parts.push(
      <g key={`arm-back-wrap-${kw}`} transform={`rotate(${rot}, 110, 112)`}>
        {renderChimeraArmBack(kw)}
      </g>
    );
  });

  // Back leg — driven by body's leg anchors (computed above)
  backLegAnchors.forEach(a => { const n = renderLeg(a); if (n) parts.push(n); });

  // Phoenix head is drawn in §4, so its "back" ears must be emitted now.
  if (!boneMode && body === 'phoenix' && earContributor && backEarAnchors.length > 0) {
    if (earContributor === 'goblin') {
      parts.push(<GoblinEars key="ears-goblin-back" layer="flesh" ghost={ghost} anchors={backEarAnchors}/>);
    } else {
      parts.push(<RatEars key="ears-rat-back" layer="flesh" ghost={ghost} anchors={backEarAnchors}/>);
    }
  }

  // ── 4. Main body ──────────────────────────────────────────────────────────
  switch (body) {
    case 'giant_rat':
      if (!boneMode) {
        parts.push(<RatBody key="rat-body" layer="flesh" ghost={ghost}/>);
      }
      break;

    case 'giant_snake':
      if (!boneMode) parts.push(<SnakeBody key="snake-body" layer="flesh" ghost={ghost}/>);
      break;

    case 'mermaid':
      if (!boneMode) {
        parts.push(bpTorso('torso'));
        parts.push(<MermaidTail key="mermaid-tail" layer="flesh" ghost={ghost}/>);
      } else {
        parts.push(<MermaidTailBone key="mermaid-tail-bone"/>);
      }
      break;

    case 'giant_spider':
      if (!boneMode) {
        parts.push(
          <SpiderLegs  key="spider-legs"  ghost={ghost}/>,
          <SpiderBody  key="spider-body"  ghost={ghost}/>,
          <SpiderHairs key="spider-hairs" ghost={ghost}/>,
        );
      }
      break;

    case 'goat':
      if (boneMode) parts.push(<GoatSkeletonBody key="goat-skeleton"/>);
      else          parts.push(<GoatBody key="goat-body" layer="flesh" ghost={ghost}/>);
      break;

    case 'goblin':
      if (!boneMode) parts.push(bpTorso('torso'));
      break;

    case 'slime':
      if (!boneMode) parts.push(<SlimeBody key="slime-body" layer="flesh" ghost={ghost}/>);
      break;

    default: // 'human', 'zombie', 'phoenix', 'harpy'
      if (body === 'phoenix' && !boneMode) {
        // Beak + head drawn first so the oval body bites into the head base.
        parts.push(<PhoenixBeak key="phoenix-beak" layer="flesh" ghost={ghost}/>);
        parts.push(<PhoenixHead key="phoenix-head" layer="flesh" ghost={ghost}/>);
        parts.push(<PhoenixTorso key="torso" layer="flesh" ghost={ghost}/>);
      } else if (!boneMode) {
        parts.push(bpTorso('torso'));
      }
      break;
  }

  // ── 4b. Skeleton internals ────────────────────────────────────────────────
  if (boneMode) {
    // Centaur always gets horse ribcage in addition to upright internals
    if (hasHindquarters) {
      parts.push(<HorseRibcage key="horse-ribcage"/>, <HorsePelvis key="horse-pelvis"/>);
    }
    // Upper-body internals (mutually exclusive; centaur block above doesn't exclude these)
    if (body === 'giant_rat') {
      parts.push(<RatRibcage key="rat-ribcage"/>, <RatPelvis key="rat-pelvis"/>);
    } else if (body === 'giant_snake' || chimeraOf('giant_snake')) {
      // Includes centaur+snake chimera: centaur gets horse+snake ribcage
      parts.push(<SnakeRibcage key="snake-ribcage"/>);
    } else if (body === 'phoenix') {
      parts.push(
        <PhoenixRibcage key="phoenix-ribcage"/>,
        <PhoenixPelvis key="phoenix-pelvis"/>,
        <PhoenixTailBone key="phoenix-tail-bone"/>,
      );
    } else if (body === 'goblin') {
      parts.push(<GoblinRibcage key="goblin-ribcage"/>, <GoblinPelvis key="goblin-pelvis"/>);
    } else if (body !== 'goat') {
      // GoatSkeletonBody (§4) is self-contained; skip humanoid internals for pure goat.
      // Fish tail replaces the pelvis entirely — mermaid gets ribcage only here.
      parts.push(<SkeletonRibcage key="ribcage"/>);
      if (body !== 'mermaid') parts.push(<SkeletonPelvis key="pelvis"/>);
    }
    if (has('lich')) {
      const CRACK_MAP: Partial<Record<BodyPlan | 'human', CrackSeg[]>> = {
        mermaid:     MERMAID_CRACK_SEGS,
        giant_rat:   RAT_CRACK_SEGS,
        giant_snake: SNAKE_CRACK_SEGS,
        goat:        GOAT_CRACK_SEGS,
        goblin:      GOBLIN_CRACK_SEGS,
        phoenix:     PHOENIX_CRACK_SEGS,
        harpy:       HARPY_CRACK_SEGS,
      };
      parts.push(<SkeletonCracks key="cracks" segs={CRACK_MAP[body] ?? HUMANOID_CRACK_SEGS}/>);
    }
  }

  // ── 5. Head ───────────────────────────────────────────────────────────────
  // Harpy crest sits above the skull — draw before head in both flesh and bone modes.
  if (body === 'harpy') parts.push(<HarpyCrest key="harpy-crest" layer="flesh" ghost={ghost}/>);

  // Goat horns: chimera graft, drawn BEFORE head so skull overlaps horn base.
  if (chimeraOf('goat') && !boneMode) {
    const hornDy = body === 'giant_snake' ? -12 : body === 'giant_rat' ? -4 : 0;
    parts.push(<GoatHornsChimera key="goat-horns" layer="flesh" ghost={ghost} dy={hornDy}/>);
  }
  // For non-phoenix heads (drawn in §5), emit back ears now.
  if (!boneMode && body !== 'giant_spider' && body !== 'slime' && body !== 'phoenix' && earContributor && backEarAnchors.length > 0) {
    if (earContributor === 'goblin') {
      parts.push(<GoblinEars key="ears-goblin-back" layer="flesh" ghost={ghost} anchors={backEarAnchors}/>);
    } else {
      parts.push(<RatEars key="ears-rat-back" layer="flesh" ghost={ghost} anchors={backEarAnchors}/>);
    }
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

    case 'phoenix':
      if (boneMode) parts.push(<PhoenixSkull key="phoenix-skull"/>);
      break;

    case 'goblin':
      if (boneMode) parts.push(<GoblinSkull key="goblin-skull"/>);
      else          parts.push(bpHead('head'));
      break;

    default: // mermaid, phoenix, harpy, zombie, human
      if (boneMode) {
        parts.push(<SkeletonSkull key="skull"/>);
        if (boneSpider) parts.push(<SpiderBoneEyes key="spider-bone-eyes"/>);
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
  // Mermaid shell bra: flesh-only overlay on the torso
  if (body === 'mermaid' && !boneMode) {
    parts.push(<MermaidShellBra key="shell-bra" layer="flesh" ghost={ghost}/>);
  }
  // Lich crown + glowing eyes — anchors live on each body file
  if (has('lich')) {
    const EYE_ANCHOR_MAP: Partial<Record<BodyPlan | 'human', HeadPt[]>> = {
      mermaid:     MERMAID_EYE_ANCHORS,
      giant_rat:   RAT_EYE_ANCHORS,
      giant_snake: SNAKE_EYE_ANCHORS,
      goat:        GOAT_EYE_ANCHORS,
      goblin:      GOBLIN_EYE_ANCHORS,
      phoenix:     PHOENIX_EYE_ANCHORS,
      harpy:       HARPY_EYE_ANCHORS,
    };
    const CROWN_ANCHOR_MAP: Partial<Record<BodyPlan | 'human', HeadPt>> = {
      mermaid:     MERMAID_CROWN_ANCHOR,
      giant_rat:   RAT_CROWN_ANCHOR,
      giant_snake: SNAKE_CROWN_ANCHOR,
      goat:        GOAT_CROWN_ANCHOR,
      goblin:      GOBLIN_CROWN_ANCHOR,
      phoenix:     PHOENIX_CROWN_ANCHOR,
      harpy:       HARPY_CROWN_ANCHOR,
    };
    parts.push(<LichCrown key="lich-crown" anchor={CROWN_ANCHOR_MAP[body] ?? HUMANOID_CROWN_ANCHOR}/>);
    parts.push(<LichEyes  key="lich-eyes"  eyes={EYE_ANCHOR_MAP[body]   ?? HUMANOID_EYE_ANCHORS}/>);
  }

  // ── 6. Front limbs (in front of body) ────────────────────────────────────

  // Arms — primary pair from body plan, then extra chimera pairs (rotated)
  if (!boneMode && hasBipedArms && !phoenixNoSideArms) {
    parts.push(bpArmFront('arm-front'));
  } else if (boneMode && body === 'goblin' && !phoenixNoSideArms) {
    parts.push(<GoblinArmFrontBone key="arm-front-bone"/>);
  } else if (boneMode && body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat' && !phoenixNoSideArms) {
    parts.push(<SkeletonArmFront key="arm-front-bone"/>);
  }
  // Extra chimera arm pairs: fan forward/up by 22° per additional pair
  (!phoenixNoSideArms ? extraArmKeywords : []).forEach((kw, i) => {
    const rot = (i + 1) * 22;
    parts.push(
      <g key={`arm-front-wrap-${kw}`} transform={`rotate(${rot}, 46, 112)`}>
        {renderChimeraArmFront(kw)}
      </g>
    );
  });

  // Spider chimera front-layer limbs — rendered after arms/head so they sit in front.
  if (doSpiderChimera && spiderFrontAnchors.length > 0) {
    parts.push(<SpiderChimeraLimbs key="spider-front" anchors={spiderFrontAnchors} bone={boneMode} ghost={ghost}/>);
  }

  // Front legs — driven by body's leg anchors (computed above)
  frontLegAnchors.forEach(a => { const n = renderLeg(a); if (n) parts.push(n); });
  // Spider body + phoenix chimera: both phoenix legs render here, in front of the abdomen.
  if (body === 'giant_spider' && chimeraOf('phoenix') && !boneMode) {
    parts.push(
      <PhoenixLegBack  key="bird-leg-back"  layer="flesh" ghost={ghost}/>,
      <PhoenixLegFront key="bird-leg-front" layer="flesh" ghost={ghost}/>,
    );
  }

  // ── 7. Joint knobs always last ────────────────────────────────────────────
  if (boneMode && body === 'phoenix') {
    parts.push(<PhoenixJointKnobs key="phoenix-joint-knobs"/>);
  } else if (boneMode && body === 'goblin') {
    parts.push(<GoblinJointKnobs key="goblin-joint-knobs"/>);
  } else if (boneMode && body !== 'giant_rat' && body !== 'giant_snake' && body !== 'goat') {
    // Spider has no skeleton legs — only arms render in bone mode, so suppressing
    // hip + knee knobs avoids floating joints with nothing to connect to.
    parts.push(<SkeletonJointKnobs key="joint-knobs" includeHips={body !== 'mermaid' && body !== 'giant_spider'}/>);
  }

  // ── 8. Slime goop overlay ─────────────────────────────────────────────────
  // Fires when slime is a chimera contributor. Silhouette pts live on each body file.
  if (chimeraOf('slime')) {
    const SLIME_GOOP_MAP: Partial<Record<BodyPlan | 'human', Pt[]>> = {
      giant_snake:  SNAKE_SLIME_GOOP_PTS,
      giant_spider: SPIDER_SLIME_GOOP_PTS,
      giant_rat:    RAT_SLIME_GOOP_PTS,
      mermaid:      MERMAID_SLIME_GOOP_PTS,
      goat:         GOAT_SLIME_GOOP_PTS,
      goblin:       GOBLIN_SLIME_GOOP_PTS,
      phoenix:      PHOENIX_SLIME_GOOP_PTS,
      harpy:        HARPY_SLIME_GOOP_PTS,
    };
    parts.push(<SlimeGoop key="slime-goop" pts={SLIME_GOOP_MAP[body] ?? HUMANOID_SLIME_GOOP_PTS}/>);
  }

  // ── 9. Flames on top of everything ───────────────────────────────────────
  if (has('phoenix')) {
    if (body === 'phoenix') {
      // PhoenixFlames was authored across a humanoid-style vertical span.
      // Remap it to the actual bird silhouette (top≈78, tail tip≈292) so the
      // effect tracks the bird body instead of the default humanoid height.
      parts.push(
        <g key="phoenix-flames-wrap" transform="translate(0,65) scale(1,0.568)">
          <PhoenixFlames key="phoenix-flames"/>
        </g>
      );
    } else {
      parts.push(<PhoenixFlames key="phoenix-flames"/>);
    }
  }

  // ── Wing anchor ───────────────────────────────────────────────────────────
  const phoenixScale = body === 'phoenix' ? 1.2 : 1;
  const WING_ANCHOR_MAP: Partial<Record<BodyPlan | 'human', HeadPt>> = {
    goblin: GOBLIN_WING_ANCHOR,
    phoenix: PHOENIX_WING_ANCHOR,
  };
  const defaultWingAnchor: HeadPt = { cx: 80, cy: (body === 'giant_spider' && !boneMode) ? 90 : 125 };
  const baseWingAnchor = WING_ANCHOR_MAP[body] ?? defaultWingAnchor;
  const wingAnchorX = Math.round(baseWingAnchor.cx * phoenixScale);
  const wingAnchorY = Math.round(baseWingAnchor.cy * phoenixScale);

  return {
    parts,
    viewBox: body === 'mermaid'  ? '-30 0 220 460'
           : boneSpider          ? '-30 -10 220 450'
           : body === 'phoenix'  ? '-20 -30 200 450'
           : body === 'harpy'    ? '0 -50 160 480'
           :                       '0 0 160 420',
    width:   body === 'mermaid'  ? 190 : body === 'phoenix' ? 216 : 160,
    height:  body === 'mermaid'  ? 460 : body === 'phoenix'  ? 486
           : body === 'harpy'    ? 480 :                       420,
    hasWings,
    goatBody: body === 'goat',
    wingsBackground: (body === 'giant_spider' && !boneMode) || body === 'harpy' || body === 'phoenix',
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
