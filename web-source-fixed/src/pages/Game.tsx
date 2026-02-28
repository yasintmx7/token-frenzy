import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, fetchAssetsByOwner } from '@metaplex-foundation/mpl-core';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import GameOver from '@/components/game/GameOver';
import { MintOverlay } from '@/components/game/MintOverlay';
import { TrialTimer } from '@/components/game/TrialTimer';
import { type GameMode } from '@/lib/gameEngine';
import { updateProgressAfterGame, loadProgress } from '@/lib/storage';
import { SOLANA_RPC_URL, GAME_PASS_COLLECTION_ADDRESS } from '@/lib/solanaConfig';

type Screen = 'menu' | 'playing' | 'gameOver';

// Declare the Android JS bridge (injected by MainActivity)
declare global {
  interface Window {
    Android?: { setState: (state: string) => void };
    handleAndroidBack?: () => void;
  }
}

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
  const [isVertical, setIsVerticalState] = useState(loadProgress().isVertical);

  // --- TRIAL & PASS LOGIC ---
  const wallet = useWallet();
  const [hasPass, setHasPass] = useState<boolean | null>(null); // null means checking
  const [trialTime, setTrialTime] = useState(15);
  const [isLocked, setIsLocked] = useState(false);

  // Requirement: check ownership on key events (connect, change, mint success)
  const checkOwnership = useCallback(async () => {
    if (!wallet.publicKey) {
      setHasPass(false);
      return;
    }

    try {
      const umi = createUmi(SOLANA_RPC_URL).use(mplCore());
      const assets = await fetchAssetsByOwner(umi, umiPublicKey(wallet.publicKey));

      const ownsPass = assets.some(asset =>
        asset.updateAuthority.type === 'Collection' &&
        asset.updateAuthority.address.toString() === GAME_PASS_COLLECTION_ADDRESS
      );

      setHasPass(ownsPass);

      // If pass is found, unlock forever
      if (ownsPass) {
        setIsLocked(false);
      }
    } catch (err) {
      console.error("Pass check failed:", err);
      // Fallback to false if check fails to ensure trial logic works
      setHasPass(false);
    }
  }, [wallet.publicKey]);

  // Event 1 & 2: Check on mount, auto-connect, or manual wallet connect
  useEffect(() => {
    checkOwnership();
  }, [wallet.connected, wallet.publicKey, checkOwnership]);

  // Timer logic for trial
  useEffect(() => {
    if (screen === 'playing' && hasPass === false && trialTime > 0) {
      const timer = setInterval(() => {
        setTrialTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLocked(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen, hasPass, trialTime]);

  // Event 3: Check ownership once again after mint success
  const handleMintSuccess = useCallback(() => {
    checkOwnership();
  }, [checkOwnership]);

  // --- GAME HANDLERS ---
  const handleStart = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    setGameKey(prev => prev + 1);
    setScreen('playing');
    window.Android?.setState('playing');
  }, []);

  const handleGameOver = useCallback((gameStats: GameStats) => {
    setStats(gameStats);
    updateProgressAfterGame(gameStats.score, gameStats.tokensSliced, gameStats.bestCombo);
    setScreen('gameOver');
    window.Android?.setState('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    if (isLocked) return;
    setGameKey(prev => prev + 1);
    setScreen('playing');
    window.Android?.setState('playing');
  }, [isLocked]);

  const [initialMenuTab, setInitialMenuTab] = useState<'play' | 'rank' | 'skins'>('play');

  const handleMenu = useCallback((tab: 'play' | 'rank' | 'skins' = 'play') => {
    setInitialMenuTab(tab);
    setScreen('menu');
    window.Android?.setState('home');
  }, []);

  // Requirement: Do not allow gameplay while wallet is disconnected
  useEffect(() => {
    if (screen === 'playing' && !wallet.connected) {
      handleMenu('play');
    }
  }, [screen, wallet.connected, handleMenu]);

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsVerticalState(isPortrait);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register global back handler for Android native back button
  useEffect(() => {
    window.handleAndroidBack = () => {
      if (screen === 'playing') {
        // During gameplay → go back to menu (acts as pause/exit)
        handleMenu('play');
      } else if (screen === 'gameOver') {
        handleMenu('play');
      } else if (screen === 'menu') {
        // Delegated to MainMenu's own handler (subtab navigation)
        // MainMenu registers its own window.handleAndroidBack when on subtabs
      }
    };
    return () => { window.handleAndroidBack = undefined; };
  }, [screen, handleMenu]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div
        className={`relative shadow-2xl transition-all duration-500 overflow-hidden ${isVertical
          ? 'h-full aspect-[9/16] max-h-screen'
          : 'w-full h-full'
          }`}
      >
        {screen === 'menu' && <MainMenu onStart={handleStart} initialTab={initialMenuTab} />}
        {screen === 'gameOver' && stats && (
          <GameOver stats={stats} onRestart={handleRestart} onMenu={() => handleMenu('play')} onViewRank={() => handleMenu('rank')} />
        )}
        {screen === 'playing' && (
          <>
            <GameCanvas
              key={gameKey}
              mode={mode}
              onGameOver={handleGameOver}
              onRestart={handleRestart}
              onExit={handleMenu}
              forcePaused={isLocked}
            />
            {(!hasPass && trialTime > 0) && <TrialTimer seconds={trialTime} />}
          </>
        )}

        {/* MINT OVERLAY */}
        {isLocked && <MintOverlay onSuccess={handleMintSuccess} />}
      </div>
    </div>
  );
};

export default Game;
