"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function FireballIcon({ active }: { active: boolean }) {
  return (
    <div style={{ width: "40px", height: "40px", pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <FireballContent active={active} />
      </Canvas>
    </div>
  );
}

function FireballContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * 2;
      meshRef.current.rotation.y = clock.elapsedTime * 3;
      const scale = 1 + Math.sin(clock.elapsedTime * 10) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={active ? "#ff6600" : "#882200"} wireframe={!active} />
      </mesh>
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
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <LightningContent active={active} />
      </Canvas>
    </div>
  );
}

function LightningContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      if (active) {
        meshRef.current.visible = Math.random() > 0.1;
        meshRef.current.rotation.z = (Math.random() - 0.5) * 0.2;
      } else {
        meshRef.current.visible = true;
        meshRef.current.rotation.z = 0;
      }
    }
  });

  return (
    <>
      <group ref={meshRef}>
        {/* Top part */}
        <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.05, 0.15, 1.2, 4]} />
          <meshBasicMaterial color={active ? "#4488ff" : "#224488"} />
        </mesh>
        {/* Bottom part */}
        <mesh position={[-0.1, -0.5, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.15, 0.02, 1.2, 4]} />
          <meshBasicMaterial color={active ? "#4488ff" : "#224488"} />
        </mesh>
      </group>
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
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <DisintegrateContent active={active} />
      </Canvas>
    </div>
  );
}

function DisintegrateContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (active) {
        meshRef.current.rotation.y = clock.elapsedTime * 5;
        const scale = 1 + Math.sin(clock.elapsedTime * 20) * 0.2;
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.visible = true;
      } else {
        meshRef.current.visible = true;
        meshRef.current.rotation.y = 0;
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={active ? "#00ff00" : "#004400"} wireframe={!active} />
      </mesh>
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
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
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
    if (groupRef.current) {
      if (active) {
        groupRef.current.rotation.y = clock.elapsedTime * 0.5;
        groupRef.current.rotation.x = clock.elapsedTime * 0.2;
      } else {
        groupRef.current.rotation.y = 0;
        groupRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <>
      <group ref={groupRef} position={[0, -0.6, 0]}>
        {colors.map((c, i) => (
          <mesh key={i} position={[0, i * 0.2, 0]}>
            <boxGeometry args={[1.5, 0.2, 0.2]} />
            <meshBasicMaterial 
              color={active ? c : "#444444"} 
              transparent 
              opacity={active ? 0.8 : 0.4} 
              blending={active ? THREE.AdditiveBlending : THREE.NormalBlending}
              wireframe={!active}
            />
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
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <AnimateDeadContent active={active} />
      </Canvas>
    </div>
  );
}

function AnimateDeadContent({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (active) {
        meshRef.current.rotation.y = clock.elapsedTime * 2;
        meshRef.current.position.y = Math.sin(clock.elapsedTime * 4) * 0.1;
      } else {
        meshRef.current.rotation.y = 0;
        meshRef.current.position.y = 0;
      }
    }
  });

  return (
    <>
      <group ref={meshRef}>
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
      {active && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.5} radius={0.5} />
        </EffectComposer>
      )}
    </>
  );
}
