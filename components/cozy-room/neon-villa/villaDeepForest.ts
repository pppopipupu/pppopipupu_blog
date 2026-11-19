import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
} from "./villaPrimitives";

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

export interface DeepForestRefs {
  campFire: THREE.Mesh;
  fireflies: THREE.Points;
  stars: THREE.Points;
  dispose: () => void;
}

/**
 * High-scale InstancedMesh Deep Fantasy Forest around the 48m x 27m 5-Level Grand Villa.
 */
export function buildDeepForest(root: THREE.Group, p: VillaPalette): DeepForestRefs {
  const rand = mulberry32(991741);
  const forest = new THREE.Group();
  forest.name = "villa_deep_forest";
  root.add(forest);

  const disposables: Array<{ dispose: () => void }> = [];
  const pineCoords: Array<[number, number, number, number]> = [];
  const oakCoords: Array<[number, number, number, number]> = [];

  const isClearZone = (tx: number, tz: number): boolean => {
    if (tx > -52 && tx < 54 && tz > -28 && tz < 38) return true;
    if (tz > 22 && tx > -44 && tx < 64) return true;
    if (tx > -56 && tx < -34 && tz > -90 && tz < 90) return true;
    if (tx > -92 && tx < -56 && tz > -6 && tz < 26) return true;
    if (tx > 49 && tx < 67 && tz > -37 && tz < -19) return true;
    if (tx > -73 && tx < -55 && tz > -55 && tz < -37) return true;
    if (tx > 54 && tx < 74 && tz > 17 && tz < 39) return true;
    if (tx > -24 && tx < -4 && tz > -68 && tz < -48) return true;
    if (tx > 35 && tx < 53 && tz > 35 && tz < 53) return true;
    return false;
  };

  for (let i = 0; i < 480; i++) {
    const angle = rand() * Math.PI * 2;
    const rad = 44 + rand() * 124;
    const tx = Math.cos(angle) * rad;
    const tz = Math.sin(angle) * rad;
    if (isClearZone(tx, tz)) continue;

    const scale = 1.15 + rand() * 1.75 + (rad > 96 ? 0.85 : 0);
    const rot = rand() * Math.PI * 2;
    if (rand() > 0.34) {
      pineCoords.push([tx, tz, scale, rot]);
    } else {
      oakCoords.push([tx, tz, scale, rot]);
    }
  }

  const dummy = new THREE.Object3D();

  if (pineCoords.length > 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.6, 6);
    const tier1Geo = new THREE.ConeGeometry(2.7, 5.2, 7);
    const tier2Geo = new THREE.ConeGeometry(2.1, 4.6, 7);
    const tier3Geo = new THREE.ConeGeometry(1.35, 3.6, 7);
    disposables.push(trunkGeo, tier1Geo, tier2Geo, tier3Geo);

    const trunks = new THREE.InstancedMesh(trunkGeo, p.woodDark, pineCoords.length);
    const tier1 = new THREE.InstancedMesh(tier1Geo, p.foliageDeep, pineCoords.length);
    const tier2 = new THREE.InstancedMesh(tier2Geo, p.foliageMid, pineCoords.length);
    const tier3 = new THREE.InstancedMesh(tier3Geo, p.foliageBright, pineCoords.length);
    for (const im of [trunks, tier1, tier2, tier3]) {
      im.castShadow = true;
      im.receiveShadow = true;
      forest.add(im);
    }

    pineCoords.forEach(([x, z, s, r], idx) => {
      dummy.rotation.set(0, r, 0);
      dummy.scale.setScalar(s);
      dummy.position.set(x, -0.25 + 1.8 * s, z);
      dummy.updateMatrix();
      trunks.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x, -0.25 + 5.2 * s, z);
      dummy.updateMatrix();
      tier1.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x, -0.25 + 7.7 * s, z);
      dummy.updateMatrix();
      tier2.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x, -0.25 + 9.9 * s, z);
      dummy.updateMatrix();
      tier3.setMatrixAt(idx, dummy.matrix);
    });
  }

  if (oakCoords.length > 0) {
    const oakTrunkGeo = new THREE.CylinderGeometry(0.4, 0.66, 4.2, 6);
    const canopyGeo = new THREE.IcosahedronGeometry(2.35, 0);
    const topCanopyGeo = new THREE.IcosahedronGeometry(1.85, 0);
    disposables.push(oakTrunkGeo, canopyGeo, topCanopyGeo);

    const oakTrunks = new THREE.InstancedMesh(oakTrunkGeo, p.woodDark, oakCoords.length);
    const oakLow = new THREE.InstancedMesh(canopyGeo, p.foliageMid, oakCoords.length);
    const oakHigh = new THREE.InstancedMesh(topCanopyGeo, p.foliageBright, oakCoords.length);
    for (const im of [oakTrunks, oakLow, oakHigh]) {
      im.castShadow = true;
      im.receiveShadow = true;
      forest.add(im);
    }

    oakCoords.forEach(([x, z, s, r], idx) => {
      dummy.rotation.set(0, r, 0);
      dummy.scale.setScalar(s);
      dummy.position.set(x, -0.25 + 2.1 * s, z);
      dummy.updateMatrix();
      oakTrunks.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x + Math.cos(r) * 0.7 * s, -0.25 + 5.5 * s, z + Math.sin(r) * 0.7 * s);
      dummy.updateMatrix();
      oakLow.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(x - Math.cos(r) * 0.6 * s, -0.25 + 7.2 * s, z - Math.sin(r) * 0.6 * s);
      dummy.updateMatrix();
      oakHigh.setMatrixAt(idx, dummy.matrix);
    });
  }

  const peakCount = 30;
  const peakGeo = new THREE.ConeGeometry(34, 70, 6);
  disposables.push(peakGeo);
  const peaks = new THREE.InstancedMesh(peakGeo, p.stoneDark, peakCount);
  forest.add(peaks);
  for (let i = 0; i < peakCount; i++) {
    const a = (i / peakCount) * Math.PI * 2;
    const dist = 190 + rand() * 32;
    const sy = 0.75 + rand() * 0.95;
    const sxz = 0.85 + rand() * 0.7;
    dummy.position.set(Math.cos(a) * dist, 30 * sy - 2, Math.sin(a) * dist);
    dummy.rotation.set(0, rand() * Math.PI, 0);
    dummy.scale.set(sxz, sy, sxz);
    dummy.updateMatrix();
    peaks.setMatrixAt(i, dummy.matrix);
  }

  // Adventurer's Campfire Glade (44, 0, 44)
  const camp = new THREE.Group();
  camp.position.set(44.0, 0, 44.0);
  forest.add(camp);

  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    addBoxMesh(camp, 0.48, 0.36, 0.48, Math.cos(a) * 1.15, -0.08, Math.sin(a) * 1.15, p.stoneWall, a);
  }
  const campFire = addConeMesh(camp, 0.7, 1.45, 6, 0, 0.55, 0, p.glowFire);
  const tent1 = addConeMesh(camp, 2.4, 2.8, 4, -3.8, 1.15, -2.4, p.fabricRed, 0.6);
  tent1.scale.set(1.0, 1.0, 1.35);
  const tent2 = addConeMesh(camp, 2.2, 2.5, 4, 4.0, 1.0, -1.8, p.fabricBlue, -0.5);
  tent2.scale.set(1.0, 1.0, 1.3);
  const bench1 = addCylMesh(camp, 0.3, 0.32, 2.8, 6, 0, 0.08, 2.9, p.woodOak);
  bench1.rotation.z = Math.PI * 0.5;
  addBoxMesh(camp, 1.1, 1.0, 1.1, -3.4, 0.24, 2.4, p.woodCedar, 0.35);

  for (let i = 0; i < 68; i++) {
    const a = rand() * Math.PI * 2;
    const r = 40 + rand() * 82;
    const rx = Math.cos(a) * r;
    const rz = Math.sin(a) * r;
    if (isClearZone(rx, rz)) continue;

    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.75 + rand() * 1.25, 0),
      rand() > 0.5 ? p.stoneWall : p.stoneMoss
    );
    rock.position.set(rx, -0.08, rz);
    rock.rotation.set(rand() * 3, rand() * 3, 0);
    rock.scale.set(1.25, 0.65, 1.0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    forest.add(rock);

    if (rand() > 0.35) {
      const glowMat =
        rand() > 0.65 ? p.glowArcane : rand() > 0.3 ? p.glowPotionPink : p.crystalViolet;
      addCylMesh(forest, 0.09, 0.12, 0.44, 5, rx + 1.0, -0.02, rz + 0.6, p.fabricCream, false, false);
      addConeMesh(forest, 0.36, 0.3, 6, rx + 1.0, 0.34, rz + 0.6, glowMat);
    }
  }

  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(10.5, 1), p.moonGlow);
  moon.position.set(-104, 108, -205);
  forest.add(moon);
  const arcaneMoon = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1), p.crystalViolet);
  arcaneMoon.position.set(88, 92, -215);
  forest.add(arcaneMoon);

  const starCount = 500;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = 0.1 + rand() * 0.72;
    const sr = 235 + rand() * 65;
    starPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * sr;
    starPositions[i * 3 + 1] = Math.cos(phi) * sr + 22;
    starPositions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * sr;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xe6f0ff,
    size: 0.86,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  forest.add(stars);

  const fireflyCount = 360;
  const ffPositions = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 24 + rand() * 124;
    ffPositions[i * 3] = Math.cos(a) * r;
    ffPositions[i * 3 + 1] = 0.8 + rand() * 36.0;
    ffPositions[i * 3 + 2] = Math.sin(a) * r;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPositions, 3));
  const ffMat = new THREE.PointsMaterial({
    color: 0xffe484,
    size: 0.44,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  forest.add(fireflies);

  disposables.push(starGeo, starMat, ffGeo, ffMat);

  return {
    campFire,
    fireflies,
    stars,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
