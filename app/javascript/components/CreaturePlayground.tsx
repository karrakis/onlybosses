import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Keyword = {
  id: number;
  name: string;
  category: string;
  rarity: string;
};

// ─── Animation definitions ────────────────────────────────────────────────────
//
// Each entry describes a CSS animation to apply to the creature container.
// The CSS keyframes are injected as a <style> tag once on mount.

const ACTION_CATEGORIES = ['attack', 'ability', 'spell'];

type AnimDef = {
  label:     string;   // display name on the button
  keyframes: string;   // @keyframes block (name must match animName)
  animName:  string;   // must be globally unique
  duration:  string;
  easing:    string;
  fillMode:  string;
};

const ANIMATIONS: Record<string, AnimDef> = {
  stab: {
    label: 'Stab', animName: 'anim-stab',
    keyframes: `@keyframes anim-stab {
      0%   { transform: translateX(0)    rotate(0deg); }
      20%  { transform: translateX(-18px) rotate(-6deg); }
      45%  { transform: translateX(32px)  rotate(4deg); }
      65%  { transform: translateX(32px)  rotate(4deg); }
      100% { transform: translateX(0)    rotate(0deg); }
    }`,
    duration: '0.45s', easing: 'ease-in-out', fillMode: 'both',
  },
  whirlwind: {
    label: 'Whirlwind', animName: 'anim-whirlwind',
    keyframes: `@keyframes anim-whirlwind {
      0%   { transform: rotate(0deg)   scale(1); }
      25%  { transform: rotate(-90deg) scale(1.08); }
      50%  { transform: rotate(-180deg) scale(1.12); }
      75%  { transform: rotate(-270deg) scale(1.08); }
      100% { transform: rotate(-360deg) scale(1); }
    }`,
    duration: '0.7s', easing: 'linear', fillMode: 'both',
  },
  cleave: {
    label: 'Cleave', animName: 'anim-cleave',
    keyframes: `@keyframes anim-cleave {
      0%   { transform: rotate(0deg); transform-origin: center top; }
      15%  { transform: rotate(22deg); }
      40%  { transform: rotate(-30deg); }
      70%  { transform: rotate(-30deg); }
      100% { transform: rotate(0deg); }
    }`,
    duration: '0.55s', easing: 'ease-in-out', fillMode: 'both',
  },
  smash: {
    label: 'Smash', animName: 'anim-smash',
    keyframes: `@keyframes anim-smash {
      0%   { transform: translateY(0)    scaleY(1); }
      25%  { transform: translateY(-28px) scaleY(1.06); }
      55%  { transform: translateY(18px)  scaleY(0.92); }
      70%  { transform: translateY(18px)  scaleY(0.92); }
      85%  { transform: translateY(-6px)  scaleY(1.02); }
      100% { transform: translateY(0)    scaleY(1); }
    }`,
    duration: '0.6s', easing: 'ease-in', fillMode: 'both',
  },
  piercing_arrow: {
    label: 'Piercing Arrow', animName: 'anim-arrow',
    keyframes: `@keyframes anim-arrow {
      0%   { transform: translateX(0) rotate(0deg); }
      30%  { transform: translateX(-22px) rotate(8deg); }
      55%  { transform: translateX(8px)  rotate(-3deg); }
      100% { transform: translateX(0)   rotate(0deg); }
    }`,
    duration: '0.5s', easing: 'ease-out', fillMode: 'both',
  },
  fly: {
    label: 'Fly', animName: 'anim-fly',
    keyframes: `@keyframes anim-fly {
      0%   { transform: translateY(0)     ; }
      30%  { transform: translateY(-40px) ; }
      60%  { transform: translateY(-60px) ; }
      80%  { transform: translateY(-50px) ; }
      100% { transform: translateY(0)     ; }
    }`,
    duration: '1.1s', easing: 'ease-in-out', fillMode: 'both',
  },
  web: {
    label: 'Web', animName: 'anim-web',
    keyframes: `@keyframes anim-web {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-14px) rotate(-5deg); }
      40%     { transform: translateX(14px)  rotate(5deg); }
      60%     { transform: translateX(-9px)  rotate(-3deg); }
      80%     { transform: translateX(9px)   rotate(3deg); }
    }`,
    duration: '0.6s', easing: 'ease-in-out', fillMode: 'both',
  },
  firebolt: {
    label: 'Firebolt', animName: 'anim-firebolt',
    keyframes: `@keyframes anim-firebolt {
      0%   { transform: scale(1)    ; filter: brightness(1); }
      20%  { transform: scale(1.06) ; filter: brightness(1.6) saturate(2); }
      45%  { transform: scale(0.96) translateX(20px); filter: brightness(1.1); }
      100% { transform: scale(1)    ; filter: brightness(1); }
    }`,
    duration: '0.55s', easing: 'ease-in-out', fillMode: 'both',
  },
  ice_shard: {
    label: 'Ice Shard', animName: 'anim-ice',
    keyframes: `@keyframes anim-ice {
      0%   { transform: scale(1);    filter: brightness(1) hue-rotate(0deg); }
      30%  { transform: scale(1.04); filter: brightness(1.4) hue-rotate(160deg); }
      60%  { transform: scale(0.97) translateX(18px); filter: brightness(1.1) hue-rotate(80deg); }
      100% { transform: scale(1);    filter: brightness(1) hue-rotate(0deg); }
    }`,
    duration: '0.6s', easing: 'ease-in-out', fillMode: 'both',
  },
  lightning_strike: {
    label: 'Lightning', animName: 'anim-lightning',
    keyframes: `@keyframes anim-lightning {
      0%,100% { transform: scale(1);    filter: brightness(1); }
      10%     { transform: scale(1.07); filter: brightness(3) saturate(0); }
      20%     { transform: scale(0.98); filter: brightness(1); }
      30%     { transform: scale(1.05); filter: brightness(2.5); }
      50%     { transform: scale(1);    filter: brightness(1); }
    }`,
    duration: '0.5s', easing: 'steps(5)', fillMode: 'both',
  },
  light_bolt: {
    label: 'Light Bolt', animName: 'anim-light',
    keyframes: `@keyframes anim-light {
      0%   { filter: brightness(1); }
      25%  { filter: brightness(2.2) saturate(0.3); }
      50%  { transform: translateX(22px); filter: brightness(1.3); }
      100% { transform: translateX(0);   filter: brightness(1); }
    }`,
    duration: '0.5s', easing: 'ease-out', fillMode: 'both',
  },
  arcane_blast: {
    label: 'Arcane Blast', animName: 'anim-arcane',
    keyframes: `@keyframes anim-arcane {
      0%   { transform: scale(1)    rotate(0deg);   filter: brightness(1); }
      20%  { transform: scale(1.1)  rotate(-5deg);  filter: brightness(1.5) hue-rotate(240deg); }
      50%  { transform: scale(0.94) rotate(0deg);   filter: brightness(1.2) hue-rotate(120deg); }
      100% { transform: scale(1)    rotate(0deg);   filter: brightness(1); }
    }`,
    duration: '0.65s', easing: 'ease-in-out', fillMode: 'both',
  },
};

// Fallback for any action not explicitly defined
const FALLBACK_ANIM: AnimDef = {
  label: '', animName: 'anim-fallback',
  keyframes: `@keyframes anim-fallback {
    0%,100% { transform: scale(1); }
    40%     { transform: scale(1.05); }
  }`,
  duration: '0.4s', easing: 'ease-in-out', fillMode: 'both',
};

// Inject all keyframes once
const ALL_KEYFRAMES = [
  ...Object.values(ANIMATIONS).map(a => a.keyframes),
  FALLBACK_ANIM.keyframes,
].join('\n');

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ['race', 'weapon', 'attack', 'ability', 'trait', 'passive', 'spell'];

const RARITY_COLOUR: Record<string, string> = {
  common:    'text-gray-300',
  uncommon:  'text-green-400',
  rare:      'text-blue-400',
  epic:      'text-purple-400',
  legendary: 'text-orange-400',
};

// SVGs served by Sprockets from app/assets/images/keywords/
const HUMANOID_SVG = '/assets/keywords/humanoid.svg';
const WING_SVG     = '/assets/keywords/wing.svg';

// ─── Creature viewport ────────────────────────────────────────────────────────

function CreatureViewport({ selected, activeAnim }: { selected: string[]; activeAnim: string | null }) {
  const hasWings = selected.includes('fly');
  const anim     = activeAnim ? (ANIMATIONS[activeAnim] ?? FALLBACK_ANIM) : null;

  const animStyle: React.CSSProperties = anim ? {
    animation: `${anim.animName} ${anim.duration} ${anim.easing} ${anim.fillMode}`,
  } : {};

  return (
    <div
      className="relative"
      style={{ width: 700, height: 540, background: '#1e1e2e', borderRadius: 8, overflow: 'visible' }}
    >
      {/* Animated wrapper — wings + humanoid move together */}
      <div style={{ position: 'absolute', inset: 0, ...animStyle }}>
        {hasWings && (
          <>
            <object type="image/svg+xml" data={WING_SVG} aria-label="right wing"
              style={{ position: 'absolute', width: 350, height: 330, left: 320, top: -35, pointerEvents: 'none' }}
            />
            <object type="image/svg+xml" data={WING_SVG} aria-label="left wing"
              style={{ position: 'absolute', width: 350, height: 330, left: 30, top: -35,
                       transform: 'scaleX(-1)', pointerEvents: 'none' }}
            />
          </>
        )}
        <object type="image/svg+xml" data={HUMANOID_SVG} aria-label="creature body"
          style={{ position: 'absolute', width: 160, height: 420, left: 270, top: 60,
                   pointerEvents: 'none', zIndex: 10 }}
        />
      </div>
    </div>
  );
}

// ─── Keyword chip ─────────────────────────────────────────────────────────────

function KeywordChip({ name, category, onRemove }: { name: string; category: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-100 border border-gray-600">
      <span className="text-gray-400 text-[10px] uppercase tracking-wide">{category[0]}</span>
      {name}
      <button onClick={onRemove} className="ml-0.5 text-gray-400 hover:text-red-400 leading-none"
        aria-label={`Remove ${name}`}>×</button>
    </span>
  );
}

// ─── CreaturePlayground ───────────────────────────────────────────────────────

export default function CreaturePlayground({ onBack }: { onBack: () => void }) {
  const [allKeywords,    setAllKeywords]    = React.useState<Keyword[]>([]);
  const [selected,       setSelected]       = React.useState<string[]>([]);
  const [activeActions,  setActiveActions]  = React.useState<string[]>([]);
  const [search,         setSearch]         = React.useState('');
  const [actionSearch,   setActionSearch]   = React.useState('');
  const [activeAnim,     setActiveAnim]     = React.useState<string | null>(null);
  const [loading,        setLoading]        = React.useState(true);
  const [error,          setError]          = React.useState<string | null>(null);
  const animTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject keyframes once
  React.useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = ALL_KEYFRAMES;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  React.useEffect(() => {
    fetch('/api/bosses/keywords')
      .then(r => r.json())
      .then((data: Keyword[]) => { setAllKeywords(data); setLoading(false); })
      .catch(() => { setError('Failed to load keywords'); setLoading(false); });
  }, []);

  const toggleKeyword = (name: string) =>
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const toggleAction = (name: string) =>
    setActiveActions(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const playAnim = (name: string) => {
    // Clear any running animation first (force re-mount by cycling through null)
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setActiveAnim(null);
    requestAnimationFrame(() => {
      setActiveAnim(name);
      const anim = ANIMATIONS[name] ?? FALLBACK_ANIM;
      const ms = parseFloat(anim.duration) * 1000 + 100;
      animTimerRef.current = setTimeout(() => setActiveAnim(null), ms);
    });
  };

  // ── Keyword list filtering + grouping ──────────────────────────────────────
  const kwQuery   = search.trim().toLowerCase();
  const filtered  = allKeywords.filter(k =>
    (!kwQuery || k.name.toLowerCase().includes(kwQuery) || k.category.toLowerCase().includes(kwQuery))
  );
  const grouped = CATEGORY_ORDER
    .reduce<Record<string, Keyword[]>>((acc, cat) => {
      const items = filtered.filter(k => k.category === cat);
      if (items.length) acc[cat] = items;
      return acc;
    }, {});
  filtered.forEach(k => {
    if (!CATEGORY_ORDER.includes(k.category) && !(k.category in grouped)) grouped[k.category] = [];
    if (!CATEGORY_ORDER.includes(k.category)) grouped[k.category].push(k);
  });

  // ── Action list filtering ──────────────────────────────────────────────────
  const aqQuery      = actionSearch.trim().toLowerCase();
  const actionKws    = allKeywords
    .filter(k => ACTION_CATEGORIES.includes(k.category))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(k => !aqQuery || k.name.toLowerCase().includes(aqQuery) || k.category.toLowerCase().includes(aqQuery));

  const actionGrouped = ACTION_CATEGORIES.reduce<Record<string, Keyword[]>>((acc, cat) => {
    const items = actionKws.filter(k => k.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="h-screen bg-gray-950 text-gray-100 font-mono text-sm flex flex-col">

      {/* ── Inject keyframes style tag (handled in useEffect above) ─────── */}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-bold text-white">Creature Playground</h1>
        <button onClick={onBack}
          className="text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1 text-sm">
          ← Admin
        </button>
      </div>

      {/* ── Main 3-column layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: keyword panel */}
        <div className="w-60 shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500">
            Keywords
          </div>
          <div className="p-2 border-b border-gray-800">
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-b border-gray-800 flex flex-wrap gap-1">
              {selected.map(name => {
                const kw = allKeywords.find(k => k.name === name);
                return <KeywordChip key={name} name={name} category={kw?.category ?? '?'} onRemove={() => toggleKeyword(name)} />;
              })}
              <button onClick={() => setSelected([])} className="text-[10px] text-red-500 hover:text-red-300 self-center ml-1">clear</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-gray-500 p-4 text-xs">Loading…</p>}
            {error   && <p className="text-red-400 p-4 text-xs">{error}</p>}
            {!loading && !error && Object.entries(grouped).map(([cat, kws]) => (
              <div key={cat}>
                <div className="sticky top-0 bg-gray-900 px-3 py-1 text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800">{cat}</div>
                {kws.map(kw => {
                  const isOn = selected.includes(kw.name);
                  return (
                    <button key={kw.id} onClick={() => toggleKeyword(kw.name)}
                      className={['w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-gray-800 border-b border-gray-800/40 transition-colors text-xs', isOn ? 'bg-gray-800/60' : ''].join(' ')}>
                      <span className={isOn ? 'text-white' : (RARITY_COLOUR[kw.rarity] ?? 'text-gray-300')}>{kw.name}</span>
                      <span className={['leading-none transition-colors', isOn ? 'text-orange-400' : 'text-gray-700'].join(' ')}>{isOn ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Centre: creature viewport */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <CreatureViewport selected={selected} activeAnim={activeAnim} />
        </div>

        {/* Right: action panel */}
        <div className="w-60 shrink-0 border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500">
            Actions
          </div>
          <div className="p-2 border-b border-gray-800">
            <input type="text" placeholder="Search…" value={actionSearch} onChange={e => setActionSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="text-gray-500 p-4 text-xs">Loading…</p>}
            {!loading && Object.entries(actionGrouped).map(([cat, kws]) => (
              <div key={cat}>
                <div className="sticky top-0 bg-gray-900 px-3 py-1 text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800">{cat}</div>
                {kws.map(kw => {
                  const isOn = activeActions.includes(kw.name);
                  const hasAnim = kw.name in ANIMATIONS;
                  return (
                    <button key={kw.id} onClick={() => toggleAction(kw.name)}
                      className={['w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-gray-800 border-b border-gray-800/40 transition-colors text-xs', isOn ? 'bg-gray-800/60' : ''].join(' ')}>
                      <span className={isOn ? 'text-white' : (RARITY_COLOUR[kw.rarity] ?? 'text-gray-300')}>{kw.name}</span>
                      <span className="flex items-center gap-1">
                        {hasAnim && <span className="text-[9px] text-blue-500">▶</span>}
                        <span className={['leading-none transition-colors', isOn ? 'text-blue-400' : 'text-gray-700'].join(' ')}>{isOn ? '✓' : '+'}</span>
                      </span>
                    </button>
                  );
                })}
                {kws.length === 0 && aqQuery && (
                  <p className="text-gray-600 p-3 text-xs">No matches</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────────── */}
      {activeActions.length > 0 && (
        <div className="shrink-0 border-t border-gray-800 bg-gray-900 px-6 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 mr-1">Play:</span>
          {activeActions.map(name => {
            const anim  = ANIMATIONS[name];
            const label = anim?.label ?? name.replace(/_/g, ' ');
            const isPlaying = activeAnim === name;
            return (
              <button
                key={name}
                onClick={() => playAnim(name)}
                className={[
                  'px-4 py-1.5 rounded border text-sm font-semibold transition-all',
                  isPlaying
                    ? 'bg-blue-600 border-blue-400 text-white scale-95'
                    : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-400',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
