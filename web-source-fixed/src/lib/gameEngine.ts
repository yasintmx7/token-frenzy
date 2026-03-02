import { TOKENS, type TokenData } from './tokens';

export type GameMode = 'classic' | 'frustration' | 'zen';

export interface FlyingToken {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  tokenData: TokenData;
  points: number;
  sliced: boolean;
  isBomb: boolean;
  type: 'small' | 'medium' | 'large';
  isGolden?: boolean;
}

export interface SlicedHalf {
  id: number;
  originX: number;       // position at time of slice
  originY: number;
  radius: number;
  tokenData: TokenData;
  color: string;
  // Cut direction (unit vector along swipe)
  cutDirX: number;
  cutDirY: number;
  // Cut normal (unit vector perpendicular to swipe)
  cutNormX: number;
  cutNormY: number;
  side: 1 | -1;
  t: number;             // elapsed time
  duration: number;      // total effect duration
  sepTime: number;       // separation easing duration
  fadeDelay: number;     // when fade starts
  dist: number;          // max separation distance
  rotAmount: number;     // max rotation (radians)
  flash: number;         // flash intensity 0–1
  flashDur: number;      // flash decay time
  isBomb: boolean;
  initialRotation: number;
  img: null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}

export type SoundEvent =
  | { type: 'slice' }
  | { type: 'combo'; combo: number }
  | { type: 'bomb' }
  | { type: 'gameOver' }
  | { type: 'zenCollapse' };

// --- SINGULARITY CONSTANTS ---
export const SINGULARITY_RADIUS = 280; // Pull range
export const SINGULARITY_PULL = 800;   // Force
export const SINGULARITY_MAX_CHARGE = 100;

export interface GameState {
  tokens: FlyingToken[];
  slicedHalves: SlicedHalf[];
  particles: Particle[];
  bladeTrail: SlicePoint[];
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  tokensSliced: number;
  gameOver: boolean;
  mode: GameMode;
  shakeAmount: number;
  missedTokens: number;
  comboText: string;
  comboTextTimer: number;
  spawnTimer: number;
  nextId: number;
  elapsed: number;
  timeLeft?: number; // Optional countdown timer for Zen mode
  soundQueue: SoundEvent[];
  isLagging?: boolean;
  singularity: { x: number, y: number, active: boolean, charge: number, radius: number };
}

interface ModeConfig {
  lives: number;
  bombRate: number;
  spawnInterval: number;
  speedMult: number;
  batchMin: number;
  batchMax: number;
}

const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  classic: { lives: 3, bombRate: 0.10, spawnInterval: 1.4, speedMult: 0.45, batchMin: 1, batchMax: 3 },
  frustration: { lives: 3, bombRate: 0.15, spawnInterval: 0.9, speedMult: 0.60, batchMin: 2, batchMax: 4 },
  zen: { lives: 999, bombRate: 0, spawnInterval: 1.25, speedMult: 0.48, batchMin: 2, batchMax: 4 },
};

export function createGameState(mode: GameMode): GameState {
  const config = MODE_CONFIGS[mode];
  const state: GameState = {
    tokens: [],
    slicedHalves: [],
    particles: [],
    bladeTrail: [],
    score: 0,
    lives: config.lives,
    combo: 0,
    bestCombo: 0,
    tokensSliced: 0,
    gameOver: false,
    mode,
    shakeAmount: 0,
    missedTokens: 0,
    comboText: '',
    comboTextTimer: 0,
    spawnTimer: 0.6,
    nextId: 0,
    elapsed: 0,
    soundQueue: [],
    singularity: { x: 0, y: 0, active: false, charge: 0, radius: 0 },
  };

  if (mode === 'zen') {
    state.timeLeft = 90;
  }

  return state;
}

function isPointInPolygon(point: { x: number, y: number }, polygon: { x: number, y: number }[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function updateGameState(state: GameState, dt: number, w: number, h: number): void {
  if (state.gameOver) return;

  state.elapsed += dt;

  // Decay shake
  if (state.shakeAmount > 0) {
    state.shakeAmount *= Math.pow(0.01, dt);
    if (state.shakeAmount < 0.2) state.shakeAmount = 0;
  }

  // Combo text timer
  if (state.comboTextTimer > 0) state.comboTextTimer -= dt;

  // --- SINGULARITY UPDATE (Zen Only) ---
  if (state.mode === 'zen' && state.singularity.active) {
    const s = state.singularity;

    // Pulse animation
    s.radius = 40 + Math.sin(state.elapsed * 10) * 10;

    for (const token of state.tokens) {
      if (token.sliced) continue;

      const dx = s.x - token.x;
      const dy = s.y - token.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < SINGULARITY_RADIUS * SINGULARITY_RADIUS) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / SINGULARITY_RADIUS) * SINGULARITY_PULL;

        // Pull toward center
        token.vx += (dx / dist) * force * dt;
        token.vy += (dy / dist) * force * dt;

        // Add orbital motion (sideways force)
        const orbitX = -dy / dist;
        const orbitY = dx / dist;
        token.vx += orbitX * force * 0.4 * dt;
        token.vy += orbitY * force * 0.4 * dt;
      }
    }
  }

  // Timer logic for Zen Mode
  if (state.mode === 'zen' && state.timeLeft !== undefined) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.gameOver = true;
      state.soundQueue.push({ type: 'gameOver' });
    }
  }

  // Spawn
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnTokenBatch(state, w, h);
    const config = MODE_CONFIGS[state.mode];
    const difficultyMult = Math.max(0.5, 1 - state.elapsed / 150);
    const landscapeSpawnMult = w > h ? 0.92 : 1.0; // ~8% faster spawns in landscape
    state.spawnTimer = config.spawnInterval * difficultyMult * landscapeSpawnMult;
  }



  // Physics
  const gravity = h * 0.35;
  for (const token of state.tokens) {
    token.x += token.vx * dt;
    token.y += token.vy * dt;
    token.vy += gravity * dt;
    token.rotation += token.rotationSpeed * dt;
  }

  // Remove off-screen tokens — lose life for missed tokens in classic mode
  for (let i = state.tokens.length - 1; i >= 0; i--) {
    const token = state.tokens[i];
    if (token.y > h + 120 && token.vy > 0) {
      if (!token.sliced && !token.isBomb && state.mode !== 'zen' && state.mode !== 'frustration') {
        state.missedTokens++;
        state.combo = 0;
        state.comboText = '';
        state.lives--;
        state.shakeAmount = 1; // Greatly reduced shake for missed tokens
        if (state.lives <= 0) {
          state.gameOver = true;
          state.soundQueue.push({ type: 'gameOver' });
        }
      }
      state.tokens.splice(i, 1);
    }
  }

  // Update particles
  for (const p of state.particles) {
    const drag = Math.pow(0.01, dt);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter(p => p.life > 0);

  // Update sliced halves
  for (const half of state.slicedHalves) {
    half.t += dt;
    half.flash = Math.max(0, 1 - (half.t / half.flashDur));
  }
  state.slicedHalves = state.slicedHalves.filter(half => half.t < half.duration);
}

function spawnTokenBatch(state: GameState, w: number, h: number): void {
  const config = MODE_CONFIGS[state.mode];
  const count = randomInt(config.batchMin, config.batchMax);

  for (let i = 0; i < count; i++) {
    const isBomb = Math.random() < config.bombRate;
    const tokenData = TOKENS[Math.floor(Math.random() * TOKENS.length)];

    let type: 'small' | 'medium' | 'large';
    let radius: number;
    let points: number;

    const typeRoll = Math.random();
    if (typeRoll < 0.25) {
      type = 'small';
      radius = Math.max(26, Math.min(w * 0.065, 40));
      points = 15;
    } else if (typeRoll < 0.75) {
      type = 'medium';
      radius = Math.max(34, Math.min(w * 0.09, 52));
      points = 10;
    } else {
      type = 'large';
      radius = Math.max(42, Math.min(w * 0.12, 65));
      points = 20;
    }

    if (isBomb) {
      radius = Math.max(20, Math.min(w * 0.05, 30));
    }

    const spawnX = w * (0.1 + Math.random() * 0.8);
    const spawnY = h + radius * 2;

    // 15% faster speed in landscape
    const speedMult = config.speedMult * (w > h ? 1.15 : 1.0);
    const launchHeight = isBomb ? (1.3 + Math.random() * 0.2) : (1.8 + Math.random() * 0.3);
    const vy = -(h * launchHeight) * speedMult;
    const centerBias = (w / 2 - spawnX) * 0.15;
    const vx = (centerBias + (Math.random() - 0.5) * w * 0.3) * speedMult;

    // Golden tokens (rare bonus)
    const isGolden = !isBomb && Math.random() < 0.05;
    const finalPoints = isGolden ? points * 5 : points;

    state.tokens.push({
      id: state.nextId++,
      x: spawnX,
      y: spawnY,
      vx,
      vy,
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 5,
      tokenData,
      points: finalPoints,
      sliced: false,
      isBomb,
      type,
      isGolden,
    });
  }
}

export function checkSlice(
  state: GameState,
  x1: number, y1: number,
  x2: number, y2: number,
): void {
  if (state.gameOver) return;

  // Check for Singularity Collapse (Zen Mode)
  if (state.mode === 'zen' && state.singularity.active) {
    const s = state.singularity;
    if (lineIntersectsCircle(x1, y1, x2, y2, s.x, s.y, 45)) {
      // COLLAPSE TRIGGERED!
      let collapsedCount = 0;
      for (const token of state.tokens) {
        if (token.sliced || token.isBomb) continue;
        const dx = token.x - s.x;
        const dy = token.y - s.y;
        if (dx * dx + dy * dy < SINGULARITY_RADIUS * SINGULARITY_RADIUS) {
          token.sliced = true;
          state.score += (token.points * 3); // 3x points for singularity collapse
          state.tokensSliced++;
          collapsedCount++;
          spawnParticles(state, token.x, token.y, token.tokenData.color, 12);
        }
      }

      if (collapsedCount > 0) {
        state.soundQueue.push({ type: 'zenCollapse' });
        state.shakeAmount = 4;
        state.comboText = `GRAVITY COLLAPSE x${collapsedCount}!`;
        state.comboTextTimer = 2.0;
        s.active = false;
        s.charge = 0;

        // Massive center explosion
        spawnParticles(state, s.x, s.y, '#ffffff', 45);
        spawnParticles(state, s.x, s.y, '#d8b4fe', 35); // Light purple
        spawnParticles(state, s.x, s.y, '#9333ea', 25); // Deep purple
        return; // Swiping through singularity collapses, doesn't slice tokens individually in this frame
      }
    }
  }

  for (const token of state.tokens) {
    if (token.sliced) continue;

    if (lineIntersectsCircle(x1, y1, x2, y2, token.x, token.y, token.radius)) {
      token.sliced = true;

      const color = token.tokenData.color === '#000000' ? '#8B5CF6' : token.tokenData.color;
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const cutDirX = (x2 - x1) / len;
      const cutDirY = (y2 - y1) / len;
      const sideSign = Math.random() < 0.5 ? 1 : -1;
      const cutNormX = -cutDirY * sideSign;
      const cutNormY = cutDirX * sideSign;

      for (const side of [1, -1] as const) {
        state.slicedHalves.push({
          id: state.nextId++,
          originX: token.x,
          originY: token.y,
          radius: token.radius,
          tokenData: token.tokenData,
          color,
          cutDirX,
          cutDirY,
          cutNormX,
          cutNormY,
          side,
          t: 0,
          duration: 0.35,
          sepTime: 0.22,
          fadeDelay: 0.12,
          dist: side === 1 ? (14 + Math.random() * 6) : (22 + Math.random() * 10),
          rotAmount: ((side === 1 ? 2 : 6) + Math.random() * (side === 1 ? 4 : 6)) * (Math.random() < 0.5 ? -1 : 1) * Math.PI / 180,
          flash: 1,
          flashDur: 0.10,
          isBomb: token.isBomb,
          initialRotation: token.rotation,
          img: null,
        });
      }

      const pCount = 35 + Math.floor(Math.random() * 20); // Massive particle burst for maximum juice
      for (let pi = 0; pi < pCount; pi++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 250 + Math.random() * 450;
        const bias = Math.random() < 0.5 ? 1 : -1;
        const bxv = cutNormX * bias * (180 + Math.random() * 250);
        const byv = cutNormY * bias * (180 + Math.random() * 250);
        state.particles.push({
          x: token.x + (Math.random() - 0.5) * 20,
          y: token.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(ang) * spd * 0.45 + bxv * 0.65,
          vy: Math.sin(ang) * spd * 0.45 + byv * 0.65,
          life: 0.3 + Math.random() * 0.4,
          maxLife: 0.7,
          color: token.isBomb ? '#FF4444' : (Math.random() > 0.2 ? color : '#FFFFFF'),
          size: 1.2 + Math.random() * 4,
        });
      }

      if (token.isBomb) {
        state.lives--;
        state.combo = 0;
        state.comboText = '';
        state.shakeAmount = 2.5; // Greatly reduced shake for bombs
        spawnParticles(state, token.x, token.y, '#FF4444', 8);
        spawnParticles(state, token.x, token.y, '#FF8800', 5);
        state.soundQueue.push({ type: 'bomb' });
        if (state.lives <= 0 && state.mode !== 'zen') {
          state.gameOver = true;
          state.soundQueue.push({ type: 'gameOver' });
        }
      } else {
        const comboMult = Math.max(1, Math.floor(state.combo / 5) + 1);

        state.score += token.points * comboMult;
        state.combo++;
        state.tokensSliced++;
        state.bestCombo = Math.max(state.bestCombo, state.combo);

        if (token.type === 'large') {
          state.shakeAmount = 0.5; // Minimal shake
        } else {
          state.shakeAmount = 0.2; // Minimal shake
        }

        state.comboText = getComboText(state.combo);
        state.comboTextTimer = 1.5;

        state.soundQueue.push({ type: 'slice' });

        if (state.combo >= 3 && state.combo % 1 === 0) {
          state.soundQueue.push({ type: 'combo', combo: state.combo });
        }
      }
    }
  }
}

function spawnParticles(state: GameState, x: number, y: number, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 280;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 120,
      life: 0.4 + Math.random() * 0.5,
      maxLife: 0.9,
      color,
      size: 2 + Math.random() * 5,
    });
  }
}

function lineIntersectsCircle(
  x1: number, y1: number, x2: number, y2: number,
  cx: number, cy: number, r: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  if (a === 0) return fx * fx + fy * fy <= r * r;

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;

  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}

function getComboText(combo: number): string {
  if (combo >= 25) return 'LEGENDARY!';
  if (combo >= 20) return 'UNSTOPPABLE!';
  if (combo >= 16) return 'CRYPTO SMASH!';
  if (combo >= 12) return 'RAGE COMBO!';
  if (combo >= 8) return 'Awesome!';
  if (combo >= 5) return 'Great!';
  if (combo >= 3) return 'Nice!';
  return '';
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
