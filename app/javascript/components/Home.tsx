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

const Home: React.FC<HomeProps> = ({ availableKeywords }) => {
    const [activeGame, setActiveGame] = useState<boolean>(false);
    return (
        <div className="w-screen h-screen flex items-center justify-center text-3xl font-bold relative overflow-hidden">
            <MagmaBackground />
            {activeGame ? <Game onExit={() => setActiveGame(false)} availableKeywords={availableKeywords} /> : 
            <div id="home-button-container" className="relative z-10 text-center w-[320px] h-[320px] flex flex-col items-center justify-around border-4 border-dashed border-gray-300 rounded-lg bg-black/30 backdrop-blur-sm bg-gray-100 bg-opacity-70">
                <StartButton onClick={() => setActiveGame(true)} message="Descend" />
                {/* <StartButton message="Continue Descent" />                */}
            </div>}
        </div>
    );
};

export default Home;