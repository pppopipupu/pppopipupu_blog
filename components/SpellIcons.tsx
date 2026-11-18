"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function FireballIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <FireballContent active={active} />
      </Canvas>
    </div>
  );
}

function FireballContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const sparkGeometry = useMemo(() => {
    const positions = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.6;
      positions[i * 3 + 1] = Math.sin(a) * 1.6;
      positions[i * 3 + 2] = (i % 3 - 1) * 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 2;
      meshRef.current.rotation.y = t * 3;
      const s = 1 + Math.sin(t * 10) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 8; i++) {
        const a = t * 3 + (i / 8) * Math.PI * 2;
        const r = 1.5 + Math.sin(t * 5 + i) * 0.2;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = Math.sin(t * 4 + i * 1.7) * 0.5;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={active ? "#ff6600" : "#882200"} wireframe={!active} />
      </mesh>
      <points ref={pointsRef} geometry={sparkGeometry}>
        <pointsMaterial color={active ? "#ffcc44" : "#884400"} size={0.18} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function LightningIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <LightningContent active={active} />
      </Canvas>
    </div>
  );
}

function LightningContent({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const stepRef = useRef(-1);
  const sparkGeometry = useMemo(() => {
    const positions = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.1;
      positions[i * 3 + 1] = Math.sin(a) * 0.9;
      positions[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      if (active) {
        groupRef.current.visible = Math.random() > 0.1;
        groupRef.current.rotation.z = (Math.random() - 0.5) * 0.2;
      } else {
        groupRef.current.visible = true;
        groupRef.current.rotation.z = 0;
      }
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      if (active) {
        const step = Math.floor(t * 20);
        if (step !== stepRef.current) {
          stepRef.current = step;
          for (let i = 0; i < 6; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 2.4;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          }
          attr.needsUpdate = true;
        }
      } else {
        if (stepRef.current !== -1) {
          stepRef.current = -1;
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            arr[i * 3] = Math.cos(a) * 1.1;
            arr[i * 3 + 1] = Math.sin(a) * 0.9;
            arr[i * 3 + 2] = 0;
          }
          attr.needsUpdate = true;
        }
      }
    }
  });
  return (
    <>
      <group ref={groupRef}>
        <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.05, 0.15, 1.2, 4]} />
          <meshBasicMaterial color={active ? "#4488ff" : "#224488"} />
        </mesh>
        <mesh position={[-0.1, -0.5, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.15, 0.02, 1.2, 4]} />
          <meshBasicMaterial color={active ? "#4488ff" : "#224488"} />
        </mesh>
      </group>
      <points ref={pointsRef} geometry={sparkGeometry}>
        <pointsMaterial color={active ? "#88ccff" : "#224488"} size={0.15} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={3} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function DisintegrateIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <DisintegrateContent active={active} />
      </Canvas>
    </div>
  );
}

function DisintegrateContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const debrisGeometry = useMemo(() => {
    const positions = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.4;
      positions[i * 3 + 1] = Math.sin(a) * 1.4;
      positions[i * 3 + 2] = (i % 3 - 1) * 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 5;
      const s = 1 + Math.sin(t * 20) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 8; i++) {
        const a = t * 3 + (i / 8) * Math.PI * 2;
        const r = 1.4 + Math.sin(t * 6 + i) * 0.25;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = Math.sin(t * 4 + i * 1.7) * 0.5;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={active ? "#00ff00" : "#004400"} wireframe={!active} />
      </mesh>
      <points ref={pointsRef} geometry={debrisGeometry}>
        <pointsMaterial color={active ? "#aaffaa" : "#003300"} size={0.15} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={3} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function PrismaticWallIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <PrismaticWallContent active={active} />
      </Canvas>
    </div>
  );
}

function PrismaticWallContent({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.5;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
      groupRef.current.position.y = Math.sin(t * 2) * 0.05;
    }
  });
  return (
    <>
      <group ref={groupRef}>
        {colors.map((c, i) => (
          <mesh key={i} position={[0, -0.6 + i * 0.2, 0]}>
            <boxGeometry args={[1.5, 0.2, 0.2]} />
            <meshBasicMaterial color={active ? c : "#444444"} wireframe={!active} blending={active ? THREE.AdditiveBlending : THREE.NormalBlending} transparent opacity={active ? 0.9 : 0.4} />
          </mesh>
        ))}
      </group>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function AnimateDeadIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <AnimateDeadContent active={active} />
      </Canvas>
    </div>
  );
}

function AnimateDeadContent({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const wispGeometry = useMemo(() => {
    const positions = new Float32Array(12 * 3);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.3;
      positions[i * 3 + 1] = Math.sin(a * 2) * 0.5;
      positions[i * 3 + 2] = Math.sin(a) * 0.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 2;
      groupRef.current.position.y = Math.sin(t * 4) * 0.1;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 12; i++) {
        const a = t * 1.5 + (i / 12) * Math.PI * 2;
        const r = 1.3 + Math.sin(t * 2 + i) * 0.15;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(t * 3 + i * 1.3) * 0.5;
        arr[i * 3 + 2] = Math.sin(a) * 0.4;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <group ref={groupRef}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.9, 0.8, 0.8]} />
          <meshBasicMaterial color={active ? "#a020f0" : "#441166"} wireframe={!active} />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.7]} />
          <meshBasicMaterial color={active ? "#7b1fa2" : "#300747"} wireframe={!active} />
        </mesh>
        <mesh position={[-0.2, 0.25, 0.38]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={active ? "#00ffcc" : "#003322"} />
        </mesh>
        <mesh position={[0.2, 0.25, 0.38]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={active ? "#00ffcc" : "#003322"} />
        </mesh>
      </group>
      <points ref={pointsRef} geometry={wispGeometry}>
        <pointsMaterial color={active ? "#00ffcc" : "#003322"} size={0.12} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function SunburstIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <SunburstContent active={active} />
      </Canvas>
    </div>
  );
}

function SunburstContent({ active }: { active: boolean }) {
  const raysRef = useRef<THREE.InstancedMesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sparkGeometry = useMemo(() => {
    const positions = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.1;
      positions[i * 3 + 1] = Math.sin(a) * 1.1;
      positions[i * 3 + 2] = (i % 3 - 1) * 0.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  const rayGeometry = useMemo(() => new THREE.ConeGeometry(0.09, 0.6, 6), []);
  const rayMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: active ? "#fff3b0" : "#8b7355", wireframe: !active }), [active]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (raysRef.current) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.5;
        dummy.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0);
        dummy.rotation.set(0, 0, a - Math.PI / 2);
        dummy.updateMatrix();
        raysRef.current.setMatrixAt(i, dummy.matrix);
      }
      raysRef.current.instanceMatrix.needsUpdate = true;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 8; i++) {
        const a = t * 2 + (i / 8) * Math.PI * 2;
        const r = 1.1 + Math.sin(t * 4 + i) * 0.2;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = Math.sin(t * 3 + i * 1.7) * 0.4;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={active ? "#ffd54a" : "#b8860b"} wireframe={!active} />
      </mesh>
      <mesh>
        <torusGeometry args={[1, 0.1, 8, 24]} />
        <meshBasicMaterial color={active ? "#ffecb3" : "#6b5b2b"} wireframe={!active} />
      </mesh>
      <instancedMesh ref={raysRef} args={[rayGeometry, rayMaterial, 12]} />
      <points ref={pointsRef} geometry={sparkGeometry}>
        <pointsMaterial color={active ? "#fff3b0" : "#8b7355"} size={0.15} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function DestructiveWaveIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <DestructiveWaveContent active={active} />
      </Canvas>
    </div>
  );
}

function DestructiveWaveContent({ active }: { active: boolean }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const splashGeometry = useMemo(() => {
    const positions = new Float32Array(10 * 3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.2;
      positions[i * 3 + 1] = Math.sin(a) * 0.5;
      positions[i * 3 + 2] = Math.sin(a) * 0.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = 1 + Math.sin(t * 6) * 0.1;
    if (outerRef.current) {
      outerRef.current.scale.set(s, s, s);
      outerRef.current.rotation.z = t * 0.3;
    }
    if (innerRef.current) {
      const s2 = 0.6 * s;
      innerRef.current.scale.set(s2, s2, s2);
      innerRef.current.rotation.z = -t * 0.3;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 10; i++) {
        const a = t * 1.5 + (i / 10) * Math.PI * 2;
        const r = 1.2 + Math.sin(t * 3 + i) * 0.15;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.abs(Math.sin(t * 4 + i)) * 0.5 * r;
        arr[i * 3 + 2] = Math.sin(a) * 0.4;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh ref={outerRef}>
        <torusGeometry args={[1, 0.06, 8, 32]} />
        <meshBasicMaterial color={active ? "#ffb020" : "#b8860b"} wireframe={!active} />
      </mesh>
      <mesh ref={innerRef}>
        <torusGeometry args={[1, 0.06, 8, 32]} />
        <meshBasicMaterial color={active ? "#ffe0b0" : "#8b7355"} wireframe={!active} />
      </mesh>
      <points ref={pointsRef} geometry={splashGeometry}>
        <pointsMaterial color={active ? "#ffe0b0" : "#8b7355"} size={0.15} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function StormOfVengeanceIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <StormOfVengeanceContent active={active} />
      </Canvas>
    </div>
  );
}

function StormOfVengeanceContent({ active }: { active: boolean }) {
  const boltRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const rainGeometry = useMemo(() => {
    const positions = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      positions[i * 3] = -0.8 + i * 0.23;
      positions[i * 3 + 1] = 1.0 - i * 0.25;
      positions[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (boltRef.current) {
      boltRef.current.visible = Math.random() > 0.2;
      boltRef.current.rotation.z = (Math.random() - 0.5) * 0.15;
      boltRef.current.position.y = Math.sin(t * 6) * 0.05;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 8; i++) {
        arr[i * 3] = -0.8 + i * 0.23;
        arr[i * 3 + 1] = 1.2 - ((t * 1.6 + i * 0.35) % 2.4);
        arr[i * 3 + 2] = 0;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh position={[-0.4, 0.3, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color={active ? "#6b5b9e" : "#3a2f5a"} />
      </mesh>
      <mesh position={[0.4, 0.3, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color={active ? "#6b5b9e" : "#3a2f5a"} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshBasicMaterial color={active ? "#6b5b9e" : "#3a2f5a"} />
      </mesh>
      <group ref={boltRef}>
        <mesh position={[-0.2, -0.4, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.04, 0.10, 0.9, 4]} />
          <meshBasicMaterial color={active ? "#a78bfa" : "#5b4a8a"} />
        </mesh>
        <mesh position={[0.25, -0.45, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.04, 0.10, 0.8, 4]} />
          <meshBasicMaterial color={active ? "#c4b5fd" : "#5b4a8a"} />
        </mesh>
      </group>
      <points ref={pointsRef} geometry={rainGeometry}>
        <pointsMaterial color={active ? "#c4b5fd" : "#3a2f5a"} size={0.12} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function GravitySinkholeIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <GravitySinkholeContent active={active} />
      </Canvas>
    </div>
  );
}

function GravitySinkholeContent({ active }: { active: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const inwardGeometry = useMemo(() => {
    const positions = new Float32Array(10 * 3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.6;
      positions[i * 3 + 1] = Math.sin(a) * 1.6;
      positions[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 5) * 0.15;
      coreRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2;
      ringRef.current.rotation.x = Math.sin(t * 3) * 0.4;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 10; i++) {
        const a = t * 1.5 + (i / 10) * Math.PI * 2;
        const r = 1.8 - ((t * 1.0 + i * 0.137) % 1.2);
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = 0;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={active ? "#8c6cff" : "#4a3a8a"} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1, 0.08, 16, 64]} />
        <meshBasicMaterial color={active ? "#c4b5fd" : "#5b4a8a"} />
      </mesh>
      <points ref={pointsRef} geometry={inwardGeometry}>
        <pointsMaterial color={active ? "#b388ff" : "#3a2f5a"} size={0.12} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function PulseWaveIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <PulseWaveContent active={active} />
      </Canvas>
    </div>
  );
}

function PulseWaveContent({ active }: { active: boolean }) {
  const coneRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const shardGeometry = useMemo(() => {
    const positions = new Float32Array(6 * 3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.4;
      positions[i * 3 + 1] = Math.sin(a) * 1.4;
      positions[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (coneRef.current) {
      const s = 1 + Math.sin(t * 4) * 0.25;
      coneRef.current.scale.set(s, s, s);
      coneRef.current.rotation.y = t * 1.5;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 6; i++) {
        const a = t * 2 + (i / 6) * Math.PI * 2;
        const r = 1.2 + Math.sin(t * 4 + i * 1.3) * 0.4;
        arr[i * 3] = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r;
        arr[i * 3 + 2] = Math.cos(a) * 0.3;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <group ref={coneRef}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[1, 1, 4]} />
          <meshBasicMaterial color={active ? "#7fdbff" : "#3a6a8a"} wireframe={!active} />
        </mesh>
      </group>
      <points ref={pointsRef} geometry={shardGeometry}>
        <pointsMaterial color={active ? "#e0f7ff" : "#4a7a9e"} size={0.14} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

export function RavenousVoidIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: 40, height: 40, pointerEvents: "none" }}
        frameloop={active ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <RavenousVoidContent active={active} />
      </Canvas>
    </div>
  );
}

function RavenousVoidContent({ active }: { active: boolean }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const spiralGeometry = useMemo(() => {
    const positions = new Float32Array(10 * 3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * 1.1;
      positions[i * 3 + 1] = Math.sin(a) * 0.4;
      positions[i * 3 + 2] = Math.sin(a) * 0.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (diskRef.current) {
      diskRef.current.rotation.z = t * 2;
      diskRef.current.rotation.x = Math.sin(t * 1.5) * 0.3;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < 10; i++) {
        const a = t * 2 + (i / 10) * Math.PI * 2;
        arr[i * 3] = Math.cos(a) * 1.25;
        arr[i * 3 + 1] = Math.sin(a) * 0.45;
        arr[i * 3 + 2] = Math.sin(a) * 0.45;
      }
      attr.needsUpdate = true;
    }
  });
  return (
    <>
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color={active ? "#0a0a12" : "#141420"} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.1, 0.05, 16, 64]} />
        <meshBasicMaterial color={active ? "#b388ff" : "#5a4a8a"} />
      </mesh>
      <mesh ref={diskRef} rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 16, 64]} />
        <meshBasicMaterial color={active ? "#d1c4e9" : "#6a5a9e"} />
      </mesh>
      <points ref={pointsRef} geometry={spiralGeometry}>
        <pointsMaterial color={active ? "#d1c4e9" : "#6a5a9e"} size={0.12} blending={THREE.AdditiveBlending} transparent opacity={active ? 0.95 : 0.35} depthWrite={false} />
      </points>
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}
