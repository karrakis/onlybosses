import React, { useState, useEffect } from 'react';
import MagmaBackground from './MagmaBackground';
import Game from './Game';

const StartButton: React.FC<{message: string, onClick: () => void}> = ({message, onClick}) => {
    return (
        <button onClick={onClick} className="w-64 h-16 rounded-lg border-2 border-gray-400 hover:border-gray-600 bg-gray-200 hover:bg-gray-300">{message}</button>
    );
}

interface HomeProps {
    availableKeywords: string[];
    onNavigate?: (to: string) => void;
}

interface SimBatch {
    id: number;
    status: 'pending' | 'running' | 'done' | 'cancelled';
    total: number;
    completed: number;
    created_at: string;
}

const Home: React.FC<HomeProps> = ({ availableKeywords, onNavigate }) => {
    const [activeGame, setActiveGame] = useState<boolean>(false);

    const [simCount, setSimCount] = useState<number>(500);
    const [batch, setBatch] = useState<SimBatch | null>(null);

    // On mount: resume tracking any active batch
    useEffect(() => {
        fetch('/simulation_batches/latest')
            .then(r => r.json())
            .then((data: SimBatch | { id: null }) => { if (data.id) setBatch(data as SimBatch); })
            .catch(() => {});
    }, []);

    // Poll for progress while a batch is active
    useEffect(() => {
        if (!batch || batch.status === 'done' || batch.status === 'cancelled') return;
        const timer = setInterval(() => {
            fetch(`/simulation_batches/${batch.id}`)
                .then(r => r.json())
                .then((data: SimBatch) => setBatch(data))
                .catch(() => {});
        }, 2000);
        return () => clearInterval(timer);
    }, [batch?.id, batch?.status]);

    const startSimulation = async () => {
        if (batch && (batch.status === 'pending' || batch.status === 'running')) return;
        try {
            const res = await fetch('/simulation_batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: simCount }),
            });
            const data: SimBatch = await res.json();
            setBatch(data);
        } catch (_) {}
    };

    const cancelBatch = async () => {
        if (!batch) return;
        try {
            const res = await fetch(`/simulation_batches/${batch.id}/cancel`, { method: 'PATCH' });
            const data: SimBatch = await res.json();
            setBatch(data);
        } catch (_) {}
    };

    const isActive = batch?.status === 'pending' || batch?.status === 'running';

    return (
        <div className="w-screen h-screen flex items-center justify-center text-3xl font-bold relative overflow-hidden">
            <MagmaBackground />

            {/* Generator panel — upper right, hidden during active game */}
            {!activeGame && (
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={100000}
                            value={simCount}
                            onChange={(e) => setSimCount(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={isActive}
                            className="w-20 text-center text-sm bg-black/50 border border-gray-500 rounded px-2 py-1 text-white disabled:opacity-50"
                        />
                        <button
                            onClick={startSimulation}
                            disabled={isActive}
                            className="text-sm border border-gray-400 rounded px-3 py-1 text-white bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isActive ? 'Running…' : 'Generate'}
                        </button>
                        {isActive && (
                            <button
                                onClick={cancelBatch}
                                className="text-sm border border-red-700 rounded px-2 py-1 text-red-400 bg-black/50 hover:bg-red-950/50"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    {batch && (
                        <div className="text-xs text-gray-300 text-right bg-black/60 rounded px-3 py-1.5 leading-5">
                            <div className="capitalize text-gray-400">{batch.status}</div>
                            <div>{batch.completed.toLocaleString()} / {batch.total.toLocaleString()} runs</div>
                        </div>
                    )}
                </div>
            )}

            {activeGame
                ? <Game onExit={() => setActiveGame(false)} availableKeywords={availableKeywords} />
                : <div id="home-button-container" className="relative z-10 text-center w-[320px] h-[320px] flex flex-col items-center justify-around border-4 border-dashed border-gray-300 rounded-lg bg-black/30 backdrop-blur-sm bg-gray-100 bg-opacity-70">
                    <StartButton onClick={() => setActiveGame(true)} message="Descend" />
                </div>
            }

            {/* Admin link — lower right, only on home screen */}
            {!activeGame && (
                <button
                    onClick={() => onNavigate?.("admin")}
                    className="absolute bottom-4 right-4 z-10 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 rounded px-2 py-1 bg-black/40 transition-colors"
                >
                    Admin
                </button>
            )}
        </div>
    );
};

export default Home;