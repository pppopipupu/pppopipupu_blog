import * as THREE from "three";
import { TownLineBucket, TownSolidBucket } from "./townShader";

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG & Math Helpers                                          */
/* -------------------------------------------------------------------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();

export function composeMat(
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1
): THREE.Matrix4 {
  _pos.set(x, y, z);
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _scl.set(sx, sy, sz);
  return _m4.compose(_pos, _q, _scl).clone();
}

export function createGableRoofPrism(w: number, h: number, l: number): THREE.BufferGeometry {
  const hw = w * 0.5;
  const hl = l * 0.5;
  const verts = new Float32Array([
    -hw, 0, -hl, -hw, 0, hl, 0, h, hl,
    -hw, 0, -hl, 0, h, hl, 0, h, -hl,
    hw, 0, hl, hw, 0, -hl, 0, h, -hl,
    hw, 0, hl, 0, h, -hl, 0, h, hl,
    -hw, 0, hl, hw, 0, hl, 0, h, hl,
    hw, 0, -hl, -hw, 0, -hl, 0, h, -hl,
    -hw, 0, -hl, hw, 0, -hl, hw, 0, hl,
    -hw, 0, -hl, hw, 0, hl, -hw, 0, hl,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

export function createHippedRoofPrism(
  w: number,
  h: number,
  l: number,
  ridgeRatio = 0.54
): THREE.BufferGeometry {
  const hw = w * 0.5;
  const hl = l * 0.5;
  const rl = hl * ridgeRatio;
  const verts = new Float32Array([
    -hw, 0, -hl, -hw, 0, hl, 0, h, rl,
    -hw, 0, -hl, 0, h, rl, 0, h, -rl,
    hw, 0, hl, hw, 0, -hl, 0, h, -rl,
    hw, 0, hl, 0, h, -rl, 0, h, rl,
    -hw, 0, hl, hw, 0, hl, 0, h, rl,
    hw, 0, -hl, -hw, 0, -hl, 0, h, -rl,
    -hw, 0, -hl, hw, 0, -hl, hw, 0, hl,
    -hw, 0, -hl, hw, 0, hl, -hw, 0, hl,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

/* -------------------------------------------------------------------------- */
/* 960m x 960m Real-Scale Topography & Wide Winding River                     */
/* -------------------------------------------------------------------------- */

export const TERRAIN_SIZE = 960;
export const WALL_CENTER_Z = 20;
export const WALL_RADIUS = 215;
export const WATER_LEVEL = -1.2;

export function riverCenterZ(x: number): number {
  return 268 + 24 * Math.sin(x * 0.008) + 0.00024 * x * x * Math.cos(x * 0.0045);
}

export function riverHalfWidth(x: number): number {
  return 16.5 + 2.8 * Math.cos(x * 0.014);
}

/**
 * 960m x 960m Real-Scale Medieval Metropolis Heightfield (~1 unit = 1 meter):
 * - Imperial Fountain Plaza at (0, 56), y = 7.5m
 * - Commercial District & Cathedral Knoll on West, y ≈ 8m to 18m
 * - Elevated Noble Quarter Stone Terrace on East, y ≈ 18.5m
 * - Low-lying Slum warrens along South-West & South-East walls, y ≈ 4.8m
 * - Colossal Northern Acropolis Cliff for Lord's Castle at (0, -154), y = 48.0m
 * - Vast outer farmlands, 9 windmill hills, 34m-wide river, and alpine mountain ridges
 */
export function getTownHeight(x: number, z: number): number {
  let h =
    3.8 +
    3.4 * Math.sin(x * 0.0082 + 0.5) * Math.cos(z * 0.0078 - 0.3) +
    2.2 * Math.cos((x - z) * 0.0062);

  // Inner city plateau centered at (0, 20)
  const dCity = Math.hypot(x, z - WALL_CENTER_Z);
  const cityMask = 1 - smoothstep(195, 240, dCity);
  const baseCityH = 7.5 + Math.max(0, (-z + 40) * 0.022);
  h = h * (1 - cityMask * 0.88) + baseCityH * (cityMask * 0.88);

  // Level Imperial Fountain Plaza at (0, 56)
  const dPlaza = Math.hypot(x, z - 56);
  const plazaFlat = 1 - smoothstep(42, 64, dPlaza);
  h = h * (1 - plazaFlat) + 7.5 * plazaFlat;

  // Level Commercial Market Square at (-92, 36)
  const dMarket = Math.hypot(x + 92, z - 36);
  const marketFlat = 1 - smoothstep(36, 58, dMarket);
  h = h * (1 - marketFlat) + 7.8 * marketFlat;

  // Cathedral Knoll on North-West (-124, -56)
  const dCath = Math.hypot(x + 124, z + 56);
  h += (1 - smoothstep(36, 68, dCath)) * 9.5;

  // Elevated Noble Quarter Stone Terrace on East
  const dNoble = Math.hypot((x - 124) * 0.72, (z + 4) * 0.56);
  const nobleLift = 1 - smoothstep(52, 86, dNoble);
  h = h * (1 - nobleLift * 0.86) + 18.5 * (nobleLift * 0.86);

  // Low-lying Slum warrens (South-West & South-East)
  const dSlumW = Math.hypot((x + 112) * 0.78, z - 154);
  const slumWFlat = 1 - smoothstep(42, 74, dSlumW);
  h = h * (1 - slumWFlat * 0.82) + 4.8 * (slumWFlat * 0.82);

  const dSlumE = Math.hypot((x - 112) * 0.8, z - 154);
  const slumEFlat = 1 - smoothstep(40, 72, dSlumE);
  h = h * (1 - slumEFlat * 0.82) + 5.0 * (slumEFlat * 0.82);

  // South Gatehouse apron at (0, 232)
  const dGate = Math.hypot(x * 0.7, z - 232);
  const gateFlat = 1 - smoothstep(30, 54, dGate);
  h = h * (1 - gateFlat) + 7.2 * gateFlat;

  // Colossal Northern Acropolis Plateau for Lord's Castle at (0, -154)
  const dCastle = Math.hypot(x * 0.82, (z + 154) * 1.02);
  const acropolisRise = 1 - smoothstep(64, 108, dCastle);
  h += acropolisRise * 40.5;
  const castleFlat = 1 - smoothstep(56, 72, dCastle);
  h = h * (1 - castleFlat * 0.94) + 48.0 * (castleFlat * 0.94);

  // Outer Windmill & Countryside Hills
  const knolls: Array<[number, number, number, number]> = [
    [-285, 92, 18, 2600],
    [290, 68, 17, 2500],
    [-265, -145, 24, 3200],
    [275, -168, 26, 3400],
    [-156, 340, 14, 2200],
    [168, 348, 15, 2300],
    [-365, -24, 28, 4600],
    [375, -48, 26, 4400],
    [-320, 245, 16, 2600],
    [335, 230, 17, 2700],
  ];
  for (const [kx, kz, kh, spread] of knolls) {
    const dk = Math.hypot(x - kx, z - kz);
    h += kh * Math.exp(-(dk * dk) / spread);
  }

  // Carve wide Southern River Channel
  const rz = riverCenterZ(x);
  const rw = riverHalfWidth(x);
  const distRiver = Math.abs(z - rz);
  const riverCarve = 1 - smoothstep(rw * 0.65, rw * 1.9, distRiver);
  h = h * (1 - riverCarve) + -7.5 * riverCarve;

  // Towering Alpine Mountain Ranges ringing the far North & Flanks
  if (z < -265) {
    const nf = smoothstep(-265, -460, z);
    const peaks =
      Math.abs(Math.sin(x * 0.013 + 0.4)) * 52 +
      Math.cos(x * 0.029 - 0.8) * 18 +
      38;
    h += nf * peaks;
  }
  const absX = Math.abs(x);
  if (absX > 350 && z < 80) {
    const xf = smoothstep(350, 465, absX) * (1 - smoothstep(-40, 120, z));
    h += xf * (32 + Math.sin(z * 0.02) * 14);
  }

  if (z > 395) {
    h -= smoothstep(395, 475, z) * 8.0;
  }

  return h;
}

/* -------------------------------------------------------------------------- */
/* Shared Builder Context Passed Across Modular District Files                */
/* -------------------------------------------------------------------------- */

export interface WindmillMount {
  hub: THREE.Vector3;
  rotY: number;
  speed: number;
}

export interface BannerMount {
  pos: THREE.Vector3;
  rotY: number;
  scale: number;
  phase: number;
}

export class TownBuildContext {
  readonly rand = mulberry32(20261119);
  readonly solidWall = new TownSolidBucket();
  readonly solidRoof = new TownSolidBucket();
  readonly windowGlow = new TownSolidBucket();
  readonly primary = new TownLineBucket();
  readonly secondary = new TownLineBucket();
  readonly fine = new TownLineBucket();
  readonly contour = new TownLineBucket();

  readonly chimneyTops: THREE.Vector3[] = [];
  readonly bannerMounts: BannerMount[] = [];
  readonly windmillMounts: WindmillMount[] = [];

  addBlock(
    geo: THREE.BufferGeometry,
    mat: THREE.Matrix4,
    bucket: TownSolidBucket,
    lineTarget: TownLineBucket | null = this.primary,
    threshold = 24
  ) {
    bucket.add(geo, mat);
    if (lineTarget) lineTarget.addEdges(geo, threshold, mat);
    geo.dispose();
  }

  addBox(
    w: number,
    h: number,
    d: number,
    mat: THREE.Matrix4,
    bucket: TownSolidBucket = this.solidWall,
    lineTarget: TownLineBucket | null = this.primary
  ) {
    this.addBlock(new THREE.BoxGeometry(w, h, d), mat, bucket, lineTarget, 22);
  }

  addCyl(
    rt: number,
    rb: number,
    h: number,
    seg: number,
    mat: THREE.Matrix4,
    bucket: TownSolidBucket = this.solidWall,
    lineTarget: TownLineBucket | null = this.primary,
    threshold = 28
  ) {
    this.addBlock(new THREE.CylinderGeometry(rt, rb, h, seg), mat, bucket, lineTarget, threshold);
  }

  addCone(
    r: number,
    h: number,
    seg: number,
    mat: THREE.Matrix4,
    bucket: TownSolidBucket = this.solidRoof,
    lineTarget: TownLineBucket | null = this.primary,
    threshold = 26
  ) {
    this.addBlock(new THREE.ConeGeometry(r, h, seg), mat, bucket, lineTarget, threshold);
  }

  addFortifiedTower(
    x: number,
    z: number,
    radius: number,
    height: number,
    options?: {
      baseY?: number;
      segments?: number;
      roofHeight?: number;
      hasConicalRoof?: boolean;
      hasBanner?: boolean;
      bannerScale?: number;
      machicolation?: boolean;
    }
  ) {
    const baseY = (options?.baseY ?? getTownHeight(x, z)) - 2.0;
    const seg = options?.segments ?? 10;
    const roofH = options?.roofHeight ?? radius * 2.35;
    const hasRoof = options?.hasConicalRoof ?? true;
    const mach = options?.machicolation ?? true;

    // Battered stone base
    this.addCyl(
      radius * 1.06,
      radius * 1.26,
      4.8,
      seg,
      composeMat(x, baseY + 2.4, z),
      this.solidWall,
      this.primary,
      30
    );
    // Main shaft
    this.addCyl(
      radius * 0.96,
      radius * 1.06,
      height,
      seg,
      composeMat(x, baseY + 4.6 + height * 0.5, z),
      this.solidWall,
      this.primary,
      30
    );

    const shaftTop = baseY + 4.6 + height;
    // Stone courses
    for (let ring = 1; ring <= 3; ring++) {
      const ry = baseY + 4.6 + (height * ring) / 4;
      const pts: Array<[number, number, number]> = [];
      for (let s = 0; s < seg; s++) {
        const a = (s / seg) * Math.PI * 2;
        pts.push([x + Math.cos(a) * (radius + 0.08), ry, z + Math.sin(a) * (radius + 0.08)]);
      }
      this.fine.addPolyline(pts, true);
    }
    // Arrow slits
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * Math.PI * 2 + Math.PI * 0.25;
      const sx = x + Math.cos(a) * (radius + 0.09);
      const sz = z + Math.sin(a) * (radius + 0.09);
      const slitY = baseY + 4.6 + height * 0.64;
      this.secondary.addSegment(sx, slitY - 1.35, sz, sx, slitY + 1.35, sz);
      const tx = -Math.sin(a) * 0.45;
      const tz = Math.cos(a) * 0.45;
      this.secondary.addSegment(sx - tx, slitY + 0.25, sz - tz, sx + tx, slitY + 0.25, sz + tz);
    }

    // Corbeled machicolation crown
    const crownR = mach ? radius * 1.16 : radius * 1.04;
    this.addCyl(
      crownR,
      radius * 0.96,
      2.2,
      seg,
      composeMat(x, shaftTop + 1.1, z),
      this.solidWall,
      this.secondary,
      26
    );
    const parapetY = shaftTop + 2.2;

    const merlonCount = Math.max(8, Math.round(seg));
    for (let m = 0; m < merlonCount; m++) {
      const a = (m / merlonCount) * Math.PI * 2;
      const mx = x + Math.cos(a) * (crownR - 0.38);
      const mz = z + Math.sin(a) * (crownR - 0.38);
      this.addBox(
        1.1,
        1.65,
        0.78,
        composeMat(mx, parapetY + 0.82, mz, 0, -a + Math.PI * 0.5, 0),
        this.solidWall,
        this.secondary
      );
    }

    let tipY = parapetY + 1.65;
    if (hasRoof) {
      this.addCone(
        crownR * 1.07,
        roofH,
        seg,
        composeMat(x, parapetY + 0.6 + roofH * 0.5, z),
        this.solidRoof,
        this.primary,
        24
      );
      for (const frac of [0.28, 0.56, 0.8]) {
        const cr = crownR * 1.07 * (1 - frac) + 0.06;
        const cy = parapetY + 0.6 + roofH * frac;
        const pts: Array<[number, number, number]> = [];
        for (let s = 0; s < seg; s++) {
          const a = (s / seg) * Math.PI * 2;
          pts.push([x + Math.cos(a) * cr, cy, z + Math.sin(a) * cr]);
        }
        this.fine.addPolyline(pts, true);
      }
      tipY = parapetY + 0.6 + roofH;
    }

    if (options?.hasBanner) {
      const poleH = 5.6 * (options.bannerScale ?? 1);
      this.primary.addSegment(x, tipY, z, x, tipY + poleH, z);
      this.bannerMounts.push({
        pos: new THREE.Vector3(x, tipY + poleH * 0.86, z),
        rotY: this.rand() * Math.PI * 2,
        scale: (options.bannerScale ?? 1.0) * 1.75,
        phase: this.rand() * Math.PI * 2,
      });
    } else if (hasRoof) {
      this.primary.addSegment(x, tipY, z, x, tipY + 2.6, z);
    }
  }

  addTree(x: number, z: number, scale = 1.0, cypress = false) {
    const y = getTownHeight(x, z);
    if (y < WATER_LEVEL + 1.2) return;
    const trunkH = (cypress ? 2.2 : 3.4) * scale;
    this.addCyl(
      0.26 * scale,
      0.42 * scale,
      trunkH,
      5,
      composeMat(x, y + trunkH * 0.5, z),
      this.solidWall,
      this.secondary,
      30
    );
    if (cypress) {
      this.addCone(
        1.4 * scale,
        8.2 * scale,
        7,
        composeMat(x, y + trunkH + 3.9 * scale, z),
        this.solidRoof,
        this.secondary,
        28
      );
    } else {
      const r = 2.8 * scale;
      this.addBlock(
        new THREE.IcosahedronGeometry(r, 0),
        composeMat(x, y + trunkH + r * 0.72, z, 0, this.rand() * 3, 0),
        this.solidRoof,
        this.secondary,
        24
      );
    }
  }

  addRoadStrip(points: Array<[number, number]>, halfW: number) {
    const leftPts: Array<[number, number, number]> = [];
    const rightPts: Array<[number, number, number]> = [];
    for (let i = 0; i < points.length; i++) {
      const [px, pz] = points[i];
      const [nx, nz] = points[Math.min(i + 1, points.length - 1)];
      const [ox, oz] = points[Math.max(i - 1, 0)];
      const dx = nx - ox;
      const dz = nz - oz;
      const len = Math.hypot(dx, dz) || 1;
      const perpX = -dz / len;
      const perpZ = dx / len;
      const lx = px + perpX * halfW;
      const lz = pz + perpZ * halfW;
      const rx = px - perpX * halfW;
      const rz = pz - perpZ * halfW;
      leftPts.push([lx, getTownHeight(lx, lz) + 0.16, lz]);
      rightPts.push([rx, getTownHeight(rx, rz) + 0.16, rz]);
      if (i % 2 === 0) {
        this.fine.addSegment(lx, getTownHeight(lx, lz) + 0.14, lz, rx, getTownHeight(rx, rz) + 0.14, rz);
      }
    }
    this.secondary.addPolyline(leftPts, false);
    this.secondary.addPolyline(rightPts, false);
  }
}

export function buildTerrainAndRiver(ctx: TownBuildContext): {
  terrainGeo: THREE.BufferGeometry;
  waterGeo: THREE.BufferGeometry;
  riverRippleGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
} {
  const terrainGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 192, 192);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < tPos.count; i++) {
    tPos.setY(i, getTownHeight(tPos.getX(i), tPos.getZ(i)));
  }
  terrainGeo.computeVertexNormals();

  // Topographic hillside & alpine mountain contour lines
  for (let z = -450; z <= 450; z += 32) {
    const pts: Array<[number, number, number]> = [];
    for (let x = -450; x <= 450; x += 14) {
      const r = Math.hypot(x, z - WALL_CENTER_Z);
      if (r < WALL_RADIUS - 8) {
        if (pts.length >= 2) ctx.contour.addPolyline(pts, false);
        pts.length = 0;
        continue;
      }
      const y = getTownHeight(x, z);
      if (y < WATER_LEVEL + 0.5) {
        if (pts.length >= 2) ctx.contour.addPolyline(pts, false);
        pts.length = 0;
        continue;
      }
      pts.push([x, y + 0.14, z]);
    }
    if (pts.length >= 2) ctx.contour.addPolyline(pts, false);
  }

  // Acropolis rocky cliff strata rings
  for (const hLevel of [14, 21, 28, 35, 42]) {
    const ringPts: Array<[number, number, number]> = [];
    const segs = 48;
    const rad = 98 - (hLevel - 14) * 1.25;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const cx = Math.cos(a) * rad * 1.18;
      const cz = -154 + Math.sin(a) * rad * 0.96;
      ringPts.push([cx, getTownHeight(cx, cz) + 0.22, cz]);
    }
    ctx.contour.addPolyline(ringPts, true);
  }

  // Wide Southern River Plane
  const waterGeo = new THREE.PlaneGeometry(TERRAIN_SIZE - 16, 68, 160, 4);
  waterGeo.rotateX(-Math.PI / 2);
  const wPos = waterGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < wPos.count; i++) {
    const wx = wPos.getX(i);
    const localZ = wPos.getZ(i);
    wPos.setZ(i, riverCenterZ(wx) + localZ);
    wPos.setY(i, WATER_LEVEL);
  }
  waterGeo.computeVertexNormals();

  // Animated river ripples
  const rippleBucket = new TownLineBucket();
  for (let x = -440; x <= 440; x += 12) {
    const cz = riverCenterZ(x);
    for (const off of [-9.0, -3.0, 3.2, 9.2]) {
      const len = 4.5 + ctx.rand() * 5.5;
      rippleBucket.addSegment(
        x - len * 0.5,
        WATER_LEVEL + 0.12,
        cz + off,
        x + len * 0.5,
        WATER_LEVEL + 0.12,
        cz + off + (ctx.rand() - 0.5) * 0.7
      );
    }
  }

  return {
    terrainGeo,
    waterGeo,
    riverRippleGeo: rippleBucket.toLineSegmentsGeometry(),
  };
}
