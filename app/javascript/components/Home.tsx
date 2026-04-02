import React, {useState} from 'react';
import MagmaBackground from './MagmaBackground';
import Game from './Game';

const StartButton: React.FC<{message: string, onClick: () => void}> = ({message, onClick}) => {
    return (
        <button onClick={onClick} className="w-64 h-16 rounded-lg border-2 border-gray-400 hover:border-gray-600 bg-gray-200 hover:bg-gray-300">{message}</button>
    );
}

interface HomeProps {
    availableKeywords: string[];
}

interface SimProgress {
    run: number;
    depth: number;
    total: number;
}

const Home: React.FC<HomeProps> = ({ availableKeywords }) => {
    const [activeGame, setActiveGame] = useState<boolean>(false);

    const [simCount, setSimCount] = useState<number>(10);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [simProgress, setSimProgress] = useState<SimProgress>({ run: 0, depth: 0, total: 0 });

    const startSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimProgress({ run: 0, depth: 0, total: simCount });

        const source = new EventSource(`/simulate_runs?count=${simCount}`);

        source.onmessage = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.done) {
                source.close();
                setIsSimulating(false);
            } else {
                setSimProgress({ run: data.run, depth: data.depth, total: data.total });
            }
        };

        source.onerror = () => {
            source.close();
            setIsSimulating(false);
        };
    };

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
                            max={500}
                            value={simCount}
                            onChange={(e) => setSimCount(Math.max(1, parseInt(e.target.value) || 1))}
                            disabled={isSimulating}
                            className="w-16 text-center text-sm bg-black/50 border border-gray-500 rounded px-2 py-1 text-white disabled:opacity-50"
                        />
                        <button
                            onClick={startSimulation}
                            disabled={isSimulating}
                            className="text-sm border border-gray-400 rounded px-3 py-1 text-white bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSimulating ? 'Running…' : 'Generate'}
                        </button>
                    </div>
                    {(isSimulating || simProgress.run > 0) && (
                        <div className="text-xs text-gray-300 text-right bg-black/60 rounded px-3 py-1.5 leading-5">
                            <div>Depth {simProgress.depth}</div>
                            <div>{simProgress.run} / {simProgress.total} runs</div>
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
                <a
                    href="/admin"
                    className="absolute bottom-4 right-4 z-10 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-500 rounded px-2 py-1 bg-black/40 transition-colors"
                >
                    Admin
                </a>
            )}
        </div>
    );
};

export default Home;