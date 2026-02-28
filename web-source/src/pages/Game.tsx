import { useState, useCallback, useEffect } from 'react';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import GameOver from '@/components/game/GameOver';
import { type GameMode } from '@/lib/gameEngine';
import { updateProgressAfterGame, loadProgress } from '@/lib/storage';

type Screen = 'menu' | 'playing' | 'gameOver';

interface GameStats {
  score: number;
  tokensSliced: number;
  bestCombo: number;
  mode: GameMode;
}

const Game = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [gameKey, setGameKey] = useState(0);

  // Auto-orientation detection and mint requirement check
  const [isVertical, setIsVerticalState] = useState(loadProgress().isVertical);

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsVerticalState(isPortrait);
      // Optional: save to storage if you want it persistent
      // setIsVertical(isPortrait);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((gameStats: GameStats) => {
    setStats(gameStats);
    updateProgressAfterGame(gameStats.score, gameStats.tokensSliced, gameStats.bestCombo);
    setScreen('gameOver');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(prev => prev + 1);
    setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => {
    // We allow going back to menu
    setScreen('menu');
  }, []);

  // Orientation is now managed by local state for responsiveness

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div
        className={`relative shadow-2xl transition-all duration-500 overflow-hidden ${isVertical
          ? 'h-full aspect-[9/16] max-h-screen'
          : 'w-full h-full'
          }`}
      >
        {screen === 'menu' && <MainMenu onStart={handleStart} />}
        {screen === 'gameOver' && stats && (
          <GameOver stats={stats} onRestart={handleRestart} onMenu={handleMenu} />
        )}
        {screen === 'playing' && (
          <GameCanvas key={gameKey} mode={mode} onGameOver={handleGameOver} onRestart={handleRestart} onExit={handleMenu} />
        )}
      </div>
    </div>
  );
};

export default Game;
