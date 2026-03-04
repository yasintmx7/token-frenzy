export interface TokenFrame {
    id: string;
    name: string;
    cost: number;
    glowColor: string;
    borderColor: string;
    auraOpacity: number;
    ringWidth: number;
    description: string;
}

export const TOKEN_FRAMES: TokenFrame[] = [
    {
        id: 'default',
        name: 'Standard',
        cost: 0,
        glowColor: 'transparent',
        borderColor: 'transparent',
        auraOpacity: 0,
        ringWidth: 0,
        description: 'No frame'
    },
    {
        id: 'stardust-burst',
        name: 'Stardust Burst',
        cost: 35000,
        glowColor: '#ffffff',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 0,
        description: 'Explosive energy trail'
    },
    {
        id: 'hypnotic-vortex',
        name: 'Hypnotic Vortex',
        cost: 75000,
        glowColor: '#ffffff',
        borderColor: '#000000',
        auraOpacity: 0.7,
        ringWidth: 0,
        description: 'Infinite grayscale wave'
    },
    {
        id: 'nebula-spiral',
        name: 'Nebula Spiral',
        cost: 65000,
        glowColor: '#f0abfc',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 0,
        description: 'Celestial vortex'
    },
    {
        id: 'titan-guard',
        name: 'Titan Guard',
        cost: 95000,
        glowColor: '#fbbf24',
        borderColor: '#ffffff',
        auraOpacity: 0.8,
        ringWidth: 5,
        description: 'Elite cosmic protection'
    },
    {
        id: 'glitch-nexus',
        name: 'Glitch Nexus',
        cost: 45000,
        glowColor: '#ff00ff',
        borderColor: '#ffffff',
        auraOpacity: 0.6,
        ringWidth: 4,
        description: 'Fractured digital aura'
    },
    {
        id: 'energy-nova',
        name: 'Energy Nova',
        cost: 50000,
        glowColor: '#00ffff',
        borderColor: '#00ffff',
        auraOpacity: 0.7,
        ringWidth: 4,
        description: 'Pulsing cyan core'
    },
    {
        id: 'void-vortex',
        name: 'Void Vortex',
        cost: 55000,
        glowColor: '#7c3aed',
        borderColor: '#ffffff',
        auraOpacity: 0.5,
        ringWidth: 2,
        description: 'Singularity spiral'
    },
    {
        id: 'plasma-saw',
        name: 'Plasma Saw',
        cost: 60000,
        glowColor: '#ef4444',
        borderColor: '#ef4444',
        auraOpacity: 0.6,
        ringWidth: 3,
        description: 'Hazardous rotation'
    },
    {
        id: 'radar-pulse',
        name: 'Radar Pulse',
        cost: 48000,
        glowColor: '#dc2626',
        borderColor: '#ffffff',
        auraOpacity: 0.4,
        ringWidth: 2,
        description: 'Target acquired'
    }
];

export function getFrameById(id: string): TokenFrame {
    return TOKEN_FRAMES.find(f => f.id === id) || TOKEN_FRAMES[0];
}
