# Intro Prelude Rules

The landing page's boot sequence: black void, red Three.js button, `pppopipupu` slamming in letter
by letter on a 180 BPM Tone.js score, then a morph onto the landing canvas word.

- One clock, one score. The director reads `introAudio.elapsed()` (the audio clock minus output
  latency), never a `performance.now()` / `useFrame` clock, or the letters drift off the drum hits.
  Every impact time, drum, note and easing curve lives in `introConfig.ts`, shared by the sequencer
  and the director; the sequencer schedules the single clock-ordered `INTRO_SCORE` list (Tone's
  mono sources throw on same-instant starts, so `buildIntroScore` sorts and drops the losers by
  accent). Never hand-schedule a voice outside it.
- The landings are a pure 4/4 run: one letter per beat, and every touch-down must carry the loudest
  hit in the score - the kick plus the `drop` dive under it (`DROP_NOTES` starts the dive,
  `IMPACT_DIVE` lengths it, `DROP_END_HZ` bottoms it). The `lead` is a bed, never a hit: quiet,
  lowpassed, and it stops on the final landing so `HOLD_HOOK` owns the hold. `node
  crop/verify-score.mjs` pins all of it.
- Geometry identity with the landing canvas is load-bearing: font, extrude options and material
  come from `lib/heroText.ts`, the canvas word must sit at its identity pose when the overlay
  cross-fades, and the handoff is solved in screen pixels (an extrusion's outline is its front
  face, so both sides measure at that plane). `node crop/verify-handoff.mjs` checks it after either
  side changes.
- `useFrame` callbacks mutate refs only: no setState per frame, no allocation in the loop (particles
  are preallocated `Float32Array`s); the intro's React state changes at most three times (press,
  fade, finish).
- The landing page owns the enable/disable preference and the replay button (both in its top-left
  drawer); the overlay only reports `onHandoff` (canvas may start rotating) and `onFinish` (unmount
  me).
