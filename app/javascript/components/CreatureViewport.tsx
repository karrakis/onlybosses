import * as React from 'react';
import CreatureCompositor, { compositeCreature } from './CreatureCompositor';

const HUMANOID_SVG = '/assets/keywords/humanoid.svg';
const PHOENIX_SVG = '/assets/keywords/phoenix.svg';
const WING_SVG = '/assets/keywords/wing.svg';
const WING_SVG_FLAPX = '/assets/keywords/wing.svg?flapx=1';

const HUMANOID_CREATURES = new Set([
  'human', 'golem', 'vampire', 'giant', 'goblin',
  'troll', 'zombie', 'werewolf', 'minotaur',
]);

const GHOST_SVG = '/assets/keywords/ghost.svg';
const SKELETON_SVG = '/assets/keywords/skeleton.svg';
const LICH_SVG = '/assets/keywords/lich.svg';
const MERMAID_SVG = '/assets/keywords/mermaid.svg';
const CENTAUR_SVG = '/assets/keywords/centaur.svg';
const GIANT_SPIDER_SVG = '/assets/keywords/giant_spider.svg';

const CREATURE_SVG: Record<string, string> = {
  phoenix: PHOENIX_SVG,
  ghost: GHOST_SVG,
  skeleton: SKELETON_SVG,
  lich: LICH_SVG,
  mermaid: MERMAID_SVG,
  centaur: CENTAUR_SVG,
  giant_spider: GIANT_SPIDER_SVG,
};

const COMPOSITOR_KEYWORDS = new Set([
  'human', 'golem', 'vampire', 'giant', 'goblin', 'troll', 'zombie', 'werewolf', 'minotaur',
  'centaur', 'skeleton', 'lich', 'ghost', 'mermaid', 'phoenix', 'giant_spider', 'harpy', 'giant_rat', 'giant_snake',
]);

export interface CreatureViewportProps {
  keywords: string[];
  animStyle?: React.CSSProperties;
  flipped?: boolean;
  mode?: 'playground' | 'compact';
  className?: string;
  style?: React.CSSProperties;
}

function usesCompositor(keywords: string[]): boolean {
  return keywords.some((k) => COMPOSITOR_KEYWORDS.has(k)) ||
    !keywords.some((k) => CREATURE_SVG[k] || HUMANOID_CREATURES.has(k));
}

function resolveBodySvg(keywords: string[]): string {
  for (const name of keywords) {
    if (CREATURE_SVG[name]) return CREATURE_SVG[name];
  }
  return HUMANOID_SVG;
}

export default function CreatureViewport({
  keywords,
  animStyle = {},
  flipped = false,
  mode = 'compact',
  className,
  style = {},
}: CreatureViewportProps) {
  const isPlaygroundMode = mode === 'playground';
  const bodyLeft = isPlaygroundMode ? 270 : 0;
  const bodyTop = isPlaygroundMode ? 60 : 0;

  const rootStyle: React.CSSProperties = isPlaygroundMode
    ? { width: 700, height: 540, background: '#1e1e2e', borderRadius: 8, overflow: 'visible', ...style }
    : { width: 160, height: 420, overflow: 'visible', ...style };

  const flipStyle: React.CSSProperties = flipped ? { transform: 'scaleX(-1)' } : {};

  if (usesCompositor(keywords)) {
    const { hasWings, goatBody, wingAnchorX, wingAnchorY } = compositeCreature(keywords);
    const wingAbsX = bodyLeft + wingAnchorX;
    const wingAbsY = bodyTop + wingAnchorY;

    const wingStyleRight: React.CSSProperties = goatBody ? {
      position: 'absolute',
      width: 350,
      height: 330,
      left: isPlaygroundMode ? 246 : -24,
      top: isPlaygroundMode ? 27 : -33,
      transformOrigin: '28px 140px',
      transform: 'rotate(-40deg) rotateY(70deg)',
      pointerEvents: 'none',
    } : {
      position: 'absolute',
      width: 350,
      height: 330,
      left: wingAbsX - 30,
      top: wingAbsY - 220,
      pointerEvents: 'none',
    };

    const wingStyleLeft: React.CSSProperties = goatBody ? {
      position: 'absolute',
      width: 350,
      height: 330,
      left: isPlaygroundMode ? 275 : 5,
      top: isPlaygroundMode ? 27 : -33,
      transformOrigin: '28px 140px',
      transform: 'scaleX(-1) scaleY(-1) rotate(153deg) rotateY(-70deg)',
      pointerEvents: 'none',
    } : {
      position: 'absolute',
      width: 350,
      height: 330,
      left: wingAbsX - 320,
      top: wingAbsY - 220,
      transform: 'scaleX(-1)',
      pointerEvents: 'none',
    };

    return (
      <div style={flipStyle}>
        <div className={className} style={{ position: 'relative', ...rootStyle }}>
          <div style={{ position: 'absolute', inset: 0, perspective: '800px', ...animStyle }}>
            {hasWings && goatBody && (
              <object
                type="image/svg+xml"
                data={WING_SVG_FLAPX}
                aria-label="right wing"
                style={{ ...wingStyleRight, zIndex: 0 }}
              />
            )}

            {hasWings && !goatBody && (
              <>
                <object
                  type="image/svg+xml"
                  data={WING_SVG}
                  aria-label="right wing"
                  style={{ ...wingStyleRight, zIndex: 0 }}
                />
                <object
                  type="image/svg+xml"
                  data={WING_SVG}
                  aria-label="left wing"
                  style={{ ...wingStyleLeft, zIndex: 0 }}
                />
              </>
            )}

            <div style={{ position: 'absolute', left: bodyLeft, top: bodyTop, zIndex: 10 }}>
              <CreatureCompositor keywords={keywords} />
            </div>

            {hasWings && goatBody && (
              <object
                type="image/svg+xml"
                data={WING_SVG_FLAPX}
                aria-label="left wing"
                style={{ ...wingStyleLeft, zIndex: 20 }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasWings = keywords.includes('fly');
  const bodySvg = resolveBodySvg(keywords);

  return (
    <div style={flipStyle}>
      <div className={className} style={{ position: 'relative', ...rootStyle }}>
        <div style={{ position: 'absolute', inset: 0, ...animStyle }}>
          {hasWings && (
            <>
              <object
                type="image/svg+xml"
                data={WING_SVG}
                aria-label="right wing"
                style={{
                  position: 'absolute',
                  width: 350,
                  height: 330,
                  left: bodyLeft + 50,
                  top: bodyTop - 95,
                  pointerEvents: 'none',
                }}
              />
              <object
                type="image/svg+xml"
                data={WING_SVG}
                aria-label="left wing"
                style={{
                  position: 'absolute',
                  width: 350,
                  height: 330,
                  left: bodyLeft - 240,
                  top: bodyTop - 95,
                  transform: 'scaleX(-1)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
          <object
            type="image/svg+xml"
            data={bodySvg}
            aria-label="creature body"
            style={{
              position: 'absolute',
              width: 160,
              height: 420,
              left: bodyLeft,
              top: bodyTop,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </div>
      </div>
    </div>
  );
}
