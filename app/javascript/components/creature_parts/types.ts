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

// Utility: build the data-layer + optional ghost class string
export function partClass(layer: Layer, ghost?: boolean): string {
  const cls: string[] = [];
  if (ghost && layer === 'flesh') cls.push('ghost-flesh');
  return cls.join(' ');
}
