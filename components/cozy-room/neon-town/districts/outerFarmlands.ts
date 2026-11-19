import * as THREE from "three";
import { TownLineBucket, TownSolidBucket } from "../townShader";
import {
  TownBuildContext,
  WATER_LEVEL,
  composeMat,
  createGableRoofPrism,
  getTownHeight,
  riverCenterZ,
} from "../townTerrain";

export interface AnimatedSubGeos {
  windmillSailsOcclusionGeo: THREE.BufferGeometry;
  windmillSailsLinesGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
  bannerOcclusionGeo: THREE.BufferGeometry;
  bannerLinesGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
  smokeRingGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
  birdLinesGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
  cloudOcclusionGeo: THREE.BufferGeometry;
  cloudLinesGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
}

/**
 * Builds the Monumental 24-Pier Stone Aqueduct, 34 Furrowed Crop Fields,
 * Fenced Livestock Pastures, 9 Animated Windmills, 24 Farmsteads/Barns/Silos,
 * Secondary River Bridges, 240+ Countryside Trees, and Animated Sky/Windmill/Banner sub-geometries
 * (城市外部的农场与郊野).
 */
export function buildOuterFarmlandsAndSky(ctx: TownBuildContext): AnimatedSubGeos {
  /* ---- 1. Monumental 24-Pier Stone Aqueduct from Eastern Hills into City Wall ---- */
  const aqPiers = 23;
  const aqStartX = 210;
  const aqStartZ = -34;
  const aqEndX = 435;
  const aqEndZ = -92;
  const aqDeckY = 42.0;
  const aqAngle = -Math.atan2(aqEndZ - aqStartZ, aqEndX - aqStartX);
  const aqTotalLen = Math.hypot(aqEndX - aqStartX, aqEndZ - aqStartZ);

  ctx.addBox(
    aqTotalLen,
    3.8,
    4.6,
    composeMat((aqStartX + aqEndX) * 0.5, aqDeckY, (aqStartZ + aqEndZ) * 0.5, 0, aqAngle, 0),
    ctx.solidWall,
    ctx.primary
  );
  for (let p = 0; p <= aqPiers; p++) {
    const f = p / aqPiers;
    const px = aqStartX + (aqEndX - aqStartX) * f;
    const pz = aqStartZ + (aqEndZ - aqStartZ) * f;
    const groundY = getTownHeight(px, pz) - 1.8;
    const pierH = Math.max(3.0, aqDeckY - 1.8 - groundY);
    ctx.addBox(3.4, pierH, 5.2, composeMat(px, groundY + pierH * 0.5, pz, 0, aqAngle, 0), ctx.solidWall, ctx.primary);
  }

  /* ---- 2. Contoured Furrowed Crop Fields & Fenced Livestock Pastures ---- */
  function addCropField(
    cx: number,
    cz: number,
    w: number,
    d: number,
    rotY: number,
    isPasture = false
  ) {
    const ca = Math.cos(rotY);
    const sa = Math.sin(rotY);
    const toWorld = (lx: number, lz: number): [number, number, number] => {
      const wx = cx + lx * ca - lz * sa;
      const wz = cz + lx * sa + lz * ca;
      return [wx, getTownHeight(wx, wz) + 0.18, wz];
    };

    const corners: Array<[number, number]> = [
      [-w * 0.5, -d * 0.5],
      [w * 0.5, -d * 0.5],
      [w * 0.5, d * 0.5],
      [-w * 0.5, d * 0.5],
    ];
    for (let e = 0; e < 4; e++) {
      const [x1, z1] = corners[e];
      const [x2, z2] = corners[(e + 1) % 4];
      const steps = Math.max(5, Math.round(Math.hypot(x2 - x1, z2 - z1) / 8.5));
      const railTop: Array<[number, number, number]> = [];
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const [wx, wy, wz] = toWorld(x1 + (x2 - x1) * f, z1 + (z2 - z1) * f);
        ctx.secondary.addSegment(wx, wy - 0.1, wz, wx, wy + 1.4, wz);
        railTop.push([wx, wy + 1.2, wz]);
      }
      ctx.secondary.addPolyline(railTop, false);
    }

    if (!isPasture) {
      const hw = w * 0.45;
      const hd = d * 0.45;
      for (let lx = -hw; lx <= hw; lx += 4.2) {
        const fPts: Array<[number, number, number]> = [];
        for (let s = 0; s <= 7; s++) {
          const lz = -hd + (s / 7) * (hd * 2);
          fPts.push(toWorld(lx, lz));
        }
        ctx.fine.addPolyline(fPts, false);
      }
    }
  }

  // 30 Sweeping Furrowed Crop Fields + 8 Fenced Livestock Pastures
  const fields: Array<[number, number, number, number, number, boolean]> = [
    // West & North-West Farmlands
    [-290, 175, 76, 52, 0.16, false], [-365, 110, 74, 54, -0.12, false],
    [-305, 25, 70, 52, 0.22, false], [-375, 215, 72, 50, 0.08, false],
    [-310, -88, 72, 54, -0.22, false], [-370, -172, 74, 52, 0.12, false],
    [-235, 225, 66, 44, -0.18, false], [-285, 130, 68, 54, 0.06, true],
    [-315, 15, 64, 52, -0.08, true], [-290, -110, 62, 50, 0.14, true],
    // South-West & South Riverbank Plains
    [-230, 330, 78, 56, -0.12, true], [-155, 345, 72, 52, 0.08, true],
    [-325, 338, 74, 54, 0.16, false], [-78, 365, 76, 50, -0.06, false],
    [-190, 412, 82, 52, 0.1, false], [-92, 425, 78, 48, -0.14, false],
    // South-East & East Farmlands
    [135, 345, 76, 54, 0.14, true], [265, 295, 72, 54, -0.16, true],
    [215, 348, 80, 54, -0.1, false], [325, 326, 76, 52, 0.18, false],
    [98, 418, 82, 50, 0.12, false], [218, 415, 78, 50, -0.14, false],
    [305, 185, 78, 54, -0.18, false], [378, 124, 72, 54, 0.1, false],
    [295, 140, 68, 54, -0.2, true], [315, 25, 72, 54, 0.12, false],
    [382, 28, 68, 52, -0.16, false], [312, -108, 72, 54, -0.2, false],
    [374, -190, 72, 52, 0.15, false], [252, 232, 66, 46, 0.2, false],
  ];
  for (const [fx, fz, fw, fd, frot, isPasture] of fields) {
    addCropField(fx, fz, fw, fd, frot, isPasture);
  }

  /* ---- 3. 9 Animated Outer Farmland Windmills on Hills ---- */
  const windmillSites: Array<[number, number, number, number]> = [
    [-285, 92, 0.62, 0.5],
    [290, 68, -0.78, 0.44],
    [-265, -145, 0.35, 0.48],
    [275, -168, -0.55, 0.42],
    [-156, 340, 0.28, 0.54],
    [168, 348, -0.32, 0.46],
    [-320, 245, 0.48, 0.45],
    [335, 230, -0.42, 0.52],
    [-365, -24, 0.72, 0.4],
  ];
  for (const [wx, wz, wRot, wSpeed] of windmillSites) {
    const wy = getTownHeight(wx, wz) - 1.2;
    ctx.addCyl(3.8, 5.6, 17.5, 8, composeMat(wx, wy + 8.75, wz, 0, wRot, 0), ctx.solidWall, ctx.primary, 26);
    ctx.addCone(4.5, 6.4, 8, composeMat(wx, wy + 20.6, wz, 0, wRot, 0), ctx.solidRoof, ctx.primary, 26);
    ctx.addCyl(5.1, 5.1, 0.4, 8, composeMat(wx, wy + 8.0, wz, 0, wRot, 0), ctx.solidWall, ctx.secondary, 26);
    const hubOffset = new THREE.Vector3(0, 16.4, 4.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), wRot);
    ctx.windmillMounts.push({
      hub: new THREE.Vector3(wx + hubOffset.x, wy + hubOffset.y, wz + hubOffset.z),
      rotY: wRot,
      speed: wSpeed,
    });
  }

  /* ---- 4. 24 Rustic Outer Farmsteads, Barns, Silos & Haystack Clusters ---- */
  const barns: Array<[number, number, number]> = [
    [-248, 144, 0.25], [-330, 76, -0.18], [-256, -44, 0.14],
    [-184, 316, -0.15], [-76, 372, 0.1], [68, 324, 0.22],
    [152, 316, -0.18], [260, 308, 0.12], [268, 148, -0.32],
    [336, 84, 0.18], [264, -32, -0.22], [260, -128, 0.28],
    [-224, -184, -0.25], [32, 396, 0.08], [-350, 185, 0.2],
    [-295, 365, -0.22], [315, 368, 0.16], [365, 195, -0.14],
    [-345, -135, 0.3], [345, -145, -0.28], [-125, 420, 0.05],
    [145, 422, -0.1], [-245, 58, 0.24], [250, 52, -0.24],
  ];
  for (const [bx, bz, brot] of barns) {
    const by = getTownHeight(bx, bz) - 0.9;
    ctx.addBox(13.5, 7.6, 9.0, composeMat(bx, by + 3.8, bz, 0, brot, 0), ctx.solidWall, ctx.primary);
    ctx.addBlock(createGableRoofPrism(14.8, 6.2, 10.2), composeMat(bx, by + 7.6, bz, 0, brot, 0), ctx.solidRoof, ctx.primary, 22);
    const sOff = new THREE.Vector3(9.6, 0, -1.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), brot);
    ctx.addCyl(2.6, 2.8, 12.2, 8, composeMat(bx + sOff.x, by + 6.1, bz + sOff.z), ctx.solidWall, ctx.secondary, 28);
    ctx.addCone(3.0, 3.4, 8, composeMat(bx + sOff.x, by + 13.8, bz + sOff.z), ctx.solidRoof, ctx.secondary, 26);

    for (let h = 0; h < 3; h++) {
      const hx = bx - 9.8 - h * 3.8 + (ctx.rand() - 0.5) * 1.6;
      const hz = bz + 6.2 + (ctx.rand() - 0.5) * 4.0;
      const hy = getTownHeight(hx, hz);
      ctx.addCyl(1.75, 1.95, 2.2, 7, composeMat(hx, hy + 1.1, hz), ctx.solidRoof, ctx.secondary, 28);
      ctx.addCone(1.95, 1.6, 7, composeMat(hx, hy + 3.0, hz), ctx.solidRoof, ctx.fine, 26);
    }
  }

  /* ---- 5. Secondary Stone Arched Bridges across the Outer River ---- */
  for (const [brX, brRot] of [
    [-175, 0.16],
    [188, -0.18],
  ] as Array<[number, number]>) {
    const brZ = riverCenterZ(brX);
    const brY = WATER_LEVEL + 6.8;
    ctx.addBox(10.5, 1.4, 44.0, composeMat(brX, brY, brZ, 0, brRot, 0), ctx.solidWall, ctx.primary);
    ctx.addBox(0.9, 2.0, 44.0, composeMat(brX - 4.7, brY + 1.5, brZ, 0, brRot, 0), ctx.solidWall, ctx.secondary);
    ctx.addBox(0.9, 2.0, 44.0, composeMat(brX + 4.7, brY + 1.5, brZ, 0, brRot, 0), ctx.solidWall, ctx.secondary);
  }

  /* ---- 6. 240+ Countryside Forest Groves & Hedgerow Trees ---- */
  for (let t = 0; t < 245; t++) {
    const a = ctx.rand() * Math.PI * 2;
    const rad = 232 + ctx.rand() * 210;
    const tx = Math.cos(a) * rad;
    const tz = 20 + Math.sin(a) * rad;
    if (Math.abs(tx) < 30 && tz > 215) continue;
    ctx.addTree(tx, tz, 1.15 + ctx.rand() * 1.15, ctx.rand() > 0.74);
  }

  /* ---- 7. Animated Sub-Geometries (Windmill Sails, Banners, Smoke, Birds, Clouds) ---- */
  const sailSolid = new TownSolidBucket();
  const sailLines = new TownLineBucket();
  {
    const hubGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.25, 8);
    hubGeo.rotateX(Math.PI * 0.5);
    sailSolid.add(hubGeo);
    sailLines.addEdges(hubGeo, 24);
    hubGeo.dispose();

    for (let b = 0; b < 4; b++) {
      const a = (b / 4) * Math.PI * 2;
      const mBlade = composeMat(0, 0, 0, 0, 0, a);
      const spar = new THREE.BoxGeometry(0.42, 12.2, 0.3);
      sailSolid.add(spar, mBlade.clone().multiply(composeMat(0, 6.1, 0)));
      sailLines.addEdges(spar, 22, mBlade.clone().multiply(composeMat(0, 6.1, 0)));
      spar.dispose();

      const cloth = new THREE.BoxGeometry(2.2, 9.2, 0.12);
      const mCloth = mBlade.clone().multiply(composeMat(1.2, 7.1, 0.12));
      sailSolid.add(cloth, mCloth);
      sailLines.addEdges(cloth, 22, mCloth);
      cloth.dispose();
      for (let r = -4.0; r <= 4.0; r += 1.45) {
        sailLines.addTransformedSegment(-1.05, r, 0.08, 1.05, r, 0.08, mCloth);
      }
    }
  }

  const bannerSolid = new TownSolidBucket();
  const bannerLines = new TownLineBucket();
  {
    const verts = new Float32Array([
      0, 0.55, 0, 0, -0.55, 0, 3.4, 0.0, 0,
      0, -0.55, 0, 0, 0.55, 0, 3.4, 0.0, 0,
    ]);
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    bg.computeVertexNormals();
    bannerSolid.add(bg);
    bannerLines.addSegment(0, 0.55, 0, 3.4, 0, 0);
    bannerLines.addSegment(0, -0.55, 0, 3.4, 0, 0);
    bannerLines.addSegment(0, 0.55, 0, 0, -0.55, 0);
    bannerLines.addSegment(1.05, 0.36, 0, 1.05, -0.36, 0);
    bg.dispose();
  }

  const smokeRingBucket = new TownLineBucket();
  {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push([Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25]);
    }
    smokeRingBucket.addPolyline(pts, true);
  }

  const birdBucket = new TownLineBucket();
  for (let b = 0; b < 24; b++) {
    const a = (b / 24) * Math.PI * 2;
    const r = 68 + (b % 4) * 32;
    const bx = Math.cos(a) * r;
    const by = 148 + (b % 5) * 8.5;
    const bz = Math.sin(a) * r;
    const dir = a + Math.PI * 0.5;
    const wx = Math.cos(dir) * 2.1;
    const wz = Math.sin(dir) * 2.1;
    birdBucket.addSegment(bx - wx, by + 0.55, bz - wz, bx, by, bz);
    birdBucket.addSegment(bx, by, bz, bx + wx, by + 0.55, bz + wz);
  }

  const cloudSolid = new TownSolidBucket();
  const cloudLines = new TownLineBucket();
  const cloudSpecs: Array<[number, number, number, number]> = [
    [-220, 215, -240, 3.8],
    [195, 232, -265, 4.2],
    [-295, 198, 95, 3.4],
    [285, 206, 145, 3.6],
    [24, 248, -335, 4.6],
    [-85, 224, 275, 3.2],
  ];
  for (const [cx, cy, cz, cs] of cloudSpecs) {
    for (let puff = -1; puff <= 1; puff++) {
      const g = new THREE.BoxGeometry((8.2 - Math.abs(puff) * 2.0) * cs, (2.8 - Math.abs(puff) * 0.5) * cs, 4.0 * cs);
      const m = composeMat(cx + puff * 5.2 * cs, cy - Math.abs(puff) * 0.8 * cs, cz);
      cloudSolid.add(g, m);
      cloudLines.addEdges(g, 22, m);
      g.dispose();
    }
  }

  return {
    windmillSailsOcclusionGeo: sailSolid.toMergedGeometry(),
    windmillSailsLinesGeo: sailLines.toLineSegmentsGeometry(),
    bannerOcclusionGeo: bannerSolid.toMergedGeometry(),
    bannerLinesGeo: bannerLines.toLineSegmentsGeometry(),
    smokeRingGeo: smokeRingBucket.toLineSegmentsGeometry(),
    birdLinesGeo: birdBucket.toLineSegmentsGeometry(),
    cloudOcclusionGeo: cloudSolid.toMergedGeometry(),
    cloudLinesGeo: cloudLines.toLineSegmentsGeometry(),
  };
}
