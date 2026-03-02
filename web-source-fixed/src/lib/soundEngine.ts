// Web Audio API synthesized sound effects for Token Frenzy
// No external assets needed — all sounds generated procedurally

let audioCtx: AudioContext | null = null;
let _muted = false;
let _volume = 0.5;

const STORAGE_KEY = 'token-frenzy-sound';

function loadSoundPrefs() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      _muted = parsed.muted ?? false;
      _volume = parsed.volume ?? 0.5;
    }
  } catch { /* ignore */ }
}
loadSoundPrefs();

function saveSoundPrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: _muted, volume: _volume }));
  } catch { /* ignore */ }
}

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function createGain(ctx: AudioContext, volume: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.value = volume * _volume;
  gain.connect(ctx.destination);
  return gain;
}

// ===== SOUND EFFECTS =====

/** Slice sound — short bright swoosh with random pitch variation */
export function playSlice(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = createGain(ctx, 0.15);

  // Main tone — randomized pitch for variety
  const basePitch = 800 + Math.random() * 600;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(basePitch, now);
  osc.frequency.exponentialRampToValueAtTime(basePitch * 2.5, now + 0.06);
  osc.frequency.exponentialRampToValueAtTime(basePitch * 0.5, now + 0.12);

  gain.gain.setValueAtTime(0.15 * _volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.13);

  // Noise burst for "swoosh" texture
  const bufferSize = ctx.sampleRate * 0.08;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseGain = createGain(ctx, 0.06);
  noiseGain.gain.setValueAtTime(0.06 * _volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;

  noise.connect(filter);
  filter.connect(noiseGain);
  noise.start(now);
  noise.stop(now + 0.09);
}

/** Combo jingle — ascending arpeggio that gets more intense with combo level */
export function playCombo(combo: number): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const intensity = Math.min(combo / 20, 1);

  // Number of notes increases with combo
  const noteCount = Math.min(2 + Math.floor(combo / 4), 6);
  const baseFreq = 523 + intensity * 300; // C5 and up

  // Major arpeggio intervals
  const intervals = [0, 4, 7, 12, 16, 19]; // semitones

  for (let i = 0; i < noteCount; i++) {
    const semitone = intervals[i % intervals.length];
    const freq = baseFreq * Math.pow(2, semitone / 12);
    const t = now + i * 0.06;

    const osc = ctx.createOscillator();
    osc.type = intensity > 0.5 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    const gain = createGain(ctx, 0);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08 * _volume * (1 + intensity * 0.5), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.16);
  }
}

/** Bomb explosion — realistic multi-layered explosion */
export function playBomb(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Layer 1: Initial transient "thud" — sharp attack
  const thud = ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(200, now);
  thud.frequency.exponentialRampToValueAtTime(40, now + 0.15);
  const thudGain = createGain(ctx, 0.4);
  thudGain.gain.setValueAtTime(0.4 * _volume, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  thud.connect(thudGain);
  thud.start(now);
  thud.stop(now + 0.25);

  // Layer 2: Sub-bass pressure wave
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(60, now);
  sub.frequency.exponentialRampToValueAtTime(20, now + 0.7);
  const subGain = createGain(ctx, 0.35);
  subGain.gain.setValueAtTime(0.35 * _volume, now + 0.02);
  subGain.gain.linearRampToValueAtTime(0.25 * _volume, now + 0.1);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  sub.connect(subGain);
  sub.start(now);
  sub.stop(now + 0.75);

  // Layer 3: Distorted mid crunch
  const crunch = ctx.createOscillator();
  crunch.type = 'sawtooth';
  crunch.frequency.setValueAtTime(300, now);
  crunch.frequency.exponentialRampToValueAtTime(60, now + 0.3);
  const waveshaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
  }
  waveshaper.curve = curve;
  const crunchGain = createGain(ctx, 0.1);
  crunchGain.gain.setValueAtTime(0.1 * _volume, now);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  crunch.connect(waveshaper);
  waveshaper.connect(crunchGain);
  crunch.start(now);
  crunch.stop(now + 0.4);

  // Layer 4: Filtered noise burst — debris and shrapnel
  const noiseLen = ctx.sampleRate * 0.6;
  const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(2000, now);
  bandpass.frequency.exponentialRampToValueAtTime(300, now + 0.5);
  bandpass.Q.value = 1.5;

  const noiseGain = createGain(ctx, 0.18);
  noiseGain.gain.setValueAtTime(0.18 * _volume, now);
  noiseGain.gain.linearRampToValueAtTime(0.12 * _volume, now + 0.05);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noise.start(now);
  noise.stop(now + 0.6);

  // Layer 5: High crackle tail
  const crackleLen = ctx.sampleRate * 0.3;
  const crackleBuffer = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
  const crackleData = crackleBuffer.getChannelData(0);
  for (let i = 0; i < crackleLen; i++) {
    crackleData[i] = Math.random() > 0.92 ? (Math.random() * 2 - 1) * 0.8 : 0;
  }
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuffer;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 4000;
  const crackleGain = createGain(ctx, 0.08);
  crackleGain.gain.setValueAtTime(0.08 * _volume, now + 0.05);
  crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  crackle.connect(hpf);
  hpf.connect(crackleGain);
  crackle.start(now + 0.03);
  crackle.stop(now + 0.4);
}

/** Game over — descending sad tones */
export function playGameOver(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 392, 349, 262]; // A4 → G4 → F4 → C4

  notes.forEach((freq, i) => {
    const t = now + i * 0.2;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.95, t + 0.25);

    const gain = createGain(ctx, 0);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12 * _volume, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.35);
  });
}

/** Singularity Collapse sound — deep powerful implosion followed by a vacuum blast */
export function playZenCollapse(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Implosion thud
  const implosion = ctx.createOscillator();
  implosion.type = 'sine';
  implosion.frequency.setValueAtTime(400, now);
  implosion.frequency.exponentialRampToValueAtTime(10, now + 0.3);

  const gain = createGain(ctx, 0.4);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4 * _volume, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  implosion.connect(gain);
  implosion.start(now);
  implosion.stop(now + 0.4);

  // High-frequency vacuum "shink"
  const shink = ctx.createOscillator();
  shink.type = 'triangle';
  shink.frequency.setValueAtTime(2000, now);
  shink.frequency.exponentialRampToValueAtTime(4000, now + 0.15);

  const shinkGain = createGain(ctx, 0.2);
  shinkGain.gain.setValueAtTime(0.2 * _volume, now);
  shinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  shink.connect(shinkGain);
  shink.start(now);
  shink.stop(now + 0.2);
}

// ===== CONTROLS =====

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(muted: boolean): void {
  _muted = muted;
  saveSoundPrefs();
}

export function toggleMute(): boolean {
  _muted = !_muted;
  saveSoundPrefs();
  return _muted;
}

export function getVolume(): number {
  return _volume;
}

export function setVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  saveSoundPrefs();
}
