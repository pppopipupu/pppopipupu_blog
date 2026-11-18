import * as THREE from "three";

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

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * Brook spline center X across the grand estate island.
 */
export function cottageBrookX(z: number): number {
  return 10.8 + Math.sin(z * 0.14) * 2.1;
}

/**
 * Grand estate ground heightfield (radius ~26.0):
 * Wide level building pad around (-2.6, -0.4), rolling woodland hills,
 * east campsite knoll, and carved winding brook channel.
 */
export function getCottageGroundHeight(x: number, z: number): number {
  let h = 0.14 * Math.sin(x * 0.24) * Math.cos(z * 0.22);

  // Wide level estate pad around (-2.6, -0.4)
  const dPad = Math.hypot((x - -2.6) * 0.78, (z - -0.4) * 0.88);
  const padWeight = 1 - smoothstep(7.4, 11.2, dPad);
  h = h * (1 - padWeight) + 0.0 * padWeight;

  // Rear-left woodland hill (-14.5, -14.5)
  const dHill = Math.hypot(x - -14.5, z - -14.5);
  h += 2.25 * Math.exp(-(dHill * dHill) / 52.0);

  // East meadow knoll (18.5, -5.5)
  const dEast = Math.hypot(x - 18.5, z - -5.5);
  h += 1.45 * Math.exp(-(dEast * dEast) / 46.0);

  // Carve winding brook channel on the east side
  const bx = cottageBrookX(z);
  const distBrook = Math.abs(x - bx);
  const carve = 1 - smoothstep(1.35, 3.05, distBrook);
  h = h * (1 - carve) + -1.08 * carve;

  // Taper down softly at island rim
  const r = Math.hypot(x * 0.92, z * 0.96);
  h -= smoothstep(22.2, 26.2, r) * 0.95;
  return h;
}

export interface CottageIslandGeometries {
  topGrassGeo: THREE.BufferGeometry;
  rockBaseGeo: THREE.BufferGeometry;
  brookGeo: THREE.BufferGeometry;
  backRoofGeo: THREE.BufferGeometry;
  frontRoofGeo: THREE.BufferGeometry;
  gableWallGeo: THREE.BufferGeometry;
  dispose: () => void;
}

/**
 * Builds the grand floating estate island (radius ~26.0), deep rocky cliff underside,
 * wide brook water ribbon, and 3-story manor roof/gable geometries (12.4 x 8.8 footprint).
 */
export function buildCottageIslandGeometries(): CottageIslandGeometries {
  const rng = mulberry32(90210);

  // 1. Grand top grass surface (34 rings x 52 sectors, maxR = 26.0)
  const rings = 34;
  const sectors = 52;
  const maxR = 26.0;
  const ringPts: THREE.Vector3[][] = [];

  for (let rIdx = 0; rIdx <= rings; rIdx++) {
    const frac = rIdx / rings;
    const row: THREE.Vector3[] = [];
    for (let s = 0; s < sectors; s++) {
      const a = (s / sectors) * Math.PI * 2;
      const wobble = 1 + 0.065 * Math.sin(a * 5 + 0.5) + 0.04 * Math.cos(a * 9);
      const rad = frac * maxR * (frac > 0.35 ? wobble : 1);
      const x = Math.cos(a) * rad * 1.06;
      const z = Math.sin(a) * rad;
      const y = getCottageGroundHeight(x, z);
      row.push(new THREE.Vector3(x, y, z));
    }
    ringPts.push(row);
  }

  const grassVerts: number[] = [];
  const grassCols: number[] = [];
  const colMeadow = new THREE.Color("#63a355");
  const colLush = new THREE.Color("#4d8b46");
  const colBrookBank = new THREE.Color("#7d7356");
  const colWarmMoss = new THREE.Color("#7cb458");
  const tmpCol = new THREE.Color();

  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    grassVerts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    const cx = (a.x + b.x + c.x) / 3;
    const cy = (a.y + b.y + c.y) / 3;
    const cz = (a.z + b.z + c.z) / 3;
    const distBrook = Math.abs(cx - cottageBrookX(cz));
    if (cy < -0.22 || distBrook < 1.95) {
      tmpCol.copy(colBrookBank).lerp(colLush, smoothstep(-0.8, -0.04, cy));
    } else {
      const n = 0.5 + 0.5 * Math.sin(cx * 0.4 + cz * 0.35);
      tmpCol.copy(colMeadow).lerp(n > 0.55 ? colWarmMoss : colLush, 0.45 + rng() * 0.22);
    }
    for (let k = 0; k < 3; k++) {
      grassCols.push(tmpCol.r, tmpCol.g, tmpCol.b);
    }
  };

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const sNext = (s + 1) % sectors;
      const p00 = ringPts[r][s];
      const p10 = ringPts[r + 1][s];
      const p11 = ringPts[r + 1][sNext];
      const p01 = ringPts[r][sNext];
      if (r === 0) {
        pushTri(p00, p11, p10);
      } else {
        pushTri(p00, p01, p11);
        pushTri(p00, p11, p10);
      }
    }
  }

  const topGrassGeo = new THREE.BufferGeometry();
  topGrassGeo.setAttribute("position", new THREE.Float32BufferAttribute(grassVerts, 3));
  topGrassGeo.setAttribute("color", new THREE.Float32BufferAttribute(grassCols, 3));
  topGrassGeo.computeVertexNormals();

  // 2. Deep faceted rocky cliff underside
  const cliffLayers = 5;
  const cliffRings: THREE.Vector3[][] = [ringPts[rings].map((p) => new THREE.Vector3(p.x, p.y - 0.02, p.z))];
  const depthSteps = [-2.0, -4.6, -7.6, -10.5, -12.8];
  const scaleSteps = [0.96, 0.78, 0.54, 0.30, 0.10];

  for (let l = 0; l < cliffLayers; l++) {
    const row: THREE.Vector3[] = [];
    for (let s = 0; s < sectors; s++) {
      const base = cliffRings[0][s];
      const jitter = 1 + (rng() - 0.5) * 0.16;
      row.push(
        new THREE.Vector3(
          base.x * scaleSteps[l] * jitter,
          depthSteps[l] + (rng() - 0.5) * 0.65,
          base.z * scaleSteps[l] * jitter
        )
      );
    }
    cliffRings.push(row);
  }

  const rockVerts: number[] = [];
  const rockCols: number[] = [];
  const colEarth = new THREE.Color("#6b5244");
  const colSlate = new THREE.Color("#575c68");
  const colDeepRock = new THREE.Color("#3b3f4a");

  const pushRockTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, layerIdx: number) => {
    rockVerts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    tmpCol
      .copy(layerIdx === 0 ? colEarth : colSlate)
      .lerp(colDeepRock, layerIdx / cliffLayers + (rng() - 0.5) * 0.12);
    for (let k = 0; k < 3; k++) {
      rockCols.push(tmpCol.r, tmpCol.g, tmpCol.b);
    }
  };

  for (let l = 0; l < cliffLayers; l++) {
    for (let s = 0; s < sectors; s++) {
      const sNext = (s + 1) % sectors;
      const a = cliffRings[l][s];
      const b = cliffRings[l][sNext];
      const c = cliffRings[l + 1][sNext];
      const d = cliffRings[l + 1][s];
      pushRockTri(a, c, b, l);
      pushRockTri(a, d, c, l);
    }
  }
  const bottomApex = new THREE.Vector3(0, -14.0, 0);
  for (let s = 0; s < sectors; s++) {
    const sNext = (s + 1) % sectors;
    pushRockTri(cliffRings[cliffLayers][s], bottomApex, cliffRings[cliffLayers][sNext], cliffLayers);
  }

  const rockBaseGeo = new THREE.BufferGeometry();
  rockBaseGeo.setAttribute("position", new THREE.Float32BufferAttribute(rockVerts, 3));
  rockBaseGeo.setAttribute("color", new THREE.Float32BufferAttribute(rockCols, 3));
  rockBaseGeo.computeVertexNormals();

  // 3. Wide Brook Water Ribbon sitting cleanly at y = -0.34
  const brookGeo = new THREE.PlaneGeometry(4.6, 46.0, 14, 80);
  brookGeo.rotateX(-Math.PI / 2);
  const bPos = brookGeo.getAttribute("position");
  for (let i = 0; i < bPos.count; i++) {
    const lx = bPos.getX(i);
    const z = bPos.getZ(i);
    bPos.setX(i, cottageBrookX(z) + lx);
    bPos.setY(i, -0.34);
  }
  brookGeo.computeVertexNormals();

  // 4. Grand 3-Story Manor Roof Slabs (footprint 12.4 x 8.8, attic eaves at y = 6.58, ridge rise = 3.85)
  const makeHalfRoofSlab = (isFront: boolean): THREE.BufferGeometry => {
    const w = 13.5;
    const halfD = 4.95;
    const rise = 3.85;
    const thick = 0.26;
    const zSign = isFront ? 1 : -1;

    const slopeLen = Math.hypot(halfD, rise);
    const angle = Math.atan2(rise, halfD) * (isFront ? 1 : -1);
    const slab = new THREE.BoxGeometry(w, thick, slopeLen);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, 0, 0));
    const midY = rise / 2 + thick * 0.35;
    const midZ = zSign * (halfD / 2);
    m.compose(new THREE.Vector3(0, midY, midZ), q, new THREE.Vector3(1, 1, 1));
    slab.applyMatrix4(m);
    const nonIdx = slab.toNonIndexed();
    slab.dispose();
    nonIdx.computeVertexNormals();
    return nonIdx;
  };

  const backRoofGeo = makeHalfRoofSlab(false);
  const frontRoofGeo = makeHalfRoofSlab(true);

  // 5. Watertight flat triangular gable wall (width = 12.44, height = 3.85, thickness = 0.26)
  // NOTE: Roof ridge spans along X (front/back slopes along Z), so side gable triangles sit on Left/Right walls!
  // Let's orient gableWallGeo along Z (spanning depth = 8.84, thickness = 0.26 along X) so it sits flush on Left/Right walls!
  const makeSideGableWallGeo = (depth: number, h: number, thick: number): THREE.BufferGeometry => {
    const hd = depth / 2;
    const ht = thick / 2;
    const p: Array<[number, number, number]> = [
      [-ht, 0, -hd],
      [-ht, 0, hd],
      [-ht, h, 0],
      [ht, 0, -hd],
      [ht, 0, hd],
      [ht, h, 0],
    ];
    const tris = [
      p[3], p[4], p[5], // +X face
      p[1], p[0], p[2], // -X face
      p[0], p[3], p[5], p[0], p[5], p[2], // -Z slope
      p[4], p[1], p[2], p[4], p[2], p[5], // +Z slope
      p[0], p[1], p[4], p[0], p[4], p[3], // bottom
    ];
    const verts = new Float32Array(tris.length * 3);
    for (let i = 0; i < tris.length; i++) {
      verts[i * 3] = tris[i][0];
      verts[i * 3 + 1] = tris[i][1];
      verts[i * 3 + 2] = tris[i][2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  };
  const gableWallGeo = makeSideGableWallGeo(8.84, 3.85, 0.26);

  return {
    topGrassGeo,
    rockBaseGeo,
    brookGeo,
    backRoofGeo,
    frontRoofGeo,
    gableWallGeo,
    dispose: () => {
      topGrassGeo.dispose();
      rockBaseGeo.dispose();
      brookGeo.dispose();
      backRoofGeo.dispose();
      frontRoofGeo.dispose();
      gableWallGeo.dispose();
    },
  };
}
