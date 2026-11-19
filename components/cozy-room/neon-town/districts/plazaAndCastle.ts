import * as THREE from "three";
import { TownLineBucket } from "../townShader";
import {
  TownBuildContext,
  composeMat,
  createGableRoofPrism,
  createHippedRoofPrism,
  getTownHeight,
} from "../townTerrain";

export interface PlazaFountainResult {
  fountainOrigin: THREE.Vector3;
  fountainJetsGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
  fountainRippleGeo: ReturnType<TownLineBucket["toLineSegmentsGeometry"]>;
}

/**
 * Builds the Imperial Central Fountain Plaza, Colonnaded Arcades, Radiating Avenues (中心喷泉)
 * and the Colossal Northern Acropolis Lord's Castle & 148m Great Keep (领主城堡).
 */
export function buildPlazaAndCastle(ctx: TownBuildContext): PlazaFountainResult {
  /* ======================================================================== */
  /* 1. IMPERIAL CENTRAL FOUNTAIN & COLONNADED GRAND PLAZA (中心喷泉)         */
  /* ======================================================================== */
  const plazaX = 0;
  const plazaZ = 56;
  const plazaY = getTownHeight(plazaX, plazaZ);
  const fountainOrigin = new THREE.Vector3(plazaX, plazaY, plazaZ);

  // Monumental radial cobblestone rings
  for (const rad of [18, 27, 36, 44]) {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      pts.push([plazaX + Math.cos(a) * rad, plazaY + 0.1, plazaZ + Math.sin(a) * rad]);
    }
    ctx.fine.addPolyline(pts, true);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.fine.addSegment(
      plazaX + Math.cos(a) * 15,
      plazaY + 0.1,
      plazaZ + Math.sin(a) * 15,
      plazaX + Math.cos(a) * 44,
      plazaY + 0.1,
      plazaZ + Math.sin(a) * 44
    );
  }

  // 4-Tier 26m-tall Sculpted Triumphal Fountain
  ctx.addCyl(14.5, 15.8, 1.1, 12, composeMat(plazaX, plazaY + 0.55, plazaZ), ctx.solidWall, ctx.primary, 22);
  ctx.addCyl(12.8, 13.6, 2.6, 12, composeMat(plazaX, plazaY + 2.35, plazaZ), ctx.solidWall, ctx.primary, 22);
  ctx.addCyl(12.0, 12.0, 0.2, 12, composeMat(plazaX, plazaY + 3.45, plazaZ), ctx.solidRoof, ctx.fine, 26);
  ctx.addCyl(3.4, 4.4, 6.2, 10, composeMat(plazaX, plazaY + 6.2, plazaZ), ctx.solidWall, ctx.primary, 24);
  ctx.addCyl(8.0, 4.5, 2.2, 10, composeMat(plazaX, plazaY + 9.8, plazaZ), ctx.solidWall, ctx.primary, 22);
  ctx.addCyl(2.2, 2.9, 5.2, 8, composeMat(plazaX, plazaY + 13.3, plazaZ), ctx.solidWall, ctx.primary, 24);
  ctx.addCyl(4.6, 2.3, 1.65, 8, composeMat(plazaX, plazaY + 16.4, plazaZ), ctx.solidWall, ctx.primary, 22);
  ctx.addCyl(1.15, 1.6, 3.8, 8, composeMat(plazaX, plazaY + 18.8, plazaZ), ctx.solidWall, ctx.primary, 24);
  ctx.addCone(1.35, 5.4, 8, composeMat(plazaX, plazaY + 23.2, plazaZ), ctx.solidWall, ctx.primary, 22);

  // Cascading animated water arcs (local to fountainOrigin)
  const jetsBucket = new TownLineBucket();
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const p1: Array<[number, number, number]> = [];
    for (let s = 0; s <= 7; s++) {
      const t = s / 7;
      const r = 1.8 + t * 4.4;
      const y = 17.2 + Math.sin(t * Math.PI) * 1.8 - t * 6.5;
      p1.push([ca * r, y, sa * r]);
    }
    jetsBucket.addPolyline(p1, false);

    const p2: Array<[number, number, number]> = [];
    for (let s = 0; s <= 8; s++) {
      const t = s / 8;
      const r = 6.8 + t * 4.4;
      const y = 10.6 + Math.sin(t * Math.PI) * 1.4 - t * 6.9;
      p2.push([ca * r, y, sa * r]);
    }
    jetsBucket.addPolyline(p2, false);
  }

  const rippleBucket = new TownLineBucket();
  for (const rr of [5.2, 8.2, 10.8]) {
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      pts.push([Math.cos(a) * rr, 3.7, Math.sin(a) * rr]);
    }
    rippleBucket.addPolyline(pts, true);
  }

  // 4 Corner Obelisks, 4 Classical Colonnaded Loggias & 12 Tall Plaza Lanterns
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const ox = plazaX + Math.cos(a) * 32;
    const oz = plazaZ + Math.sin(a) * 32;
    ctx.addBox(2.6, 2.0, 2.6, composeMat(ox, plazaY + 1.0, oz), ctx.solidWall, ctx.primary);
    ctx.addCyl(0.65, 1.15, 10.5, 4, composeMat(ox, plazaY + 7.2, oz, 0, Math.PI * 0.25, 0), ctx.solidWall, ctx.primary, 22);
    ctx.addCone(0.95, 2.1, 4, composeMat(ox, plazaY + 13.5, oz, 0, Math.PI * 0.25, 0), ctx.solidRoof, ctx.primary, 22);

    // Curved/angled classical loggia pavilion framing each plaza quadrant
    const lx = plazaX + Math.cos(a) * 43;
    const lz = plazaZ + Math.sin(a) * 43;
    const mLog = composeMat(lx, plazaY, lz, 0, -a + Math.PI * 0.5, 0);
    ctx.addBox(16.0, 1.0, 5.2, mLog.clone().multiply(composeMat(0, 6.8, 0)), ctx.solidWall, ctx.primary);
    ctx.addBlock(createHippedRoofPrism(16.8, 3.2, 5.8, 0.65), mLog.clone().multiply(composeMat(0, 7.3, 0)), ctx.solidRoof, ctx.primary, 22);
    for (let c = -6.5; c <= 6.5; c += 3.25) {
      ctx.addCyl(0.32, 0.38, 6.4, 6, mLog.clone().multiply(composeMat(c, 3.2, 1.8)), ctx.solidWall, ctx.secondary);
      ctx.addCyl(0.32, 0.38, 6.4, 6, mLog.clone().multiply(composeMat(c, 3.2, -1.8)), ctx.solidWall, ctx.secondary);
    }
  }

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const lx = plazaX + Math.cos(a) * 23.5;
    const lz = plazaZ + Math.sin(a) * 23.5;
    ctx.addCyl(0.24, 0.42, 5.6, 6, composeMat(lx, plazaY + 2.8, lz), ctx.solidWall, ctx.secondary);
    ctx.addBox(0.95, 1.2, 0.95, composeMat(lx, plazaY + 6.0, lz), ctx.windowGlow, ctx.primary);
    ctx.addCone(0.85, 1.0, 4, composeMat(lx, plazaY + 7.0, lz, 0, Math.PI * 0.25, 0), ctx.solidRoof, ctx.secondary);
  }

  // Grand Radiating Stone Avenues
  ctx.addRoadStrip([[0, 100], [0, 132], [0, 166], [0, 200], [0, 226]], 7.2);
  ctx.addRoadStrip([[0, 10], [0, -16], [0, -44]], 7.8);
  ctx.addRoadStrip([[-44, 56], [-74, 48], [-112, 40], [-156, 32]], 6.2);
  ctx.addRoadStrip([[44, 48], [78, 40], [122, 32], [168, 22]], 6.6);
  ctx.addRoadStrip([[0, 304], [8, 342], [24, 382], [58, 424], [102, 456]], 6.5);

  /* ======================================================================== */
  /* 2. COLOSSAL LORD'S CASTLE & ACROPOLIS CITADEL (领主城堡 — North)         */
  /* ======================================================================== */
  const cX = 0;
  const cZ = -154;
  const cY = 48.0; // Acropolis cliff elevation

  // Grand Multi-Arch Processional Viaduct & Stairway from (0, -44) to (0, -104)
  const stairSteps = 32;
  for (let s = 0; s < stairSteps; s++) {
    const t = s / (stairSteps - 1);
    const sz = -44 - t * 60;
    const sy = 8.4 + t * (cY - 8.4);
    ctx.addBox(16.5, sy - 1.0, 2.2, composeMat(0, (sy + 1.0) * 0.5, sz), ctx.solidWall, ctx.secondary);
  }
  ctx.primary.addSegment(-8.5, 10.5, -43, -8.5, cY + 2.8, -105);
  ctx.primary.addSegment(8.5, 10.5, -43, 8.5, cY + 2.8, -105);
  for (const vz of [-56, -72, -88]) {
    const vy = getTownHeight(0, vz);
    ctx.addBox(19.5, 18.0, 3.6, composeMat(0, vy + 8.0, vz), ctx.solidWall, ctx.primary);
  }

  // Massive Fortified Citadel Bailey Curtain Walls (116m x 92m)
  const bw = 58.0;
  const bd = 46.0;
  ctx.addBox(bw * 2, 18.5, 5.8, composeMat(cX, cY + 8.0, cZ - bd), ctx.solidWall, ctx.primary);
  ctx.addBox(5.8, 18.5, bd * 2, composeMat(cX - bw, cY + 8.0, cZ), ctx.solidWall, ctx.primary);
  ctx.addBox(5.8, 18.5, bd * 2, composeMat(cX + bw, cY + 8.0, cZ), ctx.solidWall, ctx.primary);
  ctx.addBox(42.0, 18.5, 5.8, composeMat(cX - 37.0, cY + 8.0, cZ + bd), ctx.solidWall, ctx.primary);
  ctx.addBox(42.0, 18.5, 5.8, composeMat(cX + 37.0, cY + 8.0, cZ + bd), ctx.solidWall, ctx.primary);

  // Citadel Barbican Twin Gate Towers
  ctx.addFortifiedTower(-12.5, cZ + bd + 1.2, 6.8, 28.0, {
    baseY: cY,
    segments: 12,
    roofHeight: 15.0,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.5,
  });
  ctx.addFortifiedTower(12.5, cZ + bd + 1.2, 6.8, 28.0, {
    baseY: cY,
    segments: 12,
    roofHeight: 15.0,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.5,
  });
  ctx.addBox(18.0, 10.5, 7.6, composeMat(0, cY + 17.5, cZ + bd + 0.6), ctx.solidWall, ctx.primary);

  // 10 Massive Citadel Perimeter Bastion Towers
  const citadelTowers: Array<[number, number]> = [
    [cX - bw, cZ - bd], [cX + bw, cZ - bd],
    [cX - bw, cZ + bd], [cX + bw, cZ + bd],
    [cX - bw, cZ - 14], [cX + bw, cZ - 14],
    [cX - bw, cZ + 16], [cX + bw, cZ + 16],
    [cX - 24, cZ - bd], [cX + 24, cZ - bd],
  ];
  for (const [tx, tz] of citadelTowers) {
    ctx.addFortifiedTower(tx, tz, 8.0, 34.0, {
      baseY: cY,
      segments: 12,
      roofHeight: 17.5,
      hasConicalRoof: true,
      hasBanner: true,
      bannerScale: 1.45,
    });
  }

  // COLOSSAL 3-TIER GREAT KEEP (DONJON) — Soaring to ~148m total altitude!
  const keepX = 0;
  const keepZ = -160;
  ctx.addBox(42.0, 32.0, 34.0, composeMat(keepX, cY + 16.0, keepZ), ctx.solidWall, ctx.primary);
  ctx.addBox(32.0, 28.0, 26.0, composeMat(keepX, cY + 44.0, keepZ), ctx.solidWall, ctx.primary);
  ctx.addBox(22.0, 19.0, 18.0, composeMat(keepX, cY + 66.0, keepZ), ctx.solidWall, ctx.primary);

  // Monumental Flying Buttresses & Gothic Windows
  for (const bx of [-16, -6, 6, 16]) {
    ctx.addBox(2.8, 30.0, 3.6, composeMat(keepX + bx, cY + 15.0, keepZ + 18.0), ctx.solidWall, ctx.secondary);
    ctx.addBox(2.8, 30.0, 3.6, composeMat(keepX + bx, cY + 15.0, keepZ - 18.0), ctx.solidWall, ctx.secondary);
  }
  for (const wx of [-9, 0, 9]) {
    ctx.addBox(2.4, 8.2, 0.18, composeMat(keepX + wx, cY + 45.0, keepZ + 13.1), ctx.windowGlow, ctx.secondary);
    ctx.addBox(2.4, 8.2, 0.18, composeMat(keepX + wx, cY + 45.0, keepZ - 13.1), ctx.windowGlow, ctx.secondary);
  }

  // Steep Royal Slate Roof & Soaring Central Lantern Spire
  ctx.addBlock(
    createHippedRoofPrism(24.0, 13.5, 20.0, 0.55),
    composeMat(keepX, cY + 75.5, keepZ),
    ctx.solidRoof,
    ctx.primary,
    22
  );
  ctx.addCyl(3.8, 4.4, 10.5, 8, composeMat(keepX, cY + 91.0, keepZ), ctx.solidWall, ctx.primary, 26);
  ctx.addCone(4.8, 19.5, 8, composeMat(keepX, cY + 106.0, keepZ), ctx.solidRoof, ctx.primary, 24);
  const keepTipY = cY + 115.7;
  ctx.primary.addSegment(keepX, keepTipY, keepZ, keepX, keepTipY + 11.5, keepZ);
  ctx.bannerMounts.push({
    pos: new THREE.Vector3(keepX, keepTipY + 9.8, keepZ),
    rotY: 0.22,
    scale: 3.4,
    phase: 0,
  });

  // 4 Towering Corner Bartizan Turrets on the Great Keep
  for (const sx of [-16.5, 16.5]) {
    for (const sz of [-13.5, 13.5]) {
      ctx.addFortifiedTower(keepX + sx, keepZ + sz, 4.2, 27.0, {
        baseY: cY + 34.0,
        segments: 8,
        roofHeight: 14.0,
        hasConicalRoof: true,
        machicolation: false,
      });
    }
  }

  // Royal Great Banquet Hall (East Bailey) & Royal Citadel Cathedral Chapel (West Bailey)
  ctx.addBox(16.0, 17.5, 38.0, composeMat(cX + 36.0, cY + 8.75, cZ - 3.0), ctx.solidWall, ctx.primary);
  ctx.addBlock(createGableRoofPrism(17.8, 9.8, 39.2), composeMat(cX + 36.0, cY + 17.5, cZ - 3.0), ctx.solidRoof, ctx.primary, 22);

  ctx.addBox(14.5, 16.5, 34.0, composeMat(cX - 36.0, cY + 8.25, cZ - 3.0), ctx.solidWall, ctx.primary);
  ctx.addBlock(createGableRoofPrism(16.2, 9.2, 35.0), composeMat(cX - 36.0, cY + 16.5, cZ - 3.0), ctx.solidRoof, ctx.primary, 22);
  ctx.addCone(3.2, 22.0, 6, composeMat(cX - 36.0, cY + 35.0, cZ - 3.0), ctx.solidRoof, ctx.primary, 22);

  return {
    fountainOrigin,
    fountainJetsGeo: jetsBucket.toLineSegmentsGeometry(),
    fountainRippleGeo: rippleBucket.toLineSegmentsGeometry(),
  };
}
