export interface Point {
    x: number;
    y: number;
    time: number;
}

export const TRAIL_CONFIG = {
    lifeMs: 260,            // slightly longer = smoother dissipation
    minWidth: 5,            // a bit thinner at slow speed (more “blade-like”)
    maxWidth: 32,           // stronger punch at fast swipes
    minDist: 4,             // Min distance to log points
    glowBlur: 18,           // more bloom like the references
    coreWidthRatio: 0.18,   // core should be thinner (reference core is sharp)
    glowAlpha: 0.9,         // richer cyan glow
    coreAlpha: 1.0,         // keep white core max
    ghostAlpha: 0.08,       // ghost is VERY subtle in the reference

    coreColor: '248, 255, 255',
    glowColor: '0, 240, 255',     // closer to neon-cyan
    ghostColor: '120, 140, 165'
};

// Easing function for smooth fade outs (ease-out cubic)
function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export class SwipeTrailRenderer {
    // Catmull-Rom spline interpolation for smooth curves (no jagged corners)
    static getSmoothPoints(points: Point[], segments: number = 4): Point[] {
        if (points.length < 2) return points;
        if (points.length === 2) return points;

        const result: Point[] = [];
        const pts = [points[0], ...points, points[points.length - 1]];

        for (let i = 1; i < pts.length - 2; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2];

            for (let t = 0; t < segments; t++) {
                const t1 = t / segments;
                const t2 = t1 * t1;
                const t3 = t2 * t1;

                const x = 0.5 * (
                    (2 * p1.x) +
                    (-p0.x + p2.x) * t1 +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
                );

                const y = 0.5 * (
                    (2 * p1.y) +
                    (-p0.y + p2.y) * t1 +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
                );

                const time = p1.time + (p2.time - p1.time) * t1;
                result.push({ x, y, time });
            }
        }
        result.push(pts[pts.length - 2]);
        return result;
    }

    static drawPass(
        ctx: CanvasRenderingContext2D,
        points: Point[],
        widths: number[],
        alphas: number[],
        rgb: string,
        blur: number
    ) {
        if (points.length < 2) return;

        const left: Point[] = [];
        const right: Point[] = [];

        // 1. Calculate Normals and offsets
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            let dx = 0, dy = 0;

            if (i === 0) {
                dx = points[i + 1].x - p.x;
                dy = points[i + 1].y - p.y;
            } else if (i === points.length - 1) {
                dx = p.x - points[i - 1].x;
                dy = p.y - points[i - 1].y;
            } else {
                // Average normal from adjacent points
                dx = points[i + 1].x - points[i - 1].x;
                dy = points[i + 1].y - points[i - 1].y;
            }

            const len = Math.sqrt(dx * dx + dy * dy);
            let nx = 0, ny = 0;
            if (len > 0) {
                nx = -dy / len;
                ny = dx / len;
            }

            const w = widths[i] / 2;
            left.push({ x: p.x + nx * w, y: p.y + ny * w, time: p.time });
            right.push({ x: p.x - nx * w, y: p.y - ny * w, time: p.time });
        }

        // 2. Draw quadrilateral segments for varying alpha support
        ctx.shadowBlur = blur;
        ctx.shadowColor = blur > 0 ? `rgba(${rgb}, 1)` : 'transparent';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = left[i];
            const p2 = left[i + 1];
            const p3 = right[i + 1];
            const p4 = right[i];

            const alpha = alphas[i];
            if (alpha <= 0.01) continue;

            const fillAlpha = Math.min(1, Math.max(0, alpha));
            ctx.fillStyle = `rgba(${rgb}, ${fillAlpha})`;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fill();

            // Extremely thin stroke prevents antialiasing subpixel gaps between quads
            ctx.strokeStyle = `rgba(${rgb}, ${fillAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    static render(ctx: CanvasRenderingContext2D, rawPoints: Point[], customColors?: { core: string, glow: string, ghost: string }) {
        if (rawPoints.length < 2) return;

        // Filter points by lifetime
        const now = Date.now();
        const activePoints = rawPoints.filter(p => now - p.time <= TRAIL_CONFIG.lifeMs);
        if (activePoints.length < 2) return;

        // Smooth points
        const points = this.getSmoothPoints(activePoints, 4);

        const widths: number[] = [];
        const coreWidths: number[] = [];
        const glowAlphas: number[] = [];
        const coreAlphas: number[] = [];

        // Calculate speeds and widths
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const age = now - p.time;
            const lifePct = Math.max(0, 1 - (age / TRAIL_CONFIG.lifeMs));

            // Taper at ends. Tip is thin. Tail fades thin.
            const indexObj = i / (points.length - 1); // 0 to 1 along length
            // Parabolic taper so the middle is thicker than the ends, but tip retains some weight
            const taper = Math.sin(indexObj * Math.PI) * 0.8 + 0.2;

            // Calculate localized speed
            let speed = 0;
            if (i > 0) {
                const prev = points[i - 1];
                const dt = Math.max(1, p.time - prev.time);
                const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
                speed = dist / dt;
            }

            // Width and brightness based on speed
            const speedFactor = Math.min(1, Math.max(0, speed / 5)); // Tune standard speed
            const targetWidth = TRAIL_CONFIG.minWidth + (TRAIL_CONFIG.maxWidth - TRAIL_CONFIG.minWidth) * speedFactor;

            // Final width includes taper and life easing
            const w = targetWidth * taper * easeOut(lifePct);
            widths.push(w);
            coreWidths.push(w * TRAIL_CONFIG.coreWidthRatio);

            // Fast wipes are brighter
            const brightness = 0.5 + 0.5 * speedFactor;
            glowAlphas.push(TRAIL_CONFIG.glowAlpha * easeOut(lifePct) * brightness);
            coreAlphas.push(TRAIL_CONFIG.coreAlpha * easeOut(lifePct) * brightness);
        }

        ctx.save();

        // Additive blending for neon bloom effect
        ctx.globalCompositeOperation = 'lighter';

        const glowColor = customColors ? customColors.glow : TRAIL_CONFIG.glowColor;
        const coreColor = customColors ? customColors.core : TRAIL_CONFIG.coreColor;
        const ghostColor = customColors ? customColors.ghost : TRAIL_CONFIG.ghostColor;

        // Optional Ghost pass (slower fading, thin line trailing slightly behind)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        // Fade ghost line along the path via linear gradient (approximation)
        if (points.length > 2) {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(${ghostColor}, ${TRAIL_CONFIG.ghostAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // Outer Glow Pass
        this.drawPass(ctx, points, widths, glowAlphas, glowColor, TRAIL_CONFIG.glowBlur);

        // Inner Core Pass
        this.drawPass(ctx, points, coreWidths, coreAlphas, coreColor, 2);

        ctx.restore();
    }
}
