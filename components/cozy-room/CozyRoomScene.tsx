"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import Furniture from "./Furniture";
import Decor from "./Decor";
import DustParticles from "./Particles";
import { PhysicalToys, RoomColliders } from "./PhysicalToys";
import SceneErrorBoundary from "./SceneErrorBoundary";
import { preloadSounds } from "./Sounds";

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    const ok = gl.getContextAttributes() !== null;
    const lose = gl.getExtension("WEBGL_lose_context") as { loseContext: () => void } | null;
    if (lose) lose.loseContext();
    return ok;
  } catch {
    return false;
  }
}

const MAX_REBUILDS = 3;

const FALLBACK_STYLE: React.CSSProperties = {
  width: "100%",
  height: "700px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#0a0a1a",
  color: "#ffb37e",
  fontFamily: "monospace",
  fontSize: "0.95rem",
  textAlign: "center",
  padding: "0 24px",
  boxSizing: "border-box",
};

export default function CozyRoomScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [generation, setGeneration] = useState(0);
  const rebuilds = React.useRef(0);

  useEffect(() => {
    preloadSounds();
    setWebglOk(checkWebGL());
  }, []);

  const rebuild = React.useCallback(() => {
    rebuilds.current += 1;
    if (rebuilds.current <= MAX_REBUILDS) {
      setGeneration((g) => g + 1);
    }
  }, []);

  if (webglOk === null) {
    return <div style={FALLBACK_STYLE}>检测 WebGL 支持…</div>;
  }
  if (!webglOk) {
    return <div style={FALLBACK_STYLE}>⚠ 当前浏览器/设备不支持 WebGL2,3D 卧室无法显示</div>;
  }

  return (
    <SceneErrorBoundary>
      <div style={{ position: "relative", width: "100%", height: "700px", backgroundColor: "#1c1733" }}>
        <Canvas
          key={generation}
          frameloop={frameloop}
          camera={{ position: [9.2, 7.0, 10.8], fov: 45 }}
          dpr={[1, 1.5]}
          shadows
          gl={{ antialias: true }}
          onCreated={({ gl, scene, camera }) => {
            if (process.env.NODE_ENV === "development") {
              (window as unknown as Record<string, unknown>).__COZYROOM__ = { scene, camera, gl };
            }
            const canvasEl = gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              rebuild();
            };
            canvasEl.addEventListener("webglcontextlost", onLost);
            if (frameloop === "always") {
              window.setTimeout(() => {
                try {
                  const ctx = gl.getContext();
                  if (!ctx) return;
                  const px = new Uint8Array(4);
                  ctx.readPixels(
                    Math.floor(canvasEl.width / 2),
                    Math.floor(canvasEl.height / 2),
                    1,
                    1,
                    ctx.RGBA,
                    ctx.UNSIGNED_BYTE,
                    px
                  );
                  if (px[0] === 0 && px[1] === 0 && px[2] === 0) rebuild();
                } catch {
                  /* context already gone, the lost handler will rebuild */
                }
              }, 3500);
            }
          }}
        >
        <color attach="background" args={["#1c1733"]} />
        <fog attach="fog" args={["#221a3a", 20, 46]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[4, 7, -3]}
          intensity={1.35}
          color="#ffd9a0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <directionalLight position={[-3, 5, 9]} intensity={0.3} color="#8fa4ff" />
        <Physics gravity={[0, -9.81, 0]}>
          <RoomColliders />
          <Furniture />
          <Decor />
          <PhysicalToys />
        </Physics>
        <DustParticles />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.75} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette offset={0.28} darkness={0.55} />
          <Noise opacity={0.035} />
        </EffectComposer>
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          target={[0, 2.6, 0]}
          minDistance={6}
          maxDistance={34}
          minPolarAngle={0.35}
          maxPolarAngle={1.25}
          enablePan={false}
        />
      </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
