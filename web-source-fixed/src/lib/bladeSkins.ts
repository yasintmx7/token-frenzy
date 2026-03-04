export interface BladeSkin {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  trail: {
    core: string;
    glow: string;
    outer: string;
  };
  particles: string[];
  style?: 'default' | 'crescent' | 'lightning' | 'laser';
  // Monetisation
  tier: 'free' | 'coins' | 'sol' | 'pass';
  solPrice?: number;
}

// Order: free → coins → sol
export const BLADE_SKINS: BladeSkin[] = [
  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    id: 'crypto-cyan',
    name: 'Crypto Cyan',
    emoji: '⚡',
    cost: 0,
    description: 'Default electric blade',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(0,255,255,{a})',
      outer: 'rgba(0,200,200,{a})',
    },
    particles: ['#00FFFF', '#00E5FF', '#FFFFFF'],
    style: 'lightning',
    tier: 'free',
  },
  {
    id: 'phoenix-ember',
    name: 'Phoenix Ember',
    emoji: '🔥',
    cost: 0,
    description: 'Solar yellow bird essence',
    trail: {
      core: 'rgba(255, 240, 200, {a})',
      glow: 'rgba(255, 180, 0, {a})',
      outer: 'rgba(255, 80, 0, {a})',
    },
    particles: ['#FFD700', '#FFA500', '#FF4500'],
    style: 'lightning',
    tier: 'free',
  },
  // ── COINS ──────────────────────────────────────────────────────────────────
  {
    id: 'frost-reaper',
    name: 'Frost Reaper',
    emoji: '💀',
    cost: 500000,
    description: 'Cold touch of death',
    trail: {
      core: 'rgba(200,255,255,{a})',
      glow: 'rgba(100,200,255,{a})',
      outer: 'rgba(50,50,255,{a})',
    },
    particles: ['#E0FFFF', '#00BFFF', '#4682B4'],
    style: 'lightning',
    tier: 'coins',
  },
  {
    id: 'laser-red',
    name: 'Laser Red',
    emoji: '🔴',
    cost: 1500000,
    description: 'Blood-red precision beam',
    trail: {
      core: 'rgba(255, 255, 255, {a})',
      glow: 'rgba(255, 0, 80, {a})',
      outer: 'rgba(150, 0, 0, {a})',
    },
    particles: ['#FF0050', '#AA0000', '#FFFFFF'],
    style: 'laser',
    tier: 'coins',
  },
  // ── SOL ───────────────────────────────────────────────────────────────────
  {
    id: 'lava-slash',
    name: 'Lava Slash',
    emoji: '🌋',
    cost: 0,
    description: 'Molten rock and volcanic ash',
    trail: {
      core: 'rgba(255, 50, 0, {a})',
      glow: 'rgba(80, 20, 0, {a})',
      outer: 'rgba(30, 10, 5, {a})',
    },
    particles: ['#FF4400', '#221100', '#552200'],
    style: 'crescent',
    tier: 'pass',
  },
  {
    id: 'shadow-edge',
    name: 'Shadow Edge',
    emoji: '🌑',
    cost: 0,
    description: 'Void ink trail',
    trail: {
      core: 'rgba(50,50,50,{a})',
      glow: 'rgba(0,0,0,{a})',
      outer: 'rgba(30,0,50,{a})',
    },
    particles: ['#111111', '#333333', '#000000'],
    tier: 'sol',
    solPrice: 0.005,
  },
  {
    id: 'emerald-whale',
    name: 'Emerald Whale',
    emoji: '�',
    cost: 0,
    description: 'Deep forest energy flow',
    trail: {
      core: 'rgba(200,255,200,{a})',
      glow: 'rgba(16,185,129,{a})',
      outer: 'rgba(6,78,59,{a})',
    },
    particles: ['#10B981', '#34D399', '#064E3B'],
    style: 'crescent',
    tier: 'sol',
    solPrice: 0.005,
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    emoji: '💎',
    cost: 0,
    description: 'Pure silver diamond glitter',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(220,227,235,{a})',
      outer: 'rgba(148,163,184,{a})',
    },
    particles: ['#F8FAFC', '#FFFFFF', '#E2E8F0', '#94A3B8'],
    tier: 'sol',
    solPrice: 0.005,
  },
  {
    id: 'to-the-moon',
    name: 'To The Moon',
    emoji: '🚀',
    cost: 0,
    description: 'Plasma rocket burn',
    trail: {
      core: 'rgba(255,200,255,{a})',
      glow: 'rgba(192,38,211,{a})',
      outer: 'rgba(236,72,153,{a})',
    },
    particles: ['#C026D3', '#EC4899', '#E879F9', '#F0ABFC'],
    tier: 'sol',
    solPrice: 0.005,
  },
  {
    id: 'toxic-relic',
    name: 'Toxic Relic',
    emoji: '�',
    cost: 0,
    description: 'Acidic lime chemical drift',
    trail: {
      core: 'rgba(200,255,100,{a})',
      glow: 'rgba(132,204,22,{a})',
      outer: 'rgba(20,40,0,{a})',
    },
    particles: ['#84CC16', '#A3E635', '#1A2E05'],
    tier: 'sol',
    solPrice: 0.005,
  },
];

export function getUnlockedSkins(totalScore: number): BladeSkin[] {
  return BLADE_SKINS;
}

export function getSkinById(id: string): BladeSkin {
  return BLADE_SKINS.find(s => s.id === id) || BLADE_SKINS[0];
}
