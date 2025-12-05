import React from 'react';

interface GameProps {
    onExit: () => void;
}

const Game: React.FC<GameProps> = ({onExit}) => {
    return (<div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-white relative">
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={onExit}>Surrender</button>
            <div className="w-3/4 h-3/4 border-4 border-dashed border-gray-400 flex items-center justify-center">
                Game Area
            </div>
        </div>);
};

export default Game;