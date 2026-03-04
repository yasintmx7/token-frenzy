import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  type GameState, type GameMode, type FlyingToken, type SlicedHalf, type Particle, type SlicePoint,
  createGameState, updateGameState, checkSlice, SINGULARITY_RADIUS, activatePowerUp
} from '@/lib/gameEngine';
import { TOKENS } from '@/lib/tokens';
import { getSkinById, type BladeSkin } from '@/lib/bladeSkins';
import { getThemeById, type BoardTheme } from '@/lib/boardThemes';
import { loadProgress, usePowerUp } from '@/lib/storage';
import { playSlice, playCombo, playBomb, playGameOver, playZenCollapse, isMuted, toggleMute } from '@/lib/soundEngine';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw, Sparkles, Sword } from 'lucide-react';

// ===== IMAGE CACHE =====
const imageCache = new Map<string, HTMLImageElement | null>();

function getTokenImage(coingeckoId: string): HTMLImageElement | null {
  const cached = imageCache.get(coingeckoId);
  if (cached !== undefined) return cached;
  imageCache.set(coingeckoId, null);

  const cdns = [
    `https://cdn.jsdelivr.net/gh/simplr-sh/coin-logos/images/${coingeckoId}/large.png`,
    `https://cdn.jsdelivr.net/gh/ErikThiworworking/cryptocurrency-icons@master/128/color/${coingeckoId}.png`,
  ];

  let loaded = false;
  for (const url of cdns) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!loaded) {
        loaded = true;
        imageCache.set(coingeckoId, img);
      }
    };
    img.onerror = () => { };
    img.src = url;
  }
  return null;
}

// ===== COMPONENT =====
interface GameCanvasProps {
  mode: GameMode;
  onGameOver: (stats: { score: number; tokensSliced: number; bestCombo: number; mode: GameMode }) => void;
  onRestart: () => void;
  onExit: () => void;
  forcePaused?: boolean;
  initialStats?: { score: number; tokensSliced: number; bestCombo: number };
  settings: any;
}

interface HudState {
  score: number;
  lives: number;
  combo: number;
  comboText: string;
  timeLeft?: number;
}

const GameCanvas = ({ mode, onGameOver, onRestart, onExit, forcePaused = false, initialStats, settings }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize state with potential initialStats for Revive logic
  const initialState = useMemo(() => {
    const s = createGameState(mode);
    if (initialStats) {
      s.score = initialStats.score;
      s.tokensSliced = initialStats.tokensSliced;
      s.bestCombo = initialStats.bestCombo;
      s.lives = 1; // Give 1 life on revive
    }
    return s;
  }, [mode, initialStats]);

  const stateRef = useRef<GameState>(initialState);
  const isSwipingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const gameOverCalledRef = useRef(false);
  const bladeSkinRef = useRef<BladeSkin>(getSkinById(loadProgress().selectedBlade));
  const boardThemeRef = useRef<BoardTheme>(getThemeById(loadProgress().selectedBoard));
  const juiceRef = useRef({ zoom: 1, timeScale: 1, flow: 0 });
  const scoreRef = useRef<HTMLDivElement>(null);
  const livesRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timerRef = useRef<HTMLDivElement>(null);
  const comboWrapperRef = useRef<HTMLDivElement>(null);
  const comboValueRef = useRef<HTMLDivElement>(null);
  const comboPulseRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const bgAccentRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<any>(null); // For Singularity activation

  const perfData = useRef({ lastTime: 0, drops: 0, frameCount: 0, fps: 60, isLagging: false });
  const recentFrames = useRef<number[]>([]);
  // Cache ctx to avoid calling getContext every frame
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  // Cache bgAccent string to avoid string rebuilding every frame
  const bgAccentCacheRef = useRef('');
  // Snapshot progress at game start — avoids localStorage reads every frame
  const progressSnapshotRef = useRef(loadProgress());

  const [showPerf, setShowPerf] = useState(false);
  const [muted, setMuted] = useState(isMuted());
  const [paused, setPaused] = useState(false);
  const swipeVelocityRef = useRef(0);

  // Haptic support (Moved to component level for access by PowerUpHud)
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!settings?.hapticsEnabled) return;
    try {
      if (window.Android && (window.Android as any).vibrate) {
        (window.Android as any).vibrate(type === 'heavy' ? 50 : type === 'medium' ? 30 : 15);
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'heavy' ? 50 : type === 'medium' ? 30 : 15);
      }
    } catch (e) { /* ignore */ }
  };
  const lastUpdateRef = useRef(Date.now());

  // Canvas setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    sizeRef.current = { width: w, height: h };
    // Cache ctx on resize too
    ctxRef.current = canvas.getContext('2d');
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  // Input handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getLocalCoords = (clientX: number, clientY: number) => {
      if (!canvas) return { x: clientX, y: clientY };
      const rect = canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;

      // Adjust for juice zoom
      const { width, height } = sizeRef.current;
      const zoom = juiceRef.current.zoom;

      // The transform in loop centers the zoom:
      // x' = (x - w/2) * zoom + w/2 => x = (x' - w/2) / zoom + w/2
      return {
        x: (rawX - width / 2) / zoom + width / 2,
        y: (rawY - height / 2) / zoom + height / 2,
      };
    };

    const handleStart = (clientX: number, clientY: number) => {
      const { x, y } = getLocalCoords(clientX, clientY);
      isSwipingRef.current = true;
      stateRef.current.bladeTrail = [{ x, y, time: Date.now() }];

      // Zen Mode: Start Long-press timer for Singularity
      if (stateRef.current.mode === 'zen') {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
          stateRef.current.singularity.active = true;
          stateRef.current.singularity.x = x;
          stateRef.current.singularity.y = y;
        }, 500);
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isSwipingRef.current) return;

      const { x, y } = getLocalCoords(clientX, clientY);
      const state = stateRef.current;

      // Update singularity position if active (Zen Mode)
      if (state.mode === 'zen' && state.singularity.active) {
        state.singularity.x = x;
        state.singularity.y = y;
      }

      const trail = state.bladeTrail;
      if (trail.length > 0) {
        const last = trail[trail.length - 1];

        // Cancel long-press if finger moves too much before activation
        if (state.mode === 'zen' && !state.singularity.active) {
          const dist = Math.hypot(x - last.x, y - last.y);
          if (dist > 30) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
        }

        // PROCESS SLICING IMMEDIATELY (Do not throttle for logic)
        checkSlice(state, last.x, last.y, x, y);

        // Calculate velocity for timewarp mode
        const dt_swipe = (Date.now() - last.time) / 1000;
        if (dt_swipe > 0) {
          const dist = Math.hypot(x - last.x, y - last.y);
          swipeVelocityRef.current = dist / dt_swipe;
        }
      }
      trail.push({ x, y, time: Date.now() });

      const now = Date.now();
      const trailLimit = state.mode === 'zen' ? 800 : 150;
      while (trail.length > 0 && now - trail[0].time > trailLimit) trail.shift();
    };

    const handleEnd = () => {
      isSwipingRef.current = false;
      stateRef.current.bladeTrail = [];

      // Clear singularity on release
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      stateRef.current.singularity.active = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (paused || forcePaused) return;
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (paused || forcePaused) return;
      handleMove(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (paused || forcePaused) return;
      e.preventDefault();
      const t = e.touches[0];
      handleStart(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (paused || forcePaused) return;
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Handle Android Native Back Button to trigger Pause instead of Exit
  useEffect(() => {
    window.onGameBack = () => {
      if (!paused) {
        setPaused(true);
      } else {
        // If already paused, the next back press exits to menu
        onExit();
      }
    };

    return () => {
      window.onGameBack = undefined;
    };
  }, [paused, onExit]);

  // Game loop
  useEffect(() => {
    if (paused || forcePaused) {
      lastTimeRef.current = 0;
      return;
    }

    let rafId: number;

    const loop = (time: number) => {
      let dt = 0.016;
      if (lastTimeRef.current) {
        dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      }

      const frameMs = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (frameMs > 25 && perfData.current.frameCount > 10) perfData.current.drops++; // Log dropped frames
      recentFrames.current.push(frameMs);
      if (recentFrames.current.length > 30) recentFrames.current.shift();
      perfData.current.frameCount++;

      if (perfData.current.frameCount % 15 === 0) {
        const avgMs = recentFrames.current.reduce((a, b) => a + b, 0) / recentFrames.current.length;
        perfData.current.fps = 1000 / (avgMs || 16.6);
        perfData.current.isLagging = perfData.current.fps < 45;
        if (fpsRef.current) {
          fpsRef.current.innerText = `FPS: ${Math.round(perfData.current.fps)} | Drop: ${perfData.current.drops}`;
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(loop); return; }
      // Use cached ctx — avoid calling getContext every frame
      const ctx = ctxRef.current || canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(loop); return; }

      const { width, height } = sizeRef.current;
      if (width === 0) { rafId = requestAnimationFrame(loop); return; }

      const state = stateRef.current;
      const dpr = window.devicePixelRatio || 1;

      // Update game & juice
      // Update juice (Enhanced Game Juice)
      const targetZoom = state.combo >= 10 ? 1.08 : state.combo >= 5 ? 1.04 : 1;
      let targetTimeScale = state.combo >= 15 ? 0.6 : state.combo >= 10 ? 0.75 : state.combo >= 5 ? 0.9 : 1;
      const targetFlow = state.combo >= 5 ? 1 : 0;

      // Removed 'timewarp' time scaling. Split mode runs at normal speed.
      juiceRef.current.zoom += (targetZoom - juiceRef.current.zoom) * (dt * 5);
      juiceRef.current.timeScale += (targetTimeScale - juiceRef.current.timeScale) * (dt * 5);
      juiceRef.current.flow += (targetFlow - juiceRef.current.flow) * (dt * 3);

      const effectiveDt = dt * juiceRef.current.timeScale;
      state.isLagging = perfData.current.isLagging;
      updateGameState(state, effectiveDt, width, height);

      // Render
      const zoom = juiceRef.current.zoom;

      // Fast clear before transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply zoom and DPI scaling in one go
      ctx.scale(dpr * zoom, dpr * zoom);
      ctx.translate(
        (1 - zoom) * width / (2 * zoom),
        (1 - zoom) * height / (2 * zoom)
      );

      // Apply Screen Shake to the root container (keeps the canvas itself clean)
      if (containerRef.current) {
        if (state.shakeAmount > 0) {
          const sx = (Math.random() - 0.5) * state.shakeAmount * 1.5;
          const sy = (Math.random() - 0.5) * state.shakeAmount * 1.5;
          containerRef.current.style.transform = `translate(${sx}px, ${sy}px)`;
        } else if (containerRef.current.style.transform !== 'none') {
          containerRef.current.style.transform = 'none';
        }
      }

      renderGame(ctx, state, bladeSkinRef.current);

      // Reset transform so subsequent frames don't break
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Zero UI Overhead: Direct DOM updates
      if (scoreRef.current && scoreRef.current.innerText !== state.score.toString()) {
        scoreRef.current.innerText = state.score.toString();
      }

      if (state.mode !== 'zen' && state.lives >= 0) {
        livesRefs.current.forEach((ref, i) => {
          if (!ref) return;
          const active = i < state.lives;
          if (active) {
            ref.style.color = 'hsl(var(--foreground))';
            ref.style.background = 'hsla(0, 85%, 55%, 0.8)';
            ref.style.boxShadow = '0 0 12px hsla(0, 85%, 55%, 0.5)';
          } else {
            ref.style.color = 'hsla(var(--muted-foreground), 0.3)';
            ref.style.background = 'hsla(0, 0%, 100%, 0.05)';
            ref.style.boxShadow = 'none';
          }
        });
      }



      if (timerRef.current && state.timeLeft !== undefined) {
        const tStr = Math.ceil(state.timeLeft) + 's';
        if (timerRef.current.innerText !== tStr) {
          timerRef.current.innerText = tStr;
          if (state.timeLeft < 10) {
            timerRef.current.classList.add('animate-pulse', 'text-red-500');
            timerRef.current.classList.remove('text-cyan-400');
          } else {
            timerRef.current.classList.remove('animate-pulse', 'text-red-500');
            timerRef.current.classList.add('text-cyan-400');
          }
        }
      }

      if (comboPulseRef.current) {
        if (state.combo >= 10) {
          comboPulseRef.current.style.display = 'block';
        } else {
          comboPulseRef.current.style.display = 'none';
        }
      }

      if (comboWrapperRef.current && comboValueRef.current) {
        if (state.combo >= 3 && state.comboText) {
          comboWrapperRef.current.style.display = 'block';
          const newText = state.combo + 'x';
          if (comboValueRef.current.innerText !== newText) {
            comboValueRef.current.innerText = newText;
            comboValueRef.current.classList.remove('animate-scale-in');
            void comboValueRef.current.offsetWidth;
            comboValueRef.current.classList.add('animate-scale-in');
          }
        } else {
          comboWrapperRef.current.style.display = 'none';
        }
      }

      // Update Theme Background — only rebuild string when theme changes
      if (bgAccentRef.current) {
        const newBg = `radial-gradient(circle at 50% 50%, ${boardThemeRef.current.background}55 0%, transparent 70%)`;
        if (bgAccentCacheRef.current !== newBg) {
          bgAccentCacheRef.current = newBg;
          bgAccentRef.current.style.background = newBg;
        }
      }

      // Drain sound queue
      for (const event of state.soundQueue) {
        switch (event.type) {
          case 'slice':
            playSlice();
            triggerHaptic('light');
            break;
          case 'combo':
            playCombo(event.combo);
            triggerHaptic('medium');
            break;
          case 'bomb':
            playBomb();
            triggerHaptic('heavy');
            break;
          case 'gameOver':
            playGameOver();
            break;
        }
      }
      state.soundQueue.length = 0;

      // Game over
      if (state.gameOver && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        setTimeout(() => {
          onGameOver({
            score: state.score,
            tokensSliced: state.tokensSliced,
            bestCombo: state.bestCombo,
            mode: state.mode,
          });
        }, 600);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [onGameOver, paused]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: '#000', // Deep black base for maximum contrast
        background: `radial-gradient(circle at center, ${boardThemeRef.current.background} 0%, #000 100%)`
      }}>

      {/* Background image / Skin Texture */}
      {boardThemeRef.current.backgroundImage && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none transition-opacity duration-1000" style={{
          backgroundImage: `url(${boardThemeRef.current.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.45,
          mixBlendMode: 'screen', // Makes the texture blend naturally with the color
        }} />
      )}

      {/* Premium Radial Accent - Uses the theme's core color to create a localized glow */}
      <div ref={bgAccentRef} className="absolute inset-0 z-0 pointer-events-none transition-colors duration-500" style={{
        background: `radial-gradient(circle at 50% 50%, ${boardThemeRef.current.background}55 0%, transparent 70%)`,
      }} />

      {/* Texture Noise Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Strategic Vignette for Depth */}
      <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.95)]" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1]"
        style={{ touchAction: 'none', cursor: 'crosshair' }}
      />

      {/* Flow State Overlay (Enhanced Game Juice) */}
      <div className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: juiceRef.current.flow * 0.4,
          background: 'radial-gradient(circle, transparent 40%, hsla(var(--neon-purple), 0.15) 100%)',
          boxShadow: 'inset 0 0 100px hsla(var(--neon-cyan), 0.2)',
        }}>
        <div ref={comboPulseRef} style={{ display: 'none' }} className="absolute inset-0 bg-white/[0.02] animate-pulse" />
      </div>



      {showPerf && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 text-[10px] sm:text-xs text-white bg-black/80 px-4 py-2 rounded-full font-mono font-bold select-none cursor-pointer" onClick={() => setShowPerf(false)}>
          <span ref={fpsRef}>FPS: -- | Drop: 0</span>
        </div>
      )}

      {/* Secret toggle zone for Perf HUD */}
      {!showPerf && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-20 h-10 cursor-pointer" onClick={() => setShowPerf(true)} />
      )}

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="glass-panel rounded-2xl px-4 py-3">
          <div ref={scoreRef} className="text-3xl sm:text-5xl font-display font-bold"
            style={{
              background: 'var(--gradient-score)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            0
          </div>
          <div className="text-[10px] sm:text-xs tracking-[0.3em] font-display mt-1 text-muted-foreground">
            SCORE
          </div>
        </div>

        {/* POWER-UP HUD */}
        <PowerUpHud
          progress={progressSnapshotRef.current}
          onActivate={(type) => {
            if (usePowerUp(type)) {
              activatePowerUp(stateRef.current, type);
              triggerHaptic('heavy');
            }
          }}
          midasActive={stateRef.current.powerUps.midasTouch.active}
          megaActive={stateRef.current.powerUps.megaBlade.active}
        />

        {/* Central Timer for Zen Mode */}
        {mode === 'zen' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 sm:top-6 pointer-events-none">
            <div className="glass-panel rounded-2xl px-6 py-2 flex flex-col items-center border-cyan-500/30">
              <div
                ref={timerRef}
                className="text-2xl sm:text-4xl font-display font-black text-cyan-400 tracking-tight"
                style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))' }}
              >
                90s
              </div>
              <div className="text-[9px] tracking-[0.3em] font-black text-cyan-500/60 uppercase -mt-0.5">
                TIME LEFT
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2">
          {mode !== 'zen' && (
            <div className="glass-panel rounded-2xl px-3 py-2 flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  ref={(el) => { livesRefs.current[i] = el; }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 text-foreground"
                  style={{
                    background: 'hsla(0, 85%, 55%, 0.8)',
                    boxShadow: '0 0 12px hsla(0, 85%, 55%, 0.5)',
                  }}
                >
                  ♥
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setMuted(toggleMute())}
            className="pointer-events-auto glass-panel w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPaused(true)}
            className="pointer-events-auto glass-panel w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95"
            style={{ boxShadow: '0 0 15px rgba(0,0,0,0.2)' }}
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Pause Menu */}
      {paused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel p-8 sm:p-12 rounded-[2rem] text-center max-w-sm w-full mx-4 shadow-2xl border-white/20">
            <h2 className="text-4xl sm:text-5xl font-display font-black mb-8 neon-text-amber">PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setPaused(false)}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              >
                <Play className="w-5 h-5 fill-current" />
                RESUME
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  onRestart();
                }}
                className="w-full py-4 glass-panel rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                RESTART
              </button>
              <button
                onClick={() => {
                  setPaused(false);
                  onExit();
                }}
                className="w-full py-4 glass-panel rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-red-500/80 hover:text-red-500"
              >
                <Home className="w-5 h-5" />
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combo popup */}
      <div
        ref={comboWrapperRef}
        style={{ display: 'none' }}
        className="absolute top-[22%] left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center"
      >
        <div ref={comboValueRef} className="text-5xl sm:text-7xl font-display font-black"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--neon-amber)), hsl(var(--neon-pink)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px hsla(38,100%,60%,0.7))',
          }}>
          3x
        </div>
      </div>

    </div >
  );
};

// ===== RENDERING =====

function renderGame(ctx: CanvasRenderingContext2D, state: GameState, skin: BladeSkin): void {

  // Draw board theme layer
  // ...

  drawSingularity(ctx, state.singularity);
  if (state.mode === 'void' && state.blackHole) drawBlackHole(ctx, state.blackHole);
  if (state.mode === 'laser' && state.lasers) drawLasers(ctx, state.lasers, state.elapsed);

  drawParticles(ctx, state.particles);

  for (const token of state.tokens) {
    if (token.sliced) continue; // Skip tokens that are already sliced
    if (!token.isBomb) drawToken(ctx, token, state);
    else drawBomb(ctx, token);
  }

  for (const half of state.slicedHalves) {
    drawSlicedHalf(ctx, half);
  }

  drawBladeTrail(ctx, state.bladeTrail, skin, state);
}

function drawToken(ctx: CanvasRenderingContext2D, token: FlyingToken, state: GameState): void {
  ctx.save();
  ctx.translate(token.x, token.y);
  ctx.rotate(token.rotation);

  // BRAIN GAME: NEW PHANTOM (void) Alpha
  if (state.mode === 'void' && !token.isBomb) {
    // Fades out completely as it loses vertical velocity. Invisible on the way down.
    ctx.globalAlpha = Math.max(0, Math.min(1, (token.vy + 100) / -300));
  }

  const r = token.radius;
  const color = token.tokenData.color;
  const img = getTokenImage(token.tokenData.id);

  if (img && img.complete && img.naturalWidth > 0) {
    // 1. Draw Glow/Aura BEFORE clipping
    const frame = state.selectedTokenFrame;
    const time = Date.now() / 1000;

    if (frame.id !== 'default') {
      let glowColor = frame.glowColor;

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = token.isGolden ? 35 : 20; // Extra juice for natural gold
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = `${frame.glowColor}${Math.floor(frame.auraOpacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Custom Glitch Artifacts for Glitch Nexus
      if (frame.id === 'glitch-nexus') {
        const glitchColors = ['#00ffff', '#ff00ff', '#ffff00', '#ffffff'];

        // 1. Digital shards/blocks
        for (let i = 0; i < 12; i++) {
          const angle = (time * 2 + i * (Math.PI / 6)) % (Math.PI * 2);
          const dist = r * (0.8 + Math.random() * 0.5);
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          const w = 4 + Math.random() * 8;
          const h = 8 + Math.random() * 15;
          ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
          ctx.globalAlpha = 0.6 + Math.sin(time * 10 + i) * 0.3;
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
        }

        // 2. Glitchy connections (User requested to keep this only for glitch frame)
        // We find nearby tokens and draw jagged links
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        state.tokens.forEach(other => {
          if (other === token || other.sliced) return;
          const dist = Math.hypot(token.x - other.x, token.y - other.y);
          if (dist < 300) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Jagged line behavior
            const dx = (other.x - token.x);
            const dy = (other.y - token.y);
            ctx.lineTo(dx * 0.3, dy * 0.3 + (Math.random() - 0.5) * 40);
            ctx.lineTo(dx * 0.6, dy * 0.6 + (Math.random() - 0.5) * 40);
            ctx.lineTo(dx, dy);
            ctx.stroke();
          }
        });

        ctx.globalAlpha = 1.0;
      }

      // 3. Energy Nova (Image 1 style)
      if (frame.id === 'energy-nova') {
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 25;
        for (let i = 0; i < 15; i++) {
          const a = (time * 3 + i * 2) % (Math.PI * 2);
          const d = r * (0.9 + Math.sin(time * 5 + i) * 0.2);
          const px = Math.cos(a) * d;
          const py = Math.sin(a) * d;
          ctx.beginPath();
          ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ffffff';
          ctx.arc(px, py, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Void Vortex (Image 2 style)
      if (frame.id === 'void-vortex') {
        ctx.save();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const startAngle = time * 2 + i * (Math.PI / 3);
          ctx.beginPath();
          // Spiral arc
          for (let step = 0; step < 20; step++) {
            const angle = startAngle + step * 0.1;
            const dist = r * (1 + step * 0.05);
            ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
          }
          ctx.globalAlpha = 0.5 - (i * 0.05);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Plasma Saw (Image 3 style)
      if (frame.id === 'plasma-saw') {
        ctx.save();
        ctx.rotate(time * 10);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        for (let i = 0; i < 6; i++) {
          const angle = i * (Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          ctx.lineTo(Math.cos(angle + 0.2) * r * 1.4, Math.sin(angle + 0.2) * r * 1.4);
          ctx.lineTo(Math.cos(angle + 0.4) * r, Math.sin(angle + 0.4) * r);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Radar Pulse (Image 4 style)
      if (frame.id === 'radar-pulse') {
        ctx.save();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        // Concentric rings
        for (let i = 1; i <= 3; i++) {
          const pulseR = r * (1 + (time * i) % 0.5);
          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.globalAlpha = 1 - ((time * i) % 0.5) * 2;
          ctx.stroke();
        }
        // Scan line
        ctx.rotate(time * 4);
        const scanGrad = ctx.createLinearGradient(0, 0, r * 1.5, 0);
        scanGrad.addColorStop(0, 'rgba(220, 38, 38, 0.8)');
        scanGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r * 1.5, -0.2, 0.2, false);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.restore();
      }

      // 7. Stardust Burst (Bursting trails)
      if (frame.id === 'stardust-burst') {
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        for (let i = 0; i < 16; i++) {
          const angle = (time * 1.5 + i * (Math.PI / 8));
          const offset = Math.sin(time * 8 + i) * 10;
          ctx.beginPath();
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);

          // Radiating trail
          const length = r * (0.8 + Math.sin(time * 12 + i) * 0.4);
          const tx = Math.cos(angle) * (r + length);
          const ty = Math.sin(angle) * (r + length);

          // Jagged/Organic curve
          ctx.quadraticCurveTo(
            Math.cos(angle + 0.1) * (r + length * 0.5) + offset,
            Math.sin(angle + 0.1) * (r + length * 0.5) + offset,
            tx, ty
          );

          ctx.globalAlpha = 0.4 + Math.random() * 0.6;
          ctx.stroke();

          // Bright tip
          ctx.beginPath();
          ctx.arc(tx, ty, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Nebula Spiral (Image 1 style - TIGHTER)
      if (frame.id === 'nebula-spiral') {
        ctx.save();
        ctx.shadowColor = '#f0abfc';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          const startAngle = time * 3 + i * (Math.PI / 2);
          ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#f0abfc';
          ctx.beginPath();
          for (let step = 0; step < 22; step++) { // Even tighter
            const angle = startAngle + step * 0.14;
            const dist = r * (0.8 + step * 0.035); // 1.5r max
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            if (step === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.globalAlpha = 0.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 9. Titan Guard (Premium Cosmic Frame)
      if (frame.id === 'titan-guard') {
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        const shieldCount = 4;
        for (let i = 0; i < shieldCount; i++) {
          const angle = time * 2.5 + (i * Math.PI * 2 / shieldCount);
          const dist = r * 1.35;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Shield Pod
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-5, -12);
          ctx.lineTo(8, 0);
          ctx.lineTo(-5, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Energy Flare
          ctx.beginPath();
          ctx.globalAlpha = 0.4;
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fillStyle = '#fde68a';
          ctx.fill();
          ctx.restore();

          // Connective energy arc between pods
          const nextAngle = time * 2.5 + ((i + 1) * Math.PI * 2 / shieldCount);
          ctx.beginPath();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.3 + Math.sin(time * 10 + i) * 0.2;
          ctx.arc(0, 0, dist, angle, nextAngle);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 10. Hypnotic Vortex (User Image 3 style)
      if (frame.id === 'hypnotic-vortex') {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        for (let i = 0; i < 5; i++) {
          const startAngle = time * 3 + i * (Math.PI * 2 / 5);
          ctx.beginPath();
          ctx.lineWidth = 20;
          ctx.lineCap = 'butt';

          const grad = ctx.createLinearGradient(-r, 0, r, 0);
          grad.addColorStop(0, '#000000');
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, '#000000');
          ctx.strokeStyle = grad;

          for (let step = 0; step < 25; step++) { // Halved steps
            const angle = startAngle + step * 0.18;
            const wave = Math.sin(step * 0.5 + time * 10) * 5;
            const dist = r * (0.8 + step * 0.04) + wave; // Expansion reduced to 0.04 (Max ~1.8r)
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            if (step === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.globalAlpha = 0.7;
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (token.isGolden) {
      // Fallback for natural golden tokens if no frame equipped
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 2. Draw the Image (Clipped)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    const s = r * 2.1;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();

    // 3. Optional Overlay Ring
    if (frame.id !== 'default') {
      let borderColor = frame.borderColor;
      if (frame.id === 'glitch-nexus') {
        // Fractured Ring
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          const start = i * (Math.PI / 4) + Math.sin(time * 5) * 0.2;
          const end = start + (Math.PI / 6);
          ctx.beginPath();
          ctx.arc(0, 0, r, start, end);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = frame.ringWidth;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

  } else {
    // FALLBACK
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const innerR = r * 0.88;
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    const faceGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    faceGrad.addColorStop(0, color);
    faceGrad.addColorStop(1, adjustColor(color, -60));

    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${innerR * 0.8}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(token.tokenData.symbol.substring(0, 1), 0, innerR * 0.1);
    if (token.tokenData.symbol.length > 3) ctx.font = `bold ${innerR * 0.5}px "Space Grotesk"`;
    ctx.fillText(token.tokenData.symbol, 0, 2);
    ctx.shadowColor = 'transparent';
  }


  ctx.restore();
}



function drawBomb(ctx: CanvasRenderingContext2D, token: FlyingToken): void {
  ctx.save();
  ctx.translate(token.x, token.y);
  ctx.rotate(token.rotation * 0.15);

  const r = token.radius;
  const time = Date.now() / 1000;

  const pulse = Math.sin(time * 10);
  const pulseSize = r * (1.2 + pulse * 0.1);
  const glowGrad = ctx.createRadialGradient(0, 0, r, 0, 0, pulseSize);
  glowGrad.addColorStop(0, 'rgba(255, 60, 0, 0.6)');
  glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

  ctx.beginPath();
  ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
  sphereGrad.addColorStop(0, '#555555');
  sphereGrad.addColorStop(0.2, '#2b2b2b');
  sphereGrad.addColorStop(1, '#080808');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.4 + i * 0.1), Math.random() * Math.PI, Math.random() * Math.PI + 1);
    ctx.stroke();
  }

  const sr = r * 0.45;
  ctx.save();
  ctx.rotate(Math.sin(time * 2) * 0.1);

  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.arc(0, -sr * 0.1, sr * 0.65, 0, Math.PI * 2);
  ctx.moveTo(-sr * 0.35, sr * 0.3);
  ctx.lineTo(-sr * 0.25, sr * 0.7);
  ctx.lineTo(sr * 0.25, sr * 0.7);
  ctx.lineTo(sr * 0.35, sr * 0.3);
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(-sr * 0.25, -sr * 0.1, sr * 0.18, sr * 0.22, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sr * 0.25, -sr * 0.1, sr * 0.18, sr * 0.22, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, sr * 0.1);
  ctx.lineTo(-sr * 0.1, sr * 0.3);
  ctx.lineTo(sr * 0.1, sr * 0.3);
  ctx.fill();

  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-sr * 0.15, sr * 0.45);
  ctx.lineTo(-sr * 0.15, sr * 0.65);
  ctx.moveTo(sr * 0.15, sr * 0.45);
  ctx.lineTo(sr * 0.15, sr * 0.65);
  ctx.moveTo(0, sr * 0.45);
  ctx.lineTo(0, sr * 0.65);
  ctx.stroke();
  ctx.restore();

  const capW = r * 0.4;
  const capH = r * 0.15;
  const capY = -r * 0.92;
  const capGrad = ctx.createLinearGradient(-capW / 2, 0, capW / 2, 0);
  capGrad.addColorStop(0, '#333');
  capGrad.addColorStop(0.5, '#888');
  capGrad.addColorStop(1, '#333');
  ctx.fillStyle = capGrad;
  ctx.fillRect(-capW / 2, capY, capW, capH);

  const fuseX = 0;
  const fuseY = capY;
  ctx.beginPath();
  ctx.moveTo(fuseX, fuseY);
  ctx.bezierCurveTo(r * 0.3, fuseY - r * 0.5, -r * 0.3, fuseY - r * 0.8, 0, fuseY - r * 1.2);
  ctx.strokeStyle = '#cda';
  ctx.lineWidth = 4;
  ctx.stroke();

  const sparkTipX = 0;
  const sparkTipY = fuseY - r * 1.2;
  const flicker = Math.random() * 0.4 + 0.8;
  const sparkGrad = ctx.createRadialGradient(sparkTipX, sparkTipY, 2, sparkTipX, sparkTipY, 25 * flicker);
  sparkGrad.addColorStop(0, '#FFF');
  sparkGrad.addColorStop(0.2, '#FFFF00');
  sparkGrad.addColorStop(0.5, '#FF4400');
  sparkGrad.addColorStop(1, 'transparent');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = sparkGrad;
  ctx.beginPath();
  ctx.arc(sparkTipX, sparkTipY, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.4, r * 0.2, r * 0.1, -0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function drawSlicedHalf(ctx: CanvasRenderingContext2D, half: SlicedHalf): void {
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const tSep = clamp(half.t / half.sepTime, 0, 1);
  const sep = easeOutCubic(tSep);
  const fadeT = clamp((half.t - half.fadeDelay) / (half.duration - half.fadeDelay), 0, 1);
  const alpha = 1 - easeOutQuad(fadeT);
  if (alpha <= 0) return;

  const offX = half.cutNormX * half.side * half.dist * sep;
  const offY = half.cutNormY * half.side * half.dist * sep;
  const rot = half.rotAmount * sep;
  const pop = 1 + 0.03 * (1 - clamp(half.t / 0.08, 0, 1));
  const r = half.radius;
  const cx = half.originX + offX;
  const cy = half.originY + offY;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(half.initialRotation + rot);

  // Apply requested slice hit pop effect (0.18s duration, peaking at 1.15x scale)
  const slicePop = half.t < 0.18
    ? 1 + Math.sin((half.t / 0.18) * Math.PI) * 0.15
    : 1;
  ctx.scale(pop * slicePop, pop * slicePop);

  clipHalfPlane(ctx, half.cutDirX, half.cutDirY, half.cutNormX, half.cutNormY, half.side);

  if (half.isBomb) {
    const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r);
    sphereGrad.addColorStop(0, '#555555');
    sphereGrad.addColorStop(0.2, '#2b2b2b');
    sphereGrad.addColorStop(1, '#080808');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    ctx.strokeStyle = '#FF3300';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();

    ctx.stroke();
  } else {
    const img = getTokenImage(half.tokenData.id);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      const s = r * 2.1;
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = half.tokenData.color;
      ctx.fill();

      const innerR = r * 0.88;
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();

      const faceGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
      faceGrad.addColorStop(0, half.tokenData.color);
      faceGrad.addColorStop(1, adjustColor(half.tokenData.color, -60));
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fillStyle = faceGrad;
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${innerR * 0.8}px "Space Grotesk"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(half.tokenData.symbol.substring(0, 1), 0, 0);
    }
  }

  // Removed the white "1 inch line" from the cut face for a juicier look
  ctx.restore();

  const flashAlpha = half.flash * alpha;
  if (flashAlpha > 0.01) {
    drawCutFlash(ctx, half.originX, half.originY, half.cutDirX, half.cutDirY, r, flashAlpha, half.isBomb);
  }
}

function clipHalfPlane(
  ctx: CanvasRenderingContext2D,
  vx: number, vy: number,
  nx: number, ny: number,
  sideSign: number,
): void {
  const L = 5000;
  const sx = nx * sideSign;
  const sy = ny * sideSign;
  const ax = -vx * L;
  const ay = -vy * L;
  const bx = vx * L;
  const by = vy * L;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + sx * L, by + sy * L);
  ctx.lineTo(ax + sx * L, ay + sy * L);
  ctx.closePath();
  ctx.clip();
}

function drawCutFlash(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  vx: number, vy: number,
  r: number, alpha: number,
  isBomb: boolean,
): void {
  // Visual hit flash disabled
  return;
}

function drawBladeTrail(ctx: CanvasRenderingContext2D, trail: SlicePoint[], skin: BladeSkin, state: GameState): void {
  if (trail.length < 2) return;
  const now = Date.now();
  const maxAge = 180;
  const megaMult = state.powerUps.megaBlade.active ? 2.5 : 1.0;

  // Batch outer glow pass — single path for all segments
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = skin.trail.glow.replace('{a}', '0.5');

  for (let i = 1; i < trail.length; i++) {
    const p2 = trail[i];
    const age = now - p2.time;
    if (age > maxAge) continue;
    const life = 1 - age / maxAge;
    const taper = i / trail.length;
    const w = (life * taper * 12 + 1) * megaMult;
    const p1 = trail[i - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.shadowBlur = w * 2;
    ctx.strokeStyle = skin.trail.outer.replace('{a}', String(life * 0.3));
    ctx.lineWidth = w * 2.5;
    ctx.stroke();
  }

  // Inner glow pass (no shadow needed)
  ctx.shadowBlur = 0;
  for (let i = 1; i < trail.length; i++) {
    const p2 = trail[i];
    const age = now - p2.time;
    if (age > maxAge) continue;
    const life = 1 - age / maxAge;
    const taper = i / trail.length;
    const w = (life * taper * 12 + 1) * megaMult;
    const p1 = trail[i - 1];

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = skin.trail.glow.replace('{a}', String(life * 0.8));
    ctx.lineWidth = w;
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  if (particles.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const p of particles) {
    const t = 1 - (p.life / p.maxLife);
    const easeOutQuad = (v: number) => 1 - (1 - v) * (1 - v);
    const alpha = Math.max(0, 1 - easeOutQuad(t));

    ctx.beginPath();
    ctx.globalAlpha = alpha;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  ctx.restore();
}

function drawSingularity(ctx: CanvasRenderingContext2D, s: { x: number, y: number, radius: number, active: boolean }) {
  if (!s.active) return;

  ctx.save();
  ctx.translate(s.x, s.y);

  // Outer glowing aura
  const grad = ctx.createRadialGradient(0, 0, s.radius * 0.5, 0, 0, SINGULARITY_RADIUS);
  grad.addColorStop(0, 'rgba(147, 51, 234, 0.4)'); // Purple core
  grad.addColorStop(0.6, 'rgba(49, 46, 129, 0.2)'); // Deep blue pulse
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fading

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, SINGULARITY_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // The Black Hole core
  ctx.shadowColor = 'rgba(147, 51, 234, 1)';
  ctx.shadowBlur = 25;

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
  ctx.fill();

  // Accretion disk (spinning dashed ring)
  const time = Date.now() / 1000;
  ctx.rotate(time * 3);
  ctx.strokeStyle = '#d8b4fe';
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, s.radius + 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawBlackHole(ctx: CanvasRenderingContext2D, bh: { x: number, y: number }) {
  ctx.save();
  ctx.translate(bh.x, bh.y);

  const time = Date.now() / 1000;
  const radius = 35 + Math.sin(time * 8) * 5;

  // Swirling void - multiple layers for deep effect
  ctx.rotate(time * -1.5);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = `hsla(280, 100%, 70%, ${0.08 + Math.sin(time + i) * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Event horizon glow
  const grad = ctx.createRadialGradient(0, 0, radius, 0, 0, 140);
  grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
  grad.addColorStop(0.2, 'rgba(147, 51, 234, 0.4)');
  grad.addColorStop(0.5, 'rgba(49, 46, 129, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.fill();

  // Singular center
  ctx.fillStyle = '#000000';
  ctx.shadowColor = '#9333ea';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawLasers(ctx: CanvasRenderingContext2D, lasers: any[], time: number) {
  ctx.save();
  for (const l of lasers) {
    const alpha = l.active ? (0.7 + Math.sin(time * 25) * 0.3) : 0.15;
    const color = l.type === 'danger' ? `hsla(0, 100%, 60%, ${alpha})` : `hsla(180, 100%, 65%, ${alpha})`;

    ctx.shadowBlur = l.active ? 25 : 0;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = l.active ? 5 : 1.5;

    ctx.beginPath();
    ctx.moveTo(0, l.y);
    ctx.lineTo(2500, l.y);
    ctx.stroke();

    if (l.active) {
      // Core white beam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function PowerUpHud({ progress, onActivate, midasActive, megaActive }: { progress: any, onActivate: (type: 'midas-touch' | 'mega-blade') => void, midasActive: boolean, megaActive: boolean }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[20] pointer-events-auto">
      {/* Mega Blade Button */}
      {progress.megaBlade > 0 && (
        <button
          onClick={() => onActivate('mega-blade')}
          disabled={megaActive}
          className={`group flex flex-col items-center gap-1.5 transition-all active:scale-90 ${megaActive ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-110'}`}
        >
          <div className="relative w-14 h-14 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/40 flex items-center justify-center overflow-hidden">
            <Sword className={`w-7 h-7 text-cyan-400 group-hover:animate-pulse ${megaActive ? '' : 'animate-bounce-subtle'}`} />
            {megaActive && <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />}
            <div className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[10px] font-black font-display rounded-full w-5 h-5 flex items-center justify-center border-2 border-black/50 shadow-lg">
              {progress.megaBlade}
            </div>
          </div>
          <span className="text-[9px] font-display font-black text-cyan-400 tracking-widest uppercase text-shadow-glow">MEGA BLADE</span>
        </button>
      )}

      {/* Midas Touch Button */}
      {progress.midasTouch > 0 && (
        <button
          onClick={() => onActivate('midas-touch')}
          disabled={midasActive}
          className={`group flex flex-col items-center gap-1.5 transition-all active:scale-90 ${midasActive ? 'opacity-40 grayscale pointer-events-none' : 'hover:scale-110'}`}
        >
          <div className="relative w-14 h-14 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/40 flex items-center justify-center overflow-hidden">
            <Sparkles className={`w-7 h-7 text-yellow-400 group-hover:animate-pulse ${midasActive ? '' : 'animate-bounce-subtle'}`} />
            {midasActive && <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />}
            <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-black font-display rounded-full w-5 h-5 flex items-center justify-center border-2 border-black/50 shadow-lg">
              {progress.midasTouch}
            </div>
          </div>
          <span className="text-[9px] font-display font-black text-yellow-400 tracking-widest uppercase text-shadow-glow">MIDAS TOUCH</span>
        </button>
      )}
    </div>
  );
}

export default GameCanvas;
