import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
} from "./villaPrimitives";

export interface AncientStatuesRefs {
  statueEye: THREE.Mesh;
  statueShards: THREE.Group;
  totemHalo: THREE.Mesh;
  forestPortal: THREE.Mesh;
  portalFloatStones: THREE.Group;
}

/**
 * 5 Bizarre & Monumental Ancient Fantasy Statues / Ruins spaced cleanly around the 48m x 27m Villa.
 */
export function buildAncientStatues(
  root: THREE.Group,
  p: VillaPalette
): AncientStatuesRefs {
  const grp = new THREE.Group();
  grp.name = "villa_ancient_statues";
  root.add(grp);

  /* 1. FLOATING-EYE COLOSSUS MONOLITH (East-North Clearing, Clickable!) */
  const colossus = new THREE.Group();
  colossus.position.set(58.0, 0, -28.0);
  colossus.rotation.y = -0.6;
  grp.add(colossus);

  addCylMesh(colossus, 4.4, 5.0, 0.7, 8, 0, 0.1, 0, p.stoneMoss);
  addCylMesh(colossus, 3.2, 3.6, 0.65, 8, 0, 0.78, 0, p.stoneAncient);
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + Math.PI * 0.25;
    const bx = Math.cos(a) * 3.8;
    const bz = Math.sin(a) * 3.8;
    addCylMesh(colossus, 0.42, 0.52, 1.35, 6, bx, 0.9, bz, p.stoneDark);
    addConeMesh(colossus, 0.34, 0.68, 6, bx, 1.9, bz, p.glowFire);
  }
  addCylMesh(colossus, 1.4, 2.2, 5.8, 6, 0, 4.0, 0, p.stoneAncient);
  const leftArm = addBoxMesh(colossus, 0.95, 4.0, 0.95, -2.25, 6.0, 0.9, p.stoneAncient);
  leftArm.rotation.z = 0.42;
  leftArm.rotation.x = -0.28;
  const rightArm = addBoxMesh(colossus, 0.95, 4.0, 0.95, 2.25, 6.0, 0.9, p.stoneAncient);
  rightArm.rotation.z = -0.42;
  rightArm.rotation.x = -0.28;
  const lHorn = addConeMesh(colossus, 0.72, 3.6, 5, -1.65, 8.4, -0.2, p.stoneMoss);
  lHorn.rotation.z = 0.26;
  const rHorn = addConeMesh(colossus, 0.72, 3.6, 5, 1.65, 8.4, -0.2, p.stoneMoss);
  rHorn.rotation.z = -0.26;

  const statueEye = new THREE.Mesh(new THREE.OctahedronGeometry(1.28, 0), p.crystalViolet);
  statueEye.position.set(0, 8.45, 0.65);
  statueEye.name = "villa_eye_statue";
  colossus.add(statueEye);

  const statueShards = new THREE.Group();
  statueShards.position.set(0, 8.45, 0.65);
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2;
    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.36, 0),
      s % 2 === 0 ? p.glowRuneGold : p.stoneLight
    );
    shard.position.set(Math.cos(a) * 2.4, Math.sin(s * 1.7) * 0.45, Math.sin(a) * 2.4);
    statueShards.add(shard);
  }
  colossus.add(statueShards);

  /* 2. TWIN MOSSY GUARDIAN OWL-GOLEM STATUES */
  for (const [gx, gz, rot] of [
    [-29.0, 36.0, 0.38],
    [29.0, 36.0, -0.38],
  ] as Array<[number, number, number]>) {
    const guard = new THREE.Group();
    guard.position.set(gx, 0, gz);
    guard.rotation.y = rot;
    grp.add(guard);

    addBoxMesh(guard, 2.7, 1.2, 2.7, 0, 0.35, 0, p.stoneMoss);
    addCylMesh(guard, 1.0, 1.25, 3.1, 7, 0, 2.5, 0, p.stoneAncient);
    addBoxMesh(guard, 0.62, 2.1, 1.2, -1.18, 2.6, -0.1, p.stoneWall);
    addBoxMesh(guard, 0.62, 2.1, 1.2, 1.18, 2.6, -0.1, p.stoneWall);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 0), p.stoneAncient);
    head.position.set(0, 4.6, 0.12);
    guard.add(head);
    addConeMesh(guard, 0.28, 0.64, 4, -0.64, 5.55, 0, p.stoneMoss);
    addConeMesh(guard, 0.28, 0.64, 4, 0.64, 5.55, 0, p.stoneMoss);
    addBoxMesh(guard, 0.24, 0.24, 0.16, -0.38, 4.66, 1.02, p.glowArcane, 0, false, false);
    addBoxMesh(guard, 0.24, 0.24, 0.16, 0.38, 4.66, 1.02, p.glowArcane, 0, false, false);
  }

  /* 3. TWISTED SPIRAL MOON-TOTEM SANCTUARY */
  const totemGroup = new THREE.Group();
  totemGroup.position.set(-64.0, 0, -46.0);
  grp.add(totemGroup);

  addCylMesh(totemGroup, 5.6, 6.2, 0.4, 12, 0, -0.05, 0, p.stoneMoss);
  const sigilRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.85, 28), p.glowArcane);
  sigilRing.rotation.x = -Math.PI * 0.5;
  sigilRing.position.set(0, 0.18, 0);
  totemGroup.add(sigilRing);

  const centralTotem = addBoxMesh(totemGroup, 1.65, 8.6, 1.65, 0, 4.2, 0, p.stoneAncient, 0.35);
  centralTotem.rotation.z = 0.12;
  const totemHalo = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.14, 6, 18), p.glowRuneGold);
  totemHalo.position.set(0.42, 7.2, 0);
  totemHalo.rotation.y = 0.5;
  totemGroup.add(totemHalo);

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const sx = Math.cos(a) * 4.6;
    const sz = Math.sin(a) * 4.6;
    const stone = addBoxMesh(
      totemGroup,
      0.92,
      3.4 + (i % 3) * 0.9,
      0.58,
      sx,
      1.75,
      sz,
      p.stoneWall,
      -a
    );
    stone.rotation.x = 0.14;
    addBoxMesh(
      totemGroup,
      0.26,
      0.95,
      0.1,
      sx * 0.87,
      2.2,
      sz * 0.87,
      i % 2 === 0 ? p.glowArcane : p.glowPotionPink,
      -a,
      false,
      false
    );
  }

  /* 4. SUNKEN THREE-ARCH STONE LEVIATHAN */
  const wyrm = new THREE.Group();
  wyrm.position.set(64.0, 0, 28.0);
  wyrm.rotation.y = -0.85;
  grp.add(wyrm);

  for (let seg = 0; seg < 3; seg++) {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(2.6 - seg * 0.35, 0.72 - seg * 0.08, 6, 12, Math.PI),
      seg % 2 === 0 ? p.stoneAncient : p.stoneMoss
    );
    arch.position.set(0, -0.1, seg * 5.2 - 5.0);
    arch.rotation.y = Math.PI * 0.5;
    arch.castShadow = true;
    arch.receiveShadow = true;
    wyrm.add(arch);
    addConeMesh(wyrm, 0.36, 1.15, 4, 0, 2.9 - seg * 0.35, seg * 5.2 - 5.0, p.glowPotionGreen);
  }
  addBoxMesh(wyrm, 1.9, 1.6, 2.8, 0, 3.3, -8.2, p.stoneAncient);
  addConeMesh(wyrm, 0.36, 1.4, 5, -0.75, 4.5, -7.4, p.stoneMoss);
  addConeMesh(wyrm, 0.36, 1.4, 5, 0.75, 4.5, -7.4, p.stoneMoss);
  addBoxMesh(wyrm, 0.26, 0.26, 0.2, -0.88, 3.55, -8.8, p.glowPotionGreen, 0, false, false);
  addBoxMesh(wyrm, 0.26, 0.26, 0.2, 0.88, 3.55, -8.8, p.glowPotionGreen, 0, false, false);

  /* 5. FLOATING RUNIC ASTRAL PORTAL GATEWAY */
  const portalGrp = new THREE.Group();
  portalGrp.position.set(-14.0, 0, -58.0);
  grp.add(portalGrp);

  addCylMesh(portalGrp, 5.8, 6.4, 0.48, 10, 0, -0.01, 0, p.stoneWall);
  addBoxMesh(portalGrp, 1.85, 8.6, 1.85, -4.0, 4.4, 0, p.stoneAncient);
  addBoxMesh(portalGrp, 1.85, 8.6, 1.85, 4.0, 4.4, 0, p.stoneAncient);
  addBoxMesh(portalGrp, 10.6, 1.5, 2.2, 0, 9.4, 0, p.stoneMoss);
  const forestPortal = new THREE.Mesh(new THREE.CircleGeometry(3.35, 20), p.glowArcane);
  forestPortal.position.set(0, 4.7, 0);
  forestPortal.name = "villa_forest_portal";
  portalGrp.add(forestPortal);

  const portalFloatStones = new THREE.Group();
  portalFloatStones.position.set(0, 11.4, 0);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65 + (k % 2) * 0.25, 0),
      k % 2 === 0 ? p.stoneAncient : p.crystalViolet
    );
    stone.position.set(Math.cos(a) * 3.2, Math.sin(k * 1.6) * 0.65, Math.sin(a) * 1.4);
    portalFloatStones.add(stone);
  }
  portalGrp.add(portalFloatStones);

  return {
    statueEye,
    statueShards,
    totemHalo,
    forestPortal,
    portalFloatStones,
  };
}
