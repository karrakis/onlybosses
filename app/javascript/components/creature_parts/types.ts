// ─── Shared types and utilities ───────────────────────────────────────────────

export type Layer = 'flesh' | 'bone' | 'ethereal' | 'wing';

export interface PartProps {
  layer: Layer;
  // ghost = add ghost-flesh class to flesh-layer parts
  ghost?: boolean;
  // extra className forwarded to the <g>
  className?: string;
}

// Coordinate pair used by slime geometry helpers
export type Pt = [number, number];

// ─── Anchor system ────────────────────────────────────────────────────────────
// Torso components export typed anchor lists. Chimera renderers query them at
// runtime; the compositor splits back/front and renders accordingly.
// Adding anchors to a new torso is sufficient — no compositor changes needed.

/** A single spider-limb attachment point on a torso. */
export interface SpiderLimbAnchor {
  /** Root attachment point on the torso, in compositor canvas space. */
  x: number;
  y: number;
  /**
   * Knee position relative to the root.
   * Tip position is relative to the knee.
   * Using relative offsets keeps the anchor self-contained and body-agnostic.
   */
  knee: { dx: number; dy: number };
  tip:  { dx: number; dy: number };
  /** Whether this limb renders behind (back) or in front of (front) the body. */
  layer: 'back' | 'front';
  /** Animation swing amplitude in degrees (default 2.5). */
  amp?: number;
  /** Animation cycle duration in seconds (default 2.0). */
  dur?: number;
  /** Animation phase offset in seconds (default 0). */
  phase?: number;
}

/** Descriptor for one of a body's leg attachment slots. */
export type LegAnchorType =
  | 'biped'      // human/zombie legs; layer selects back/front component
  | 'rat-hind'   // RatLegBack / RatLegBackBone; requires cx, topY
  | 'rat-fore'   // RatLegFront / RatLegFrontBone; requires cx, topY
  | 'goat-hind'  // GoatLegBack; respects tx
  | 'goat-fore'  // GoatLegFront
  | 'harpy'      // HarpyLegBack/Front; layer selects variant
  | 'phoenix';   // PhoenixLegBack/Front; layer selects variant

/** A leg attachment point on a body torso. */
export interface LegAnchor {
  key: string;
  /** Render order: 'back' renders before the torso, 'front' after. */
  layer: 'back' | 'front';
  /** Logical role for chimera slot replacement. */
  slot: 'hind' | 'fore';
  type: LegAnchorType;
  /** X position on the 160×420 canvas. Required for rat-hind / rat-fore. */
  cx?: number;
  /** Top Y position. Required for rat-hind / rat-fore. */
  topY?: number;
  /** X translation for goat chimera components (GoatLegBack tx prop). */
  tx?: number;
  /**
   * Component variant override. Absent = use layer.
   * Set when layer changes for render-order deferral but the original
   * back/front component must be preserved (e.g. phoenix + spider chimera).
   */
  variant?: 'back' | 'front';
  /** When true, goat chimera will not replace this anchor. */
  goatImmune?: true;
  /**
   * X translation GoatLegBack should receive when replacing this slot.
   * Default 0 (most bodies); 24 for rat (hip offset correction).
   */
  goatTx?: number;
}

// Utility: build the data-layer + optional ghost class string
export function partClass(layer: Layer, ghost?: boolean): string {
  const cls: string[] = [];
  if (ghost && layer === 'flesh') cls.push('ghost-flesh');
  return cls.join(' ');
}
