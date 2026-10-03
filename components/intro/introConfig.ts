// Intro prelude score: the fixed 180 BPM timeline shared by the sequencer (introAudio.ts) and the
// director (IntroScene.tsx). Both read the same clock, the audio context's.

export const INTRO_BPM = 180;
export const INTRO_BEAT = 60 / INTRO_BPM; // 1/3 s
export const INTRO_EIGHTH = INTRO_BEAT / 2; // 1/6 s

// One bar of count-in (8th hats, kick, snare fill, riser) before the first letter lands.
export const COUNT_IN_BEATS = 4;
export const GRID_START = COUNT_IN_BEATS * INTRO_BEAT; // 1.3333 s

// Impact slots as 8th-note steps from the grid start: one letter per beat (a pure 4/4 run from the
// downbeat), so every flight gap, dive and fade below keys off the beat.
export const IMPACT_STEPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];
export const IMPACT_TIMES = IMPACT_STEPS.map((step) => GRID_START + step * INTRO_EIGHTH);
export const IMPACT_COUNT = IMPACT_TIMES.length;
export const LAST_IMPACT_TIME = IMPACT_TIMES[IMPACT_COUNT - 1]; // 4.3333 s

// The whole word holds for two beats (pulsing on the beat), then eases into the landing canvas.
export const HOLD_BEATS = 2;
export const HANDOFF_TIME = LAST_IMPACT_TIME + HOLD_BEATS * INTRO_BEAT; // 5 s
export const HANDOFF_DURATION = 0.62;
export const FADE_DURATION = 0.34;

// The drum groove loops for four bars from the downbeat; the fade starts just before the handoff,
// so the overlay is gone while the hook's last note rings out under it.
export const MUSIC_BARS = 4;
export const MUSIC_FADE_START = HANDOFF_TIME - 0.1; // 4.9 s
export const MUSIC_FADE_SECONDS = 1.0;
export const MUSIC_LENGTH = MUSIC_FADE_START + MUSIC_FADE_SECONDS; // 5.9 s: the music is gone here

// The dive under every letter: where the falling sine starts, an E minor pentatonic arc that
// climbs towards the last letter so the impacts build.
export const DROP_NOTES = ["E3", "G3", "B3", "D4", "B3", "A3", "G3", "A3", "B3", "E4"];
// Hertz the dive falls to, and the share of the hit's duration the fall takes: steep enough to read
// as a drop rather than a glide.
export const DROP_END_HZ = 33;
export const DROP_FALL_SHARE = 0.6;
// Dive length. The landings are one beat apart, so the dive has to finish inside its own beat or
// one letter's sub smears into the next letter's kick.
export const IMPACT_DIVE = 0.3;

// The high instrument is a bed, never an impact accent: a two-bar ostinato over the groove (8th
// steps, 16 per loop) that stops on the final impact so HOLD_HOOK takes the hold on its own.
export const LEAD_STEPS: { step: number; note: string; eighths: number }[] = [
  { step: 0, note: "E5", eighths: 2 },
  { step: 2, note: "G5", eighths: 1 },
  { step: 3, note: "A5", eighths: 1 },
  { step: 5, note: "G5", eighths: 1 },
  { step: 6, note: "E5", eighths: 2 },
  { step: 8, note: "D5", eighths: 2 },
  { step: 10, note: "E5", eighths: 1 },
  { step: 11, note: "G5", eighths: 3 },
  { step: 14, note: "A5", eighths: 2 },
  { step: 15, note: "B5", eighths: 1 },
];
// Far under the impacts: the bed must never be mistaken for the hit.
export const LEAD_BED_VELOCITY = 0.22;

/** Every voice the intro graph plays; ScoreHit.drum is one of these. */
export type IntroDrum =
  | "kick"
  | "sub"
  // The dive that follows the kick on every letter impact.
  | "drop"
  | "snare"
  | "clap"
  | "hat"
  | "openHat"
  | "tom"
  | "crash"
  | "smack"
  | "riser"
  | "bass"
  | "lead";

/** Accent layer the impacts drive. */
export type ImpactAccent = Extract<IntroDrum, "snare" | "clap" | "tom" | "crash">;

// Extra accent layered over the kick that hits with every letter: crash bookends the run, the
// snare/clap/tom rotation colours the middle so ten identical quarter-note hits still build.
export const IMPACT_EXTRA: ImpactAccent[] = [
  "crash",
  "snare",
  "tom",
  "clap",
  "snare",
  "tom",
  "snare",
  "clap",
  "tom",
  "crash",
];

// Two-bar groove over 16 8th-note steps.
export const KICK_STEPS = [0, 3, 4, 6, 8, 11, 12, 14];
export const SNARE_STEPS = [2, 6, 10, 14];
export const CLAP_STEPS = [2, 6, 10, 14];
export const CLOSED_HAT_STEPS = [0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14];
export const OPEN_HAT_STEPS = [3, 7, 11, 15];
export const GROOVE_STEPS = 16;

// Driving 8th-note bassline (Em): E minor with a C/B/D turnaround in the second bar.
export const BASS_STEPS: { step: number; note: string }[] = [
  { step: 0, note: "E2" },
  { step: 1, note: "E2" },
  { step: 2, note: "G2" },
  { step: 3, note: "E2" },
  { step: 4, note: "A2" },
  { step: 5, note: "A2" },
  { step: 6, note: "B2" },
  { step: 7, note: "A2" },
  { step: 8, note: "E2" },
  { step: 9, note: "E2" },
  { step: 10, note: "G2" },
  { step: 11, note: "E2" },
  { step: 12, note: "C3" },
  { step: 13, note: "C3" },
  { step: 14, note: "B2" },
  { step: 15, note: "D3" },
];

// Payoff phrase over the hold, 8th-note offsets after the last impact.
export const HOLD_HOOK: { offset: number; note: string; length: number }[] = [
  { offset: 1, note: "B4", length: INTRO_EIGHTH },
  { offset: 3, note: "E5", length: INTRO_BEAT },
  { offset: 5, note: "G5", length: INTRO_BEAT },
];

// Hard ceiling for the visuals: if the wall clock ever runs past this the intro snaps to its end
// state (tab throttling, stalled audio clock) instead of hanging on a frozen frame.
export const INTRO_HARD_END = MUSIC_LENGTH + 0.6;

// The intro camera pushes in from HERO_CAMERA.z towards this distance during the count-in, so the
// word must be fitted to the tighter framing: it lands after the push-in is over.
export const INTRO_CAMERA_PUSH_IN_Z = 8.4;

// The boot sequence must own the whole viewport: above the thunder panel (99999), the glass
// overlay, the music player and the page's own black plate.
export const INTRO_OVERLAY_Z_INDEX = 100000;

// ---------------------------------------------------------------- score

// Pause between the click and the count-in's first beat: the press blips below sit in this window,
// so the whole score is one monotonic timeline on the shared clock.
export const BOOT_LEAD = 0.35;

/**
 * One scheduled hit. `at` is seconds on the shared clock - 0 is the count-in's first beat, the
 * downbeat is at GRID_START, the boot lead-in is negative - which is the clock the director reads.
 */
export type ScoreHit = {
  at: number;
  drum: IntroDrum;
  note?: string;
  duration: number;
  velocity: number;
  /** Higher accent keeps the hit when two of the same drum land on one instant. */
  accent: number;
};

/** Drums a Tone source plays one note at a time: two starts at one instant throw. */
const POLYPHONIC_DRUMS: ReadonlySet<IntroDrum> = new Set(["lead"]);

/**
 * Orders a score by time, then drops the collisions: a mono drum can only be started once per
 * instant, so the highest accent wins there - which is how the letters' accents replace the groove
 * hits under them instead of fighting them. Everything before this is free-form score writing.
 */
function orderScore(hits: ScoreHit[]): ScoreHit[] {
  const ordered = hits
    .map((hit, index) => ({ hit, index }))
    .sort((a, b) => a.hit.at - b.hit.at || b.hit.accent - a.hit.accent || a.index - b.index)
    .map((entry) => entry.hit);
  const lastAt = new Map<string, number>();
  const score: ScoreHit[] = [];
  for (const hit of ordered) {
    const voice = POLYPHONIC_DRUMS.has(hit.drum) ? `${hit.drum}:${hit.note ?? ""}` : hit.drum;
    const previous = lastAt.get(voice);
    if (previous !== undefined && hit.at <= previous) continue;
    lastAt.set(voice, hit.at);
    score.push(hit);
  }
  return score;
}

export function buildIntroScore(): ScoreHit[] {
  const score: ScoreHit[] = [];
  const hit = (entry: ScoreHit) => score.push(entry);

  // Click feedback, inside the boot lead. Drums only: the lead is the bed, never a hit.
  hit({ at: -BOOT_LEAD + 0.02, drum: "sub", note: "E1", duration: 0.3, velocity: 0.5, accent: 2 });
  hit({ at: -BOOT_LEAD + 0.05, drum: "smack", duration: 0.05, velocity: 0.35, accent: 2 });
  hit({ at: -BOOT_LEAD + 0.06, drum: "hat", duration: 0.03, velocity: 0.4, accent: 2 });

  // Count-in bar: kick on 1 and 3, hats on every 8th, snare fill into the downbeat, one swell.
  hit({ at: 0, drum: "riser", duration: GRID_START + 0.1, velocity: 0.7, accent: 1 });
  hit({ at: 0, drum: "kick", note: "C1", duration: 0.2, velocity: 1, accent: 3 });
  hit({ at: 2 * INTRO_BEAT, drum: "kick", note: "C1", duration: 0.2, velocity: 0.9, accent: 3 });
  for (let step = 0; step < COUNT_IN_BEATS * 2; step++) {
    hit({ at: step * INTRO_EIGHTH, drum: "hat", duration: 0.02, velocity: step % 2 === 0 ? 0.3 : 0.16, accent: 3 });
  }
  hit({ at: 3 * INTRO_BEAT, drum: "snare", duration: 0.05, velocity: 0.45, accent: 3 });
  hit({ at: 3.5 * INTRO_BEAT, drum: "snare", duration: 0.05, velocity: 0.6, accent: 3 });
  hit({ at: 3.75 * INTRO_BEAT, drum: "snare", duration: 0.05, velocity: 0.75, accent: 3 });

  // Groove from the downbeat, on the same 8th grid the letters land on.
  const loops = MUSIC_BARS / 2;
  const loopLength = GROOVE_STEPS * INTRO_EIGHTH;
  for (let loop = 0; loop < loops; loop++) {
    const base = GRID_START + loop * loopLength;
    for (const step of KICK_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "kick", note: "C1", duration: 0.2, velocity: 0.62, accent: 4 });
    }
    for (const step of SNARE_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "snare", duration: 0.12, velocity: 0.5, accent: 4 });
    }
    for (const step of CLAP_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "clap", duration: 0.08, velocity: 0.4, accent: 4 });
    }
    for (const step of CLOSED_HAT_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "hat", duration: 0.02, velocity: step % 2 === 0 ? 0.36 : 0.2, accent: 4 });
    }
    for (const step of OPEN_HAT_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "openHat", duration: 0.1, velocity: 0.24, accent: 4 });
    }
    for (const { step, note } of BASS_STEPS) {
      hit({ at: base + step * INTRO_EIGHTH, drum: "bass", note, duration: INTRO_EIGHTH * 0.85, velocity: 0.62, accent: 4 });
    }
    // The bed, up to the last letter: after that the hold hook is the only lead voice.
    for (const { step, note, eighths } of LEAD_STEPS) {
      const at = base + step * INTRO_EIGHTH;
      if (at > LAST_IMPACT_TIME + 1e-6) continue;
      hit({ at, drum: "lead", note, duration: eighths * INTRO_EIGHTH * 0.9, velocity: LEAD_BED_VELOCITY, accent: 4 });
    }
    // 16th-note snare fill across the last bar, taking over that bar's backbeat.
    if (loop === loops - 1) {
      for (let sixteenth = 0; sixteenth < 8; sixteenth++) {
        hit({
          at: base + (12 + sixteenth * 0.5) * INTRO_EIGHTH,
          drum: "snare",
          duration: 0.05,
          velocity: 0.18 + sixteenth * 0.045,
          accent: 5,
        });
      }
    }
  }

  // Letter impacts: the loudest thing in the score, on the instant the letter touches down.
  for (let index = 0; index < IMPACT_TIMES.length; index++) {
    const at = IMPACT_TIMES[index];
    hit({ at, drum: "kick", note: "C1", duration: 0.2, velocity: 1, accent: 10 });
    hit({ at, drum: "sub", note: "E1", duration: 0.28, velocity: 0.42, accent: 9 });
    hit({ at, drum: "drop", note: DROP_NOTES[index], duration: IMPACT_DIVE, velocity: 0.9 + index * 0.01, accent: 9 });
    hit({ at, drum: "smack", duration: 0.06, velocity: 0.45 + index * 0.012, accent: 9 });
    const extra = IMPACT_EXTRA[index];
    if (extra === "crash") hit({ at, drum: "crash", duration: 1.2, velocity: index === 0 ? 0.4 : 0.55, accent: 9 });
    else if (extra === "snare") hit({ at, drum: "snare", duration: 0.12, velocity: 0.6, accent: 9 });
    else if (extra === "clap") hit({ at, drum: "clap", duration: 0.08, velocity: 0.5, accent: 9 });
    else hit({ at, drum: "tom", note: index % 2 === 0 ? "G2" : "A2", duration: 0.3, velocity: 0.7, accent: 9 });
  }

  for (const { offset, note, length } of HOLD_HOOK) {
    hit({ at: LAST_IMPACT_TIME + offset * INTRO_EIGHTH, drum: "lead", note, duration: length * 0.9, velocity: 0.5, accent: 6 });
  }

  return orderScore(score);
}

export const INTRO_SCORE: readonly ScoreHit[] = buildIntroScore();
