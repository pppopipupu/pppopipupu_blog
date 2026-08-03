"use client";

const SOUND_FILES: Record<string, { file: string; volume: number }> = {
  pop: { file: "/sounds/pop.ogg", volume: 0.7 },
  whistle: { file: "/sounds/slide_whistle.ogg", volume: 0.45 },
  switch: { file: "/sounds/switch.ogg", volume: 0.5 },
  tick: { file: "/sounds/tick.ogg", volume: 0.55 },
  toss: { file: "/sounds/toss.ogg", volume: 0.5 },
  creak: { file: "/sounds/creak.ogg", volume: 0.5 },
  purr: { file: "/sounds/purr.ogg", volume: 0.4 },
  meow: { file: "/sounds/meow.ogg", volume: 0.45 },
  blip: { file: "/sounds/blip.ogg", volume: 0.35 },
  crackle: { file: "/sounds/crackle.ogg", volume: 0.45 },
};

const cache = new Map<string, HTMLAudioElement>();

export function preloadSounds() {
  Object.entries(SOUND_FILES).forEach(([key, cfg]) => {
    if (cache.has(key)) return;
    const el = new Audio(cfg.file);
    el.volume = cfg.volume;
    el.preload = "auto";
    el.load();
    cache.set(key, el);
  });
}

export function playSound(name: keyof typeof SOUND_FILES, volume?: number) {
  const cfg = SOUND_FILES[name];
  if (!cfg) return;
  let el = cache.get(name);
  if (!el) {
    el = new Audio(cfg.file);
    el.volume = cfg.volume;
    cache.set(name, el);
  }
  if (volume !== undefined) el.volume = volume;
  el.currentTime = 0;
  el.play().catch(() => {});
}
