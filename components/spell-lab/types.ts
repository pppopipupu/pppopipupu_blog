import * as THREE from "three";

export const GRID = 160;
export const CELL = 1.0;

export interface DummyType {
  id: number;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  hp: number;
  maxHp: number;
  color?: string;
  hitFlash?: number;
  deathTime?: number;
  consumed?: boolean;
}

export interface ZombieType {
  id: number;
  pos: THREE.Vector3;
  target: THREE.Vector3;
  hp: number;
  maxHp: number;
  hitFlash?: number;
  lastAttackTime?: number;
  deathTime?: number;
}

export type DamageType =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder";

export const DAMAGE_INFO: Record<DamageType, { name: string; color: string }> = {
  acid: { name: "强酸", color: "#39ff14" },
  bludgeoning: { name: "钝击", color: "#aaaaaa" },
  cold: { name: "寒冷", color: "#00f0ff" },
  fire: { name: "火焰", color: "#ff3c00" },
  force: { name: "力场", color: "#8b0000" },
  lightning: { name: "闪电", color: "#00a2ff" },
  necrotic: { name: "暗蚀", color: "#7000aa" },
  piercing: { name: "穿刺", color: "#e5b750" },
  poison: { name: "毒素", color: "#a000e0" },
  psychic: { name: "心灵", color: "#ff00cc" },
  radiant: { name: "光耀", color: "#ffe066" },
  slashing: { name: "挥砍", color: "#ff5555" },
  thunder: { name: "雷鸣", color: "#20e070" }
};

export interface CraterType {
  x: number;
  z: number;
  r: number;
  d: number;
}

export const CHUNK_SIZE = 40;

export type StructureType =
  | "cabin"
  | "windmill"
  | "mine"
  | "tower"
  | "well"
  | "obelisk"
  | "shrine"
  | "ruins"
  | "campfire"
  | "box-pile";

export interface StructurePart {
  id: string;
  localOffset: THREE.Vector3;
  color: string;
  size: THREE.Vector3;
  type: "box" | "cylinder" | "cone" | "sphere";
  rotation?: THREE.Euler;
  segments?: number;
  segmentsHeight?: number;
}

export interface StructureData {
  id: number;
  type: StructureType;
  pos: THREE.Vector3;
  rotation: number;
  scale: number;
  parts: StructurePart[];
}

