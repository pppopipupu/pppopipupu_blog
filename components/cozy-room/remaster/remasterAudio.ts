"use client";

// Subtle procedural Web Audio soundscape & interaction cues for the remastered 3D scenes.

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setRemasterAudioMuted(value: boolean) {
  muted = value;
}

export function isRemasterAudioMuted(): boolean {
  return muted;
}

export function playSoftClick(freq = 540) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.58, now + 0.065);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.075);
}

export function playBellToll() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const partials = [
    { freq: 392, amp: 0.07, dur: 1.9 },
    { freq: 784, amp: 0.035, dur: 1.3 },
    { freq: 1175, amp: 0.018, dur: 0.9 },
    { freq: 587.33, amp: 0.025, dur: 1.4 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(p.freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(p.amp, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + p.dur + 0.04);
  }
}

export function playWarmChime(noteIndex = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const base = pentatonic[Math.abs(noteIndex) % pentatonic.length];
  const now = ctx.currentTime;
  [1, 2].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(base * mult, now);
    gain.gain.setValueAtTime(i === 0 ? 0.065 : 0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  });
}

export function playFireWhoosh() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sampleCount = Math.floor(ctx.sampleRate * 0.28);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.sin((i / sampleCount) * Math.PI);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(420, now);
  filter.frequency.exponentialRampToValueAtTime(980, now + 0.14);
  filter.Q.value = 1.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(now);
}
