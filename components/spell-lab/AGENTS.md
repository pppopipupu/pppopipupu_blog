# Spell Lab WebGPU Renderer

## Architecture

- **WebGPU-only renderer**: Uses `webgpu/SpellLabCanvas` which creates a WebGPU context via `vgpu`. Falls back to a styled Chinese overlay if WebGPU is unavailable or initialization fails.
- **Device ownership**: `vgpu.init({ label: "spell-lab" })` creates and owns the GPU device. The device is passed to `three/webgpu`'s `WebGPURenderer` via the `device` parameter. `vgpu` is responsible for device disposal via `gpu.dispose()`. Three.js does not own an external device.
- **Renderer lifecycle**: Cleanup order is `renderer.dispose()` then `gpu.dispose()`. Device loss is monitored via `gpu.gpu.lost` and surfaced as an error overlay.
- **No WebGL fallback**: The canvas never requests WebGL contexts. Only `webgpu` contexts are used.

## Shader Strategy

- **vgpu/three bindings**: Use `tslExports()` from `vgpu/three` to bind inline WGSL pure functions to TSL nodes. Function parameter names must match WGSL exactly.
- **Inline WGSL only**: WGSL must be written as template strings inline. No `.wgsl` file imports or loaders.
- **No shaderMaterial/onBeforeCompile**: Avoid `shaderMaterial`, `ShaderMaterial`, `onBeforeCompile`. Use `MeshBasicNodeMaterial`/`MeshStandardNodeMaterial` with TSL node composition.
- **Post-processing**: Use `RenderPipeline` from `three/webgpu`, `pass` from `three/tsl`, and `bloom` from `three/addons/tsl/display/BloomNode.js`. Render is triggered manually with `useFrame(() => pipeline.render(), 1)` so R3F skips automatic rendering. Remove `@react-three/postprocessing` usage.

## Components

- `webgpu/SpellLabCanvas.tsx`: WebGPU initialization and Canvas wrapper
- `webgpu/RenderPipeline.tsx`: Post-processing pipeline with bloom
- `webgpu/Skybox.tsx`: Skybox using MeshBasicNodeMaterial + TSL, with inline WGSL via vgpu/three tslExports
- `webgpu/GrassBlades.tsx`: Instanced grass with CPU-animated wind

## Verification

1. Typecheck: `npx tsc --noEmit` - verify zero errors in `app/spell-lab`, `components/SpellLabScene.tsx`, `components/spell-lab/**`, `components/SpellIcons.tsx` (ignore pre-existing `crop/` errors)
2. Start dev server on free port: `npm run dev` (or specify port)
3. Test with headless Chrome: Use `playwright-core` with system Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and flags `--enable-unsafe-webgpu --enable-unsafe-swiftshader`. Open the page via `http://localhost:<port>`, never `http://127.0.0.1:<port>` - Next dev blocks dynamic chunk loading on the latter. `playwright-core` is verification-only: install it ad hoc when needed and NEVER add it to `package.json`.
4. Inject wrapper for `HTMLCanvasElement.prototype.getContext` to verify only `webgpu` contexts are requested (no `webgl`/`webgl2`)
5. Load `/spell-lab`, set `localStorage.setItem('spell-lab-water-enabled', 'false')`, wait for canvas, take screenshot, interact with scene
6. Check for console errors, non-black pixels, and proper rendering
7. If headless WebGPU unavailable, try headed Chrome and report exact errors
