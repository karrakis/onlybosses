import * as React from "react";
import SynergyChart from "./SynergyChart";
import KeywordChart from "./KeywordChart";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "analysis" | "synergy_chart" | "keyword_chart";

type Section = { title: string; lines: string[] };

type AnalysisResult = {
  sections: Section[];
  error: string | null;
  run_count: number;
  snapshot_count: number;
};

// ─── CollapsibleSection ───────────────────────────────────────────────────────

function CollapsibleSection({ title, lines }: { title: string; lines: string[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mb-3 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-2 text-left hover:bg-gray-750 focus:outline-none"
      >
        <h2 className="text-orange-400 font-bold text-sm uppercase tracking-wide">
          {title}
        </h2>
        <span className="text-gray-400 text-xs ml-4 shrink-0">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="p-4 overflow-x-auto">
          <pre className="text-gray-200 text-xs leading-5 whitespace-pre">
            {lines.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── AnalysisView ─────────────────────────────────────────────────────────────

type AnalysisViewProps = {
  onNavigate:     (v: View) => void;
  result:         AnalysisResult | null;
  setResult:      React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  onNavigateHome: () => void;
};

function AnalysisView({ onNavigate, result, setResult, onNavigateHome }: AnalysisViewProps) {
  const [minDepth,        setMinDepth]        = React.useState(1);
  const [minSupport,      setMinSupport]      = React.useState(15);
  const [deltaThreshold,  setDeltaThreshold]  = React.useState(0.15);
  const [useTree,         setUseTree]         = React.useState(false);
  const [useTriples,      setUseTriples]      = React.useState(false);
  const [loading,         setLoading]         = React.useState(false);
  const [streamSections,  setStreamSections]  = React.useState<Section[]>([]);
  const [streamMeta,      setStreamMeta]      = React.useState<{ run_count: number; snapshot_count: number } | null>(null);
  const [streamError,     setStreamError]     = React.useState<string | null>(null);
  const sourceRef = React.useRef<EventSource | null>(null);

  const TOTAL_SECTIONS = 8 + (useTriples ? 4 : 0) + (useTree ? 1 : 0);

  const SECTION_LABELS = [
    "Survival rate by depth",
    "Player keyword survival delta",
    "Boss keyword survival delta",
    "Player modifier correlation",
    "Player pairs — synergies",
    "Player pairs — anti-synergies",
    ...(useTriples ? ["Player triples — synergies", "Player triples — anti-synergies"] : []),
    "Boss pairs — synergies",
    "Boss pairs — anti-synergies",
    ...(useTriples ? ["Boss triples — synergies", "Boss triples — anti-synergies"] : []),
    ...(useTree ? ["Gradient-boosted tree"] : []),
  ];

  function runAnalysis() {
    if (loading) return;

    // Close any existing stream
    sourceRef.current?.close();
    setLoading(true);
    setStreamSections([]);
    setStreamMeta(null);
    setStreamError(null);
    setResult(null);

    const params = new URLSearchParams({
      depth:     String(minDepth),
      support:   String(minSupport),
      threshold: String(deltaThreshold),
      tree:      useTree    ? "1" : "0",
      triples:   useTriples ? "1" : "0",
    });

    const source = new EventSource(`/admin/analysis_stream?${params}`);
    sourceRef.current = source;

    source.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.type === 'meta') {
        setStreamMeta({ run_count: data.run_count, snapshot_count: data.snapshot_count });
      } else if (data.type === 'section') {
        setStreamSections(prev => [...prev, { title: data.title, lines: data.lines }]);
      } else if (data.type === 'done') {
        source.close();
        setLoading(false);
        // Promote streamed sections into result for persistence
        setStreamSections(prev => {
          setResult(r => ({
            sections:       prev,
            error:          null,
            run_count:      streamMeta?.run_count      ?? r?.run_count      ?? 0,
            snapshot_count: streamMeta?.snapshot_count ?? r?.snapshot_count ?? 0,
          }));
          return prev;
        });
      } else if (data.type === 'error') {
        source.close();
        setLoading(false);
        setStreamError(data.message);
      }
    };

    source.onerror = () => {
      source.close();
      setLoading(false);
      setStreamError("Connection lost.");
    };
  }

  // Sections to display: live stream while running, committed result otherwise
  const displaySections = loading ? streamSections : (result?.sections ?? []);
  const displayMeta     = loading ? streamMeta      : (result ? { run_count: result.run_count, snapshot_count: result.snapshot_count } : null);
  const displayError    = loading ? streamError     : result?.error;
  const progress        = loading ? streamSections.length / TOTAL_SECTIONS : (result ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono text-sm p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Balance Analysis</h1>
            {displayMeta && (
              <p className="text-gray-400 mt-1">
                {displayMeta.run_count} runs &nbsp;·&nbsp; {displayMeta.snapshot_count} snapshots
              </p>
            )}
          </div>
            <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("keyword_chart")}
              className="text-orange-400 hover:text-orange-300 border border-orange-700 rounded px-3 py-1 text-sm"
            >
              Keyword Chart →
            </button>
            <button
              onClick={() => onNavigate("synergy_chart")}
              className="text-orange-400 hover:text-orange-300 border border-orange-700 rounded px-3 py-1 text-sm"
            >
              Synergy Chart →
            </button>
            <button
              onClick={onNavigateHome}
              className="text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1 text-sm"
            >
              ← Home
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Min depth</label>
            <input
              type="number" value={minDepth} min={1} max={50}
              onChange={(e) => setMinDepth(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Min support</label>
            <input
              type="number" value={minSupport} min={1}
              onChange={(e) => setMinSupport(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">|Δ| threshold</label>
            <input
              type="number" value={deltaThreshold} min={0} max={1} step={0.01}
              onChange={(e) => setDeltaThreshold(Number(e.target.value))}
              className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2 self-end mb-0.5">
            <input
              type="checkbox" id="triples" checked={useTriples}
              onChange={(e) => setUseTriples(e.target.checked)}
              className="accent-orange-500"
            />
            <label htmlFor="triples" className="text-xs text-gray-300 cursor-pointer">
              Include triples
            </label>
          </div>
          <div className="flex items-center gap-2 self-end mb-0.5">
            <input
              type="checkbox" id="tree" checked={useTree}
              onChange={(e) => setUseTree(e.target.checked)}
              className="accent-orange-500"
            />
            <label htmlFor="tree" className="text-xs text-gray-300 cursor-pointer">
              Include tree importances
            </label>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="self-end bg-orange-600 hover:bg-orange-500 disabled:opacity-40
                       text-white rounded px-4 py-1 text-sm cursor-pointer"
          >
            {loading ? "Running…" : "Run Analysis"}
          </button>
        </div>

        {/* Progress bar */}
        {(loading || progress > 0) && progress < 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                {loading && SECTION_LABELS[streamSections.length]
                  ? <span>Processing: <span className="text-orange-300">{SECTION_LABELS[streamSections.length]}</span></span>
                  : ""}
              </span>
              <span>{streamSections.length} / {TOTAL_SECTIONS} &nbsp;({Math.round(progress * 100)}%)</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {displayError && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-bold mb-1">Analysis failed</p>
            <pre className="text-red-300 text-xs whitespace-pre-wrap">{displayError}</pre>
          </div>
        )}

        {/* Sections */}
        {displaySections.map((section, i) => (
          <CollapsibleSection key={i} title={section.title} lines={section.lines} />
        ))}

        {!loading && displaySections.length === 0 && !displayError && (
          <p className="text-gray-500 text-center mt-16">
            Click "Run Analysis" to generate a report.
          </p>
        )}

      </div>
    </div>
  );
}

// ─── Root Admin component ─────────────────────────────────────────────────────

export default function Admin({ onNavigateHome = () => { history.pushState({}, "", "/"); location.reload(); } }: { onNavigateHome?: () => void }) {
  const pathToView = (): View =>
    window.location.pathname.includes("synergy_chart") ? "synergy_chart" :
    window.location.pathname.includes("keyword_chart") ? "keyword_chart" : "analysis";

  const [view,      setView]      = React.useState<View>(pathToView);
  const [result,    setResult]    = React.useState<AnalysisResult | null>(null);

  function navigate(v: View) {
    setView(v);
    const path = v === "synergy_chart" ? "/admin/synergy_chart"
               : v === "keyword_chart" ? "/admin/keyword_chart"
               : "/admin";
    history.pushState({}, "", path);
  }

  // Keep in sync with browser back/forward
  React.useEffect(() => {
    const handler = () => setView(pathToView());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (view === "synergy_chart") {
    return <SynergyChart onBack={() => navigate("analysis")} analysisResult={result} />;
  }
  if (view === "keyword_chart") {
    return <KeywordChart onBack={() => navigate("analysis")} analysisResult={result} />;
  }
  return <AnalysisView onNavigate={navigate} result={result} setResult={setResult} onNavigateHome={onNavigateHome} />;
}
