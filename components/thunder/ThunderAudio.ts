"use client";

class ThunderAudioSystem {
  private audioCtx: AudioContext | null = null;
  private audioElements: HTMLAudioElement[] = [];
  private isInitialized = false;

  private initAudio() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }

      const soundUrls = ["/sounds/thunder_strike.ogg", "/sounds/thunder_crack.ogg"];
      soundUrls.forEach((url) => {
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = 0.85;
        this.audioElements.push(audio);
      });

      this.isInitialized = true;
    } catch {}
  }

  public playThunderClap(volume = 0.9) {
    this.initAudio();

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    if (this.audioElements.length > 0) {
      const idx = Math.floor(Math.random() * this.audioElements.length);
      const originalAudio = this.audioElements[idx];
      if (originalAudio) {
        const soundClone = originalAudio.cloneNode() as HTMLAudioElement;
        soundClone.volume = Math.min(1, Math.max(0, volume));
        soundClone.playbackRate = 0.9 + Math.random() * 0.25;
        soundClone.play().catch(() => {});
      }
    }

    if (this.audioCtx) {
      this.synthesizeThunder(this.audioCtx, volume);
    }
  }

  private synthesizeThunder(ctx: AudioContext, volume: number) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    oscGain.gain.setValueAtTime(volume * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.6);

    const bufferSize = ctx.sampleRate * 2.0;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 1.5);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    noiseGain.gain.setValueAtTime(volume * 0.4, now + 0.09);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 2.1);
  }
}

export const thunderAudio = new ThunderAudioSystem();
