import { useState, useCallback, useEffect, useRef } from 'react';
import MainMenu from '@/components/game/MainMenu';
import GameCanvas from '@/components/game/GameCanvas';
import GameOver from '@/components/game/GameOver';
import { MintOverlay } from '@/components/game/MintOverlay';
import { TrialTimer } from '@/components/game/TrialTimer';
import { type GameMode } from '@/lib/gameEngine';
import { updateProgressAfterGame, loadProgress, syncProgressToCloud, saveProgress } from '@/lib/storage';
import { BOARD_THEMES } from '@/lib/boardThemes';
import { TOKEN_FRAMES } from '@/lib/tokenFrames';
import { BLADE_SKINS } from '@/lib/bladeSkins';
import { SOLANA_RPC_URL, GAME_PASS_COLLECTION_ADDRESS } from '@/lib/solanaConfig';
import { useNativeWallet } from '@/components/NativeWalletContext';

type Screen = 'menu' | 'playing' | 'gameOver';

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

const makeSessionId = () => Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
const TRIAL_DURATION = 15;

const Game = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [progress, setProgress] = useState(loadProgress());
  const [gameKey, setGameKey] = useState(0);

  const wallet = useNativeWallet();
  const [hasPass, setHasPass] = useState<boolean | null>(null);
  const [trialTime, setTrialTime] = useState(TRIAL_DURATION);
  const [isLocked, setIsLocked] = useState(false);
  const [showMintOverlay, setShowMintOverlay] = useState(false);

  const checkOwnership = useCallback(async () => {
    if (!wallet.walletAddress) { setHasPass(false); return; }
    try {
      const response = await fetch(SOLANA_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'check-ownership', method: 'getAssetsByOwner',
          params: { ownerAddress: wallet.walletAddress, page: 1, limit: 1000 },
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
        const p = loadProgress();
        if (!p.hasPremiumAccess) {
          p.hasPremiumAccess = true;
          saveProgress(p);
          setProgress(p);
        }
        setIsLocked(false);
        setShowMintOverlay(false);
      }
    } catch (err) {
      console.error('Pass check failed:', err);
      setHasPass(false);
    }
  }, [wallet.walletAddress]);

  useEffect(() => { checkOwnership(); }, [wallet.connected, wallet.walletAddress, checkOwnership]);

  const trialTimeRef = useRef(trialTime);
  trialTimeRef.current = trialTime;

  useEffect(() => {
    if (screen !== 'playing' || hasPass === true || progress.hasPremiumAccess || trialTimeRef.current <= 0) return;
    const timer = setInterval(() => {
      const next = trialTimeRef.current - 1;
      if (next <= 0) {
        clearInterval(timer);
        setIsLocked(true);
        setShowMintOverlay(true);
        setTrialTime(0);
      } else {
        setTrialTime(next);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, hasPass]);

  const handleMintSuccess = useCallback(() => {
    setShowMintOverlay(false);
    setIsLocked(false);
    checkOwnership();
  }, [checkOwnership]);

  const [reviveStats, setReviveStats] = useState<{ score: number; tokensSliced: number; bestCombo: number } | null>(null);
  const [sessionId, setSessionId] = useState(makeSessionId);

  const handleRevive = useCallback(() => {
    if (stats) {
      setReviveStats({ score: stats.score, tokensSliced: stats.tokensSliced, bestCombo: stats.bestCombo });
      setGameKey(prev => prev + 1);
      setScreen('playing');
      window.Android?.setState('playing');
    }
  }, [stats]);

  const handleStart = useCallback((selectedMode: GameMode) => {
    setProgress(loadProgress());
    setSessionId(makeSessionId());
    setReviveStats(null);
    setMode(selectedMode);
    setGameKey(prev => prev + 1);
    setTrialTime(TRIAL_DURATION);
    setIsLocked(false);
    setScreen('playing');
    window.Android?.setState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (isLocked) { setShowMintOverlay(true); return; }
    setSessionId(makeSessionId());
    setReviveStats(null);
    setGameKey(prev => prev + 1);
    setTrialTime(TRIAL_DURATION);
    setIsLocked(false);
    setScreen('playing');
    window.Android?.setState('playing');
  }, [isLocked]);

  const handleGameOver = useCallback((gameStats: GameStats) => {
    setStats(gameStats);
    updateProgressAfterGame(gameStats.score, gameStats.tokensSliced, gameStats.bestCombo);

    const walletAddr = window.Android?.getWalletAddress?.();
    if (walletAddr) {
      syncProgressToCloud(walletAddr);
    }

    setProgress(loadProgress());
    setScreen('gameOver');
    window.Android?.setState('gameover');
  }, []);

  const [initialMenuTab, setInitialMenuTab] = useState<'play' | 'rank' | 'shop'>('play');

  const handleMenu = useCallback((tab: 'play' | 'rank' | 'shop' = 'play') => {
    setInitialMenuTab(tab);
    setScreen('menu');
    window.Android?.setState('home');
  }, []);

  useEffect(() => {
    window.__onNativeTxSuccess = (signature: string) => {
      console.log('Transaction success:', signature);
      const pendingStr = localStorage.getItem('pending-purchase');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          const p = loadProgress();

          if (pending.type === 'revive') {
            p.revives = (p.revives || 0) + pending.qty;
          } else if (pending.type === 'bundle') {
            p.hasPremiumAccess = true;
            BOARD_THEMES.filter((t: any) => t.tier === 'sol').forEach((t: any) => { if (!p.ownedBoards.includes(t.id)) p.ownedBoards.push(t.id); });
            TOKEN_FRAMES.filter((t: any) => t.tier === 'sol').forEach((t: any) => { if (!p.ownedFrames.includes(t.id)) p.ownedFrames.push(t.id); });
            BLADE_SKINS.filter((t: any) => t.tier === 'sol').forEach((t: any) => { if (!p.ownedBlades.includes(t.id)) p.ownedBlades.push(t.id); });
          } else if (pending.itemId) {
            if (pending.type === 'board' && !p.ownedBoards.includes(pending.itemId)) { p.ownedBoards.push(pending.itemId); p.selectedBoard = pending.itemId; }
            else if (pending.type === 'frame' && !p.ownedFrames.includes(pending.itemId)) { p.ownedFrames.push(pending.itemId); p.selectedFrame = pending.itemId; }
            else if (pending.type === 'blade' && !p.ownedBlades.includes(pending.itemId)) { p.ownedBlades.push(pending.itemId); p.selectedBlade = pending.itemId; }
            else if (pending.type === 'avatar' && !p.ownedAvatars.includes(pending.itemId)) { p.ownedAvatars.push(pending.itemId); p.selectedAvatar = pending.itemId; }
          }

          localStorage.setItem('token-frenzy-progress', JSON.stringify(p));
          syncProgressToCloud(window.Android?.getWalletAddress?.());
          setProgress(p);
          localStorage.removeItem('pending-purchase');
          window.dispatchEvent(new Event('progress-updated'));
        } catch (e) {
          console.error('Failed to process pending purchase:', e);
        }
      }
    };

    window.__onNativeTxError = (error: string) => {
      console.error('Transaction error:', error);
      localStorage.removeItem('pending-purchase');
    };

    window.handleAndroidBack = () => {
      if (screen === 'playing') {
        window.onGameBack ? window.onGameBack() : handleMenu('play');
      } else if (screen === 'gameOver') {
        handleMenu('play');
      }
    };
    return () => {
      window.handleAndroidBack = undefined;
      window.__onNativeTxSuccess = undefined;
      window.__onNativeTxError = undefined;
    };
  }, [screen, handleMenu]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full mx-auto max-w-full sm:max-w-md md:max-w-full transition-all duration-500 overflow-hidden">
        {screen === 'menu' && (
          <MainMenu onStart={handleStart} initialTab={initialMenuTab} hasPass={hasPass || progress.hasPremiumAccess} onRequestMint={() => setShowMintOverlay(true)} />
        )}
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
            {!(hasPass || progress.hasPremiumAccess) && trialTime > 0 && <TrialTimer seconds={trialTime} />}
          </>
        )}

        {(isLocked || showMintOverlay) && <MintOverlay onSuccess={handleMintSuccess} />}
      </div>
    </div>
  );
};

export default Game;