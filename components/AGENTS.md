# Component Rules: React & R3F

- SSR: anything importing React Three Fiber or Three.js is client-only. Import it through the
  existing `next/dynamic` wrapper with `{ ssr: false }`; never let a server render evaluate
  Three/R3F code.
- `useFrame` callbacks may only mutate refs. Never call setState per frame and never allocate
  Vector3, material or geometry objects inside the frame loop - allocation belongs in `useMemo` or
  event handlers.
- Per-interaction state that drives animation (toggles, timers, animation phases) lives in refs, so
  interactions never trigger re-renders.
- THREE resources created manually (geometry, material, texture) must be disposed in effect
  cleanup; JSX-declared ones are auto-disposed by R3F.
