"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SceneErrorBoundary from "../SceneErrorBoundary";
import { checkWebGL } from "../webgl";
import AngryBall, { ANGRY_BALL_Y } from "../AngryBall";
import {
  COTTAGE_TIMES,
  createBrookWaterMaterial,
  createSkyDomeMaterial,
} from "./CottageShaders";
import {
  buildCottageIslandGeometries,
  cottageBrookX,
  getCottageGroundHeight,
} from "./cottageGeometry";
import {
  playFireWhoosh,
  playSoftClick,
  playWarmChime,
} from "./remasterAudio";

function LowPolyTree({
  position,
  scale = 1,
  variant = "pine",
  phase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  variant?: "pine" | "maple" | "oak";
  phase?: number;
}) {
  const crownRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!crownRef.current) return;
    const t = state.clock.elapsedTime + phase;
    crownRef.current.rotation.z = Math.sin(t * 1.1) * 0.032;
    crownRef.current.rotation.x = Math.cos(t * 0.85) * 0.02;
  });

  const foliageColors =
    variant === "maple"
      ? ["#d95d39", "#e8873a", "#c9462f"]
      : variant === "oak"
      ? ["#559648", "#6cab52", "#47823e"]
      : ["#2f6b47", "#3b7d53", "#4b9161"];

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.26, 1.38, 6]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.92} flatShading />
      </mesh>
      <group ref={crownRef} position={[0, 1.2, 0]}>
        {variant === "pine" ? (
          <>
            <mesh position={[0, 0.54, 0]} castShadow receiveShadow>
              <coneGeometry args={[1.35, 1.75, 7]} />
              <meshStandardMaterial color={foliageColors[0]} roughness={0.85} flatShading />
            </mesh>
            <mesh position={[0, 1.48, 0]} rotation={[0, 0.4, 0]} castShadow receiveShadow>
              <coneGeometry args={[1.02, 1.48, 7]} />
              <meshStandardMaterial color={foliageColors[1]} roughness={0.85} flatShading />
            </mesh>
            <mesh position={[0, 2.3, 0]} rotation={[0, 0.8, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.68, 1.18, 7]} />
              <meshStandardMaterial color={foliageColors[2]} roughness={0.85} flatShading />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 0.84, 0]} castShadow receiveShadow>
              <icosahedronGeometry args={[1.15, 0]} />
              <meshStandardMaterial color={foliageColors[0]} roughness={0.84} flatShading />
            </mesh>
            <mesh position={[0.52, 0.52, 0.4]} castShadow receiveShadow>
              <icosahedronGeometry args={[0.74, 0]} />
              <meshStandardMaterial color={foliageColors[1]} roughness={0.84} flatShading />
            </mesh>
            <mesh position={[-0.48, 0.58, -0.35]} castShadow receiveShadow>
              <icosahedronGeometry args={[0.7, 0]} />
              <meshStandardMaterial color={foliageColors[2]} roughness={0.84} flatShading />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

function GardenLantern({
  position,
  lampsOn,
}: {
  position: [number, number, number];
  lampsOn: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.075, 1.04, 6]} />
        <meshStandardMaterial color="#2b2d36" roughness={0.7} metalness={0.4} flatShading />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[0.22, 0.27, 0.22]} />
        <meshStandardMaterial
          color="#ffe099"
          emissive="#ff9f38"
          emissiveIntensity={lampsOn ? 1.85 : 0.08}
          roughness={0.3}
          flatShading
        />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <coneGeometry args={[0.26, 0.18, 4]} />
        <meshStandardMaterial color="#2b2d36" roughness={0.65} flatShading />
      </mesh>
    </group>
  );
}

function PottedPlant({
  position,
  scale = 1,
  potColor = "#b35c3e",
}: {
  position: [number, number, number];
  scale?: number;
  potColor?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.4, 7]} />
        <meshStandardMaterial color={potColor} flatShading />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.03, 7]} />
        <meshStandardMaterial color="#3d281c" flatShading />
      </mesh>
      {[0, 1.25, 2.5, 3.75, 5.0].map((a, idx) => (
        <mesh
          key={idx}
          position={[Math.cos(a) * 0.17, 0.58 + (idx % 2) * 0.14, Math.sin(a) * 0.17]}
          rotation={[0.4, a, 0.2]}
          castShadow
        >
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color={idx % 2 === 0 ? "#4a8c4a" : "#5ea858"} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function FloorSpeakerTower({
  position,
  rotationY = 0,
  lampsOn = true,
}: {
  position: [number, number, number];
  rotationY?: number;
  lampsOn?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 1.12, 0.36]} />
        <meshStandardMaterial color="#23262e" roughness={0.55} flatShading />
      </mesh>
      <mesh position={[0, 0.56, 0.185]}>
        <boxGeometry args={[0.28, 1.02, 0.02]} />
        <meshStandardMaterial color="#3b2820" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.92, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 10]} />
        <meshStandardMaterial color="#d4a359" metalness={0.6} roughness={0.3} />
      </mesh>
      {[0.66, 0.36].map((wy, idx) => (
        <group key={idx} position={[0, wy, 0.2]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.02, 12]} />
            <meshStandardMaterial color="#15171c" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.015, 10]} />
            <meshStandardMaterial color="#d9a148" metalness={0.65} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.09, 0.12, 0.2]}>
        <boxGeometry args={[0.03, 0.02, 0.01]} />
        <meshStandardMaterial
          color="#38f2b0"
          emissive="#25e6a0"
          emissiveIntensity={lampsOn ? 1.8 : 0.1}
        />
      </mesh>
    </group>
  );
}

function PendantLamp({
  position,
  cordLen = 0.65,
  shadeColor = "#e6b86a",
  lampsOn = true,
}: {
  position: [number, number, number];
  cordLen?: number;
  shadeColor?: string;
  lampsOn?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, -cordLen / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, cordLen, 5]} />
        <meshStandardMaterial color="#2b2d36" />
      </mesh>
      <mesh position={[0, -cordLen - 0.08, 0]} castShadow>
        <coneGeometry args={[0.24, 0.2, 8]} />
        <meshStandardMaterial color={shadeColor} roughness={0.45} flatShading />
      </mesh>
      <mesh position={[0, -cordLen - 0.16, 0]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial
          color="#fff0c2"
          emissive="#ffbe5c"
          emissiveIntensity={lampsOn ? 2.1 : 0.08}
        />
      </mesh>
    </group>
  );
}

function CottageWorld() {
  const islandGeos = useMemo(() => buildCottageIslandGeometries(), []);
  useEffect(() => {
    return () => {
      islandGeos.dispose();
    };
  }, [islandGeos]);

  const palette = COTTAGE_TIMES.dusk;
  const skyMat = useMemo(() => createSkyDomeMaterial(palette), [palette]);
  const waterMat = useMemo(() => createBrookWaterMaterial(palette), [palette]);

  useEffect(() => {
    return () => {
      skyMat.dispose();
      waterMat.dispose();
    };
  }, [skyMat, waterMat]);

  const [lampsOn, setLampsOn] = useState(true);
  const [fireLevel, setFireLevel] = useState(1);
  const [tvOn, setTvOn] = useState(true);
  const [roofOpen, setRoofOpen] = useState(true);

  const frontRoofRef = useRef<THREE.Group>(null);
  const rightGableRef = useRef<THREE.Mesh>(null);
  const frontWallRef = useRef<THREE.Group>(null);
  const rightUpperWallRef = useRef<THREE.Mesh>(null);
  const waterwheelRef = useRef<THREE.Group>(null);
  const flameRefs = useRef<Array<THREE.Mesh | null>>([]);
  const campFlameRef = useRef<THREE.Mesh>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);
  const tvScreenMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const smokeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const kettleSteamRefs = useRef<Array<THREE.Mesh | null>>([]);
  const plushRef = useRef<THREE.Group>(null);
  const turntableRef = useRef<THREE.Mesh>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const atticOrbRef = useRef<THREE.Mesh>(null);
  const sailboatRef = useRef<THREE.Group>(null);
  const fireflyMeshRefs = useRef<Array<THREE.Mesh | null>>([]);

  const wheelBoostRef = useRef(0);
  const plushHopRef = useRef(0);
  const phonoSpinRef = useRef(0);
  const roofProgressRef = useRef(1);

  const fireflySeeds = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        bx: 1.5 + Math.sin(i * 1.73) * 14.5,
        by: 0.8 + (i % 5) * 0.58,
        bz: -14.5 + i * 0.88,
        speed: 0.72 + (i % 5) * 0.2,
        phase: i * 1.29,
      })),
    []
  );

  const steppingStones = useMemo(() => {
    const pts: Array<[number, number, number, number]> = [
      [4.5, 0.8, 0.2, 0.25],
      [5.6, 1.1, -0.15, 0.3],
      [6.7, 1.35, 0.1, 0.2],
      [13.4, 1.45, -0.05, 0.3],
      [14.7, 1.15, 0.25, 0.2],
      [16.0, 0.75, -0.2, 0.25],
    ];
    return pts.map(([x, z, rot, s]) => ({
      x,
      y: getCottageGroundHeight(x, z) + 0.03,
      z,
      rot,
      s,
    }));
  }, []);

  const bookRows = useMemo(
    () => [
      { x: -0.68, h: 0.35, col: "#c94c4c", tilt: 0 },
      { x: -0.52, h: 0.31, col: "#4a7c9b", tilt: 0 },
      { x: -0.36, h: 0.37, col: "#d69f3a", tilt: 0 },
      { x: -0.18, h: 0.29, col: "#5b8c5a", tilt: 0.14 },
      { x: 0.06, h: 0.33, col: "#8d5b96", tilt: -0.07 },
      { x: 0.22, h: 0.32, col: "#d96b43", tilt: 0 },
      { x: 0.38, h: 0.36, col: "#3d6b7d", tilt: 0 },
      { x: 0.54, h: 0.28, col: "#b8843b", tilt: 0.08 },
      { x: 0.7, h: 0.34, col: "#e06d7a", tilt: 0 },
    ],
    []
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;

    skyMat.uniforms.uTime.value = t;
    waterMat.uniforms.uTime.value = t;

    const targetOpen = roofOpen ? 1 : 0;
    roofProgressRef.current += (targetOpen - roofProgressRef.current) * (1 - Math.exp(-7.5 * delta));
    const openFrac = roofProgressRef.current;
    if (frontRoofRef.current) {
      frontRoofRef.current.position.y = 6.58 + openFrac * 4.2;
      frontRoofRef.current.position.z = openFrac * 2.2;
      const sc = Math.max(0.001, 1 - openFrac);
      frontRoofRef.current.scale.set(1, sc, sc);
      frontRoofRef.current.visible = openFrac < 0.985;
    }
    if (rightGableRef.current) {
      const sc = Math.max(0.001, 1 - openFrac);
      rightGableRef.current.scale.set(1, sc, 1);
      rightGableRef.current.visible = openFrac < 0.985;
    }
    if (frontWallRef.current) {
      frontWallRef.current.visible = openFrac < 0.15;
    }
    if (rightUpperWallRef.current) {
      rightUpperWallRef.current.visible = openFrac < 0.15;
    }

    wheelBoostRef.current = Math.max(0, wheelBoostRef.current - delta * 1.2);
    if (waterwheelRef.current) {
      waterwheelRef.current.rotation.z -= delta * (0.75 + wheelBoostRef.current * 2.6);
    }

    const fireScaleBase = fireLevel === 0 ? 0.38 : fireLevel === 1 ? 1.0 : 1.42;
    for (let i = 0; i < flameRefs.current.length; i++) {
      const f = flameRefs.current[i];
      if (!f) continue;
      const flicker = 0.85 + 0.25 * Math.sin(t * (9.5 + i * 2.7) + i);
      f.scale.set(fireScaleBase * (0.9 + 0.12 * flicker), fireScaleBase * flicker, fireScaleBase);
      f.rotation.y = Math.sin(t * 3.1 + i) * 0.25;
    }
    if (campFlameRef.current) {
      const cf = 0.86 + 0.24 * Math.sin(t * 10.5);
      campFlameRef.current.scale.set(1, cf, 1);
    }
    if (fireLightRef.current) {
      const baseIntensity = fireLevel === 0 ? 1.6 : fireLevel === 1 ? 6.5 : 10.0;
      fireLightRef.current.intensity =
        baseIntensity * (0.9 + 0.14 * Math.sin(t * 11.3) + 0.08 * Math.cos(t * 17.7));
    }

    if (tvScreenMatRef.current) {
      tvScreenMatRef.current.emissiveIntensity = tvOn ? 1.15 + Math.sin(t * 3.2) * 0.18 : 0.04;
    }

    for (let i = 0; i < smokeRefs.current.length; i++) {
      const m = smokeRefs.current[i];
      if (!m) continue;
      const phase = (t * 0.32 + i * 0.2) % 1;
      m.position.set(
        -8.25 + Math.sin(t * 1.0 + i) * phase * 0.65,
        11.2 + phase * 3.8,
        -0.6 + Math.cos(t * 0.75 + i) * phase * 0.4
      );
      const puffScale = (0.32 + phase * 0.65) * (1 - phase * 0.55) * (fireLevel === 0 ? 0.45 : 1);
      m.scale.setScalar(Math.max(0.01, puffScale));
    }

    for (let i = 0; i < kettleSteamRefs.current.length; i++) {
      const m = kettleSteamRefs.current[i];
      if (!m) continue;
      const phase = (t * 0.68 + i * 0.33) % 1;
      m.position.set(0.2, 1.44 + phase * 0.62, -3.8 + Math.sin(t * 2.4 + i) * 0.04);
      m.scale.setScalar(Math.max(0.01, (0.07 + phase * 0.09) * (1 - phase * 0.7)));
    }

    plushHopRef.current = Math.max(0, plushHopRef.current - delta * 2.2);
    if (plushRef.current) {
      const bounce = Math.abs(Math.sin(plushHopRef.current * Math.PI * 2.5)) * plushHopRef.current;
      plushRef.current.position.y = 0.33 + bounce * 0.85;
      plushRef.current.rotation.y = 0.45 + Math.sin(t * 1.5) * 0.08 + plushHopRef.current * 1.5;
    }
    phonoSpinRef.current = Math.max(0, phonoSpinRef.current - delta * 0.45);
    if (turntableRef.current) {
      turntableRef.current.rotation.y += delta * (0.8 + phonoSpinRef.current * 5.0);
    }
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.35;
    }
    if (atticOrbRef.current) {
      atticOrbRef.current.rotation.y = t * 0.65;
      atticOrbRef.current.position.y = 1.05 + Math.sin(t * 2.2) * 0.06;
    }

    if (sailboatRef.current) {
      sailboatRef.current.position.y = -0.26 + Math.sin(t * 1.6) * 0.04;
      sailboatRef.current.rotation.z = Math.sin(t * 1.2) * 0.045;
      sailboatRef.current.rotation.x = Math.cos(t * 1.0) * 0.025;
    }

    for (let i = 0; i < fireflyMeshRefs.current.length; i++) {
      const ff = fireflyMeshRefs.current[i];
      if (!ff) continue;
      const seed = fireflySeeds[i];
      ff.position.set(
        seed.bx + Math.sin(t * seed.speed + seed.phase) * 0.85,
        seed.by + Math.sin(t * seed.speed * 1.3 + seed.phase) * 0.4,
        seed.bz + Math.cos(t * seed.speed * 0.9 + seed.phase) * 0.85
      );
      const pulse = 0.55 + 0.45 * Math.sin(t * 3.8 + seed.phase);
      ff.scale.setScalar(pulse * 0.08);
    }
  });

  const manorOrigin: [number, number, number] = [-2.6, 0.0, -0.4];
  const lampPower = lampsOn ? palette.lampMultiplier : 0;

  return (
    <>
      <fogExp2 attach="fog" args={[palette.fogColor, 0.0055]} />

      <OrbitControls
        makeDefault
        target={[-1.4, 3.6, -0.5]}
        enableDamping
        dampingFactor={0.07}
        minDistance={7.0}
        maxDistance={68}
        maxPolarAngle={Math.PI * 0.485}
      />

      {/* Gradient Sky Dome */}
      <mesh material={skyMat}>
        <sphereGeometry args={[145, 24, 16]} />
      </mesh>

      {/* Directional Sunset Key Light + Bounce Fill */}
      <directionalLight
        position={[24, 22, 18]}
        color={palette.sunColor}
        intensity={palette.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={1}
        shadow-camera-far={76}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />
      <ambientLight intensity={palette.ambientIntensity + 0.14} />

      {/* Enlarged Floating Estate Island & Rocky Cliff Underside */}
      <mesh geometry={islandGeos.topGrassGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} flatShading />
      </mesh>
      <mesh geometry={islandGeos.rockBaseGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} flatShading />
      </mesh>

      {/* Flowing Wide Brook Water */}
      <mesh geometry={islandGeos.brookGeo} material={waterMat} receiveShadow />

      {/* Upstream Arched Wooden Footbridge */}
      <group position={[cottageBrookX(1.3), 0.14, 1.3]} rotation={[0, -0.14, 0]}>
        {[-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75].map((bx, idx) => {
          const archY = Math.cos((bx / 2.0) * (Math.PI / 2)) * 0.48;
          const tiltZ = -Math.sin((bx / 2.0) * (Math.PI / 2)) * 0.24;
          return (
            <mesh key={idx} position={[bx, archY, 0]} rotation={[0, 0, tiltZ]} castShadow receiveShadow>
              <boxGeometry args={[0.42, 0.12, 1.85]} />
              <meshStandardMaterial color="#8c5a3c" roughness={0.88} flatShading />
            </mesh>
          );
        })}
        {[-1.65, 0, 1.65].map((px) =>
          [-0.86, 0.86].map((pz, sideIdx) => (
            <mesh
              key={`${px}-${sideIdx}`}
              position={[px, 0.44 + (px === 0 ? 0.44 : 0.08), pz]}
              castShadow
            >
              <boxGeometry args={[0.12, 0.84, 0.12]} />
              <meshStandardMaterial color="#593722" flatShading />
            </mesh>
          ))
        )}
        {[-0.86, 0.86].map((pz, idx) => (
          <mesh key={idx} position={[0, 1.02, pz]} castShadow>
            <boxGeometry args={[3.55, 0.09, 0.09]} />
            <meshStandardMaterial color="#6e442b" flatShading />
          </mesh>
        ))}
      </group>

      {/* Downstream Timber Pier & Moored Sailboat */}
      <group position={[cottageBrookX(-9.5) - 1.8, 0.04, -9.5]}>
        <mesh position={[0.6, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.14, 1.35]} />
          <meshStandardMaterial color="#7d4e31" flatShading />
        </mesh>
        {[
          [-0.25, -0.52],
          [1.45, -0.52],
          [-0.25, 0.52],
          [1.45, 0.52],
        ].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, -0.5, pz]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
            <meshStandardMaterial color="#593520" flatShading />
          </mesh>
        ))}
      </group>
      <group
        ref={sailboatRef}
        position={[cottageBrookX(-10.8) + 0.5, -0.26, -10.8]}
        rotation={[0, 0.28, 0]}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.28, 2.55]} />
          <meshStandardMaterial color="#8f5b3a" flatShading />
        </mesh>
        <mesh position={[0, 0.16, 0.35]}>
          <boxGeometry args={[0.92, 0.06, 0.26]} />
          <meshStandardMaterial color="#6b4027" flatShading />
        </mesh>
        <mesh position={[0, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 1.9, 6]} />
          <meshStandardMaterial color="#593520" flatShading />
        </mesh>
        <mesh position={[0, 1.18, 0.12]} rotation={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.04, 1.25, 0.95]} />
          <meshStandardMaterial color="#f5ebd8" flatShading />
        </mesh>
      </group>

      {/* Stepping Stones */}
      {steppingStones.map((st, idx) => (
        <mesh
          key={idx}
          position={[st.x, st.y, st.z]}
          rotation={[0, st.rot, 0]}
          scale={[1.3 * st.s + 0.7, 0.13, 0.98 * st.s + 0.6]}
          receiveShadow
        >
          <cylinderGeometry args={[0.42, 0.48, 1, 7]} />
          <meshStandardMaterial color="#8a8f96" roughness={0.92} flatShading />
        </mesh>
      ))}

      {/* ================================================================
          GRAND 3-STORY MANOR (1F Living/Kitchen/Dining + 2F Bedroom/Study + 3F Attic)
          ================================================================ */}
      <group position={manorOrigin}>
        {/* Stone Foundation Plinth (12.8 x 9.2) */}
        <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[12.8, 0.6, 9.2]} />
          <meshStandardMaterial color="#686e7a" roughness={0.94} flatShading />
        </mesh>

        {/* 1F Hardwood Floor Deck */}
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <boxGeometry args={[12.22, 0.06, 8.62]} />
          <meshStandardMaterial color="#9e6d47" roughness={0.82} flatShading />
        </mesh>

        {/* Clean Low Timber Cutaway Baseboard along Front Edge (always present, never squashes!) */}
        <mesh position={[0, 0.38, 4.31]} receiveShadow>
          <boxGeometry args={[12.44, 0.22, 0.26]} />
          <meshStandardMaterial color="#593520" flatShading />
        </mesh>

        {/* Exterior Porch Deck & Canopy (Right Front Door) */}
        <group position={[7.05, 0, 1.6]}>
          <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 0.18, 3.8]} />
            <meshStandardMaterial color="#7d4f32" flatShading />
          </mesh>
          <mesh position={[0.92, 0.02, 0]} receiveShadow>
            <boxGeometry args={[0.55, 0.16, 1.85]} />
            <meshStandardMaterial color="#694128" flatShading />
          </mesh>
          {[-1.65, 1.65].map((pz, idx) => (
            <mesh key={idx} position={[0.8, 1.6, pz]} castShadow>
              <boxGeometry args={[0.16, 2.9, 0.16]} />
              <meshStandardMaterial color="#4e3222" flatShading />
            </mesh>
          ))}
          <mesh position={[0.05, 3.05, 0]} rotation={[0, 0, -0.22]} castShadow>
            <boxGeometry args={[2.2, 0.16, 4.1]} />
            <meshStandardMaterial color="#964030" flatShading />
          </mesh>
          <mesh position={[-0.3, 0.48, -1.25]} castShadow>
            <boxGeometry args={[0.5, 0.08, 1.1]} />
            <meshStandardMaterial color="#8f5c3a" flatShading />
          </mesh>
        </group>

        {/* Back Wall (z = -4.31) & Left Wall (x = -6.11) spanning 1F + 2F */}
        <mesh position={[0, 3.42, -4.31]} castShadow receiveShadow>
          <boxGeometry args={[12.44, 6.32, 0.26]} />
          <meshStandardMaterial color="#eadbc3" roughness={0.88} flatShading />
        </mesh>
        {/* Decorative Interior Timber Wainscoting / Dado Trim along Back Wall (protruding 0.04 inside) */}
        <mesh position={[0, 1.15, -4.16]}>
          <boxGeometry args={[12.0, 0.08, 0.06]} />
          <meshStandardMaterial color="#694028" flatShading />
        </mesh>
        <mesh position={[0, 4.45, -4.16]}>
          <boxGeometry args={[12.0, 0.08, 0.06]} />
          <meshStandardMaterial color="#694028" flatShading />
        </mesh>
        <mesh position={[-6.11, 3.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 6.32, 8.84]} />
          <meshStandardMaterial color="#e3d2b6" roughness={0.88} flatShading />
        </mesh>

        {/* Right Wall: Back-Right Half solid, Front-Right Cutaway open when roofOpen === true so Dining & Bedroom stay visible! */}
        <mesh position={[6.11, 3.42, -2.55]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 6.32, 3.74]} />
          <meshStandardMaterial color="#e3d2b6" roughness={0.88} flatShading />
        </mesh>
        <mesh ref={rightUpperWallRef} position={[6.11, 3.42, 2.0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 6.32, 4.8]} />
          <meshStandardMaterial color="#e3d2b6" roughness={0.88} flatShading />
        </mesh>
        {/* Right-Front Low Sill & Doorway Frame (always frames entrance cleanly without blocking interior) */}
        <mesh position={[6.11, 0.38, 2.0]} receiveShadow>
          <boxGeometry args={[0.26, 0.22, 4.8]} />
          <meshStandardMaterial color="#593520" flatShading />
        </mesh>
        <mesh position={[6.15, 1.38, 1.6]} rotation={[0, -0.28, 0]} castShadow>
          <boxGeometry args={[0.1, 2.24, 1.15]} />
          <meshStandardMaterial color="#6e4228" flatShading />
        </mesh>
        <mesh position={[6.25, 4.95, -2.2]}>
          <boxGeometry args={[0.06, 1.15, 1.25]} />
          <meshStandardMaterial
            color="#ffe5a3"
            emissive="#ffaa42"
            emissiveIntensity={lampPower * 1.15}
          />
        </mesh>

        {/* 2F Outdoor Flower Balcony protruding from Right Wall */}
        <group position={[7.02, 3.48, -0.7]}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.16, 3.2]} />
            <meshStandardMaterial color="#7d4f32" flatShading />
          </mesh>
          <mesh position={[0.75, 0.56, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 3.2]} />
            <meshStandardMaterial color="#593520" flatShading />
          </mesh>
          {[-1.5, -0.5, 0.5, 1.5].map((bz, idx) => (
            <mesh key={idx} position={[0.75, 0.3, bz]} castShadow>
              <boxGeometry args={[0.08, 0.56, 0.08]} />
              <meshStandardMaterial color="#593520" flatShading />
            </mesh>
          ))}
          <mesh position={[0.52, 0.22, -0.8]} castShadow>
            <boxGeometry args={[0.26, 0.24, 0.72]} />
            <meshStandardMaterial color="#b35c3e" flatShading />
          </mesh>
          <mesh position={[0.52, 0.42, -0.8]}>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#559648" flatShading />
          </mesh>
        </group>

        {/* Exposed Timber Corner & Back Posts spanning 1F + 2F (front corner posts toggle with front wall) */}
        {[
          [-6.18, -4.38],
          [0.0, -4.38],
          [6.18, -4.38],
        ].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, 3.44, pz]} castShadow>
            <boxGeometry args={[0.3, 6.4, 0.3]} />
            <meshStandardMaterial color="#4e3222" flatShading />
          </mesh>
        ))}

        {/* Left & Right Side Gable Walls */}
        <mesh geometry={islandGeos.gableWallGeo} position={[-6.11, 6.58, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#e3d2b6" roughness={0.88} flatShading />
        </mesh>
        <mesh
          ref={rightGableRef}
          geometry={islandGeos.gableWallGeo}
          position={[6.11, 6.58, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#e3d2b6" roughness={0.88} flatShading />
        </mesh>

        {/* Full Front Wall (shown cleanly only when roof is closed!) */}
        <group ref={frontWallRef} position={[0, 0.28, 4.31]} visible={false}>
          <mesh position={[0, 3.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[12.2, 6.3, 0.24]} />
            <meshStandardMaterial color="#e7d7bd" roughness={0.88} flatShading />
          </mesh>
          {[-3.2, 3.2].map((wx, idx) => (
            <React.Fragment key={idx}>
              <mesh position={[wx, 1.8, 0.14]}>
                <boxGeometry args={[1.4, 1.25, 0.04]} />
                <meshStandardMaterial
                  color="#ffe7a6"
                  emissive="#ffa947"
                  emissiveIntensity={lampPower * 1.1}
                />
              </mesh>
              <mesh position={[wx, 4.95, 0.14]}>
                <boxGeometry args={[1.4, 1.15, 0.04]} />
                <meshStandardMaterial
                  color="#ffe7a6"
                  emissive="#ffa947"
                  emissiveIntensity={lampPower * 1.1}
                />
              </mesh>
            </React.Fragment>
          ))}
        </group>

        {/* Back Roof Slope + Exposed Interior Rafters (flush under slope) + Clickable Ridge Beam */}
        <group position={[0, 6.58, 0]}>
          <mesh geometry={islandGeos.backRoofGeo} castShadow receiveShadow>
            <meshStandardMaterial color="#9e4332" roughness={0.84} flatShading />
          </mesh>
          {[-4.6, -2.3, 0, 2.3, 4.6].map((rx, idx) => (
            <mesh key={idx} position={[rx, 1.76, -2.42]} rotation={[-0.661, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 0.16, 6.1]} />
              <meshStandardMaterial color="#4e3120" flatShading />
            </mesh>
          ))}
          <mesh
            position={[0, 3.92, 0]}
            castShadow
            onClick={(e) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              setRoofOpen((v) => !v);
              playSoftClick(480);
            }}
          >
            <boxGeometry args={[13.65, 0.24, 0.32]} />
            <meshStandardMaterial color="#593524" flatShading />
          </mesh>
        </group>

        {/* Liftable Front Roof Slope */}
        <group ref={frontRoofRef} position={[0, 6.58, 0]}>
          <mesh geometry={islandGeos.frontRoofGeo} castShadow receiveShadow>
            <meshStandardMaterial color="#ad4b38" roughness={0.84} flatShading />
          </mesh>
          <group position={[2.6, 1.95, 2.5]}>
            <mesh castShadow>
              <boxGeometry args={[1.45, 1.1, 1.2]} />
              <meshStandardMaterial color="#eadbc3" flatShading />
            </mesh>
            <mesh position={[0, 0.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[1.18, 0.72, 4]} />
              <meshStandardMaterial color="#7d3124" flatShading />
            </mesh>
            <mesh position={[0, -0.02, 0.62]}>
              <boxGeometry args={[0.78, 0.62, 0.05]} />
              <meshStandardMaterial
                color="#ffe8ad"
                emissive="#ffaa42"
                emissiveIntensity={lampPower * 1.2}
              />
            </mesh>
          </group>
        </group>

        {/* Tall Stone Chimney */}
        <group position={[-5.65, 0, -0.2]}>
          <mesh position={[0, 5.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.25, 10.9, 1.35]} />
            <meshStandardMaterial color="#727782" roughness={0.94} flatShading />
          </mesh>
          <mesh position={[0, 11.16, 0]} castShadow>
            <boxGeometry args={[1.48, 0.24, 1.56]} />
            <meshStandardMaterial color="#575c66" roughness={0.94} flatShading />
          </mesh>
        </group>

        {/* Rotating Wooden Waterwheel */}
        <group position={[6.52, 0.62, -2.55]} rotation={[0, Math.PI / 2, 0]}>
          <group
            ref={waterwheelRef}
            onClick={(e) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              wheelBoostRef.current = 1.6;
              playSoftClick(520);
            }}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.88, 8]} />
              <meshStandardMaterial color="#4e3120" flatShading />
            </mesh>
            {Array.from({ length: 10 }).map((_, idx) => {
              const angle = (idx / 10) * Math.PI * 2;
              return (
                <group key={idx} rotation={[0, 0, angle]}>
                  <mesh position={[0, 0.85, 0]} castShadow>
                    <boxGeometry args={[0.1, 1.7, 0.1]} />
                    <meshStandardMaterial color="#6e472d" flatShading />
                  </mesh>
                  <mesh position={[0, 1.65, 0]} castShadow>
                    <boxGeometry args={[0.34, 0.1, 0.72]} />
                    <meshStandardMaterial color="#87593a" flatShading />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>

        {/* ============================================================
            1F ZONE A: LIVING ROOM + HEARTH + MODERN TV/HIFI + ANGRY BALL
            ============================================================ */}
        {/* Left Wall Curtained Window & Framed Art flanking Fireplace */}
        <group position={[-5.95, 1.95, 2.35]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[1.45, 1.35, 0.06]} />
            <meshStandardMaterial color="#4e3120" flatShading />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[1.25, 1.15, 0.03]} />
            <meshStandardMaterial color="#8bd3e6" emissive="#56a8c7" emissiveIntensity={0.45} />
          </mesh>
          {[-0.64, 0.64].map((cx, idx) => (
            <mesh key={idx} position={[cx, -0.08, 0.08]} castShadow>
              <boxGeometry args={[0.22, 1.65, 0.08]} />
              <meshStandardMaterial color="#c95d4c" flatShading />
            </mesh>
          ))}
        </group>

        {/* Stone Fireplace against Left Wall */}
        <group
          position={[-5.05, 0.28, -0.1]}
          rotation={[0, Math.PI / 2, 0]}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            setFireLevel((v) => (v + 1) % 3);
            playFireWhoosh();
          }}
        >
          <mesh position={[0, 0.09, 0.58]} receiveShadow castShadow>
            <boxGeometry args={[2.3, 0.18, 1.28]} />
            <meshStandardMaterial color="#5c616b" flatShading />
          </mesh>
          <mesh position={[-0.86, 0.86, 0.28]} castShadow>
            <boxGeometry args={[0.44, 1.42, 0.84]} />
            <meshStandardMaterial color="#6d7380" flatShading />
          </mesh>
          <mesh position={[0.86, 0.86, 0.28]} castShadow>
            <boxGeometry args={[0.44, 1.42, 0.84]} />
            <meshStandardMaterial color="#6d7380" flatShading />
          </mesh>
          <mesh position={[0, 1.65, 0.34]} castShadow>
            <boxGeometry args={[2.35, 0.2, 1.0]} />
            <meshStandardMaterial color="#5c3b28" flatShading />
          </mesh>
          <mesh position={[0, 0.24, 0.28]}>
            <cylinderGeometry args={[0.48, 0.54, 0.1, 7]} />
            <meshStandardMaterial
              color="#ff5e1a"
              emissive="#ff4500"
              emissiveIntensity={fireLevel === 0 ? 0.85 : 2.3}
              flatShading
            />
          </mesh>
          {[
            { pos: [0, 0.62, 0.28] as [number, number, number], r: 0.28, h: 0.72, col: "#ff6b1a" },
            { pos: [-0.2, 0.52, 0.3] as [number, number, number], r: 0.19, h: 0.52, col: "#ff9e22" },
            { pos: [0.2, 0.54, 0.27] as [number, number, number], r: 0.18, h: 0.5, col: "#ffd147" },
          ].map((fl, idx) => (
            <mesh
              key={idx}
              ref={(el) => {
                flameRefs.current[idx] = el;
              }}
              position={fl.pos}
            >
              <coneGeometry args={[fl.r, fl.h, 5]} />
              <meshStandardMaterial color={fl.col} emissive={fl.col} emissiveIntensity={2.3} flatShading />
            </mesh>
          ))}
          <pointLight
            ref={fireLightRef}
            position={[0, 1.1, 1.25]}
            color="#ff8c3a"
            intensity={6.5}
            distance={14}
            decay={2}
          />
          <mesh position={[0, 1.9, 0.38]} castShadow>
            <boxGeometry args={[0.32, 0.32, 0.18]} />
            <meshStandardMaterial color="#d4a359" flatShading />
          </mesh>
          <mesh position={[0, 2.58, -0.05]}>
            <boxGeometry args={[1.05, 0.76, 0.06]} />
            <meshStandardMaterial color="#6e4429" flatShading />
          </mesh>
          <mesh position={[0, 2.58, -0.01]}>
            <boxGeometry args={[0.88, 0.58, 0.02]} />
            <meshStandardMaterial color="#7bb6a8" flatShading />
          </mesh>
        </group>

        {/* Modern 1F Media Center: 55" Flatscreen TV + Media Console + Game Console + Soundbar + Subwoofer + Twin HiFi Speakers */}
        <group position={[-3.35, 0.28, -3.55]}>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.35, 0.44, 0.68]} />
            <meshStandardMaterial color="#663e26" roughness={0.8} flatShading />
          </mesh>
          {[-1.02, 1.02].map((lx, idx) => (
            <mesh key={idx} position={[lx, 0.05, 0]} castShadow>
              <boxGeometry args={[0.1, 0.1, 0.56]} />
              <meshStandardMaterial color="#2b2d36" flatShading />
            </mesh>
          ))}
          {/* White Next-Gen Game Console & Soundbar */}
          <mesh position={[-0.65, 0.58, 0.08]} castShadow>
            <boxGeometry args={[0.34, 0.14, 0.26]} />
            <meshStandardMaterial color="#e8ecf2" roughness={0.4} flatShading />
          </mesh>
          <mesh position={[-0.65, 0.66, 0.08]}>
            <boxGeometry args={[0.3, 0.02, 0.22]} />
            <meshStandardMaterial color="#2bf598" emissive="#2bf598" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.25, 0.56, 0.2]} castShadow>
            <boxGeometry args={[1.15, 0.1, 0.12]} />
            <meshStandardMaterial color="#1d2029" roughness={0.45} flatShading />
          </mesh>
          {/* Floating Acoustic Wall Shelf & Vinyl Records above TV */}
          <mesh position={[0, 2.25, -0.34]} castShadow>
            <boxGeometry args={[2.1, 0.06, 0.28]} />
            <meshStandardMaterial color="#7d4f31" flatShading />
          </mesh>
          {[-0.6, -0.35, 0.45].map((vx, idx) => (
            <mesh key={idx} position={[vx, 2.42, -0.38]}>
              <boxGeometry args={[0.26, 0.26, 0.04]} />
              <meshStandardMaterial color={["#e86f52", "#4cc9f0", "#f4d35e"][idx]} flatShading />
            </mesh>
          ))}
          {/* 55-inch Flatscreen Smart TV */}
          <group
            position={[0, 1.32, -0.08]}
            onClick={(e) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              setTvOn((v) => !v);
              playSoftClick(610);
            }}
          >
            <mesh position={[0, -0.62, 0]} castShadow>
              <boxGeometry args={[0.16, 0.36, 0.08]} />
              <meshStandardMaterial color="#242730" metalness={0.5} />
            </mesh>
            <mesh castShadow>
              <boxGeometry args={[2.05, 1.18, 0.08]} />
              <meshStandardMaterial color="#16181f" roughness={0.4} flatShading />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <boxGeometry args={[1.92, 1.05, 0.02]} />
              <meshStandardMaterial
                ref={tvScreenMatRef}
                color={tvOn ? "#3ec6ff" : "#111318"}
                emissive={tvOn ? "#2693e6" : "#000000"}
                emissiveIntensity={tvOn ? 1.15 : 0.04}
                roughness={0.2}
              />
            </mesh>
            {tvOn && (
              <>
                <mesh position={[-0.45, 0.1, 0.062]}>
                  <boxGeometry args={[0.52, 0.42, 0.015]} />
                  <meshStandardMaterial color="#ff9f43" emissive="#ff7f24" emissiveIntensity={1.2} />
                </mesh>
                <mesh position={[0.35, -0.1, 0.062]}>
                  <boxGeometry args={[0.68, 0.36, 0.015]} />
                  <meshStandardMaterial color="#5efce8" emissive="#34d1bf" emissiveIntensity={1.0} />
                </mesh>
              </>
            )}
          </group>
          {/* Twin HiFi Floor-Standing Tower Speakers + Subwoofer */}
          <FloorSpeakerTower position={[-1.48, 0, 0.1]} rotationY={0.14} lampsOn={lampsOn} />
          <FloorSpeakerTower position={[1.48, 0, 0.1]} rotationY={-0.14} lampsOn={lampsOn} />
          <mesh position={[1.96, 0.22, 0.1]} castShadow>
            <boxGeometry args={[0.38, 0.44, 0.38]} />
            <meshStandardMaterial color="#1c1f26" flatShading />
          </mesh>
        </group>

        {/* Living Room Dual-Layer Woven Carpet */}
        <mesh position={[-2.25, 0.295, 1.25]} receiveShadow>
          <boxGeometry args={[4.8, 0.04, 3.8]} />
          <meshStandardMaterial color="#b84a39" roughness={0.95} flatShading />
        </mesh>
        <mesh position={[-2.25, 0.322, 1.25]} receiveShadow>
          <boxGeometry args={[4.0, 0.015, 3.05]} />
          <meshStandardMaterial color="#e09f5a" roughness={0.95} flatShading />
        </mesh>

        {/* L-Shaped Fabric Sofa + Modern Standing Arc Floor Lamp */}
        <group position={[-2.05, 0.28, 2.85]}>
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.75, 0.36, 0.96]} />
            <meshStandardMaterial color="#c75d46" flatShading />
          </mesh>
          <mesh position={[0, 0.62, 0.38]} castShadow>
            <boxGeometry args={[2.75, 0.62, 0.24]} />
            <meshStandardMaterial color="#b34d38" flatShading />
          </mesh>
          {[-1.24, 1.24].map((ax, idx) => (
            <mesh key={idx} position={[ax, 0.44, 0]} castShadow>
              <boxGeometry args={[0.26, 0.52, 0.96]} />
              <meshStandardMaterial color="#a84733" flatShading />
            </mesh>
          ))}
          <mesh position={[-0.75, 0.52, 0.14]} rotation={[0.2, 0.2, 0.15]} castShadow>
            <boxGeometry args={[0.38, 0.34, 0.15]} />
            <meshStandardMaterial color="#f2c464" flatShading />
          </mesh>
          <mesh position={[0.55, 0.52, 0.14]} rotation={[0.2, -0.25, -0.1]} castShadow>
            <boxGeometry args={[0.38, 0.34, 0.15]} />
            <meshStandardMaterial color="#679e8d" flatShading />
          </mesh>
        </group>

        {/* Standing Warm Arc Floor Lamp beside Sofa */}
        <group position={[-0.45, 0.28, 2.5]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.22, 0.24, 0.06, 8]} />
            <meshStandardMaterial color="#2b2d36" flatShading />
          </mesh>
          <mesh position={[0, 1.05, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 2.0, 6]} />
            <meshStandardMaterial color="#d4a359" metalness={0.5} flatShading />
          </mesh>
          <mesh position={[-0.22, 1.98, 0]} rotation={[0, 0, 0.25]}>
            <coneGeometry args={[0.24, 0.24, 8]} />
            <meshStandardMaterial
              color="#f5e9cc"
              emissive="#ffbe5c"
              emissiveIntensity={lampPower * 1.25}
              flatShading
            />
          </mesh>
        </group>

        {/* Oak Coffee Table */}
        <group position={[-2.15, 0.28, 1.35]}>
          <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.08, 0.86]} />
            <meshStandardMaterial color="#875636" flatShading />
          </mesh>
          {[
            [-0.6, -0.34],
            [0.6, -0.34],
            [-0.6, 0.34],
            [0.6, 0.34],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 0.17, lz]} castShadow>
              <boxGeometry args={[0.07, 0.34, 0.07]} />
              <meshStandardMaterial color="#5e3a24" flatShading />
            </mesh>
          ))}
          <mesh position={[-0.25, 0.46, 0]} castShadow>
            <sphereGeometry args={[0.13, 7, 6]} />
            <meshStandardMaterial color="#e8dfd1" flatShading />
          </mesh>
          <mesh position={[0.26, 0.41, 0.08]} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.04, 8]} />
            <meshStandardMaterial color="#f5ebd6" flatShading />
          </mesh>
          <mesh position={[0.45, 0.4, -0.18]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[0.22, 0.03, 0.07]} />
            <meshStandardMaterial color="#23262e" flatShading />
          </mesh>
        </group>

        {/* DeepSeek Original AngryBall on Red-Velvet Pedestal */}
        <group position={[-4.65, 0.28, 2.75]}>
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.38, 0.46, 0.88, 8]} />
            <meshStandardMaterial color="#5e3a24" flatShading />
          </mesh>
          <mesh position={[0, 0.91, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.08, 8]} />
            <meshStandardMaterial color="#9e2a2b" flatShading />
          </mesh>
          <group position={[0, 1.48 - ANGRY_BALL_Y, 0]}>
            <AngryBall x={0} z={0} />
          </group>
        </group>

        {/* Vintage Brass-Horn Phonograph */}
        <group
          position={[0.35, 0.28, 3.1]}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            phonoSpinRef.current = 1.6;
            playWarmChime(Math.floor(Math.random() * 6));
          }}
        >
          <mesh position={[0, 0.34, 0]} castShadow>
            <boxGeometry args={[0.56, 0.68, 0.56]} />
            <meshStandardMaterial color="#694028" flatShading />
          </mesh>
          <mesh position={[0, 0.76, 0]} castShadow>
            <boxGeometry args={[0.45, 0.16, 0.45]} />
            <meshStandardMaterial color="#875536" flatShading />
          </mesh>
          <mesh ref={turntableRef} position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 10]} />
            <meshStandardMaterial color="#1f2129" flatShading />
          </mesh>
          <mesh position={[-0.08, 1.12, -0.08]} rotation={[0.45, 0.5, 0]} castShadow>
            <coneGeometry args={[0.24, 0.38, 8]} />
            <meshStandardMaterial color="#e0ac4c" metalness={0.65} roughness={0.3} flatShading />
          </mesh>
        </group>

        {/* Bouncy Plush Fox */}
        <group
          ref={plushRef}
          position={[-3.45, 0.33, 0.95]}
          rotation={[0, 0.45, 0]}
          onClick={(e) => {
            if (e.delta > 6) return;
            e.stopPropagation();
            plushHopRef.current = 1.0;
            playWarmChime(Math.floor(Math.random() * 6));
          }}
        >
          <mesh position={[0, 0.2, 0]} castShadow>
            <icosahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial color="#eb8c3d" flatShading />
          </mesh>
          <mesh position={[0, 0.45, 0.06]} castShadow>
            <icosahedronGeometry args={[0.19, 0]} />
            <meshStandardMaterial color="#f2a25c" flatShading />
          </mesh>
          {[-0.1, 0.1].map((ex, idx) => (
            <mesh key={idx} position={[ex, 0.62, 0.05]} rotation={[0, 0, ex > 0 ? -0.25 : 0.25]}>
              <coneGeometry args={[0.06, 0.14, 4]} />
              <meshStandardMaterial color="#d96b27" flatShading />
            </mesh>
          ))}
        </group>

        {/* ============================================================
            1F ZONE B: FULL MODERN KITCHEN (BACKSPLASH + FRIDGE + ISLAND + DINING)
            ============================================================ */}
        <group position={[3.3, 0.28, -3.55]}>
          {/* Checkerboard Kitchen Backsplash (protruding 0.04 off back wall) */}
          {Array.from({ length: 8 }).map((_, col) =>
            [0, 1].map((row) => (
              <mesh
                key={`${col}-${row}`}
                position={[-2.0 + col * 0.42, 1.2 + row * 0.36, -0.58]}
              >
                <boxGeometry args={[0.4, 0.34, 0.04]} />
                <meshStandardMaterial
                  color={(col + row) % 2 === 0 ? "#f2ece1" : "#7bb6a8"}
                  flatShading
                />
              </mesh>
            ))
          )}
          {/* Main Kitchen Counter */}
          <mesh position={[-0.45, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.9, 0.82]} />
            <meshStandardMaterial color="#7d5134" flatShading />
          </mesh>
          <mesh position={[-0.45, 0.92, 0]} receiveShadow>
            <boxGeometry args={[3.58, 0.06, 0.88]} />
            <meshStandardMaterial color="#e8dfd2" flatShading />
          </mesh>
          {/* Modern Mint-Retro Double-Door Refrigerator */}
          <group position={[1.95, 1.02, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.92, 2.04, 0.82]} />
              <meshStandardMaterial color="#87c7bd" roughness={0.4} flatShading />
            </mesh>
            <mesh position={[0, 0.28, 0.42]}>
              <boxGeometry args={[0.88, 0.03, 0.02]} />
              <meshStandardMaterial color="#3c5c57" />
            </mesh>
            <mesh position={[-0.32, 0.62, 0.44]}>
              <boxGeometry args={[0.04, 0.34, 0.04]} />
              <meshStandardMaterial color="#e0e6ed" metalness={0.7} />
            </mesh>
            <mesh position={[-0.32, -0.22, 0.44]}>
              <boxGeometry args={[0.04, 0.56, 0.04]} />
              <meshStandardMaterial color="#e0e6ed" metalness={0.7} />
            </mesh>
          </group>
          {/* Glowing Baking Oven + Range Hood + Microwave */}
          <mesh position={[-1.4, 0.45, 0.42]}>
            <boxGeometry args={[0.62, 0.42, 0.04]} />
            <meshStandardMaterial color="#ff9d3b" emissive="#ff6a1a" emissiveIntensity={1.25} />
          </mesh>
          <mesh position={[-1.4, 2.45, 0.05]} castShadow>
            <coneGeometry args={[0.56, 0.48, 4]} />
            <meshStandardMaterial color="#9aa3b0" metalness={0.4} flatShading />
          </mesh>
          <mesh position={[-1.4, 1.14, -0.05]} castShadow>
            <boxGeometry args={[0.56, 0.32, 0.36]} />
            <meshStandardMaterial color="#e8ecf2" flatShading />
          </mesh>
          <mesh position={[-1.44, 1.14, 0.14]}>
            <boxGeometry args={[0.36, 0.2, 0.02]} />
            <meshStandardMaterial color="#23262e" emissive="#4cc9f0" emissiveIntensity={0.45} />
          </mesh>
          {/* Sink Basin & Brass Faucet */}
          <mesh position={[0.25, 0.96, 0]}>
            <boxGeometry args={[0.72, 0.04, 0.48]} />
            <meshStandardMaterial color="#58859e" flatShading />
          </mesh>
          <mesh position={[0.25, 1.12, -0.26]}>
            <cylinderGeometry args={[0.025, 0.03, 0.32, 6]} />
            <meshStandardMaterial color="#d4a359" metalness={0.6} flatShading />
          </mesh>
          {/* Copper Kettle */}
          <mesh position={[-0.5, 1.07, 0.15]} castShadow>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshStandardMaterial color="#d4783b" metalness={0.65} roughness={0.3} flatShading />
          </mesh>
          {/* Espresso Coffee Machine */}
          <mesh position={[0.96, 1.14, 0.05]} castShadow>
            <boxGeometry args={[0.32, 0.36, 0.32]} />
            <meshStandardMaterial color="#2a2e38" metalness={0.4} flatShading />
          </mesh>
          {/* Wall Spice Shelf */}
          <mesh position={[-0.1, 2.05, -0.3]} castShadow>
            <boxGeometry args={[2.5, 0.08, 0.3]} />
            <meshStandardMaterial color="#5e3a23" flatShading />
          </mesh>
          {[-0.9, -0.45, 0, 0.45, 0.9].map((jx, idx) => (
            <mesh key={idx} position={[jx, 2.19, -0.28]}>
              <cylinderGeometry args={[0.07, 0.08, 0.2, 6]} />
              <meshStandardMaterial
                color={["#e6c280", "#d95d39", "#5b8c5a", "#f2e8d5", "#4a7c9b"][idx]}
                flatShading
              />
            </mesh>
          ))}
        </group>

        {/* Kitchen Prep Island + Bar Stools + Fruit Bowl */}
        <group position={[3.2, 0.28, -1.65]}>
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.88, 0.85]} />
            <meshStandardMaterial color="#6e4429" flatShading />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[2.28, 0.06, 0.92]} />
            <meshStandardMaterial color="#f0e8da" flatShading />
          </mesh>
          <mesh position={[0.45, 0.98, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.14, 0.12, 8]} />
            <meshStandardMaterial color="#d4a359" flatShading />
          </mesh>
          <mesh position={[0.42, 1.06, 0.04]}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#e64539" flatShading />
          </mesh>
          <mesh position={[0.52, 1.06, -0.04]}>
            <icosahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color="#f59b25" flatShading />
          </mesh>
          {[-0.55, 0.55].map((sx, idx) => (
            <group key={idx} position={[sx, 0, 0.65]}>
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.05, 0.14, 0.6, 6]} />
                <meshStandardMaterial color="#2b2d36" flatShading />
              </mesh>
              <mesh position={[0, 0.62, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
                <meshStandardMaterial color="#96613e" flatShading />
              </mesh>
            </group>
          ))}
        </group>

        {/* Dining Room Oak Table + 4 Chairs + Berry Pie + Pendant Lamp */}
        <group position={[3.25, 0.28, 1.75]}>
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.09, 1.35]} />
            <meshStandardMaterial color="#8f5c3a" flatShading />
          </mesh>
          {[
            [-0.95, -0.54],
            [0.95, -0.54],
            [-0.95, 0.54],
            [0.95, 0.54],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 0.36, lz]} castShadow>
              <boxGeometry args={[0.09, 0.72, 0.09]} />
              <meshStandardMaterial color="#5c3923" flatShading />
            </mesh>
          ))}
          <mesh position={[0, 0.82, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.27, 0.11, 8]} />
            <meshStandardMaterial color="#e8b86d" flatShading />
          </mesh>
          <mesh position={[0, 0.89, 0]}>
            <cylinderGeometry args={[0.19, 0.2, 0.04, 8]} />
            <meshStandardMaterial color="#b8334a" flatShading />
          </mesh>
          {[-0.65, 0.65].map((px, idx) => (
            <mesh key={idx} position={[px, 0.78, 0]}>
              <cylinderGeometry args={[0.16, 0.14, 0.03, 8]} />
              <meshStandardMaterial color="#f5efe4" flatShading />
            </mesh>
          ))}
          {[
            [-0.55, -0.92, 0],
            [0.55, -0.92, 0],
            [-0.55, 0.92, Math.PI],
            [0.55, 0.92, Math.PI],
          ].map(([cx, cz, ry], idx) => (
            <group key={idx} position={[cx, 0, cz]} rotation={[0, ry, 0]}>
              <mesh position={[0, 0.42, 0]} castShadow>
                <boxGeometry args={[0.44, 0.06, 0.44]} />
                <meshStandardMaterial color="#75492c" flatShading />
              </mesh>
              <mesh position={[0, 0.72, -0.19]} castShadow>
                <boxGeometry args={[0.44, 0.56, 0.06]} />
                <meshStandardMaterial color="#633c24" flatShading />
              </mesh>
              <mesh position={[0, 0.21, 0]} castShadow>
                <boxGeometry args={[0.36, 0.42, 0.36]} />
                <meshStandardMaterial color="#593520" flatShading />
              </mesh>
            </group>
          ))}
        </group>
        <PottedPlant position={[5.25, 0.28, 3.4]} scale={1.15} />
        <PottedPlant position={[-5.25, 0.28, 3.45]} scale={1.05} potColor="#4a7c9b" />

        {/* ============================================================
            1F TO 2F SOLID WOODEN STAIRCASE
            ============================================================ */}
        <group position={[-0.25, 0.28, -2.5]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh
              key={i}
              position={[0, 0.16 + i * 0.31, 1.35 - i * 0.28]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1.15, 0.28, 0.34]} />
              <meshStandardMaterial color="#7d4f31" flatShading />
            </mesh>
          ))}
        </group>

        {/* ============================================================
            2F FULL SECOND FLOOR (y = 3.48): BEDROOM + MODERN STUDY + AC
            ============================================================ */}
        <group position={[0, 3.48, 0]}>
          <mesh position={[0, -0.04, -1.78]} castShadow receiveShadow>
            <boxGeometry args={[12.05, 0.14, 4.88]} />
            <meshStandardMaterial color="#875636" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 0.62, 0.62]} castShadow>
            <boxGeometry args={[11.8, 0.08, 0.08]} />
            <meshStandardMaterial color="#593520" flatShading />
          </mesh>
          {Array.from({ length: 13 }).map((_, idx) => (
            <mesh key={idx} position={[-5.4 + idx * 0.9, 0.31, 0.62]} castShadow>
              <boxGeometry args={[0.07, 0.56, 0.07]} />
              <meshStandardMaterial color="#6e4429" flatShading />
            </mesh>
          ))}
          <mesh position={[1.15, 1.45, -2.35]} castShadow receiveShadow>
            <boxGeometry args={[0.18, 2.9, 3.6]} />
            <meshStandardMaterial color="#e7d7bd" flatShading />
          </mesh>

          {/* 2F ZONE A: MASTER BEDROOM (Right Wing) */}
          <group position={[3.65, 0.03, -2.15]}>
            {/* Modern Wall-Mounted Split AC */}
            <mesh position={[0, 2.35, -1.88]} castShadow>
              <boxGeometry args={[1.25, 0.32, 0.26]} />
              <meshStandardMaterial color="#f0f4f8" roughness={0.35} flatShading />
            </mesh>
            <mesh position={[0.45, 2.28, -1.74]}>
              <boxGeometry args={[0.12, 0.04, 0.02]} />
              <meshStandardMaterial color="#38f2b0" emissive="#25e6a0" emissiveIntensity={1.2} />
            </mesh>
            {/* Bedroom Wall Artwork & Circular Mirror */}
            <mesh position={[0.6, 1.5, -1.96]}>
              <boxGeometry args={[0.92, 0.68, 0.04]} />
              <meshStandardMaterial color="#5c3b28" flatShading />
            </mesh>
            <mesh position={[0.6, 1.5, -1.93]}>
              <boxGeometry args={[0.76, 0.52, 0.02]} />
              <meshStandardMaterial color="#e69f5c" flatShading />
            </mesh>
            <mesh position={[-0.75, 1.55, -1.96]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.04, 12]} />
              <meshStandardMaterial color="#a6d8e8" metalness={0.5} roughness={0.2} />
            </mesh>

            {/* Double Bed */}
            <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.35, 0.28, 1.85]} />
              <meshStandardMaterial color="#6e442a" flatShading />
            </mesh>
            <mesh position={[1.08, 0.64, 0]} castShadow>
              <boxGeometry args={[0.14, 1.05, 1.92]} />
              <meshStandardMaterial color="#593520" flatShading />
            </mesh>
            <mesh position={[-0.04, 0.46, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.1, 0.24, 1.68]} />
              <meshStandardMaterial color="#f5efe4" flatShading />
            </mesh>
            <mesh position={[-0.36, 0.52, 0]} castShadow>
              <boxGeometry args={[1.48, 0.22, 1.72]} />
              <meshStandardMaterial color="#4d7ea8" flatShading />
            </mesh>
            {[-0.42, 0.42].map((pz, idx) => (
              <mesh key={idx} position={[0.74, 0.64, pz]} rotation={[0, 0, -0.18]} castShadow>
                <boxGeometry args={[0.42, 0.15, 0.56]} />
                <meshStandardMaterial color="#fff8eb" flatShading />
              </mesh>
            ))}
            <mesh position={[-1.42, 0.22, 0]} castShadow>
              <boxGeometry args={[0.42, 0.42, 1.35]} />
              <meshStandardMaterial color="#c99558" flatShading />
            </mesh>
            {/* Nightstand & Warm Shade Lamp */}
            <group
              position={[0.8, 0, 1.32]}
              onClick={(e) => {
                if (e.delta > 6) return;
                e.stopPropagation();
                setLampsOn((v) => !v);
                playSoftClick(660);
              }}
            >
              <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.56, 0.6, 0.56]} />
                <meshStandardMaterial color="#754a2e" flatShading />
              </mesh>
              <mesh position={[0, 0.86, 0]}>
                <coneGeometry args={[0.21, 0.25, 8]} />
                <meshStandardMaterial
                  color="#ffe5a3"
                  emissive="#ffb347"
                  emissiveIntensity={lampPower * 1.45}
                  flatShading
                />
              </mesh>
              {lampsOn && (
                <pointLight position={[0, 0.95, 0]} color="#ffbe6b" intensity={2.6} distance={7.5} decay={2} />
              )}
            </group>
            {/* Detailed Double-Door Wardrobe with Brass Handles */}
            <group position={[-1.65, 1.05, -1.25]}>
              <mesh castShadow>
                <boxGeometry args={[1.05, 2.1, 0.68]} />
                <meshStandardMaterial color="#694028" flatShading />
              </mesh>
              <mesh position={[0, 0, 0.35]}>
                <boxGeometry args={[0.03, 1.95, 0.02]} />
                <meshStandardMaterial color="#3d2416" />
              </mesh>
              {[-0.12, 0.12].map((hx, idx) => (
                <mesh key={idx} position={[hx, 0.05, 0.36]}>
                  <boxGeometry args={[0.04, 0.22, 0.04]} />
                  <meshStandardMaterial color="#d4a359" metalness={0.6} />
                </mesh>
              ))}
            </group>
            <mesh position={[-0.4, 0.02, 0.2]} receiveShadow>
              <boxGeometry args={[2.8, 0.03, 2.3]} />
              <meshStandardMaterial color="#d48c58" flatShading />
            </mesh>
            <PendantLamp position={[-0.2, 3.05, 0.1]} cordLen={0.5} lampsOn={lampsOn} />
          </group>

          {/* 2F ZONE B: MODERN GAMING/CODING WORKSTATION + OPEN BOOKSHELF + ALCHEMY */}
          <group position={[-3.45, 0.03, -2.1]}>
            {/* Open-Back 3-Tier Bookshelf (Back panel + Side planks + Shelves so all 27 Colorful Books are 100% visible!) */}
            <group position={[0.55, 0, -1.78]}>
              <mesh position={[0, 0.95, -0.18]} castShadow>
                <boxGeometry args={[2.0, 1.9, 0.06]} />
                <meshStandardMaterial color="#593520" flatShading />
              </mesh>
              {[-0.96, 0.96].map((sx, idx) => (
                <mesh key={idx} position={[sx, 0.95, 0.04]} castShadow>
                  <boxGeometry args={[0.08, 1.9, 0.44]} />
                  <meshStandardMaterial color="#694028" flatShading />
                </mesh>
              ))}
              {[0.04, 0.52, 1.04, 1.56, 1.88].map((sy, idx) => (
                <mesh key={idx} position={[0, sy, 0.04]} castShadow>
                  <boxGeometry args={[1.92, 0.06, 0.44]} />
                  <meshStandardMaterial color="#7a4c2f" flatShading />
                </mesh>
              ))}
              {[0.55, 1.07, 1.59].map((sy, rIdx) => (
                <group key={rIdx} position={[0, sy, 0.08]}>
                  {bookRows.map((b, bIdx) => (
                    <mesh
                      key={bIdx}
                      position={[b.x, b.h / 2, 0]}
                      rotation={[0, 0, b.tilt * (rIdx % 2 === 0 ? 1 : -1)]}
                      castShadow
                    >
                      <boxGeometry args={[0.11, b.h, 0.28]} />
                      <meshStandardMaterial color={b.col} flatShading />
                    </mesh>
                  ))}
                </group>
              ))}
            </group>

            {/* Framed Modern Geometric Posters on Study Back Wall */}
            {[-1.1, 2.0].map((px, idx) => (
              <group key={idx} position={[px, 1.65, -1.98]}>
                <mesh>
                  <boxGeometry args={[0.72, 0.88, 0.04]} />
                  <meshStandardMaterial color="#2b2d36" flatShading />
                </mesh>
                <mesh position={[0, 0, 0.025]}>
                  <boxGeometry args={[0.58, 0.74, 0.02]} />
                  <meshStandardMaterial color={idx === 0 ? "#4cc9f0" : "#ff8c66"} flatShading />
                </mesh>
              </group>
            ))}

            {/* Modern Dual-Monitor Gaming/Dev Workstation Desk + RGB PC Tower + Studio Monitors + Ergonomic Chair */}
            <group position={[-1.55, 0, 0.15]}>
              <mesh position={[0, 0.72, 0]} castShadow>
                <boxGeometry args={[1.05, 0.08, 2.35]} />
                <meshStandardMaterial color="#573927" flatShading />
              </mesh>
              {[
                [-0.44, -1.04],
                [0.44, -1.04],
                [-0.44, 1.04],
                [0.44, 1.04],
              ].map(([lx, lz], idx) => (
                <mesh key={idx} position={[lx, 0.36, lz]} castShadow>
                  <boxGeometry args={[0.08, 0.72, 0.08]} />
                  <meshStandardMaterial color="#2b2d36" flatShading />
                </mesh>
              ))}
              {/* Ultrawide Dual-Monitor Setup */}
              <group position={[-0.22, 1.06, -0.1]}>
                <mesh position={[0, -0.22, 0]}>
                  <boxGeometry args={[0.08, 0.24, 0.14]} />
                  <meshStandardMaterial color="#1d2028" />
                </mesh>
                <mesh castShadow>
                  <boxGeometry args={[0.06, 0.56, 1.15]} />
                  <meshStandardMaterial color="#181a22" flatShading />
                </mesh>
                <mesh position={[0.036, 0, 0]}>
                  <boxGeometry args={[0.015, 0.48, 1.06]} />
                  <meshStandardMaterial color="#30f2a2" emissive="#18d988" emissiveIntensity={1.35} />
                </mesh>
              </group>
              {/* RGB Glowing PC Tower */}
              <group position={[-0.12, 1.0, 0.85]}>
                <mesh castShadow>
                  <boxGeometry args={[0.44, 0.48, 0.24]} />
                  <meshStandardMaterial color="#1d2029" flatShading />
                </mesh>
                <mesh position={[0.225, 0, 0]}>
                  <boxGeometry args={[0.015, 0.38, 0.18]} />
                  <meshStandardMaterial color="#ff5ee0" emissive="#d926b8" emissiveIntensity={1.45} />
                </mesh>
              </group>
              {/* Pair of Studio Monitor Speakers */}
              {[-0.82, 0.56].map((sz, idx) => (
                <mesh key={idx} position={[-0.22, 0.9, sz]} castShadow>
                  <boxGeometry args={[0.2, 0.28, 0.18]} />
                  <meshStandardMaterial color="#23262e" flatShading />
                </mesh>
              ))}
              {/* Mechanical Keyboard & Mouse */}
              <mesh position={[0.14, 0.77, -0.1]}>
                <boxGeometry args={[0.2, 0.03, 0.52]} />
                <meshStandardMaterial color="#2b2e38" emissive="#4cc9f0" emissiveIntensity={0.45} />
              </mesh>
              <mesh position={[0.14, 0.77, 0.32]}>
                <boxGeometry args={[0.12, 0.03, 0.08]} />
                <meshStandardMaterial color="#e8ecf2" />
              </mesh>
              {/* Ergonomic Gaming Chair */}
              <group position={[0.85, 0, -0.1]} rotation={[0, -0.25, 0]}>
                <mesh position={[0, 0.46, 0]} castShadow>
                  <boxGeometry args={[0.52, 0.08, 0.52]} />
                  <meshStandardMaterial color="#262936" flatShading />
                </mesh>
                <mesh position={[0.22, 0.88, 0]} castShadow>
                  <boxGeometry args={[0.09, 0.82, 0.48]} />
                  <meshStandardMaterial color="#d9483b" flatShading />
                </mesh>
                <mesh position={[0, 0.23, 0]}>
                  <cylinderGeometry args={[0.05, 0.28, 0.42, 5]} />
                  <meshStandardMaterial color="#1a1c24" flatShading />
                </mesh>
              </group>
            </group>

            {/* Alchemist Potion Desk */}
            <group position={[2.2, 0, -0.45]}>
              <mesh position={[0, 0.65, 0]} castShadow>
                <boxGeometry args={[1.15, 0.08, 0.68]} />
                <meshStandardMaterial color="#7a4c2f" flatShading />
              </mesh>
              <mesh position={[0, 0.32, 0]} castShadow>
                <boxGeometry args={[0.96, 0.64, 0.5]} />
                <meshStandardMaterial color="#573521" flatShading />
              </mesh>
              <mesh position={[-0.25, 0.84, 0]}>
                <octahedronGeometry args={[0.14, 0]} />
                <meshStandardMaterial color="#56cfe1" emissive="#48bfe3" emissiveIntensity={1.25} flatShading />
              </mesh>
              <mesh position={[0.15, 0.82, 0.04]}>
                <cylinderGeometry args={[0.06, 0.11, 0.24, 6]} />
                <meshStandardMaterial color="#ff6b9d" emissive="#e63973" emissiveIntensity={1.1} flatShading />
              </mesh>
            </group>
            <PottedPlant position={[3.35, 0, 1.5]} scale={0.95} potColor="#d9874c" />
            <PendantLamp position={[-0.3, 3.05, 0.1]} cordLen={0.55} shadeColor="#679e8d" lampsOn={lampsOn} />
          </group>

          {/* 2F -> 3F Attic Access Ladder */}
          <group position={[0.25, 1.55, -0.25]} rotation={[-0.28, 0, 0]}>
            {[-0.22, 0.22].map((lx, idx) => (
              <mesh key={idx} position={[lx, 0, 0]} castShadow>
                <boxGeometry args={[0.06, 3.25, 0.06]} />
                <meshStandardMaterial color="#593520" flatShading />
              </mesh>
            ))}
            {Array.from({ length: 8 }).map((_, idx) => (
              <mesh key={idx} position={[0, -1.25 + idx * 0.36, 0]} castShadow>
                <boxGeometry args={[0.46, 0.05, 0.06]} />
                <meshStandardMaterial color="#855638" flatShading />
              </mesh>
            ))}
          </group>
        </group>

        {/* ============================================================
            3F INDEPENDENT ATTIC (y = 6.58 to Ridge y = 10.43)
            ============================================================ */}
        <group position={[0, 6.58, 0]}>
          <mesh position={[0, -0.04, -1.85]} castShadow receiveShadow>
            <boxGeometry args={[11.6, 0.14, 4.35]} />
            <meshStandardMaterial color="#7d4f31" roughness={0.86} flatShading />
          </mesh>
          <mesh position={[-1.4, 0.56, 0.26]} castShadow>
            <boxGeometry args={[8.4, 0.08, 0.08]} />
            <meshStandardMaterial color="#593520" flatShading />
          </mesh>
          <mesh position={[0, 0.04, -1.4]} receiveShadow>
            <cylinderGeometry args={[1.75, 1.75, 0.03, 12]} />
            <meshStandardMaterial color="#8f4a6b" flatShading />
          </mesh>
          {/* Brass Astronomical Telescope */}
          <group position={[2.8, 0.04, -0.95]} rotation={[0, -0.45, 0]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.28, 1.1, 3]} />
              <meshStandardMaterial color="#4e3120" flatShading />
            </mesh>
            <mesh position={[0.12, 1.18, 0.18]} rotation={[1.18, 0, -0.25]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 1.15, 8]} />
              <meshStandardMaterial color="#d4a359" metalness={0.65} roughness={0.3} flatShading />
            </mesh>
          </group>
          {/* Beanbag Lounge & Acoustic Guitar */}
          <mesh position={[-1.4, 0.24, -0.95]} scale={[1.2, 0.78, 1.2]} castShadow>
            <dodecahedronGeometry args={[0.46, 0]} />
            <meshStandardMaterial color="#e07a5f" flatShading />
          </mesh>
          <group position={[1.45, 0.48, -1.85]} rotation={[-0.25, 0.3, 0.15]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.1, 8]} />
              <meshStandardMaterial color="#c97d3e" flatShading />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <boxGeometry args={[0.06, 0.65, 0.05]} />
              <meshStandardMaterial color="#4e3120" flatShading />
            </mesh>
          </group>
          {/* Gold-Trimmed Treasure Chest & Stacked Attic Books */}
          <group position={[-2.9, 0.04, -1.4]}>
            <mesh position={[0, 0.26, 0]} castShadow>
              <boxGeometry args={[0.92, 0.52, 0.62]} />
              <meshStandardMaterial color="#6e3f24" flatShading />
            </mesh>
            <mesh position={[0, 0.56, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.31, 0.31, 0.92, 6, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#804b2b" flatShading />
            </mesh>
            <mesh position={[0, 0.48, 0.32]}>
              <boxGeometry args={[0.95, 0.07, 0.04]} />
              <meshStandardMaterial color="#e0b24c" metalness={0.6} flatShading />
            </mesh>
          </group>
          {/* Warm Hanging String Bulbs along Attic Rafters */}
          {[-3.4, -1.8, 0, 1.8, 3.4].map((bx, idx) => (
            <mesh key={idx} position={[bx, 2.35, -1.1]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshStandardMaterial
                color="#ffe8ad"
                emissive="#ffbe5c"
                emissiveIntensity={lampsOn ? 1.9 : 0.08}
              />
            </mesh>
          ))}
          {/* Floating Glowing Arcane Crystal Orb */}
          <group position={[0, 0.04, -1.4]}>
            <mesh position={[0, 0.36, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.3, 0.72, 7]} />
              <meshStandardMaterial color="#593722" flatShading />
            </mesh>
            <mesh ref={atticOrbRef} position={[0, 1.05, 0]}>
              <octahedronGeometry args={[0.24, 0]} />
              <meshStandardMaterial color="#70e4ff" emissive="#2ec4f1" emissiveIntensity={1.65} flatShading />
            </mesh>
            {lampsOn && (
              <pointLight position={[0, 1.35, 0]} color="#ffe099" intensity={2.2} distance={8} decay={2} />
            )}
          </group>
        </group>
      </group>

      {/* ================================================================
          EXTERIOR ESTATE: GARDEN GAZEBO, PUMPKIN FARM & EAST CAMPSITE
          ================================================================ */}
      <group position={[-11.2, getCottageGroundHeight(-11.2, 7.6), 7.6]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.1, 2.25, 0.22, 6]} />
          <meshStandardMaterial color="#7d4f32" flatShading />
        </mesh>
        {Array.from({ length: 6 }).map((_, idx) => {
          const a = (idx / 6) * Math.PI * 2;
          return (
            <mesh key={idx} position={[Math.cos(a) * 1.75, 1.25, Math.sin(a) * 1.75]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 2.3, 6]} />
              <meshStandardMaterial color="#593520" flatShading />
            </mesh>
          );
        })}
        <mesh position={[0, 2.85, 0]} castShadow>
          <coneGeometry args={[2.45, 1.35, 6]} />
          <meshStandardMaterial color="#8f4030" flatShading />
        </mesh>
        <mesh position={[0, 0.5, -0.5]} castShadow>
          <boxGeometry args={[1.45, 0.1, 0.5]} />
          <meshStandardMaterial color="#96613e" flatShading />
        </mesh>
      </group>

      <group position={[-6.5, getCottageGroundHeight(-6.5, 9.2), 9.2]} rotation={[0, 0.15, 0]}>
        {[-0.95, 0.95].map((rz, idx) => (
          <mesh key={idx} position={[0, 0.06, rz]} receiveShadow>
            <boxGeometry args={[4.4, 0.12, 1.15]} />
            <meshStandardMaterial color="#593c28" flatShading />
          </mesh>
        ))}
        {[-1.55, -0.65, 0.25, 1.15].map((px, idx) => (
          <mesh key={idx} position={[px, 0.26, -0.95]} scale={[1.15, 0.82, 1.15]} castShadow>
            <dodecahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color="#e87722" flatShading />
          </mesh>
        ))}
        {[-1.5, -0.7, 0.1, 0.9, 1.6].map((cx, idx) => (
          <mesh key={idx} position={[cx, 0.22, 0.95]} castShadow>
            <icosahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#68b058" flatShading />
          </mesh>
        ))}
        {[-2.4, -0.8, 0.8, 2.4].map((fx, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[fx, 0.38, -1.9]} castShadow>
              <boxGeometry args={[0.1, 0.76, 0.1]} />
              <meshStandardMaterial color="#6b4228" flatShading />
            </mesh>
            <mesh position={[fx, 0.38, 1.9]} castShadow>
              <boxGeometry args={[0.1, 0.76, 0.1]} />
              <meshStandardMaterial color="#6b4228" flatShading />
            </mesh>
          </React.Fragment>
        ))}
        {[-1.9, 1.9].map((fz, idx) => (
          <mesh key={idx} position={[0, 0.56, fz]} castShadow>
            <boxGeometry args={[4.9, 0.07, 0.06]} />
            <meshStandardMaterial color="#7d4f31" flatShading />
          </mesh>
        ))}
        <mesh position={[2.85, 0.42, -1.0]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 0.62, 7]} />
          <meshStandardMaterial color="#d9a148" flatShading />
        </mesh>
      </group>

      <group position={[18.2, getCottageGroundHeight(18.2, -5.2), -5.2]} rotation={[0, -0.5, 0]}>
        <mesh position={[-1.4, 0.85, -0.8]} rotation={[0, 0.4, 0]} castShadow>
          <coneGeometry args={[1.45, 1.7, 4]} />
          <meshStandardMaterial color="#e09f5a" flatShading />
        </mesh>
        <mesh position={[0.6, 0.14, 0.4]} castShadow>
          <cylinderGeometry args={[0.55, 0.62, 0.18, 7]} />
          <meshStandardMaterial color="#686e7a" flatShading />
        </mesh>
        <mesh ref={campFlameRef} position={[0.6, 0.44, 0.4]}>
          <coneGeometry args={[0.24, 0.56, 5]} />
          <meshStandardMaterial color="#ff7b1a" emissive="#ff5500" emissiveIntensity={2.1} flatShading />
        </mesh>
        <mesh position={[1.85, 0.2, 0.35]} rotation={[0, 0.1, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.45, 6]} />
          <meshStandardMaterial color="#6b4228" flatShading />
        </mesh>
      </group>

      {/* Chimney Smoke Puffs */}
      {[0, 1, 2, 3, 4].map((idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            smokeRefs.current[idx] = el;
          }}
          position={[-8.25, 11.4, -0.6]}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#efeae2" transparent opacity={0.62} flatShading />
        </mesh>
      ))}
      {[0, 1, 2].map((idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            kettleSteamRefs.current[idx] = el;
          }}
          position={[0.2, 1.5, -3.8]}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.55} flatShading />
        </mesh>
      ))}

      {/* 26 Stylized Trees (clear front sightline in front of the manor) */}
      {[
        [-15.5, -12.5, "pine", 1.55],
        [-12.0, -16.5, "maple", 1.35],
        [-18.8, -6.5, "oak", 1.4],
        [-19.2, 1.5, "pine", 1.3],
        [-16.8, 8.8, "maple", 1.32],
        [-13.5, 15.2, "pine", 1.28],
        [-5.2, -14.8, "pine", 1.45],
        [2.2, -16.5, "oak", 1.3],
        [-1.8, -19.2, "maple", 1.25],
        [7.5, -17.5, "pine", 1.35],
        [16.5, -13.8, "pine", 1.4],
        [20.2, -8.5, "maple", 1.32],
        [21.5, 0.5, "oak", 1.35],
        [19.5, 7.8, "pine", 1.28],
        [16.2, 14.5, "maple", 1.25],
        [9.5, 16.5, "pine", 1.22],
        [-12.5, 16.2, "oak", 1.25],
        [-8.5, 18.2, "maple", 1.18],
        [22.5, -2.5, "pine", 1.2],
        [-21.2, -2.2, "maple", 1.22],
        [-11.5, -9.2, "pine", 1.15],
        [15.2, -3.2, "oak", 1.18],
        [14.8, 5.2, "pine", 1.15],
        [-14.2, 3.8, "oak", 1.15],
        [17.5, 11.2, "pine", 1.12],
        [-16.8, -16.8, "pine", 1.3],
      ].map(([tx, tz, variant, sc], idx) => (
        <LowPolyTree
          key={idx}
          position={[tx as number, getCottageGroundHeight(tx as number, tz as number), tz as number]}
          scale={sc as number}
          variant={variant as "pine" | "maple" | "oak"}
          phase={idx * 0.65}
        />
      ))}

      {/* Garden Lanterns */}
      <GardenLantern position={[5.8, getCottageGroundHeight(5.8, 2.8), 2.8]} lampsOn={lampsOn} />
      <GardenLantern position={[15.8, getCottageGroundHeight(15.8, 2.4), 2.4]} lampsOn={lampsOn} />
      <GardenLantern position={[-5.2, getCottageGroundHeight(-5.2, 6.2), 6.2]} lampsOn={lampsOn} />
      <GardenLantern position={[-10.2, getCottageGroundHeight(-10.2, 4.6), 4.6]} lampsOn={lampsOn} />
      <GardenLantern position={[16.8, getCottageGroundHeight(16.8, -4.4), -4.4]} lampsOn={lampsOn} />

      {/* Boulders & Mushrooms */}
      {[
        [-14.5, -1.5, 0.92],
        [-8.2, 14.5, 0.78],
        [15.6, -7.2, 0.85],
        [16.8, 4.5, 0.72],
        [2.4, -12.2, 0.78],
      ].map(([rx, rz, rs], idx) => (
        <mesh
          key={idx}
          position={[rx, getCottageGroundHeight(rx, rz) + rs * 0.35, rz]}
          rotation={[idx * 0.5, idx * 1.1, 0]}
          scale={[rs * 1.2, rs * 0.8, rs]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#737985" flatShading />
        </mesh>
      ))}
      {[
        [-12.2, 4.2],
        [-12.6, 4.6],
        [15.2, -1.2],
        [15.6, 4.8],
        [-2.2, 11.4],
      ].map(([mx, mz], idx) => (
        <group
          key={idx}
          position={[mx, getCottageGroundHeight(mx, mz), mz]}
          scale={0.9 + (idx % 2) * 0.25}
        >
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
            <meshStandardMaterial color="#f5ebd8" flatShading />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <coneGeometry args={[0.16, 0.14, 7]} />
            <meshStandardMaterial color="#d94136" flatShading />
          </mesh>
        </group>
      ))}

      {/* Drifting Fireflies */}
      <group>
        {fireflySeeds.map((ff, idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              fireflyMeshRefs.current[idx] = el;
            }}
            position={[ff.bx, ff.by, ff.bz]}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#ffe57f" />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function RemasteredCottageScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "never";
}) {
  const [webglSupported] = useState(() => (typeof window !== "undefined" ? checkWebGL() : true));
  const [generation, setGeneration] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  if (!webglSupported) {
    return (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1726",
          color: "#ffd996",
          fontFamily: "monospace",
        }}
      >
        当前浏览器不支持 WebGL2，无法渲染 3D 低多边形小屋。
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
          backgroundColor: "#1b182a",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <Canvas
          key={generation}
          frameloop={frameloop}
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [12.5, 11.4, 21.8], fov: 38, near: 0.45, far: 240 }}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.06,
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
          <CottageWorld />
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
