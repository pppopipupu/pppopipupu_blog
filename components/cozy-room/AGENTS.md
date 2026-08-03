s# Component Architecture & Style Guidelines: Cozy Room

This document contains instructions for the lazy-loaded R3F low-poly cozy bedroom scene components inside components/cozy-room/.

## Overview

The Cozy Room is a lazy-loaded React Three Fiber scene rendered below the Giscus guestbook on the homepage (app/page.tsx). It renders a warm, colorful low-poly art bedroom with interactive furniture, an OrbitControls camera, Rapier physics toys, bloom postprocessing, sound effects, floating dust particles, and a night sky visible through the window.

## File Layout

- AGENTS.md: This specification.
- CozyRoomScene.tsx: Owns the R3F Canvas, camera, lights, fog, EffectComposer (Bloom/Vignette/Noise), Rapier Physics world, OrbitControls, and the frame loop orchestration. Accepts a `frameloop` prop ("always" | "never").
- Furniture.tsx: Room shell, floor planks, baseboards, bed, nightstand lamp (toggle + breathing), desk with desk items, chair, bookshelf, wardrobe, sofa, coffee table, TV stand with glowing screen, floor lamp, foot bench. Exports shared color constants and the `pointerGlow` helper.
- Decor.tsx: Window with night sky (stars/moon/curtains), window-sill flower pots, wall art x4, wall clock, dartboard (click to throw darts at the pointer), rocking chair, rug, plants x2, cat corner with sleeping cat (detailed low-poly model), ceiling lamp, fireplace with animated flame, bedroom door.
- AngryBall.tsx: Angry ball (安格瑞球) with the /face_angry.png texture and its explosion state machine (idle -> exploding -> respawning -> idle).
- PhysicalToys.tsx: Rapier static colliders (floor/walls/desk/bed/nightstand/threshold) and the dynamic rigid bodies (bouncy ball + gift box) with click-to-launch impulses.
- Particles.tsx: Ambient dust particle system (single BufferGeometry + Points).
- Sounds.tsx: Module-level audio cache + `playSound()`/`preloadSounds()` backed by HTMLAudioElement. Files live in public/sounds/ (pop.ogg, switch.ogg, toss.ogg, tick.ogg, slide_whistle.ogg, creak.ogg, purr.ogg, meow.ogg, blip.ogg, crackle.ogg).
- DynamicCozyRoom.tsx: Lazy-loading wrapper. IntersectionObserver gates mounting of the Canvas (ssr: false via next/dynamic) and pauses/resumes the render loop through the frameloop prop.
- CozyRoomScene.tsx dev hook: in development, `onCreated` exposes `window.__COZYROOM__ = { scene, camera, gl }` so automated tests can locate objects by `name` and dispatch synthetic pointer events on the canvas. Never remove it while dev testing exists.

## Interactive Rules

1. Angry Ball (安格瑞球): sits on the desk at world [3.6, 1.71, -5.8] (local [1.4, 1.71, -0.2] inside the Desk group) with the /face_angry.png texture. Hover scales it up and adds emissive; clicking triggers an explosion state machine (idle -> exploding -> respawning -> idle). The explosion reuses a pre-allocated shard mesh pool with precomputed velocity vectors - never allocate objects per frame. State is kept in a ref, not useState, to avoid rerenders. Explosion plays "pop", respawn landing plays "tick".
2. Nightstand lamp: clicking the lamp shade toggles its PointLight intensity and the shade/bulb emissive (breathing animation while on). Plays "switch". Toggling is allowed even while the ball explodes.
3. Floor lamp: same toggle pattern as the nightstand lamp (shade or pull-cord ball). Name "floor-lamp", six-sided shade, layered base.
4. TV: clicking the glowing screen cycles 4 preset channels (color/emissive/intensity defined in module-level TV_CHANNELS - never allocate per click). Plays "blip". Name "tv-screen".
5. Bedroom door: clicking toggles a smooth rotation toward -0.95 rad (opens into the room, away from the wall at x 8.5). Rotation is lerped inside useFrame from a ref, never state. Plays "creak". Name "door".
6. Cat: clicking toggles asleep/awake; awake raises the head, speeds up tail sway and body breathing. Model details: eyes open when awake and close (scale.y squeeze) when asleep, nose/mouth/whiskers/blush, occasional ear twitch while awake (twitch gated by sin bursts), pink collar + gold bell, tangent-aligned back stripes + belly patch (module-level CAT_STRIPES/CAT_WHISKERS/CAT_TOES), two tucked front paws, hind paw with pink pad + toe dots, 3-segment tail with dark striped tip. Plays "meow" when waking, "purr" when sleeping. Name "cat".
7. Fireplace: clicking a flame boosts the flicker scale/light intensity for 2 seconds (boostRef timer, decayed in useFrame). Plays "crackle". Name "fireplace-flame".
8. Wall clock: clicking makes the pendulum swing wide for 2 seconds. Plays "tick" (reuses the tick.ogg asset). Name "wall-clock".
9. Rocking chair: clicking temporarily increases the rock amplitude and speed for 1.5 seconds. Plays "creak". Name "rocking-chair".
10. Bouncy ball (physics): a dynamic Rapier rigid body resting on the desk at [1.0, 1.45, -5.55]. Clicking applies a random upward impulse (throws it); it bounces off walls/floor with restitution 0.82 and rolls to rest. Plays "slide_whistle". Hover glow via per-mesh material only.
11. Gift box (physics): a dynamic Rapier cuboid on the rug at [1.6, 0.24, 2.2]. Clicking kicks it with a horizontal impulse. Plays "tick".
12. Hover glow + cursor: pointer over furniture mutates material.emissive directly via the shared pointerGlow helper (per-object materials only; never mutate materials shared by multiple meshes). pointerGlow(e, on, cursor=true) also switches document.body.style.cursor to pointer while hovering - pass cursor=false for decorative meshes (wall arts, books, plants, desk top, ceiling lamp, plants) that are NOT clickable.
13. All interactive meshes carry a stable `name` attribute for the dev test hook. Keep names stable: nightstand-lamp, floor-lamp, tv-screen, door, cat, fireplace-flame, wall-clock, rocking-chair, angry-ball (ball mesh in AngryBall), ceiling-lamp (non-interactive, cursor=false).
14. Dartboard: on the back wall at [-6.4, 3.4, -6.6] (left of the bookshelf, faces +z). Clicking anywhere on the board throws a dart from a fixed hand point [0, 0.2, 1.0] in front of the board toward the clicked point (e.point); the dart flies at DART_SPEED (7 u/s) with a slight +z arc, spins around its axis, and sticks tip-first ~0.04 into the board. Pool of 6 pre-allocated darts (module-level DART_SLOTS, round-robin recycle), bull's-eye pulses on impact. Plays "toss" at launch, "tick" on impact. Name "dartboard" (handlers on the group; pointerGlow hits the child mesh under the pointer).

## Postprocessing & Style

- EffectComposer (multisampling 0): Bloom (intensity 0.75, luminanceThreshold 0.5, luminanceSmoothing 0.3, mipmapBlur) + Vignette (offset 0.28, darkness 0.55) + Noise (opacity 0.035).
- The mood is warm and cozy: cream/pink/mint wall palette, amber point lights (ceiling lamp, nightstand lamp, fireplace), low bloom only on emissive surfaces (lamp shades, bulb, moon, stars, fire, flame flash). Do not turn this scene into a neon laboratory look: keep bloom soft, keep fog near (20-46) and warm-dark (#221a3a).
- Point lights never cast shadows; only the main directional light casts a shadow map (1024). dpr capped at [1, 2].

## Rapier Physics Rules

- Physics world wraps Furniture/Decor/PhysicalToys in CozyRoomScene. gravity [0, -9.81, 0].
- Static colliders (one fixed RigidBody with CuboidColliders) cover: floor, four walls, front threshold [0, 0.3, 7.1], desk top, bed mattress, nightstand, wardrobe, sofa, coffee table, TV stand, foot bench. Only a few fixed cuboids - do not add colliders to decorative meshes.
- Dynamic bodies: bouncy ball (colliders="ball") and gift box (colliders="cuboid"). Impulses are applied via `ref.current.applyImpulse({x,y,z}, true)` in click handlers only - never in useFrame.
- Toys may sleep (canSleep) and must not tunnel through floor (keep restitution <= 0.85, no CCD needed).

## Audio Rules

- All sounds are local files in public/sounds/, played through Sounds.tsx (HTMLAudioElement, module-level cache, currentTime reset before play, play() wrapped in catch). Newer ambient assets (creak/purr/meow/blip/crackle) are CC0-style downloads from mixkit.co (free license, commercial use allowed); keep source URLs recorded in the SOUND_FILES comments if the file is ever replaced.
- preloadSounds() runs once when CozyRoomScene mounts. Never create audio elements in useFrame or render loops.
- Sound triggers: angry ball explode -> pop; angry ball respawn -> tick; lamp toggle (nightstand + floor) -> switch; ball launch -> slide_whistle; gift box kick -> tick; door open/close -> creak; rocking chair kick -> creak; cat wake -> meow; cat sleep -> purr; TV channel -> blip; fireplace stoke -> crackle; clock chime -> tick; dart throw -> toss; dart impact -> tick.

## Detail Density Rules (3A low-poly)

- Detail meshes are generated from module-level constant arrays (BOOKS, BRICKS, FRINGE_ANGLES, CLOCK_TICKS, TV_CHANNELS) - never allocate inside render or useFrame.
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
- Layout math must keep furniture inside the walls and clear of each other (no clipping): when moving an object, verify its bounding box against walls (inner faces x=-8.5/8.5, z=-7/7) and against neighbors (bed/nightstand/bench, desk items/angry ball/ball toy, sofa/coffee table/TV stand, window/sill/curtains, cat corner/plants). Wall-hugging decor (wall arts, clock) keeps >= 0.05 clearance from the wall face; rugs sit above the floor planks (top face y=0.12).

## Scene Layout Constants

- Room: x in [-8.5, 8.5], z in [-7, 7], floor y = 0, ceiling y = 8. The front wall (z = 7) is open to the camera with a low wooden threshold. Walls are 0.2 thick, inner faces at x=±8.5 / z=-7.
- Bed along the left wall at [-6.8, 0, 2.6] (mattress x -7.7..-5.5, z 1.45..3.85, headboard against x -7.8); nightstand + lamp at [-7.0, 0, 4.4] (table flush on the floor); foot bench at [-6.0, 0, 5.4]; wardrobe on the left wall at [-7.9, 0, -4.6]; desk at [2.2, 0, -5.6] against the back wall (top [4.4, 1.24, 1.6], y surface 1.285) with the window above it (window center [2.2, 4.8, -6.4], sky plane 8.6 x 8.4 at z -6.65); bookshelf on the back wall left at [-4.2, 0, -6.3] (4 shelves); dartboard on the back wall at [-6.4, 3.4, -6.6] (r 0.8, left of the bookshelf, above the bed, facing +z); chair at [2.6, 0, -4.2] facing the desk; sofa at [6.2, 0, -2.6] facing the back wall; coffee table at [6.2, 0, -4.7]; TV stand + TV at [6.4, 0, -6.3] (screen emissive, channel-cycling); fireplace on the right wall at [8.0, 0, 1.2] (three-segment brick chimney to the ceiling, brick face plates); door on the right wall at [8.15, 0, -5.2] (opens inward -0.95 rad); rocking chair at [2.8, 0, 3.2]; round rug at [0, 0.15, 1.2] (r 3.6/2.6/1.6, top above floor planks at 0.12, keep the group y >= 0.15 to avoid Z-fighting); plants at [8.0, 0, 6.3] (tree) and [8.05, 0, -4.0] (cactus); cat corner at [7.4, 0, 4.8]; floor lamp at [3.8, 0, 4.8] (six-sided shade, pull cord); ceiling lamp at [0, 6.6, 0] (two-link cord to y 8.1); wall clock at [7.2, 5.2, -6.6] (pendulum, 12 ticks); four wall arts (left wall [-8.35, 4.4, 2.6] mountains, right wall [8.38, 4.6, 1.2] sunset, back wall [-3.0, 4.4, -6.6] circle and [6.8, 4.0, -6.6] diamond - keep them on the cream wall, off the night-sky plane).
- Initial camera: [9.2, 7.0, 10.8] fov 45, controls target [0, 2.6, 0], minDistance 6, maxDistance 34, polar clamped to [0.35, 1.25] so side walls never dominate the frame. Fog: [20, 46]. Canvas height 700px.
