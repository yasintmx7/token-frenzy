export interface Avatar {
  id: string;
  name: string;
  description: string;
  svg: string;
  tier: 'free' | 'coins' | 'sol' | 'pass';
  cost: number;
  solPrice?: number;
}

export const AVATARS: Avatar[] = [
  {
    id: 'recruit',
    name: 'Recruit',
    description: 'Standard issue cyber-recruit.',
    tier: 'free',
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-recruit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e293b" />
            <stop offset="100%" style="stop-color:#0f172a" />
          </linearGradient>
          <linearGradient id="glow-recruit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#38bdf8" />
            <stop offset="100%" style="stop-color:#818cf8" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="url(#grad-recruit)" />
        <path d="M50 20 L80 40 L80 60 L50 80 L20 60 L20 40 Z" fill="none" stroke="url(#glow-recruit)" stroke-width="4" stroke-linejoin="round" />
        <circle cx="50" cy="50" r="12" fill="url(#glow-recruit)" fill-opacity="0.8" />
        <path d="M30 40 L45 50 L30 60M70 40 L55 50 L70 60" stroke="white" stroke-width="2" stroke-linecap="round" stroke-opacity="0.5" />
      </svg>
    `
  },
  {
    id: 'bit-master',
    name: 'Bit-Master',
    description: 'The original digital gold.',
    tier: 'coins',
    cost: 500000,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-btc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f7931a" />
            <stop offset="100%" style="stop-color:#fbbf24" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#171717" />
        <circle cx="50" cy="50" r="35" fill="url(#grad-btc)" />
        <path d="M42 30h12c5 0 8 3 8 7 0 3-2 6-5 7 4 0 7 3 7 8 0 5-4 8-9 8H42V30zm6 6v7h6c2 0 3-1 3-3 0-3-1-4-3-4h-6zm0 13v7h7c2 0 3-1 3-3s-1-4-3-4h-7z" fill="white" />
        <path d="M47 25v5m6-5v5M47 60v5m6-5v5" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M50 50m-40 0a40 40 0 1 0 80 0a40 40 0 1 0 -80 0" fill="none" stroke="url(#grad-btc)" stroke-width="2" stroke-dasharray="4 8" />
      </svg>
    `
  },
  {
    id: 'ether-soul',
    name: 'Ether-Soul',
    description: 'Ethereal energy from the smart layers.',
    tier: 'coins',
    cost: 2000000,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-eth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1" />
            <stop offset="100%" style="stop-color:#a855f7" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#0f172a" />
        <path d="M50 15L80 45L50 60L20 45Z" fill="url(#grad-eth)" />
        <path d="M50 65L80 50L50 85L20 50Z" fill="url(#grad-eth)" fill-opacity="0.8" />
        <path d="M50 15L50 60M50 65L50 85M20 45L80 45M20 50L80 50" stroke="white" stroke-width="1" stroke-opacity="0.3" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#grad-eth)" stroke-width="2" stroke-opacity="0.2" />
      </svg>
    `
  },
  {
    id: 'sol-vanguard',
    name: 'Sol-Vanguard',
    description: 'High-speed warrior of the sun.',
    tier: 'sol',
    solPrice: 0.005,
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-sol" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#14f195" />
            <stop offset="50%" style="stop-color:#9945ff" />
            <stop offset="100%" style="stop-color:#14f195" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#000" />
        <path d="M25 35h50L65 50H15zM35 50h50L75 65H25zM15 65h50L55 80H5z" fill="url(#grad-sol)" />
        <path d="M50 20 L20 50 L50 80 L80 50 Z" fill="none" stroke="url(#grad-sol)" stroke-width="2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad-sol)" stroke-width="1" stroke-opacity="0.3" />
      </svg>
    `
  },
  {
    id: 'neon-overlord',
    name: 'Neon Overlord',
    description: 'Master of the cybernetic shadows.',
    tier: 'sol',
    solPrice: 0.006,
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-neon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff00ea" />
            <stop offset="100%" style="stop-color:#7000ff" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#0c0c0c" />
        <path d="M30 30h40v40H30z" fill="none" stroke="url(#grad-neon)" stroke-width="4" stroke-linejoin="round" />
        <path d="M20 20l20 20M80 80l-20-20M80 20l-20 20M20 80l20-20" stroke="url(#grad-neon)" stroke-width="2" stroke-opacity="0.5" />
        <circle cx="50" cy="50" r="15" fill="white" fill-opacity="0.1" stroke="white" stroke-width="1" />
        <path d="M45 45l10 10M55 45l-10 10" stroke="white" stroke-width="4" stroke-linecap="round" />
      </svg>
    `
  },
  {
    id: 'glitch-ghost',
    name: 'Glitch Ghost',
    description: 'Manifestation of a network error.',
    tier: 'sol',
    solPrice: 0.007,
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="24" fill="#000" />
        <path d="M30 40h40v10H30z" fill="#0ff" fill-opacity="0.8" />
        <path d="M25 45h50v5H25z" fill="#f0f" fill-opacity="0.8" />
        <path d="M35 35h30v2H35zM35 60h30v2H35z" fill="#fff" />
        <circle cx="40" cy="45" r="4" fill="white" />
        <circle cx="60" cy="45" r="4" fill="white" />
        <path d="M10 20h10M80 80h10M10 80h10M80 20h10" stroke="white" stroke-width="2" />
      </svg>
    `
  },
  {
    id: 'cyber-valkyrie',
    name: 'Cyber Valkyrie',
    description: 'Bringer of digital destiny.',
    tier: 'sol',
    solPrice: 0.010,
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-v" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fefce8" />
            <stop offset="100%" style="stop-color:#fde047" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="24" fill="#1e1b4b" />
        <path d="M50 20 L80 40 L50 90 L20 40 Z" fill="url(#grad-v)" />
        <path d="M50 20 L20 40 M50 20 L80 40" stroke="white" stroke-width="4" stroke-linecap="round" />
        <circle cx="50" cy="40" r="10" fill="white" fill-opacity="0.9" />
        <path d="M35 45 L50 55 L65 45" fill="none" stroke="#1e1b4b" stroke-width="3" stroke-linecap="round" />
      </svg>
    `
  },
  {
    id: 'legendary-pass',
    name: 'Legendary Monarch',
    description: 'The ultimate symbol of prestige.',
    tier: 'pass',
    cost: 0,
    svg: `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-monarch" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f59e0b" />
            <stop offset="50%" style="stop-color:#fef3c7" />
            <stop offset="100%" style="stop-color:#d97706" />
          </linearGradient>
          <clipPath id="clip-monarch">
            <rect width="100" height="100" rx="24" />
          </clipPath>
        </defs>
        <g clip-path="url(#clip-monarch)">
          <rect width="100" height="100" fill="#000" />
          <path d="M50 15L60 35H85L65 55L75 80L50 65L25 80L35 55L15 35H40Z" fill="url(#grad-monarch)" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="url(#grad-monarch)" stroke-width="1" stroke-opacity="0.5" />
          <path d="M0 0 L100 100 M0 100 L100 0" stroke="white" stroke-width="0.5" stroke-opacity="0.1" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#grad-monarch)" stroke-width="4" stroke-opacity="0.8" />
        </g>
      </svg>
    `
  }
];

export function getAvatarById(id: string): Avatar {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}
