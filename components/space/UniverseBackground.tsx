"use client";

import { useEffect, useRef } from "react";
import { effect, frameLoop, init, surface } from "vgpu";
import { UNIVERSE_SHADER } from "./universe-shader";

// Scroll pixels to burst energy: a 260px jump fills the burst, so both a mouse wheel notch and a
// trackpad flick register on the first frame.
const SCROLL_FULL_BURST = 260;
const BURST_DECAY = 3.4;
const FLASH_DECAY = 2.4;
const FRAME_DT_CAP = 0.05;

/**
 * Fixed, pointer-transparent WebGPU canvas that paints the article's universe background.
 *
 * Owns the whole vgpu lifetime: device, surface, effect, frame loop and scroll input. Renders
 * nothing at all when the browser has no WebGPU, in which case the article page stays plain black.
 */
export default function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!("gpu" in navigator)) return;

    let disposed = false;
    let release = () => {};

    const start = async () => {
      const gpu = await init();
      if (disposed) {
        gpu.dispose();
        return;
      }
      release = () => gpu.dispose();

      const output = surface(gpu, canvas, { dpr: [1, 1.5] });
      const state = {
        time: 0,
        warp: 0,
        flow: 0,
        pulse: 999,
        flash: 0,
        aspect: output.size[0] / Math.max(output.size[1], 1),
        pad0: 0,
        pad1: 0,
      };
      const bag = { params: state };
      const field = effect(gpu, UNIVERSE_SHADER, { set: bag, label: "Article universe background" });
      gpu.onError((error) => console.error("[universe] gpu error", error));

      const stopResize = output.onResize((event) => {
        state.aspect = event.width / Math.max(event.height, 1);
        field.set({ params: { aspect: state.aspect } });
      });

      let lastScrollY = window.scrollY;
      let burst = 0;
      let lastPulseAt = -10;

      const onScroll = () => {
        const y = window.scrollY;
        const energy = Math.min(1, Math.abs(y - lastScrollY) / SCROLL_FULL_BURST);
        lastScrollY = y;
        burst = Math.min(1.4, burst + energy * 0.9);
        state.flash = Math.min(1, state.flash + energy * 0.5);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      let lastTick = performance.now();
      frameLoop(gpu, (frame) => {
        const now = performance.now();
        const dt = Math.min((now - lastTick) / 1000, FRAME_DT_CAP);
        lastTick = now;
        if (document.hidden) return;

        state.time += dt;
        state.warp = burst;
        burst *= Math.exp(-dt * BURST_DECAY);
        state.flow += dt * (0.6 + burst * 5.5);
        state.flash *= Math.exp(-dt * FLASH_DECAY);
        state.pulse += dt;
        // One shockwave per burst, not per scroll event, so a long inertia scroll stays legible.
        if (burst > 0.3 && state.time - lastPulseAt > 0.55) {
          state.pulse = 0;
          lastPulseAt = state.time;
        }

        field.set({
          params: {
            time: state.time,
            warp: state.warp,
            flow: state.flow,
            pulse: state.pulse,
            flash: state.flash,
          },
        });
        frame.pass(output, field);
      });

      release = () => {
        stopResize();
        window.removeEventListener("scroll", onScroll);
        gpu.dispose();
      };
    };

    start().catch((error) => console.error("[universe] background unavailable", error));

    return () => {
      disposed = true;
      release();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
