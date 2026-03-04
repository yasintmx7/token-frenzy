export interface TokenFrame {
    id: string;
    name: string;
    cost: number;
    glowColor: string;
    borderColor: string;
    auraOpacity: number;
    ringWidth: number;
    description: string;
    // Monetisation
    tier: 'free' | 'coins' | 'sol' | 'pass';
    solPrice?: number;
}

// Order: free → coins → sol
export const TOKEN_FRAMES: TokenFrame[] = [
    // ── FREE ─────────────────────────────────────────────────────────────────
    {
        id: 'default',
        name: 'Standard',
        cost: 0,
        glowColor: 'transparent',
        borderColor: 'transparent',
        auraOpacity: 0,
        ringWidth: 0,
        description: 'No frame',
        tier: 'free',
    },
    {
        id: 'radar-pulse',
        name: 'Radar Pulse',
        cost: 0,
        glowColor: '#dc2626',
        borderColor: '#ffffff',
        auraOpacity: 0.4,
        ringWidth: 2,
        description: 'Target acquired',
        tier: 'free',
    },
    // ── COINS ────────────────────────────────────────────────────────────────
    {
        id: 'glitch-nexus',
        name: 'Glitch Nexus',
        cost: 500000,
        glowColor: '#ff00ff',
        borderColor: '#ffffff',
        auraOpacity: 0.6,
        ringWidth: 4,
        description: 'Fractured digital aura',
        tier: 'coins',
    },
    {
        id: 'energy-nova',
        name: 'Energy Nova',
        cost: 1500000,
        glowColor: '#00ffff',
        borderColor: '#00ffff',
        auraOpacity: 0.7,
        ringWidth: 4,
        description: 'Pulsing cyan core',
        tier: 'coins',
    },
    // ── SOL ──────────────────────────────────────────────────────────────────
    {
        id: 'stardust-burst',
        name: 'Stardust Burst',
        cost: 0,
        glowColor: '#ffffff',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 0,
        description: 'Explosive energy trail',
        tier: 'pass',
    },
    {
        id: 'void-vortex',
        name: 'Void Vortex',
        cost: 0,
        glowColor: '#7c3aed',
        borderColor: '#ffffff',
        auraOpacity: 0.5,
        ringWidth: 2,
        description: 'Singularity spiral',
        tier: 'sol',
        solPrice: 0.015,
    },
    {
        id: 'plasma-saw',
        name: 'Plasma Saw',
        cost: 0,
        glowColor: '#ef4444',
        borderColor: '#ef4444',
        auraOpacity: 0.6,
        ringWidth: 3,
        description: 'Hazardous rotation',
        tier: 'sol',
        solPrice: 0.018,
    },
    {
        id: 'nebula-spiral',
        name: 'Nebula Spiral',
        cost: 0,
        glowColor: '#f0abfc',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 0,
        description: 'Celestial vortex',
        tier: 'sol',
        solPrice: 0.022,
    },
    {
        id: 'hypnotic-vortex',
        name: 'Hypnotic Vortex',
        cost: 0,
        glowColor: '#ffffff',
        borderColor: '#000000',
        auraOpacity: 0.7,
        ringWidth: 0,
        description: 'Infinite grayscale wave',
        tier: 'sol',
        solPrice: 0.025,
    },
    {
        id: 'titan-guard',
        name: 'Titan Guard',
        cost: 0,
        glowColor: '#fbbf24',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 5,
        description: 'Elite cosmic protection',
        tier: 'sol',
        solPrice: 0.030,
    },
];

export function getFrameById(id: string): TokenFrame {
    return TOKEN_FRAMES.find(f => f.id === id) || TOKEN_FRAMES[0];
}
