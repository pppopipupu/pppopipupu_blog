# Page UI & Interaction Rules: Main Page

This document defines the development rules, styles, and architecture for the main index page (app/page.tsx).

## Overview

The home page is designed with a retro Y2K / Geocities aesthetic ("Angry rule world"). It features vibrant neon text, blinking text, retro marquee text, and 3D glowing text elements inside a React Three Fiber canvas.

## UI Styling Conventions

When editing the home page style, adhere to the following retro styling CSS animations and classes defined in the page:
- blink-text: Animation that alternates opacity between 0 and 1 every 0.5 seconds.
- rainbow-text: Linear horizontal color gradient shifting animation. Used for prominent headers.
- marquee-container & marquee-text: Simulates a classic HTML marquee tag using CSS transforms. Used for welcoming banners.
- bouncing-text: Simulates a bouncing text layout. Used for table headers and link items.
- Colors: Stick to primary neon tones: green (#00ff00), magenta (#ff00ff), cyan (#00ffff), yellow (#ffff00), and solid black (#000000) for the background pattern.

## Core Interactions

1. 3D Text canvas:
   - Contains a Canvas component displaying a Three3D mesh rotating along the Y-axis.
   - Utilizes custom lights and postprocessing bloom to create a strong glowing vibe.
   - Ref pointer modifications must be done inside the useFrame hook instead of state triggers.

2. Navigation Links:
   - Links to "/spell-lab" (Spell Lab 3D scene) and "/games" (Retro clicker game) are displayed inside custom styled buttons.
   - Ensure the hover transition scaling (e.g., scale(1.08)) and high-contrast drop-shadows are preserved.

3. Comments board (Giscus):
   - Renders Giscus integration with a customized CSS file.
   - Giscus settings must point to the repository "pppopipupu/pppopipupu_blog".
