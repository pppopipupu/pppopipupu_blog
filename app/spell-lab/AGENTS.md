# Spell Lab Page Rules

- Keyboard bindings (Q first-person toggle, E spell cycle) must be ignored while an input/textarea
  field is focused.
- Middle-click (button 1) must be `preventDefault`ed to protect OrbitControls.
- The RESET button talks to the scene through the global `window.__spellLabReset`, which
  `SpellLabScene` sets and clears on mount/unmount; keep both sides in sync.
- Supabase stats: a missing `spell_lab_stats` row surfaces as error code PGRST116 - that is the
  "first visit" signal (insert with count 0), not a failure. `cast_count` updates are upserts.
