import * as THREE from "three";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineBucket, SolidBucket } from "./inkShader";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function riverCenterX(z: number): number {
  return 8.5 * Math.sin(z * 0.044) + 7.2;
}

export function riverHalfWidth(z: number): number {
  return 3.9 + 0.55 * Math.cos(z * 0.075);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * 130x130 Valley Terrain Heightfield with Castle Cliff, Cathedral Knoll,
 * West & East Windmill Ridges, Town Plaza Plateau, and Winding River Channel.
 */
export function getVillageHeight(x: number, z: number): number {
  let h =
    0.95 +
    0.85 * Math.sin(x * 0.052 + 0.4) * Math.cos(z * 0.048 - 0.3) +
    0.45 * Math.cos((x + z) * 0.065);

  // North-West Castle Cliff (-24, -38)
  const dCastle = Math.hypot(x - -24, z - -38);
  h += 7.4 * Math.exp(-(dCastle * dCastle) / 260);
  const castleFlat = 1 - smoothstep(6.5, 11.5, dCastle);
  h = h * (1 - castleFlat * 0.72) + 8.1 * (castleFlat * 0.72);

  // West Ridge Windmill (-35, -20)
  const dWindW = Math.hypot(x - -35, z - -20);
  h += 6.2 * Math.exp(-(dWindW * dWindW) / 180);
  const windWFlat = 1 - smoothstep(2.8, 5.5, dWindW);
  h = h * (1 - windWFlat * 0.65) + 6.9 * (windWFlat * 0.65);

  // Cathedral Knoll (-27, -6)
  const dCath = Math.hypot(x - -27, z - -6);
  h += 3.2 * Math.exp(-(dCath * dCath) / 155);
  const cathFlat = 1 - smoothstep(4.5, 8.5, dCath);
  h = h * (1 - cathFlat * 0.65) + 4.0 * (cathFlat * 0.65);

  // Clocktower Knoll (-11, -18)
  const dClock = Math.hypot(x - -11, z - -18);
  h += 3.5 * Math.exp(-(dClock * dClock) / 110);
  const clockFlat = 1 - smoothstep(2.6, 5.2, dClock);
  h = h * (1 - clockFlat * 0.65) + 4.3 * (clockFlat * 0.65);

  // East Wheat Ridge Windmill (34, 15)
  const dWindE = Math.hypot(x - 34, z - 15);
  h += 5.4 * Math.exp(-(dWindE * dWindE) / 210);
  const windEFlat = 1 - smoothstep(2.8, 5.5, dWindE);
  h = h * (1 - windEFlat * 0.65) + 6.1 * (windEFlat * 0.65);

  // North-East Forested Ridge (28, -28)
  const dNE = Math.hypot(x - 28, z - -28);
  h += 5.6 * Math.exp(-(dNE * dNE) / 240);

  // South-West Pasture Hill (-32, 28)
  const dSW = Math.hypot(x - -32, z - 28);
  h += 3.6 * Math.exp(-(dSW * dSW) / 220);

  // Flatten Central Market Plaza around (-10.5, 2.0)
  const dPlaza = Math.hypot(x - -10.5, z - 2.0);
  const plazaBlend = 1 - smoothstep(6.2, 11.5, dPlaza);
  h = h * (1 - plazaBlend) + 0.85 * plazaBlend;

  // Carve wide winding river channel
  const rx = riverCenterX(z);
  const rw = riverHalfWidth(z);
  const distRiver = Math.abs(x - rx);
  const riverCarve = 1 - smoothstep(rw * 0.62, rw * 1.9, distRiver);
  h = h * (1 - riverCarve) + -1.85 * riverCarve;

  // Gentle outer rim drop beyond r = 56
  const rEdge = Math.hypot(x, z);
  h -= smoothstep(55.0, 66.0, rEdge) * 1.8;

  return h;
}

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();

function composeMat(
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

function createGableRoofPrism(w: number, h: number, l: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hl = l / 2;
  const p = [
    [-hw, 0, -hl],
    [hw, 0, -hl],
    [0, h, -hl],
    [-hw, 0, hl],
    [hw, 0, hl],
    [0, h, hl],
  ];
  const tris = [
    p[3], p[4], p[5],
    p[1], p[0], p[2],
    p[0], p[3], p[5], p[0], p[5], p[2],
    p[4], p[1], p[2], p[4], p[2], p[5],
    p[0], p[1], p[4], p[0], p[4], p[3],
  ];
  const verts = new Float32Array(tris.length * 3);
  for (let i = 0; i < tris.length; i++) {
    verts[i * 3] = tris[i][0];
    verts[i * 3 + 1] = tris[i][1];
    verts[i * 3 + 2] = tris[i][2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

function addBoxPiece(
  solids: SolidBucket,
  lines: LineBucket,
  w: number,
  h: number,
  d: number,
  matrix: THREE.Matrix4,
  thresholdDeg = 25
) {
  const geo = new THREE.BoxGeometry(w, h, d);
  solids.add(geo, matrix);
  lines.addEdgesFromGeometry(geo, thresholdDeg, matrix);
  geo.dispose();
}

function addCylinderPiece(
  solids: SolidBucket,
  lines: LineBucket,
  rTop: number,
  rBot: number,
  h: number,
  radialSegments: number,
  matrix: THREE.Matrix4,
  thresholdDeg = 22
) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, radialSegments, 1);
  solids.add(geo, matrix);
  lines.addEdgesFromGeometry(geo, thresholdDeg, matrix);
  geo.dispose();
}

interface HouseSpec {
  x: number;
  z: number;
  rotY: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  roofHeight: number;
  jetty?: boolean;
  hasDormer?: boolean;
  hasChimney?: boolean;
  hasPorch?: boolean;
  lWing?: boolean;
}

function buildHalfTimberHouse(
  spec: HouseSpec,
  solids: SolidBucket,
  primary: LineBucket,
  secondary: LineBucket,
  fine: LineBucket,
  windowGlows: SolidBucket
) {
  const baseY = getVillageHeight(spec.x, spec.z);
  const root = composeMat(spec.x, baseY, spec.z, 0, spec.rotY, 0);
  const local = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(root, composeMat(lx, ly, lz, rx, ry, rz));

  const { width: w, depth: d, floors, floorHeight: fh, roofHeight: rh } = spec;

  const plinthH = 2.4;
  const plinthTop = 0.38;
  addBoxPiece(solids, primary, w + 0.24, plinthH, d + 0.24, local(0, plinthTop - plinthH / 2, 0));

  const pw = w / 2 + 0.135;
  const pd = d / 2 + 0.135;
  for (const cy of [0.1, 0.25]) {
    const pts: Array<[number, number, number]> = [
      [-pw, cy, -pd],
      [pw, cy, -pd],
      [pw, cy, pd],
      [-pw, cy, pd],
    ];
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      fine.addTransformedSegment(
        new THREE.Vector3(a[0], a[1], a[2]),
        new THREE.Vector3(b[0], b[1], b[2]),
        root
      );
    }
  }

  let curY = plinthTop;
  let topW = w;
  let topD = d;

  for (let f = 0; f < floors; f++) {
    const isJetty = Boolean(spec.jetty && f > 0);
    const fw = isJetty ? w + 0.36 : w;
    const fd = isJetty ? d + 0.36 : d;
    topW = fw;
    topD = fd;

    addBoxPiece(solids, primary, fw, fh, fd, local(0, curY + fh / 2, 0));

    if (isJetty) {
      const bracketCount = Math.max(2, Math.round(fw / 1.1));
      for (let i = 0; i < bracketCount; i++) {
        const bx = -fw / 2 + 0.32 + (i / Math.max(1, bracketCount - 1)) * (fw - 0.64);
        addBoxPiece(solids, secondary, 0.11, 0.24, 0.24, local(bx, curY - 0.11, fd / 2 - 0.1));
        addBoxPiece(solids, secondary, 0.11, 0.24, 0.24, local(bx, curY - 0.11, -fd / 2 + 0.1));
      }
    }

    const beamT = 0.095;
    const beamOffX = fw / 2 + 0.025;
    const beamOffZ = fd / 2 + 0.025;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addBoxPiece(solids, secondary, beamT, fh + 0.02, beamT, local(sx * beamOffX, curY + fh / 2, sz * beamOffZ));
      }
    }
    for (const sz of [-1, 1]) {
      addBoxPiece(solids, secondary, fw + 0.09, beamT, beamT, local(0, curY + fh - 0.04, sz * beamOffZ));
      addBoxPiece(solids, secondary, fw + 0.09, beamT * 0.85, beamT, local(0, curY + 0.05, sz * beamOffZ));
    }
    for (const sx of [-1, 1]) {
      addBoxPiece(solids, secondary, beamT, beamT, fd + 0.09, local(sx * beamOffX, curY + fh - 0.04, 0));
      addBoxPiece(solids, secondary, beamT, beamT * 0.85, fd + 0.09, local(sx * beamOffX, curY + 0.05, 0));
    }

    const braceZ = fd / 2 + 0.044;
    const braceTop = curY + fh - 0.08;
    const braceBot = curY + 0.08;
    for (const sz of [-1, 1]) {
      const zSign = sz * braceZ;
      secondary.addTransformedSegment(
        new THREE.Vector3(-fw / 2 + 0.06, braceBot, zSign),
        new THREE.Vector3(-fw / 2 + 0.56, braceTop, zSign),
        root
      );
      secondary.addTransformedSegment(
        new THREE.Vector3(fw / 2 - 0.06, braceBot, zSign),
        new THREE.Vector3(fw / 2 - 0.56, braceTop, zSign),
        root
      );
    }

    const winCols = fw >= 3.3 ? [-fw * 0.27, fw * 0.27] : [0];
    for (const wx of winCols) {
      if (f === 0 && Math.abs(wx) < 0.45) continue;
      for (const sz of [-1, 1]) {
        const wy = curY + fh * 0.54;
        const wz = sz * (fd / 2 + 0.025);
        addBoxPiece(solids, secondary, 0.52, 0.66, 0.09, local(wx, wy, wz));
        addBoxPiece(solids, secondary, 0.62, 0.07, 0.14, local(wx, wy - 0.36, sz * (fd / 2 + 0.04)));
        const paneGeo = new THREE.BoxGeometry(0.4, 0.52, 0.03);
        windowGlows.add(paneGeo, local(wx, wy, sz * (fd / 2 + 0.06)));
        paneGeo.dispose();
        const gz = sz * (fd / 2 + 0.082);
        secondary.addTransformedSegment(
          new THREE.Vector3(wx, wy - 0.27, gz),
          new THREE.Vector3(wx, wy + 0.27, gz),
          root
        );
        secondary.addTransformedSegment(
          new THREE.Vector3(wx - 0.21, wy, gz),
          new THREE.Vector3(wx + 0.21, wy, gz),
          root
        );
        for (const side of [-1, 1]) {
          addBoxPiece(solids, secondary, 0.18, 0.62, 0.05, local(wx + side * 0.37, wy, sz * (fd / 2 + 0.03)));
        }
        if (f === 0 && sz > 0) {
          addBoxPiece(solids, secondary, 0.54, 0.14, 0.18, local(wx, wy - 0.44, sz * (fd / 2 + 0.08)));
        }
      }
    }

    for (const sx of [-1, 1]) {
      const wy = curY + fh * 0.54;
      const wx = sx * (fw / 2 + 0.025);
      addBoxPiece(solids, secondary, 0.09, 0.62, 0.48, local(wx, wy, 0));
      const paneGeo = new THREE.BoxGeometry(0.03, 0.48, 0.36);
      windowGlows.add(paneGeo, local(sx * (fw / 2 + 0.06), wy, 0));
      paneGeo.dispose();
      const gx = sx * (fw / 2 + 0.082);
      secondary.addTransformedSegment(new THREE.Vector3(gx, wy - 0.25, 0), new THREE.Vector3(gx, wy + 0.25, 0), root);
      secondary.addTransformedSegment(new THREE.Vector3(gx, wy, -0.19), new THREE.Vector3(gx, wy, 0.19), root);
    }

    if (f === 0) {
      const dz = fd / 2 + 0.03;
      addBoxPiece(solids, secondary, 0.72, 1.18, 0.11, local(0, curY + 0.59, dz));
      for (const px of [-0.14, 0, 0.14]) {
        fine.addTransformedSegment(
          new THREE.Vector3(px, curY + 0.05, fd / 2 + 0.092),
          new THREE.Vector3(px, curY + 1.12, fd / 2 + 0.092),
          root
        );
      }
      addBoxPiece(solids, secondary, 1.05, 0.18, 0.48, local(0, plinthTop - 0.06, fd / 2 + 0.28));

      if (spec.hasPorch) {
        addBoxPiece(solids, secondary, 1.32, 0.09, 0.76, local(0, curY + 1.38, fd / 2 + 0.36), 24);
        for (const sx of [-0.55, 0.55]) {
          addBoxPiece(solids, secondary, 0.09, 1.36, 0.09, local(sx, curY + 0.68, fd / 2 + 0.66));
        }
      }
    }

    curY += fh;
  }

  const eaveOverhang = 0.4;
  const roofW = topW + eaveOverhang * 2;
  const roofL = topD + eaveOverhang * 2;
  const roofGeo = createGableRoofPrism(roofW, rh, roofL);
  const roofMat = local(0, curY - 0.03, 0);
  solids.add(roofGeo, roofMat);
  primary.addEdgesFromGeometry(roofGeo, 20, roofMat);
  roofGeo.dispose();

  addBoxPiece(solids, primary, 0.16, 0.15, roofL + 0.08, local(0, curY + rh - 0.01, 0));

  const halfSpan = roofW / 2;
  const slopeLen = Math.hypot(halfSpan, rh);
  const nx = rh / slopeLen;
  const ny = halfSpan / slopeLen;
  const courseCount = 4;
  for (let c = 1; c <= courseCount; c++) {
    const t = c / (courseCount + 1);
    const rx = (1 - t) * halfSpan;
    const ry = curY - 0.03 + t * rh;
    for (const side of [-1, 1]) {
      const px = side * rx + side * nx * 0.022;
      const py = ry + ny * 0.022;
      fine.addTransformedSegment(
        new THREE.Vector3(px, py, -roofL / 2 + 0.06),
        new THREE.Vector3(px, py, roofL / 2 - 0.06),
        root
      );
    }
  }

  if (spec.hasDormer) {
    const dx = topW * 0.25;
    const dy = curY + rh * 0.42;
    addBoxPiece(solids, secondary, 0.72, 0.56, 0.72, local(dx, dy, 0.1));
    const dRoof = createGableRoofPrism(0.86, 0.36, 0.86);
    const dMat = local(dx, dy + 0.26, 0.1, 0, Math.PI / 2, 0);
    solids.add(dRoof, dMat);
    secondary.addEdgesFromGeometry(dRoof, 22, dMat);
    dRoof.dispose();
  }

  if (spec.hasChimney) {
    const cx = -topW * 0.28;
    const cz = -topD * 0.22;
    const chimTop = curY + rh + 0.7;
    const chimH = chimTop - plinthTop;
    addBoxPiece(solids, primary, 0.5, chimH, 0.5, local(cx, plinthTop + chimH / 2, cz));
    addBoxPiece(solids, secondary, 0.62, 0.12, 0.62, local(cx, chimTop + 0.04, cz));
  }

  if (spec.lWing) {
    const lw = w * 0.68;
    const ld = d * 0.68;
    const lx = w / 2 + lw / 2 - 0.18;
    const lz = -d * 0.12;
    addBoxPiece(solids, primary, lw + 0.14, 2.0, ld + 0.14, local(lx, plinthTop - 1.0, lz));
    addBoxPiece(solids, primary, lw, fh, ld, local(lx, plinthTop + fh / 2, lz));
    const wingRoof = createGableRoofPrism(ld + 0.54, rh * 0.72, lw + 0.54);
    const wingMat = local(lx, plinthTop + fh - 0.03, lz, 0, Math.PI / 2, 0);
    solids.add(wingRoof, wingMat);
    primary.addEdgesFromGeometry(wingRoof, 20, wingMat);
    wingRoof.dispose();
  }
}

export interface VillageSceneData {
  terrainGeo: THREE.BufferGeometry;
  waterGeo: THREE.BufferGeometry;
  staticOcclusionGeo: THREE.BufferGeometry;
  windowGlowGeo: THREE.BufferGeometry;
  primaryLinesGeo: LineSegmentsGeometry;
  secondaryLinesGeo: LineSegmentsGeometry;
  fineLinesGeo: LineSegmentsGeometry;
  windmillHub: THREE.Vector3;
  windmillRotY: number;
  windmillHub2: THREE.Vector3;
  windmillRotY2: number;
  windmillSailsOcclusionGeo: THREE.BufferGeometry;
  windmillSailsLinesGeo: LineSegmentsGeometry;
  waterwheelHub: THREE.Vector3;
  waterwheelRotY: number;
  waterwheelOcclusionGeo: THREE.BufferGeometry;
  waterwheelLinesGeo: LineSegmentsGeometry;
  clockOrigin: THREE.Vector3;
  belfryPivot: THREE.Vector3;
  belfryBellOcclusionGeo: THREE.BufferGeometry;
  belfryBellLinesGeo: LineSegmentsGeometry;
  tavernSignPivot: THREE.Vector3;
  tavernSignOcclusionGeo: THREE.BufferGeometry;
  tavernSignLinesGeo: LineSegmentsGeometry;
  boatOrigin: THREE.Vector3;
  boatRotY: number;
  boat2Origin: THREE.Vector3;
  boat2RotY: number;
  boatOcclusionGeo: THREE.BufferGeometry;
  boatLinesGeo: LineSegmentsGeometry;
  birdLinesGeo: LineSegmentsGeometry;
  cloudOcclusionGeo: THREE.BufferGeometry;
  cloudLinesGeo: LineSegmentsGeometry;
  smokeRingGeo: LineSegmentsGeometry;
  chimneyTops: THREE.Vector3[];
  riverRippleGeo: LineSegmentsGeometry;
  gridLinesGeo: LineSegmentsGeometry;
  dispose: () => void;
}

export function buildLineVillageSceneData(): VillageSceneData {
  const rng = mulberry32(42071);

  const solids = new SolidBucket();
  const windowGlows = new SolidBucket();
  const primary = new LineBucket();
  const secondary = new LineBucket();
  const fine = new LineBucket();

  // ------------------------------------------------------------------
  // 1. 130x130 Valley Terrain Mesh + Marching-Squares Contours
  // ------------------------------------------------------------------
  const size = 130;
  const segs = 128;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.getAttribute("position");
  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const z = tPos.getZ(i);
    tPos.setY(i, getVillageHeight(x, z));
  }
  terrainGeo.computeVertexNormals();

  const half = size / 2;
  const skirtBottom = -3.4;
  const skirtBucket = new SolidBucket();
  const makeSkirtSide = (x1: number, z1: number, x2: number, z2: number) => {
    const verts: number[] = [];
    const normals: number[] = [];
    const steps = segs;
    const dx = (x2 - x1) / steps;
    const dz = (z2 - z1) / steps;
    const nx = -(z2 - z1);
    const nz = x2 - x1;
    const len = Math.hypot(nx, nz) || 1;
    const nxx = nx / len;
    const nzz = nz / len;
    for (let i = 0; i < steps; i++) {
      const ax = x1 + dx * i;
      const az = z1 + dz * i;
      const bx = x1 + dx * (i + 1);
      const bz = z1 + dz * (i + 1);
      const ay = getVillageHeight(ax, az);
      const by = getVillageHeight(bx, bz);
      verts.push(
        ax, skirtBottom, az,
        bx, skirtBottom, bz,
        bx, by, bz,
        ax, skirtBottom, az,
        bx, by, bz,
        ax, ay, az
      );
      for (let k = 0; k < 6; k++) normals.push(nxx, 0, nzz);
      primary.addSegment(ax, ay, az, bx, by, bz);
      primary.addSegment(ax, skirtBottom, az, bx, skirtBottom, bz);
    }
    primary.addSegment(x1, skirtBottom, z1, x1, getVillageHeight(x1, z1), z1);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    skirtBucket.add(g);
    g.dispose();
  };
  makeSkirtSide(-half, half, half, half);
  makeSkirtSide(half, half, half, -half);
  makeSkirtSide(half, -half, -half, -half);
  makeSkirtSide(-half, -half, -half, half);
  const skirtMerged = skirtBucket.toMergedGeometry();
  solids.add(skirtMerged);
  skirtMerged.dispose();

  // Marching-squares contours across 8 elevation bands
  const contourGrid = 112;
  const contourStep = size / contourGrid;
  const heights: number[][] = [];
  for (let gz = 0; gz <= contourGrid; gz++) {
    const row: number[] = [];
    const wz = -half + gz * contourStep;
    for (let gx = 0; gx <= contourGrid; gx++) {
      const wx = -half + gx * contourStep;
      row.push(getVillageHeight(wx, wz));
    }
    heights.push(row);
  }
  const contourLevels = [-0.4, 0.5, 1.4, 2.4, 3.5, 4.7, 6.0, 7.4];
  const interpEdge = (
    x1: number,
    z1: number,
    h1: number,
    x2: number,
    z2: number,
    h2: number,
    level: number
  ): [number, number] => {
    const t = Math.abs(h2 - h1) < 1e-5 ? 0.5 : (level - h1) / (h2 - h1);
    return [x1 + (x2 - x1) * t, z1 + (z2 - z1) * t];
  };
  for (const level of contourLevels) {
    for (let gz = 0; gz < contourGrid; gz++) {
      const z0 = -half + gz * contourStep;
      const z1 = z0 + contourStep;
      for (let gx = 0; gx < contourGrid; gx++) {
        const x0 = -half + gx * contourStep;
        const x1 = x0 + contourStep;
        const h00 = heights[gz][gx];
        const h10 = heights[gz][gx + 1];
        const h11 = heights[gz + 1][gx + 1];
        const h01 = heights[gz + 1][gx];
        const hits: Array<[number, number]> = [];
        if ((h00 >= level) !== (h10 >= level)) hits.push(interpEdge(x0, z0, h00, x1, z0, h10, level));
        if ((h10 >= level) !== (h11 >= level)) hits.push(interpEdge(x1, z0, h10, x1, z1, h11, level));
        if ((h11 >= level) !== (h01 >= level)) hits.push(interpEdge(x1, z1, h11, x0, z1, h01, level));
        if ((h01 >= level) !== (h00 >= level)) hits.push(interpEdge(x0, z1, h01, x0, z0, h00, level));
        if (hits.length >= 2) {
          fine.addSegment(hits[0][0], level + 0.04, hits[0][1], hits[1][0], level + 0.04, hits[1][1]);
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // 2. Wide River Water Surface + Animated Ripples
  // ------------------------------------------------------------------
  const waterY = -0.45;
  const waterGeo = new THREE.PlaneGeometry(18, size, 14, 120);
  waterGeo.rotateX(-Math.PI / 2);
  const wPos = waterGeo.getAttribute("position");
  for (let i = 0; i < wPos.count; i++) {
    const localX = wPos.getX(i);
    const z = wPos.getZ(i);
    wPos.setX(i, riverCenterX(z) + localX * 0.62);
    wPos.setY(i, waterY);
  }
  waterGeo.computeVertexNormals();

  const rippleBucket = new LineBucket();
  for (let i = 0; i < 88; i++) {
    const rz = -half + 2 + (i / 88) * (size - 4);
    const rx = riverCenterX(rz) + (rng() - 0.5) * 4.6;
    const len = 1.2 + rng() * 2.4;
    const rx2 = riverCenterX(rz + len) + (rx - riverCenterX(rz));
    rippleBucket.addSegment(rx, waterY + 0.045, rz, rx2, waterY + 0.045, rz + len);
  }

  // ------------------------------------------------------------------
  // 3. Grand 5-Arch Stone Bridge (z = 2.0) + North Timber Bridge (z = -28)
  // ------------------------------------------------------------------
  const buildStoneArchBridge = (zPos: number, span: number, archCount: number, deckY: number) => {
    const bx = riverCenterX(zPos);
    const bw = 3.2;
    const archSpan = span / archCount;
    for (let p = 0; p <= archCount; p++) {
      const px = bx - span / 2 + p * archSpan;
      const pierH = deckY - -2.2;
      addBoxPiece(solids, primary, 0.78, pierH, bw + 0.36, composeMat(px, -2.2 + pierH / 2, zPos));
      for (const sz of [-1, 1]) {
        addCylinderPiece(
          solids,
          secondary,
          0.36,
          0.46,
          pierH - 0.4,
          4,
          composeMat(px, -2.2 + (pierH - 0.4) / 2, zPos + sz * (bw / 2 + 0.22), 0, Math.PI / 4, 0)
        );
      }
    }
    for (let a = 0; a < archCount; a++) {
      const cx = bx - span / 2 + (a + 0.5) * archSpan;
      const archSteps = 8;
      const r = archSpan / 2 - 0.34;
      for (let s = 0; s < archSteps; s++) {
        const a0 = (s / archSteps) * Math.PI;
        const a1 = ((s + 1) / archSteps) * Math.PI;
        const am = (a0 + a1) / 2;
        const vx = cx - Math.cos(am) * r;
        const vy = -0.15 + Math.sin(am) * r * 0.72;
        const segLen = (Math.PI * r) / archSteps + 0.04;
        const rotZ = Math.atan2(Math.cos(am) * 0.72, Math.sin(am));
        addBoxPiece(solids, secondary, segLen, 0.26, bw + 0.06, composeMat(vx, vy, zPos, 0, 0, rotZ));
        const fillH = Math.max(0.16, deckY - vy);
        addBoxPiece(solids, primary, segLen * 0.96, fillH, bw - 0.08, composeMat(vx, vy + fillH / 2, zPos));
      }
    }
    addBoxPiece(solids, primary, span + 1.4, 0.24, bw + 0.16, composeMat(bx, deckY + 0.12, zPos));
    for (const sz of [-1, 1]) {
      addBoxPiece(solids, primary, span + 1.2, 0.56, 0.26, composeMat(bx, deckY + 0.48, zPos + sz * (bw / 2 - 0.04)));
      addBoxPiece(solids, secondary, span + 1.28, 0.1, 0.34, composeMat(bx, deckY + 0.8, zPos + sz * (bw / 2 - 0.04)));
      for (const sx of [-1, 0, 1]) {
        const lx = bx + sx * (span / 2 + 0.35);
        const lz = zPos + sz * (bw / 2 - 0.04);
        addBoxPiece(solids, primary, 0.4, 1.0, 0.4, composeMat(lx, deckY + 0.7, lz));
        addBoxPiece(solids, secondary, 0.14, 0.55, 0.14, composeMat(lx, deckY + 1.46, lz));
        const lg = new THREE.BoxGeometry(0.24, 0.28, 0.24);
        windowGlows.add(lg, composeMat(lx, deckY + 1.86, lz));
        primary.addEdgesFromGeometry(lg, 20, composeMat(lx, deckY + 1.86, lz));
        lg.dispose();
      }
    }
  };
  buildStoneArchBridge(2.0, 17.5, 5, 1.05);
  buildStoneArchBridge(-28.0, 14.5, 3, 1.15);

  // ------------------------------------------------------------------
  // 4. Grand North-West Castle Keep & Curtain Walls (-24, -38)
  // ------------------------------------------------------------------
  const casX = -24;
  const casZ = -38;
  const casY = getVillageHeight(casX, casZ);
  const casRoot = composeMat(casX, casY, casZ, 0, 0.22, 0);
  const casLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(casRoot, composeMat(lx, ly, lz, rx, ry, rz));

  // Massive stepped stone base + Central Keep Tower + 4 Corner Turrets
  addBoxPiece(solids, primary, 13.5, 4.0, 13.5, casLoc(0, 0.2, 0));
  addBoxPiece(solids, primary, 8.2, 9.5, 8.2, casLoc(0, 6.2, 0));
  addBoxPiece(solids, secondary, 8.7, 0.55, 8.7, casLoc(0, 11.1, 0));
  // Battlement merlons on central keep
  for (const s of [-3.4, -1.7, 0, 1.7, 3.4]) {
    for (const edge of [-4.05, 4.05]) {
      addBoxPiece(solids, primary, 0.85, 0.85, 0.45, casLoc(s, 11.75, edge));
      addBoxPiece(solids, primary, 0.45, 0.85, 0.85, casLoc(edge, 11.75, s));
    }
  }
  // 4 Corner Cylindrical Turrets with Steep Conical Spires
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinderPiece(solids, primary, 1.65, 1.85, 11.8, 10, casLoc(sx * 5.8, 5.4, sz * 5.8));
      addCylinderPiece(solids, secondary, 1.9, 1.75, 0.45, 10, casLoc(sx * 5.8, 11.4, sz * 5.8));
      addCylinderPiece(solids, primary, 0.05, 2.05, 3.8, 10, casLoc(sx * 5.8, 13.5, sz * 5.8));
    }
  }
  // Castle outer curtain walls & gatehouse
  for (const sx of [-1, 1]) {
    addBoxPiece(solids, primary, 1.1, 5.2, 10.2, casLoc(sx * 5.8, 3.2, 0));
  }
  addBoxPiece(solids, primary, 10.2, 5.2, 1.1, casLoc(0, 3.2, -5.8));
  addBoxPiece(solids, primary, 4.2, 5.2, 1.1, casLoc(-3.4, 3.2, 5.8));
  addBoxPiece(solids, primary, 4.2, 5.2, 1.1, casLoc(3.4, 3.2, 5.8));
  addBoxPiece(solids, primary, 3.6, 2.8, 1.4, casLoc(0, 5.4, 5.8));

  // City Rampart Wall & Twin-Tower Gatehouse guarding West Approach (-16, 14)
  const buildWallSegment = (x1: number, z1: number, x2: number, z2: number) => {
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    const my = getVillageHeight(mx, mz);
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = -Math.atan2(z2 - z1, x2 - x1);
    addBoxPiece(solids, primary, len, 3.8, 0.95, composeMat(mx, my + 0.8, mz, 0, ang, 0));
    const merlons = Math.max(2, Math.floor(len / 1.4));
    for (let i = 0; i < merlons; i++) {
      const f = (i + 0.5) / merlons - 0.5;
      const px = mx + Math.cos(ang) * f * len;
      const pz = mz - Math.sin(ang) * f * len;
      addBoxPiece(solids, secondary, 0.65, 0.65, 0.42, composeMat(px, my + 3.0, pz, 0, ang, 0));
    }
  };
  buildWallSegment(-34, -4, -30, 12);
  buildWallSegment(-30, 12, -16, 16);
  buildWallSegment(-8, 16, 1, 13);
  // Twin-Tower City Gatehouse at (-12, 16)
  const ghY = getVillageHeight(-12, 16);
  for (const sx of [-2.4, 2.4]) {
    addCylinderPiece(solids, primary, 1.25, 1.4, 6.2, 8, composeMat(-12 + sx, ghY + 2.5, 16));
    addCylinderPiece(solids, primary, 0.05, 1.55, 2.8, 8, composeMat(-12 + sx, ghY + 6.9, 16));
  }
  addBoxPiece(solids, primary, 4.2, 2.4, 1.4, composeMat(-12, ghY + 4.0, 16));

  // ------------------------------------------------------------------
  // 5. Gothic Cathedral with Twin Spires & Flying Buttresses (-27, -6)
  // ------------------------------------------------------------------
  const cathX = -27;
  const cathZ = -6;
  const cathY = getVillageHeight(cathX, cathZ);
  const cathRoot = composeMat(cathX, cathY, cathZ, 0, 0.45, 0);
  const cathLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(cathRoot, composeMat(lx, ly, lz, rx, ry, rz));

  addBoxPiece(solids, primary, 7.6, 2.2, 14.5, cathLoc(0, -0.3, 0));
  addBoxPiece(solids, primary, 6.4, 7.2, 13.2, cathLoc(0, 4.4, 0));
  const naveRoof = createGableRoofPrism(6.9, 3.6, 13.6);
  const naveRoofMat = cathLoc(0, 7.98, 0);
  solids.add(naveRoof, naveRoofMat);
  primary.addEdgesFromGeometry(naveRoof, 20, naveRoofMat);
  naveRoof.dispose();
  // Transept cross wing
  addBoxPiece(solids, primary, 10.6, 6.5, 4.2, cathLoc(0, 4.0, -1.5));
  const tranRoof = createGableRoofPrism(4.6, 2.8, 11.0);
  const tranMat = cathLoc(0, 7.2, -1.5, 0, Math.PI / 2, 0);
  solids.add(tranRoof, tranMat);
  primary.addEdgesFromGeometry(tranRoof, 20, tranMat);
  tranRoof.dispose();
  // Flying Buttresses along both sides of nave
  for (const bz of [-4.6, -2.4, 1.2, 3.4]) {
    for (const sx of [-1, 1]) {
      addBoxPiece(solids, secondary, 0.65, 5.6, 0.65, cathLoc(sx * 4.4, 3.5, bz));
      addBoxPiece(solids, secondary, 1.65, 0.45, 0.42, cathLoc(sx * 3.65, 5.9, bz, 0, 0, -sx * 0.42));
    }
  }
  // Twin Front Bell Spires + Central Rose Window
  for (const sx of [-2.2, 2.2]) {
    addBoxPiece(solids, primary, 2.2, 10.8, 2.2, cathLoc(sx, 5.9, 6.4));
    addCylinderPiece(solids, primary, 0.05, 1.5, 6.4, 8, cathLoc(sx, 14.4, 6.4));
  }
  addCylinderPiece(solids, secondary, 1.25, 1.25, 0.22, 16, cathLoc(0, 5.8, 6.75, Math.PI / 2, 0, 0));

  // ------------------------------------------------------------------
  // 6. Hilltop Clocktower & Belfry (-11, -18)
  // ------------------------------------------------------------------
  const ctX = -11;
  const ctZ = -18;
  const ctBaseY = getVillageHeight(ctX, ctZ);
  const ctOrigin = composeMat(ctX, ctBaseY, ctZ, 0, 0.12, 0);
  const ctLocal = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(ctOrigin, composeMat(lx, ly, lz, rx, ry, rz));

  addBoxPiece(solids, primary, 4.6, 2.4, 4.6, ctLocal(0, -0.5, 0));
  addBoxPiece(solids, primary, 3.8, 1.5, 3.8, ctLocal(0, 1.35, 0));
  addBoxPiece(solids, primary, 3.1, 6.8, 3.1, ctLocal(0, 5.3, 0));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBoxPiece(solids, secondary, 0.48, 8.2, 0.48, ctLocal(sx * 1.5, 4.2, sz * 1.5));
    }
  }
  addBoxPiece(solids, secondary, 3.5, 0.26, 3.5, ctLocal(0, 8.75, 0));
  const clockY = 7.45;
  const clockDialRadius = 0.76;
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    const dx = Math.sin(angle) * 1.6;
    const dz = Math.cos(angle) * 1.6;
    addCylinderPiece(solids, secondary, clockDialRadius, clockDialRadius, 0.15, 16, ctLocal(dx, clockY, dz, Math.PI / 2, 0, -angle));
    for (let t = 0; t < 12; t++) {
      const ta = (t / 12) * Math.PI * 2;
      const p1 = new THREE.Vector3(Math.sin(ta) * 0.52, Math.cos(ta) * 0.52, 0.1);
      const p2 = new THREE.Vector3(Math.sin(ta) * 0.7, Math.cos(ta) * 0.7, 0.1);
      fine.addTransformedSegment(p1, p2, ctLocal(dx, clockY, dz, 0, angle, 0));
    }
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBoxPiece(solids, primary, 0.44, 2.3, 0.44, ctLocal(sx * 1.28, 9.95, sz * 1.28));
    }
  }
  addBoxPiece(solids, primary, 3.7, 0.3, 3.7, ctLocal(0, 11.2, 0));
  addCylinderPiece(solids, primary, 0.05, 2.45, 4.9, 8, ctLocal(0, 13.75, 0, 0, Math.PI / 8, 0));
  primary.addTransformedSegment(new THREE.Vector3(0, 16.2, 0), new THREE.Vector3(0, 17.4, 0), ctOrigin);
  primary.addTransformedSegment(new THREE.Vector3(-0.38, 16.9, 0), new THREE.Vector3(0.38, 16.9, 0), ctOrigin);

  const belfryBellSolids = new SolidBucket();
  const belfryBellLines = new LineBucket();
  addCylinderPiece(belfryBellSolids, belfryBellLines, 0.24, 0.52, 0.8, 12, composeMat(0, -0.44, 0));

  // ------------------------------------------------------------------
  // 7. Twin Grand Windmills (-35, -20) & (34, 15)
  // ------------------------------------------------------------------
  const buildWindmillBody = (wx: number, wz: number, rotY: number) => {
    const wy = getVillageHeight(wx, wz);
    const origin = composeMat(wx, wy, wz, 0, rotY, 0);
    const wLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
      new THREE.Matrix4().multiplyMatrices(origin, composeMat(lx, ly, lz, rx, ry, rz));
    addCylinderPiece(solids, primary, 2.25, 2.68, 2.8, 8, wLoc(0, 0.3, 0, 0, Math.PI / 8, 0));
    addCylinderPiece(solids, primary, 1.6, 2.2, 4.6, 8, wLoc(0, 3.9, 0, 0, Math.PI / 8, 0));
    addCylinderPiece(solids, secondary, 2.65, 2.65, 0.18, 8, wLoc(0, 2.4, 0, 0, Math.PI / 8, 0));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const aNext = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      secondary.addTransformedSegment(new THREE.Vector3(Math.cos(a) * 2.46, 2.48, Math.sin(a) * 2.46), new THREE.Vector3(Math.cos(a) * 2.46, 3.16, Math.sin(a) * 2.46), origin);
      secondary.addTransformedSegment(new THREE.Vector3(Math.cos(a) * 2.46, 3.16, Math.sin(a) * 2.46), new THREE.Vector3(Math.cos(aNext) * 2.46, 3.16, Math.sin(aNext) * 2.46), origin);
    }
    addCylinderPiece(solids, primary, 0.05, 1.98, 2.45, 8, wLoc(0, 7.35, 0, 0, Math.PI / 8, 0));
    addBoxPiece(solids, secondary, 0.68, 0.68, 1.15, wLoc(0, 5.9, 1.72));
    return new THREE.Vector3(0, 5.9, 2.36).applyMatrix4(origin);
  };
  const wmRotY = 0.56;
  const wmHubWorld = buildWindmillBody(-35, -20, wmRotY);
  const wmRotY2 = -0.82;
  const wmHubWorld2 = buildWindmillBody(34, 15, wmRotY2);

  const wmSailSolids = new SolidBucket();
  const wmSailLines = new LineBucket();
  addCylinderPiece(wmSailSolids, wmSailLines, 0.25, 0.25, 0.5, 8, composeMat(0, 0, 0, Math.PI / 2, 0, 0));
  for (let b = 0; b < 4; b++) {
    const ba = (b * Math.PI) / 2;
    const sparMat = composeMat(0, 0, 0, 0, 0, ba);
    addBoxPiece(wmSailSolids, wmSailLines, 0.14, 4.8, 0.12, new THREE.Matrix4().multiplyMatrices(sparMat, composeMat(0, 2.45, 0)));
    addBoxPiece(wmSailSolids, wmSailLines, 0.76, 3.3, 0.04, new THREE.Matrix4().multiplyMatrices(sparMat, composeMat(0.46, 2.85, 0.02)));
    for (let r = 0; r <= 6; r++) {
      const ry = 1.35 + (r / 6) * 3.05;
      wmSailLines.addTransformedSegment(new THREE.Vector3(0.08, ry, 0.05), new THREE.Vector3(0.84, ry, 0.05), sparMat);
    }
    for (let c = 1; c <= 2; c++) {
      const cx = 0.08 + (c / 3) * 0.76;
      wmSailLines.addTransformedSegment(new THREE.Vector3(cx, 1.35, 0.05), new THREE.Vector3(cx, 4.4, 0.05), sparMat);
    }
  }

  // ------------------------------------------------------------------
  // 8. Riverside Watermill (z = 11.5)
  // ------------------------------------------------------------------
  const millZ = 11.5;
  const millX = riverCenterX(millZ) - 5.0;
  buildHalfTimberHouse(
    {
      x: millX,
      z: millZ,
      rotY: Math.PI / 2 - 0.14,
      width: 3.8,
      depth: 3.1,
      floors: 2,
      floorHeight: 1.75,
      roofHeight: 1.85,
      hasChimney: true,
      hasDormer: true,
    },
    solids,
    primary,
    secondary,
    fine,
    windowGlows
  );
  const millOrigin = composeMat(millX, getVillageHeight(millX, millZ), millZ, 0, Math.PI / 2 - 0.14, 0);
  const wheelHubWorld = new THREE.Vector3(0, 0.45, 2.1).applyMatrix4(millOrigin);
  const wheelSolids = new SolidBucket();
  const wheelLines = new LineBucket();
  addCylinderPiece(wheelSolids, wheelLines, 0.18, 0.18, 1.35, 8, composeMat(0, 0, 0, Math.PI / 2, 0, 0));
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2;
    addBoxPiece(wheelSolids, wheelLines, 3.2, 0.08, 0.08, composeMat(0, 0, 0.28, 0, 0, a));
    addBoxPiece(wheelSolids, wheelLines, 3.2, 0.08, 0.08, composeMat(0, 0, -0.28, 0, 0, a));
    addBoxPiece(wheelSolids, wheelLines, 0.1, 0.36, 0.72, composeMat(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0, 0, 0, a));
  }

  // ------------------------------------------------------------------
  // 9. Grand Tavern, Open Workshops & Town Market Plaza (-10.5, 2.0)
  // ------------------------------------------------------------------
  const tavernX = -15.2;
  const tavernZ = 8.4;
  const tavernRot = 0.34;
  buildHalfTimberHouse(
    {
      x: tavernX,
      z: tavernZ,
      rotY: tavernRot,
      width: 5.0,
      depth: 3.9,
      floors: 3,
      floorHeight: 1.75,
      roofHeight: 2.3,
      jetty: true,
      hasDormer: true,
      hasChimney: true,
      hasPorch: true,
      lWing: true,
    },
    solids,
    primary,
    secondary,
    fine,
    windowGlows
  );
  const tavOrigin = composeMat(tavernX, getVillageHeight(tavernX, tavernZ), tavernZ, 0, tavernRot, 0);
  addBoxPiece(solids, secondary, 0.08, 0.08, 0.9, new THREE.Matrix4().multiplyMatrices(tavOrigin, composeMat(1.85, 2.55, 2.4)));
  const tavernSignPivot = new THREE.Vector3(1.85, 2.5, 2.7).applyMatrix4(tavOrigin);
  const signSolids = new SolidBucket();
  const signLines = new LineBucket();
  addBoxPiece(signSolids, signLines, 0.06, 0.62, 0.78, composeMat(0, -0.36, 0));

  // Grand Plaza Fountain & 5 Market Stalls
  const plazaX = -10.5;
  const plazaZ = 2.0;
  const plazaY = getVillageHeight(plazaX, plazaZ);
  addCylinderPiece(solids, primary, 1.85, 1.95, 0.48, 8, composeMat(plazaX, plazaY + 0.18, plazaZ));
  addCylinderPiece(solids, secondary, 1.52, 1.52, 0.14, 8, composeMat(plazaX, plazaY + 0.4, plazaZ));
  addCylinderPiece(solids, primary, 0.44, 0.6, 1.35, 8, composeMat(plazaX, plazaY + 1.1, plazaZ));
  addCylinderPiece(solids, secondary, 0.92, 0.56, 0.28, 8, composeMat(plazaX, plazaY + 1.8, plazaZ));
  addCylinderPiece(solids, primary, 0.08, 0.28, 0.8, 8, composeMat(plazaX, plazaY + 2.3, plazaZ));
  for (let j = 0; j < 8; j++) {
    const ja = (j / 8) * Math.PI * 2;
    for (let s = 0; s < 5; s++) {
      const t0 = s / 5;
      const t1 = (s + 1) / 5;
      fine.addSegment(
        plazaX + Math.cos(ja) * (0.35 + t0 * 0.95),
        plazaY + 1.9 + Math.sin(t0 * Math.PI) * 0.55 - t0 * 1.4,
        plazaZ + Math.sin(ja) * (0.35 + t0 * 0.95),
        plazaX + Math.cos(ja) * (0.35 + t1 * 0.95),
        plazaY + 1.9 + Math.sin(t1 * Math.PI) * 0.55 - t1 * 1.4,
        plazaZ + Math.sin(ja) * (0.35 + t1 * 0.95)
      );
    }
  }
  for (const rad of [3.2, 5.6]) {
    for (let i = 0; i < 28; i++) {
      const a0 = (i / 28) * Math.PI * 2;
      const a1 = ((i + 1) / 28) * Math.PI * 2;
      fine.addSegment(plazaX + Math.cos(a0) * rad, plazaY + 0.04, plazaZ + Math.sin(a0) * rad, plazaX + Math.cos(a1) * rad, plazaY + 0.04, plazaZ + Math.sin(a1) * rad);
    }
  }

  // 5 Market Stalls around Plaza
  const stalls = [
    { x: -6.2, z: -2.2, rot: -0.7 },
    { x: -14.8, z: -2.6, rot: 0.55 },
    { x: -6.4, z: 6.2, rot: -2.1 },
    { x: -15.2, z: 2.2, rot: 1.5 },
    { x: -10.5, z: -4.2, rot: 0.1 },
  ];
  for (const st of stalls) {
    const sy = getVillageHeight(st.x, st.z);
    const sm = composeMat(st.x, sy, st.z, 0, st.rot, 0);
    const sLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
      new THREE.Matrix4().multiplyMatrices(sm, composeMat(lx, ly, lz, rx, ry, rz));
    addBoxPiece(solids, secondary, 2.1, 0.8, 0.9, sLoc(0, 0.36, 0));
    for (const sx of [-0.95, 0.95]) {
      for (const sz of [-0.38, 0.38]) {
        addBoxPiece(solids, secondary, 0.08, 1.95, 0.08, sLoc(sx, 0.96, sz));
      }
    }
    addBoxPiece(solids, primary, 2.35, 0.09, 1.45, sLoc(0, 1.98, 0.05, 0.22, 0, 0));
    addCylinderPiece(solids, secondary, 0.26, 0.25, 0.65, 8, sLoc(1.32, 0.32, 0.1));
    addBoxPiece(solids, secondary, 0.52, 0.48, 0.52, sLoc(-1.3, 0.24, 0.12));
  }

  // Open Blacksmith Forge Pavilion (-3.8, 6.8)
  const smithX = -3.8;
  const smithZ = 6.8;
  const smithY = getVillageHeight(smithX, smithZ);
  const smithRoot = composeMat(smithX, smithY, smithZ, 0, -0.35, 0);
  const smithLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(smithRoot, composeMat(lx, ly, lz, rx, ry, rz));
  addBoxPiece(solids, primary, 3.8, 0.48, 3.0, smithLoc(0, 0.05, 0));
  for (const sx of [-1.65, 1.65]) {
    for (const sz of [-1.25, 1.25]) {
      addBoxPiece(solids, secondary, 0.16, 2.35, 0.16, smithLoc(sx, 1.38, sz));
    }
  }
  const smithRoof = createGableRoofPrism(4.1, 1.2, 3.3);
  solids.add(smithRoof, smithLoc(0, 2.52, 0));
  primary.addEdgesFromGeometry(smithRoof, 20, smithLoc(0, 2.52, 0));
  smithRoof.dispose();
  addBoxPiece(solids, primary, 1.1, 1.0, 1.0, smithLoc(-1.0, 0.75, -0.58));
  addCylinderPiece(solids, primary, 0.28, 0.6, 2.3, 4, smithLoc(-1.0, 2.35, -0.58, 0, Math.PI / 4, 0));
  const forgeCoal = new THREE.BoxGeometry(0.58, 0.2, 0.5);
  windowGlows.add(forgeCoal, smithLoc(-1.0, 1.26, -0.46));
  forgeCoal.dispose();
  addCylinderPiece(solids, secondary, 0.3, 0.34, 0.58, 7, smithLoc(0.18, 0.54, 0.15));
  addBoxPiece(solids, primary, 0.68, 0.26, 0.3, smithLoc(0.18, 0.94, 0.15));
  addCylinderPiece(solids, secondary, 0.28, 0.26, 0.68, 8, smithLoc(1.05, 0.6, -0.45));

  // Open Tavern Pergola & Beer Garden (-11.2, 8.2)
  const bgX = -11.2;
  const bgZ = 8.2;
  const bgY = getVillageHeight(bgX, bgZ);
  const bgRoot = composeMat(bgX, bgY, bgZ, 0, 0.34, 0);
  const bgLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(bgRoot, composeMat(lx, ly, lz, rx, ry, rz));
  addBoxPiece(solids, secondary, 3.2, 0.24, 2.4, bgLoc(0, 0.04, 0));
  for (const px of [-1.42, 1.42]) {
    for (const pz of [-1.0, 1.0]) {
      addBoxPiece(solids, secondary, 0.12, 2.1, 0.12, bgLoc(px, 1.14, pz));
    }
  }
  for (let r = -3; r <= 3; r++) {
    addBoxPiece(solids, secondary, 0.08, 0.1, 2.55, bgLoc(r * 0.44, 2.22, 0));
  }
  for (const tx of [-0.7, 0.7]) {
    addCylinderPiece(solids, secondary, 0.44, 0.44, 0.07, 8, bgLoc(tx, 0.7, 0.15));
    addCylinderPiece(solids, secondary, 0.08, 0.12, 0.56, 6, bgLoc(tx, 0.4, 0.15));
    addCylinderPiece(solids, secondary, 0.18, 0.18, 0.34, 6, bgLoc(tx, 0.32, 0.76));
  }
  addCylinderPiece(solids, primary, 0.4, 0.4, 0.9, 8, bgLoc(-0.95, 0.58, -0.72, 0, 0, Math.PI / 2));

  // Open Stone Cloister Shrine Pavilion (-5.2, -16.5)
  const shX = -5.2;
  const shZ = -16.5;
  const shY = getVillageHeight(shX, shZ);
  const shRoot = composeMat(shX, shY, shZ, 0, 0.25, 0);
  const shLoc = (lx: number, ly: number, lz: number, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().multiplyMatrices(shRoot, composeMat(lx, ly, lz, rx, ry, rz));
  addBoxPiece(solids, primary, 2.6, 0.7, 2.6, shLoc(0, -0.05, 0));
  for (const sx of [-1.0, 1.0]) {
    for (const sz of [-1.0, 1.0]) {
      addCylinderPiece(solids, primary, 0.14, 0.17, 2.05, 8, shLoc(sx, 1.3, sz));
    }
  }
  addCylinderPiece(solids, primary, 0.05, 1.78, 1.55, 4, shLoc(0, 3.05, 0, 0, Math.PI / 4, 0));
  addBoxPiece(solids, secondary, 0.7, 0.58, 0.48, shLoc(0, 0.55, 0));

  // ------------------------------------------------------------------
  // 10. 20 Varied Townhouses, Guildhalls, Warehouses & Farmsteads
  // ------------------------------------------------------------------
  const houses: HouseSpec[] = [
    // West Old Town Quarter
    { x: -20.5, z: -12.0, rotY: 0.72, width: 4.0, depth: 3.1, floors: 2, floorHeight: 1.65, roofHeight: 1.85, jetty: true, hasChimney: true },
    { x: -21.2, z: 3.5, rotY: 1.15, width: 3.8, depth: 3.0, floors: 2, floorHeight: 1.6, roofHeight: 1.75, hasDormer: true, hasChimney: true },
    { x: -23.5, z: 10.5, rotY: 0.85, width: 4.2, depth: 3.2, floors: 2, floorHeight: 1.7, roofHeight: 1.9, lWing: true, hasChimney: true },
    { x: -18.5, z: -20.5, rotY: 0.3, width: 3.5, depth: 2.9, floors: 2, floorHeight: 1.55, roofHeight: 1.7, hasPorch: true, hasChimney: true },
    { x: -4.2, z: -10.5, rotY: -0.35, width: 4.0, depth: 3.1, floors: 3, floorHeight: 1.6, roofHeight: 1.9, jetty: true, hasChimney: true },
    { x: -4.8, z: -5.2, rotY: -0.9, width: 3.2, depth: 2.7, floors: 2, floorHeight: 1.55, roofHeight: 1.65, hasChimney: true },
    { x: -19.8, z: -26.5, rotY: 0.6, width: 3.8, depth: 3.0, floors: 2, floorHeight: 1.65, roofHeight: 1.8, hasDormer: true },
    { x: -9.5, z: -26.0, rotY: -0.15, width: 3.6, depth: 2.8, floors: 2, floorHeight: 1.6, roofHeight: 1.75, jetty: true, hasChimney: true },
    // South Suburb outside City Gate
    { x: -21.5, z: 22.5, rotY: 0.45, width: 4.3, depth: 3.2, floors: 1, floorHeight: 1.85, roofHeight: 1.95, lWing: true, hasChimney: true },
    { x: -13.5, z: 25.5, rotY: -0.25, width: 3.7, depth: 2.9, floors: 2, floorHeight: 1.6, roofHeight: 1.8, hasPorch: true, hasChimney: true },
    { x: -4.5, z: 21.5, rotY: -0.65, width: 3.6, depth: 2.9, floors: 1, floorHeight: 1.8, roofHeight: 1.7, hasDormer: true, hasChimney: true },
    // East Riverbank & Harbor District
    { x: 18.2, z: -14.5, rotY: -1.4, width: 4.4, depth: 3.4, floors: 2, floorHeight: 1.7, roofHeight: 1.9, hasDormer: true, hasChimney: true },
    { x: 19.5, z: -7.5, rotY: -1.55, width: 4.0, depth: 3.2, floors: 2, floorHeight: 1.65, roofHeight: 1.85, jetty: true, hasChimney: true },
    { x: 20.5, z: 0.8, rotY: -1.65, width: 3.8, depth: 3.0, floors: 2, floorHeight: 1.65, roofHeight: 1.8, hasPorch: true, lWing: true, hasChimney: true },
    { x: 22.0, z: 9.2, rotY: -1.9, width: 3.9, depth: 3.1, floors: 2, floorHeight: 1.6, roofHeight: 1.75, hasChimney: true },
    { x: 26.5, z: -2.8, rotY: -1.25, width: 3.5, depth: 2.8, floors: 1, floorHeight: 1.75, roofHeight: 1.65, hasDormer: true },
    { x: 27.5, z: -12.5, rotY: -1.05, width: 4.1, depth: 3.1, floors: 2, floorHeight: 1.65, roofHeight: 1.85, jetty: true, hasChimney: true },
    { x: 26.5, z: 22.0, rotY: -2.2, width: 4.2, depth: 3.2, floors: 1, floorHeight: 1.85, roofHeight: 1.9, lWing: true, hasChimney: true },
    { x: 18.5, z: 24.5, rotY: -2.5, width: 3.6, depth: 2.9, floors: 2, floorHeight: 1.6, roofHeight: 1.75, hasChimney: true },
    { x: 17.0, z: -27.5, rotY: -1.35, width: 3.7, depth: 3.0, floors: 1, floorHeight: 1.8, roofHeight: 1.75, hasPorch: true, hasChimney: true },
  ];
  for (const h of houses) {
    buildHalfTimberHouse(h, solids, primary, secondary, fine, windowGlows);
  }

  const chimneyTops: THREE.Vector3[] = [
    new THREE.Vector3(tavernX - 1.2, getVillageHeight(tavernX, tavernZ) + 8.4, tavernZ - 0.5),
    new THREE.Vector3(millX - 0.9, getVillageHeight(millX, millZ) + 6.3, millZ - 0.4),
    new THREE.Vector3(-20.5, getVillageHeight(-20.5, -12.0) + 6.2, -12.0),
    new THREE.Vector3(-4.2, getVillageHeight(-4.2, -10.5) + 7.8, -10.5),
    new THREE.Vector3(19.5, getVillageHeight(19.5, -7.5) + 6.4, -7.5),
    new THREE.Vector3(20.5, getVillageHeight(20.5, 0.8) + 6.3, 0.8),
    new THREE.Vector3(-21.5, getVillageHeight(-21.5, 22.5) + 4.8, 22.5),
    new THREE.Vector3(26.5, getVillageHeight(26.5, 22.0) + 4.8, 22.0),
  ];

  // ------------------------------------------------------------------
  // 11. Grand Harbor Wharf, Twin Cranes & Two River Vessels
  // ------------------------------------------------------------------
  const pierZ = -13.5;
  const pierX = riverCenterX(pierZ) + 4.2;
  addBoxPiece(solids, secondary, 3.8, 0.18, 5.2, composeMat(pierX - 0.8, -0.02, pierZ));
  for (const px of [pierX - 2.3, pierX - 0.8, pierX + 0.7]) {
    for (const pz of [pierZ - 2.2, pierZ, pierZ + 2.2]) {
      addCylinderPiece(solids, secondary, 0.1, 0.1, 1.8, 6, composeMat(px, -0.8, pz));
    }
  }
  // Twin Wooden Harbor Cranes & Cargo Crates
  for (const cz of [pierZ - 1.4, pierZ + 1.4]) {
    addBoxPiece(solids, primary, 0.24, 2.8, 0.24, composeMat(pierX - 1.2, 1.35, cz));
    addBoxPiece(solids, secondary, 1.9, 0.16, 0.16, composeMat(pierX - 1.95, 2.55, cz, 0, 0, -0.32));
    secondary.addSegment(pierX - 2.8, 2.82, cz, pierX - 2.8, 1.35, cz);
    addBoxPiece(solids, secondary, 0.56, 0.56, 0.56, composeMat(pierX - 2.8, 1.05, cz));
  }
  addBoxPiece(solids, secondary, 0.6, 0.55, 0.6, composeMat(pierX - 0.2, 0.35, pierZ - 0.6));
  addCylinderPiece(solids, secondary, 0.24, 0.23, 0.62, 8, composeMat(pierX - 0.1, 0.38, pierZ + 0.6));

  const boatOrigin = new THREE.Vector3(riverCenterX(pierZ - 1.0) - 0.2, waterY + 0.05, pierZ - 1.0);
  const boat2Origin = new THREE.Vector3(riverCenterX(24.0) + 0.4, waterY + 0.05, 24.0);
  const boatSolids = new SolidBucket();
  const boatLines = new LineBucket();
  addBoxPiece(boatSolids, boatLines, 1.15, 0.36, 3.0, composeMat(0, 0.14, 0));
  addCylinderPiece(boatSolids, boatLines, 0.05, 0.55, 0.72, 4, composeMat(0, 0.16, 1.82, Math.PI / 2, Math.PI / 4, 0));
  addBoxPiece(boatSolids, boatLines, 1.02, 0.08, 0.3, composeMat(0, 0.34, 0.2));
  addCylinderPiece(boatSolids, boatLines, 0.06, 0.08, 2.4, 6, composeMat(0, 1.35, -0.1));
  addBoxPiece(boatSolids, boatLines, 0.04, 1.35, 1.1, composeMat(0, 1.55, -0.1, 0, 0.28, 0));

  // ------------------------------------------------------------------
  // 12. 72 Stylized Trees, Streetlamps, Fences & Pasture Land
  // ------------------------------------------------------------------
  const treeSpots: Array<[number, number, "pine" | "oak", number]> = [
    [-46, -42, "pine", 1.7], [-42, -48, "pine", 1.5], [-36, -50, "pine", 1.6],
    [-48, -28, "pine", 1.6], [-46, -16, "pine", 1.5], [-42, -8, "oak", 1.4],
    [-48, 4, "pine", 1.55], [-44, 16, "oak", 1.45], [-40, 26, "pine", 1.5],
    [-46, 36, "pine", 1.6], [-34, 42, "oak", 1.4], [-24, 46, "pine", 1.5],
    [-12, 44, "oak", 1.35], [-4, 38, "pine", 1.4], [28, -44, "pine", 1.65],
    [36, -38, "pine", 1.55], [44, -30, "pine", 1.6], [38, -22, "oak", 1.45],
    [46, -14, "pine", 1.5], [42, -4, "oak", 1.4], [48, 8, "pine", 1.55],
    [44, 20, "pine", 1.6], [48, 30, "oak", 1.45], [38, 38, "pine", 1.5],
    [28, 44, "pine", 1.4], [18, 42, "oak", 1.35], [-10, -48, "pine", 1.6],
    [2, -44, "pine", 1.5], [-38, -32, "pine", 1.45], [-28, -22, "oak", 1.3],
    [-34, 18, "oak", 1.35], [-28, 32, "pine", 1.4], [22, -36, "pine", 1.5],
    [30, -24, "oak", 1.35], [34, -8, "pine", 1.4], [36, 4, "oak", 1.35],
    [28, 32, "pine", 1.45], [16, 34, "oak", 1.3], [-16, 36, "pine", 1.4],
    [-2, -34, "oak", 1.25], [22, -18, "pine", 1.3], [38, -48, "pine", 1.5],
    [-52, -36, "pine", 1.6], [-52, 22, "oak", 1.45], [52, -22, "pine", 1.55],
    [52, 18, "pine", 1.5], [-22, -52, "pine", 1.65], [14, -52, "pine", 1.5],
  ];

  for (const [tx, tz, kind, scale] of treeSpots) {
    const ty = getVillageHeight(tx, tz);
    if (kind === "pine") {
      addCylinderPiece(solids, secondary, 0.14 * scale, 0.24 * scale, 1.2 * scale, 6, composeMat(tx, ty + 0.45 * scale, tz));
      for (let tier = 0; tier < 3; tier++) {
        const r = (1.25 - tier * 0.28) * scale;
        const h = (1.45 - tier * 0.18) * scale;
        const py = ty + (1.4 + tier * 0.84) * scale;
        addCylinderPiece(solids, primary, 0.03, r, h, 7, composeMat(tx, py, tz, 0, tier * 0.45, 0));
      }
    } else {
      addCylinderPiece(solids, secondary, 0.17 * scale, 0.26 * scale, 1.35 * scale, 6, composeMat(tx, ty + 0.55 * scale, tz));
      const crownGeo = new THREE.IcosahedronGeometry(1.12 * scale, 0);
      const cm = composeMat(tx, ty + 1.98 * scale, tz, rng() * 0.4, rng() * 3, 0);
      solids.add(crownGeo, cm);
      primary.addEdgesFromGeometry(crownGeo, 20, cm);
      crownGeo.dispose();
    }
  }

  // Wrought-iron village streetlamps
  const lampSpots: Array<[number, number]> = [
    [-5.8, 1.2], [-15.0, 4.4], [-9.2, -5.2], [16.5, 1.2], [-12.0, 14.2], [16.5, -12.0],
  ];
  for (const [lx, lz] of lampSpots) {
    const ly = getVillageHeight(lx, lz);
    addCylinderPiece(solids, secondary, 0.05, 0.09, 2.35, 6, composeMat(lx, ly + 1.15, lz));
    const lg = new THREE.BoxGeometry(0.26, 0.34, 0.26);
    const lm = composeMat(lx, ly + 2.48, lz);
    windowGlows.add(lg, lm);
    primary.addEdgesFromGeometry(lg, 20, lm);
    lg.dispose();
  }

  // ------------------------------------------------------------------
  // 13. Grand Distant Alpine Mountain Ring
  // ------------------------------------------------------------------
  const mtnCount = 36;
  for (let i = 0; i < mtnCount; i++) {
    const a = (i / mtnCount) * Math.PI * 2 + (rng() - 0.5) * 0.07;
    const dist = 94 + (i % 3) * 12 + rng() * 8;
    const mx = Math.cos(a) * dist;
    const mz = Math.sin(a) * dist;
    const mh = 18 + rng() * 20;
    const mr = 16 + rng() * 10;
    const sides = 6 + (i % 2);
    const cone = new THREE.ConeGeometry(mr, mh, sides);
    const mm = composeMat(
      mx,
      mh / 2 - 7.5,
      mz,
      (rng() - 0.5) * 0.08,
      rng() * Math.PI,
      (rng() - 0.5) * 0.08,
      1.3 + rng() * 0.45,
      1,
      0.85 + rng() * 0.35
    );
    solids.add(cone, mm);
    fine.addEdgesFromGeometry(cone, 22, mm);
    cone.dispose();
  }

  // ------------------------------------------------------------------
  // 14. Animated Birds, Clouds, Smoke & Drafting Grid
  // ------------------------------------------------------------------
  const birdBucket = new LineBucket();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const r = 11 + (i % 3) * 4.5;
    const bx = Math.cos(angle) * r;
    const bz = Math.sin(angle) * r;
    const by = 22.0 + (i % 4) * 2.2;
    birdBucket.addSegment(bx - 0.72, by + 0.22, bz - 0.22, bx, by, bz);
    birdBucket.addSegment(bx, by, bz, bx + 0.72, by + 0.22, bz - 0.22);
  }

  const cloudSolids = new SolidBucket();
  const cloudLines = new LineBucket();
  const cloudClusters: Array<[number, number, number, number]> = [
    [-46, 38, -46, 1.4],
    [34, 42, -38, 1.5],
    [48, 39, -12, 1.3],
    [-42, 40, 22, 1.4],
    [4, 44, -56, 1.6],
  ];
  for (const [cx, cy, cz, cs] of cloudClusters) {
    for (let k = -1; k <= 1; k++) {
      const puff = new THREE.IcosahedronGeometry((2.1 - Math.abs(k) * 0.45) * cs, 0);
      const cm = composeMat(cx + k * 2.4 * cs, cy - Math.abs(k) * 0.3, cz + k * 0.5, 0, k * 0.6, 0, 1.45, 0.72, 1.0);
      cloudSolids.add(puff, cm);
      cloudLines.addEdgesFromGeometry(puff, 24, cm);
      puff.dispose();
    }
  }

  const smokeBucket = new LineBucket();
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2;
    const a1 = ((i + 1) / 10) * Math.PI * 2;
    smokeBucket.addSegment(Math.cos(a0), 0, Math.sin(a0), Math.cos(a1), 0, Math.sin(a1));
  }

  const gridBucket = new LineBucket();
  const gridRange = 96;
  const gridStep = 8.0;
  for (let v = -gridRange; v <= gridRange; v += gridStep) {
    gridBucket.addSegment(-gridRange, -3.45, v, gridRange, -3.45, v);
    gridBucket.addSegment(v, -3.45, -gridRange, v, -3.45, gridRange);
  }

  const staticOcclusionGeo = solids.toMergedGeometry();
  const windowGlowGeo = windowGlows.toMergedGeometry();
  const primaryLinesGeo = primary.toLineSegmentsGeometry();
  const secondaryLinesGeo = secondary.toLineSegmentsGeometry();
  const fineLinesGeo = fine.toLineSegmentsGeometry();

  const windmillSailsOcclusionGeo = wmSailSolids.toMergedGeometry();
  const windmillSailsLinesGeo = wmSailLines.toLineSegmentsGeometry();
  const waterwheelOcclusionGeo = wheelSolids.toMergedGeometry();
  const waterwheelLinesGeo = wheelLines.toLineSegmentsGeometry();
  const belfryBellOcclusionGeo = belfryBellSolids.toMergedGeometry();
  const belfryBellLinesGeo = belfryBellLines.toLineSegmentsGeometry();
  const tavernSignOcclusionGeo = signSolids.toMergedGeometry();
  const tavernSignLinesGeo = signLines.toLineSegmentsGeometry();
  const boatOcclusionGeo = boatSolids.toMergedGeometry();
  const boatLinesGeo = boatLines.toLineSegmentsGeometry();
  const birdLinesGeo = birdBucket.toLineSegmentsGeometry();
  const cloudOcclusionGeo = cloudSolids.toMergedGeometry();
  const cloudLinesGeo = cloudLines.toLineSegmentsGeometry();
  const smokeRingGeo = smokeBucket.toLineSegmentsGeometry();
  const riverRippleGeo = rippleBucket.toLineSegmentsGeometry();
  const gridLinesGeo = gridBucket.toLineSegmentsGeometry();

  const clockOrigin = new THREE.Vector3(ctX, ctBaseY + clockY, ctZ);

  return {
    terrainGeo,
    waterGeo,
    staticOcclusionGeo,
    windowGlowGeo,
    primaryLinesGeo,
    secondaryLinesGeo,
    fineLinesGeo,
    windmillHub: wmHubWorld,
    windmillRotY: wmRotY,
    windmillHub2: wmHubWorld2,
    windmillRotY2: wmRotY2,
    windmillSailsOcclusionGeo,
    windmillSailsLinesGeo,
    waterwheelHub: wheelHubWorld,
    waterwheelRotY: Math.PI / 2 - 0.14,
    waterwheelOcclusionGeo,
    waterwheelLinesGeo,
    clockOrigin,
    belfryPivot: new THREE.Vector3(ctX, ctBaseY + 10.9, ctZ),
    belfryBellOcclusionGeo,
    belfryBellLinesGeo,
    tavernSignPivot,
    tavernSignOcclusionGeo,
    tavernSignLinesGeo,
    boatOrigin,
    boatRotY: 0.12,
    boat2Origin,
    boat2RotY: -0.22,
    boatOcclusionGeo,
    boatLinesGeo,
    birdLinesGeo,
    cloudOcclusionGeo,
    cloudLinesGeo,
    smokeRingGeo,
    chimneyTops,
    riverRippleGeo,
    gridLinesGeo,
    dispose: () => {
      terrainGeo.dispose();
      waterGeo.dispose();
      staticOcclusionGeo.dispose();
      windowGlowGeo.dispose();
      primaryLinesGeo.dispose();
      secondaryLinesGeo.dispose();
      fineLinesGeo.dispose();
      windmillSailsOcclusionGeo.dispose();
      windmillSailsLinesGeo.dispose();
      waterwheelOcclusionGeo.dispose();
      waterwheelLinesGeo.dispose();
      belfryBellOcclusionGeo.dispose();
      belfryBellLinesGeo.dispose();
      tavernSignOcclusionGeo.dispose();
      tavernSignLinesGeo.dispose();
      boatOcclusionGeo.dispose();
      boatLinesGeo.dispose();
      birdLinesGeo.dispose();
      cloudOcclusionGeo.dispose();
      cloudLinesGeo.dispose();
      smokeRingGeo.dispose();
      riverRippleGeo.dispose();
      gridLinesGeo.dispose();
    },
  };
}
