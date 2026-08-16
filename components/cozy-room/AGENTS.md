# Component Architecture & Style Guidelines: Cozy Room

This document contains instructions for the lazy-loaded R3F low-poly cozy bedroom scene components inside components/cozy-room/.

## Overview

The Cozy Room is a lazy-loaded React Three Fiber scene rendered below the Giscus guestbook on the homepage (app/page.tsx): a warm, colorful low-poly bedroom with interactive furniture, an OrbitControls camera, Rapier physics toys, bloom postprocessing, sound effects, floating dust particles, and a night sky visible through the window. Each furniture element's behavior is implemented in its own component — read the code before modifying.

## File Layout

- AGENTS.md: This specification.
- CozyRoomScene.tsx: Owns the R3F Canvas, camera, lights, fog, EffectComposer (Bloom/Vignette/Noise), Rapier Physics world, OrbitControls, and the frame loop orchestration. Accepts a `frameloop` prop ("always" | "never").
- Furniture.tsx: Room shell, floor planks, baseboards, bed, nightstand lamp, desk with desk items, chair, bookshelf, wardrobe, sofa, coffee table, TV stand with glowing screen, floor lamp, foot bench. Exports shared color constants and the `pointerGlow` helper.
- Decor.tsx: Window with night sky (stars/moon/curtains), window-sill flower pots, wall art x4, wall clock, dartboard, rocking chair, rug, plants x2, cat corner with sleeping cat, ceiling lamp, fireplace with animated flame, bedroom door.
- AngryBall.tsx: Angry ball (安格瑞球) with the /face_angry.png texture and its explosion state machine.
- PhysicalToys.tsx: Rapier static colliders and the dynamic rigid bodies (bouncy ball + gift box).
- Particles.tsx: Ambient dust particle system (single BufferGeometry + Points).
- Sounds.tsx: Module-level audio cache + `playSound()`/`preloadSounds()` backed by HTMLAudioElement. Files live in public/sounds/.
- DynamicCozyRoom.tsx: Lazy-loading wrapper. IntersectionObserver gates mounting of the Canvas (ssr: false via next/dynamic), pauses/resumes the render loop through the frameloop prop, and owns the scene switcher (温馨卧室 CozyRoomScene / 线条村庄 LineArtScene) rendered as two retro buttons.
- LineArtScene.tsx: Pure black-and-white scene drawn entirely with 1D line strokes (no meshes) — medieval house yard with half-timbered house (swinging door over interior shelves, smoking chimney), stone well with lowering bucket, cheese wheel on a cart, wandering pig, pecking chicken, windmill, signpost, bonfire, trees, clothesline, hills/sun/moon/stars/clouds, day-night toggle. Own Canvas, OrbitControls, no lights/postprocessing.
- line-wire.ts: Wireframe geometry builders (`wireBox`/`wireCircleXZ`/`wireEllipseXY`/`wireArc`/`wirePoly`/`wirePath`/`wireRectXZ`/`wireRectXY`/`mergeLines`) + the shared black `LINE_MAT`. Cached module-level.
- webgl.ts: Shared WebGL2 probe (`checkWebGL`) used by both scene canvases.
- CozyRoomScene.tsx dev hook: in development, `onCreated` exposes `window.__COZYROOM__ = { scene, camera, gl }` so automated tests can locate objects by `name` and dispatch synthetic pointer events on the canvas. Never remove it while dev testing exists.

## Interaction Rules 
- Hover glow + cursor: pointer over furniture mutates material.emissive directly via the shared pointerGlow helper (per-object materials only; never mutate materials shared by multiple meshes). pointerGlow(e, on, cursor=true) also switches document.body.style.cursor to pointer while hovering — pass cursor=false for decorative meshes (wall arts, books, plants, desk top, ceiling lamp, plants) that are NOT clickable.
- Click handlers must ignore drags (`if (e.delta > 6) return;`) so orbit-dragging the camera never triggers object clicks.
- All interactive meshes carry a stable `name` attribute for the dev test hook. Keep names stable: nightstand-lamp, floor-lamp, tv-screen, door, cat, fireplace-flame, wall-clock, rocking-chair, angry-ball (ball mesh in AngryBall), dartboard (handlers on the group), ceiling-lamp (non-interactive, cursor=false).
- Click state (toggles, timers, animation phases) lives in refs, never useState — no re-renders from interactions; animations lerp inside useFrame.

## Line Art Scene Rules

- The LineArtScene is pure black & white and built **exclusively from one-dimensional line strokes** — every object is a `lineSegments` mesh (shared `LINE_MAT`, never per-object) rendered from a hand-built wireframe `BufferGeometry`. No filled meshes, no lighting, no postprocessing. On the day/night toggle the whole scene flips: background and LINE_MAT swap between `#000`/`#fff`.
- All line geometries come from `line-wire.ts` builders (`wireBox`, `wireCircleXZ`, `wireEllipseXY`, `wireArc`, `wirePoly`, `wirePath`, `wireRectXZ`, `wireRectXY`, `mergeLines`) or module-level merged constants in LineArtScene.tsx (YARD_GEO, HOUSE_ROOF_GEO, HOUSE_FRONT_GEO, SHELVES_GEO, WELL_*, etc.). All are cached module-level and intentionally app-lifetime — never allocate in render or useFrame.
- Interactions (clicks must ignore drags with `if (e.delta > 6) return;`; hover sets pointer cursor via `HoverGroup`):
  - `house-door` — toggles the plank door (hinged right, starts open so the interior shelves show).
  - `cheese-wheel` — click spins it (decays via `exp(-3.2 * delta)`) and makes it hop.
  - `well-bucket` — click lowers it to the ground, pauses, then raises it back to the windlass.
  - `pig` — wanders between random targets with obstacle avoidance (cheese cart / bonfire / signpost / tree), legs swing + body bobs; click makes it jump and do a forward roll.
  - `sun` / `moon` — click toggles day/night (background + LINE_MAT color flip, sun ↔ moon + twinkling stars).
  - `chimney` — toggles rising smoke rings.
  - `windmill` — cycles blade speed 0 / slow / fast.
  - `signpost` — board wobbles.
  - `bonfire` — lights / extinguishes the flame strokes.
  - `tree-1` / `tree-2` — toggles falling leaves.
  - `clothes` — toggles the swaying cloths on the clothesline.
  - `chicken` — hops; pecks continuously.
- Because lines are thin, the Canvas sets `raycaster.params.Line.threshold = 8` so hover/click hit-testing is forgiving. State lives in refs, animations run in useFrame — same rules as the cozy room.
- Only one of the two scenes mounts at a time (the switcher in DynamicCozyRoom unmounts the other Canvas), keeping the page at a single WebGL context. Same WebGL crash-safety rules apply (SceneErrorBoundary + `checkWebGL` from webgl.ts + context-lost rebuild via `generation`); the black-pixel self-check is skipped here because the scene background is white.

## Postprocessing & Style

- EffectComposer (multisampling 0): Bloom (intensity 0.75, luminanceThreshold 0.5, luminanceSmoothing 0.3, mipmapBlur) + Vignette (offset 0.28, darkness 0.55) + Noise (opacity 0.035).
- The mood is warm and cozy: cream/pink/mint wall palette, amber point lights (ceiling lamp, nightstand lamp, fireplace), low bloom only on emissive surfaces (lamp shades, bulb, moon, stars, fire, flame flash). Do not turn this scene into a neon laboratory look: keep bloom soft, keep fog near (20-46) and warm-dark (#221a3a).
- Point lights never cast shadows; only the main directional light casts a shadow map (1024). dpr capped at [1, 2].

## Rapier Physics Rules

- Physics world wraps Furniture/Decor/PhysicalToys in CozyRoomScene. gravity [0, -9.81, 0].
- Static colliders (one fixed RigidBody with CuboidColliders) cover: floor, four walls, front threshold, desk top, bed mattress, nightstand, wardrobe, sofa, coffee table, TV stand, foot bench. Only a few fixed cuboids — do not add colliders to decorative meshes.
- Dynamic bodies: bouncy ball (colliders="ball") and gift box (colliders="cuboid"). Impulses are applied via `ref.current.applyImpulse({x,y,z}, true)` in click handlers only — never in useFrame.
- Toys may sleep (canSleep) and must not tunnel through floor (keep restitution <= 0.85, no CCD needed).

## Audio Rules

- All sounds are local files in public/sounds/, played through Sounds.tsx (HTMLAudioElement, module-level cache, currentTime reset before play, play() wrapped in catch). Newer ambient assets (creak/purr/meow/blip/crackle) are CC0-style downloads from mixkit.co (free license, commercial use allowed); keep source URLs recorded in the SOUND_FILES comments if the file is ever replaced.
- preloadSounds() runs once when CozyRoomScene mounts. Never create audio elements in useFrame or render loops. Sound-to-interaction mapping lives in the component click handlers.

## Detail Density Rules (3A low-poly)

- Detail meshes are generated from module-level constant arrays (BOOKS, BRICKS, FRINGE_ANGLES, CLOCK_TICKS, TV_CHANNELS) — never allocate inside render or useFrame.
- Decorative extras (bed legs, drawer panels, brick sheets, cushion blocks, brass handles) are cheap boxes/cylinders under ~30 meshes per furniture item; total scene stays under ~500 draw calls at dpr [1, 1.5].
- Decorative meshes that are NOT clickable must pass cursor=false to pointerGlow (wall arts, books, plants, desk top, ceiling lamp) so the pointer stays the default arrow.

## WebGL Crash-Safety Rules

- Never let a WebGL failure crash the page: the Canvas is wrapped in SceneErrorBoundary (renders a fallback div instead of exploding), and CozyRoomScene probes WebGL2 support in an effect before mounting the Canvas (shows a static notice when unsupported).
- WebGL contexts can be lost by the browser (GPU reset, too many contexts, software rendering). On `webglcontextlost` the handler calls preventDefault and remounts the whole Canvas through a `generation` key (max 3 rebuilds). A one-shot render self-check 3.5s after mount reads the center pixel and rebuilds once if the frame is entirely black.
- Keep dpr cap at [1, 1.5] to limit GPU memory pressure (bloom + shadows + a second R3F canvas on the homepage).
- `reactStrictMode: false` in next.config.ts: React 19 StrictMode double-mounts R3F Canvases in dev, creating duplicate WebGL contexts that get recycled/lost by the browser. Do not re-enable it.

## Performance & Lifecycle Rules

- All geometries/materials declared via JSX are auto-disposed by R3F on unmount.
- Manually created THREE objects (dust BufferGeometry, night sky star BufferGeometry, angry ball TextureLoader texture) must be disposed in useEffect cleanup.
- useFrame callbacks may only mutate refs (position/rotation/scale/material props). Never create Vector3, material, or geometry objects inside useFrame. Allocation is allowed only in event callbacks and useMemo.
- The Canvas is mounted only when the wrapper's IntersectionObserver reports the section is near the viewport; frameloop switches to "never" when scrolled far away, and resumes on return.
- Layout math must keep furniture inside the walls (inner faces x=-8.5/8.5, z=-7/7) and clear of each other; wall-hugging decor keeps >= 0.05 clearance from the wall face; rugs sit above the floor planks (top face y=0.12).

## Scene Layout Constants

- Room: x in [-8.5, 8.5], z in [-7, 7], floor y = 0, ceiling y = 8. The front wall (z = 7) is open to the camera with a low wooden threshold. Walls are 0.2 thick, inner faces at x=±8.5 / z=-7.
- Initial camera: [9.2, 7.0, 10.8] fov 45, controls target [0, 2.6, 0], minDistance 6, maxDistance 34, polar clamped to [0.35, 1.25] so side walls never dominate the frame. Fog: [20, 46]. Canvas height 700px.
