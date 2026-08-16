/**
 * Line-art wireframe geometry builders for LineArtScene.
 *
 * The whole scene is drawn with one-dimensional lines only — every object is
 * a `lineSegments` mesh (THREE.LineSegments) sharing the single black
 * LINE_MAT. No filled meshes anywhere.
 *
 * All geometries are cached module-level and intentionally app-lifetime
 * (bounded set, never allocated in render/useFrame — same pattern as the
 * BOOKS/BRICKS constants in Furniture.tsx).
 */
import * as THREE from "three";

/** Single shared line material. Its color flips black/white on night toggle — never per-object. */
export const LINE_MAT = new THREE.LineBasicMaterial({ color: 0x000000 });

const CACHE = new Map<string, THREE.BufferGeometry>();

function cached(key: string, pairs: number[]): THREE.BufferGeometry {
  let g = CACHE.get(key);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pairs, 3));
    CACHE.set(key, g);
  }
  return g;
}

/** Expand a point list into closed-ring segment pairs (last point joins first). */
function closedRing(pts: number[][]): number[] {
  const out: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(...pts[i], ...pts[(i + 1) % pts.length]);
  }
  return out;
}

/** Expand a point list into open-chain segment pairs. */
function openChain(pts: number[][]): number[] {
  const out: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) out.push(...pts[i], ...pts[i + 1]);
  return out;
}

/** 12-edge box wireframe. */
export function wireBox(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = `box:${w}:${h}:${d}`;
  let g = CACHE.get(key);
  if (g) return g;
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const v = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
  ];
  const e = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const pts: number[] = [];
  for (const [a, b] of e) pts.push(...v[a], ...v[b]);
  return cached(key, pts);
}

/** Horizontal circle outline (XZ plane at fixed y). */
export function wireCircleXZ(r: number, seg: number, y = 0): THREE.BufferGeometry {
  const key = `cxz:${r}:${seg}:${y}`;
  let g = CACHE.get(key);
  if (g) return g;
  const pts: number[][] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return cached(key, closedRing(pts));
}

/** Vertical ellipse/circle outline (XY plane at fixed z). */
export function wireEllipseXY(rx: number, ry: number, seg: number, z = 0): THREE.BufferGeometry {
  const key = `exy:${rx}:${ry}:${seg}:${z}`;
  let g = CACHE.get(key);
  if (g) return g;
  const pts: number[][] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push([Math.cos(a) * rx, Math.sin(a) * ry, z]);
  }
  return cached(key, closedRing(pts));
}

/** Vertical arc (open chain), e.g. hills, moon, bucket handles. */
export function wireArc(rx: number, ry: number, seg: number, from: number, to: number, z = 0): THREE.BufferGeometry {
  const key = `arc:${rx}:${ry}:${seg}:${from}:${to}:${z}`;
  let g = CACHE.get(key);
  if (g) return g;
  const pts: number[][] = [];
  for (let i = 0; i <= seg; i++) {
    const a = from + ((to - from) * i) / seg;
    pts.push([Math.cos(a) * rx, Math.sin(a) * ry, z]);
  }
  return cached(key, openChain(pts));
}

/** Closed polyline through the given points. */
export function wirePoly(pts: number[][]): THREE.BufferGeometry {
  const key = `poly:${pts.map((p) => p.join(",")).join("|")}`;
  let g = CACHE.get(key);
  if (g) return g;
  return cached(key, closedRing(pts));
}

/** Open polyline through the given points. */
export function wirePath(pts: number[][]): THREE.BufferGeometry {
  const key = `path:${pts.map((p) => p.join(",")).join("|")}`;
  let g = CACHE.get(key);
  if (g) return g;
  return cached(key, openChain(pts));
}

/** Horizontal rectangle outline (XZ plane at fixed y). */
export function wireRectXZ(w: number, d: number, y = 0): THREE.BufferGeometry {
  const key = `rxz:${w}:${d}:${y}`;
  let g = CACHE.get(key);
  if (g) return g;
  return cached(key, closedRing([[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2]]));
}

/** Vertical rectangle outline (XY plane at fixed z). */
export function wireRectXY(w: number, h: number, z = 0): THREE.BufferGeometry {
  const key = `rxy:${w}:${h}:${z}`;
  let g = CACHE.get(key);
  if (g) return g;
  return cached(key, closedRing([[-w / 2, -h / 2, z], [w / 2, -h / 2, z], [w / 2, h / 2, z], [-w / 2, h / 2, z]]));
}

/** Concatenate several line geometries into one (fewer draw calls). */
export function mergeLines(...geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const key = `merge:${geos.map((g) => g.uuid).join("+")}`;
  let g = CACHE.get(key);
  if (g) return g;
  const positions: number[] = [];
  for (const geo of geos) {
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) positions.push(attr.getX(i), attr.getY(i), attr.getZ(i));
  }
  g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  CACHE.set(key, g);
  return g;
}
