import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DataPoint = {
  depth: number; rate: number; support: number; baseline: number;
};

type DateRange = { id: string; label: string; from: string; to: string };

type KwLine = {
  id: string; keyword: string; context: "player" | "boss";
  label: string; color: string; data: DataPoint[];
  dateFrom: string; dateTo: string; rangeName: string;
};

type TooltipState = {
  svgX: number; svgY: number; line: KwLine; point: DataPoint;
};

type Section    = { title: string; lines: string[] };
type SidebarRow = { name: string; delta: number };

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

// Parse pandas to_string() output — same format as SynergyChart sidebar
function parseSidebarRows(lines: string[]): SidebarRow[] {
  return lines.flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("keywords") || trimmed.startsWith("(")) return [];
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length < 2) return [];
    const name  = parts[0].trim();
    const delta = parseFloat(parts[parts.length - 1]);
    if (!name || isNaN(delta)) return [];
    return [{ name, delta }];
  });
}

// Parse the keyword survival table (5 columns: keyword present with_rate without_rate delta).
// Splits on any whitespace so negative delta values aren't merged with the preceding column.
function parseKwDeltaRows(lines: string[]): SidebarRow[] {
  return lines.flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) return [];
    const name  = tokens[0];
    const delta = parseFloat(tokens[tokens.length - 1]);
    if (!name || isNaN(delta)) return [];
    return [{ name, delta }];
  });
}

function KeywordSidebarPanel({
  label, accentColor, rows, onAdd, activeNames,
}: {
  label: string;
  accentColor: string;
  rows: SidebarRow[];
  onAdd: (name: string) => void;
  activeNames: Set<string>;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className={`text-xs font-bold uppercase tracking-wide ${accentColor}`}>{label}</span>
        {rows.length > 0 && (
          <p className="text-gray-600 text-xs mt-0.5">click row to add to chart</p>
        )}
      </div>
      <div className="overflow-y-auto max-h-[560px]">
        {rows.length === 0 ? (
          <p className="text-gray-600 text-xs px-3 py-4 text-center italic">
            Run analysis to populate
          </p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {rows.map((row, i) => {
              const active = activeNames.has(row.name);
              return (
                <button
                  key={i}
                  onClick={() => onAdd(row.name)}
                  disabled={active}
                  title={active ? "Already on chart" : `Add "${row.name}" to chart`}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2
                    text-xs transition-colors
                    ${active ? "opacity-40 cursor-default" : "hover:bg-gray-800 cursor-pointer"}`}
                >
                  <span className="text-gray-300 truncate">{row.name}</span>
                  <span className={`shrink-0 font-mono font-bold tabular-nums
                    ${row.delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {row.delta >= 0 ? "+" : ""}{row.delta.toFixed(3)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "#f97316", "#3b82f6", "#22c55e", "#a855f7",
  "#ec4899", "#eab308", "#06b6d4", "#f43f5e",
];

const SVG_W = 720;
const SVG_H = 310;
const M     = { top: 24, right: 24, bottom: 48, left: 66 };
const CW    = SVG_W - M.left - M.right;
const CH    = SVG_H - M.top  - M.bottom;

// ─── Scale helpers ────────────────────────────────────────────────────────────

function xPos(depth: number, dMin: number, dMax: number) {
  if (dMax === dMin) return 0;
  return ((depth - dMin) / (dMax - dMin)) * CW;
}

function yPos(rate: number, yMin: number, yMax: number) {
  if (yMax === yMin) return CH / 2;
  return CH - ((rate - yMin) / (yMax - yMin)) * CH;
}

function niceYTicks(yMin: number, yMax: number): number[] {
  const range = yMax - yMin;
  const step  = range <= 0.15 ? 0.02 : range <= 0.3 ? 0.05 : range <= 0.6 ? 0.1
              : range <= 0.8  ? 0.1  : 0.2;
  const ticks: number[] = [];
  const start = Math.ceil(yMin / step) * step;
  for (let v = start; v <= yMax + 1e-9; v = Math.round((v + step) * 10000) / 10000)
    ticks.push(parseFloat(v.toFixed(4)));
  return ticks;
}

function xTicks(dMin: number, dMax: number): number[] {
  const range = dMax - dMin;
  const step  = range <= 10 ? 1 : range <= 20 ? 2 : range <= 40 ? 5 : 10;
  const ticks: number[] = [];
  for (let v = dMin; v <= dMax; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== dMax) ticks.push(dMax);
  return ticks;
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KeywordChart({
  onBack,
  analysisResult,
}: {
  onBack?: () => void;
  analysisResult?: { sections: Section[] } | null;
} = {}) {
  const [lines,        setLines]        = React.useState<KwLine[]>([]);
  const [input,        setInput]        = React.useState("");
  const [depthMin,     setDepthMin]     = React.useState(1);
  const [depthMax,     setDepthMax]     = React.useState(20);
  const [context,      setContext]      = React.useState<"player" | "boss">("player");
  const [minSupport,   setMinSupport]   = React.useState(3);
  const [loading,      setLoading]      = React.useState(false);
  const [refreshing,   setRefreshing]   = React.useState(false);
  const [error,        setError]        = React.useState<string | null>(null);
  const [tooltip,      setTooltip]      = React.useState<TooltipState | null>(null);
  const [showBaseline, setShowBaseline] = React.useState(true);
  const [ranges,       setRanges]       = React.useState<DateRange[]>([
    { id: "range_0", label: "All time", from: "", to: "" },
  ]);

  const colorIdx   = React.useRef(0);
  const rangeIdRef = React.useRef(1);

  // ── Sidebar data from analysis result ─────────────────────────────────────
  const allSections    = analysisResult?.sections ?? [];
  const kwDeltaSection = allSections.find((s) => {
    const t = s.title.toLowerCase();
    return t.includes(context) && t.includes("keyword") && t.includes("delta");
  });
  const allKwRows = kwDeltaSection ? parseKwDeltaRows(kwDeltaSection.lines) : [];
  const highRows  = allKwRows.filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta);
  const lowRows   = allKwRows.filter((r) => r.delta < 0).sort((a, b) => a.delta - b.delta);

  const activeNames = React.useMemo(
    () => new Set(lines.map((l) => l.keyword)),
    [lines],
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  async function fetchKeywordData(
    keyword: string, ctx: "player" | "boss",
    dMin: number, dMax: number, support: number,
    dateFrom: string = "", dateTo: string = "",
  ): Promise<DataPoint[]> {
    const p = new URLSearchParams();
    p.append("keywords[]", keyword);
    p.set("depth_min",   String(dMin));
    p.set("depth_max",   String(dMax));
    p.set("context",     ctx);
    p.set("min_support", String(support));
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo)   p.set("date_to",   dateTo);
    const res  = await fetch(`/admin/keyword_data?${p}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const json: Array<{ keyword: string; data: DataPoint[]; error?: string }> = await res.json();
    if (!json.length) return [];
    if (json[0].error) throw new Error(json[0].error);
    return json[0].data;
  }

  // ── Add keyword — one line per active date range ──────────────────────────
  async function addKeyword(overrideName?: string) {
    const name = (overrideName ?? input).trim().toLowerCase();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const newLines: KwLine[] = [];
      const multiRange = ranges.length > 1;
      for (const range of ranges) {
        const label = `${name} [${context}]` + (multiRange ? ` · ${range.label}` : "");
        if (lines.find((l) => l.label === label)) continue;
        const data = await fetchKeywordData(
          name, context, depthMin, depthMax, minSupport, range.from, range.to,
        );
        if (!data.length) continue;
        const color = COLORS[colorIdx.current % COLORS.length];
        colorIdx.current++;
        newLines.push({
          id: `${label}:${Date.now()}`,
          keyword: name, context, label, color, data,
          dateFrom: range.from, dateTo: range.to, rangeName: range.label,
        });
      }
      if (!newLines.length) {
        setError(
          `No data for "${name}" ` +
          `(depth ${depthMin}–${depthMax}, min support ${minSupport}). ` +
          `Try lowering min support or broadening the depth range.`,
        );
      } else {
        setLines((prev) => [...prev, ...newLines]);
        if (!overrideName) setInput("");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Refresh all ────────────────────────────────────────────────────────────
  async function refreshAll() {
    if (!lines.length) return;
    setRefreshing(true);
    setError(null);
    try {
      const updated = await Promise.all(
        lines.map(async (line) => {
          const currentRange = ranges.find((r) => r.label === line.rangeName);
          const dateFrom = currentRange ? currentRange.from : line.dateFrom;
          const dateTo   = currentRange ? currentRange.to   : line.dateTo;
          return {
            ...line,
            dateFrom,
            dateTo,
            data: await fetchKeywordData(
              line.keyword, line.context, depthMin, depthMax, minSupport, dateFrom, dateTo,
            ),
          };
        }),
      );
      setLines(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  // ── Date range management ──────────────────────────────────────────────────
  function addRange() {
    const id = `range_${rangeIdRef.current++}`;
    setRanges((prev) => [...prev, { id, label: `Range ${rangeIdRef.current}`, from: "", to: "" }]);
  }
  function removeRange(id: string) {
    setRanges((prev) => prev.filter((r) => r.id !== id));
  }
  function updateRange(id: string, field: "label" | "from" | "to", value: string) {
    setRanges((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  // ── Y domain ───────────────────────────────────────────────────────────────
  const allRates = lines.flatMap((l) => l.data.map((d) => d.rate));
  const baselineRates = showBaseline ? lines.flatMap((l) => l.data.map((d) => d.baseline)) : [];
  const allValues = [...allRates, ...baselineRates];
  const rawYMin = allValues.length ? Math.min(...allValues) : 0.2;
  const rawYMax = allValues.length ? Math.max(...allValues) : 0.8;
  const pad     = Math.max(0.02, (rawYMax - rawYMin) * 0.08);
  const yMin    = Math.max(0, Math.floor((rawYMin - pad) * 100) / 100);
  const yMax    = Math.min(1, Math.ceil( (rawYMax + pad) * 100) / 100);

  // ── Baseline lines (one per unique rangeName, grey dashed) ─────────────────
  const baselinePolylines = React.useMemo(() => {
    if (!showBaseline || !lines.length) return [];
    const seen = new Set<string>();
    return lines
      .filter((l) => { if (seen.has(l.rangeName)) return false; seen.add(l.rangeName); return true; })
      .map((l) => ({
        rangeName: l.rangeName,
        pts: l.data
          .map((d) => `${xPos(d.depth, depthMin, depthMax).toFixed(1)},${yPos(d.baseline, yMin, yMax).toFixed(1)}`)
          .join(" "),
      }));
  }, [lines, showBaseline, depthMin, depthMax, yMin, yMax]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono text-sm p-6">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Keyword Performance</h1>
            <p className="text-gray-500 mt-1 text-xs">
              survival rate per depth — how often runs with this keyword reach the next depth
            </p>
          </div>
          {onBack ? (
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1 text-sm"
            >
              ← Admin
            </button>
          ) : (
            <a
              href="/admin"
              className="text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1 text-sm"
            >
              ← Admin
            </a>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Context</label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value as "player" | "boss")}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            >
              <option value="player">Player keywords</option>
              <option value="boss">Boss keywords</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Depth min</label>
            <input type="number" min={1} max={50} value={depthMin}
              onChange={(e) => setDepthMin(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Depth max</label>
            <input type="number" min={1} max={50} value={depthMax}
              onChange={(e) => setDepthMax(Math.min(50, Math.max(1, Number(e.target.value))))}
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Min support</label>
            <input type="number" min={1} max={999} value={minSupport}
              onChange={(e) => setMinSupport(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm" />
          </div>
          <label className="flex items-center gap-2 self-end pb-1 cursor-pointer">
            <input
              type="checkbox" checked={showBaseline}
              onChange={(e) => setShowBaseline(e.target.checked)}
              className="accent-gray-400"
            />
            <span className="text-xs text-gray-400">Show baseline</span>
          </label>
          {lines.length > 0 && (
            <button
              onClick={refreshAll} disabled={refreshing}
              className="self-end bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white rounded px-3 py-1 text-sm"
            >
              {refreshing ? "Refreshing…" : "↺ Refresh all"}
            </button>
          )}
        </div>

        {/* Date Ranges */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Date Ranges</span>
            <button
              onClick={addRange}
              className="text-xs text-orange-400 hover:text-orange-300 border border-orange-800 rounded px-2 py-0.5"
            >
              + Add range
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {ranges.map((range) => (
              <div key={range.id} className="flex flex-wrap gap-2 items-center">
                <input
                  value={range.label}
                  onChange={(e) => updateRange(range.id, "label", e.target.value)}
                  placeholder="Label"
                  className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <input
                  type="date"
                  value={range.from}
                  onChange={(e) => updateRange(range.id, "from", e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                <span className="text-gray-500 text-xs">→</span>
                <input
                  type="date"
                  value={range.to}
                  onChange={(e) => updateRange(range.id, "to", e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
                {ranges.length > 1 && (
                  <button
                    onClick={() => removeRange(range.id)}
                    className="text-gray-600 hover:text-red-400 text-xs px-1"
                    title="Remove range"
                  >✕</button>
                )}
                {!range.from && !range.to && (
                  <span className="text-gray-600 text-xs italic">no filter</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add keyword row */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-3 flex gap-3 items-center">
          <input
            type="text"
            placeholder="e.g.  mace   or   leech"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && addKeyword()}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm
                       placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={() => addKeyword()} disabled={loading || !input.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white rounded px-4 py-1.5 text-sm whitespace-nowrap"
          >
            {loading ? "Loading…" : "Add to chart"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-3 mb-3 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* ── Three-column layout ──────────────────────────────────────────── */}
        {/* xl+  : [high performers] | [chart + legend] | [low performers]    */}
        {/* <xl   : [chart], then sidebars below                              */}
        <div className="flex flex-col xl:flex-row gap-4 items-start">

          {/* Left — high performers */}
          <div className="w-full xl:w-56 2xl:w-64 shrink-0 order-2 xl:order-1">
            <KeywordSidebarPanel
              label="High performers"
              accentColor="text-green-400"
              rows={highRows}
              onAdd={(name) => addKeyword(name)}
              activeNames={activeNames}
            />
          </div>

          {/* Center — chart + legend */}
          <div className="flex-1 min-w-0 order-1 xl:order-2">

        {/* Chart */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-3 overflow-x-auto">
          {lines.length === 0 ? (
            <p className="text-gray-500 text-center py-16 text-sm">
              Add a keyword above to start comparing.
            </p>
          ) : (
            <div className="relative" style={{ width: SVG_W, userSelect: "none" }}>
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H}
                style={{ display: "block", overflow: "visible" }}>
                <g transform={`translate(${M.left},${M.top})`}>

                  {/* Y grid + axis labels */}
                  {niceYTicks(yMin, yMax).map((v) => {
                    const y = yPos(v, yMin, yMax);
                    return (
                      <g key={v}>
                        <line x1={0} y1={y} x2={CW} y2={y}
                          stroke="#1f2937" strokeWidth={1} strokeDasharray="4,3" />
                        <text x={-8} y={y + 4} textAnchor="end" fontSize={10} fill="#6b7280">
                          {pct(v)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X ticks */}
                  {xTicks(depthMin, depthMax).map((v) => {
                    const x = xPos(v, depthMin, depthMax);
                    return (
                      <g key={v}>
                        <line x1={x} y1={CH} x2={x} y2={CH + 5} stroke="#4b5563" strokeWidth={1} />
                        <text x={x} y={CH + 16} textAnchor="middle" fontSize={10} fill="#6b7280">{v}</text>
                      </g>
                    );
                  })}

                  <rect x={0} y={0} width={CW} height={CH} fill="none" stroke="#374151" strokeWidth={1} />
                  <text x={CW / 2} y={CH + 38} textAnchor="middle" fontSize={11} fill="#4b5563">depth</text>
                  <text transform="rotate(-90)" x={-CH / 2} y={-52}
                    textAnchor="middle" fontSize={11} fill="#4b5563">survival rate</text>

                  {/* Baseline lines (grey dashed) */}
                  {baselinePolylines.map(({ rangeName, pts }) => pts && (
                    <polyline
                      key={`baseline-${rangeName}`}
                      points={pts}
                      fill="none" stroke="#4b5563"
                      strokeWidth={1.5} strokeDasharray="6,4"
                      strokeLinecap="round" opacity={0.7}
                    />
                  ))}

                  {/* Keyword lines */}
                  {lines.map((line) => {
                    if (!line.data.length) return null;
                    const pts = line.data.map((d) =>
                      `${xPos(d.depth, depthMin, depthMax).toFixed(1)},${yPos(d.rate, yMin, yMax).toFixed(1)}`
                    ).join(" ");
                    return (
                      <polyline key={line.id} points={pts} fill="none" stroke={line.color}
                        strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
                    );
                  })}

                  {/* Dots */}
                  {lines.map((line) =>
                    line.data.map((d) => {
                      const cx = xPos(d.depth, depthMin, depthMax);
                      const cy = yPos(d.rate, yMin, yMax);
                      return (
                        <circle key={`${line.id}-${d.depth}`}
                          cx={cx} cy={cy} r={4}
                          fill={line.color} stroke="#111827" strokeWidth={1.5}
                          style={{ cursor: "crosshair" }}
                          onMouseEnter={() =>
                            setTooltip({ svgX: M.left + cx, svgY: M.top + cy, line, point: d })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })
                  )}
                </g>
              </svg>

              {/* Tooltip */}
              {tooltip && (() => {
                const flipX = tooltip.svgX > SVG_W * 0.62;
                const flipY = tooltip.svgY < 90;
                return (
                  <div
                    className="absolute bg-gray-800 border border-gray-600 rounded p-2.5 text-xs
                               pointer-events-none z-20 shadow-xl"
                    style={{
                      left:      flipX ? tooltip.svgX - 14 : tooltip.svgX + 14,
                      top:       flipY ? tooltip.svgY + 10 : tooltip.svgY - 10,
                      transform: `${flipX ? "translateX(-100%)" : ""} ${flipY ? "" : "translateY(-100%)"}`,
                      minWidth:  160,
                    }}
                  >
                    <div className="text-orange-400 font-bold mb-1.5 truncate max-w-[180px]">
                      {tooltip.line.label}
                    </div>
                    <div className="flex flex-col gap-0.5 text-gray-300">
                      <span>depth: <span className="text-white">{tooltip.point.depth}</span></span>
                      <span>rate:{" "}
                        <span className={tooltip.point.rate >= tooltip.point.baseline ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {pct(tooltip.point.rate)}
                        </span>
                      </span>
                      <span>baseline: <span className="text-gray-400">{pct(tooltip.point.baseline)}</span></span>
                      <span className={`text-xs ${tooltip.point.rate - tooltip.point.baseline >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {tooltip.point.rate - tooltip.point.baseline >= 0 ? "+" : ""}
                        {pct(tooltip.point.rate - tooltip.point.baseline)} vs baseline
                      </span>
                      <span>support: <span className="text-white">{tooltip.point.support}</span></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        {lines.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Active keywords</div>
            {showBaseline && (
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-800">
                <svg width={24} height={12} style={{ flexShrink: 0 }}>
                  <line x1={0} y1={6} x2={24} y2={6} stroke="#4b5563" strokeWidth={1.5}
                    strokeDasharray="6,4" strokeLinecap="round" />
                </svg>
                <span className="text-gray-500 flex-1 text-xs italic">Overall baseline (all runs)</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3 group">
                  <svg width={24} height={12} style={{ flexShrink: 0 }}>
                    <line x1={0} y1={6} x2={24} y2={6} stroke={line.color} strokeWidth={2.5} strokeLinecap="round" />
                    <circle cx={12} cy={6} r={3.5} fill={line.color} stroke="#111827" strokeWidth={1} />
                  </svg>
                  <span className="text-gray-200 flex-1 text-xs">{line.label}</span>
                  <span className="text-gray-600 text-xs">{line.data.length} depth{line.data.length !== 1 ? "s" : ""}</span>
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-gray-600 hover:text-red-400 text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

          </div>{/* end center */}

          {/* Right — low performers */}
          <div className="w-full xl:w-56 2xl:w-64 shrink-0 order-3">
            <KeywordSidebarPanel
              label="Low performers"
              accentColor="text-red-400"
              rows={lowRows}
              onAdd={(name) => addKeyword(name)}
              activeNames={activeNames}
            />
          </div>

        </div>{/* end three-column */}

      </div>
    </div>
  );
}
