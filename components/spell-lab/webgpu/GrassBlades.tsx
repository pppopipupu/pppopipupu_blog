"use client";

import React, { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getBiomeAt, CHUNK_SIZE } from "../Spells";

interface GrassBladeData {
  pos: THREE.Vector3;
  scale: number;
  phase: number;
  destroyed: boolean;
  hidden: boolean;
  biome: string;
  dist: number;
}

function densityForDist(d: number): number {
  if (d <= 2) return 300;
  return 150;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function GrassBlades({
  craters,
  cameraPos,
  viewDistance = 3,
}: {
  craters: { x: number; z: number; r: number; d: number }[];
  cameraPos: THREE.Vector3;
  viewDistance?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const frameCounter = useRef(0);

  const camGridX = Math.floor(cameraPos.x / CHUNK_SIZE);
  const camGridZ = Math.floor(cameraPos.z / CHUNK_SIZE);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const grassData = useMemo(() => {
    const data: GrassBladeData[] = [];

    for (let dx = -viewDistance; dx <= viewDistance; dx++) {
      for (let dz = -viewDistance; dz <= viewDistance; dz++) {
        const d = Math.max(Math.abs(dx), Math.abs(dz));
        if (d > viewDistance) continue;
        const density = densityForDist(d);
        const cx = camGridX + dx;
        const cz = camGridZ + dz;

        for (let i = 0; i < density; i++) {
          const rx = seededRandom(cx * 341.12 + cz * 713.43 + i * 13.57);
          const rz = seededRandom(cx * 123.45 + cz * 456.78 + i * 29.81);
          const rs = seededRandom(cx * 987.65 + cz * 213.24 + i * 7.12);

          const x = (cx + rx) * CHUNK_SIZE;
          const z = (cz + rz) * CHUNK_SIZE;
          const hInfo = getTerrainHeight(x, z);
          const biome = getBiomeAt(x, z);

          let destroyed = false;
          for (const c of craters) {
            const dxVal = x - c.x;
            const dzVal = z - c.z;
            if (dxVal * dxVal + dzVal * dzVal < c.r * c.r * 0.64) {
              destroyed = true;
              break;
            }
          }

          data.push({
            pos: new THREE.Vector3(x, hInfo.height, z),
            scale: 0.15 + rs * 0.1,
            phase: rs * Math.PI * 2,
            destroyed: destroyed,
            hidden: hInfo.isWater || destroyed,
            biome,
            dist: d,
          });
        }
      }
    }
    return data;
  }, [camGridX, camGridZ, viewDistance, craters]);

  // count = sum of tiered densities = (2*vd+1)^2 * mean density.
  const count = grassData.length;

  const initializeInstancedMesh = () => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const d = grassData[i];
      if (!d || d.hidden || d.destroyed) {
        dummy.scale.set(0, 0, 0);
        dummy.position.set(0, -1000, 0);
      } else {
        dummy.position.copy(d.pos);
        dummy.rotation.set(0, 0, 0);
        if (d.biome === "scorched-desolation") {
          dummy.scale.set(d.scale * 0.4, d.scale * 1.5, d.scale * 0.4);
        } else if (d.biome === "tundra-spire") {
          dummy.scale.set(d.scale * 0.7, d.scale * 0.8, d.scale * 0.7);
        } else {
          dummy.scale.set(0.05, d.scale, 0.05);
        }
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      let colorVal = new THREE.Color("#2d8a2d");
      if (d && !d.hidden && !d.destroyed) {
        if (d.biome === "scorched-desolation") {
          const orange = new THREE.Color("#ff5722");
          const charcoal = new THREE.Color("#212121");
          colorVal = i % 2 === 0 ? orange : charcoal;
        } else if (d.biome === "tundra-spire") {
          const white = new THREE.Color("#e0f7fa");
          const icy = new THREE.Color("#00e5ff");
          colorVal = i % 3 === 0 ? white : icy;
        } else {
          const green = new THREE.Color("#00e676");
          const purple = new THREE.Color("#d500f9");
          colorVal = i % 4 === 0 ? purple : green;
        }
      } else {
        colorVal = new THREE.Color(0, 0, 0);
      }
      meshRef.current.setColorAt(i, colorVal);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
    if (meshRef.current.material) {
      (meshRef.current.material as any).needsUpdate = true;
    }
  };

  useLayoutEffect(() => {
    initializeInstancedMesh();
  }, [grassData, count, dummy]);

  useFrame((state) => {
    if (!meshRef.current) return;
    frameCounter.current += 1;
    if (frameCounter.current % 3 !== 0) return;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const d = grassData[i];
      if (!d || d.hidden || d.destroyed || d.dist > 4) continue;

      dummy.position.copy(d.pos);
      dummy.rotation.set(0, 0, 0);

      const phase = d.phase + i * 0.1;
      const wave = Math.sin(time * 2.0 + phase) * 0.1;
      dummy.rotation.x = wave * 0.3;
      dummy.rotation.z = wave * 0.15;

      if (d.biome === "scorched-desolation") {
        dummy.scale.set(d.scale * 0.4, d.scale * 1.5, d.scale * 0.4);
      } else if (d.biome === "tundra-spire") {
        dummy.scale.set(d.scale * 0.7, d.scale * 0.8, d.scale * 0.7);
      } else {
        dummy.scale.set(0.05, d.scale, 0.05);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={`grass-${viewDistance}-${camGridX}-${camGridZ}`}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={true}
    >
      <coneGeometry args={[1, 4, 3]} />
      <meshStandardMaterial color="#ffffff" flatShading />
    </instancedMesh>
  );
}

export default GrassBlades;
