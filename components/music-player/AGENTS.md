# Music Player Rules

- Static export has no runtime API routes: the tracklist is generated at config load in
  `next.config.ts` (scan of `public/music/` -> `list.json`) and fetched by the client with the
  `NEXT_PUBLIC_BASE_PATH` prefix. Do not replace it with a runtime directory scan.
- The particle Canvas overlays the player; `pointerEvents: "none"` on the canvas and its container
  must stay, so clicks reach the buttons underneath.
- No comments: when editing these files, do not add or delete comments.
