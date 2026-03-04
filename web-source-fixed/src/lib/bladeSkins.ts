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
}

export const BLADE_SKINS: BladeSkin[] = [
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
  },
  {
    id: 'bull-run',
    name: 'Bull Run',
    emoji: '🐂',
    cost: 1000,
    description: 'Profitable energy',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(52,211,153,{a})',
      outer: 'rgba(16,185,129,{a})',
    },
    particles: ['#34D399', '#10B981', '#6EE7B7'],
  },
  {
    id: 'bear-freeze',
    name: 'Bear Freeze',
    emoji: '❄️',
    cost: 2000,
    description: 'Market freeze',
    trail: {
      core: 'rgba(224,242,254,{a})',
      glow: 'rgba(56,189,248,{a})',
      outer: 'rgba(14,165,233,{a})',
    },
    particles: ['#38BDF8', '#7DD3FC', '#E0F2FE'],
  },
  {
    id: 'golden-whale',
    name: 'Golden Whale',
    emoji: '🐋',
    cost: 5000,
    description: 'Heavy gold liquid',
    trail: {
      core: 'rgba(255,255,240,{a})',
      glow: 'rgba(245,158,11,{a})',
      outer: 'rgba(217,119,6,{a})',
    },
    particles: ['#F59E0B', '#FBBF24', '#FDE68A'],
    style: 'crescent',
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    emoji: '💎',
    cost: 10000,
    description: 'Glittering diamond dust',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(165,243,252,{a})',
      outer: 'rgba(103,232,249,{a})',
    },
    particles: ['#A5F3FC', '#FFFFFF', '#67E8F9', '#CFFAFE'],
  },
  {
    id: 'to-the-moon',
    name: 'To The Moon',
    emoji: '🚀',
    cost: 15000,
    description: 'Plasma rocket burn',
    trail: {
      core: 'rgba(255,200,255,{a})',
      glow: 'rgba(192,38,211,{a})',
      outer: 'rgba(236,72,153,{a})',
    },
    particles: ['#C026D3', '#EC4899', '#E879F9', '#F0ABFC'],
  },
  {
    id: 'lava-slash',
    name: 'Lava Slash',
    emoji: '🌋',
    cost: 8500,
    description: 'Molten rock flow',
    trail: {
      core: 'rgba(255,100,0,{a})',
      glow: 'rgba(255,60,0,{a})',
      outer: 'rgba(100,20,0,{a})',
    },
    particles: ['#FF4400', '#FF8800', '#662200'],
  },
  {
    id: 'shadow-edge',
    name: 'Shadow Edge',
    emoji: '🌑',
    cost: 7000,
    description: 'Void ink trail',
    trail: {
      core: 'rgba(50,50,50,{a})',
      glow: 'rgba(0,0,0,{a})',
      outer: 'rgba(30,0,50,{a})',
    },
    particles: ['#111111', '#333333', '#000000'],
  },
  {
    id: 'laser-red',
    name: 'Laser Red',
    emoji: '🔴',
    cost: 4000,
    description: 'High-energy precision',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(255,0,0,{a})',
      outer: 'rgba(150,0,0,{a})',
    },
    particles: ['#FF0000', '#AA0000', '#FFFFFF'],
    style: 'laser',
  },
  {
    id: 'nebula-flow',
    name: 'Nebula Flow',
    emoji: '🪐',
    cost: 12000,
    description: 'Stellar gas drift',
    trail: {
      core: 'rgba(200,255,255,{a})',
      glow: 'rgba(50,100,255,{a})',
      outer: 'rgba(100,0,255,{a})',
    },
    particles: ['#3264FF', '#6400FF', '#FFFFFF', '#00FFFF'],
  },
];

export function getUnlockedSkins(totalScore: number): BladeSkin[] {
  return BLADE_SKINS;
}

export function getSkinById(id: string): BladeSkin {
  return BLADE_SKINS.find(s => s.id === id) || BLADE_SKINS[0];
}
