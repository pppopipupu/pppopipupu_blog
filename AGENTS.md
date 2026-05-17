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
│   │   ├── spells/       # Individual spell effects (Fireball, LightningStrike, etc.)
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

### 1. `DummyType` (Location: `components/spell-lab/types.ts`)
Defines the state of the target dummies in the 3D scene.
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
}
```

### 2. `SpellType` (Location: `components/SpellLabScene.tsx`)
Defines the available spells that can be cast in the laboratory.
```typescript
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall";
```

### 3. Scene Constants (Location: `components/spell-lab/types.ts`)
```typescript
export const GRID = 160;   // Defines the size of the terrain grid
export const CELL = 1.0;   // Base scale unit for the grid
```

## Architectural Notes
- **SSR Disabled for 3D**: Any component utilizing `@react-three/fiber` or `three` should be dynamically imported with `ssr: false` (e.g., `DynamicSpellLabScene.tsx`) to avoid server-side hydration mismatches and window undefined errors.
- **State Management**: The 3D scene (`SpellLabScene.tsx`) maintains the state for entities (`dummies`, `fireballs`, `craters`, etc.) and passes relevant state down to specific components in `components/spell-lab/`.
- **Animations**: Entity animations (like wandering and walking) are handled inside their respective components (e.g., `DummyEntity.tsx`) using the `useFrame` hook to mutate refs directly for performance, rather than updating React state on every frame.
