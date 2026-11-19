import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
  addLanternPost,
  addPottedPlant,
} from "./villaPrimitives";

export interface StreamPlantationRefs {
  streamWater: THREE.Group;
  waterwheel: THREE.Group;
}

/**
 * West Deep Forest Meandering Stream, Rotating Waterwheel Mill & Grand Enchanted Plantation,
 * cleanly positioned outside the 48m x 27m Villa + Conservatory footprint.
 */
export function buildStreamAndPlantation(
  root: THREE.Group,
  p: VillaPalette
): StreamPlantationRefs {
  const grp = new THREE.Group();
  grp.name = "villa_stream_plantation";
  root.add(grp);

  const streamWater = new THREE.Group();
  grp.add(streamWater);

  const streamPts: Array<[number, number]> = [];
  const segCount = 38;
  for (let i = 0; i <= segCount; i++) {
    const t = i / segCount;
    const sz = -86 + t * 172;
    const sx =
      -44.5 -
      Math.sin(t * Math.PI * 1.65) * 7.4 -
      Math.cos(t * Math.PI * 2.4) * 2.4;
    streamPts.push([sx, sz]);
  }

  const [hx, hz] = streamPts[0];
  addBoxMesh(grp, 8.2, 4.8, 4.0, hx, 2.15, hz - 2.4, p.stoneWall);
  addBoxMesh(grp, 4.6, 2.8, 3.0, hx - 3.9, 1.15, hz - 1.6, p.stoneMoss);
  addBoxMesh(grp, 4.4, 3.0, 3.0, hx + 3.8, 1.25, hz - 1.6, p.stoneMoss);
  addBoxMesh(grp, 2.9, 4.2, 0.36, hx, 1.85, hz - 0.35, p.waterStream, 0, false, false);
  addCylMesh(grp, 1.9, 2.3, 0.16, 8, hx, -0.08, hz + 0.4, p.waterFoam, false, false);

  for (let i = 0; i < streamPts.length - 1; i++) {
    const [x1, z1] = streamPts[i];
    const [x2, z2] = streamPts[i + 1];
    const mx = (x1 + x2) * 0.5;
    const mz = (z1 + z2) * 0.5;
    const len = Math.hypot(x2 - x1, z2 - z1) + 0.65;
    const angle = Math.atan2(x2 - x1, z2 - z1);

    addBoxMesh(grp, 5.8, 0.06, len, mx, -0.22, mz, p.dirt, angle, false, true);
    const seg = addBoxMesh(
      streamWater,
      4.6,
      0.08,
      len,
      mx,
      -0.15,
      mz,
      p.waterStream,
      angle,
      false,
      false
    );
    seg.userData.phase = i * 0.5;

    const side = i % 2 === 0 ? 1 : -1;
    const nx = Math.cos(angle) * side * 3.15;
    const nz = -Math.sin(angle) * side * 3.15;
    const bankRock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.62 + (i % 3) * 0.24, 0),
      i % 2 === 0 ? p.stoneMoss : p.stoneWall
    );
    bankRock.position.set(mx + nx, -0.1, mz + nz);
    bankRock.scale.set(1.25, 0.58, 1.0);
    bankRock.castShadow = true;
    bankRock.receiveShadow = true;
    grp.add(bankRock);

    if (i % 3 === 0) {
      const rx = mx - nx * 0.9;
      const rz = mz - nz * 0.9;
      addCylMesh(grp, 0.05, 0.07, 1.5, 5, rx, 0.5, rz, p.foliageBright);
      addCylMesh(grp, 0.09, 0.09, 0.36, 5, rx, 1.15, rz, p.woodDark);
      addCylMesh(grp, 0.04, 0.06, 1.15, 5, rx + 0.25, 0.32, rz + 0.2, p.foliageMid);
    }
    if (i % 5 === 2) {
      addCylMesh(grp, 0.5, 0.46, 0.06, 7, mx, -0.09, mz, p.foliageBright, false, false);
      addConeMesh(grp, 0.22, 0.26, 5, mx, 0.06, mz, i % 2 === 0 ? p.glowPotionPink : p.glowArcane);
    }
  }

  // D&D Glowing Fairy Ring
  const [frx, frz] = streamPts[25];
  for (let m = 0; m < 10; m++) {
    const a = (m / 10) * Math.PI * 2;
    const mx = frx + 6.8 + Math.cos(a) * 2.8;
    const mz = frz + Math.sin(a) * 2.8;
    addCylMesh(grp, 0.09, 0.12, 0.44, 5, mx, -0.04, mz, p.fabricCream, false, false);
    addConeMesh(grp, 0.35, 0.28, 6, mx, 0.3, mz, m % 2 === 0 ? p.glowArcane : p.glowPotionPink);
  }

  // Rotating Waterwheel & Millhouse
  const millIdx = 13;
  const [millSx, millSz] = streamPts[millIdx];
  const millGroup = new THREE.Group();
  millGroup.position.set(millSx + 4.8, 0, millSz);
  grp.add(millGroup);

  addBoxMesh(millGroup, 5.6, 1.3, 6.0, 0, 0.4, 0, p.stoneWall);
  addBoxMesh(millGroup, 5.2, 4.0, 5.6, 0, 3.05, 0, p.plasterWarm);
  addConeMesh(millGroup, 4.6, 3.6, 4, 0, 6.85, 0, p.roofSlate, Math.PI * 0.25);
  addBoxMesh(millGroup, 1.3, 1.4, 0.14, 0, 3.1, 2.86, p.stainedAmber, 0, false, false);
  addBoxMesh(millGroup, 1.35, 2.4, 0.14, 2.66, 2.1, 0, p.woodDark);

  const waterwheel = new THREE.Group();
  waterwheel.position.set(-3.15, 1.75, 0);
  millGroup.add(waterwheel);
  const wheelRimA = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.14, 6, 16), p.woodDark);
  wheelRimA.rotation.y = Math.PI * 0.5;
  wheelRimA.position.x = -0.36;
  const wheelRimB = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.14, 6, 16), p.woodDark);
  wheelRimB.rotation.y = Math.PI * 0.5;
  wheelRimB.position.x = 0.36;
  waterwheel.add(wheelRimA, wheelRimB);
  const axle = addCylMesh(waterwheel, 0.22, 0.22, 1.5, 6, 0.2, 0, 0, p.iron);
  axle.rotation.z = Math.PI * 0.5;
  for (let sp = 0; sp < 8; sp++) {
    const a = (sp / 8) * Math.PI * 2;
    const spoke = addBoxMesh(waterwheel, 0.14, 4.6, 0.16, 0, 0, 0, p.woodOak);
    spoke.rotation.x = a;
    const paddle = addBoxMesh(
      waterwheel,
      0.9,
      0.14,
      0.5,
      0,
      Math.cos(a) * 2.35,
      Math.sin(a) * 2.35,
      p.woodCedar
    );
    paddle.rotation.x = a;
  }

  // Arched Footbridge & Stepping-Stone Ford
  const bridgeIdx = 20;
  const [bx, bz] = streamPts[bridgeIdx];
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(bx, 0, bz);
  bridgeGroup.rotation.y = 0.12;
  grp.add(bridgeGroup);

  for (let pIdx = -3; pIdx <= 3; pIdx++) {
    const px = pIdx * 1.0;
    const archY = 0.68 - pIdx * pIdx * 0.075;
    addBoxMesh(bridgeGroup, 0.94, 0.18, 4.0, px, archY, 0, p.woodOak);
  }
  for (const rz of [-1.86, 1.86]) {
    for (const px of [-3.0, 0, 3.0]) {
      const py = px === 0 ? 1.28 : 0.7;
      addBoxMesh(bridgeGroup, 0.24, 1.36, 0.24, px, py, rz, p.woodDark);
    }
    addBoxMesh(bridgeGroup, 6.4, 0.16, 0.18, 0, 1.6, rz, p.woodDark);
  }
  addBoxMesh(bridgeGroup, 0.36, 0.44, 0.36, -3.0, 1.62, -1.86, p.glowLantern, 0, false, false);
  addBoxMesh(bridgeGroup, 0.36, 0.44, 0.36, 3.0, 1.62, 1.86, p.glowLantern, 0, false, false);

  const [fx, fz] = streamPts[8];
  for (let s = -2; s <= 2; s++) {
    addCylMesh(grp, 0.6, 0.68, 0.24, 7, fx + s * 1.2, -0.1, fz + (s % 2) * 0.35, p.stoneLight);
  }

  // Grand Enchanted Plantation (centered at x = -74, z = 10)
  const farm = new THREE.Group();
  farm.position.set(-74.0, 0, 10.0);
  grp.add(farm);

  for (let x = -15; x <= 15; x += 3) {
    addBoxMesh(farm, 0.24, 1.3, 0.24, x, 0.4, -13, p.woodDark);
    addBoxMesh(farm, 0.24, 1.3, 0.24, x, 0.4, 13, p.woodDark);
  }
  addBoxMesh(farm, 30.2, 0.14, 0.14, 0, 0.82, -13, p.woodOak);
  addBoxMesh(farm, 30.2, 0.14, 0.14, 0, 0.38, -13, p.woodOak);
  addBoxMesh(farm, 30.2, 0.14, 0.14, 0, 0.82, 13, p.woodOak);
  addBoxMesh(farm, 30.2, 0.14, 0.14, 0, 0.38, 13, p.woodOak);

  for (let z = -13; z <= 13; z += 3.25) {
    addBoxMesh(farm, 0.24, 1.3, 0.24, -15, 0.4, z, p.woodDark);
    if (Math.abs(z) > 2.8) {
      addBoxMesh(farm, 0.24, 1.3, 0.24, 15, 0.4, z, p.woodDark);
    }
  }
  addBoxMesh(farm, 0.14, 0.14, 26.2, -15, 0.82, 0, p.woodOak);
  addBoxMesh(farm, 0.14, 0.14, 26.2, -15, 0.38, 0, p.woodOak);
  addBoxMesh(farm, 0.38, 3.6, 0.38, 15, 1.55, -2.8, p.woodDark);
  addBoxMesh(farm, 0.38, 3.6, 0.38, 15, 1.55, 2.8, p.woodDark);
  addBoxMesh(farm, 0.44, 0.38, 6.2, 15, 3.35, 0, p.woodDark);
  addCylMesh(farm, 0.2, 0.15, 0.38, 6, 15, 2.88, 0, p.glowLantern, false, false);

  addBoxMesh(farm, 8.8, 0.22, 6.2, 7.6, -0.14, 7.6, p.soilTilled, 0, false, true);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const px = 4.4 + c * 2.15;
      const pz = 6.0 + r * 3.0;
      const pump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.66, 0), p.pumpkinOrange);
      pump.position.set(px, 0.38, pz);
      pump.scale.set(1.18, 0.86, 1.18);
      pump.castShadow = true;
      farm.add(pump);
      addCylMesh(farm, 0.06, 0.1, 0.3, 5, px, 0.96, pz, p.foliageDeep);
    }
  }

  addBoxMesh(farm, 8.8, 0.22, 6.2, 7.6, -0.14, -7.2, p.soilTilled, 0, false, true);
  for (let r = 0; r < 2; r++) {
    const tz = -8.7 + r * 3.0;
    addBoxMesh(farm, 7.8, 0.1, 0.1, 7.6, 1.15, tz, p.woodOak);
    for (let c = 0; c < 5; c++) {
      const mx = 4.2 + c * 1.7;
      addConeMesh(farm, 0.4, 0.75, 5, mx, 0.32, tz, p.foliageMid);
      const melon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.34, 0),
        (r + c) % 2 === 0 ? p.glowArcane : p.crystalViolet
      );
      melon.position.set(mx, 0.72, tz);
      farm.add(melon);
    }
  }

  addBoxMesh(farm, 7.4, 0.22, 7.2, -2.0, -0.14, 7.2, p.soilTilled, 0, false, true);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      addCylMesh(farm, 0.28, 0.17, 1.4, 5, -4.8 + c * 1.4, 0.64, 4.5 + r * 1.35, p.wheatGold);
    }
  }

  addBoxMesh(farm, 6.2, 0.22, 6.4, -10.2, -0.14, 7.6, p.soilTilled, 0, false, true);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const lx = -12.4 + c * 1.45;
      const lz = 5.4 + r * 2.1;
      addConeMesh(farm, 0.34, 0.65, 5, lx, 0.28, lz, p.foliageBright);
      const bloom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.24, 0),
        (r + c) % 2 === 0 ? p.flowerViolet : p.flowerGold
      );
      bloom.position.set(lx, 0.75, lz);
      farm.add(bloom);
    }
  }

  addBoxMesh(farm, 4.8, 0.22, 3.6, 0.2, -0.14, -0.5, p.dirt, 0, false, true);
  for (const px of [-2.0, 2.4]) {
    addBoxMesh(farm, 0.2, 2.2, 0.2, px, 0.85, -2.1, p.woodDark);
    addBoxMesh(farm, 0.2, 1.7, 0.2, px, 0.6, 1.1, p.woodDark);
  }
  const leanRoof = addBoxMesh(farm, 5.0, 0.14, 3.8, 0.2, 1.85, -0.5, p.woodOak);
  leanRoof.rotation.x = 0.16;
  for (let m = 0; m < 6; m++) {
    const mx = -1.3 + (m % 3) * 1.45;
    const mz = -1.2 + Math.floor(m / 3) * 1.4;
    addCylMesh(farm, 0.1, 0.14, 0.48, 5, mx, 0.18, mz, p.fabricCream, false, false);
    addConeMesh(
      farm,
      0.42,
      0.34,
      6,
      mx,
      0.56,
      mz,
      m % 3 === 0 ? p.glowPotionGreen : m % 3 === 1 ? p.glowPotionPink : p.glowArcane
    );
  }

  for (const [ox, oz, cMat] of [
    [-11.2, 0.5, p.blossomPink],
    [-7.2, 0.5, p.foliageBright],
  ] as Array<[number, number, THREE.Material]>) {
    addCylMesh(farm, 0.24, 0.36, 2.4, 6, ox, 0.95, oz, p.woodDark);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), cMat);
    crown.position.set(ox, 3.0, oz);
    crown.castShadow = true;
    farm.add(crown);
  }

  addCylMesh(farm, 0.1, 0.12, 3.1, 6, 2.6, 1.3, 1.8, p.woodDark);
  const arms = addCylMesh(farm, 0.08, 0.08, 2.5, 5, 2.6, 2.05, 1.8, p.woodOak);
  arms.rotation.z = Math.PI * 0.5;
  addConeMesh(farm, 0.68, 1.38, 6, 2.6, 1.65, 1.8, p.fabricBlue);
  const scHead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 0), p.pumpkinOrange);
  scHead.position.set(2.6, 2.65, 1.8);
  farm.add(scHead);
  addConeMesh(farm, 0.72, 1.0, 6, 2.6, 3.4, 1.8, p.fabricPurple);

  addBoxMesh(farm, 6.8, 4.4, 5.4, -9.8, 1.95, -8.2, p.woodCedar);
  addConeMesh(farm, 5.1, 3.1, 4, -9.8, 5.65, -8.2, p.roofSlate, Math.PI * 0.25);
  addBoxMesh(farm, 2.1, 2.8, 0.16, -6.34, 1.15, -8.2, p.woodDark);
  addBoxMesh(farm, 1.2, 1.2, 0.16, -6.34, 3.25, -8.2, p.stainedAmber, 0, false, false);

  addCylMesh(farm, 1.2, 1.32, 1.15, 8, -2.4, 0.32, -8.4, p.stoneWall);
  addCylMesh(farm, 0.96, 0.96, 0.1, 8, -2.4, 0.72, -8.4, p.waterPool, false, false);
  addBoxMesh(farm, 0.18, 1.95, 0.18, -3.45, 1.62, -8.4, p.woodDark);
  addBoxMesh(farm, 0.18, 1.95, 0.18, -1.35, 1.62, -8.4, p.woodDark);
  addConeMesh(farm, 1.85, 1.25, 4, -2.4, 3.15, -8.4, p.roofMoss, Math.PI * 0.25);

  addBoxMesh(farm, 2.6, 0.85, 1.65, -5.0, 0.65, -3.8, p.woodOak, 0.3);
  const w1 = addCylMesh(farm, 0.52, 0.52, 0.14, 8, -5.0, 0.3, -2.85, p.woodDark);
  w1.rotation.x = Math.PI * 0.5;
  for (const bz of [-4.2, -2.6]) {
    addBoxMesh(farm, 0.82, 0.95, 0.82, -13.2, 0.25, bz, p.wheatGold);
    addConeMesh(farm, 0.68, 0.45, 4, -13.2, 0.95, bz, p.woodDark, Math.PI * 0.25);
  }
  addLanternPost(farm, 13.4, -0.25, -3.8, 2.6, p);
  addLanternPost(farm, -1.2, -0.25, 2.2, 2.6, p);
  addPottedPlant(farm, 13.6, -0.25, 3.6, p, p.flowerPink, 1.15);

  return { streamWater, waterwheel };
}
