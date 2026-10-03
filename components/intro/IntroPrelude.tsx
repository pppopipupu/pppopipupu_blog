"use client";

// Full-screen intro overlay: owns the score clock (introAudio), the overlay DOM and the page
// scroll lock.

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HERO_CAMERA } from "@/lib/heroText";
import { createIntroSequence, type IntroSequence } from "./introAudio";
import { FADE_DURATION, INTRO_OVERLAY_Z_INDEX } from "./introConfig";
import IntroScene, { type IntroTarget } from "./IntroScene";

const Z_INDEX = INTRO_OVERLAY_Z_INDEX;

export type IntroPreludeProps = {
  /**
   * Screen-pixel rect of the landing page canvas word's visible outline; read at handoff time. An
   * extrusion shows its front face, so this is the front face's projected rect.
   */
  getTarget: () => IntroTarget | null;
  /** The intro word has landed on the canvas rect: the page canvas may start rotating. */
  onHandoff: () => void;
  /** The overlay is done and has faded out; unmount it. */
  onFinish: () => void;
};

type Stage = "press" | "live" | "fading";

export default function IntroPrelude({ getTarget, onHandoff, onFinish }: IntroPreludeProps) {
  const sequence = useMemo<IntroSequence>(() => createIntroSequence(), []);
  const [stage, setStage] = useState<Stage>("press");
  const stageRef = useRef<Stage>("press");
  stageRef.current = stage;

  const handlePress = useCallback(() => {
    if (stageRef.current !== "press") return;
    stageRef.current = "live";
    setStage("live");
    sequence.press();
    void sequence.start();
  }, [sequence]);

  const handleFadeOut = useCallback(() => {
    setStage("fading");
  }, []);

  // Lock the page: nothing behind the overlay should move or scroll while the intro runs.
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  // Fade, then hand control (and the unmount) back to the page.
  useEffect(() => {
    if (stage !== "fading") return;
    const timer = window.setTimeout(() => onFinish(), FADE_DURATION * 1000 + 90);
    return () => window.clearTimeout(timer);
  }, [onFinish, stage]);

  // Never leave the audio graph running if the overlay goes away early (hot reload, navigation).
  useEffect(() => {
    return () => {
      sequence.stop(0.25);
    };
  }, [sequence]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z_INDEX,
        backgroundColor: "#000000",
        overflow: "hidden",
        touchAction: "none",
        overscrollBehavior: "none",
        cursor: stage === "press" ? "crosshair" : "default",
        opacity: stage === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION}s ease-out`,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.3, HERO_CAMERA.z], fov: HERO_CAMERA.fov, near: 0.1, far: 120 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <IntroScene
          sequence={sequence}
          getTarget={getTarget}
          onPress={handlePress}
          onHandoff={onHandoff}
          onFadeOut={handleFadeOut}
        />
      </Canvas>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes intro-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.1; } }
            @keyframes intro-scan { 0% { transform: translateY(-30%); } 100% { transform: translateY(30%); } }
            @keyframes intro-flicker { 0%, 100% { opacity: 0.16; } 46% { opacity: 0.1; } 52% { opacity: 0.22; } }
            .intro-blink { animation: intro-blink 0.9s steps(2, end) infinite; }
            .intro-scanlines {
              background: repeating-linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.05) 0px,
                rgba(255, 255, 255, 0.05) 1px,
                rgba(0, 0, 0, 0) 2px,
                rgba(0, 0, 0, 0) 4px
              );
              mix-blend-mode: screen;
            }
            .intro-vignette {
              background: radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.75) 100%);
            }
            .intro-sweep {
              background: linear-gradient(to bottom, rgba(255,0,60,0) 0%, rgba(255,0,60,0.09) 50%, rgba(255,0,60,0) 100%);
              animation: intro-scan 4.5s linear infinite;
            }
          `,
        }}
      />

      {/* Screen texture: vignette, scanlines, drifting sweep and grain (same tile as the page). */}
      <div className="intro-vignette" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div
        className="intro-scanlines"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }}
      />
      <div className="intro-sweep" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMBAC1PQQX268vAAAAAElFTkSuQmCC')",
          backgroundRepeat: "repeat",
          animation: "intro-flicker 0.24s steps(2, end) infinite",
        }}
      />

      {/* Press prompt. */}
      {stage === "press" && (
        <div
          style={{
            position: "absolute",
            bottom: 54,
            left: 0,
            right: 0,
            textAlign: "center",
            pointerEvents: "none",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          <div
            className="intro-blink"
            style={{
              display: "inline-block",
              border: "3px outset #ff2a4d",
              background: "linear-gradient(135deg, #2a0006 0%, #6b0014 55%, #2a0006 100%)",
              boxShadow: "4px 4px 0 #00ffff, 8px 8px 0 #ff00ff, inset 0 0 26px rgba(255,0,60,0.35)",
              padding: "12px 26px",
              color: "#ffe9ec",
              fontSize: "1.35rem",
              fontWeight: 900,
              letterSpacing: "0.22em",
              textShadow: "0 0 12px #ff003c, 2px 2px 0 #000",
            }}
          >
            ▶ 按下红色按钮 ◀ PRESS THE RED BUTTON
          </div>
        </div>
      )}
    </div>
  );
}
