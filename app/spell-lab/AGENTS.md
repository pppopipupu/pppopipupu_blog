# Page UI & Interaction Rules: Spell Lab Interface

This document defines the development rules, global state, controls, and database syncing for the Spell Lab interface (app/spell-lab/page.tsx).

## UI Specifications

1. Slider Elements:
   - Use custom input range elements with the class "y2k-slider".
   - The slider thumb uses cyan styling with sharp outset borders.

2. First Person UI:
   - Renders a green target crosshair in the center of the Canvas wrapper.
   - A health bar at the bottom center displaying HP (0-100).
   - "YOU DIED" death overlay appears when player HP drops to 0 or below, offering a respawn action.
   - Basic control instruction box at top-left.

## Controls & Listeners

1. Key Bindings:
   - "Q" key toggles the first-person perspective on or off. Toggling it on resets player HP to 100.
   - "E" key rotates the selected spell through the list of available spells.
   - Event listeners are bound on mount and must ignore keystrokes when standard input/textarea fields are active.

2. Mouse Interaction:
   - Prevent default behavior for middle-click (button 1) to protect camera orbit controls.

3. Reset Logic:
   - Trigger the global function `window.__spellLabReset` when the RESET button is clicked to restore the 3D workspace.

## Render Configuration Cache

- Configurations (viewDistance, fogEnabled, waterEnabled) must be read from localStorage on mount.
- Changes to these values must update local state and be written to localStorage immediately.

## Database Syncing

- Check the current Supabase session. If the user is authenticated, query the `spell_lab_stats` table for `cast_count`.
- If no record exists (error PGRST116), insert a new record for the user with a count of 0.
- Increment the local count and perform an upsert query to update `cast_count` when a spell is cast.
