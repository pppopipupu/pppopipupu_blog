"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import SceneErrorBoundary from "./SceneErrorBoundary";
import { checkWebGL } from "./webgl";
import {
  LINE_MAT,
  wireBox,
  wireCircleXZ,
  wireEllipseXY,
  wireArc,
  wirePoly,
  wirePath,
  wireRectXZ,
  wireRectXY,
  mergeLines,
} from "./line-wire";

/* ------------------------------------------------------------------ */
/* Interaction helpers                                                */
/* ------------------------------------------------------------------ */

function pointer(e: ThreeEvent<PointerEvent>, on: boolean) {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
}

/** One line-art stroke (lineSegments sharing the global LINE_MAT). */
function Wire({
  geometry,
  position,
  rotation,
  scale,
  name,
}: {
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  name?: string;
}) {
  return (
    <lineSegments
      geometry={geometry}
      material={LINE_MAT}
      position={position}
      rotation={rotation}
      scale={scale}
      name={name}
    />
  );
}

/** Group with hover pointer cursor + click (ignores orbit drags). */
function HoverGroup({
  name,
  position,
  onClick,
  children,
}: {
  name?: string;
  position?: [number, number, number];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  children: React.ReactNode;
}) {
  return (
    <group
      name={name}
      position={position}
      onPointerOver={(e) => pointer(e, true)}
      onPointerOut={(e) => pointer(e, false)}
      onClick={(e) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Static merged geometries (module-level, built once)                */
/* ------------------------------------------------------------------ */

function buildGeo(pairs: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pairs, 3));
  return g;
}

function rectPts(p: number[], cx: number, cy: number, w: number, h: number, z: number) {
  const x = w / 2;
  const y = h / 2;
  p.push(cx - x, cy - y, z, cx + x, cy - y, z);
  p.push(cx + x, cy - y, z, cx + x, cy + y, z);
  p.push(cx + x, cy + y, z, cx - x, cy + y, z);
  p.push(cx - x, cy + y, z, cx - x, cy - y, z);
}

function rectXZPts(p: number[], cx: number, cz: number, w: number, d: number, y: number) {
  const x = w / 2;
  const z = d / 2;
  p.push(cx - x, y, cz - z, cx + x, y, cz - z);
  p.push(cx + x, y, cz - z, cx + x, y, cz + z);
  p.push(cx + x, y, cz + z, cx - x, y, cz + z);
  p.push(cx - x, y, cz + z, cx - x, y, cz - z);
}

function ellipsePts(p: number[], cx: number, cy: number, rx: number, ry: number, seg: number, z: number) {
  for (let i = 0; i < seg; i++) {
    const a1 = (i / seg) * Math.PI * 2;
    const a2 = ((i + 1) % seg) / seg * Math.PI * 2;
    p.push(cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry, z, cx + Math.cos(a2) * rx, cy + Math.sin(a2) * ry, z);
  }
}

function circleXZPts(p: number[], cx: number, cz: number, r: number, seg: number, y: number) {
  for (let i = 0; i < seg; i++) {
    const a1 = (i / seg) * Math.PI * 2;
    const a2 = ((i + 1) % seg) / seg * Math.PI * 2;
    p.push(cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r, cx + Math.cos(a2) * r, y, cz + Math.sin(a2) * r);
  }
}

/** Ground details: path, stepping stones, grass, stones, back fence. */
const YARD_GEO = (() => {
  const p: number[] = [];
  // path to the door
  p.push(-0.45, 0.02, -2.3, -0.45, 0.02, 3.4);
  p.push(0.45, 0.02, -2.3, 0.45, 0.02, 3.4);
  // stepping stones
  rectXZPts(p, -0.25, -1.9, 0.42, 0.24, 0.015);
  rectXZPts(p, 0.22, -1.2, 0.34, 0.22, 0.015);
  rectXZPts(p, -0.08, -0.5, 0.3, 0.2, 0.015);
  // grass clumps (4 blades each)
  const clumps: [number, number][] = [
    [-3.8, 4.6], [-1.5, 5.2], [0.8, 4.2], [2.9, 4.9], [4.6, 3.4],
    [-5.0, 3.0], [1.2, 2.6], [-2.6, 1.6], [4.9, 5.5], [-4.4, 5.5],
    [3.6, 5.8], [-0.4, 6.0], [1.8, 0.9], [-1.4, 0.4],
  ];
  clumps.forEach(([cx, cz], ci) => {
    for (let i = 0; i < 4; i++) {
      const ang = (ci * 1.7 + i * 1.1) % Math.PI;
      const x0 = cx + Math.cos(ang) * 0.04;
      const z0 = cz + Math.sin(ang) * 0.04;
      p.push(x0, 0.01, z0, x0 + Math.cos(ang + 0.5) * 0.1, 0.16, z0 + Math.sin(ang + 0.5) * 0.1);
    }
  });
  // stones
  const stones: [number, number, number][] = [
    [-4.6, 2.4, 0.15], [-2.2, 4.6, 0.13], [0.6, 5.4, 0.14], [2.6, 3.6, 0.12],
    [4.8, 4.8, 0.13], [-5.4, 4.9, 0.12], [1.9, 5.8, 0.11], [-1.2, 3.2, 0.13],
  ];
  stones.forEach(([x, z, r]) => circleXZPts(p, x, z, r, 6, 0.015));
  // fence behind the house
  for (const fx of [-5.8, -2.9, 0, 2.9, 5.8]) {
    p.push(fx, 0.02, -7.35, fx, 0.92, -7.35);
  }
  p.push(-5.8, 0.5, -7.35, 5.8, 0.5, -7.35);
  p.push(-5.8, 0.72, -7.35, 5.8, 0.72, -7.35);
  return buildGeo(p);
})();

/** Roof outline + gable + tile lines of the house. */
const HOUSE_ROOF_GEO = (() => {
  const p: number[] = [];
  // ridge
  p.push(-4.5, 5.9, -4.75, 4.5, 5.9, -4.75);
  // front slopes + eave
  p.push(-4.5, 5.9, -4.75, -4.5, 3.4, -2.1);
  p.push(4.5, 5.9, -4.75, 4.5, 3.4, -2.1);
  p.push(-4.5, 3.4, -2.1, 4.5, 3.4, -2.1);
  // back slopes + eave
  p.push(-4.5, 5.9, -4.75, -4.5, 3.4, -7.4);
  p.push(4.5, 5.9, -4.75, 4.5, 3.4, -7.4);
  p.push(-4.5, 3.4, -7.4, 4.5, 3.4, -7.4);
  // tile rows (front)
  for (const z of [-2.9, -3.7, -4.4]) {
    const y = 3.4 + (2.5 * (z + 2.1)) / 2.65;
    p.push(-4.5, y, z, 4.5, y, z);
  }
  // gable triangle + decoration (front plane z=-2.1)
  p.push(-2.7, 3.4, -2.1, 0, 5.9, -2.1);
  p.push(0, 5.9, -2.1, 2.7, 3.4, -2.1);
  p.push(0, 3.4, -2.1, 0, 5.9, -2.1);
  p.push(-1.0, 3.4, -2.1, -0.5, 4.6, -2.1);
  p.push(1.0, 3.4, -2.1, 0.5, 4.6, -2.1);
  return buildGeo(p);
})();

/** House front details: beams, door frame, windows, cross bars, side window. */
const HOUSE_FRONT_GEO = (() => {
  const p: number[] = [];
  // mid-height beam
  p.push(-4.1, 1.7, -2.48, 4.1, 1.7, -2.48);
  // door frame
  p.push(-1.1, 0, -2.48, -1.1, 3.2, -2.48);
  p.push(1.1, 0, -2.48, 1.1, 3.2, -2.48);
  p.push(-1.1, 3.2, -2.48, 1.1, 3.2, -2.48);
  // V brace above the door
  p.push(-0.75, 3.0, -2.47, 0, 2.25, -2.47);
  p.push(0.75, 3.0, -2.47, 0, 2.25, -2.47);
  // windows
  for (const wx of [-2.55, 2.55]) {
    rectPts(p, wx, 2.05, 0.85, 0.95, -2.47);
    p.push(wx, 1.575, -2.47, wx, 2.525, -2.47);
    p.push(wx - 0.425, 2.05, -2.47, wx + 0.425, 2.05, -2.47);
    p.push(wx - 0.47, 1.55, -2.47, wx + 0.47, 1.55, -2.47);
  }
  // side window (left wall, YZ plane at x=-3.92)
  const sx = -3.92;
  const sy0 = 1.575;
  const sy1 = 2.525;
  const sz0 = -5.2;
  const sz1 = -4.3;
  p.push(sx, sy0, sz0, sx, sy0, sz1);
  p.push(sx, sy0, sz1, sx, sy1, sz1);
  p.push(sx, sy1, sz1, sx, sy1, sz0);
  p.push(sx, sy1, sz0, sx, sy0, sz0);
  p.push(sx, sy0, -4.75, sx, sy1, -4.75);
  p.push(sx, 2.05, sz0, sx, 2.05, sz1);
  return buildGeo(p);
})();

/** Interior wall shelves + goods (visible through the open door). */
const SHELF_LEVELS = [0.95, 1.75, 2.55];

interface ShelfItem {
  x: number;
  shelf: number;
  type: "jar" | "plate" | "wedge" | "loaf" | "candle" | "jug";
}

const SHELF_ITEMS: ShelfItem[] = [
  { x: -1.35, shelf: 0, type: "jar" },
  { x: -0.6, shelf: 0, type: "plate" },
  { x: 0.15, shelf: 0, type: "wedge" },
  { x: 1.0, shelf: 0, type: "jar" },
  { x: -1.2, shelf: 1, type: "jug" },
  { x: -0.35, shelf: 1, type: "plate" },
  { x: 0.5, shelf: 1, type: "jar" },
  { x: 1.25, shelf: 1, type: "loaf" },
  { x: -1.4, shelf: 2, type: "jar" },
  { x: -0.55, shelf: 2, type: "candle" },
  { x: 0.3, shelf: 2, type: "jug" },
  { x: 1.15, shelf: 2, type: "wedge" },
];

const SHELVES_GEO = (() => {
  const p: number[] = [];
  // frame
  p.push(-1.95, 0.15, -6.55, -1.95, 2.9, -6.55);
  p.push(1.95, 0.15, -6.55, 1.95, 2.9, -6.55);
  p.push(-1.95, 0.15, -6.55, 1.95, 0.15, -6.55);
  p.push(-1.95, 2.9, -6.55, 1.95, 2.9, -6.55);
  SHELF_LEVELS.forEach((y) => p.push(-1.95, y, -6.55, 1.95, y, -6.55));
  // goods
  for (const it of SHELF_ITEMS) {
    const y = SHELF_LEVELS[it.shelf];
    const z = -6.5;
    if (it.type === "jar") {
      rectPts(p, it.x, y + 0.12, 0.16, 0.24, z);
      p.push(it.x - 0.08, y + 0.24, z, it.x + 0.08, y + 0.24, z);
    } else if (it.type === "jug") {
      rectPts(p, it.x, y + 0.15, 0.22, 0.3, z);
      p.push(it.x, y + 0.28, z, it.x, y + 0.36, z);
      p.push(it.x - 0.03, y + 0.36, z, it.x + 0.03, y + 0.36, z);
    } else if (it.type === "plate") {
      ellipsePts(p, it.x, y + 0.015, 0.13, 0.028, 12, z);
    } else if (it.type === "wedge") {
      p.push(it.x - 0.11, y + 0.01, z, it.x + 0.11, y + 0.01, z);
      p.push(it.x + 0.11, y + 0.01, z, it.x, y + 0.13, z);
      p.push(it.x, y + 0.13, z, it.x - 0.11, y + 0.01, z);
    } else if (it.type === "loaf") {
      rectPts(p, it.x, y + 0.07, 0.42, 0.13, z);
    } else {
      // candle: wick + flame triangle
      p.push(it.x, y + 0.01, z, it.x, y + 0.2, z);
      p.push(it.x - 0.05, y + 0.2, z, it.x, y + 0.3, z);
      p.push(it.x, y + 0.3, z, it.x + 0.05, y + 0.2, z);
    }
  }
  return buildGeo(p);
})();

/** Well drum: 10 vertical staves between the rim rings. */
const WELL_DRUM_LINES = (() => {
  const p: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const dx = Math.cos(a) * 0.95;
    const dz = Math.sin(a) * 0.95;
    p.push(dx, 0, dz, dx, 1.15, dz);
  }
  return buildGeo(p);
})();

/** Well mini-roof (relative to well center). */
const WELL_ROOF_GEO = (() => {
  const p: number[] = [];
  const apex = [0, 3.15, 0] as const;
  p.push(...apex, -1.2, 2.6, 0);
  p.push(...apex, 1.2, 2.6, 0);
  p.push(-1.2, 2.6, 0, 1.2, 2.6, 0);
  p.push(...apex, -1.2, 2.6, -0.9);
  p.push(...apex, 1.2, 2.6, -0.9);
  p.push(-1.2, 2.6, -0.9, 1.2, 2.6, -0.9);
  return buildGeo(p);
})();

/** Windlass drum + crank (relative to well center). */
const WELL_WINDLASS_GEO = (() => {
  const p: number[] = [];
  p.push(-0.03, 2.25, -0.85, -0.03, 2.25, 0.85);
  p.push(0.03, 2.31, -0.85, 0.03, 2.31, 0.85);
  p.push(-0.03, 2.25, -0.85, 0.03, 2.31, -0.85);
  p.push(-0.03, 2.25, 0.85, 0.03, 2.31, 0.85);
  p.push(0, 2.28, -0.85, 0, 2.28, -1.15);
  p.push(0, 2.28, -1.15, 0, 2.52, -1.15);
  return buildGeo(p);
})();

/** Bucket staves (relative to bucket origin). */
const BUCKET_LINES = (() => {
  const p: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dx = Math.cos(a) * 0.17;
    const dz = Math.sin(a) * 0.17;
    p.push(dx, 0, dz, dx, 0.24, dz);
  }
  return buildGeo(p);
})();

/** Cheese cart legs (relative to cart center). */
const CART_LEGS = (() => {
  const p: number[] = [];
  for (const [lx, lz] of [[-0.62, -0.42], [0.62, -0.42], [-0.62, 0.42], [0.62, 0.42]]) {
    p.push(lx, 0.02, lz, lx, 0.56, lz);
  }
  return buildGeo(p);
})();

/** Wheel spokes (relative to wheel center). */
const WHEEL_SPOKES = mergeLines(
  wirePath([[-0.24, 0, 0], [0.24, 0, 0]]),
  wirePath([[0, -0.24, 0], [0, 0.24, 0]])
);

/** Cheese wheel: wedge cut (relative to wheel center). */
const CHEESE_CUT = mergeLines(
  wirePath([[0.55, 0.12, 0], [0, 0, 0], [0.55, -0.12, 0]])
);

/** House door strokes (relative to hinge). */
const DOOR_GEO = mergeLines(
  wireRectXY(2.0, 2.55, 0),
  wirePath([[-1.35, -1.1, 0], [-1.35, 1.1, 0]]),
  wirePath([[-0.6, -1.1, 0], [-0.6, 1.1, 0]]),
  wirePath([[-1.15, 0.95, 0], [-0.7, -0.95, 0]]),
  wirePath([[-1.85, -0.32, 0.06], [-1.72, -0.32, 0.06]])
);

/** Pig face details (relative to pig origin). */
const PIG_EYES = mergeLines(
  wirePath([[-0.13, 0.66, 0.53], [-0.09, 0.66, 0.53]]),
  wirePath([[0.09, 0.66, 0.53], [0.13, 0.66, 0.53]])
);

const PIG_SNOUT_LINES = mergeLines(
  wirePath([[-0.04, 0.54, 0.71], [-0.04, 0.56, 0.71]]),
  wirePath([[0.04, 0.54, 0.71], [0.04, 0.56, 0.71]])
);

/** Windmill tower outline. */
const WINDMILL_TOWER_GEO = (() => {
  const p: number[] = [];
  const cx = 6.8;
  const z = -1.0;
  p.push(cx - 0.85, 0.02, z, cx - 0.55, 3.6, z);
  p.push(cx + 0.85, 0.02, z, cx + 0.55, 3.6, z);
  p.push(cx - 0.85, 0.02, z, cx + 0.85, 0.02, z);
  for (const y of [0.9, 1.9, 2.9]) {
    const w = 1.7 - (0.6 * y) / 3.6;
    p.push(cx - w / 2, y, z, cx + w / 2, y, z);
  }
  p.push(cx - 0.55, 3.6, z, cx + 0.55, 3.6, z);
  rectPts(p, cx, 0.38, 0.42, 0.72, z + 0.02);
  rectPts(p, cx, 2.15, 0.3, 0.38, z + 0.02);
  return buildGeo(p);
})();

/** One windmill blade (relative to hub). */
const WINDMILL_BLADE_GEO = mergeLines(
  wirePath([[0.05, 0, 0], [0.05, 2.1, 0]]),
  wirePath([[-0.05, 0, 0], [-0.05, 2.1, 0]]),
  wirePath([[0.05, 2.1, 0], [-0.05, 2.1, 0]])
);

/** Signpost pole + brace. */
const SIGNPOST_GEO = (() => {
  const p: number[] = [];
  p.push(-0.04, 0, 0, -0.04, 1.5, 0);
  p.push(0.04, 0, 0, 0.04, 1.5, 0);
  p.push(0.04, 0.3, 0, 0.32, 0.9, 0);
  return buildGeo(p);
})();

/** Bonfire logs (crossed sticks). */
const BONFIRE_LOGS = (() => {
  const p: number[] = [];
  p.push(-0.28, 0.06, 0, 0.28, 0.22, 0);
  p.push(0.28, 0.06, 0, -0.28, 0.22, 0);
  p.push(0, 0.06, -0.28, 0, 0.22, 0.28);
  p.push(0, 0.06, 0.28, 0, 0.22, -0.28);
  return buildGeo(p);
})();

/** Three flame strokes (relative to fire center). */
const BONFIRE_FLAME = mergeLines(
  wirePath([[-0.13, 0.02, 0], [-0.1, 0.3, 0], [-0.05, 0.5, 0], [0, 0.66, 0]]),
  wirePath([[0, 0.02, 0], [0, 0.32, 0], [0.02, 0.55, 0], [0.04, 0.75, 0]]),
  wirePath([[0.13, 0.02, 0], [0.1, 0.3, 0], [0.05, 0.5, 0], [0, 0.66, 0]])
);

/** Clothesline: two posts + sagging rope. */
const CLOTHESLINE_GEO = (() => {
  const p: number[] = [];
  p.push(-5.2, 0, -4.9, -5.2, 1.6, -4.9);
  p.push(-5.2, 0, -3.2, -5.2, 1.6, -3.2);
  p.push(-5.2, 1.55, -4.9, -5.2, 1.45, -4.05);
  p.push(-5.2, 1.45, -4.05, -5.2, 1.55, -3.2);
  return buildGeo(p);
})();

/** Shirt outline (relative to hang point). */
const CLOTH_GEO = mergeLines(
  wireRectXY(0.52, 0.62, 0),
  wirePath([[-0.26, -0.02, 0], [-0.42, -0.18, 0]]),
  wirePath([[0.26, -0.02, 0], [0.42, -0.18, 0]])
);

/** Small cloth outline. */
const CLOTH2_GEO = mergeLines(
  wireRectXY(0.4, 0.46, 0),
  wirePath([[-0.2, -0.02, 0], [-0.33, -0.14, 0]]),
  wirePath([[0.2, -0.02, 0], [0.33, -0.14, 0]])
);

/** Sun rays (relative to sun center). */
const SUN_RAYS_GEO = (() => {
  const p: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.push(
      Math.cos(a) * 1.65, Math.sin(a) * 1.65, 0,
      Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0
    );
  }
  return buildGeo(p);
})();

/** Sun core cross — also makes the disc center hit-testable. */
const SUN_CORE_GEO = mergeLines(
  wirePath([[-0.45, 0, 0], [0.45, 0, 0]]),
  wirePath([[0, -0.45, 0], [0, 0.45, 0]])
);

/** Moon core cross — also makes the disc center hit-testable. */
const MOON_CORE_GEO = mergeLines(
  wirePath([[-0.3, 0, 0], [0.3, 0, 0]]),
  wirePath([[0, -0.3, 0], [0, 0.3, 0]])
);

/** Twinkling stars (crosses). */
const STARS_GEO = (() => {
  const p: number[] = [];
  const stars: [number, number, number][] = [
    [-5.5, 5.0, -10.5], [-2.0, 6.2, -10.8], [1.5, 4.6, -10.4], [4.5, 6.0, -10.9],
    [7.0, 4.2, -10.6], [-4.0, 3.4, -10.2], [5.8, 7.2, -10.9], [0.0, 7.4, -10.7],
  ];
  for (const [x, y, z] of stars) {
    p.push(x - 0.09, y, z, x + 0.09, y, z);
    p.push(x, y - 0.09, z, x, y + 0.09, z);
  }
  return buildGeo(p);
})();

/* ------------------------------------------------------------------ */
/* Scene pieces                                                       */
/* ------------------------------------------------------------------ */

/** Hills, sun/moon (day-night toggle), twinkling stars, drifting clouds. */
function Backdrop({ onToggleNight }: { onToggleNight: () => void }) {
  const night = useRef(false);
  const sunRef = useRef<THREE.Group>(null);
  const moonRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Group>(null);
  const cloudA = useRef<THREE.Group>(null);
  const cloudB = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (cloudA.current) cloudA.current.position.x = -2.5 + Math.sin(t * 0.06) * 1.8;
    if (cloudB.current) cloudB.current.position.x = 3.5 + Math.sin(t * 0.05 + 2) * 2.0;
    if (starsRef.current) starsRef.current.scale.setScalar(0.85 + 0.2 * Math.sin(t * 1.7));
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    night.current = !night.current;
    if (sunRef.current) sunRef.current.visible = !night.current;
    if (moonRef.current) moonRef.current.visible = night.current;
    if (starsRef.current) starsRef.current.visible = night.current;
    onToggleNight();
  };

  return (
    <group>
      {/* hills */}
      <Wire geometry={wireArc(3.0, 3.0, 24, 0, Math.PI, 0)} position={[-4.2, 2.0, -9.9]} />
      <Wire geometry={wireArc(2.4, 2.4, 20, 0, Math.PI, 0)} position={[4.6, 1.7, -10.1]} />
      <Wire geometry={wireArc(3.4, 3.4, 26, 0, Math.PI, 0)} position={[0.4, 2.6, -10.4]} />
      {/* sun */}
      <HoverGroup name="sun" position={[1.2, 6.9, -8.9]} onClick={toggle}>
        <group ref={sunRef}>
          <Wire geometry={wireEllipseXY(1.5, 1.5, 24, 0)} />
          <Wire geometry={SUN_CORE_GEO} />
          <Wire geometry={SUN_RAYS_GEO} />
        </group>
      </HoverGroup>
      {/* moon */}
      <HoverGroup name="moon" position={[1.2, 6.9, -8.9]} onClick={toggle}>
        <group ref={moonRef} visible={false}>
          <Wire geometry={wireArc(1.5, 1.5, 20, 0, Math.PI, 0)} />
          <Wire geometry={MOON_CORE_GEO} />
        </group>
      </HoverGroup>
      {/* stars */}
      <group ref={starsRef} visible={false}>
        <Wire geometry={STARS_GEO} />
      </group>
      {/* clouds */}
      <group ref={cloudA} position={[-2.5, 5.8, -8.5]}>
        <Wire geometry={wireEllipseXY(1.6, 0.5, 18, 0)} />
        <Wire geometry={wireEllipseXY(1.0, 0.38, 14, 0)} position={[0.8, 0.12, 0]} />
      </group>
      <group ref={cloudB} position={[3.5, 6.3, -8.9]}>
        <Wire geometry={wireEllipseXY(1.3, 0.42, 16, 0)} />
        <Wire geometry={wireEllipseXY(0.85, 0.32, 12, 0)} position={[-0.7, 0.1, 0]} />
      </group>
    </group>
  );
}

/** Ground panel outline + yard details. */
function Yard() {
  return (
    <group>
      <Wire geometry={wireRectXZ(18, 15, 0)} name="line-ground" />
      <Wire geometry={YARD_GEO} />
    </group>
  );
}

const DOOR_OPEN = 2.1;

/** Half-timbered house: box outline, roof strokes, windows, chimney with smoke, swinging door. */
function House() {
  const doorRef = useRef<THREE.Group>(null);
  const doorOpen = useRef(true);
  const doorAngle = useRef(DOOR_OPEN);
  const smokeOn = useRef(false);
  const smokeRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const smokeY = useRef([6.5, 7.1, 7.7]);

  useFrame((_, delta) => {
    // door swing
    if (doorRef.current) {
      doorAngle.current = THREE.MathUtils.damp(
        doorAngle.current,
        doorOpen.current ? DOOR_OPEN : 0,
        6,
        delta
      );
      doorRef.current.rotation.y = doorAngle.current;
    }
    // smoke rings
    smokeRefs.current.forEach((g, i) => {
      if (!g) return;
      if (!smokeOn.current) {
        g.visible = false;
        return;
      }
      g.visible = true;
      smokeY.current[i] += delta * (0.45 + i * 0.1);
      if (smokeY.current[i] > 8.9) smokeY.current[i] = 6.3 + i * 0.15;
      const y = smokeY.current[i];
      g.position.y = y;
      g.scale.setScalar(1 + (y - 6.3) * 0.3);
    });
  });

  const toggleSmoke = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    smokeOn.current = !smokeOn.current;
  };

  return (
    <group>
      {/* body */}
      <Wire geometry={wireBox(8.2, 3.2, 4.3)} position={[0, 1.6, -4.75]} />
      <Wire geometry={HOUSE_ROOF_GEO} />
      <Wire geometry={HOUSE_FRONT_GEO} />
      {/* chimney (clickable: toggles smoke) */}
      <HoverGroup name="chimney" position={[2.9, 0, -5.9]} onClick={toggleSmoke}>
        <Wire geometry={wireBox(0.5, 3.6, 0.5)} position={[0, 4.4, 0]} />
        <Wire geometry={wireRectXZ(0.62, 0.62, 6.3)} />
        {[0, 1, 2].map((i) => (
          <group key={i} ref={(el) => { smokeRefs.current[i] = el; }} position={[0, smokeY.current[i], 0]} visible={false}>
            <Wire geometry={wireCircleXZ(0.12, 10, 0)} />
          </group>
        ))}
      </HoverGroup>
      {/* door */}
      <group
        ref={doorRef}
        name="house-door"
        position={[1.05, 1.6, -2.5]}
        onPointerOver={(e) => pointer(e, true)}
        onPointerOut={(e) => pointer(e, false)}
        onClick={(e) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          doorOpen.current = !doorOpen.current;
        }}
      >
        <Wire geometry={DOOR_GEO} position={[-1.0, 0, 0]} />
      </group>
    </group>
  );
}

/** Wall shelves inside the house. */
function Shelves() {
  return (
    <group>
      <Wire geometry={SHELVES_GEO} />
    </group>
  );
}

const BUCKET_TOP = 1.95;
const BUCKET_BOTTOM = 0.32;

/** Stone well with roof, windlass and a clickable lowering bucket. */
function Well() {
  const bucketRef = useRef<THREE.Group>(null);
  const ropeRef = useRef<THREE.Group>(null);
  const state = useRef<{ phase: "idle" | "down" | "up"; pause: number; ty: number }>({
    phase: "idle",
    pause: 0,
    ty: BUCKET_TOP,
  });

  useFrame((_, delta) => {
    const bucket = bucketRef.current;
    const rope = ropeRef.current;
    if (!bucket || !rope) return;
    const s = state.current;
    if (s.phase === "down") {
      s.ty -= 1.1 * delta;
      if (s.ty <= BUCKET_BOTTOM) {
        s.ty = BUCKET_BOTTOM;
        s.phase = "up";
        s.pause = 1.0;
      }
    } else if (s.phase === "up") {
      if (s.pause > 0) {
        s.pause -= delta;
      } else {
        s.ty += 1.1 * delta;
        if (s.ty >= BUCKET_TOP) {
          s.ty = BUCKET_TOP;
          s.phase = "idle";
        }
      }
    }
    bucket.position.y = s.ty;
    const len = Math.max(0.05, 2.28 - (s.ty + 0.12));
    rope.position.y = 2.28 - len / 2;
    rope.scale.y = len;
  });

  const lower = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    if (state.current.phase === "idle") state.current.phase = "down";
  };

  return (
    <group>
      <Wire geometry={wireCircleXZ(0.95, 10, 0)} position={[-3.6, 0, -1.0]} />
      <Wire geometry={wireCircleXZ(0.95, 10, 1.15)} position={[-3.6, 0, -1.0]} />
      <Wire geometry={WELL_DRUM_LINES} position={[-3.6, 0, -1.0]} />
      <Wire geometry={wireCircleXZ(1.02, 12, 1.16)} position={[-3.6, 0, -1.0]} />
      <Wire geometry={wireCircleXZ(1.05, 12, 0.05)} position={[-3.6, 0, -1.0]} />
      <Wire geometry={wireRectXY(0.16, 1.9, 0)} position={[-4.55, 1.55, -1.0]} />
      <Wire geometry={wireRectXY(0.16, 1.9, 0)} position={[-2.65, 1.55, -1.0]} />
      <Wire geometry={WELL_ROOF_GEO} position={[-3.6, 0, -1.0]} />
      <Wire geometry={WELL_WINDLASS_GEO} position={[-3.6, 0, -1.0]} />
      {/* rope */}
      <group ref={ropeRef} position={[-3.6, 2.17, -1.0]} scale={[1, 0.2, 1]}>
        <Wire geometry={wirePath([[-0.015, -0.5, 0], [-0.015, 0.5, 0]])} />
        <Wire geometry={wirePath([[0.015, -0.5, 0], [0.015, 0.5, 0]])} />
      </group>
      {/* bucket */}
      <HoverGroup name="well-bucket" position={[-3.6, BUCKET_TOP, -1.0]} onClick={lower}>
        <group ref={bucketRef}>
          <Wire geometry={wireCircleXZ(0.17, 8, 0)} />
          <Wire geometry={wireCircleXZ(0.17, 8, 0.24)} />
          <Wire geometry={BUCKET_LINES} />
          <Wire geometry={wireArc(0.15, 0.15, 10, 0, Math.PI, 0)} position={[0, 0.39, 0]} />
        </group>
      </HoverGroup>
    </group>
  );
}

const CHEESE_BASE_Y = 1.0;

/** Cheese wheel on a cart. Click spins + hops the wheel. */
function CheeseCart() {
  const wheelRef = useRef<THREE.Group>(null);
  const state = useRef({ spin: 0, vy: 0, y: 0 });

  useFrame((_, delta) => {
    const g = wheelRef.current;
    if (!g) return;
    const s = state.current;
    s.spin *= Math.exp(-3.2 * delta);
    g.rotation.y += s.spin * delta;
    if (s.y > 0 || s.vy > 0) {
      s.vy -= 9 * delta;
      s.y = Math.max(0, s.y + s.vy * delta);
      g.position.y = CHEESE_BASE_Y + s.y;
    }
  });

  const spin = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const s = state.current;
    s.spin = 5.5;
    s.vy = 2.4;
  };

  return (
    <group>
      <Wire geometry={wireBox(1.5, 0.13, 1.05)} position={[3.4, 0.63, 0.8]} />
      <Wire geometry={CART_LEGS} position={[3.4, 0, 0.8]} />
      <Wire geometry={wireEllipseXY(0.24, 0.24, 12, 0)} position={[2.64, 0.24, 0.8]} />
      <Wire geometry={WHEEL_SPOKES} position={[2.64, 0.24, 0.8]} />
      <Wire geometry={wireEllipseXY(0.24, 0.24, 12, 0)} position={[4.16, 0.24, 0.8]} />
      <Wire geometry={WHEEL_SPOKES} position={[4.16, 0.24, 0.8]} />
      {/* cut wedge on the cart */}
      <Wire geometry={wirePoly([[-0.14, 0, 0], [0.14, 0, 0], [0, 0.13, 0]])} position={[3.0, 0.76, 0.8]} />
      {/* the wheel itself */}
      <HoverGroup name="cheese-wheel" position={[3.4, CHEESE_BASE_Y, 0.8]} onClick={spin}>
        <group ref={wheelRef}>
          <Wire geometry={wireEllipseXY(0.55, 0.55, 20, 0)} />
          <Wire geometry={wireEllipseXY(0.42, 0.42, 16, 0)} />
          <Wire geometry={CHEESE_CUT} />
          <Wire geometry={wireEllipseXY(0.07, 0.07, 8, 0)} position={[-0.2, 0.22, 0]} />
          <Wire geometry={wireEllipseXY(0.06, 0.06, 8, 0)} position={[0.24, -0.15, 0]} />
          <Wire geometry={wireEllipseXY(0.06, 0.06, 8, 0)} position={[-0.05, -0.32, 0]} />
        </group>
      </HoverGroup>
    </group>
  );
}

const PIG_WANDER = { minX: -5.2, maxX: 5.2, minZ: 0.7, maxZ: 5.0 };

function pickTarget(): { x: number; z: number } {
  for (let i = 0; i < 8; i++) {
    const x = PIG_WANDER.minX + Math.random() * (PIG_WANDER.maxX - PIG_WANDER.minX);
    const z = PIG_WANDER.minZ + Math.random() * (PIG_WANDER.maxZ - PIG_WANDER.minZ);
    if ((x - 3.4) ** 2 + (z - 0.8) ** 2 < 1.5 ** 2) continue; // cheese cart
    if ((x + 4.0) ** 2 + (z - 3.8) ** 2 < 1.1 ** 2) continue; // bonfire
    if ((x - 2.4) ** 2 + (z - 3.4) ** 2 < 0.9 ** 2) continue; // signpost
    if ((x + 5.2) ** 2 + (z - 2.4) ** 2 < 1.3 ** 2) continue; // tree 1
    return { x, z };
  }
  return { x: 0, z: 2.5 };
}

/** The wandering pig — pure line strokes, walks, waddles, and rolls on click. */
function Pig() {
  const rootRef = useRef<THREE.Group>(null);
  const flipRef = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legBL = useRef<THREE.Group>(null);
  const legBR = useRef<THREE.Group>(null);
  const state = useRef({
    tx: 1.5,
    tz: 2.2,
    speed: 1.2,
    idle: 1.0,
    t: 0,
    jumpV: 0,
    jumpY: 0,
    flipT: 1,
  });

  useFrame((_, delta) => {
    const root = rootRef.current;
    const flip = flipRef.current;
    if (!root || !flip) return;
    const s = state.current;
    s.t += delta;

    if (s.idle > 0) {
      s.idle -= delta;
    } else {
      const dx = s.tx - root.position.x;
      const dz = s.tz - root.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.12) {
        s.idle = 0.8 + Math.random() * 1.6;
        s.speed = 1.0 + Math.random() * 0.5;
        const target = pickTarget();
        s.tx = target.x;
        s.tz = target.z;
      } else {
        const vx = (dx / dist) * s.speed;
        const vz = (dz / dist) * s.speed;
        root.position.x += vx * delta;
        root.position.z += vz * delta;
        let d = Math.atan2(vx, vz) - root.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        root.rotation.y += d * Math.min(1, 6 * delta);
      }
    }

    const moving = s.idle <= 0;
    const swing = moving ? Math.sin(s.t * 9) * 0.5 : 0;
    if (legFL.current) legFL.current.rotation.x = swing;
    if (legFR.current) legFR.current.rotation.x = swing;
    if (legBL.current) legBL.current.rotation.x = -swing;
    if (legBR.current) legBR.current.rotation.x = -swing;

    if (s.jumpY > 0 || s.jumpV > 0) {
      s.jumpV -= 10 * delta;
      s.jumpY = Math.max(0, s.jumpY + s.jumpV * delta);
    }
    if (s.flipT < 0.7) {
      s.flipT += delta;
      flip.rotation.x = (s.flipT / 0.7) * Math.PI * 2;
      if (s.flipT >= 0.7) flip.rotation.x = 0;
    }
    flip.position.y = Math.abs(Math.sin(s.t * 9)) * 0.045 + s.jumpY;
  });

  const jump = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const s = state.current;
    s.jumpV = 2.6;
    s.flipT = 0;
  };

  return (
    <HoverGroup name="pig" position={[0, 0, 1.5]} onClick={jump}>
      <group ref={rootRef}>
        <group ref={flipRef}>
          <Wire geometry={wireEllipseXY(0.55, 0.38, 24, 0)} position={[0, 0.55, 0]} />
          <Wire geometry={wireEllipseXY(0.26, 0.22, 20, 0)} position={[0, 0.6, 0.52]} />
          <Wire geometry={wireEllipseXY(0.1, 0.07, 12, 0)} position={[0, 0.55, 0.68]} />
          <Wire geometry={PIG_SNOUT_LINES} />
          <Wire geometry={PIG_EYES} />
          <Wire geometry={wirePoly([[-0.24, 0.72, 0.45], [-0.14, 0.86, 0.45], [-0.04, 0.75, 0.45]])} />
          <Wire geometry={wirePoly([[0.24, 0.72, 0.45], [0.14, 0.86, 0.45], [0.04, 0.75, 0.45]])} />
          <Wire geometry={wirePath([[0, 0.6, -0.55], [0, 0.72, -0.68], [0, 0.62, -0.78]])} />
          <group ref={legFL} position={[-0.3, 0.38, 0.2]}>
            <Wire geometry={wirePath([[0, -0.02, 0], [0, -0.36, 0]])} />
          </group>
          <group ref={legFR} position={[0.3, 0.38, 0.2]}>
            <Wire geometry={wirePath([[0, -0.02, 0], [0, -0.36, 0]])} />
          </group>
          <group ref={legBL} position={[-0.3, 0.38, -0.2]}>
            <Wire geometry={wirePath([[0, -0.02, 0], [0, -0.36, 0]])} />
          </group>
          <group ref={legBR} position={[0.3, 0.38, -0.2]}>
            <Wire geometry={wirePath([[0, -0.02, 0], [0, -0.36, 0]])} />
          </group>
        </group>
      </group>
    </HoverGroup>
  );
}

/** A pecking chicken by the well. */
function Chicken() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const state = useRef({ t: 0, jumpV: 0, jumpY: 0 });

  useFrame((_, delta) => {
    const s = state.current;
    s.t += delta;
    if (headRef.current) headRef.current.rotation.x = Math.sin(s.t * 3.2) * 0.18;
    const root = rootRef.current;
    if (!root) return;
    if (s.jumpY > 0 || s.jumpV > 0) {
      s.jumpV -= 12 * delta;
      s.jumpY = Math.max(0, s.jumpY + s.jumpV * delta);
      root.position.y = s.jumpY;
    }
  });

  const hop = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    state.current.jumpV = 2.0;
  };

  return (
    <HoverGroup name="chicken" position={[-2.0, 0, 2.2]} onClick={hop}>
      <group ref={rootRef}>
        <Wire geometry={wireEllipseXY(0.17, 0.13, 16, 0)} position={[0, 0.24, 0]} />
        <Wire geometry={wirePath([[0.04, 0.12, 0], [0.04, 0.02, 0]])} />
        <Wire geometry={wirePath([[-0.04, 0.12, 0], [-0.04, 0.02, 0]])} />
        <group ref={headRef} position={[0.17, 0.38, 0]}>
          <Wire geometry={wireEllipseXY(0.09, 0.09, 12, 0)} />
          <Wire geometry={wirePoly([[0.06, 0.02, 0], [0.15, 0, 0], [0.06, -0.02, 0]])} />
          <Wire geometry={wirePoly([[-0.05, 0.06, 0], [-0.01, 0.14, 0], [0.03, 0.05, 0]])} />
        </group>
      </group>
    </HoverGroup>
  );
}

/** Windmill with rotating blades; click cycles speed 0 / slow / fast. */
function Windmill() {
  const bladesRef = useRef<THREE.Group>(null);
  const speedRef = useRef(0.7);

  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z += speedRef.current * delta;
  });

  const cycle = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    speedRef.current = speedRef.current === 0 ? 0.7 : speedRef.current === 0.7 ? 2.6 : 0;
  };

  return (
    <group>
      <Wire geometry={WINDMILL_TOWER_GEO} />
      <HoverGroup name="windmill" position={[6.8, 3.75, -1.0]} onClick={cycle}>
        <group ref={bladesRef}>
          {[0, 1, 2, 3].map((i) => (
            <Wire key={i} geometry={WINDMILL_BLADE_GEO} rotation={[0, 0, (i * Math.PI) / 2]} />
          ))}
          <Wire geometry={wireEllipseXY(0.1, 0.1, 10, 0)} />
        </group>
      </HoverGroup>
    </group>
  );
}

/** Signpost; click makes the board wobble. */
function Signpost() {
  const boardRef = useRef<THREE.Group>(null);
  const sway = useRef(0);

  useFrame((state, delta) => {
    if (!boardRef.current) return;
    sway.current *= Math.exp(-2.2 * delta);
    boardRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 9) * 0.14 * sway.current;
  });

  const shake = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    sway.current = 1;
  };

  return (
    <group position={[2.4, 0, 3.4]}>
      <Wire geometry={SIGNPOST_GEO} />
      <HoverGroup name="signpost" position={[0, 1.75, 3.35]} onClick={shake}>
        <group ref={boardRef}>
          <Wire geometry={wireRectXY(1.1, 0.5, 0)} />
          <Wire geometry={wirePoly([[-0.4, 0, 0], [0.3, 0, 0], [-0.1, -0.12, 0]])} />
        </group>
      </HoverGroup>
    </group>
  );
}

/** Campfire; click lights / extinguishes the flame strokes. */
function Bonfire() {
  const flameRef = useRef<THREE.Group>(null);
  const lit = useRef(false);

  useFrame((state) => {
    if (!flameRef.current) return;
    if (!lit.current) {
      flameRef.current.visible = false;
      return;
    }
    flameRef.current.visible = true;
    const t = state.clock.elapsedTime;
    flameRef.current.scale.y = 1 + 0.2 * Math.sin(t * 9);
    flameRef.current.rotation.z = 0.05 * Math.sin(t * 6.5);
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    lit.current = !lit.current;
  };

  return (
    <group position={[-4.0, 0, 3.8]}>
      <Wire geometry={wireCircleXZ(0.55, 8, 0.02)} />
      <Wire geometry={BONFIRE_LOGS} />
      <HoverGroup name="bonfire" position={[0, 0.1, 0]} onClick={toggle}>
        <group ref={flameRef} visible={false}>
          <Wire geometry={BONFIRE_FLAME} />
        </group>
      </HoverGroup>
    </group>
  );
}

const TREES = [
  { x: -5.2, z: 2.4, crownY: 2.5 },
  { x: 5.8, z: -4.2, crownY: 2.7 },
];

/** Two line-art trees; click makes leaves fall. */
function Trees() {
  const leaves = useRef<(THREE.Group | null)[]>([null, null, null, null, null, null, null, null]);
  const leafState = useRef(Array.from({ length: 8 }, (_, i) => ({ t: i * 0.13, phase: i * 1.7 })));
  const falling = useRef([false, false]);

  useFrame((_, delta) => {
    for (let i = 0; i < 8; i++) {
      const g = leaves.current[i];
      if (!g) continue;
      const tree = i < 4 ? 0 : 1;
      if (!falling.current[tree]) {
        g.visible = false;
        continue;
      }
      g.visible = true;
      const s = leafState.current[i];
      s.t += delta * 0.5;
      const t = s.t % 1;
      const T = TREES[tree];
      g.position.set(
        T.x + Math.sin(t * 5 + s.phase) * 1.15,
        T.crownY + 0.3 - t * 3.0,
        T.z + Math.cos(t * 4 + s.phase) * 0.6
      );
      g.rotation.z = t * 7;
    }
  });

  const toggle = (idx: number) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    falling.current[idx] = !falling.current[idx];
  };

  return (
    <group>
      {TREES.map((T, ti) => (
        <HoverGroup key={ti} name={ti === 0 ? "tree-1" : "tree-2"} onClick={toggle(ti)}>
          <Wire geometry={wirePath([[T.x - 0.09, 0, T.z], [T.x - 0.09, 1.5, T.z]])} />
          <Wire geometry={wirePath([[T.x + 0.09, 0, T.z], [T.x + 0.09, 1.5, T.z]])} />
          <Wire geometry={wireEllipseXY(1.05, 0.72, 20, 0)} position={[T.x, T.crownY, T.z]} />
          <Wire geometry={wireEllipseXY(0.75, 0.55, 16, 0)} position={[T.x + 0.32, T.crownY + 0.35, T.z]} />
          <Wire geometry={wireEllipseXY(0.7, 0.5, 14, 0)} position={[T.x - 0.38, T.crownY + 0.15, T.z]} />
          {[0, 1, 2, 3].map((li) => (
            <group
              key={li}
              ref={(el) => {
                leaves.current[ti * 4 + li] = el;
              }}
              visible={false}
            >
              <Wire geometry={wireEllipseXY(0.07, 0.035, 8, 0)} />
            </group>
          ))}
        </HoverGroup>
      ))}
    </group>
  );
}

/** Clothesline; click each cloth to make it sway. */
function Clothesline() {
  const clothRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const swayOn = useRef([false, false]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    clothRefs.forEach((r, i) => {
      if (!r.current) return;
      if (swayOn.current[i]) {
        r.current.rotation.z = Math.sin(t * 5.5 + i * 1.8) * 0.22;
      } else {
        r.current.rotation.z *= Math.exp(-2 * delta);
      }
    });
  });

  const toggle = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    swayOn.current[i] = !swayOn.current[i];
  };

  return (
    <group>
      <Wire geometry={CLOTHESLINE_GEO} />
      <HoverGroup name="clothes" position={[-5.2, 1.45, -4.05]} onClick={toggle(0)}>
        <group ref={clothRefs[0]} position={[0, -0.32, 0]}>
          <Wire geometry={CLOTH_GEO} />
        </group>
      </HoverGroup>
      <HoverGroup name="clothes" position={[-5.2, 1.45, -3.7]} onClick={toggle(1)}>
        <group ref={clothRefs[1]} position={[0, -0.25, 0]}>
          <Wire geometry={CLOTH2_GEO} />
        </group>
      </HoverGroup>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene root                                                         */
/* ------------------------------------------------------------------ */

const MAX_REBUILDS = 3;

const FALLBACK_STYLE: React.CSSProperties = {
  width: "100%",
  height: "700px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  color: "#000000",
  fontFamily: "monospace",
  fontSize: "0.95rem",
  textAlign: "center",
  padding: "0 24px",
  boxSizing: "border-box",
};

export default function LineArtScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [generation, setGeneration] = useState(0);
  const rebuilds = useRef(0);
  const nightRef = useRef(false);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    setWebglOk(checkWebGL());
  }, []);

  const rebuild = React.useCallback(() => {
    rebuilds.current += 1;
    if (rebuilds.current <= MAX_REBUILDS) {
      setGeneration((g) => g + 1);
    }
  }, []);

  const toggleNight = React.useCallback(() => {
    nightRef.current = !nightRef.current;
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(nightRef.current ? 0x000000 : 0xffffff);
    }
    LINE_MAT.color.set(nightRef.current ? 0xffffff : 0x000000);
  }, []);

  if (webglOk === null) {
    return <div style={FALLBACK_STYLE}>检测 WebGL 支持…</div>;
  }
  if (!webglOk) {
    return <div style={FALLBACK_STYLE}>⚠ 当前浏览器/设备不支持 WebGL2,3D 线条场景无法显示</div>;
  }

  return (
    <SceneErrorBoundary>
      <div style={{ position: "relative", width: "100%", height: "700px", backgroundColor: "#ffffff" }}>
        <Canvas
          key={generation}
          frameloop={frameloop}
          camera={{ position: [9.5, 5.5, 9.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          raycaster={{
            params: { Line: { threshold: 8 } } as unknown as THREE.RaycasterParameters,
          }}
          onCreated={({ gl, scene, camera }) => {
            sceneRef.current = scene;
            if (process.env.NODE_ENV === "development") {
              (window as unknown as Record<string, unknown>).__COZYROOM__ = { scene, camera, gl };
            }
            const canvasEl = gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              rebuild();
            };
            canvasEl.addEventListener("webglcontextlost", onLost);
          }}
        >
          <color attach="background" args={["#ffffff"]} />
          <Backdrop onToggleNight={toggleNight} />
          <Yard />
          <Shelves />
          <House />
          <Well />
          <CheeseCart />
          <Pig />
          <Chicken />
          <Windmill />
          <Signpost />
          <Bonfire />
          <Trees />
          <Clothesline />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            target={[0, 1.5, 0]}
            minDistance={4}
            maxDistance={26}
            minPolarAngle={0.2}
            maxPolarAngle={1.45}
            enablePan={false}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
