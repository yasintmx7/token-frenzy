import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
}

const COMMON_PROPS = {
    width: "48",
    height: "48",
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
};

export const ClassicIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* Solid Hexagon base with lightning carve-out (30/60 angles) */}
        <path d="M24 4L41.32 14V34L24 44L6.68 34V14L24 4Z" fill={color} />
        <path d="M28 12L16 26H24V36L36 22H28V12Z" fill="black" fillOpacity="0.7" />
    </svg>
);

export const FrenzyIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* 2 Overlapping Teardrops - Silhouette Logo Style */}
        <path d="M24 42C33.94 42 42 33.94 42 24C42 12 24 4 24 4C24 4 6 12 6 24C6 33.94 14.06 42 24 42Z" fill={color} fillOpacity="0.4" />
        <path d="M24 38C31.73 38 38 31.73 38 24C38 14 24 8 24 8C24 8 10 14 10 24C10 31.73 16.27 38 24 38Z" fill={color} />
    </svg>
);

export const ChillIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* 3 Thick Wave Bars Stacked with Rhythm Spacing */}
        <rect x="4" y="10" width="40" height="6" rx="3" fill={color} fillOpacity="0.2" />
        <rect x="4" y="21" width="40" height="6" rx="3" fill={color} fillOpacity="0.6" />
        <rect x="4" y="32" width="40" height="6" rx="3" fill={color} />
    </svg>
);

export const SplitIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* Sharp Pulse Zigzag cut from Square */}
        <rect x="6" y="6" width="36" height="36" rx="8" fill={color} />
        <path d="M4 24H16L21 10L27 38L32 24H44" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
);

export const TwinIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* Two Solid Overlapping Discs with center negative cut */}
        <circle cx="16" cy="24" r="14" fill={color} fillOpacity="0.4" />
        <circle cx="32" cy="24" r="14" fill={color} />
        <circle cx="24" cy="24" r="6" fill="black" fillOpacity="0.7" />
    </svg>
);

export const LaserIcon = ({ size = 32, color = "currentColor", ...props }: IconProps) => (
    <svg {...COMMON_PROPS} width={size} height={size} {...props}>
        {/* Target with Thick Rings and Crosshair Break */}
        <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="7" />
        <circle cx="24" cy="24" r="6" fill={color} />
        <rect x="20" y="0" width="8" height="12" fill="black" />
        <rect x="20" y="36" width="8" height="12" fill="black" />
        <rect x="0" y="20" width="12" height="8" fill="black" />
        <rect x="36" y="20" width="8" height="8" fill="black" />
    </svg>
);
