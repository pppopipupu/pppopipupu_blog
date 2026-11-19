import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
} from "./villaPrimitives";

export interface DndLoreRefs {
  mimicLid: THREE.Group;
  mimicHitbox: THREE.Mesh;
  beholderBody: THREE.Group;
  beholderHitbox: THREE.Mesh;
  dragonHead: THREE.Group;
  dragonHitbox: THREE.Mesh;
  dragonBreath: THREE.Mesh;
  giantD20: THREE.Mesh;
  questSigil: THREE.Mesh;
  grimoireBook: THREE.Group;
  grimoireHitbox: THREE.Mesh;
  spelljammer: THREE.Group;
  spelljammerHitbox: THREE.Mesh;
  dragonEgg: THREE.Mesh;
}

/**
 * Places iconic D&D 5e tabletop lore artifacts & interactive relics across the 48m x 27m Villa.
 */
export function buildDndLoreItems(root: THREE.Group, p: VillaPalette): DndLoreRefs {
  const grp = new THREE.Group();
  grp.name = "villa_dnd_lore";
  root.add(grp);

  const bY = -6.2;
  const f1 = 0.0;
  const f2 = 7.07;
  const f3 = 13.87;

  /* B1: 1. MIMIC TREASURE CHEST */
  const mimicGroup = new THREE.Group();
  mimicGroup.position.set(13.2, bY, 4.4);
  mimicGroup.rotation.y = -0.55;
  grp.add(mimicGroup);

  const mimicHitbox = addBoxMesh(mimicGroup, 2.35, 0.96, 1.5, 0, 0.48, 0, p.woodDark);
  mimicHitbox.name = "villa_mimic_chest";
  addBoxMesh(mimicGroup, 2.44, 0.14, 1.56, 0, 0.22, 0, p.iron);
  addBoxMesh(mimicGroup, 2.44, 0.14, 1.56, 0, 0.82, 0, p.iron);
  addBoxMesh(mimicGroup, 0.6, 0.22, 1.24, 0, 0.88, 0.38, p.fabricRed);
  for (let t = -3; t <= 3; t++) {
    addConeMesh(mimicGroup, 0.085, 0.24, 4, t * 0.28, 1.04, 0.62, p.fabricCream);
  }
  const mimicLid = new THREE.Group();
  mimicLid.position.set(0, 0.96, -0.72);
  mimicGroup.add(mimicLid);
  addBoxMesh(mimicLid, 2.38, 0.48, 1.5, 0, 0.24, 0.72, p.woodCedar);
  addBoxMesh(mimicLid, 2.44, 0.12, 1.54, 0, 0.42, 0.72, p.gold);
  for (const ex of [-0.56, 0, 0.56]) {
    addBoxMesh(mimicLid, 0.2, 0.15, 0.1, ex, 0.24, 1.48, p.glowFire, 0, false, false);
  }

  /* B1: 2. BEHOLDER SPECIMEN JAR */
  const jarGroup = new THREE.Group();
  jarGroup.position.set(-3.2, bY, 6.4);
  grp.add(jarGroup);

  addCylMesh(jarGroup, 1.22, 1.42, 1.1, 8, 0, 0.55, 0, p.stoneAncient);
  addCylMesh(jarGroup, 1.08, 1.08, 0.16, 10, 0, 1.18, 0, p.brass);
  addCylMesh(jarGroup, 1.08, 1.08, 0.16, 10, 0, 3.88, 0, p.brass);
  const beholderHitbox = addCylMesh(
    jarGroup,
    1.0,
    1.0,
    2.54,
    12,
    0,
    2.53,
    0,
    p.glass,
    false,
    false
  );
  beholderHitbox.name = "villa_beholder_jar";

  const beholderBody = new THREE.Group();
  beholderBody.position.set(0, 2.53, 0);
  jarGroup.add(beholderBody);
  const bOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 0), p.fabricPurple);
  beholderBody.add(bOrb);
  const mainEye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), p.glowRuneGold);
  mainEye.position.set(0, 0.04, 0.48);
  beholderBody.add(mainEye);
  for (let s = 0; s < 6; s++) {
    const a = (s / 6) * Math.PI * 2;
    const sx = Math.cos(a) * 0.6;
    const sz = Math.sin(a) * 0.6;
    const stalk = addCylMesh(beholderBody, 0.055, 0.075, 0.6, 5, sx * 0.85, 0.48, sz * 0.85, p.fabricPurple);
    stalk.rotation.z = -Math.cos(a) * 0.55;
    stalk.rotation.x = Math.sin(a) * 0.55;
    const miniEye = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.11, 0),
      s % 2 === 0 ? p.glowArcane : p.glowPotionPink
    );
    miniEye.position.set(sx * 1.15, 0.78, sz * 1.15);
    beholderBody.add(miniEye);
  }

  /* B1: 3. DECK OF MANY THINGS OBSIDIAN ALTAR */
  addBoxMesh(grp, 2.0, 1.12, 1.32, -20.2, bY + 0.56, 4.6, p.stoneDark, 0.32);
  addBoxMesh(grp, 2.1, 0.14, 1.42, -20.2, bY + 1.18, 4.6, p.gold, 0.32);
  for (let c = -2; c <= 2; c++) {
    addBoxMesh(
      grp,
      0.26,
      0.04,
      0.42,
      -20.2 + c * 0.26,
      bY + 1.3 + Math.abs(c) * 0.015,
      4.6 + c * 0.06,
      c === 0 ? p.glowRuneGold : p.parchment,
      0.32 + c * 0.18,
      false,
      false
    );
  }

  /* 1F: 4. MOUNTED RED DRAGON TROPHY HEAD ABOVE HEARTH */
  const dragonHead = new THREE.Group();
  dragonHead.position.set(-20.6, f1 + 5.25, -1.8);
  grp.add(dragonHead);

  addBoxMesh(dragonHead, 0.24, 2.1, 1.85, -0.15, 0, 0, p.woodDark);
  addBoxMesh(dragonHead, 0.14, 1.82, 1.58, -0.02, 0, 0, p.gold);
  const dragonHitbox = addBoxMesh(dragonHead, 1.72, 1.02, 1.22, 0.82, 0.08, 0, p.fabricRed);
  dragonHitbox.name = "villa_dragon_trophy";
  addBoxMesh(dragonHead, 1.22, 0.36, 0.96, 1.05, -0.46, 0, p.fabricRed);
  const hornL = addConeMesh(dragonHead, 0.22, 1.6, 5, 0.32, 0.9, -0.64, p.fabricCream);
  hornL.rotation.z = 0.65;
  hornL.rotation.x = -0.35;
  const hornR = addConeMesh(dragonHead, 0.22, 1.6, 5, 0.32, 0.9, 0.64, p.fabricCream);
  hornR.rotation.z = 0.65;
  hornR.rotation.x = 0.35;
  addBoxMesh(dragonHead, 0.2, 0.2, 0.18, 1.24, 0.32, -0.6, p.glowFire, 0, false, false);
  addBoxMesh(dragonHead, 0.2, 0.2, 0.18, 1.24, 0.32, 0.6, p.glowFire, 0, false, false);
  const dragonBreath = addConeMesh(dragonHead, 0.72, 2.7, 6, 2.85, -0.15, 0, p.glowFire);
  dragonBreath.rotation.z = -Math.PI * 0.5;
  dragonBreath.scale.setScalar(0.01);

  /* 1F: 5. GIANT FLOATING D20 RELIC, DM SCREEN & DUNGEON MINIS */
  addBoxMesh(grp, 0.09, 0.68, 2.0, -12.55, f1 + 1.4, 1.4, p.woodDark);
  addBoxMesh(grp, 0.06, 0.52, 1.75, -12.48, f1 + 1.4, 1.4, p.fabricGold, 0, false, false);
  addCylMesh(grp, 0.22, 0.26, 0.54, 6, -11.4, f1 + 1.34, 0.3, p.stoneLight);
  addConeMesh(grp, 0.28, 0.36, 6, -11.4, f1 + 1.76, 0.3, p.fabricRed);
  const heroColors = [p.fabricBlue, p.fabricEmerald, p.fabricGold, p.fabricPurple];
  for (let h = 0; h < 4; h++) {
    addCylMesh(
      grp,
      0.09,
      0.12,
      0.3,
      6,
      -10.45 + (h % 2) * 0.4,
      f1 + 1.22,
      0.5 + Math.floor(h / 2) * 0.54,
      heroColors[h]
    );
  }
  const giantD20 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 0), p.glowArcane);
  giantD20.position.set(-11.1, f1 + 2.3, 1.55);
  giantD20.name = "villa_giant_d20";
  grp.add(giantD20);

  /* 1F: 6. ADVENTURER'S GUILD QUEST BOUNTY BOARD */
  const boardGrp = new THREE.Group();
  boardGrp.position.set(4.2, f1, 7.6);
  boardGrp.rotation.y = -0.32;
  grp.add(boardGrp);

  addBoxMesh(boardGrp, 0.22, 3.5, 0.22, -1.48, 1.75, 0, p.woodDark);
  addBoxMesh(boardGrp, 0.22, 3.5, 0.22, 1.48, 1.75, 0, p.woodDark);
  addBoxMesh(boardGrp, 3.2, 2.15, 0.16, 0, 2.45, 0, p.woodOak);
  addBoxMesh(boardGrp, 3.5, 0.26, 0.6, 0, 3.62, 0, p.roofSlate);
  for (const [qx, qy, rot] of [
    [-0.9, 2.75, 0.08],
    [0.05, 2.65, -0.06],
    [0.95, 2.8, 0.12],
    [-0.5, 1.9, -0.1],
    [0.6, 1.88, 0.05],
  ] as Array<[number, number, number]>) {
    const note = addBoxMesh(boardGrp, 0.64, 0.74, 0.03, qx, qy, 0.11, p.parchment, 0, false, false);
    note.rotation.z = rot;
    addCylMesh(boardGrp, 0.065, 0.065, 0.04, 6, qx, qy + 0.26, 0.14, p.fabricRed, false, false);
  }
  const questSigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), p.glowRuneGold);
  questSigil.position.set(0, 4.45, 0);
  questSigil.scale.set(0.7, 1.45, 0.7);
  questSigil.name = "villa_quest_board";
  boardGrp.add(questSigil);

  /* 2F: 7. FLOATING ARCANE GRIMOIRE LECTERN & VORPAL SWORD DISPLAY */
  const lecternGrp = new THREE.Group();
  lecternGrp.position.set(20.0, f2, 5.4);
  lecternGrp.rotation.y = -0.65;
  grp.add(lecternGrp);

  addCylMesh(lecternGrp, 0.26, 0.56, 1.55, 8, 0, 0.775, 0, p.brass);
  const deskTop = addBoxMesh(lecternGrp, 1.35, 0.12, 0.98, 0, 1.62, 0, p.woodDark);
  deskTop.rotation.x = 0.28;

  const grimoireBook = new THREE.Group();
  grimoireBook.position.set(0, 2.08, 0);
  lecternGrp.add(grimoireBook);
  const leftPage = addBoxMesh(grimoireBook, 0.62, 0.08, 0.84, -0.32, 0.06, 0, p.parchment);
  leftPage.rotation.z = -0.24;
  const rightPage = addBoxMesh(grimoireBook, 0.62, 0.08, 0.84, 0.32, 0.06, 0, p.parchment);
  rightPage.rotation.z = 0.24;
  const grimoireHitbox = addBoxMesh(
    grimoireBook,
    1.2,
    0.28,
    0.9,
    0,
    0.1,
    0,
    p.glowRuneGold,
    0,
    false,
    false
  );
  grimoireHitbox.scale.set(0.35, 0.35, 0.35);
  grimoireHitbox.position.y = 0.45;
  grimoireHitbox.name = "villa_grimoire";

  // Vorpal Sword Glass Display Case in Master Suite (West 2F)
  addBoxMesh(grp, 1.65, 1.02, 1.1, -20.4, f2 + 0.51, -1.4, p.woodDark);
  addBoxMesh(grp, 1.48, 2.55, 0.92, -20.4, f2 + 2.32, -1.4, p.glass, 0, false, false);
  addBoxMesh(grp, 0.13, 2.0, 0.06, -20.4, f2 + 2.38, -1.4, p.glowArcane, 0, false, false);
  addBoxMesh(grp, 0.58, 0.1, 0.1, -20.4, f2 + 1.68, -1.4, p.gold);

  /* 3F: 8. HOVERING SPELLJAMMER ASTRAL GALLEON */
  const spelljammer = new THREE.Group();
  spelljammer.position.set(-5.0, f3 + 4.3, 2.8);
  grp.add(spelljammer);

  const spelljammerHitbox = addBoxMesh(spelljammer, 2.4, 0.6, 1.0, 0, 0, 0, p.woodCedar);
  spelljammerHitbox.name = "villa_spelljammer";
  const prow = addConeMesh(spelljammer, 0.52, 1.05, 4, 1.62, 0.06, 0, p.woodOak);
  prow.rotation.z = -Math.PI * 0.5;
  addCylMesh(spelljammer, 0.055, 0.065, 2.0, 6, 0.12, 1.25, 0, p.woodDark);
  addBoxMesh(spelljammer, 0.08, 1.38, 1.82, 0.16, 1.38, 0, p.stainedCyan, 0, false, false);
  addBoxMesh(spelljammer, 0.08, 0.9, 1.3, -0.72, 1.04, 0, p.stainedAmber, 0, false, false);

  /* 3F: 9. HEATED DRAGON EGG NEST IN ROOFTOP GARDEN */
  const nestGrp = new THREE.Group();
  nestGrp.position.set(19.8, f3, -5.2);
  grp.add(nestGrp);

  addCylMesh(nestGrp, 1.38, 1.6, 0.6, 8, 0, 0.3, 0, p.stoneDark);
  addCylMesh(nestGrp, 1.06, 1.06, 0.14, 8, 0, 0.64, 0, p.glowEmber, false, false);
  const dragonEgg = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 1), p.glowFire);
  dragonEgg.scale.set(0.84, 1.28, 0.84);
  dragonEgg.position.set(0, 1.4, 0);
  dragonEgg.name = "villa_dragon_egg";
  nestGrp.add(dragonEgg);

  return {
    mimicLid,
    mimicHitbox,
    beholderBody,
    beholderHitbox,
    dragonHead,
    dragonHitbox,
    dragonBreath,
    giantD20,
    questSigil,
    grimoireBook,
    grimoireHitbox,
    spelljammer,
    spelljammerHitbox,
    dragonEgg,
  };
}
