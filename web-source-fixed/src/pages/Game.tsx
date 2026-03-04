import { useState, useCallback, useEffect } from 'react';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import GameOver from '@/components/game/GameOver';
import { MintOverlay } from '@/components/game/MintOverlay';
import { TrialTimer } from '@/components/game/TrialTimer';
import { type GameMode } from '@/lib/gameEngine';
import { updateProgressAfterGame, loadProgress } from '@/lib/storage';
import { SOLANA_RPC_URL, GAME_PASS_COLLECTION_ADDRESS } from '@/lib/solanaConfig';
import { useNativeWallet } from '@/components/NativeWalletContext';

type Screen = 'menu' | 'playing' | 'gameOver';

// Declare the Android JS bridge (injected by MainActivity)
declare global {
  interface Window {
    Android?: {
      setState: (state: string) => void;
      connectWallet: () => void;
      disconnectWallet: () => void;
      getWalletAddress: () => string;
      isWalletConnected: () => boolean;
      sendSol: (to: string, amount: number) => void;
      mintGamePass: () => void;
    };
    handleAndroidBack?: () => void;
    __onNativeWalletConnected?: (address: string) => void;
    __onNativeWalletDisconnected?: () => void;
    __onNativeWalletError?: (error: string) => void;
    __nativeWalletAddress?: string;
    __onNativeTxSuccess?: (signature: string) => void;
    __onNativeTxError?: (error: string) => void;
    __onNativeMintSuccess?: (result: string) => void;
    __onNativeMintError?: (error: string) => void;
    onGameBack?: () => void;
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
  const [progress, setProgress] = useState(loadProgress());
  const [gameKey, setGameKey] = useState(0);
  const [isVertical, setIsVerticalState] = useState(loadProgress().isVertical);

  // --- TRIAL & PASS LOGIC ---
  const wallet = useNativeWallet();
  const [hasPass, setHasPass] = useState<boolean | null>(null);
  const [trialTime, setTrialTime] = useState(15);
  const [isLocked, setIsLocked] = useState(false);
  const [showMintOverlay, setShowMintOverlay] = useState(false);

  // Requirement: check ownership on key events (connect, change, mint success)
  const checkOwnership = useCallback(async () => {
    if (!wallet.walletAddress) {
      setHasPass(false);
      return;
    }

    try {
      const response = await fetch(SOLANA_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'check-ownership',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: wallet.walletAddress,
            page: 1,
            limit: 1000
          },
        }),
      });

      const { result } = await response.json();

      const ownsPass = result?.items?.some((asset: any) =>
        asset.content?.metadata?.name === 'Token Frenzy Game Pass' ||
        asset.content?.metadata?.symbol === 'TFGP' ||
        (asset.grouping || []).some((group: any) => group.group_value === GAME_PASS_COLLECTION_ADDRESS)
      ) ?? false;

      setHasPass(ownsPass);

      if (ownsPass) {
        setIsLocked(false);
        setShowMintOverlay(false);
      }
    } catch (err) {
      console.error("Pass check failed:", err);
      // Fallback to false if check fails to ensure trial logic works
      setHasPass(false);
    }
  }, [wallet.walletAddress]);

  // Event 1 & 2: Check on mount, auto-connect, or manual wallet connect
  useEffect(() => {
    checkOwnership();
  }, [wallet.connected, wallet.walletAddress, checkOwnership]);

  // Timer logic for trial
  useEffect(() => {
    if (screen === 'playing' && hasPass === false && trialTime > 0) {
      const timer = setInterval(() => {
        setTrialTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLocked(true);
            setShowMintOverlay(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen, hasPass, trialTime]);

  const handleMintSuccess = useCallback(() => {
    setShowMintOverlay(false);
    setIsLocked(false);
    checkOwnership();
  }, [checkOwnership]);

  const [reviveStats, setReviveStats] = useState<{ score: number; tokensSliced: number; bestCombo: number } | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  const handleRevive = useCallback(() => {
    if (stats) {
      setReviveStats({
        score: stats.score,
        tokensSliced: stats.tokensSliced,
        bestCombo: stats.bestCombo
      });
      setGameKey(prev => prev + 1);
      setScreen('playing');
      window.Android?.setState('playing');
    }
  }, [stats]);

  const handleStart = useCallback((selectedMode: GameMode) => {
    const latestProgress = loadProgress();
    setProgress(latestProgress);
    setSessionId(Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9));
    setReviveStats(null);
    setMode(selectedMode);
    setGameKey(prev => prev + 1);
    setScreen('playing');
    window.Android?.setState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (isLocked) {
      setShowMintOverlay(true);
      return;
    }
    setSessionId(Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9));
    setReviveStats(null);
    setGameKey(prev => prev + 1);
    setScreen('playing');
    window.Android?.setState('playing');
  }, [isLocked]);

  const handleGameOver = useCallback((gameStats: GameStats) => {
    setStats(gameStats);
    updateProgressAfterGame(gameStats.score, gameStats.tokensSliced, gameStats.bestCombo);
    setProgress(loadProgress()); // Refresh local progress state
    setScreen('gameOver');
    window.Android?.setState('gameover');
  }, []);

  const [initialMenuTab, setInitialMenuTab] = useState<'play' | 'rank' | 'shop'>('play');

  const handleMenu = useCallback((tab: 'play' | 'rank' | 'shop' = 'play') => {
    setInitialMenuTab(tab);
    setSessionId('');
    setScreen('menu');
    window.Android?.setState('home');
  }, []);


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
        if (window.onGameBack) {
          window.onGameBack();
        } else {
          handleMenu('play');
        }
      } else if (screen === 'gameOver') {
        handleMenu('play');
      } else if (screen === 'menu') {
      }
    };
    return () => { window.handleAndroidBack = undefined; };
  }, [screen, handleMenu]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div
        className={`relative transition-all duration-500 ${isVertical
          ? 'h-full aspect-[9/16] max-h-screen overflow-hidden'
          : 'w-full h-full'
          }`}
      >
        {screen === 'menu' && <MainMenu onStart={handleStart} initialTab={initialMenuTab} hasPass={hasPass} onRequestMint={() => setShowMintOverlay(true)} />}
        {screen === 'gameOver' && stats && (
          <GameOver
            stats={stats}
            onRestart={handleRestart}
            onMenu={() => handleMenu('play')}
            onViewRank={() => handleMenu('rank')}
            onRevive={handleRevive}
            sessionId={sessionId}
          />
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
              initialStats={reviveStats || undefined}
              settings={progress.settings}
            />
            {(!hasPass && trialTime > 0) && <TrialTimer seconds={trialTime} />}
          </>
        )}

        {/* MINT OVERLAY — shown when trial ends or user requests it */}
        {(isLocked || showMintOverlay) && <MintOverlay onSuccess={handleMintSuccess} />}
      </div>
    </div>
  );
};

export default Game;
