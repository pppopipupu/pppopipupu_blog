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
│   ├── music-player/     # Music player sub-specifications
│   │   └── AGENTS.md     # Sub-specification for the Y2K music player
│   ├── MusicPlayer.tsx           # Winamp-styled Y2K music player component
│   ├── DynamicMusicPlayer.tsx    # SSR disabled wrapper for music player
│   ├── SpellLabScene.tsx         # Main R3F Canvas and scene orchestration
│   ├── DynamicSpellLabScene.tsx  # Next.js dynamic import wrapper (SSR disabled)
│   ├── GlassOverlay.tsx          # UI overlay for spell selection and stats
│   ├── ArcaneCursorTrail.tsx     # Custom cursor trail effect
│   └── ...
├── lib/                  # Utility functions and shared logic
├── public/               # Static assets
└── ...
```

## Developer Guidelines & Sub-Specifications

To maintain high development efficiency, the project specifications are modularized and distributed directly within their corresponding subfolders. When modifying code or adding features, you must first read the specification document located in the folder where the change is taking place:

1. For modifications to general page layouts, core page logic, or specific views inside the App Router:
   - Homepage (app/page.tsx) layout and retro styling classes: Read [app/AGENTS.md](app/AGENTS.md)
   - Article display and basic text typography: Read [app/articles/first/AGENTS.md](app/articles/first/AGENTS.md)
   - Games lobby, GitHub Auth integration, and gaming actions: Read [app/games/AGENTS.md](app/games/AGENTS.md)
   - Spell lab page wrapper, keystroke listeners, render configs, and stats syncing: Read [app/spell-lab/AGENTS.md](app/spell-lab/AGENTS.md)

2. For modifications to React UI, R3F canvases, global hooks, or scene state orchestration:
   - General components, SSR wrappers, and canvas structures: Read [components/AGENTS.md](components/AGENTS.md)

3. For modifications to the 3D Spell Laboratory elements:
   - Entity physics, animation loops, terrain generation, or shallow water simulation: Read [components/spell-lab/AGENTS.md](components/spell-lab/AGENTS.md)

4. For modifications to the Music Player, playlist logic, or R3F border particle physics:
   - Music player architecture, glitched physical simulation, and scan workflow: Read [components/music-player/AGENTS.md](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/music-player/AGENTS.md)
