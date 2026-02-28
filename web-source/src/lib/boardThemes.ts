import neonGridBg from '@/assets/skins/neon-grid.png';
import cyberPurpleBg from '@/assets/skins/cyber-purple.png';
import goldMarbleBg from '@/assets/skins/gold-marble.png';
import darkCarbonBg from '@/assets/skins/dark-carbon.png';
import iceBlueBg from '@/assets/skins/ice-blue.png';
import lavaRedBg from '@/assets/skins/lava-red.png';

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
    emoji: '🌌',
    description: 'Deep charcoal with a subtle cosmic essence.',
    background: '#0a0a0c',
    backgroundImage: neonGridBg,
    starsOpacity: 0.2,
    preview: neonGridBg,
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
  },
  {
    id: 'gold-marble',
    name: 'Eternal Amber',
    emoji: '✨',
    description: 'Rich metallic warmth and luxury.',
    background: '#241a08',
    backgroundImage: goldMarbleBg,
    starsOpacity: 0.1,
    preview: goldMarbleBg,
  },
  {
    id: 'dark-carbon',
    name: 'Carbon Stealth',
    emoji: '⬛',
    description: 'Ultra-modern tactical matte finish.',
    background: '#0f172a',
    backgroundImage: darkCarbonBg,
    starsOpacity: 0,
    preview: darkCarbonBg,
  },
  {
    id: 'ice-blue-glow',
    name: 'Arctic Sage',
    emoji: '❄️',
    description: 'Cool, crisp professional finish.',
    background: '#061a1a',
    backgroundImage: iceBlueBg,
    starsOpacity: 0,
    preview: iceBlueBg,
  },
  {
    id: 'lava-red',
    name: 'Solar Flare',
    emoji: '💥',
    description: 'High-energy cinematic depth.',
    background: '#1c0805',
    backgroundImage: lavaRedBg,
    starsOpacity: 0.2,
    preview: lavaRedBg,
  },
];

export function getThemeById(id: string): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}
