import { useEffect, useRef, useState, useCallback } from 'react';
import {
  type GameState, type GameMode, type FlyingToken, type SlicedHalf, type Particle, type SlicePoint,
  createGameState, updateGameState, checkSlice,
} from '@/lib/gameEngine';
import { getSkinById, type BladeSkin } from '@/lib/bladeSkins';
import { getThemeById, type BoardTheme } from '@/lib/boardThemes';
import { loadProgress } from '@/lib/storage';
import { playSlice, playCombo, playBomb, playGameOver, isMuted, toggleMute } from '@/lib/soundEngine';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw } from 'lucide-react';

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
}

interface HudState {
  score: number;
  lives: number;
  combo: number;
  comboText: string;
  timeLeft?: number;
}

const GameCanvas = ({ mode, onGameOver, onRestart, onExit, forcePaused = false }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createGameState(mode));
  const isSwipingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const gameOverCalledRef = useRef(false);
  const bladeSkinRef = useRef<BladeSkin>(getSkinById(loadProgress().selectedBlade));
  const boardThemeRef = useRef<BoardTheme>(getThemeById(loadProgress().selectedBoard));
  const juiceRef = useRef({ zoom: 1, timeScale: 1, flow: 0 });
  const [hud, setHud] = useState<HudState>({
    score: 0,
    lives: mode === 'zen' ? 999 : 3,
    combo: 0,
    comboText: '',
    timeLeft: mode === 'zen' ? 90 : undefined,
  });
  const [muted, setMuted] = useState(isMuted());
  const [paused, setPaused] = useState(false);

  // Canvas setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;

    // Use parent container dimensions instead of window to support aspect ratio scaling
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    sizeRef.current = { width: w, height: h };
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
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isSwipingRef.current) return;
      const { x, y } = getLocalCoords(clientX, clientY);
      const trail = stateRef.current.bladeTrail;
      if (trail.length > 0) {
        const last = trail[trail.length - 1];
        checkSlice(stateRef.current, last.x, last.y, x, y);
      }
      trail.push({ x, y, time: Date.now() });
      const now = Date.now();
      while (trail.length > 0 && now - trail[0].time > 150) trail.shift();
    };

    const handleEnd = () => {
      isSwipingRef.current = false;
      stateRef.current.bladeTrail = [];
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

  // Game loop
  useEffect(() => {
    if (paused || forcePaused) {
      lastTimeRef.current = 0;
      return;
    }

    let rafId: number;

    const loop = (time: number) => {
      const dt = lastTimeRef.current
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05)
        : 0.016;
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId = requestAnimationFrame(loop); return; }

      const { width, height } = sizeRef.current;
      if (width === 0) { rafId = requestAnimationFrame(loop); return; }

      const state = stateRef.current;
      const dpr = window.devicePixelRatio || 1;

      // Update game & juice
      // Update juice (Enhanced Game Juice)
      const targetZoom = state.combo >= 10 ? 1.08 : state.combo >= 5 ? 1.04 : 1;
      const targetTimeScale = state.combo >= 15 ? 0.6 : state.combo >= 10 ? 0.75 : state.combo >= 5 ? 0.9 : 1;
      const targetFlow = state.combo >= 5 ? 1 : 0;

      juiceRef.current.zoom += (targetZoom - juiceRef.current.zoom) * (dt * 5);
      juiceRef.current.timeScale += (targetTimeScale - juiceRef.current.timeScale) * (dt * 5);
      juiceRef.current.flow += (targetFlow - juiceRef.current.flow) * (dt * 3);

      const effectiveDt = dt * juiceRef.current.timeScale;
      updateGameState(state, effectiveDt, width, height);

      // Render
      const zoom = juiceRef.current.zoom;
      // Calculate center-point zoom transform
      ctx.setTransform(
        dpr * zoom, 0, 0, dpr * zoom,
        (1 - zoom) * width * dpr / 2,
        (1 - zoom) * height * dpr / 2
      );
      ctx.clearRect(0, 0, width, height);

      // Apply Screen Shake to the root container
      if (containerRef.current && state.shakeAmount > 0) {
        const sx = (Math.random() - 0.5) * state.shakeAmount * 1.5;
        const sy = (Math.random() - 0.5) * state.shakeAmount * 1.5;
        containerRef.current.style.transform = `translate(${sx}px, ${sy}px)`;
      } else if (containerRef.current) {
        containerRef.current.style.transform = 'none';
      }

      renderGame(ctx, state, bladeSkinRef.current);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Sync HUD
      setHud(prev => {
        if (
          prev.score !== state.score ||
          prev.lives !== state.lives ||
          prev.combo !== state.combo ||
          prev.comboText !== state.comboText ||
          prev.timeLeft !== state.timeLeft
        ) {
          return {
            score: state.score,
            lives: state.lives,
            combo: state.combo,
            comboText: state.comboText,
            timeLeft: state.timeLeft,
          };
        }
        return prev;
      });

      // Drain sound queue
      for (const event of state.soundQueue) {
        switch (event.type) {
          case 'slice': playSlice(); break;
          case 'combo': playCombo(event.combo); break;
          case 'bomb': playBomb(); break;
          case 'gameOver': playGameOver(); break;
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
      <div className="absolute inset-0 z-0 select-none pointer-events-none transition-opacity duration-1000" style={{
        backgroundImage: `url(${boardThemeRef.current.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.45,
        mixBlendMode: 'screen', // Makes the texture blend naturally with the color
      }} />

      {/* Premium Radial Accent - Uses the theme's core color to create a localized glow */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 50% 50%, ${boardThemeRef.current.background}44 0%, transparent 70%)`,
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
        {hud.combo >= 10 && (
          <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
        )}
      </div>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="glass-panel rounded-2xl px-4 py-3">
          <div className="text-3xl sm:text-5xl font-display font-bold"
            style={{
              background: 'var(--gradient-score)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            {hud.score}
          </div>
          <div className="text-[10px] sm:text-xs tracking-[0.3em] font-display mt-1 text-muted-foreground">
            SCORE
          </div>
        </div>
        <div className="flex items-start gap-2">
          {mode !== 'zen' && (
            <div className="glass-panel rounded-2xl px-3 py-2 flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${i < hud.lives
                    ? 'text-foreground'
                    : 'text-muted-foreground/30'
                    }`}
                  style={i < hud.lives ? {
                    background: 'hsla(0, 85%, 55%, 0.8)',
                    boxShadow: '0 0 12px hsla(0, 85%, 55%, 0.5)',
                  } : {
                    background: 'hsla(0, 0%, 100%, 0.05)',
                  }}
                >
                  ♥
                </div>
              ))}
            </div>
          )}
          {/* Zen Mode Timer Display */}
          {mode === 'zen' && hud.timeLeft !== undefined && (
            <div className="glass-panel rounded-2xl px-4 py-2 flex flex-col items-center min-w-[100px] border-cyan-500/30">
              <div className={`text-2xl sm:text-3xl font-display font-bold tabular-nums ${hud.timeLeft < 10 ? 'animate-pulse text-red-500' : 'text-cyan-400'}`}>
                {Math.ceil(hud.timeLeft)}s
              </div>
              <div className="text-[10px] sm:text-[11px] tracking-[0.2em] font-display text-cyan-400/60 uppercase">
                TIME REMAINING
              </div>
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
      {hud.combo >= 3 && hud.comboText && (
        <div
          className="absolute top-[22%] left-1/2 -translate-x-1/2 pointer-events-none z-10 text-center"
          key={hud.combo}
        >
          <div className="text-5xl sm:text-7xl font-display font-black animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--neon-amber)), hsl(var(--neon-pink)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px hsla(38,100%,60%,0.7))',
            }}>
            {hud.combo}x
          </div>
        </div>
      )}

    </div >
  );
};

// ===== RENDERING =====

function renderGame(ctx: CanvasRenderingContext2D, state: GameState, skin: BladeSkin): void {
  drawBladeTrail(ctx, state.bladeTrail, skin);

  for (const token of state.tokens) {
    if (token.sliced) continue;
    if (token.isBomb) {
      drawBomb(ctx, token);
    } else {
      drawToken(ctx, token);
    }
  }

  for (const half of state.slicedHalves) {
    drawSlicedHalf(ctx, half);
  }

  drawParticles(ctx, state.particles);
}

function drawToken(ctx: CanvasRenderingContext2D, token: FlyingToken): void {
  ctx.save();
  ctx.translate(token.x, token.y);
  ctx.rotate(token.rotation);

  const r = token.radius;
  const color = token.tokenData.color;
  const img = getTokenImage(token.tokenData.id);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    const s = r * 2.1;
    ctx.drawImage(img, -s / 2, -s / 2, s, s);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

  } else {
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

function drawBladeTrail(ctx: CanvasRenderingContext2D, trail: SlicePoint[], skin: BladeSkin): void {
  if (trail.length < 2) return;
  const now = Date.now();
  const maxAge = 180;

  for (let i = 1; i < trail.length; i++) {
    const p1 = trail[i - 1];
    const p2 = trail[i];
    const age = now - p2.time;
    if (age > maxAge) continue;

    const life = 1 - age / maxAge;
    const taper = (i / trail.length);
    const w = life * taper * 12 + 1;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    ctx.shadowBlur = w * 2;
    ctx.shadowColor = skin.trail.glow.replace('{a}', '0.5');
    ctx.strokeStyle = skin.trail.outer.replace('{a}', String(life * 0.3));
    ctx.lineWidth = w * 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = skin.trail.glow.replace('{a}', String(life * 0.8));
    ctx.lineWidth = w;
    ctx.stroke();

    // Removed the white "1 inch line" core from the trail for a juicier, glowier look
    // ctx.strokeStyle = skin.trail.core.replace('{a}', String(life * 0.9));
    // ctx.lineWidth = w * 0.3;
    // ctx.stroke();

    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const t = 1 - (p.life / p.maxLife);
    const easeOutQuad = (v: number) => 1 - (1 - v) * (1 - v);
    const alpha = Math.max(0, 1 - easeOutQuad(t));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

export default GameCanvas;
