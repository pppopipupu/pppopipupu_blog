# Component Rules: WebGPU Universe Background

Specification for the WebGPU (vgpu) universe background used by the pinned monochrome article
(`app/articles/second`).

## Files

- `UniverseBackground.tsx`: client component that owns the entire vgpu lifetime - device, canvas
  surface, the single fullscreen effect, the frame loop, and the scroll input. Renders one fixed,
  pointer-transparent canvas.
- `DynamicUniverseBackground.tsx`: `next/dynamic` wrapper with `ssr: false`, so the static export
  never evaluates vgpu on the server. Pages must import this, not `UniverseBackground` directly.
- `universe-shader.ts`: the WGSL source as a template string. Inline on purpose: this project has no
  WGSL bundler loader (Next/Turbopack), unlike the Bun builds under `crop/` which use
  `loader: { ".wgsl": "text" }`. Do not add a `.wgsl` import here without adding loaders for both
  the webpack and Turbopack pipelines in `next.config.ts`.

## Contracts

- The `Params` struct in `universe-shader.ts` is bound by WGSL name through
  `effect(gpu, ...).set({ params: { ... } })`. Keep field order and types in sync with the `state`
  object in `UniverseBackground.tsx`; vgpu packs the buffer from WGSL reflection, so a mismatch is a
  silently wrong image, not a compile error.
- Output is greyscale by construction (`vec3f(lum)` with equal channels). Never introduce a hue
  here: the article page is black and white only.
- `time`, `warp`, `flow`, `pulse` and `flash` are written every frame. `aspect` is resize-class and
  only written from the `onResize` handler - keep it out of the frame loop.
- Scroll input is `window.scroll` (passive). A burst decays with `exp(-dt * BURST_DECAY)` so the
  effect stays visible for roughly half a second after the wheel stops; the shockwave restarts at
  most once per 0.55s so a long inertia scroll does not strobe.
- The frame loop returns early while `document.hidden`; cleanup stops the resize subscription,
  removes the scroll listener and calls `gpu.dispose()` (which also stops the loop and the surface).
- No WebGPU (`"gpu" in navigator` false) or a failed `init()` means the component draws nothing.
  The page must stay readable as plain black with no fallback markup.

## Verification

Pixels are the only proof. Render the shader headlessly against a real device instead of eyeballing
a browser:

```js
import { init, effect, target } from "vgpu/node";
import { UNIVERSE_SHADER } from "./components/space/universe-shader.ts";

const gpu = await init();               // `npx vgpu doctor` first: needs a working adapter
const canvas = target(gpu, { size: [640, 360] });
effect(gpu, UNIVERSE_SHADER, {
  set: { params: { time: 3, warp: 1.3, flow: 9, pulse: 999, flash: 0.25, aspect: 640 / 360, pad0: 0, pad1: 0 } },
}).draw(canvas);
const pixels = await canvas.color.read({ mipLevel: 0, region: "all" });
```

Run it with `node` (Node strips the type annotations) and write the pixels to a PNG to check the
composition. Compare an idle frame (`warp: 0`) with a burst frame: mean luminance must rise and
individual stars must stretch into radial dashes. The `textBand` figure - mean luminance of the
central column band a 720px article column occupies - must stay far below text contrast (< 0.1).

The canvas itself only exists after hydration (`ssr: false`), so a served page with no `<canvas>` in
its HTML is expected. To check the live canvas - and that a wheel event actually changes the frame -
drive headless Chrome over CDP (`--headless=new --enable-unsafe-webgpu --remote-debugging-port`,
then `Page.captureScreenshot` before and after `Input.dispatchMouseEvent` with
`type: "mouseWheel"`), decode both PNGs and compare. Expect a non-black background band while idle,
a clear pixel difference after the wheel, and no console errors.
