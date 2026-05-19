<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Structure

This is a Next.js (App Router) project with a focus on a React Three Fiber (R3F) 3D interactive "Spell Laboratory" scene.

```text
├── app/                  # Next.js App Router pages and layouts
├── components/           # React components (UI and 3D)
│   ├── spell-lab/        # Modularized 3D Spell Laboratory components
│   │   ├── entities/     # 3D interactive entities (e.g., DummyEntity)
│   │   ├── spells/       # Individual spell effects
│   │   │   ├── InfiniteTerrain.tsx  # Infinite terrain mesh and Perlin generator
│   │   │   ├── FluidSimulation.tsx  # Cellular automata shallow water simulation
│   │   │   └── ...
│   │   ├── Effects.tsx   # Reusable particle and visual effects
│   │   ├── Spells.tsx    # Central export for spell components
│   │   └── types.ts      # Shared TypeScript interfaces and constants
│   ├── SpellLabScene.tsx         # Main R3F Canvas and scene orchestration
│   ├── DynamicSpellLabScene.tsx  # Next.js dynamic import wrapper (SSR disabled)
│   ├── GlassOverlay.tsx          # UI overlay for spell selection and stats
│   ├── ArcaneCursorTrail.tsx     # Custom cursor trail effect
│   └── ...
├── lib/                  # Utility functions and shared logic
├── public/               # Static assets
└── ...
```

## Important Interfaces & Types

### 1. `DummyType` & `ZombieType` (Location: `components/spell-lab/types.ts`)
Defines the state of the target dummies and summoned zombies in the 3D scene.
```typescript
import * as THREE from "three";

export interface DummyType {
  id: number;
  pos: THREE.Vector3;       // Current position in the 3D world
  target: THREE.Vector3;    // Target position for movement animation
  hp: number;               // Current health points
  maxHp: number;            // Maximum health points
  color?: string;           // Optional color override
  hitFlash?: number;        // Timer/flag for hit flash effect
  deathTime?: number;       // Time of death timestamp
  consumed?: boolean;       // Set to true if the corpse is consumed by Animate Dead
}

export interface ZombieType {
  id: number;
  pos: THREE.Vector3;       // Current position in the 3D world
  target: THREE.Vector3;    // Target position for movement/AI tracking
  hp: number;               // Current health points
  maxHp: number;            // Maximum health points
  hitFlash?: number;        // Timer/flag for hit flash effect
  lastAttackTime?: number;  // Cooldown timer for the Slam attack
  deathTime?: number;       // Time of death timestamp
}
```

### 2. `SpellType` (Location: `components/SpellLabScene.tsx`)
Defines the available spells that can be cast in the laboratory.
```typescript
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall" | "animate-dead";
```

### 3. Scene Constants (Location: `components/spell-lab/types.ts`)
```typescript
export const GRID = 160;   // Defines the size of the terrain grid
export const CELL = 1.0;   // Base scale unit for the grid
```

### 4. `InfiniteTerrain` (Location: `components/spell-lab/spells/InfiniteTerrain.tsx`)
Generates infinite dual-channel Perlin noise terrain and handles chunk-based craters save.
```typescript
export function getTerrainHeight(x: number, z: number): { height: number; isWater: boolean; baseWaterLevel: number };
export function saveCraterToChunk(c: { x: number; z: number; r: number; d: number }): void;
export function getModifiedHeight(x: number, z: number, globalCraters: any[]): number;
export function InfiniteTerrain({ cameraPos, cratersVersion, viewDistance }: { cameraPos: THREE.Vector3; cratersVersion: number; viewDistance?: number }): React.JSX.Element;
```

### 5. `FluidSimulation` (Location: `components/spell-lab/spells/FluidSimulation.tsx`)
Simulates and renders dynamic shallow water.
```typescript
export function FluidSimulation({ craters, cameraPos, viewDistance }: { craters: any[]; cameraPos: THREE.Vector3; viewDistance?: number }): React.JSX.Element;
```

## Architectural Notes
- **SSR Disabled for 3D**: Any component utilizing `@react-three/fiber` or `three` should be dynamically imported with `ssr: false` (e.g., `DynamicSpellLabScene.tsx`) to avoid server-side hydration mismatches and window undefined errors.
- **State Management**: The 3D scene (`SpellLabScene.tsx`) maintains the state for entities (`dummies`, `zombies`, `fireballs`, `craters`, etc.) and passes relevant state down to specific components in `components/spell-lab/`.
- **Entity Physics & Falling**: All active entities (dummies, corpse items, and zombies) execute individual real-time gravity physics simulations. If their base terrain is destroyed (craters created under them) or they move over ledges, they will suffer standard vertical falling physics acceleration until they land on the modified ground.
- **Animations**: Entity animations (like wandering, walking, and zombie slam attacks) are handled inside their respective components (e.g., `DummyEntity.tsx`, `ZombieEntity.tsx`) using the `useFrame` hook to mutate refs directly for performance, rather than updating React state on every frame.
