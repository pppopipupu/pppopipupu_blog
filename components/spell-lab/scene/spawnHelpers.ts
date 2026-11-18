"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CHUNK_SIZE,
  type DummyType,
  type ZombieType,
  type StructureType,
  type StructureData,
  type PlantType,
  type PlantData,
} from "../types";
import { getTerrainHeight, getBiomeAt } from "../spells/InfiniteTerrain";
import { generatePartsForStructure } from "../entities/StructureEntity";
import { generatePartsForPlant } from "../entities/PlantEntity";

export const COMMON_STRUCTURE_TYPES: StructureType[] = [
  "cabin",
  "windmill",
  "mine",
  "tower",
  "well",
  "obelisk",
  "shrine",
  "ruins",
  "campfire",
  "box-pile",
];

export const RARE_STRUCTURE_TYPES: StructureType[] = [
  "angry-cathedral",
  "wizard-academy",
  "ancient-portal",
  "angry-mirror",
];

export function pickStructureType(): { type: StructureType; scale: number } {
  const roll = Math.random() * 100;
  let type: StructureType = "cabin";
  if (roll < 2.5) type = "angry-cathedral";
  else if (roll < 5.0) type = "wizard-academy";
  else if (roll < 7.5) type = "ancient-portal";
  else if (roll < 10.0) type = "angry-mirror";
  else type = COMMON_STRUCTURE_TYPES[Math.floor(Math.random() * COMMON_STRUCTURE_TYPES.length)];
  const isRare = RARE_STRUCTURE_TYPES.includes(type);
  const scale = isRare ? 4.0 + Math.random() * 2.0 : 1.4 + Math.random() * 0.8;
  return { type, scale };
}

export function pickPlantType(biome: string): PlantType {
  if (biome === "scorched-desolation") return Math.random() > 0.5 ? "ash-pillar" : "basalt-spire";
  if (biome === "tundra-spire") return Math.random() > 0.5 ? "frost-spike" : "snowy-pine";
  return Math.random() > 0.5 ? "arcane-tree" : "giant-mushroom";
}

function randomChunkPos(
  cameraPos: THREE.Vector3,
  viewDistance: number,
): { x: number; z: number } {
  const camGridX = Math.floor(cameraPos.x / CHUNK_SIZE);
  const camGridZ = Math.floor(cameraPos.z / CHUNK_SIZE);
  const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
  const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
  const cx = camGridX + dx;
  const cz = camGridZ + dz;
  return { x: (cx + Math.random()) * CHUNK_SIZE, z: (cz + Math.random()) * CHUNK_SIZE };
}

function randomBiomePos(
  cameraPos: THREE.Vector3,
  viewDistance: number,
): { x: number; z: number; biome: string } {
  let x = 0;
  let z = 0;
  let biome = "prairie";
  let attempts = 0;
  while (biome === "prairie" && attempts < 10) {
    const p = randomChunkPos(cameraPos, viewDistance);
    x = p.x;
    z = p.z;
    biome = getBiomeAt(x, z);
    attempts++;
  }
  return { x, z, biome };
}

export function spawnDummies(cameraPos: THREE.Vector3, viewDistance: number): DummyType[] {
  const total = viewDistance <= 2 ? 50 : viewDistance <= 3 ? 100 : 180;
  const out: DummyType[] = [];
  for (let i = 0; i < total; i++) {
    const { x, z } = randomChunkPos(cameraPos, viewDistance);
    const h = getTerrainHeight(x, z).height;
    out.push({
      id: i,
      pos: new THREE.Vector3(x, h, z),
      hp: 200,
      maxHp: 200,
      target: new THREE.Vector3(x, h, z),
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    });
  }
  return out;
}

export function spawnStructures(cameraPos: THREE.Vector3, viewDistance: number): StructureData[] {
  const total = viewDistance <= 2 ? 10 : viewDistance <= 3 ? 20 : 35;
  const out: StructureData[] = [];
  for (let i = 0; i < total; i++) {
    const { x, z } = randomChunkPos(cameraPos, viewDistance);
    const h = getTerrainHeight(x, z).height;
    const { type, scale } = pickStructureType();
    out.push({
      id: i,
      type,
      pos: new THREE.Vector3(x, h, z),
      rotation: Math.random() * Math.PI * 2,
      scale,
      parts: generatePartsForStructure(type),
    });
  }
  return out;
}

export function spawnPlants(cameraPos: THREE.Vector3, viewDistance: number): PlantData[] {
  const total = viewDistance <= 2 ? 15 : viewDistance <= 3 ? 30 : 50;
  const out: PlantData[] = [];
  for (let i = 0; i < total; i++) {
    const { x, z, biome } = randomBiomePos(cameraPos, viewDistance);
    const h = getTerrainHeight(x, z).height;
    const type = pickPlantType(biome);
    out.push({
      id: i,
      type,
      pos: new THREE.Vector3(x, h, z),
      rotation: Math.random() * Math.PI * 2,
      scale: 1.2 + Math.random() * 0.8,
      parts: generatePartsForPlant(type),
      hp: 100,
      maxHp: 100,
    });
  }
  return out;
}

export function recycleDummies(
  prev: DummyType[],
  cameraPos: THREE.Vector3,
  viewDistance: number,
  now: number,
): DummyType[] {
  const maxDist = (viewDistance + 1) * CHUNK_SIZE;
  let changed = false;
  const next = prev.map((d) => {
    const dist = d.pos.distanceTo(cameraPos);
    const expired = d.hp <= 0 && d.deathTime !== undefined && now - d.deathTime > 60000;
    if (dist > maxDist || expired) {
      changed = true;
      const { x, z } = randomChunkPos(cameraPos, viewDistance);
      const h = getTerrainHeight(x, z).height;
      return {
        ...d,
        pos: new THREE.Vector3(x, h, z),
        target: new THREE.Vector3(x, h, z),
        hp: 200,
        deathTime: undefined,
        consumed: undefined,
      };
    }
    return d;
  });
  return changed ? next : prev;
}

export function recycleZombies(
  prev: ZombieType[],
  cameraPos: THREE.Vector3,
  viewDistance: number,
  now: number,
): ZombieType[] {
  const maxDist = (viewDistance + 1) * CHUNK_SIZE;
  let changed = false;
  const next: ZombieType[] = [];
  for (const z of prev) {
    if (z.pos.distanceTo(cameraPos) > maxDist) {
      changed = true;
      continue;
    }
    if (z.hp <= 0) {
      if (!z.deathTime) {
        changed = true;
        next.push({ ...z, deathTime: now });
        continue;
      }
      if (now - z.deathTime > 5000) {
        changed = true;
        continue;
      }
    }
    next.push(z);
  }
  return changed ? next : prev;
}

export function recycleStructures(
  prev: StructureData[],
  cameraPos: THREE.Vector3,
  viewDistance: number,
): StructureData[] {
  const maxDist = (viewDistance + 1) * CHUNK_SIZE;
  let changed = false;
  const next = prev.map((s) => {
    if (s.pos.distanceTo(cameraPos) > maxDist) {
      changed = true;
      const { x, z } = randomChunkPos(cameraPos, viewDistance);
      const h = getTerrainHeight(x, z).height;
      const { type, scale } = pickStructureType();
      return {
        ...s,
        type,
        pos: new THREE.Vector3(x, h, z),
        rotation: Math.random() * Math.PI * 2,
        scale,
        parts: generatePartsForStructure(type),
      };
    }
    return s;
  });
  return changed ? next : prev;
}

export function recyclePlants(
  prev: PlantData[],
  cameraPos: THREE.Vector3,
  viewDistance: number,
): PlantData[] {
  const maxDist = (viewDistance + 1) * CHUNK_SIZE;
  let changed = false;
  const next = prev.map((p) => {
    if (p.pos.distanceTo(cameraPos) > maxDist) {
      changed = true;
      const { x, z, biome } = randomBiomePos(cameraPos, viewDistance);
      const h = getTerrainHeight(x, z).height;
      const type = pickPlantType(biome);
      return {
        ...p,
        type,
        pos: new THREE.Vector3(x, h, z),
        rotation: Math.random() * Math.PI * 2,
        scale: 1.2 + Math.random() * 0.8,
        parts: generatePartsForPlant(type),
        hp: 100,
        maxHp: 100,
      };
    }
    return p;
  });
  return changed ? next : prev;
}

export function craterAdjustedHeight(
  pos: THREE.Vector3,
  craters: { x: number; z: number; r: number; d: number }[],
): number {
  let finalH = getTerrainHeight(pos.x, pos.z).height;
  for (const c of craters) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < c.r) finalH -= c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
  }
  return finalH;
}

export function applyCraterGravity(
  items: { id: number; pos: THREE.Vector3 }[],
  craters: { x: number; z: number; r: number; d: number }[],
  delta: number,
  vys: Record<number, number>,
): void {
  for (const it of items) {
    const finalH = craterAdjustedHeight(it.pos, craters);
    if (it.pos.y > finalH + 0.01) {
      const vy = (vys[it.id] ?? 0) - 9.8 * delta;
      vys[it.id] = vy;
      it.pos.y += vy * delta;
      if (it.pos.y <= finalH) {
        it.pos.y = finalH;
        vys[it.id] = 0;
      }
    } else {
      it.pos.y = finalH;
      vys[it.id] = 0;
    }
  }
}

export function clearChunkStorage(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("spell_lab_chunk_")) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}

export function useWorldTick({
  craters,
  structures,
  plants,
  viewDistance,
  setDummies,
  setZombies,
  setStructures,
  setPlants,
}: {
  craters: { x: number; z: number; r: number; d: number }[];
  structures: StructureData[];
  plants: PlantData[];
  viewDistance: number;
  setDummies: React.Dispatch<React.SetStateAction<DummyType[]>>;
  setZombies: React.Dispatch<React.SetStateAction<ZombieType[]>>;
  setStructures: React.Dispatch<React.SetStateAction<StructureData[]>>;
  setPlants: React.Dispatch<React.SetStateAction<PlantData[]>>;
}) {
  const { camera } = useThree();
  const structureVys = useRef<Record<number, number>>({});
  const plantVys = useRef<Record<number, number>>({});
  const lastCheck = useRef(0);

  useFrame((state, delta) => {
    applyCraterGravity(structures, craters, delta, structureVys.current);
    applyCraterGravity(plants, craters, delta, plantVys.current);
    if (state.clock.elapsedTime - lastCheck.current <= 1.5) return;
    lastCheck.current = state.clock.elapsedTime;
    const now = Date.now();
    setDummies((prev) => recycleDummies(prev, camera.position, viewDistance, now));
    setZombies((prev) => recycleZombies(prev, camera.position, viewDistance, now));
    setStructures((prev) => recycleStructures(prev, camera.position, viewDistance));
    setPlants((prev) => recyclePlants(prev, camera.position, viewDistance));
  });
}
