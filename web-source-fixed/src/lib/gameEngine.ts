import { TOKENS, type TokenData } from './tokens';
import { type TokenFrame, getFrameById } from './tokenFrames';
import { loadProgress } from './storage';

export type GameMode = 'classic' | 'frustration' | 'zen' | 'timewarp' | 'void' | 'laser';

// ... (FlyingToken and other interfaces)

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
  generation?: number; // Added for 'timewarp' (Split mode)
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
  selectedTokenFrame: TokenFrame;
  singularity: { x: number, y: number, active: boolean, charge: number, radius: number };
  timeScale: number;
  blackHole?: { x: number, y: number, vx: number, vy: number };
  lasers?: { y: number, type: 'safe' | 'danger', active: boolean }[];
  powerUps: {
    midasTouch: { active: boolean; timeLeft: number };
    megaBlade: { active: boolean; timeLeft: number };
  };
  // Laser mode cooldown (prevents rapid multi-hit in same frame)
  laserHitCooldown?: number;
  // Void (Twin) Game specific state
  twinTargetId?: string | null;
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
  timewarp: { lives: 3, bombRate: 0.15, spawnInterval: 1.4, speedMult: 0.45, batchMin: 2, batchMax: 4 },
  void: { lives: 3, bombRate: 0.15, spawnInterval: 1.4, speedMult: 0.45, batchMin: 2, batchMax: 4 },
  laser: { lives: 3, bombRate: 0.12, spawnInterval: 1.0, speedMult: 0.45, batchMin: 2, batchMax: 4 },
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
    selectedTokenFrame: getFrameById(loadProgress().selectedFrame),
    singularity: { x: 0, y: 0, active: false, charge: 0, radius: 0 },
    timeScale: 1.0,
    powerUps: {
      midasTouch: { active: false, timeLeft: 0 },
      megaBlade: { active: false, timeLeft: 0 },
    },
  };

  if (mode === 'void') {
    state.twinTargetId = null;
  }

  if (mode === 'laser') {
    state.lasers = [
      { y: 0, type: 'danger', active: false },
      { y: 0, type: 'safe', active: false }
    ];
  }

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


  // --- LASER MODE UPDATE ---
  if (state.mode === 'laser' && state.lasers) {
    // Increased to 3-4 lasers for more difficulty
    if (state.lasers.length < 3) {
      state.lasers.push({ y: 0, type: 'danger', active: false });
    }
    state.lasers.forEach((l, i) => {
      l.y = (h / (state.lasers.length + 1)) * (i + 1) + Math.sin(state.elapsed * 3 + i) * 80;
      // Faster cycle for higher difficulty
      l.active = (Math.floor(state.elapsed * 2.5) % 3 !== 0);
    });
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

  // physics
  const gravity = h * 0.35;

  for (const token of state.tokens) {
    token.x += token.vx * dt;
    token.y += token.vy * dt;
    token.vy += gravity * dt;
    token.rotation += token.rotationSpeed * dt;
  }

  // Hard cap on tokens to prevent Split mode accumulation lag
  if (state.tokens.length > 40) {
    state.tokens.splice(0, state.tokens.length - 40);
  }

  // Remove tokens:
  // 1. Off-screen (lose life if missed)
  // 2. Sliced (removed immediately for performance optimization)
  for (let i = state.tokens.length - 1; i >= 0; i--) {
    const token = state.tokens[i];

    // Optimization: Remove sliced tokens immediately
    if (token.sliced) {
      state.tokens.splice(i, 1);
      continue;
    }

    const isOffScreen = (token.y > h + 120 && token.vy > 0);

    if (isOffScreen) {
      // Missing a token drops a life.
      if (!token.isBomb && state.mode !== 'zen' && state.mode !== 'frustration') {
        state.missedTokens++;
        state.combo = 0;
        state.comboText = '';
        state.lives--;
        state.shakeAmount = 1;
        if (state.mode === 'void') state.twinTargetId = null; // reset pair state on miss

        if (state.lives <= 0) {
          state.gameOver = true;
          state.soundQueue.push({ type: 'gameOver' });
        }
      }
      state.tokens.splice(i, 1);
    }
  }

  // 4. Update particles (Faster loop, removing dead ones in-place or with filter)
  // Optimization: use a traditional for loop and splice for better memory control during high intensity
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    const drag = Math.pow(0.01, dt);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  // Update sliced halves
  for (const half of state.slicedHalves) {
    half.t += dt;
    half.flash = Math.max(0, 1 - (half.t / half.flashDur));
  }
  state.slicedHalves = state.slicedHalves.filter(half => half.t < half.duration);

  // Hard cap on particles to prevent high-combo lag
  if (state.particles.length > 250) {
    state.particles.splice(0, state.particles.length - 250);
  }

  // Power-up decay
  if (state.powerUps.midasTouch.active) {
    state.powerUps.midasTouch.timeLeft -= dt;
    if (state.powerUps.midasTouch.timeLeft <= 0) state.powerUps.midasTouch.active = false;
  }
  if (state.powerUps.megaBlade.active) {
    state.powerUps.megaBlade.timeLeft -= dt;
    if (state.powerUps.megaBlade.timeLeft <= 0) state.powerUps.megaBlade.active = false;
  }
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
    let spawnY = h + radius * 2;
    const speedMult = config.speedMult * (w > h ? 1.15 : 1.0);
    const launchHeight = isBomb ? (1.3 + Math.random() * 0.2) : (1.8 + Math.random() * 0.3);

    let vy = -(h * launchHeight) * speedMult;
    // Standard launch logic (void now follows classic speed)
    const centerBias = (w / 2 - spawnX) * 0.15;
    const vx = (centerBias + (Math.random() - 0.5) * w * 0.3) * speedMult;

    const count = (state.mode === 'void') ? 2 : 1;
    for (let c = 0; c < count; c++) {
      const isGolden = !isBomb && (state.powerUps.midasTouch.active || Math.random() < 0.05);
      const finalPoints = isGolden ? points * 5 : points;

      // slightly jitter spawn x,y, vx so they don't perfectly overlap
      const jitterX = c === 1 ? (Math.random() - 0.5) * 50 : 0;
      const jitterVx = c === 1 ? (Math.random() - 0.5) * 60 : 0;

      const token: FlyingToken = {
        id: state.nextId++,
        x: spawnX + jitterX,
        y: spawnY,
        vx: vx + jitterVx,
        vy,
        radius,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        tokenData: tokenData,
        points: finalPoints,
        sliced: false,
        isBomb,
        type,
        isGolden,
      };

      if (state.mode === 'timewarp' && !isBomb) {
        token.generation = 1; // Split mode generation 1
      }

      state.tokens.push(token);
    }
  }
}

export function checkSlice(
  state: GameState,
  x1: number, y1: number,
  x2: number, y2: number,
): void {
  if (state.gameOver) return;

  // 1. Singularity Check (Zen Only)
  if (state.mode === 'zen' && state.singularity.active) {
    const s = state.singularity;
    if (lineIntersectsCircle(x1, y1, x2, y2, s.x, s.y, 45)) {
      let collapsedCount = 0;
      const radSq = SINGULARITY_RADIUS * SINGULARITY_RADIUS;
      for (const token of state.tokens) {
        if (token.sliced || token.isBomb) continue;
        const dx = token.x - s.x;
        const dy = token.y - s.y;
        if (dx * dx + dy * dy < radSq) {
          token.sliced = true;
          state.score += (token.points * 3);
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
        spawnParticles(state, s.x, s.y, '#ffffff', 45);
        return;
      }
    }
  }

  // 2. Laser Check
  if (state.mode === 'laser' && state.lasers) {
    for (const l of state.lasers) {
      if (l.active && l.type === 'danger') {
        const distY1 = Math.abs(y1 - l.y);
        const distY2 = Math.abs(y2 - l.y);
        // Narrower 3px hitbox and only trigger once per 0.5s to prevent rapid life drain
        if ((distY1 < 3 || distY2 < 3)) {
          const now = Date.now();
          if (!state.laserHitCooldown || now - state.laserHitCooldown > 500) {
            state.laserHitCooldown = now;
            state.lives--;
            state.shakeAmount = 2.0;
            state.soundQueue.push({ type: 'bomb' });
            if (state.lives <= 0) {
              state.gameOver = true;
              state.soundQueue.push({ type: 'gameOver' });
            }
          }
        }
      }
    }
  }

  // 3. Token Loop
  const newSplitTokens: FlyingToken[] = [];

  for (const token of state.tokens) {
    if (token.sliced) continue;

    const sliceRadius = state.powerUps.megaBlade.active ? token.radius * 2.8 : token.radius;
    if (lineIntersectsCircle(x1, y1, x2, y2, token.x, token.y, sliceRadius)) {

      // BRAIN GAME: TWIN MODE (void)
      if (state.mode === 'void' && !token.isBomb) {
        if (!state.twinTargetId) {
          // Select token!
          state.twinTargetId = token.tokenData.id;
          state.comboText = 'MATCH!';
          state.comboTextTimer = 1.0;
        } else if (state.twinTargetId === token.tokenData.id) {
          // Matched correctly!
          state.twinTargetId = null;
        } else {
          // Wrong match!
          state.lives--;
          state.combo = 0;
          state.shakeAmount = 2.5;
          state.soundQueue.push({ type: 'bomb' });
          state.twinTargetId = null;

          if (state.lives <= 0) {
            state.gameOver = true;
            state.soundQueue.push({ type: 'gameOver' });
          }
          break; // Avoid slicing anything else this frame, abort cut
        }
      }

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

      const pCount = 35 + Math.floor(Math.random() * 20);
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
        state.shakeAmount = 2.5;
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
        state.shakeAmount = token.type === 'large' ? 0.5 : 0.2;
        state.comboText = getComboText(state.combo);
        state.comboTextTimer = 1.5;
        state.soundQueue.push({ type: 'slice' });
        if (state.combo >= 3 && state.combo % 1 === 0) {
          state.soundQueue.push({ type: 'combo', combo: state.combo });
        }

        // BRAIN GAME: SPLIT (timewarp)
        if (state.mode === 'timewarp') {
          const gen = token.generation || 1;
          if (gen < 3) {
            for (let i = -1; i <= 1; i += 2) {
              newSplitTokens.push({
                id: state.nextId++,
                x: token.x + i * token.radius * 0.4,
                y: token.y,
                vx: token.vx + i * 180, // Spread outwards
                vy: token.vy - 200,     // Pop upwards
                radius: token.radius * 0.65,
                rotation: token.rotation,
                rotationSpeed: token.rotationSpeed * 2.5,
                tokenData: token.tokenData,
                points: token.points * 2,
                sliced: false,
                isBomb: false,
                type: 'small',
                isGolden: token.isGolden,
                generation: gen + 1
              });
            }
          }
        }
      }
    }
  }

  if (newSplitTokens.length > 0) {
    state.tokens.push(...newSplitTokens);
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

export function activatePowerUp(state: GameState, type: 'midas-touch' | 'mega-blade'): void {
  if (state.gameOver) return;
  if (type === 'midas-touch') {
    state.powerUps.midasTouch.active = true;
    state.powerUps.midasTouch.timeLeft = 10;
  }
  if (type === 'mega-blade') {
    state.powerUps.megaBlade.active = true;
    state.powerUps.megaBlade.timeLeft = 15;
  }
}
