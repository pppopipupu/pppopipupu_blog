"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 140;

export default function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16.4;
      positions[i * 3 + 1] = 0.6 + Math.random() * 6.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 13.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(t * 0.18 + i * 1.3) * 0.0018;
      pos[idx + 1] += Math.sin(t * 0.25 + i) * 0.0022;
      pos[idx + 2] += Math.cos(t * 0.15 + i * 0.7) * 0.0016;
      if (pos[idx + 1] > 7.2) pos[idx + 1] = 0.6;
      if (pos[idx + 1] < 0.6) pos[idx + 1] = 7.2;
    }
    geometry.attributes.position.needsUpdate = true;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.01;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        color="#ffe0a8"
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
