<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Sub-specifications

Read the AGENTS.md of the directory you are about to modify. For `components/` subdirectories read
`components/AGENTS.md` first, then the subfolder spec: `app/games/`, `app/spell-lab/`,
`components/cozy-room/`, `components/intro/`, `components/music-player/`, `components/space/`,
`incremental/`.

## Toolchain & config pitfalls

- TypeScript 7 (`typescript@^7`, the native compiler) ships no JS compiler API, so tools that
  import `typescript` for one cannot run at all: `next.config.ts` pins
  `experimental.useTypeScriptCli: true` (the Next 16.3 default, pinned because `npm run build`
  depends on it) and the build's type check runs the project-local `tsc`. There is no
  `typescript.ignoreBuildErrors`: a type error fails `npm run build`.
- `npm run typecheck` runs two projects (root plus `incremental/tsconfig.json`); a bare `tsc`
  silently misses `incremental/src`.
- ESLint is intentionally absent: `typescript-eslint` still rejects TypeScript 7
  (typescript-eslint#10940) and its only workaround conflicts with the single-TypeScript-7 setup.
  Restore lint only together with a toolchain that supports TS 7.1+.
- `reactStrictMode: false` in `next.config.ts` is load-bearing: React 19 StrictMode double-mounts
  R3F Canvases in dev, duplicating WebGL contexts that the browser then recycles/loses. Do not
  re-enable it.
- `crop/` is gitignored scratch space: Bun shader experiments (`bun crop/build-*.mjs`) and node
  checks/probes (`node crop/verify-*.mjs`). Never part of the app build.
