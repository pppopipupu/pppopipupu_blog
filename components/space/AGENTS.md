# WebGPU Universe Background Rules

- Pages must import the `next/dynamic` wrapper (`ssr: false`), never `UniverseBackground`
  directly; the canvas exists only after hydration.
- The WGSL stays inline as a template string on purpose: this project has no WGSL loader in the
  Next webpack/Turbopack pipelines (unlike the Bun builds under `crop/`). Adding a `.wgsl` import
  requires wiring loaders for both pipelines first.
- `Params` is bound to WGSL fields by name reflection (`set({ params: {...} })`): a mismatch is a
  silently wrong image, not a compile error. Keep WGSL field names/types and the JS `state` object
  in sync.
- `aspect` is resize-class: write it from the resize handler only, never from the frame loop.
- Cleanup must remove the listeners and call `gpu.dispose()`; the frame loop returns early while
  `document.hidden`.
- No WebGPU or a failed `init()` means the component draws nothing; the page must stay readable
  with no fallback markup.

## Verification

- Pixels are the only proof. Render the shader headlessly against a real device (vgpu's node entry;
  `npx vgpu doctor` first) and inspect the pixels - a green build proves nothing.
- Compare an idle frame with a burst frame: mean luminance must rise and stars must stretch into
  radial dashes. The center column band the article text occupies must stay far below text
  contrast.
- Live check: drive headless Chrome over CDP (`--headless=new --enable-unsafe-webgpu`) and compare
  screenshots before/after a synthetic wheel event; expect a non-black background and no console
  errors.
