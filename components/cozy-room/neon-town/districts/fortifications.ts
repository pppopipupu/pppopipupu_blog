import {
  TownBuildContext,
  WALL_CENTER_Z,
  WALL_RADIUS,
  composeMat,
  createGableRoofPrism,
  getTownHeight,
} from "../townTerrain";

/**
 * Builds the 28-sided Monumental Outer Curtain Walls, 28 Bastion Watchtowers,
 * Inner Terrace Retaining Walls, Grand Double-Ring Gatehouse, 7-Arch Stone Viaduct Bridge,
 * Outer Bridgehead Barbican, Barracks & Stables (城墙 + 大门区域).
 */
export function buildFortificationsAndGatehouse(ctx: TownBuildContext) {
  const WALL_SIDES = 28;
  const wallNodes: Array<{ x: number; z: number; angle: number }> = [];
  for (let i = 0; i < WALL_SIDES; i++) {
    const a = (i / WALL_SIDES) * Math.PI * 2 + Math.PI / WALL_SIDES;
    wallNodes.push({
      x: Math.cos(a) * WALL_RADIUS,
      z: WALL_CENTER_Z + Math.sin(a) * WALL_RADIUS,
      angle: a,
    });
  }

  function buildCurtainSpan(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    wallHeight = 20.0,
    thickness = 5.6
  ) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 2.0) return;
    const midX = (x1 + x2) * 0.5;
    const midZ = (z1 + z2) * 0.5;
    const rotY = -Math.atan2(dz, dx);
    const y1 = getTownHeight(x1, z1);
    const y2 = getTownHeight(x2, z2);
    const baseY = Math.min(y1, y2) - 3.0;
    const topY = Math.max(y1, y2) + wallHeight;
    const actualH = topY - baseY;

    const mWall = composeMat(midX, baseY + actualH * 0.5, midZ, 0, rotY, 0);
    ctx.addBox(len, actualH, thickness, mWall, ctx.solidWall, ctx.primary);

    // Crenellated outer & inner parapet merlons
    const parapetM = composeMat(midX, topY + 0.95, midZ, 0, rotY, 0);
    const merlonStep = 4.2;
    const count = Math.floor(len / merlonStep);
    for (let k = 0; k < count; k++) {
      const lx = -len * 0.5 + (k + 0.5) * merlonStep;
      ctx.addBox(
        2.0,
        1.9,
        1.05,
        parapetM.clone().multiply(composeMat(lx, 0, thickness * 0.5 - 0.52)),
        ctx.solidWall,
        ctx.secondary
      );
    }

    // Heavy stone buttresses along exterior face
    const buttressCount = Math.max(2, Math.floor(len / 14));
    for (let b = 1; b < buttressCount; b++) {
      const lx = -len * 0.5 + (b / buttressCount) * len;
      ctx.addBox(
        2.0,
        actualH * 0.86,
        1.8,
        mWall.clone().multiply(composeMat(lx, -actualH * 0.07, thickness * 0.5 + 0.8)),
        ctx.solidWall,
        ctx.secondary
      );
    }
    for (const frac of [-0.25, 0.05, 0.32]) {
      ctx.fine.addTransformedSegment(
        -len * 0.5,
        actualH * frac,
        thickness * 0.5 + 0.08,
        len * 0.5,
        actualH * frac,
        thickness * 0.5 + 0.08,
        mWall
      );
    }
  }

  for (let i = 0; i < WALL_SIDES; i++) {
    const a = wallNodes[i];
    const b = wallNodes[(i + 1) % WALL_SIDES];

    const isSouthGateSpan = a.z > 224 && b.z > 224;
    const isNorthCitadelSpan = a.z < -184 && b.z < -184;

    if (isSouthGateSpan) {
      const leftNode = a.x < b.x ? a : b;
      const rightNode = a.x < b.x ? b : a;
      buildCurtainSpan(leftNode.x, leftNode.z, -19.5, 232, 21.5, 6.0);
      buildCurtainSpan(19.5, 232, rightNode.x, rightNode.z, 21.5, 6.0);
    } else if (isNorthCitadelSpan) {
      const leftNode = a.x < b.x ? a : b;
      const rightNode = a.x < b.x ? b : a;
      buildCurtainSpan(leftNode.x, leftNode.z, -58, -162, 22.0, 6.0);
      buildCurtainSpan(58, -162, rightNode.x, rightNode.z, 22.0, 6.0);
    } else {
      buildCurtainSpan(a.x, a.z, b.x, b.z, 20.0, 5.6);
    }

    // Perimeter Bastion Watchtower at every vertex
    ctx.addFortifiedTower(a.x, a.z, 6.6, 28.0, {
      segments: i % 2 === 0 ? 10 : 8,
      roofHeight: 14.5,
      hasConicalRoof: true,
      hasBanner: i % 2 === 0,
      bannerScale: 1.15,
      machicolation: true,
    });
  }

  // Inner Stone Retaining Wall supporting the Elevated Noble Quarter Terrace (x ≈ 50)
  for (let rz = -88; rz <= 74; rz += 22) {
    if (rz > 24 && rz < 54) continue; // Opening for East Boulevard Grand Staircase
    const ry = getTownHeight(50, rz);
    ctx.addBox(3.4, 12.0, 21.0, composeMat(50, ry + 3.2, rz + 10), ctx.solidWall, ctx.secondary);
  }

  /* ---- GRAND DOUBLE-RING GATEHOUSE & 7-ARCH VIADUCT BRIDGE (大门区域) ---- */
  const gateZ = 232;
  const gateBaseY = getTownHeight(0, gateZ);

  // Twin Colossal Inner Gatehouse Drum Towers (44m+ total height)
  ctx.addFortifiedTower(-19.5, gateZ, 9.2, 36.0, {
    baseY: gateBaseY,
    segments: 12,
    roofHeight: 19.0,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.75,
    machicolation: true,
  });
  ctx.addFortifiedTower(19.5, gateZ, 9.2, 36.0, {
    baseY: gateBaseY,
    segments: 12,
    roofHeight: 19.0,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.75,
    machicolation: true,
  });

  // Central Monumental Gatehouse Portal & Fortified Gallery
  const portalH = 16.5;
  const upperH = 16.5;
  ctx.addBox(6.2, portalH + 3.0, 14.0, composeMat(-10.2, gateBaseY + portalH * 0.5 - 0.8, gateZ), ctx.solidWall, ctx.primary);
  ctx.addBox(6.2, portalH + 3.0, 14.0, composeMat(10.2, gateBaseY + portalH * 0.5 - 0.8, gateZ), ctx.solidWall, ctx.primary);
  ctx.addBox(29.5, upperH, 14.4, composeMat(0, gateBaseY + portalH + upperH * 0.5, gateZ), ctx.solidWall, ctx.primary);
  ctx.addBlock(
    createGableRoofPrism(31.0, 9.5, 15.0),
    composeMat(0, gateBaseY + portalH + upperH, gateZ, 0, Math.PI * 0.5, 0),
    ctx.solidRoof,
    ctx.primary,
    22
  );

  // Raised Iron Portcullis Lattice inside archway
  for (let px = -6.4; px <= 6.4; px += 1.28) {
    ctx.secondary.addSegment(px, gateBaseY + 7.5, gateZ + 6.2, px, gateBaseY + portalH, gateZ + 6.2);
  }
  for (let py = gateBaseY + 7.5; py <= gateBaseY + portalH; py += 1.45) {
    ctx.secondary.addSegment(-6.6, py, gateZ + 6.2, 6.6, py, gateZ + 6.2);
  }

  // Monumental 7-Arch Stone Viaduct Bridge spanning the 34m Southern River
  const bridgeZStart = gateZ + 7.2;
  const bridgeZEnd = 298;
  const bridgeLen = bridgeZEnd - bridgeZStart;
  const bridgeMidZ = (bridgeZStart + bridgeZEnd) * 0.5;
  const bridgeY = gateBaseY + 0.6;

  ctx.addBox(16.0, 1.6, bridgeLen, composeMat(0, bridgeY, bridgeMidZ), ctx.solidWall, ctx.primary);
  for (const bx of [-7.6, 7.6]) {
    ctx.addBox(1.1, 2.4, bridgeLen, composeMat(bx, bridgeY + 1.6, bridgeMidZ), ctx.solidWall, ctx.secondary);
  }
  // Cutwater stone piers down into the riverbed
  for (const pz of [247, 257, 268, 279, 289]) {
    ctx.addBox(17.4, 15.0, 3.6, composeMat(0, bridgeY - 7.5, pz), ctx.solidWall, ctx.primary);
    // Bridge lantern posts along parapet
    for (const bx of [-7.6, 7.6]) {
      ctx.addCyl(0.18, 0.28, 3.6, 6, composeMat(bx, bridgeY + 4.2, pz), ctx.solidWall, ctx.secondary);
      ctx.addBox(0.65, 0.85, 0.65, composeMat(bx, bridgeY + 6.3, pz), ctx.windowGlow, ctx.primary);
    }
  }
  // Massive Drawbridge Chains
  ctx.secondary.addSegment(-6.4, bridgeY + 1.2, bridgeZStart + 11, -6.0, gateBaseY + 18.5, gateZ + 7.2);
  ctx.secondary.addSegment(6.4, bridgeY + 1.2, bridgeZStart + 11, 6.0, gateBaseY + 18.5, gateZ + 7.2);

  // Outer Bridgehead Barbican Fortification across the river (z = 300)
  const barbZ = 300;
  const barbY = getTownHeight(0, barbZ);
  ctx.addFortifiedTower(-11.8, barbZ, 5.4, 19.5, {
    baseY: barbY,
    segments: 10,
    roofHeight: 10.2,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.2,
  });
  ctx.addFortifiedTower(11.8, barbZ, 5.4, 19.5, {
    baseY: barbY,
    segments: 10,
    roofHeight: 10.2,
    hasConicalRoof: true,
    hasBanner: true,
    bannerScale: 1.2,
  });
  ctx.addBox(17.5, 6.8, 6.8, composeMat(0, barbY + 12.6, barbZ), ctx.solidWall, ctx.primary);

  // Inner Gate Guard Barracks, Armory & Horse Stables
  for (const side of [-1, 1]) {
    const bx = side * 32;
    const bz = 204;
    const by = getTownHeight(bx, bz) - 0.8;
    ctx.addBox(16.0, 9.2, 11.0, composeMat(bx, by + 4.6, bz, 0, side * -0.06, 0), ctx.solidWall, ctx.primary);
    ctx.addBlock(
      createGableRoofPrism(17.0, 5.2, 11.8),
      composeMat(bx, by + 9.2, bz, 0, side * -0.06, 0),
      ctx.solidRoof,
      ctx.primary,
      22
    );
  }
}
