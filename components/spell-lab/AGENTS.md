# Component Architecture & Style Guidelines: Spell Lab Components

This document contains instructions for R3F components, entities, terrain, and custom rendering physics inside components/spell-lab/.

## Important Interfaces & Types

### 1. DummyType & ZombieType
Defines the structure of target dummies and summoned zombies (defined in components/spell-lab/types.ts):
```typescript
import * as THREE from "three";

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
```

### 2. Scene Constants
Defines global size metrics for terrain and meshes:
- GRID = 160: Defines the boundary size of the terrain grid.
- CELL = 1.0: Base scale unit for the grid cells.

### 3. InfiniteTerrain (components/spell-lab/spells/InfiniteTerrain.tsx)
Handles dual-channel noise terrain and saves crater states:
- getTerrainHeight(x, z): Returns object `{ height, isWater, baseWaterLevel }`.
- saveCraterToChunk(crater): Records crater center, radius, and depth.
- getModifiedHeight(x, z, craters): Computes height at coords after applying crater offsets.

### 4. FluidSimulation (components/spell-lab/spells/FluidSimulation.tsx)
Calculates and simulates shallow water using shallow water heightfields:
- Takes craters, cameraPos, and viewDistance.

## Physics & Animation Notes

- Entity Physics & Falling: Active entities (dummies, corpse items, zombies) calculate real-time falling physics. If terrain is destroyed beneath them (e.g. crater created), gravity acceleration pulls them downwards until they collide with the new floor height.
- Animations: Wander routes and zombie attack swings are calculated inside the component (DummyEntity.tsx, ZombieEntity.tsx) using the R3F useFrame loop. Mutate refs directly rather than triggering state updates on every frame to avoid rendering bottlenecks.
