import * as THREE from "three";
import {
  TownBuildContext,
  WALL_CENTER_Z,
  WALL_RADIUS,
  composeMat,
  createGableRoofPrism,
  createHippedRoofPrism,
  getTownHeight,
} from "../townTerrain";

/* ---- Half-Timbered Multi-Story Merchant Townhouse (Rich Architectural Detail) ---- */
function addMerchantHouse(
  ctx: TownBuildContext,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  rotY: number,
  options?: { jetty?: boolean; hasSign?: boolean; hasChimney?: boolean }
) {
  const baseY = getTownHeight(x, z) - 1.2;
  const jetty = options?.jetty ?? true;
  const roofH = Math.min(w, d) * 0.72;
  const lowerH = h * 0.4;
  const upperH = h * 0.6;
  const upperW = jetty ? w * 1.12 : w;
  const upperD = jetty ? d * 1.12 : d;

  // Stone foundation plinth
  ctx.addBox(w + 0.45, 0.9, d + 0.45, composeMat(x, baseY + 0.45, z, 0, rotY, 0), ctx.solidWall, ctx.secondary);

  const mLower = composeMat(x, baseY + lowerH * 0.5, z, 0, rotY, 0);
  ctx.addBox(w, lowerH, d, mLower, ctx.solidWall, ctx.primary);

  // Ground-floor arched shopfront doorway & lintel awning
  const doorM = mLower.clone().multiply(composeMat(0, -lowerH * 0.14, d * 0.5 + 0.08));
  ctx.addBox(w * 0.3, lowerH * 0.62, 0.14, doorM, ctx.solidWall, ctx.secondary);
  ctx.addBox(w * 0.44, 0.22, 0.95, mLower.clone().multiply(composeMat(0, lowerH * 0.22, d * 0.5 + 0.42, 0.22, 0, 0)), ctx.solidRoof, ctx.secondary);

  // Corbeled timber knee-brackets supporting the jettied upper story
  if (jetty) {
    for (const bx of [-w * 0.36, 0, w * 0.36]) {
      ctx.secondary.addTransformedSegment(bx, lowerH * 0.3, d * 0.5, bx, lowerH * 0.5, upperD * 0.5, mLower);
    }
  }

  const mUpper = composeMat(x, baseY + lowerH + upperH * 0.5, z, 0, rotY, 0);
  ctx.addBox(upperW, upperH, upperD, mUpper, ctx.solidWall, ctx.primary);

  // Fachwerk timber framing, cross-bracing & dual mullioned glowing windows with shutters
  const hw = upperW * 0.5;
  const hd = upperD * 0.5 + 0.06;
  const hh = upperH * 0.5;
  for (const side of [-1, 1]) {
    const fz = side * hd;
    ctx.secondary.addTransformedSegment(-hw * 0.34, -hh, fz, -hw * 0.34, hh, fz, mUpper);
    ctx.secondary.addTransformedSegment(hw * 0.34, -hh, fz, hw * 0.34, hh, fz, mUpper);
    ctx.secondary.addTransformedSegment(-hw, 0, fz, hw, 0, fz, mUpper);
    ctx.fine.addTransformedSegment(-hw, -hh, fz, -hw * 0.34, 0, fz, mUpper);
    ctx.fine.addTransformedSegment(hw, -hh, fz, hw * 0.34, 0, fz, mUpper);
    ctx.fine.addTransformedSegment(-hw * 0.34, 0, fz, -hw, hh, fz, mUpper);
    ctx.fine.addTransformedSegment(hw * 0.34, 0, fz, hw, hh, fz, mUpper);

    for (const wx of [-hw * 0.42, hw * 0.42]) {
      const winM = mUpper.clone().multiply(composeMat(wx, hh * 0.34, side * (upperD * 0.5 + 0.04)));
      ctx.addBox(upperW * 0.18, upperH * 0.26, 0.06, winM, ctx.windowGlow, ctx.secondary);
      // Window cross mullions
      ctx.fine.addTransformedSegment(0, -upperH * 0.13, side * 0.05, 0, upperH * 0.13, side * 0.05, winM);
      ctx.fine.addTransformedSegment(-upperW * 0.09, 0, side * 0.05, upperW * 0.09, 0, side * 0.05, winM);
    }
  }

  const mRoof = composeMat(x, baseY + lowerH + upperH, z, 0, rotY, 0);
  ctx.addBlock(createGableRoofPrism(upperW + 1.0, roofH, upperD + 1.0), mRoof, ctx.solidRoof, ctx.primary, 22);

  // Roof dormer window protruding from front/side slope
  if (w > 8.6) {
    const dormM = mRoof.clone().multiply(composeMat(upperW * 0.28, roofH * 0.36, 0));
    ctx.addBox(1.8, 1.9, 2.2, dormM, ctx.solidWall, ctx.secondary);
    ctx.addBlock(
      createGableRoofPrism(2.1, 1.1, 2.5),
      dormM.clone().multiply(composeMat(0, 0.95, 0, 0, Math.PI * 0.5, 0)),
      ctx.solidRoof,
      ctx.secondary,
      22
    );
  }

  // Roof ridge finial & tile courses
  const rw = (upperW + 1.0) * 0.5;
  const rl = (upperD + 1.0) * 0.5;
  ctx.primary.addTransformedSegment(0, roofH, rl, 0, roofH + 1.15, rl, mRoof);
  for (const f of [0.28, 0.56, 0.8]) {
    const rx = rw * (1 - f);
    const ry = roofH * f + 0.05;
    ctx.fine.addTransformedSegment(-rx, ry, -rl, -rx, ry, rl, mRoof);
    ctx.fine.addTransformedSegment(rx, ry, -rl, rx, ry, rl, mRoof);
  }

  if (options?.hasChimney ?? true) {
    const chM = mRoof.clone().multiply(composeMat(upperW * 0.24, roofH * 0.72, -upperD * 0.2));
    ctx.addBox(1.05, 3.2, 1.05, chM, ctx.solidWall, ctx.secondary);
    ctx.addBox(1.32, 0.3, 1.32, chM.clone().multiply(composeMat(0, 1.65, 0)), ctx.solidWall, ctx.secondary);
    if (ctx.chimneyTops.length < 44) {
      ctx.chimneyTops.push(new THREE.Vector3(0, 1.95, 0).applyMatrix4(chM));
    }
  }

  if (options?.hasSign) {
    const signM = mLower.clone().multiply(composeMat(w * 0.36, lowerH * 0.32, d * 0.5 + 0.75));
    ctx.secondary.addTransformedSegment(0, 0.35, -0.75, 0, 0.35, 0.65, signM);
    ctx.addBox(0.1, 0.85, 1.05, signM, ctx.solidWall, ctx.secondary);
  }
}

/* ---- Grand Noble Quarter Chateau / Manor (Balconies, Dormers, Gate Pillars, Hedges) ---- */
function addNobleManor(
  ctx: TownBuildContext,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  rotY: number,
  hasTurrets = true,
  hasWings = false
) {
  const baseY = getTownHeight(x, z) - 1.3;
  const mMain = composeMat(x, baseY + h * 0.5, z, 0, rotY, 0);

  ctx.addBox(w + 1.4, 1.6, d + 1.4, composeMat(x, baseY + 0.8, z, 0, rotY, 0), ctx.solidWall, ctx.secondary);
  ctx.addBox(w, h, d, mMain, ctx.solidWall, ctx.primary);

  const hd = d * 0.5 + 0.06;
  ctx.secondary.addTransformedSegment(-w * 0.5, 0, hd, w * 0.5, 0, hd, mMain);
  for (let i = -2; i <= 2; i++) {
    const wx = i * (w * 0.19);
    for (const wy of [-h * 0.18, h * 0.26]) {
      ctx.addBox(
        1.25,
        2.4,
        0.08,
        mMain.clone().multiply(composeMat(wx, wy, d * 0.5 + 0.05)),
        ctx.windowGlow,
        ctx.secondary
      );
    }
  }

  // Columned classical entrance portico + balustraded upper balcony
  const porticoM = mMain.clone().multiply(composeMat(0, -h * 0.25, d * 0.5 + 1.7));
  ctx.addBox(w * 0.36, 0.65, 3.6, porticoM.clone().multiply(composeMat(0, h * 0.24, 0)), ctx.solidWall, ctx.primary);
  // Balcony railing on top of portico
  ctx.addBox(w * 0.36, 0.95, 0.18, porticoM.clone().multiply(composeMat(0, h * 0.24 + 0.8, 1.65)), ctx.solidWall, ctx.secondary);
  for (const cx of [-w * 0.14, 0, w * 0.14]) {
    if (cx !== 0) {
      ctx.addCyl(0.3, 0.34, h * 0.48, 6, porticoM.clone().multiply(composeMat(cx, 0, 1.35)), ctx.solidWall, ctx.secondary);
    }
  }

  const roofH = Math.min(w, d) * 0.64;
  const mRoof = composeMat(x, baseY + h, z, 0, rotY, 0);
  ctx.addBlock(createHippedRoofPrism(w + 1.4, roofH, d + 1.4, 0.58), mRoof, ctx.solidRoof, ctx.primary, 22);

  // Twin mansard dormer windows on front roof slope
  for (const dx of [-w * 0.24, w * 0.24]) {
    const dm = mRoof.clone().multiply(composeMat(dx, roofH * 0.34, d * 0.38));
    ctx.addBox(1.5, 1.9, 1.6, dm, ctx.solidWall, ctx.secondary);
    ctx.addCone(1.15, 1.1, 4, dm.clone().multiply(composeMat(0, 1.45, 0, 0, Math.PI * 0.25, 0)), ctx.solidRoof, ctx.secondary, 22);
  }

  if (hasWings) {
    for (const side of [-1, 1]) {
      const wLoc = new THREE.Vector3(side * (w * 0.42), 0, d * 0.56).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotY
      );
      const wingH = h * 0.74;
      ctx.addBox(w * 0.28, wingH, d * 0.66, composeMat(x + wLoc.x, baseY + wingH * 0.5, z + wLoc.z, 0, rotY, 0), ctx.solidWall, ctx.primary);
      ctx.addBlock(
        createHippedRoofPrism(w * 0.32, roofH * 0.62, d * 0.72, 0.5),
        composeMat(x + wLoc.x, baseY + wingH, z + wLoc.z, 0, rotY, 0),
        ctx.solidRoof,
        ctx.primary,
        22
      );
    }
  }

  if (hasTurrets) {
    const tLocal = new THREE.Vector3(w * 0.48, 0, -d * 0.42).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotY
    );
    ctx.addFortifiedTower(x + tLocal.x, z + tLocal.z, 2.4, h + 3.8, {
      baseY: baseY + 1.3,
      segments: 8,
      roofHeight: 8.2,
      hasConicalRoof: true,
      machicolation: false,
    });
  }

  // Walled courtyard garden with stone gate pillars & manicured hedge parterres
  const courtM = composeMat(x, baseY + 1.0, z, 0, rotY, 0);
  const cw = w * 0.56;
  const cd1 = d * 0.5 + 0.4;
  const cd2 = d * 0.5 + 9.2;
  ctx.secondary.addTransformedSegment(-cw, 0, cd1, -cw, 0, cd2, courtM);
  ctx.secondary.addTransformedSegment(cw, 0, cd1, cw, 0, cd2, courtM);
  ctx.secondary.addTransformedSegment(-cw, 0, cd2, -2.6, 0, cd2, courtM);
  ctx.secondary.addTransformedSegment(2.6, 0, cd2, cw, 0, cd2, courtM);
  // Ornate stone gate pillars
  ctx.addBox(0.95, 2.8, 0.95, courtM.clone().multiply(composeMat(-2.7, 1.0, cd2)), ctx.solidWall, ctx.primary);
  ctx.addBox(0.95, 2.8, 0.95, courtM.clone().multiply(composeMat(2.7, 1.0, cd2)), ctx.solidWall, ctx.primary);
  // Geometric courtyard hedges
  ctx.addBox(w * 0.22, 0.9, 3.2, courtM.clone().multiply(composeMat(-w * 0.28, 0.2, d * 0.5 + 5.2)), ctx.solidRoof, ctx.fine);
  ctx.addBox(w * 0.22, 0.9, 3.2, courtM.clone().multiply(composeMat(w * 0.28, 0.2, d * 0.5 + 5.2)), ctx.solidRoof, ctx.fine);
}

/* ---- Cramped Leaning Slum Shanty / Tenement with Lean-to Sheds ---- */
function addSlumShanty(
  ctx: TownBuildContext,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  rotY: number,
  leanX: number,
  leanZ: number
) {
  const baseY = getTownHeight(x, z) - 0.85;
  const m = composeMat(x, baseY + h * 0.5, z, leanX, rotY, leanZ);
  ctx.addBox(w, h, d, m, ctx.solidWall, ctx.secondary);

  const mRoof = composeMat(x, baseY + h, z, leanX, rotY, leanZ);
  ctx.addBlock(createGableRoofPrism(w + 0.55, h * 0.45, d + 0.55), mRoof, ctx.solidRoof, ctx.secondary, 24);

  // Patchwork plank lines & leaning side lean-to porch
  ctx.fine.addTransformedSegment(-w * 0.5, 0.08, d * 0.5 + 0.05, w * 0.5, -0.1, d * 0.5 + 0.05, m);
  if (ctx.rand() > 0.52) {
    ctx.addBox(w * 0.42, h * 0.52, d * 0.42, m.clone().multiply(composeMat(w * 0.62, -h * 0.22, 0, 0, 0, -0.08)), ctx.solidWall, ctx.fine);
  }
  if (ctx.rand() > 0.72 && ctx.chimneyTops.length < 44) {
    const chM = mRoof.clone().multiply(composeMat(w * 0.2, h * 0.38, 0, 0.08, 0, -0.09));
    ctx.addBox(0.65, 2.1, 0.65, chM, ctx.solidWall, ctx.fine);
    ctx.chimneyTops.push(new THREE.Vector3(0, 1.2, 0).applyMatrix4(chM));
  }
}

/**
 * Builds the Commercial District & Gothic City Cathedral (商业区),
 * Elevated Noble Quarter & Ducal Opera Palace (富人区),
 * and Dense Sprawling Slums (贫民窟).
 */
export function buildUrbanQuarters(ctx: TownBuildContext) {
  /* ======================================================================== */
  /* 1. COMMERCIAL DISTRICT, GUILDHALL & 82m GOTHIC CATHEDRAL (商业区 — West) */
  /* ======================================================================== */
  const ghX = -110;
  const ghZ = 28;
  const ghY = getTownHeight(ghX, ghZ) - 1.2;
  ctx.addBox(28.0, 14.5, 19.5, composeMat(ghX, ghY + 7.25, ghZ, 0, 0.06, 0), ctx.solidWall, ctx.primary);
  ctx.addBlock(createGableRoofPrism(30.0, 11.5, 21.0), composeMat(ghX, ghY + 14.5, ghZ, 0, 0.06, 0), ctx.solidRoof, ctx.primary, 22);
  ctx.addBox(7.8, 25.0, 7.8, composeMat(ghX, ghY + 27.0, ghZ, 0, 0.06, 0), ctx.solidWall, ctx.primary);
  ctx.addCone(6.0, 15.0, 4, composeMat(ghX, ghY + 46.5, ghZ, 0, 0.06 + Math.PI * 0.25, 0), ctx.solidRoof, ctx.primary, 22);
  ctx.primary.addSegment(ghX, ghY + 54.0, ghZ, ghX, ghY + 60.5, ghZ);
  ctx.bannerMounts.push({
    pos: new THREE.Vector3(ghX, ghY + 59.0, ghZ),
    rotY: 0.4,
    scale: 2.1,
    phase: 0.9,
  });

  // Two Covered Market Halls (Halles)
  for (const [mhX, mhZ, mhRot] of [
    [-82, 74, -0.05],
    [-142, 66, 0.14],
  ] as Array<[number, number, number]>) {
    const mhY = getTownHeight(mhX, mhZ) - 0.8;
    ctx.addBox(24.0, 6.4, 13.5, composeMat(mhX, mhY + 3.2, mhZ, 0, mhRot, 0), ctx.solidWall, ctx.primary);
    ctx.addBlock(createHippedRoofPrism(26.0, 7.6, 15.2, 0.62), composeMat(mhX, mhY + 6.4, mhZ, 0, mhRot, 0), ctx.solidRoof, ctx.primary, 22);
  }

  // 82m GRAND GOTHIC CITY CATHEDRAL on North-West Ridge (-124, -56)
  const catX = -124;
  const catZ = -56;
  const catY = getTownHeight(catX, catZ) - 1.8;
  const catRot = 0.22;
  const mCat = composeMat(catX, catY, catZ, 0, catRot, 0);
  ctx.addBox(22.0, 24.0, 52.0, mCat.clone().multiply(composeMat(0, 12.0, 0)), ctx.solidWall, ctx.primary);
  ctx.addBox(40.0, 22.0, 17.0, mCat.clone().multiply(composeMat(0, 11.0, -4.0)), ctx.solidWall, ctx.primary);
  ctx.addBlock(createGableRoofPrism(23.8, 12.6, 53.0), mCat.clone().multiply(composeMat(0, 24.0, 0)), ctx.solidRoof, ctx.primary, 22);
  ctx.addBlock(createGableRoofPrism(18.2, 11.2, 41.2), mCat.clone().multiply(composeMat(0, 22.0, -4.0, 0, Math.PI * 0.5, 0)), ctx.solidRoof, ctx.primary, 22);
  for (let bz = -20; bz <= 16; bz += 7.2) {
    for (const bx of [-13.6, 13.6]) {
      ctx.addBox(4.2, 17.5, 2.0, mCat.clone().multiply(composeMat(bx, 8.75, bz)), ctx.solidWall, ctx.secondary);
    }
  }
  for (const bx of [-9.2, 9.2]) {
    const tPosWorld = new THREE.Vector3(bx, 0, 24.5).applyMatrix4(mCat);
    ctx.addBox(8.2, 44.0, 8.2, composeMat(tPosWorld.x, catY + 22.0, tPosWorld.z, 0, catRot, 0), ctx.solidWall, ctx.primary);
    ctx.addCone(6.0, 20.0, 4, composeMat(tPosWorld.x, catY + 54.0, tPosWorld.z, 0, catRot + Math.PI * 0.25, 0), ctx.solidRoof, ctx.primary, 22);
  }
  const spWorld = new THREE.Vector3(0, 0, -4.0).applyMatrix4(mCat);
  ctx.addCyl(3.6, 4.5, 16.0, 8, composeMat(spWorld.x, catY + 40.0, spWorld.z), ctx.solidWall, ctx.primary, 26);
  ctx.addCone(4.5, 28.0, 8, composeMat(spWorld.x, catY + 62.0, spWorld.z), ctx.solidRoof, ctx.primary, 24);
  ctx.primary.addSegment(spWorld.x, catY + 76.0, spWorld.z, spWorld.x, catY + 83.0, spWorld.z);

  // 36 Bustling Market Square Stalls across 2 Market Zones
  for (let i = 0; i < 36; i++) {
    const group = i < 24 ? 0 : 1;
    const localIdx = group === 0 ? i : i - 24;
    const col = localIdx % 6;
    const row = Math.floor(localIdx / 6);
    const sx = (group === 0 ? -56 : -118) - col * 8.2 + (ctx.rand() - 0.5) * 1.6;
    const sz = (group === 0 ? 34 : 52) + row * 8.6 + (ctx.rand() - 0.5) * 1.6;
    const sRot = (ctx.rand() - 0.5) * 0.28;
    const sy = getTownHeight(sx, sz);
    const ms = composeMat(sx, sy, sz, 0, sRot, 0);
    ctx.addBox(4.4, 1.35, 2.2, ms.clone().multiply(composeMat(0, 0.68, 0)), ctx.solidWall, ctx.secondary);
    for (const px of [-2.0, 2.0]) {
      for (const pz of [-0.9, 0.9]) {
        ctx.secondary.addTransformedSegment(px, 0, pz, px, 3.4, pz, ms);
      }
    }
    ctx.addBox(4.9, 0.2, 2.8, ms.clone().multiply(composeMat(0, 3.55, 0, 0.22, 0, 0)), ctx.solidRoof, ctx.primary);
  }

  // Dense Structured Blocks of 85+ 3-4 Story Half-Timbered Commercial Townhouses
  const commercialZones: Array<{ x0: number; x1: number; z0: number; z1: number; stepX: number; stepZ: number }> = [
    { x0: -95, x1: -50, z0: -38, z1: 18, stepX: 14.5, stepZ: 15.0 },
    { x0: -182, x1: -136, z0: -6, z1: 92, stepX: 15.0, stepZ: 15.5 },
    { x0: -124, x1: -50, z0: 90, z1: 112, stepX: 14.5, stepZ: 14.5 },
    { x0: -176, x1: -88, z0: -116, z1: -82, stepX: 15.0, stepZ: 15.0 },
    { x0: -36, x1: -24, z0: -36, z1: 18, stepX: 13.0, stepZ: 15.0 },
    { x0: 24, x1: 38, z0: -36, z1: 18, stepX: 13.0, stepZ: 15.0 },
  ];
  for (const zone of commercialZones) {
    for (let hx = zone.x0; hx <= zone.x1; hx += zone.stepX) {
      for (let hz = zone.z0; hz <= zone.z1; hz += zone.stepZ) {
        const jx = hx + (ctx.rand() - 0.5) * 2.4;
        const jz = hz + (ctx.rand() - 0.5) * 2.4;
        if (Math.hypot(jx, jz - WALL_CENTER_Z) > WALL_RADIUS - 18) continue;
        if (Math.hypot(jx - ghX, jz - ghZ) < 22) continue;
        if (Math.hypot(jx - catX, jz - catZ) < 34) continue;
        if (Math.abs(jz - 42) < 9) continue;

        const w = 8.4 + ctx.rand() * 2.8;
        const d = 8.0 + ctx.rand() * 2.6;
        const h = 11.0 + ctx.rand() * 4.8;
        const rot = (ctx.rand() - 0.5) * 0.24 + (hx < -135 ? Math.PI * 0.5 : 0);
        addMerchantHouse(ctx, jx, jz, w, d, h, rot, {
          jetty: true,
          hasSign: ctx.rand() > 0.45,
          hasChimney: ctx.rand() > 0.35,
        });
      }
    }
  }

  /* ======================================================================== */
  /* 2. ELEVATED NOBLE / RICH QUARTER (富人区 — East & North-East Terrace)    */
  /* ======================================================================== */
  const opX = 116;
  const opZ = 22;
  const opY = getTownHeight(opX, opZ) - 1.4;
  ctx.addBox(28.0, 16.5, 21.0, composeMat(opX, opY + 8.25, opZ, 0, -0.15, 0), ctx.solidWall, ctx.primary);
  ctx.addBlock(createHippedRoofPrism(30.0, 10.2, 23.0, 0.56), composeMat(opX, opY + 16.5, opZ, 0, -0.15, 0), ctx.solidRoof, ctx.primary, 22);
  ctx.addCyl(6.8, 7.4, 6.4, 12, composeMat(opX, opY + 28.0, opZ), ctx.solidWall, ctx.primary, 26);
  ctx.addCone(7.2, 8.0, 12, composeMat(opX, opY + 35.0, opZ), ctx.solidRoof, ctx.primary, 26);

  const manorCoords: Array<[number, number, boolean, boolean]> = [
    [74, -4, true, true], [118, -16, true, true], [164, -12, true, false],
    [74, 54, true, false], [116, 62, true, true], [162, 54, true, false],
    [74, -46, true, false], [118, -56, true, true], [166, -48, true, false],
    [78, -86, true, false], [122, -94, true, false], [162, -84, false, false],
    [176, 20, true, false], [80, 90, false, false], [122, 96, true, false],
    [156, 86, false, false], [74, 24, true, false], [148, 22, true, false],
    [94, -32, false, false], [144, -34, true, false], [96, 36, false, false],
    [144, 38, false, false], [96, -72, true, false], [142, -72, false, false],
  ];
  for (const [mx, mz, tur, wings] of manorCoords) {
    if (Math.hypot(mx, mz - WALL_CENTER_Z) > WALL_RADIUS - 22) continue;
    if (Math.hypot(mx - opX, mz - opZ) < 26) continue;
    const mw = 14.0 + ctx.rand() * 4.5;
    const md = 10.5 + ctx.rand() * 3.5;
    const mh = 12.0 + ctx.rand() * 3.8;
    const mrot = -0.18 + (ctx.rand() - 0.5) * 0.3;
    addNobleManor(ctx, mx, mz, mw, md, mh, mrot, tur, wings);
  }

  const ncX = 146;
  const ncZ = -74;
  const ncY = getTownHeight(ncX, ncZ) - 1.2;
  ctx.addBox(11.0, 12.5, 21.0, composeMat(ncX, ncY + 6.25, ncZ, 0, -0.35, 0), ctx.solidWall, ctx.primary);
  ctx.addBlock(createGableRoofPrism(12.2, 7.2, 22.0), composeMat(ncX, ncY + 12.5, ncZ, 0, -0.35, 0), ctx.solidRoof, ctx.primary, 22);
  ctx.addCone(2.3, 14.5, 6, composeMat(ncX, ncY + 25.5, ncZ), ctx.solidRoof, ctx.primary, 22);

  for (let i = 0; i < 44; i++) {
    const tx = 60 + (i % 8) * 16.5 + (ctx.rand() - 0.5) * 3.5;
    const tz = -82 + Math.floor(i / 8) * 34 + (ctx.rand() - 0.5) * 4.5;
    if (Math.hypot(tx, tz - WALL_CENTER_Z) > WALL_RADIUS - 16) continue;
    ctx.addTree(tx, tz, 1.15, true);
  }

  /* ======================================================================== */
  /* 3. SPRAWLING DENSE SLUMS (贫民窟 — South-West & South-East Inner Walls)  */
  /* ======================================================================== */
  const slumTops: THREE.Vector3[] = [];
  const slumZones: Array<{ x0: number; x1: number; z0: number; z1: number; step: number }> = [
    { x0: -176, x1: -36, z0: 118, z1: 198, step: 11.2 },
    { x0: 36, x1: 174, z0: 118, z1: 198, step: 11.8 },
  ];

  for (const zone of slumZones) {
    for (let sx = zone.x0; sx <= zone.x1; sx += zone.step) {
      for (let sz = zone.z0; sz <= zone.z1; sz += zone.step) {
        const jx = sx + (ctx.rand() - 0.5) * 4.5;
        const jz = sz + (ctx.rand() - 0.5) * 4.5;
        if (Math.hypot(jx, jz - WALL_CENTER_Z) > WALL_RADIUS - 18) continue;
        if (Math.abs(jx + 104) < 5.5 || Math.abs(jx - 102) < 5.5) continue;

        const sw = 4.6 + ctx.rand() * 2.8;
        const sd = 4.2 + ctx.rand() * 2.6;
        const sh = 3.8 + ctx.rand() * 3.4;
        addSlumShanty(
          ctx,
          jx,
          jz,
          sw,
          sd,
          sh,
          (ctx.rand() - 0.5) * 0.8,
          (ctx.rand() - 0.5) * 0.11,
          (ctx.rand() - 0.5) * 0.11
        );
        slumTops.push(new THREE.Vector3(jx, getTownHeight(jx, jz) + sh + 0.5, jz));
      }
    }
  }

  for (let i = 0; i < slumTops.length - 1; i += 2) {
    const a = slumTops[i];
    const b = slumTops[i + 1];
    if (a.distanceTo(b) < 16.5) {
      ctx.fine.addSegment(a.x, a.y, a.z, b.x, b.y, b.z);
      for (const f of [0.25, 0.5, 0.75]) {
        const mx = a.x + (b.x - a.x) * f;
        const my = a.y + (b.y - a.y) * f - 0.28;
        const mz = a.z + (b.z - a.z) * f;
        ctx.fine.addSegment(mx, my, mz, mx, my - 0.95, mz);
      }
    }
  }
}
