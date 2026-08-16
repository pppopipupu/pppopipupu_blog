# Music Player Architecture & Development Guidelines

This document outlines the architectural design, retro visual system, 3D particle effects, and physical motion engine implementation details of the music player component in this project, providing a reference for future maintenance and modifications.

## Associated Files

- Main player component: [MusicPlayer.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx)
- Dynamic wrapper component: [DynamicMusicPlayer.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/DynamicMusicPlayer.tsx)
- Audio file static scanner: [next.config.ts](file:///c:/Users/pppop/Desktop/pppopipupu_blog/next.config.ts)
- Global layout wrapper: [app/layout.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/app/layout.tsx)

## Core Architectural Design

### 1. Static Audio File Scanning and Loading Mechanism
To comply with the static export limitations of the project (output: 'export'), API Routes cannot be loaded dynamically at runtime for directory scanning. Therefore, the scanning is executed synchronously in the Node.js environment when loading configurations in [next.config.ts](file:///c:/Users/pppop/Desktop/pppopipupu_blog/next.config.ts). This process scans all MP3 files inside `public/music/` and writes their names into `public/music/list.json`.
The client-side player fetches this `list.json` during initialization to construct the tracklist, resolving path routing by prepending the base path environment variable `NEXT_PUBLIC_BASE_PATH`.

### 2. Visual Design System (Y2K Pixel Retro Aesthetics)
The user interface adopts retro pixel styles reminiscent of classic Winamp:
- Dual Borders: Chunky pixelated margins colored with alternating dark and light frames to create an authentic metallic texture.
- Acid Gradient & Neon Colors: Standard palettes utilize neon green (#00ff00) and hot pink (#ff00ff). The CD activation toggle uses a conic-gradient holographic overlay.
- LCD Scrolling Screen: Song titles scroll horizontally via a custom CSS marquee layout using fixed-width LCD typography (Courier New).
- State Synchronization: Current status (enabled or hidden), track information (musicPlayerTrackName, musicPlayerTrackIndex), and playback progress (musicPlayerCurrentTime) are synchronized in localStorage to ensure seamless resumption of audio playback across page navigations and refreshes.

### 3. 3D Particle System and Event Pass-Through
To enhance visual intensity, a React Three Fiber driven `<Canvas>` overlay is integrated on top of the player containing two types of custom particles:
- [Particles](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx#L7): A shifting wave pattern inside the player center that scales dynamic amplitude and speed directly with the playback status.
- [BorderParticles](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx#L53): An array of small boxGeometry meshes spawning at random margins (top, bottom, left, right) and jetting outwards, fading away gradually based on delta life decay.
- Interaction Pass-Through: The 3D Canvas element is positioned at z-index: 3. To avoid blocking pointer gestures, custom styles are declared with `pointerEvents: "none"` on both the Canvas and its container. This permits click events to transparently reach underneath to z-index: 2 interactive buttons.

### 4. Window Jitter and Glitched Physics Bouncing Engine
- Playback Jitter: When playing, the `jitter-active` CSS class is attached to high-frequency jitter-shake transitions, adding neon blur shadows.
- Glitched Physics Simulation: There is a 30% probability every 5 seconds to trigger a 3.0-second chaotic glitch state when playing.
  - Startup: Current transition styles are saved, and CSS transition animations are temporarily disabled (`transition = "none"`).
  - Physics Calculations: A `requestAnimationFrame` loop calculates velocity offsets (dx and dy) per tick using a high-velocity speed setting (between 3200px/s and 5000px/s).
  - Margin Collisions: When the player container edges touch the viewport borders, coordinate velocities are inverted instantly to bounce without rotating.
  - Eased Home-Return: Instead of teleporting back, the clean-up handler restores the CSS transition properties and clears the transform offset in the next frame. The browser automatically translates the container back smoothly to its default corner offsets (left: 30px, bottom: 30px).

## Development Rules & Constraints

- Strictly No Comments: When updating code files, do not add or delete comments under any circumstances.
- Strictly No Emojis: Do not insert emojis in any documentation, guidelines, or markup files.
- Modern React APIs: Keep hooks structured and use native optimized React features (useMemo, useEffect, useRef).
