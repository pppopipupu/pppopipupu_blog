// Pure geometry and timing helpers for the intro prelude: word layout from font metrics, the
// slam-in flight model and the easings, all deterministic and free of React.

import * as THREE from "three";
import type { Font } from "three-stdlib";

export const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

// The letters arrive at full speed and stop dead, so the position eases IN (accelerating) while
// everything else eases out of the hit.
export const easeInCubic = (u: number) => u * u * u;
export const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
export const easeOutQuint = (u: number) => 1 - (1 - u) ** 5;

/** Deterministic 32-bit PRNG so a take can be replayed while debugging. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pen x offsets for a single-line word, matching THREE.TextGeometry's own layout: each glyph
 * outline is drawn relative to the running pen offset, so positioning one single-glyph Text3D mesh
 * per letter at these x values reproduces the exact word geometry of the landing canvas.
 */
export function penOffsets(font: Font, word: string, size: number): { chars: string[]; x: number[]; width: number } {
  const glyphs = font.data.glyphs;
  const resolution = font.data.resolution;
  const chars = Array.from(word);
  const x: number[] = [];
  let pen = 0;
  for (const char of chars) {
    x.push(pen);
    const glyph = glyphs[char] ?? glyphs["?"];
    pen += glyph ? (glyph.ha * size) / resolution : 0;
  }
  return { chars, x, width: pen };
}

export type WordBounds = {
  /** Offset that centres the pen-laid glyph union on the word group's origin. */
  offsetX: number;
  offsetY: number;
  /** Ink size of the whole word at size 1 (before any fit scale). */
  width: number;
  height: number;
};

/**
 * Bounding box of a pen-laid word: Text3D's own <Center> centres the merged geometry, so the intro
 * has to centre on the drawn ink as well or the handoff would be off by the side bearings of the
 * first and last glyph. Returns the centring offset and the ink size, which is what the handoff
 * scale has to be solved against (pen advances overstate the drawn width slightly).
 */
export function wordBounds(geometries: (THREE.BufferGeometry | undefined)[], penX: number[]): WordBounds {
  const box = new THREE.Box3();
  const translated = new THREE.Box3();
  const shift = new THREE.Vector3();
  let sawBox = false;
  for (let index = 0; index < geometries.length; index++) {
    const geometry = geometries[index];
    if (!geometry) continue;
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (!bounds) continue;
    translated.copy(bounds).translate(shift.set(penX[index] ?? 0, 0, 0));
    box.union(translated);
    sawBox = true;
  }
  if (!sawBox) return { offsetX: 0, offsetY: 0, width: 1, height: 1 };
  return {
    offsetX: -(box.min.x + box.max.x) / 2,
    offsetY: -(box.min.y + box.max.y) / 2,
    width: Math.max(0.001, box.max.x - box.min.x),
    height: Math.max(0.001, box.max.y - box.min.y),
  };
}

/**
 * Soft round sprite for THREE.Points: the default point rasterisation gives hard squares, which
 * read as pixel noise next to glowing letters. Caller owns disposal.
 */
export function createSoftSprite(size = 64): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Landing slot of a single letter inside the word group. */
export type WordOffset = { x: number; y: number };

export type ScreenRect = { x: number; y: number; width: number; height: number };

/** Screen NDC -> world point on the z = planeZ plane (the plane the hero word is drawn on). */
export function planePoint(
  ndcX: number,
  ndcY: number,
  camera: THREE.Camera,
  planeZ: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  out.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position);
  const depth = out.z;
  if (Math.abs(depth) < 1e-6) return out.set(0, 0, planeZ);
  return out.multiplyScalar((planeZ - camera.position.z) / depth).add(camera.position);
}

export type HandoffScratch = { left: THREE.Vector3; right: THREE.Vector3; center: THREE.Vector3 };

/**
 * Solves the handoff from the intro word to the landing canvas word: the group scale that makes
 * the intro's ink cover the canvas word's screen pixels, and the centre it has to sit at.
 * `scratch.center` receives that centre.
 *
 * `localWidth` is the intro word's drawn width at the current group scale, `localDepth` its front
 * face offset (same units) and `rect` the canvas word's rect in CSS pixels, measured at the canvas
 * word's own front face, since that face is the outline the eye compares.
 */
export function solveHandoff(
  rect: ScreenRect,
  camera: THREE.Camera,
  size: { width: number; height: number },
  localWidth: number,
  planeZ: number,
  localDepth: number,
  scratch: HandoffScratch,
): number {
  const ndcY = 1 - (rect.y / size.height) * 2;
  const leftNdc = ((rect.x - rect.width / 2) / size.width) * 2 - 1;
  const rightNdc = ((rect.x + rect.width / 2) / size.width) * 2 - 1;
  // The face's plane depends on the scale, so solve on the mid plane first and refine once.
  const front = Math.sign(camera.position.z - planeZ) * Math.abs(localDepth);
  const span = (plane: number) => {
    planePoint(leftNdc, ndcY, camera, plane, scratch.left);
    planePoint(rightNdc, ndcY, camera, plane, scratch.right);
    return Math.abs(scratch.right.x - scratch.left.x);
  };
  const width = Math.max(0.001, localWidth);
  const scale = span(planeZ + front * (span(planeZ) / width)) / width;
  // Centre on the outline's plane; the group itself stays on planeZ, since its origin is the word's
  // centre and that is what has to land on the landing word's centre.
  planePoint((rect.x / size.width) * 2 - 1, ndcY, camera, planeZ + front * scale, scratch.center);
  scratch.center.z = planeZ;
  return scale;
}

export type LetterFlight = {
  /** Seconds on the score clock when this letter touches down. */
  land: number;
  /** Seconds when it becomes visible. */
  start: number;
  fromPosition: THREE.Vector3;
  fromRotation: THREE.Euler;
  fromScale: number;
  /** Resting depth of the letter mesh: half the extrude height below z=0, so the drawn word is
   * depth-centred on the same plane as the landing canvas word (Text3D + <Center>). */
  restZ: number;
};

export type LetterPose = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
};

export function createPose(): LetterPose {
  return {
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  };
}

/**
 * Random spawn pose for a letter: off-screen, oversized and tumbling, aimed at its landing slot.
 * `aspect`, `fov` and `cameraZ` are used to guarantee the spawn point really is outside the
 * frustum, so nothing ever fades in on screen.
 */
export function makeFlight(
  rng: () => number,
  land: number,
  gap: number,
  landing: WordOffset,
  view: { aspect: number; fov: number; cameraZ: number; scale: number; restZ: number },
): LetterFlight {
  const halfHeight = (cameraDistance: number) => Math.tan((view.fov * Math.PI) / 360) * cameraDistance;
  const angle = rng() * Math.PI * 2;
  const tilt = (rng() - 0.5) * 1.1;
  const depth = -7 + rng() * 10;
  let radius = 16 + rng() * 10;
  // Push the spawn out until it clears the frustum at its own depth.
  const cameraDistance = view.cameraZ - depth;
  const halfWidthWorld = halfHeight(cameraDistance) * view.aspect;
  const halfHeightWorld = halfHeight(cameraDistance);
  const outward = new THREE.Vector3(Math.cos(angle), Math.sin(angle) * 0.75 + tilt, 0).normalize();
  for (let attempt = 0; attempt < 6; attempt++) {
    const x = landing.x + outward.x * radius;
    const y = landing.y + outward.y * radius;
    if (Math.abs(x) > halfWidthWorld + 2 && Math.abs(y) > halfHeightWorld + 1.5) break;
    radius *= 1.25;
  }
  const fromPosition = new THREE.Vector3(
    landing.x + outward.x * radius,
    landing.y + outward.y * radius,
    depth,
  ).multiplyScalar(view.scale);
  const fromRotation = new THREE.Euler(
    (rng() - 0.5) * Math.PI * 1.9,
    (rng() - 0.5) * Math.PI * 1.9,
    (rng() - 0.5) * Math.PI * 1.9,
  );
  return {
    land,
    // The flight always fits inside the gap before the hit, so every letter is still moving when
    // it lands.
    start: land - Math.min(0.5, Math.max(0.17, gap * 0.78)),
    fromPosition,
    fromRotation,
    fromScale: 1.35 + rng() * 0.5,
    restZ: view.restZ,
  };
}

/**
 * Evaluates a letter at score time `t` into `pose` (no allocation). Returns false while the letter
 * is still hidden. `landing` is the letter's final position in word-group space; `restScale` is the
 * word's fit scale for the current viewport.
 */
export function evaluateLetter(
  flight: LetterFlight,
  landing: WordOffset,
  restScale: number,
  t: number,
  pose: LetterPose,
): boolean {
  if (t < flight.start) {
    pose.scale.setScalar(0);
    return false;
  }
  const span = Math.max(1e-4, flight.land - flight.start);
  const approach = easeInCubic(clamp01((t - flight.start) / span));
  pose.position.set(
    THREE.MathUtils.lerp(flight.fromPosition.x, landing.x * restScale, approach),
    THREE.MathUtils.lerp(flight.fromPosition.y, landing.y * restScale, approach),
    THREE.MathUtils.lerp(flight.fromPosition.z, flight.restZ, approach),
  );
  pose.rotation.set(
    THREE.MathUtils.lerp(flight.fromRotation.x, 0, approach),
    THREE.MathUtils.lerp(flight.fromRotation.y, 0, approach),
    THREE.MathUtils.lerp(flight.fromRotation.z, 0, approach),
  );
  const scale = THREE.MathUtils.lerp(flight.fromScale, restScale, approach);
  if (t < flight.land) {
    pose.scale.setScalar(scale);
    return true;
  }
  // Impact: a damped squash that settles on the exact rest pose, so the handoff starts clean.
  const tau = t - flight.land;
  const wobble = Math.exp(-11 * tau) * Math.sin(26 * tau);
  pose.position.y -= 0.16 * wobble;
  pose.rotation.set(0, 0, 0);
  pose.scale.set(
    scale * (1 + 0.16 * wobble),
    scale * (1 - 0.22 * wobble),
    scale * (1 + 0.16 * wobble),
  );
  return true;
}
