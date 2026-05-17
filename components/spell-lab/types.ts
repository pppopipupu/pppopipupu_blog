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
}
