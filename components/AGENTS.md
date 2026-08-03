# Component Architecture & Style Guidelines: React Components

This document outlines structural rules, type definitions, and rendering rules for all React and React Three Fiber (R3F) components in components/.

## Important Shared Types

### SpellType
Defines the castable spells in the laboratory (defined in components/SpellLabScene.tsx or DynamicSpellLabScene.tsx):
```typescript
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall" | "animate-dead";
```

## Architectural Notes

### 1. SSR Disabled for 3D Elements
- React Three Fiber and Three.js rely heavily on client-side window APIs.
- Any component imports involving R3F or Three.js must disable Server-Side Rendering (SSR).
- Dynamic import wrappers (like DynamicSpellLabScene.tsx) are configured with `{ ssr: false }` to avoid hydration errors.

### 2. State Management
- The main scene component (SpellLabScene.tsx) owns and acts as the single source of truth for the R3F Canvas state.
- It tracks active entities (dummies, zombies, fireballs, craters) and coordinates state updates.
- Interactive states (like selection or stats overlays) are communicated via prop callbacks.

## Component Subdirectories

For rules regarding specific interactive spell elements, 3D terrains, shallow water simulations, and entity physics, consult:
- [components/spell-lab/AGENTS.md](spell-lab/AGENTS.md)

For the lazy-loaded low-poly Cozy Room 3D bedroom scene (disposal rules, angry ball explosion, lamp toggle, frameloop gating):
- [components/cozy-room/AGENTS.md](cozy-room/AGENTS.md)
