# Incremental Game (Solid.js)

Static asset for `/incremental/`; its own Vite build, no React, no Next runtime, no SSR.

## Commands

- `npm run dev:solid` (`vite build --watch` into `public/incremental/`) runs alongside
  `npm run dev`.
- `npm run build:solid` is the one-off bundle build; `npm run typecheck` covers both tsconfigs.
- In dev, `next dev` does not resolve a directory index: load `/incremental/index.html`.

## Rules

1. Separate TypeScript project (`jsx: preserve`, `jsxImportSource: solid-js`): keep it excluded
   from the root `tsconfig.json` and never import `incremental/src` from a root file.
2. React and `solid-js` never mix: no `solid-js` import under `app/` or `components/`, no React
   import under `src/`.
3. `public/incremental/` is generated and gitignored. Never hand-edit or commit it.
4. `next.config.ts` needs no Solid wiring (`output: "export"` copies `public/` verbatim); new
   runtime assets go in `incremental/public/` or are referenced relative to `index.html`.
5. Prove changes with `npm run typecheck` plus a real browser load of the dev URL; a green
   `vite build` only proves it compiled.
