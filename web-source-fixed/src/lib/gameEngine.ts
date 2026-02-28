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
  | { type: 'gameOver' };

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
  zen: { lives: 999, bombRate: 0, spawnInterval: 1.6, speedMult: 0.32, batchMin: 2, batchMax: 3 },
};

export function createGameState(mode: GameMode): GameState {
  const config = MODE_CONFIGS[mode];
  return {
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
    timeLeft: mode === 'zen' ? 90 : undefined,
    soundQueue: [],
  };
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

  // Spawn
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnTokenBatch(state, w, h);
    const config = MODE_CONFIGS[state.mode];
    const difficultyMult = Math.max(0.5, 1 - state.elapsed / 150);
    state.spawnTimer = config.spawnInterval * difficultyMult;
  }

  // Timer logic for Zen/Chill mode
  if (state.timeLeft !== undefined && !state.gameOver) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.gameOver = true;
      state.soundQueue.push({ type: 'gameOver' });
    }
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
        state.shakeAmount = 3;
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

    const speedMult = config.speedMult;
    const launchHeight = isBomb ? (1.3 + Math.random() * 0.2) : (1.8 + Math.random() * 0.3);
    const vy = -(h * launchHeight) * speedMult;
    const centerBias = (w / 2 - spawnX) * 0.15;
    const vx = (centerBias + (Math.random() - 0.5) * w * 0.25) * speedMult;

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
      points,
      sliced: false,
      isBomb,
      type,
    });
  }
}

export function checkSlice(
  state: GameState,
  x1: number, y1: number,
  x2: number, y2: number,
): void {
  if (state.gameOver) return;

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
        state.shakeAmount = 10;
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
          state.shakeAmount = 4;
        } else {
          state.shakeAmount = 2.5;
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
