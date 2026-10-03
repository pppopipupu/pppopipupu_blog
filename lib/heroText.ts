// Shared geometry and material for the site's 3D hero word. The landing canvas and the intro
// prelude that slams the same word in must build both identically: the intro morphs onto the canvas
// word's screen rect and cross-fades, so any divergence in font, extrude options, material or
// camera pops at the handoff.

export const HERO_TEXT = "pppopipupu";

// Self-hosted so the intro never waits on a CDN; both canvases then share one parsed font instance
// through R3F's loader cache.
export const TEXT3D_FONT_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/fonts/helvetiker_regular.typeface.json`;

export const TEXT3D_GEOMETRY = {
  size: 2,
  height: 0.5,
  curveSegments: 12,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.05,
  bevelOffset: 0,
  bevelSegments: 5,
} as const;

export const HERO_MATERIAL = {
  color: "#ffffff",
  roughness: 0.2,
  metalness: 0.8,
  emissive: "#ffd700",
} as const;

// Emissive intensity both canvases sit at when the word is at rest; the canvas pulses around it.
export const HERO_EMISSIVE_BASE = 1.5;

// Extruded glyphs run from -bevelThickness to height + bevelThickness along z, so a word centred on
// its bounding box has its front face this far towards the camera from its centre plane. An
// extrusion's visible outline is its front face (the back is hidden behind it), so the intro handoff
// matches screen sizes there - in world units, scaled by the word's own scale first.
export const TEXT3D_FRONT_OFFSET = TEXT3D_GEOMETRY.height / 2 + TEXT3D_GEOMETRY.bevelThickness;

export const HERO_CAMERA = { fov: 50, z: 10 } as const;

// World-space height the camera sees at the z=0 plane, for a vertical fov in degrees.
export function visibleWorldHeight(fov: number, z: number) {
  return 2 * z * Math.tan((fov * Math.PI) / 360);
}
