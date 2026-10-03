"use client";

// Tone.js playback of INTRO_SCORE. Absolute scheduling against the context clock, no Transport, so
// the score and `elapsed()` share one time base and the visuals can slave to the audio clock.

import * as Tone from "tone";
import {
  BOOT_LEAD,
  DROP_END_HZ,
  DROP_FALL_SHARE,
  GRID_START,
  INTRO_EIGHTH,
  INTRO_SCORE,
  MUSIC_FADE_SECONDS,
  MUSIC_FADE_START,
  type ScoreHit,
} from "./introConfig";

// Wall-clock grace before the visual clock stops trusting a frozen audio clock.
const STALL_GRACE_MS = 500;
// Sentinel for "the score has not started yet"; the scene treats it as idle.
export const NOT_STARTED = -1e9;

export type IntroSequence = {
  /** Resumes the audio context and builds the graph, safe to call from the click handler. */
  press(): void;
  /** Schedules the score against the context clock. */
  start(): Promise<void>;
  /** Seconds on the score clock: 0 at the count-in's first beat, negative in the boot lead-in. */
  elapsed(): number;
  /** Fade everything out and dispose the graph afterwards. */
  stop(fadeSeconds?: number): void;
  dispose(): void;
};

type Graph = {
  master: Tone.Gain;
  kick: Tone.MembraneSynth;
  sub: Tone.MembraneSynth;
  drop: Tone.MonoSynth;
  snare: Tone.NoiseSynth;
  clap: Tone.NoiseSynth;
  hat: Tone.NoiseSynth;
  openHat: Tone.NoiseSynth;
  tom: Tone.MembraneSynth;
  crash: Tone.NoiseSynth;
  smack: Tone.NoiseSynth;
  riser: Tone.NoiseSynth;
  riserFilter: Tone.Filter;
  riserGain: Tone.Gain;
  bass: Tone.MonoSynth;
  lead: Tone.PolySynth<Tone.Synth>;
  reverb: Tone.Reverb;
  nodes: Tone.ToneAudioNode[];
};

function buildGraph(): Graph {
  const nodes: Tone.ToneAudioNode[] = [];
  const keep = <T extends Tone.ToneAudioNode>(node: T): T => {
    nodes.push(node);
    return node;
  };

  const master = keep(new Tone.Gain(1));
  const compressor = keep(new Tone.Compressor({ threshold: -13, ratio: 3.5, attack: 0.004, release: 0.12 }));
  const limiter = keep(new Tone.Limiter(-1));
  master.chain(compressor, limiter, Tone.getDestination());

  const reverb = keep(new Tone.Reverb({ decay: 1.9, preDelay: 0.012, wet: 1 }));
  const reverbSend = keep(new Tone.Gain(0.3));
  reverbSend.connect(reverb);
  reverb.connect(master);

  const delay = keep(new Tone.FeedbackDelay({ delayTime: INTRO_EIGHTH * 1.5, feedback: 0.32, wet: 0.45 }));
  delay.connect(master);
  delay.connect(reverbSend);

  const kick = keep(new Tone.MembraneSynth({
    pitchDecay: 0.018,
    octaves: 7,
    oscillator: { type: "sine" },
    // Short body: the low end is the drop's job, so the kick only delivers the attack.
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.08 },
  }));
  const kickGain = keep(new Tone.Gain(0.95));
  kick.connect(kickGain);
  kickGain.connect(master);

  const sub = keep(new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 3,
    oscillator: { type: "sine" },
    envelope: { attack: 0.004, decay: 0.5, sustain: 0, release: 0.3 },
  }));
  const subGain = keep(new Tone.Gain(0.55));
  sub.connect(subGain);
  subGain.connect(master);

  // The dive under every letter impact: a sine that falls from the hit's note to DROP_END_HZ, and
  // the loudest voice after the kick because it carries the low end. Saturated, because a sub that
  // small only reads as a drop on laptop speakers through its harmonics.
  const drop = keep(new Tone.MonoSynth({
    oscillator: { type: "sine" },
    filter: { type: "lowpass", Q: 1.1, rolloff: -12 },
    // Tight body: the dive is shorter than a beat, so the amplitude is gone before the next kick.
    envelope: { attack: 0.003, decay: 0.34, sustain: 0.12, release: 0.14 },
    // A short bright blip on the attack is what makes the dive crisp instead of a boomy sine, and
    // it is over before the sub bottom arrives.
    filterEnvelope: { attack: 0.002, decay: 0.11, sustain: 0.05, release: 0.12, baseFrequency: 90, octaves: 4 },
  }));
  const dropSaturate = keep(new Tone.Distortion({ distortion: 0.42, oversample: "2x" }));
  const dropGain = keep(new Tone.Gain(1.15));
  drop.chain(dropSaturate, dropGain);
  dropGain.connect(master);

  const snare = keep(new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
  }));
  const snareFilter = keep(new Tone.Filter({ type: "bandpass", frequency: 1900, Q: 0.8 }));
  const snareGain = keep(new Tone.Gain(0.75));
  snare.chain(snareFilter, snareGain);
  snareGain.connect(master);
  snareGain.connect(reverbSend);

  const clap = keep(new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.002, decay: 0.1, sustain: 0 },
  }));
  const clapFilter = keep(new Tone.Filter({ type: "bandpass", frequency: 1300, Q: 1.4 }));
  const clapGain = keep(new Tone.Gain(0.3));
  clap.chain(clapFilter, clapGain);
  clapGain.connect(master);
  clapGain.connect(reverbSend);

  const hat = keep(new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.0005, decay: 0.03, sustain: 0 },
  }));
  const hatFilter = keep(new Tone.Filter({ type: "highpass", frequency: 8200 }));
  const hatGain = keep(new Tone.Gain(0.34));
  hat.chain(hatFilter, hatGain);
  hatGain.connect(master);

  const openHat = keep(new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.22, sustain: 0.008 },
  }));
  const openHatFilter = keep(new Tone.Filter({ type: "highpass", frequency: 7000 }));
  const openHatGain = keep(new Tone.Gain(0.26));
  openHat.chain(openHatFilter, openHatGain);
  openHatGain.connect(master);
  openHatGain.connect(reverbSend);

  const tom = keep(new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: "sine" },
    envelope: { attack: 0.002, decay: 0.34, sustain: 0, release: 0.2 },
  }));
  const tomGain = keep(new Tone.Gain(0.6));
  tom.connect(tomGain);
  tomGain.connect(master);
  tomGain.connect(reverbSend);

  const crash = keep(new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 1.4, sustain: 0.02 },
  }));
  const crashFilter = keep(new Tone.Filter({ type: "highpass", frequency: 5200 }));
  const crashGain = keep(new Tone.Gain(0.32));
  crash.chain(crashFilter, crashGain);
  crashGain.connect(master);
  crashGain.connect(reverbSend);

  const smack = keep(new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 0.001, decay: 0.07, sustain: 0 },
  }));
  const smackFilter = keep(new Tone.Filter({ type: "bandpass", frequency: 2600, Q: 1.1 }));
  const smackGain = keep(new Tone.Gain(0.5));
  smack.chain(smackFilter, smackGain);
  smackGain.connect(master);

  const riser = keep(new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 1.05, decay: 0.25, sustain: 0.25 },
  }));
  const riserFilter = keep(new Tone.Filter({ type: "highpass", frequency: 300, Q: 1.2 }));
  const riserGain = keep(new Tone.Gain(0.0001));
  riser.chain(riserFilter, riserGain);
  riserGain.connect(master);

  const bass = keep(new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 2.2, rolloff: -24 },
    envelope: { attack: 0.004, decay: 0.13, sustain: 0.32, release: 0.09 },
    filterEnvelope: { attack: 0.004, decay: 0.09, sustain: 0.35, release: 0.09, baseFrequency: 170, octaves: 2.6 },
  }));
  const bassGain = keep(new Tone.Gain(0.42));
  bass.connect(bassGain);
  bassGain.connect(master);

  const lead = keep(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square8" },
    envelope: { attack: 0.002, decay: 0.2, sustain: 0.04, release: 0.3 },
  }));
  // The bed: a quiet, lowpassed chip voice that plays under the impacts, never as one.
  const leadTone = keep(new Tone.Filter({ type: "lowpass", frequency: 3600, Q: 0.6 }));
  const leadGain = keep(new Tone.Gain(0.22));
  lead.chain(leadTone, leadGain);
  leadGain.connect(master);
  leadGain.connect(delay);
  leadGain.connect(reverbSend);

  return {
    master,
    kick,
    sub,
    drop,
    snare,
    clap,
    hat,
    openHat,
    tom,
    crash,
    smack,
    riser,
    riserFilter,
    riserGain,
    bass,
    lead,
    reverb,
    nodes,
  };
}

export function createIntroSequence(): IntroSequence {
  let graph: Graph | null = null;
  let gridStart = Number.POSITIVE_INFINITY; // context time of the score clock's zero
  let wallGridStart = Number.NEGATIVE_INFINITY; // performance.now() ms of that same zero (fallback)
  let audioFailed = false;
  let stalled = false;
  let disposed = false;
  let lastContextTime = Number.NEGATIVE_INFINITY;
  let lastContextStamp = 0;
  const timers = new Set<number>();

  function later(callback: () => void, ms: number) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      callback();
    }, ms);
    timers.add(timer);
  }

  function sleep(ms: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    later(resolve, ms);
    return promise;
  }

  function ensureGraph(): Graph {
    if (!graph) graph = buildGraph();
    return graph;
  }

  function press() {
    if (disposed) return;
    void Tone.start()
      .then(() => {
        if (disposed) return;
        try {
          ensureGraph();
        } catch {
          audioFailed = true;
        }
      })
      .catch(() => {
        audioFailed = true;
      });
  }

  function trigger(g: Graph, hit: ScoreHit, at: number) {
    switch (hit.drum) {
      case "kick":
      case "sub":
      case "tom":
        g[hit.drum].triggerAttackRelease(hit.note ?? "C1", hit.duration, at, hit.velocity);
        break;
      case "drop": {
        // The dive: `triggerAttackRelease` sets the note first, and this replaces it with a fall to
        // DROP_END_HZ. Cancel first so one letter's dive cannot out-vote the next one's ramp.
        const note = hit.note ?? "E3";
        g.drop.triggerAttackRelease(note, hit.duration, at, hit.velocity);
        g.drop.frequency.cancelScheduledValues(at);
        g.drop.frequency.setValueAtTime(note, at);
        g.drop.frequency.exponentialRampToValueAtTime(DROP_END_HZ, at + hit.duration * DROP_FALL_SHARE);
        break;
      }
      case "bass":
        g.bass.triggerAttackRelease(hit.note ?? "E2", hit.duration, at, hit.velocity);
        break;
      case "lead":
        g.lead.triggerAttackRelease(hit.note ?? "E4", hit.duration, at, hit.velocity);
        break;
      default:
        g[hit.drum].triggerAttackRelease(hit.duration, at, hit.velocity);
    }
  }

  function schedule(t0: number) {
    const g = ensureGraph();
    g.master.gain.setValueAtTime(1, t0);
    g.master.gain.setValueAtTime(1, t0 + MUSIC_FADE_START);
    g.master.gain.exponentialRampToValueAtTime(0.0005, t0 + MUSIC_FADE_START + MUSIC_FADE_SECONDS);

    // Riser swell under the count-in: filter sweep plus gain envelope into the downbeat.
    g.riserFilter.frequency.setValueAtTime(260, t0);
    g.riserFilter.frequency.exponentialRampToValueAtTime(6800, t0 + GRID_START);
    g.riserGain.gain.setValueAtTime(0.0001, t0);
    g.riserGain.gain.exponentialRampToValueAtTime(0.5, t0 + GRID_START);
    g.riserGain.gain.exponentialRampToValueAtTime(0.0001, t0 + GRID_START + 0.3);

    // Already ordered by time and free of same-instant collisions per drum, which is what Tone's
    // monophonic sources demand: scheduling them in this order cannot trip its start-time assert.
    for (const hit of INTRO_SCORE) trigger(g, hit, t0 + hit.at);
  }

  async function start() {
    if (disposed) return;
    try {
      await Tone.start();
      if (disposed) return;
      const g = ensureGraph();
      // The reverb impulse is generated on a worker; do not hold the intro hostage to it. The wait
      // stays well under BOOT_LEAD so the boot-lead hits are still scheduled in the future.
      await Promise.race([g.reverb.ready, sleep(220)]);
      if (disposed) return;
      gridStart = Tone.getContext().currentTime + BOOT_LEAD;
      lastContextStamp = performance.now();
      schedule(gridStart);
    } catch {
      // No audio device, blocked context, missing API: the visuals still run on the wall clock.
      audioFailed = true;
      wallGridStart = performance.now() + BOOT_LEAD * 1000;
    }
  }

  // The graph plays `outputLatency` after the context clock: a hit scheduled at T reaches the
  // speakers when the context reads T + latency. The visual clock has to lag by the same amount or
  // every letter lands that far ahead of its drum. Tone's context shim does not implement
  // outputLatency, so in practice this resolves to baseLatency, which covers the graph's own
  // buffering but not the device's - the residual is small enough to read as simultaneous.
  function audibleDelay() {
    const context = Tone.getContext().rawContext as BaseAudioContext & {
      outputLatency?: number;
      baseLatency?: number;
    };
    const latency = context.outputLatency ?? context.baseLatency ?? 0;
    return Number.isFinite(latency) ? latency : 0;
  }

  function elapsed() {
    if (audioFailed || stalled) {
      if (wallGridStart === Number.NEGATIVE_INFINITY) return NOT_STARTED;
      return (performance.now() - wallGridStart) / 1000;
    }
    if (!Number.isFinite(gridStart)) return NOT_STARTED;
    const now = Tone.getContext().currentTime;
    if (now > lastContextTime + 1e-4) {
      lastContextTime = now;
      lastContextStamp = performance.now();
    } else if (performance.now() - lastContextStamp > STALL_GRACE_MS) {
      // Frozen context clock (suspended context, sleeping device): continue on the wall clock from
      // where audio stopped - the visuals must never hang waiting for audio that is not coming back.
      stalled = true;
      wallGridStart = performance.now() - (lastContextTime - audibleDelay() - gridStart) * 1000;
    }
    return lastContextTime - audibleDelay() - gridStart;
  }

  function stop(fadeSeconds = MUSIC_FADE_SECONDS) {
    if (graph && !audioFailed) {
      try {
        const now = Tone.getContext().currentTime;
        graph.master.gain.cancelScheduledValues(now);
        graph.master.gain.rampTo(0, fadeSeconds);
      } catch {
        /* context already gone */
      }
    }
    later(() => dispose(), fadeSeconds * 1000 + 120);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (graph) {
      for (const node of graph.nodes) {
        try {
          node.dispose();
        } catch {
          /* already disposed */
        }
      }
      graph = null;
    }
  }

  return { press, start, elapsed, stop, dispose };
}
