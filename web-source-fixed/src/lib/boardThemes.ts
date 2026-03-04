import neonGridBg from '@/assets/skins/neon-grid.webp';
import cyberPurpleBg from '@/assets/skins/cyber-purple.webp';
import emeraldForestBg from '@/assets/skins/emerald-forest.webp';
import holoChromeBg from '@/assets/skins/holo-chrome.webp';
import crimsonVoidBg from '@/assets/skins/crimson-void.webp';
import sapphireSeaBg from '@/assets/skins/sapphire-sea.webp';
import voidWhisperBg from '@/assets/skins/void-whisper.webp';
import nebulaMistBg from '@/assets/skins/nebula-mist.webp';
import carbonWeaveBg from '@/assets/skins/carbon-weave.webp';
import biolumeDeepBg from '@/assets/skins/biolume-deep.webp';
import marbleRoyalBg from '@/assets/skins/marble-royal.webp';
import mercuryFlowBg from '@/assets/skins/mercury-flow.webp';
import shadowCanyonBg from '@/assets/skins/shadow-canyon.webp';
import cyanShardsBg from '@/assets/skins/cyan-shards.webp';
import amberForgeBg from '@/assets/skins/amber-forge.webp';
import scarletWhisperBg from '@/assets/skins/scarlet-whisper.webp';
import rubyRiftBg from '@/assets/skins/ruby-rift.webp';
import shadowHandsBg from '@/assets/skins/shadow-hands.webp';
import cyberReaperBg from '@/assets/skins/cyber-reaper.webp';
import voidGazeBg from '@/assets/skins/void-gaze.webp';

export interface BoardTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  background: string;
  backgroundImage?: string;
  cssBackground?: string;
  starsOpacity: number;
  preview: string;
  cost: number;
  // Monetisation
  tier: 'free' | 'coins' | 'sol' | 'pass';
  solPrice?: number; // SOL amount (e.g. 0.006)
}

// Order: free → coins → sol (cheapest to most expensive within each tier)
export const BOARD_THEMES: BoardTheme[] = [
  // ── FREE (pass perks) ──────────────────────────────────────────────────────
  {
    id: 'neon-grid',
    name: 'Obsidian Pulse',
    emoji: '🌌',
    description: 'Deep charcoal with a subtle cosmic essence.',
    background: '#0a0a0c',
    backgroundImage: neonGridBg,
    starsOpacity: 0.2,
    preview: neonGridBg,
    cost: 0,
    tier: 'free',
  },
  {
    id: 'cyber-purple',
    name: 'Royal Nebula',
    emoji: '🌌',
    description: 'Sophisticated deep violet and starlight.',
    background: '#1a0b2e',
    backgroundImage: cyberPurpleBg,
    starsOpacity: 0.3,
    preview: cyberPurpleBg,
    cost: 0,
    tier: 'free',
  },
  {
    id: 'emerald-forest',
    name: 'Mystic Emerald',
    emoji: '🍃',
    description: 'Deep woodland mystical green.',
    background: '#041c10',
    backgroundImage: emeraldForestBg,
    starsOpacity: 0.1,
    preview: emeraldForestBg,
    cost: 0,
    tier: 'free',
  },
  // ── COINS ─────────────────────────────────────────────────────────────────
  {
    id: 'holo-chrome',
    name: 'Prism Chrome',
    emoji: '💿',
    description: 'Sleek holographic abstract gradient.',
    background: '#141417',
    backgroundImage: holoChromeBg,
    starsOpacity: 0,
    preview: holoChromeBg,
    cost: 500000,
    tier: 'coins',
  },
  {
    id: 'crimson-void',
    name: 'Velvet Void',
    emoji: '🍷',
    description: 'Dark and moody cinematic crimson.',
    background: '#1f0408',
    backgroundImage: crimsonVoidBg,
    starsOpacity: 0.1,
    preview: crimsonVoidBg,
    cost: 1000000,
    tier: 'coins',
  },
  {
    id: 'sapphire-sea',
    name: 'Deep Sapphire',
    emoji: '🌊',
    description: 'Bioluminescent deep-sea blues.',
    background: '#030d24',
    backgroundImage: sapphireSeaBg,
    starsOpacity: 0.2,
    preview: sapphireSeaBg,
    cost: 2000000,
    tier: 'coins',
  },
  {
    id: 'nebula-mist',
    name: 'Dream Nebula',
    emoji: '☁️',
    description: 'Ethereal pink and purple star gas.',
    background: '#1a0b2e',
    backgroundImage: nebulaMistBg,
    starsOpacity: 0.5,
    preview: nebulaMistBg,
    cost: 5000000,
    tier: 'coins',
  },
  // ── SOL ───────────────────────────────────────────────────────────────────
  {
    id: 'void-whisper',
    name: 'Void Whisper',
    emoji: '⬛',
    description: 'Dark smoke with white cosmic cracks.',
    background: '#000000',
    backgroundImage: voidWhisperBg,
    starsOpacity: 0.1,
    preview: voidWhisperBg,
    cost: 0,
    tier: 'pass',
  },
  {
    id: 'carbon-weave',
    name: 'Carbon Apex',
    emoji: '🛡️',
    description: 'Precision tactical carbon fiber weave.',
    background: '#0a0a0c',
    backgroundImage: carbonWeaveBg,
    starsOpacity: 0,
    preview: carbonWeaveBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.006,
  },
  {
    id: 'biolume-deep',
    name: 'Biolume Abyss',
    emoji: '🦑',
    description: 'Deep sea bioluminescence and aura.',
    background: '#030d24',
    backgroundImage: biolumeDeepBg,
    starsOpacity: 0.1,
    preview: biolumeDeepBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.007,
  },
  {
    id: 'marble-royal',
    name: 'Imperial Stone',
    emoji: '🏛️',
    description: 'Royal purple marble with gold veins.',
    background: '#141417',
    backgroundImage: marbleRoyalBg,
    starsOpacity: 0.1,
    preview: marbleRoyalBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.008,
  },
  {
    id: 'mercury-flow',
    name: 'QuickSilver',
    emoji: '🧪',
    description: 'Liquid silver mercury mirror flow.',
    background: '#141417',
    backgroundImage: mercuryFlowBg,
    starsOpacity: 0,
    preview: mercuryFlowBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.008,
  },
  {
    id: 'shadow-canyon',
    name: 'Shadow Canyon',
    emoji: '🏔️',
    description: 'Cinematic dark fantasy landscape from another realm.',
    background: '#0a0a0c',
    backgroundImage: shadowCanyonBg,
    starsOpacity: 0.2,
    preview: shadowCanyonBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.009,
  },
  {
    id: 'cyan-shards',
    name: 'Cyan Cyberspace',
    emoji: '💎',
    description: 'Futuristic neon-lit geometric shards in deep blue.',
    background: '#010816',
    backgroundImage: cyanShardsBg,
    starsOpacity: 0.1,
    preview: cyanShardsBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.009,
  },
  {
    id: 'amber-forge',
    name: 'Amber Forge',
    emoji: '🔥',
    description: 'Jagged obsidian with molten gold light from the core.',
    background: '#120a02',
    backgroundImage: amberForgeBg,
    starsOpacity: 0.1,
    preview: amberForgeBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.010,
  },
  {
    id: 'scarlet-whisper',
    name: 'Scarlet Whisper',
    emoji: '📜',
    description: 'Mystic dark textures with elegant crimson calligraphy.',
    background: '#150202',
    backgroundImage: scarletWhisperBg,
    starsOpacity: 0.2,
    preview: scarletWhisperBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.010,
  },
  {
    id: 'ruby-rift',
    name: 'Ruby Rift',
    emoji: '🌋',
    description: 'Futuristic canyon with glowing red crystalline walls.',
    background: '#200101',
    backgroundImage: rubyRiftBg,
    starsOpacity: 0.3,
    preview: rubyRiftBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.011,
  },
  {
    id: 'shadow-hands',
    name: 'Shadow Hands',
    emoji: '🙌',
    description: 'Eerie shadows reaching through a textured stone wall.',
    background: '#1a1a1a',
    backgroundImage: shadowHandsBg,
    starsOpacity: 0.1,
    preview: shadowHandsBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.011,
  },
  {
    id: 'cyber-reaper',
    name: 'Cyber Reaper',
    emoji: '⚔️',
    description: 'Dark glitch aesthetic with a neon pink scythe warrior.',
    background: '#0a0005',
    backgroundImage: cyberReaperBg,
    starsOpacity: 0.4,
    preview: cyberReaperBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.012,
  },
  {
    id: 'void-gaze',
    name: 'Void Gaze',
    emoji: '👁️',
    description: 'Countless eyes watching from the deep purple abyss.',
    background: '#0d001a',
    backgroundImage: voidGazeBg,
    starsOpacity: 0.2,
    preview: voidGazeBg,
    cost: 0,
    tier: 'sol',
    solPrice: 0.012,
  },
];

export function getThemeById(id: string): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}
