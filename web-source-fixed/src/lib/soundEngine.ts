// Web Audio API synthesized sound effects for Token Frenzy
// No external assets needed — all sounds generated procedurally

let audioCtx: AudioContext | null = null;
let _muted = false;
let _sfxEnabled = true;
let _musicEnabled = false;
let _calmMode = false;
let _volume = 0.5;

let _musicOscs: (OscillatorNode | GainNode)[] = [];

const STORAGE_KEY = 'token-frenzy-sound';

function loadSoundPrefs() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      _muted = parsed.muted ?? false;
      _sfxEnabled = parsed.sfxEnabled ?? true;
      _musicEnabled = parsed.musicEnabled ?? false;
      _calmMode = parsed.calmMode ?? false;
      _volume = parsed.volume ?? 0.5;
    }
  } catch { /* ignore */ }
}
loadSoundPrefs();

function saveSoundPrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      muted: _muted,
      sfxEnabled: _sfxEnabled,
      musicEnabled: _musicEnabled,
      calmMode: _calmMode,
      volume: _volume
    }));
  } catch { /* ignore */ }
}

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function resumeAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      updateMusic();
    });
  }
}

// Pre-initializes the AudioContext silently so the first in-game sound plays
// instantly with no stutter. Call this from the Main Menu on first user interaction.
export function prewarmAudio(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    // Resume if suspended (required by browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play a completely silent buffer to "unlock" the audio engine
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // completely silent
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  } catch { /* ignore */ }
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
  if (!ctx || !_sfxEnabled) return;

  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  // 1. Sharp Impact Click
  const snap = ctx.createOscillator();
  const snapGain = createGain(ctx, 0.2);
  snap.type = 'triangle';
  snap.frequency.setValueAtTime(1200, now);
  snap.frequency.exponentialRampToValueAtTime(100, now + 0.03);
  snapGain.gain.setValueAtTime(0.2 * _volume, now);
  snapGain.gain.linearRampToValueAtTime(0.001, now + 0.03);
  snap.connect(snapGain);
  snap.start(now);
  snap.stop(now + 0.03);

  // 2. Resonant Sweep (The "Swoosh")
  const sweep = ctx.createOscillator();
  const sweepGain = createGain(ctx, 0.15);
  sweep.type = 'sawtooth';
  const sweepPitch = 600 + Math.random() * 400;
  sweep.frequency.setValueAtTime(sweepPitch, now);
  sweep.frequency.exponentialRampToValueAtTime(sweepPitch * 3, now + 0.06);
  sweep.frequency.exponentialRampToValueAtTime(sweepPitch * 0.2, now + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
  filter.Q.value = 5;

  sweepGain.gain.setValueAtTime(0, now);
  sweepGain.gain.linearRampToValueAtTime(0.15 * _volume, now + 0.02);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  sweep.connect(filter);
  filter.connect(sweepGain);
  sweep.start(now);
  sweep.stop(now + 0.16);

  // High-frequency noise texture
  const noiseLen = ctx.sampleRate * 0.12;
  const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * 0.4;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = createGain(ctx, 0.08);
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 5000;

  noiseGain.gain.setValueAtTime(0.08 * _volume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noise.connect(hpf);
  hpf.connect(noiseGain);
  noise.start(now);
  noise.stop(now + 0.1);
}

/** Combo jingle — ascending arpeggio that gets more intense with combo level */
export function playCombo(combo: number): void {
  const ctx = getCtx();
  if (!ctx || !_sfxEnabled) return;

  if (ctx.state === 'suspended') ctx.resume();

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
    const t = now + i * 0.08;

    // Sub-note for body
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq / 2, t);
    const subG = createGain(ctx, 0.05);
    subG.gain.setValueAtTime(0, t);
    subG.gain.linearRampToValueAtTime(0.05 * _volume, t + 0.05);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    sub.connect(subG);
    sub.start(t);
    sub.stop(t + 0.3);

    // Main chime note
    const osc = ctx.createOscillator();
    osc.type = intensity > 0.6 ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.4);

    const gain = createGain(ctx, 0);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12 * _volume * (1 + intensity), t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    osc.start(t);
    osc.stop(t + 0.45);
  }
}

/** Bomb explosion — realistic multi-layered explosion */
export function playBomb(): void {
  const ctx = getCtx();
  if (!ctx || !_sfxEnabled) return;

  if (ctx.state === 'suspended') ctx.resume();

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
  if (!ctx || !_sfxEnabled) return;

  if (ctx.state === 'suspended') ctx.resume();

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
  if (!ctx || !_sfxEnabled) return;

  if (ctx.state === 'suspended') ctx.resume();

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

export function setSFXEnabled(enabled: boolean): void {
  _sfxEnabled = enabled;
  saveSoundPrefs();
}

export function setMusicEnabled(enabled: boolean): void {
  _musicEnabled = enabled;
  saveSoundPrefs();
  updateMusic();
}

export function setCalmMode(enabled: boolean): void {
  _calmMode = enabled;
  saveSoundPrefs();
  updateMusic();
}

export function isSFXEnabled(): boolean {
  return _sfxEnabled;
}

export function isMusicEnabled(): boolean {
  return _musicEnabled;
}

export function isCalmMode(): boolean {
  return _calmMode;
}

// ===== PROCEDURAL MUSIC =====

export function updateMusic(): void {
  const ctx = getCtx();

  // Stop existing music
  if (_musicOscs.length > 0) {
    _musicOscs.forEach(node => {
      try { (node as any).stop?.(); } catch (e) { }
    });
    _musicOscs = [];
  }

  if (!ctx || !_musicEnabled || _muted) return;

  // Create a simple calm ambient pad (Minor 7th chord or similar)
  // Frequencies for a calm D minor 7 / G base: G2, D3, F3, A3, C4
  const freqs = _calmMode
    ? [98, 146.83, 174.61, 233.08, 261.63] // Relaxing Eb included G-base
    : [130.81, 196.00, 261.63, 329.63, 392.00]; // Rich C Major Stack

  freqs.forEach((f, i) => {
    // Two oscillators per note for Chorus/Phasing richness
    [f, f * 1.002].forEach((freq, j) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = _calmMode ? 'sine' : 'triangle';
      osc.frequency.value = freq;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = _calmMode ? 400 : 800;
      filter.Q.value = 1;

      g.gain.value = 0;
      const now = ctx.currentTime;
      const targetVol = 0.12 * (1 / freqs.length) * _volume;
      g.gain.linearRampToValueAtTime(targetVol, now + 4 + i);

      // Complex Modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + (i * 0.02) + (j * 0.01);
      lfoGain.gain.value = targetVol * 0.4;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();

      osc.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      osc.start();

      _musicOscs.push(osc, g, lfo, filter);
    });
  });
}
