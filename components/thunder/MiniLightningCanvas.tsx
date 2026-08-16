"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function LightningMesh({ isHovered }: { isHovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.15, 1.3);
    shape.lineTo(-0.5, 0.15);
    shape.lineTo(-0.05, 0.15);
    shape.lineTo(-0.6, -1.3);
    shape.lineTo(0.5, -0.1);
    shape.lineTo(0.05, -0.1);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = isHovered ? 4.5 : 2.0;

    if (meshRef.current) {
      meshRef.current.rotation.y = t * speed;
      meshRef.current.rotation.x = Math.sin(t * (speed * 0.7)) * 0.25;
      meshRef.current.position.y = Math.sin(t * 3) * 0.12;

      const scale = isHovered ? 1.25 + Math.sin(t * 12) * 0.08 : 1.1 + Math.sin(t * 4) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }

    if (glowRef.current) {
      glowRef.current.rotation.y = -t * (speed * 0.8);
      glowRef.current.rotation.z = Math.cos(t * 2) * 0.2;
      const glowScale = (isHovered ? 1.4 : 1.2) + Math.sin(t * 8) * 0.1;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
    }

    if (materialRef.current) {
      const pulse = Math.sin(t * (isHovered ? 15 : 6)) * 0.5 + 0.5;
      materialRef.current.emissiveIntensity = isHovered ? 2.5 + pulse * 2.0 : 1.2 + pulse * 1.0;
    }
  });

  return (
    <group>
      <mesh ref={glowRef} geometry={geometry}>
        <meshBasicMaterial
          color={isHovered ? "#00ffff" : "#00a2ff"}
          transparent
          opacity={isHovered ? 0.35 : 0.2}
          wireframe
        />
      </mesh>

      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          ref={materialRef}
          color="#e0f7ff"
          roughness={0.15}
          metalness={0.9}
          emissive="#00bfff"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

interface MiniLightningCanvasProps {
  isHovered?: boolean;
}

export function MiniLightningCanvas({ isHovered = false }: MiniLightningCanvasProps) {
  return (
    <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={2.5} color="#00e5ff" />
        <pointLight position={[-3, -2, 2]} intensity={2.0} color="#3d7eff" />
        <directionalLight position={[0, 4, 2]} intensity={1.8} color="#ffffff" />
        <LightningMesh isHovered={isHovered} />
      </Canvas>
    </div>
  );
}
