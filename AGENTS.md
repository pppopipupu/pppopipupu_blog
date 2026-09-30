<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Sub-specifications

Read the AGENTS.md of the directory you are about to modify. For `components/` subdirectories read
`components/AGENTS.md` first, then the subfolder spec:

- `app/games/` -> `app/games/AGENTS.md`
- `app/spell-lab/` -> `app/spell-lab/AGENTS.md`
- `components/` -> `components/AGENTS.md`
- `components/cozy-room/` -> `components/cozy-room/AGENTS.md`
- `components/music-player/` -> `components/music-player/AGENTS.md`
- `components/space/` -> `components/space/AGENTS.md`
- `incremental/` -> `incremental/AGENTS.md`

## Toolchain & config pitfalls

- TypeScript 7 (`typescript@^7`, the native compiler) is the only TypeScript install and ships no
  JS compiler API, so tools that import `typescript` for one cannot run at all: `next.config.ts`
  pins `experimental.useTypeScriptCli: true` (the Next 16.3 default, pinned explicitly because
  `npm run build` depends on it) and Next runs the project-local `tsc` for the build's type check.
  There is no `typescript.ignoreBuildErrors`: a type error fails `npm run build`.
- `npm run typecheck` runs two projects (root plus `incremental/tsconfig.json`); a bare `tsc`
  silently misses `incremental/src`.
- ESLint is intentionally absent. `typescript-eslint` still rejects TypeScript 7
  (typescript-eslint#10940) and its only workaround conflicts with the single-TypeScript-7 setup.
  Restore lint only together with a toolchain that supports TS 7.1+.
- `reactStrictMode: false` in `next.config.ts` is load-bearing: React 19 StrictMode double-mounts
  R3F Canvases in dev, duplicating WebGL contexts that the browser then recycles/loses. Do not
  re-enable it.
- Scripts under `crop/` are Bun-only shader experiments, gitignored scratch space
  (`bun crop/build-*.mjs`), not part of the app build.
