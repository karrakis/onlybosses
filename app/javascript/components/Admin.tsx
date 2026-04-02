import * as React from "react";
import SynergyChart from "./SynergyChart";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "analysis" | "synergy_chart";

type Section = { title: string; lines: string[] };

type AnalysisResult = {
  sections: Section[];
  error: string | null;
  run_count: number;
  snapshot_count: number;
};

// ─── AnalysisView ─────────────────────────────────────────────────────────────

type AnalysisViewProps = {
  onNavigate: (v: View) => void;
  result:     AnalysisResult | null;
  setResult:  React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
};

function AnalysisView({ onNavigate, result, setResult }: AnalysisViewProps) {
  const [minDepth,        setMinDepth]        = React.useState(1);
  const [minSupport,      setMinSupport]      = React.useState(15);
  const [deltaThreshold,  setDeltaThreshold]  = React.useState(0.15);
  const [useTree,         setUseTree]         = React.useState(false);
  const [loading,         setLoading]         = React.useState(false);

  async function runAnalysis() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        depth:     String(minDepth),
        support:   String(minSupport),
        threshold: String(deltaThreshold),
        tree:      useTree ? "1" : "0",
      });
      const res  = await fetch(`/admin/analysis_data?${params}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ sections: [], error: e.message, run_count: 0, snapshot_count: 0 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono text-sm p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Balance Analysis</h1>
            {result && (
              <p className="text-gray-400 mt-1">
                {result.run_count} runs &nbsp;·&nbsp; {result.snapshot_count} snapshots
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("synergy_chart")}
              className="text-orange-400 hover:text-orange-300 border border-orange-700 rounded px-3 py-1 text-sm"
            >
              Synergy Chart →
            </button>
            <a
              href="/"
              className="text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1 text-sm"
            >
              ← Home
            </a>
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

        {/* Error */}
        {result?.error && (
          <div className="bg-red-950 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-bold mb-1">Analysis failed</p>
            <pre className="text-red-300 text-xs whitespace-pre-wrap">{result.error}</pre>
          </div>
        )}

        {/* Sections */}
        {result?.sections.map((section, i) => (
          <div key={i} className="mb-6 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
              <h2 className="text-orange-400 font-bold text-sm uppercase tracking-wide">
                {section.title}
              </h2>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-gray-200 text-xs leading-5 whitespace-pre">
                {section.lines.join("\n")}
              </pre>
            </div>
          </div>
        ))}

        {!result && !loading && (
          <p className="text-gray-500 text-center mt-16">
            Click "Run Analysis" to generate a report.
          </p>
        )}

      </div>
    </div>
  );
}

// ─── Root Admin component ─────────────────────────────────────────────────────

export default function Admin() {
  const pathToView = (): View =>
    window.location.pathname.includes("synergy_chart") ? "synergy_chart" : "analysis";

  const [view,      setView]      = React.useState<View>(pathToView);
  const [result,    setResult]    = React.useState<AnalysisResult | null>(null);

  function navigate(v: View) {
    setView(v);
    history.pushState({}, "", v === "synergy_chart" ? "/admin/synergy_chart" : "/admin");
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
  return <AnalysisView onNavigate={navigate} result={result} setResult={setResult} />;
}
