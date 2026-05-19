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

let waterEnabled = true;

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

  const r1 = noise2D((x + 2000) * 0.005, (z + 2000) * 0.005);
  const perturb = noise2D(x * 0.02, z * 0.02) * 0.025;
  const riverVal = Math.abs(r1 + perturb - 0.5);

  let height = baseHeight;
  const isWater = waterEnabled && riverVal < 0.04;
  const baseWaterLevel = isWater ? (baseHeight - 1.5) : -2.0;

  if (isWater) {
    const depthFactor = (0.04 - riverVal) / 0.04;
    const targetRiverBed = baseHeight - 5.0;
    height = THREE.MathUtils.lerp(baseHeight, targetRiverBed, depthFactor * 0.95);
  }

  return { height, isWater, baseWaterLevel };
}

export function getBiomeAt(x: number, z: number): "arcane-forest" | "scorched-desolation" | "tundra-spire" | "prairie" {
  const val = noise2D(x * 0.005, z * 0.005);
  if (val < 0.2) return "scorched-desolation";
  if (val > 0.8) return "tundra-spire";
  if (val > 0.4 && val < 0.6) return "arcane-forest";
  return "prairie";
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
          } catch {}
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
        } catch {}
      }
    }

    const colors = [];

    for (let i = 0; i < pos.count; i++) {
      const localX = arr[i * 3];
      const localZ = arr[i * 3 + 2];
      const worldX = chunkXStart + localX + CHUNK_SIZE / 2;
      const worldZ = chunkZStart + localZ + CHUNK_SIZE / 2;

      const hInfo = getTerrainHeight(worldX, worldZ);
      const baseWaterLevel = hInfo.baseWaterLevel;
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
      const biome = getBiomeAt(worldX, worldZ);

      if (biome === "scorched-desolation") {
        if (finalH < baseWaterLevel + 1.0) {
          color.set("#ff4500");
        } else if (finalH < 4.0) {
          color.set("#8b0000");
        } else if (finalH < 12.0) {
          color.set("#111111");
        } else if (finalH < 22.0) {
          color.set("#1a1a1a");
        } else {
          color.set("#222222");
        }
      } else if (biome === "tundra-spire") {
        if (finalH < baseWaterLevel + 1.0) {
          color.set("#a5f2f3");
        } else if (finalH < 4.0) {
          color.set("#e0f7fa");
        } else if (finalH < 12.0) {
          color.set("#e3f2fd");
        } else if (finalH < 22.0) {
          color.set("#b0bec5");
        } else {
          color.set("#ffffff");
        }
      } else if (biome === "arcane-forest") {
        if (finalH < baseWaterLevel + 1.0) {
          color.set("#3f1b5e");
        } else if (finalH < 4.0) {
          color.set("#6a0dad");
        } else if (finalH < 12.0) {
          color.set("#1d4d2b");
        } else if (finalH < 22.0) {
          color.set("#4b0082");
        } else {
          color.set("#1c0a35");
        }
      } else {
        if (finalH < baseWaterLevel + 1.0) {
          color.set("#d2b48c");
        } else if (finalH < 4.0) {
          color.set("#8db600");
        } else if (finalH < 12.0) {
          color.set("#3c6e47");
        } else if (finalH < 22.0) {
          color.set("#556b2f");
        } else {
          color.set("#808080");
        }
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
