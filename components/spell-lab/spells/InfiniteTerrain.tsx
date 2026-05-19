import React, { useMemo } from "react";
import * as THREE from "three";
import { CHUNK_SIZE } from "../types";

function hash(x: number, y: number) {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return h - Math.floor(h);
}

function noise2D(x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
}

let waterEnabled = false;

export function setWaterEnabled(val: boolean) {
  waterEnabled = val;
}

export function getWaterEnabled(): boolean {
  return waterEnabled;
}

export function getTerrainHeight(x: number, z: number): { height: number; isWater: boolean; baseWaterLevel: number } {
  const h1 = noise2D(x * 0.005, z * 0.005) * 35;
  const h2 = noise2D(x * 0.02, z * 0.02) * 12;
  const h3 = noise2D(x * 0.08, z * 0.08) * 3;
  const baseHeight = h1 + h2 + h3 - 5;

  const w1 = noise2D((x + 1000) * 0.012, (z + 1000) * 0.012);
  const w2 = noise2D((x + 1000) * 0.04, (z + 1000) * 0.04) * 0.3;
  const waterDensity = w1 + w2;

  let height = baseHeight;
  const isWater = waterEnabled && waterDensity > 0.65;
  const baseWaterLevel = -2.0;

  if (isWater) {
    const depthFactor = Math.min(1.0, (waterDensity - 0.65) * 8.0);
    const lakeBed = -12.0;
    height = THREE.MathUtils.lerp(baseHeight, lakeBed, depthFactor);
  }

  return { height, isWater, baseWaterLevel };
}

export function saveCraterToChunk(c: { x: number; z: number; r: number; d: number }) {
  const chunkMinX = Math.floor((c.x - c.r) / CHUNK_SIZE);
  const chunkMaxX = Math.floor((c.x + c.r) / CHUNK_SIZE);
  const chunkMinZ = Math.floor((c.z - c.r) / CHUNK_SIZE);
  const chunkMaxZ = Math.floor((c.z + c.r) / CHUNK_SIZE);

  if (typeof window !== "undefined") {
    for (let cx = chunkMinX; cx <= chunkMaxX; cx++) {
      for (let cz = chunkMinZ; cz <= chunkMaxZ; cz++) {
        const savedKey = `spell_lab_chunk_${cx}_${cz}`;
        let cratersList = [];
        const saved = localStorage.getItem(savedKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            cratersList = parsed.craters || [];
          } catch (e) {}
        }
        cratersList.push(c);
        localStorage.setItem(savedKey, JSON.stringify({ craters: cratersList }));
      }
    }
  }
}

export function getModifiedHeight(x: number, z: number, globalCraters: { x: number; z: number; r: number; d: number }[]): number {
  const base = getTerrainHeight(x, z);
  let h = base.height;
  for (const c of globalCraters) {
    const dist = Math.sqrt((x - c.x) ** 2 + (z - c.z) ** 2);
    if (dist < c.r) {
      const depth = c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
      h -= depth;
    }
  }
  return h;
}

function TerrainChunk({ cx, cz, cratersVersion }: { cx: number; cz: number; cratersVersion: number }) {
  const chunkXStart = cx * CHUNK_SIZE;
  const chunkZStart = cz * CHUNK_SIZE;

  const geo = useMemo(() => {
    const resolution = 24;
    const g = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, resolution, resolution);
    g.rotateX(-Math.PI * 0.5);

    const pos = g.attributes.position;
    const arr = pos.array as Float32Array;

    const savedKey = `spell_lab_chunk_${cx}_${cz}`;
    let chunkCraters: { x: number; z: number; r: number; d: number }[] = [];
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          chunkCraters = parsed.craters || [];
        } catch (e) {}
      }
    }

    const baseWaterLevel = -2.0;
    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const localX = arr[i * 3];
      const localZ = arr[i * 3 + 2];
      const worldX = chunkXStart + localX + CHUNK_SIZE / 2;
      const worldZ = chunkZStart + localZ + CHUNK_SIZE / 2;

      const hInfo = getTerrainHeight(worldX, worldZ);
      let finalH = hInfo.height;

      for (const c of chunkCraters) {
        const dist = Math.sqrt((worldX - c.x) ** 2 + (worldZ - c.z) ** 2);
        if (dist < c.r) {
          const depth = c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
          finalH -= depth;
        }
      }

      arr[i * 3 + 1] = finalH;

      const color = new THREE.Color();
      if (finalH < baseWaterLevel + 1.2) {
        color.set("#d2b48c");
      } else if (finalH > 14.0) {
        color.set("#808080");
      } else {
        color.set("#3c6e47");
      }
      colors.push(color.r, color.g, color.b);
    }

    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [cx, cz, cratersVersion, chunkXStart, chunkZStart]);

  return (
    <mesh position={[chunkXStart + CHUNK_SIZE / 2, 0, chunkZStart + CHUNK_SIZE / 2]} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

export function InfiniteTerrain({ cameraPos, cratersVersion, viewDistance = 3 }: { cameraPos: THREE.Vector3; cratersVersion: number; viewDistance?: number }) {
  const activeChunks = useMemo(() => {
    const cx = Math.floor(cameraPos.x / CHUNK_SIZE);
    const cz = Math.floor(cameraPos.z / CHUNK_SIZE);
    const chunks = [];
    const radius = viewDistance;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        chunks.push({ cx: cx + dx, cz: cz + dz });
      }
    }
    return chunks;
  }, [Math.floor(cameraPos.x / CHUNK_SIZE), Math.floor(cameraPos.z / CHUNK_SIZE), viewDistance]);

  return (
    <group>
      {activeChunks.map((chunk) => (
        <TerrainChunk
          key={`${chunk.cx}_${chunk.cz}`}
          cx={chunk.cx}
          cz={chunk.cz}
          cratersVersion={cratersVersion}
        />
      ))}
    </group>
  );
}
