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

// Utility: build the data-layer + optional ghost class string
export function partClass(layer: Layer, ghost?: boolean): string {
  const cls: string[] = [];
  if (ghost && layer === 'flesh') cls.push('ghost-flesh');
  return cls.join(' ');
}
