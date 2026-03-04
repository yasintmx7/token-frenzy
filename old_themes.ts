import neonGridBg from '@/assets/skins/neon-grid.png';
import cyberPurpleBg from '@/assets/skins/cyber-purple.png';
import goldMarbleBg from '@/assets/skins/gold-marble.png';
import darkCarbonBg from '@/assets/skins/dark-carbon.png';
import iceBlueBg from '@/assets/skins/ice-blue.png';
import lavaRedBg from '@/assets/skins/lava-red.png';
import emeraldForestBg from '@/assets/skins/emerald-forest.png';
import holoChromeBg from '@/assets/skins/holo-chrome.png';
import crimsonVoidBg from '@/assets/skins/crimson-void.png';
import sapphireSeaBg from '@/assets/skins/sapphire-sea.png';

export interface BoardTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  background: string;
  backgroundImage: string;
  starsOpacity: number;
  preview: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'neon-grid',
    name: 'Obsidian Pulse',
    emoji: '≡ƒîî',
    description: 'Deep charcoal with a subtle cosmic essence.',
    background: '#0a0a0c',
    backgroundImage: neonGridBg,
    starsOpacity: 0.2,
    preview: neonGridBg,
  },
  {
    id: 'cyber-purple',
    name: 'Royal Nebula',
    emoji: '≡ƒîî',
    description: 'Sophisticated deep violet and starlight.',
    background: '#1a0b2e',
    backgroundImage: cyberPurpleBg,
    starsOpacity: 0.3,
    preview: cyberPurpleBg,
  },
  {
    id: 'gold-marble',
    name: 'Eternal Amber',
    emoji: 'Γ£¿',
    description: 'Rich metallic warmth and luxury.',
    background: '#241a08',
    backgroundImage: goldMarbleBg,
    starsOpacity: 0.1,
    preview: goldMarbleBg,
  },
  {
    id: 'dark-carbon',
    name: 'Carbon Stealth',
    emoji: 'Γ¼¢',
    description: 'Ultra-modern tactical matte finish.',
    background: '#0f172a',
    backgroundImage: darkCarbonBg,
    starsOpacity: 0,
    preview: darkCarbonBg,
  },
  {
    id: 'ice-blue-glow',
    name: 'Arctic Sage',
    emoji: 'Γ¥ä∩╕Å',
    description: 'Cool, crisp professional finish.',
    background: '#061a1a',
    backgroundImage: iceBlueBg,
    starsOpacity: 0,
    preview: iceBlueBg,
  },
  {
    id: 'lava-red',
    name: 'Solar Flare',
    emoji: '≡ƒÆÑ',
    description: 'High-energy cinematic depth.',
    background: '#1c0805',
    backgroundImage: lavaRedBg,
    starsOpacity: 0.2,
    preview: lavaRedBg,
  },
  {
    id: 'emerald-forest',
    name: 'Mystic Emerald',
    emoji: '≡ƒìâ',
    description: 'Deep woodland mystical green.',
    background: '#041c10',
    backgroundImage: emeraldForestBg,
    starsOpacity: 0.1,
    preview: emeraldForestBg,
  },
  {
    id: 'holo-chrome',
    name: 'Prism Chrome',
    emoji: '≡ƒÆ┐',
    description: 'Sleek holographic abstract gradient.',
    background: '#141417',
    backgroundImage: holoChromeBg,
    starsOpacity: 0,
    preview: holoChromeBg,
  },
  {
    id: 'crimson-void',
    name: 'Velvet Void',
    emoji: '≡ƒì╖',
    description: 'Dark and moody cinematic crimson.',
    background: '#1f0408',
    backgroundImage: crimsonVoidBg,
    starsOpacity: 0.1,
    preview: crimsonVoidBg,
  },
  {
    id: 'sapphire-sea',
    name: 'Deep Sapphire',
    emoji: '≡ƒîè',
    description: 'Bioluminescent deep-sea blues.',
    background: '#030d24',
    backgroundImage: sapphireSeaBg,
    starsOpacity: 0.2,
    preview: sapphireSeaBg,
  },
];

export function getThemeById(id: string): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}
