"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import SceneErrorBoundary from "../SceneErrorBoundary";
import { checkWebGL } from "../webgl";
import {
  VILLAGE_THEMES,
  createInkOcclusionMaterial,
  createWeightedLineMaterial,
} from "./inkShader";
import { buildLineVillageSceneData } from "./villageBuilder";
import {
  playBellToll,
  playSoftClick,
  playWarmChime,
} from "./remasterAudio";

function LineMesh({
  geometry,
  material,
  visible = true,
  raycastable = false,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  visible?: boolean;
  raycastable?: boolean;
}) {
  const obj = useMemo(() => {
    const seg = new LineSegments2(
      geometry as unknown as ConstructorParameters<typeof LineSegments2>[0],
      material as unknown as ConstructorParameters<typeof LineSegments2>[1]
    );
    seg.computeLineDistances();
    if (!raycastable) {
      seg.raycast = () => {};
    }
    return seg;
  }, [geometry, material, raycastable]);

  return <primitive object={obj} visible={visible} />;
}

function VillageWorld() {
  const { size, scene } = useThree();
  const data = useMemo(() => buildLineVillageSceneData(), []);

  useEffect(() => {
    return () => {
      data.dispose();
    };
  }, [data]);

  const palette = VILLAGE_THEMES.archival;
  const resolution = useMemo(() => new THREE.Vector2(size.width || 960, size.height || 640), []);

  const materials = useMemo(() => {
    const solid = createInkOcclusionMaterial(palette, { hatchScale: 1.0 });
    const terrain = createInkOcclusionMaterial(palette, { hatchScale: 0.65 });
    const water = createInkOcclusionMaterial(palette, { isWater: true });
    const windowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.windowGlow),
      polygonOffset: true,
      polygonOffsetFactor: 1.5,
      polygonOffsetUnits: 1.5,
    });
    const clockHandMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.inkPrimary),
    });
    const primaryLine = createWeightedLineMaterial(palette.inkPrimary, 1.95, resolution);
    const secondaryLine = createWeightedLineMaterial(palette.inkSecondary, 1.28, resolution);
    const fineLine = createWeightedLineMaterial(palette.inkFine, 0.85, resolution);
    const gridLine = createWeightedLineMaterial(palette.inkFine, 0.7, resolution);
    return {
      solid,
      terrain,
      water,
      windowMat,
      clockHandMat,
      primaryLine,
      secondaryLine,
      fineLine,
      gridLine,
    };
  }, []);

  useEffect(() => {
    scene.background = new THREE.Color(palette.background);
    return () => {
      materials.solid.dispose();
      materials.terrain.dispose();
      materials.water.dispose();
      materials.windowMat.dispose();
      materials.clockHandMat.dispose();
      materials.primaryLine.dispose();
      materials.secondaryLine.dispose();
      materials.fineLine.dispose();
      materials.gridLine.dispose();
    };
  }, [materials, palette.background, scene]);

  useEffect(() => {
    const w = Math.max(1, size.width);
    const h = Math.max(1, size.height);
    resolution.set(w, h);
    materials.primaryLine.resolution.set(w, h);
    materials.secondaryLine.resolution.set(w, h);
    materials.fineLine.resolution.set(w, h);
    materials.gridLine.resolution.set(w, h);
  }, [size.width, size.height, materials, resolution]);

  const windmillRef = useRef<THREE.Group>(null);
  const windmill2Ref = useRef<THREE.Group>(null);
  const waterwheelRef = useRef<THREE.Group>(null);
  const bellRef = useRef<THREE.Group>(null);
  const signRef = useRef<THREE.Group>(null);
  const boatRef = useRef<THREE.Group>(null);
  const boat2Ref = useRef<THREE.Group>(null);
  const birdsRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);
  const ripplesRef = useRef<THREE.Group>(null);
  const smokeRefs = useRef<Array<THREE.Group | null>>([]);
  const minuteHandRefs = useRef<Array<THREE.Mesh | null>>([]);

  const simTimeRef = useRef(0);
  const windmillBoostRef = useRef(0);
  const bellImpulseRef = useRef(0);
  const boatRockImpulseRef = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    simTimeRef.current += delta;
    const t = simTimeRef.current;

    windmillBoostRef.current = Math.max(0, windmillBoostRef.current - delta * 1.4);
    bellImpulseRef.current = Math.max(0, bellImpulseRef.current - delta * 0.45);
    boatRockImpulseRef.current = Math.max(0, boatRockImpulseRef.current - delta * 0.7);

    const spinRate = delta * (0.48 + windmillBoostRef.current * 2.8);
    if (windmillRef.current) windmillRef.current.rotation.z -= spinRate;
    if (windmill2Ref.current) windmill2Ref.current.rotation.z -= spinRate * 0.92;
    if (waterwheelRef.current) waterwheelRef.current.rotation.z += delta * 0.65;
    if (bellRef.current) {
      const swingAmp = 0.04 + bellImpulseRef.current * 0.42;
      bellRef.current.rotation.z = Math.sin(t * 5.2) * swingAmp;
    }
    if (signRef.current) {
      signRef.current.rotation.z = Math.sin(t * 2.1) * 0.075;
    }
    const extraRock = Math.sin(t * 6.5) * boatRockImpulseRef.current * 0.25;
    if (boatRef.current) {
      boatRef.current.position.y = data.boatOrigin.y + Math.sin(t * 1.9) * 0.065;
      boatRef.current.rotation.z = Math.sin(t * 1.4) * 0.045 + extraRock;
      boatRef.current.rotation.x = Math.cos(t * 1.1) * 0.025;
    }
    if (boat2Ref.current) {
      boat2Ref.current.position.y = data.boat2Origin.y + Math.sin(t * 1.7 + 1.2) * 0.065;
      boat2Ref.current.rotation.z = Math.sin(t * 1.3 + 0.8) * 0.045 + extraRock;
      boat2Ref.current.rotation.x = Math.cos(t * 1.0 + 0.6) * 0.025;
    }
    if (birdsRef.current) {
      birdsRef.current.rotation.y = t * 0.16;
      birdsRef.current.position.y = Math.sin(t * 1.2) * 0.75;
    }
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(t * 0.05) * 8.5;
      cloudsRef.current.position.z = Math.cos(t * 0.04) * 4.5;
    }
    if (ripplesRef.current) {
      const flow = (t * 0.9) % 5.0;
      ripplesRef.current.position.z = flow - 2.5;
    }
    for (let i = 0; i < smokeRefs.current.length; i++) {
      const g = smokeRefs.current[i];
      if (!g) continue;
      const chim = data.chimneyTops[i % data.chimneyTops.length];
      const phase = (t * 0.34 + i * 0.17) % 1;
      g.position.set(
        chim.x + Math.sin(t * 0.9 + i) * phase * 0.95,
        chim.y + phase * 4.2,
        chim.z + Math.cos(t * 0.7 + i) * phase * 0.5
      );
      const s = 0.2 + phase * 0.58;
      g.scale.set(s, 1, s);
    }
    for (const hand of minuteHandRefs.current) {
      if (hand) {
        hand.rotation.z = -t * 0.45;
      }
    }
  });

  const smokeSlots = useMemo(() => Array.from({ length: 24 }, (_, idx) => idx), []);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 96, 270]} />

      <OrbitControls
        makeDefault
        target={[-6, 3.5, -6]}
        enableDamping
        dampingFactor={0.07}
        minDistance={8}
        maxDistance={135}
        maxPolarAngle={Math.PI * 0.485}
      />

      {/* Continuous Terrain & Solid Architectural Occlusion Hulls */}
      <mesh geometry={data.terrainGeo} material={materials.terrain} />
      <mesh geometry={data.waterGeo} material={materials.water} />
      <mesh geometry={data.staticOcclusionGeo} material={materials.solid} />
      <mesh geometry={data.windowGlowGeo} material={materials.windowMat} />

      {/* Weighted Architectural Ink Line Layers */}
      <LineMesh geometry={data.primaryLinesGeo} material={materials.primaryLine} />
      <LineMesh geometry={data.secondaryLinesGeo} material={materials.secondaryLine} />
      <LineMesh geometry={data.fineLinesGeo} material={materials.fineLine} />
      <LineMesh geometry={data.gridLinesGeo} material={materials.gridLine} />

      {/* River Ripples */}
      <group ref={ripplesRef}>
        <LineMesh geometry={data.riverRippleGeo} material={materials.fineLine} />
      </group>

      {/* West & East Ridge Windmill Sails */}
      <group position={data.windmillHub} rotation={[0, data.windmillRotY, 0]}>
        <group
          ref={windmillRef}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            windmillBoostRef.current = 1.6;
            playSoftClick(640);
          }}
        >
          <mesh geometry={data.windmillSailsOcclusionGeo} material={materials.solid} />
          <LineMesh geometry={data.windmillSailsLinesGeo} material={materials.primaryLine} />
        </group>
      </group>
      <group position={data.windmillHub2} rotation={[0, data.windmillRotY2, 0]}>
        <group
          ref={windmill2Ref}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            windmillBoostRef.current = 1.6;
            playSoftClick(640);
          }}
        >
          <mesh geometry={data.windmillSailsOcclusionGeo} material={materials.solid} />
          <LineMesh geometry={data.windmillSailsLinesGeo} material={materials.primaryLine} />
        </group>
      </group>

      {/* Waterwheel Rotating Paddle Assembly */}
      <group position={data.waterwheelHub} rotation={[0, data.waterwheelRotY, 0]}>
        <group ref={waterwheelRef}>
          <mesh geometry={data.waterwheelOcclusionGeo} material={materials.solid} />
          <LineMesh geometry={data.waterwheelLinesGeo} material={materials.secondaryLine} />
        </group>
      </group>

      {/* Clocktower Interactive Belfry Bell */}
      <group
        position={data.belfryPivot}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          bellImpulseRef.current = 1.8;
          playBellToll();
        }}
      >
        <group ref={bellRef}>
          <mesh geometry={data.belfryBellOcclusionGeo} material={materials.solid} />
          <LineMesh geometry={data.belfryBellLinesGeo} material={materials.primaryLine} />
        </group>
      </group>

      {/* 4 Clocktower Hands */}
      {[0, 1, 2, 3].map((side) => {
        const angle = (side * Math.PI) / 2 + 0.12;
        const dist = 1.68;
        return (
          <group
            key={side}
            position={[
              data.clockOrigin.x + Math.sin(angle) * dist,
              data.clockOrigin.y,
              data.clockOrigin.z + Math.cos(angle) * dist,
            ]}
            rotation={[0, angle, 0]}
          >
            <mesh
              ref={(el) => {
                minuteHandRefs.current[side] = el;
              }}
              material={materials.clockHandMat}
            >
              <boxGeometry args={[0.055, 0.56, 0.03]} />
            </mesh>
          </group>
        );
      })}

      {/* Tavern Swaying Sign */}
      <group position={data.tavernSignPivot}>
        <group ref={signRef}>
          <mesh geometry={data.tavernSignOcclusionGeo} material={materials.solid} />
          <LineMesh geometry={data.tavernSignLinesGeo} material={materials.secondaryLine} />
        </group>
      </group>

      {/* Two Moored Bobbing River Vessels */}
      <group
        ref={boatRef}
        position={data.boatOrigin}
        rotation={[0, data.boatRotY, 0]}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          boatRockImpulseRef.current = 1.4;
          playWarmChime(2);
        }}
      >
        <mesh geometry={data.boatOcclusionGeo} material={materials.solid} />
        <LineMesh geometry={data.boatLinesGeo} material={materials.primaryLine} />
      </group>
      <group
        ref={boat2Ref}
        position={data.boat2Origin}
        rotation={[0, data.boat2RotY, 0]}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          boatRockImpulseRef.current = 1.4;
          playWarmChime(4);
        }}
      >
        <mesh geometry={data.boatOcclusionGeo} material={materials.solid} />
        <LineMesh geometry={data.boatLinesGeo} material={materials.primaryLine} />
      </group>

      {/* Soaring Birds & Drifting Clouds */}
      <group ref={birdsRef} position={[-12, 0, -14]}>
        <LineMesh geometry={data.birdLinesGeo} material={materials.primaryLine} />
      </group>
      <group ref={cloudsRef}>
        <mesh geometry={data.cloudOcclusionGeo} material={materials.solid} />
        <LineMesh geometry={data.cloudLinesGeo} material={materials.fineLine} />
      </group>

      {/* Rising Chimney Smoke Rings */}
      {smokeSlots.map((idx) => (
        <group
          key={idx}
          ref={(el) => {
            smokeRefs.current[idx] = el;
          }}
        >
          <LineMesh geometry={data.smokeRingGeo} material={materials.fineLine} />
        </group>
      ))}
    </>
  );
}

export default function RemasteredLineVillageScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "never";
}) {
  const [webglSupported] = useState(() => (typeof window !== "undefined" ? checkWebGL() : true));
  const [generation, setGeneration] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const palette = VILLAGE_THEMES.archival;

  if (!webglSupported) {
    return (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
          color: palette.inkPrimary,
          fontFamily: "monospace",
        }}
      >
        当前浏览器不支持 WebGL2，无法渲染 3D 线条村庄。
      </div>
    );
  }

  return (
    <SceneErrorBoundary>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "700px",
          backgroundColor: palette.background,
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <Canvas
          key={generation}
          frameloop={frameloop}
          dpr={[1, 1.75]}
          camera={{ position: [56, 36, 62], fov: 38, near: 0.9, far: 440 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NoToneMapping,
          }}
          onCreated={({ gl, scene, camera }) => {
            (window as unknown as Record<string, unknown>).__COZYROOM__ = { scene, camera, gl };
            const canvas = gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              setContextLost(true);
              setGeneration((g) => (g < 3 ? g + 1 : g));
            };
            const onRestored = () => setContextLost(false);
            canvas.addEventListener("webglcontextlost", onLost, false);
            canvas.addEventListener("webglcontextrestored", onRestored, false);
          }}
        >
          <VillageWorld />
        </Canvas>

        {contextLost && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.75)",
              color: "#ffd166",
              fontFamily: "monospace",
            }}
          >
            WebGL 上下文正在恢复中...
          </div>
        )}
      </div>
    </SceneErrorBoundary>
  );
}
