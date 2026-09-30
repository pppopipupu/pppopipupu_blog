# Cozy Room Rules

## Interaction

- Hover glow mutates `material.emissive` directly: only ever mutate per-object materials, never
  materials shared by several meshes.
- Click handlers must ignore drags (`if (e.delta > 6) return;`) so orbit-dragging never fires a
  click. Non-clickable decor must pass `cursor=false` to `pointerGlow` so the pointer stays an
  arrow.
- Interactive meshes keep a stable `name` attribute. The dev-only `window.__COZYROOM__` hook and
  those names are used by automated tests - keep both while dev testing exists.
- Keep furniture inside the walls and clear of each other; wall-hugging decor keeps clearance from
  the wall face.

## Line Art Scene

- Line-only by construction: `lineSegments` meshes with the shared `LINE_MAT`; do not introduce
  filled meshes, lights or postprocessing there.
- Thin lines need the canvas raycaster line threshold for hit-testing to be usable.
- Only one of the two scenes may be mounted at a time - the page must keep a single WebGL context.

## Physics

- Only the existing fixed colliders exist for the room shell and furniture; do not add colliders to
  decorative meshes.
- Impulses are applied in click handlers only, never in `useFrame`; restitution stays <= 0.85 so
  toys do not tunnel through the floor.

## WebGL crash safety

- A WebGL failure must never take down the page: keep canvases wrapped in `SceneErrorBoundary`,
  keep the WebGL2 support probe before mounting, and keep the `generation`-key rebuild on
  `webglcontextlost` (bounded retries).
- Keep the dpr cap: two R3F canvases plus bloom and shadows sit close to the WebGL
  context/memory budget.
- The Canvas mounts only when near the viewport and its frameloop stops when scrolled away; keep
  that gating.
