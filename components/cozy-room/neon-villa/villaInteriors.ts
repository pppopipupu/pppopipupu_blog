import * as THREE from "three";
import {
  VillaPalette,
  addBanner,
  addBookshelf,
  addBoxMesh,
  addCandleCluster,
  addConeMesh,
  addCylMesh,
  addPottedPlant,
} from "./villaPrimitives";

export interface VillaInteractiveRefs {
  fireMesh: THREE.Mesh;
  arcaneCrystal: THREE.Mesh;
  cauldronLiquid: THREE.Mesh;
  cauldronBubbles: THREE.Group;
  runeRing: THREE.Mesh;
  innerRuneRing: THREE.Mesh;
  chandelier: THREE.Group;
  astrolabe: THREE.Group;
  astrolabeInner: THREE.Mesh;
  astrolabeCore: THREE.Mesh;
  bathSteam: THREE.Group;
  floatingBooks: THREE.Group;
  fountainWater: THREE.Mesh;
}

/**
 * Richly Detailed Fantasy D&D Interiors scaled cleanly to the 48.0m x 27.0m 5-Level Grand Villa.
 */
export function buildVillaInteriors(root: THREE.Group, p: VillaPalette): VillaInteractiveRefs {
  const g = new THREE.Group();
  g.name = "villa_interiors";
  root.add(g);

  /* ======================================================================== */
  /* B1 BASEMENT (y = -6.2) — Alchemy Workshop, Summoning Circle & Vault      */
  /* ======================================================================== */
  const bY = -6.2;

  const runeRing = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.45, 42), p.glowArcane);
  runeRing.rotation.x = -Math.PI * 0.5;
  runeRing.position.set(-11.4, bY + 0.05, 2.6);
  g.add(runeRing);

  const innerRuneRing = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.75, 32), p.glowRuneGold);
  innerRuneRing.rotation.x = -Math.PI * 0.5;
  innerRuneRing.position.set(-11.4, bY + 0.08, 2.6);
  g.add(innerRuneRing);

  const coreRune = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.48, 24), p.glowPotionPink);
  coreRune.rotation.x = -Math.PI * 0.5;
  coreRune.position.set(-11.4, bY + 0.11, 2.6);
  g.add(coreRune);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const px = -11.4 + Math.cos(a) * 5.0;
    const pz = 2.6 + Math.sin(a) * 5.0;
    addCylMesh(g, 0.3, 0.38, 0.98, 6, px, bY + 0.49, pz, p.stoneWall);
    addConeMesh(g, 0.22, 0.58, 5, px, bY + 1.26, pz, i % 2 === 0 ? p.glowArcane : p.crystalViolet);
  }

  const arcaneCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.18, 0), p.glowArcane);
  arcaneCrystal.position.set(-11.4, bY + 2.9, 2.6);
  arcaneCrystal.name = "villa_arcane_crystal";
  g.add(arcaneCrystal);

  const floatingBooks = new THREE.Group();
  floatingBooks.position.set(-11.4, bY + 3.05, 2.6);
  const tomeMats = [
    p.fabricRed,
    p.fabricBlue,
    p.fabricEmerald,
    p.fabricPurple,
    p.fabricGold,
    p.fabricTeal,
  ];
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    const bx = Math.cos(a) * 2.9;
    const by = Math.sin(b * 2.0) * 0.44;
    const bz = Math.sin(a) * 2.9;
    addBoxMesh(floatingBooks, 0.68, 0.13, 0.5, bx, by, bz, tomeMats[b], a);
    addBoxMesh(floatingBooks, 0.6, 0.06, 0.54, bx, by, bz, p.parchment, a, false, false);
  }
  g.add(floatingBooks);

  // Bubbling Alchemy Cauldron (clickable!)
  addCylMesh(g, 1.4, 1.08, 1.48, 10, -1.0, bY + 0.84, -3.2, p.iron);
  const cauldronLiquid = addCylMesh(
    g,
    1.22,
    1.22,
    0.16,
    10,
    -1.0,
    bY + 1.56,
    -3.2,
    p.glowPotionGreen,
    false,
    false
  );
  cauldronLiquid.name = "villa_cauldron";
  addCylMesh(g, 1.0, 1.15, 0.28, 8, -1.0, bY + 0.14, -3.2, p.glowFire, false, false);
  for (let leg = 0; leg < 3; leg++) {
    const a = (leg / 3) * Math.PI * 2;
    const pole = addCylMesh(
      g,
      0.075,
      0.095,
      3.3,
      5,
      -1.0 + Math.cos(a) * 1.16,
      bY + 1.56,
      -3.2 + Math.sin(a) * 1.16,
      p.iron
    );
    pole.rotation.z = Math.cos(a) * 0.3;
    pole.rotation.x = -Math.sin(a) * 0.3;
  }
  const cauldronBubbles = new THREE.Group();
  cauldronBubbles.position.set(-1.0, bY + 1.75, -3.2);
  for (let i = 0; i < 8; i++) {
    const bub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.15 + (i % 3) * 0.05, 0),
      i % 2 === 0 ? p.glowPotionGreen : p.glowArcane
    );
    bub.position.set(Math.cos(i * 1.2) * 0.58, i * 0.28, Math.sin(i * 1.2) * 0.58);
    cauldronBubbles.add(bub);
  }
  g.add(cauldronBubbles);

  // Alchemist Workbench & 22-Bottle Potion Rack (clear of B2 stairs at x = -19.8)
  addBoxMesh(g, 9.6, 1.18, 1.65, -11.4, bY + 0.59, -11.2, p.woodDark);
  addBoxMesh(g, 9.8, 0.16, 1.78, -11.4, bY + 1.26, -11.2, p.stoneLight);
  addBoxMesh(g, 9.6, 3.3, 0.52, -11.4, bY + 2.98, -11.82, p.woodOak);
  for (const ax of [-15.2, -7.8]) {
    addCylMesh(g, 0.32, 0.46, 0.64, 8, ax, bY + 1.66, -11.05, p.copper);
    addConeMesh(g, 0.34, 0.5, 8, ax, bY + 2.22, -11.05, p.copper);
    addCylMesh(g, 0.22, 0.26, 0.48, 8, ax + 0.82, bY + 1.58, -11.05, p.glowPotionPink, false, false);
  }
  const potionMats = [
    p.glowPotionGreen,
    p.glowPotionPink,
    p.glowArcane,
    p.glowFire,
    p.crystalViolet,
  ];
  for (let i = 0; i < 22; i++) {
    addCylMesh(
      g,
      0.13,
      0.17,
      0.46,
      6,
      -15.8 + i * 0.42,
      bY + 1.78 + (i % 2) * 1.15,
      -11.48,
      potionMats[i % potionMats.length],
      false,
      false
    );
  }

  // Adventurer's Armory & Knight Armor Stands
  addBoxMesh(g, 5.2, 3.2, 0.44, 5.2, bY + 1.6, -12.1, p.woodDark);
  addBoxMesh(g, 0.16, 2.5, 0.08, 3.5, bY + 1.85, -11.72, p.glowArcane, 0, false, false);
  addBoxMesh(g, 0.68, 0.14, 0.14, 3.5, bY + 1.12, -11.72, p.gold);
  addCylMesh(g, 0.06, 0.06, 2.7, 6, 4.8, bY + 1.55, -11.72, p.woodOak);
  addConeMesh(g, 0.2, 0.44, 5, 4.8, bY + 3.05, -11.72, p.crystalViolet);
  addCylMesh(g, 0.76, 0.58, 0.14, 6, 6.4, bY + 1.8, -11.72, p.fabricRed);
  addBoxMesh(g, 0.14, 1.0, 0.04, 6.4, bY + 1.8, -11.61, p.gold, 0, false, false);

  for (const kx of [10.0, 12.4]) {
    addCylMesh(g, 0.42, 0.5, 0.26, 6, kx, bY + 0.13, -11.0, p.woodDark);
    addBoxMesh(g, 0.84, 1.35, 0.48, kx, bY + 1.8, -11.0, p.iron);
    addBoxMesh(g, 0.32, 1.04, 0.32, kx - 0.25, bY + 0.82, -11.0, p.iron);
    addBoxMesh(g, 0.32, 1.04, 0.32, kx + 0.25, bY + 0.82, -11.0, p.iron);
    addBoxMesh(g, 0.5, 0.56, 0.5, kx, bY + 2.76, -11.0, p.stoneLight);
    addConeMesh(g, 0.17, 0.52, 5, kx, bY + 3.28, -11.0, kx < 11.0 ? p.fabricRed : p.fabricBlue);
  }

  // Treasure Hoard & Stacked Oak Wine Barrels along East Wall
  addBoxMesh(g, 3.0, 1.28, 1.7, 5.6, bY + 0.64, 5.0, p.woodDark, -0.24);
  addBoxMesh(g, 3.1, 0.26, 1.76, 5.6, bY + 1.36, 5.0, p.gold, -0.24);
  addCylMesh(g, 0.98, 1.22, 0.48, 8, 5.6, bY + 1.68, 5.0, p.gold);
  addConeMesh(g, 0.28, 0.54, 5, 5.0, bY + 2.08, 4.85, p.glowPotionPink);
  addConeMesh(g, 0.28, 0.54, 5, 6.1, bY + 2.08, 5.15, p.glowArcane);
  addConeMesh(g, 0.24, 0.46, 5, 5.65, bY + 2.1, 4.65, p.glowPotionGreen);
  addCylMesh(g, 0.78, 1.1, 0.28, 7, 2.4, bY + 0.14, 6.8, p.gold);

  for (let i = 0; i < 7; i++) {
    const bz = -3.4 + i * 1.85;
    const barrel = addCylMesh(g, 0.68, 0.68, 1.82, 8, 21.4, bY + 0.7, bz, p.woodOak);
    barrel.rotation.z = Math.PI * 0.5;
    const hoop = addCylMesh(g, 0.72, 0.72, 0.16, 8, 21.4, bY + 0.7, bz, p.iron);
    hoop.rotation.z = Math.PI * 0.5;
  }
  for (let i = 0; i < 4; i++) {
    const topBarrel = addCylMesh(
      g,
      0.68,
      0.68,
      1.82,
      8,
      21.4,
      bY + 1.9,
      -2.45 + i * 1.85,
      p.woodCedar
    );
    topBarrel.rotation.z = Math.PI * 0.5;
  }
  addBoxMesh(g, 1.7, 1.4, 1.7, 17.2, bY + 0.7, 8.8, p.woodOak, 0.18);
  addBoxMesh(g, 1.2, 1.1, 1.2, 17.2, bY + 1.98, 8.8, p.woodCedar, -0.25);

  /* ======================================================================== */
  /* 1F GROUND FLOOR (y = 0.0) — Grand Guildhall, Kitchen & Glasshouse        */
  /* ======================================================================== */
  const f1 = 0.0;

  // Monumental Stepped Stone Hearth Fireplace
  addBoxMesh(g, 2.6, 5.8, 6.0, -22.2, f1 + 2.9, -1.8, p.stoneDark);
  addBoxMesh(g, 3.15, 0.36, 6.8, -21.9, f1 + 0.18, -1.8, p.stoneLight);
  addBoxMesh(g, 2.95, 0.48, 6.4, -21.98, f1 + 3.85, -1.8, p.woodDark);
  addCandleCluster(g, -21.1, f1 + 4.12, -3.9, p);
  addCandleCluster(g, -21.1, f1 + 4.12, 0.3, p);

  addCylMesh(g, 1.02, 1.18, 0.24, 7, -21.15, f1 + 0.48, -1.8, p.glowEmber, false, false);
  const fireMesh = addConeMesh(g, 1.15, 2.35, 6, -21.15, f1 + 1.52, -1.8, p.glowFire);
  fireMesh.name = "villa_fireplace";
  const log1 = addCylMesh(g, 0.22, 0.22, 2.15, 6, -21.15, f1 + 0.62, -1.8, p.woodDark);
  log1.rotation.x = Math.PI * 0.5;
  addBoxMesh(g, 1.15, 0.76, 1.35, -21.6, f1 + 0.38, -6.8, p.woodOak);

  // Grand Layered Hearth Carpet
  addBoxMesh(g, 12.6, 0.04, 9.8, -11.2, f1 + 0.03, 1.2, p.fabricRed, 0, false, true);
  addBoxMesh(g, 11.4, 0.04, 8.6, -11.2, f1 + 0.075, 1.2, p.fabricGold, 0, false, true);
  addBoxMesh(g, 10.2, 0.04, 7.4, -11.2, f1 + 0.12, 1.2, p.fabricRed, 0, false, true);

  // Wide Plush Velvet Sofa + Throw Pillows
  addBoxMesh(g, 2.0, 0.88, 7.0, -5.4, f1 + 0.46, 1.4, p.fabricBlue);
  addBoxMesh(g, 0.5, 1.54, 7.0, -4.6, f1 + 1.16, 1.4, p.fabricBlue);
  addBoxMesh(g, 2.0, 1.18, 0.5, -5.4, f1 + 0.76, -2.0, p.fabricBlue);
  addBoxMesh(g, 2.0, 1.18, 0.5, -5.4, f1 + 0.76, 4.8, p.fabricBlue);
  addBoxMesh(g, 0.6, 0.52, 0.72, -5.08, f1 + 1.16, -0.6, p.fabricGold, 0.22);
  addBoxMesh(g, 0.6, 0.52, 0.72, -5.08, f1 + 1.16, 1.4, p.fabricCream, -0.1);
  addBoxMesh(g, 0.6, 0.52, 0.72, -5.08, f1 + 1.16, 3.4, p.fabricRed, -0.22);

  // Twin Tufted Reading Armchairs + Footstool
  addBoxMesh(g, 2.05, 0.84, 2.05, -12.4, f1 + 0.44, -5.4, p.fabricEmerald, 0.25);
  addBoxMesh(g, 2.05, 1.5, 0.44, -12.6, f1 + 1.14, -6.32, p.fabricEmerald, 0.25);
  addBoxMesh(g, 1.2, 0.48, 0.92, -11.9, f1 + 0.25, -3.6, p.fabricEmerald, 0.25);

  addBoxMesh(g, 2.0, 0.84, 2.0, -12.8, f1 + 0.44, 7.6, p.fabricPurple, -0.35);
  addBoxMesh(g, 2.0, 1.5, 0.44, -13.15, f1 + 1.14, 8.5, p.fabricPurple, -0.35);

  // Carved Oak D&D Campaign Battle Table (-11.2, 1.4)
  addBoxMesh(g, 3.6, 0.24, 5.2, -11.2, f1 + 0.9, 1.4, p.woodOak);
  for (const lx of [-1.48, 1.48]) {
    for (const lz of [-2.2, 2.2]) {
      addBoxMesh(g, 0.24, 0.86, 0.24, -11.2 + lx, f1 + 0.43, 1.4 + lz, p.woodDark);
    }
  }
  addBoxMesh(g, 2.85, 0.04, 4.0, -11.2, f1 + 1.05, 1.4, p.parchment, 0.04, false, true);
  addCandleCluster(g, -10.2, f1 + 1.07, 3.0, p);

  // Tall Bookcase, Grandfather Clock, Bard Harp & Banners
  addBookshelf(g, -20.8, f1, -12.2, 3.8, 5.2, 1.0, p);
  addBoxMesh(g, 1.2, 4.6, 0.84, -11.9, f1 + 2.3, -12.4, p.woodDark);
  const clockFace = addCylMesh(g, 0.42, 0.42, 0.1, 12, -11.9, f1 + 3.8, -11.92, p.fabricCream, false, false);
  clockFace.rotation.x = Math.PI * 0.5;
  addCylMesh(g, 0.2, 0.2, 0.08, 8, -11.9, f1 + 1.9, -11.92, p.gold);
  addBoxMesh(g, 0.22, 2.05, 0.26, -19.2, f1 + 1.05, 6.6, p.gold);
  addBoxMesh(g, 1.05, 0.22, 0.22, -18.7, f1 + 2.02, 6.6, p.gold);
  addBanner(g, 1.24, f1 + 4.1, -4.4, p.fabricPurple, p, -Math.PI * 0.5);
  addBanner(g, 1.96, f1 + 4.1, -4.4, p.fabricRed, p, Math.PI * 0.5);

  // Grand 12-Candle Wrought-Iron Chandelier
  const chandelier = new THREE.Group();
  chandelier.position.set(-11.2, f1 + 5.45, 1.4);
  addCylMesh(chandelier, 0.09, 0.09, 1.4, 6, 0, 0.7, 0, p.iron);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.12, 6, 22), p.iron);
  ring.rotation.x = Math.PI * 0.5;
  chandelier.add(ring);
  for (let c = 0; c < 12; c++) {
    const a = (c / 12) * Math.PI * 2;
    addCylMesh(
      chandelier,
      0.1,
      0.1,
      0.4,
      6,
      Math.cos(a) * 2.35,
      0.26,
      Math.sin(a) * 2.35,
      p.glowLantern,
      false,
      false
    );
  }
  g.add(chandelier);

  // WEST 1F HERB CONSERVATORY FURNISHINGS (x = -31.8 .. -24.8)
  addBoxMesh(g, 1.65, 1.12, 8.2, -30.4, f1 + 0.44, -3.0, p.woodOak);
  for (let hp = 0; hp < 7; hp++) {
    addPottedPlant(
      g,
      -30.4,
      f1 + 1.02,
      -6.5 + hp * 1.18,
      p,
      hp % 2 === 0 ? p.flowerViolet : p.glowPotionGreen,
      0.88
    );
  }
  addBoxMesh(g, 4.4, 1.7, 1.04, -27.8, f1 + 0.72, -8.5, p.woodDark);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const log = addCylMesh(
        g,
        0.15,
        0.15,
        0.92,
        5,
        -29.5 + col * 0.48,
        f1 + 0.26 + row * 0.4,
        -8.5,
        p.woodCedar
      );
      log.rotation.x = Math.PI * 0.5;
    }
  }
  addPottedPlant(g, -30.2, f1 - 0.12, 7.0, p, p.flowerPink, 1.45);
  addPottedPlant(g, -27.2, f1 - 0.12, 8.2, p, p.flowerGold, 1.2);

  // EAST WING — Grand Tavern Banquet Hall & Kitchen
  addBoxMesh(g, 11.0, 0.3, 3.5, 12.6, f1 + 1.24, 3.8, p.woodOak);
  addBoxMesh(g, 10.2, 0.04, 1.2, 12.6, f1 + 1.42, 3.8, p.fabricRed, 0, false, true);
  for (const lx of [-4.6, 4.6]) {
    addBoxMesh(g, 0.4, 1.2, 2.8, 12.6 + lx, f1 + 0.6, 3.8, p.woodDark);
  }
  addBoxMesh(g, 9.4, 0.2, 0.8, 12.6, f1 + 0.62, 1.35, p.woodOak);
  addBoxMesh(g, 9.4, 0.2, 0.8, 12.6, f1 + 0.62, 6.25, p.woodOak);
  for (const hx of [6.0, 19.2]) {
    addBoxMesh(g, 1.0, 0.64, 1.0, hx, f1 + 0.32, 3.8, p.woodOak);
    addBoxMesh(g, 0.2, 1.65, 1.0, hx + (hx < 12 ? -0.44 : 0.44), f1 + 1.02, 3.8, p.woodDark);
  }
  addCylMesh(g, 0.26, 0.36, 0.78, 6, 12.6, f1 + 1.78, 3.8, p.gold);
  addCylMesh(g, 0.1, 0.1, 0.36, 6, 12.6, f1 + 2.32, 3.8, p.glowLantern, false, false);
  addCylMesh(g, 0.96, 0.82, 0.22, 8, 9.4, f1 + 1.54, 3.8, p.copper);
  addCylMesh(g, 0.5, 0.5, 0.3, 8, 15.8, f1 + 1.58, 3.6, p.flowerGold);
  for (const gx of [-3.6, -1.2, 1.2, 3.6]) {
    addCylMesh(g, 0.12, 0.08, 0.3, 6, 12.6 + gx, f1 + 1.56, 2.7, p.gold);
    addCylMesh(g, 0.12, 0.08, 0.3, 6, 12.6 + gx, f1 + 1.56, 4.9, p.gold);
  }

  // Kitchen Counter, Prep Island, Copper Pots & Hearth Oven
  addBoxMesh(g, 12.2, 1.3, 1.75, 11.6, f1 + 0.65, -11.9, p.woodDark);
  addBoxMesh(g, 12.4, 0.18, 1.88, 11.6, f1 + 1.39, -11.9, p.stoneLight);
  addBoxMesh(g, 9.2, 0.14, 0.14, 11.6, f1 + 4.55, -11.75, p.iron);
  for (let cp = 0; cp < 8; cp++) {
    addCylMesh(g, 0.28, 0.24, 0.4, 6, 7.8 + cp * 1.08, f1 + 4.12, -11.75, p.copper);
  }
  addBoxMesh(g, 4.2, 1.16, 1.75, 11.8, f1 + 0.58, -4.8, p.woodOak);
  addBoxMesh(g, 4.4, 0.18, 1.9, 11.8, f1 + 1.26, -4.8, p.woodCedar);
  addBoxMesh(g, 1.05, 0.08, 0.74, 11.0, f1 + 1.4, -4.8, p.parchment);

  addBoxMesh(g, 3.1, 3.7, 2.35, 20.6, f1 + 1.85, -11.5, p.stoneDark);
  addConeMesh(g, 2.05, 3.0, 4, 20.6, f1 + 5.2, -11.5, p.stoneWall, Math.PI * 0.25);
  addBoxMesh(g, 1.6, 1.15, 0.28, 20.6, f1 + 1.78, -10.25, p.glowFire, 0, false, false);
  addCylMesh(g, 0.45, 0.54, 0.94, 6, 3.8, f1 + 0.47, -11.2, p.fabricCream);
  addCylMesh(g, 0.38, 0.48, 0.8, 6, 4.8, f1 + 0.4, -11.5, p.parchment);

  /* ======================================================================== */
  /* 2F SECOND FLOOR (y = 7.07) — Master Suite, Grand Bathhouse & Study       */
  /* ======================================================================== */
  const f2 = 7.07;
  const f2Bath = f2 + 0.105;

  // WEST WING — Master Suite
  addBoxMesh(g, 5.0, 0.76, 6.2, -14.0, f2 + 0.42, -3.0, p.woodDark);
  addBoxMesh(g, 4.62, 0.5, 5.75, -14.0, f2 + 1.04, -3.0, p.fabricCream);
  addBoxMesh(g, 4.68, 0.54, 3.8, -14.0, f2 + 1.08, -1.95, p.fabricRed);
  addBoxMesh(g, 4.7, 0.16, 0.78, -14.0, f2 + 1.38, -0.4, p.fabricGold);
  addBoxMesh(g, 1.6, 0.34, 0.92, -15.05, f2 + 1.48, -5.15, p.fabricCream);
  addBoxMesh(g, 1.6, 0.34, 0.92, -12.95, f2 + 1.48, -5.15, p.fabricCream);
  for (const px of [-2.36, 2.36]) {
    for (const pz of [-2.96, 2.96]) {
      addBoxMesh(g, 0.24, 4.5, 0.24, -14.0 + px, f2 + 2.3, -3.0 + pz, p.woodDark);
      addBoxMesh(g, 0.46, 3.45, 0.46, -14.0 + px * 0.9, f2 + 2.75, -3.0 + pz * 0.9, p.fabricPurple);
    }
  }
  addBoxMesh(g, 5.25, 0.26, 6.42, -14.0, f2 + 4.68, -3.0, p.fabricGold);

  addBoxMesh(g, 3.2, 0.82, 1.15, -14.0, f2 + 0.41, 1.8, p.woodOak);
  addBoxMesh(g, 8.0, 0.05, 4.4, -14.0, f2 + 0.04, 4.4, p.fabricBlue, 0, false, true);
  for (const nx of [-17.6, -10.4]) {
    addBoxMesh(g, 1.12, 0.96, 1.12, nx, f2 + 0.48, -5.2, p.woodOak);
    addCylMesh(g, 0.3, 0.22, 0.58, 6, nx, f2 + 1.26, -5.2, p.glowLantern, false, false);
  }
  addBoxMesh(g, 1.6, 4.0, 3.9, -22.2, f2 + 2.0, 5.8, p.woodDark);
  addBoxMesh(g, 2.3, 1.1, 1.06, -8.8, f2 + 0.55, 8.4, p.woodOak);
  addBoxMesh(g, 1.65, 1.7, 0.14, -8.8, f2 + 2.05, 7.9, p.gold);
  addBoxMesh(g, 1.44, 1.48, 0.06, -8.8, f2 + 2.05, 8.0, p.glass);
  addCylMesh(g, 0.44, 0.44, 0.62, 8, -8.8, f2 + 0.31, 9.6, p.fabricRed);
  addBoxMesh(g, 3.5, 2.05, 0.1, -9.6, f2 + 3.6, -13.02, p.gold);
  addBoxMesh(g, 3.1, 1.66, 0.06, -9.6, f2 + 3.6, -12.94, p.foliageMid);

  // CENTER 2F — LUXURY GRAND BATHHOUSE
  addBoxMesh(g, 5.0, 1.22, 2.35, 0.0, f2Bath + 0.74, -8.6, p.copper);
  addBoxMesh(g, 4.5, 0.14, 1.9, 0.0, f2Bath + 1.3, -8.6, p.waterPool, 0, false, false);
  for (const lx of [-2.0, 2.0]) {
    for (const lz of [-0.88, 0.88]) {
      addCylMesh(g, 0.15, 0.18, 0.3, 6, lx, f2Bath + 0.15, -8.6 + lz, p.gold);
    }
  }
  addBoxMesh(g, 0.62, 0.08, 2.48, 0.3, f2Bath + 1.4, -8.6, p.woodOak);
  addCylMesh(g, 0.11, 0.11, 0.28, 6, 0.3, f2Bath + 1.58, -8.25, p.glowPotionPink, false, false);
  addCylMesh(g, 0.11, 0.13, 0.8, 6, -2.1, f2Bath + 1.66, -8.6, p.gold);
  addCandleCluster(g, 2.24, f2Bath + 1.36, -9.45, p);
  addCandleCluster(g, 2.24, f2Bath + 1.36, -7.75, p);

  const bathSteam = new THREE.Group();
  bathSteam.position.set(0.0, f2Bath + 1.75, -8.6);
  for (let s = 0; s < 6; s++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44 + s * 0.05, 0), p.steam);
    puff.position.set((s - 2.5) * 0.64, s * 0.3, (s % 2 - 0.5) * 0.44);
    bathSteam.add(puff);
  }
  g.add(bathSteam);

  for (const sz of [-1.2, 2.4]) {
    addCylMesh(g, 0.3, 0.44, 1.18, 8, -4.5, f2Bath + 0.59, sz, p.stoneLight);
    addCylMesh(g, 0.84, 0.52, 0.42, 8, -4.5, f2Bath + 1.32, sz, p.tileBath);
    addBoxMesh(g, 0.12, 1.98, 1.62, -5.88, f2Bath + 2.9, sz, p.gold);
    addBoxMesh(g, 0.06, 1.76, 1.42, -5.8, f2Bath + 2.9, sz, p.glass);
  }
  addPottedPlant(g, -4.2, f2Bath, 8.2, p, p.flowerViolet, 1.2);

  addBoxMesh(g, 0.96, 0.74, 1.08, 4.4, f2Bath + 0.37, 1.0, p.stoneLight);
  addBoxMesh(g, 0.9, 0.1, 0.96, 4.4, f2Bath + 0.8, 1.0, p.woodOak);
  addBoxMesh(g, 0.52, 1.55, 0.96, 5.0, f2Bath + 1.22, 1.0, p.stoneLight);
  addBoxMesh(g, 2.4, 3.2, 0.18, 4.25, f2Bath + 1.6, -1.7, p.woodOak);

  addBoxMesh(g, 11.8, 0.14, 0.34, 0.0, f2Bath + 0.08, 12.8, p.woodDark);
  addBoxMesh(g, 1.25, 0.7, 0.9, -4.2, f2Bath + 0.35, 5.2, p.woodOak);
  addBoxMesh(g, 0.98, 0.18, 0.74, -4.2, f2Bath + 0.8, 5.2, p.fabricCream);
  addBoxMesh(g, 0.9, 0.16, 0.68, -4.2, f2Bath + 0.98, 5.2, p.fabricTeal);
  addBoxMesh(g, 3.6, 0.05, 1.9, 0.0, f2Bath + 0.04, -4.4, p.fabricBlue, 0, false, true);

  // EAST WING — Archmage Study & Covered East Balcony
  addBoxMesh(g, 4.8, 0.26, 2.45, 14.8, f2 + 1.26, -1.8, p.woodOak);
  for (const lx of [-2.05, 2.05]) {
    addBoxMesh(g, 0.3, 1.22, 2.05, 14.8 + lx, f2 + 0.61, -1.8, p.woodDark);
  }
  addBoxMesh(g, 1.25, 0.74, 1.25, 14.8, f2 + 0.38, 0.75, p.fabricPurple);
  addBoxMesh(g, 1.25, 1.75, 0.28, 14.8, f2 + 1.15, 1.35, p.fabricPurple);
  addBoxMesh(g, 9.0, 0.05, 6.4, 14.8, f2 + 0.04, -0.4, p.fabricPurple, 0, false, true);

  addCylMesh(g, 0.26, 0.36, 0.28, 8, 16.2, f2 + 1.54, -1.8, p.gold);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), p.glowArcane);
  orb.position.set(16.2, f2 + 2.12, -1.8);
  g.add(orb);
  addBoxMesh(g, 1.1, 0.1, 0.78, 13.8, f2 + 1.45, -1.8, p.parchment, 0.16);
  addCandleCluster(g, 12.9, f2 + 1.39, -2.5, p);

  addCylMesh(g, 0.2, 0.46, 1.38, 8, 9.2, f2 + 0.69, 5.8, p.woodDark);
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), p.fabricBlue);
  globe.position.set(9.2, f2 + 2.04, 5.8);
  g.add(globe);
  const globeRing = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.055, 6, 16), p.gold);
  globeRing.position.set(9.2, f2 + 2.04, 5.8);
  globeRing.rotation.x = 0.4;
  g.add(globeRing);

  addBookshelf(g, 9.8, f2, -12.4, 4.0, 5.0, 0.95, p);
  addBookshelf(g, 19.8, f2, -12.4, 4.0, 5.0, 0.95, p);
  for (const lx of [18.7, 19.7]) {
    const rail = addBoxMesh(g, 0.1, 4.9, 0.12, lx, f2 + 2.4, -11.3, p.woodCedar);
    rail.rotation.x = -0.22;
  }
  for (let r = 0; r < 8; r++) {
    addBoxMesh(g, 1.0, 0.06, 0.1, 19.2, f2 + 0.6 + r * 0.56, -11.0 - r * 0.12, p.woodOak);
  }

  // COVERED EAST BALCONY FURNISHINGS (x = 24.8 .. 33.0)
  addCylMesh(g, 1.2, 1.2, 0.18, 8, 28.8, f2 + 1.06, 0.6, p.woodOak);
  addCylMesh(g, 0.2, 0.38, 1.06, 6, 28.8, f2 + 0.53, 0.6, p.iron);
  addCylMesh(g, 0.22, 0.28, 0.34, 7, 28.8, f2 + 1.32, 0.6, p.copper);
  for (const cz of [-1.8, 3.0]) {
    addBoxMesh(g, 1.15, 0.66, 1.15, 28.8, f2 + 0.34, cz, p.woodOak);
    addBoxMesh(g, 0.96, 0.15, 0.96, 28.8, f2 + 0.74, cz, p.fabricRed);
  }
  addCylMesh(g, 0.12, 0.4, 1.95, 6, 31.0, f2 + 0.98, -6.6, p.woodDark);
  const scope = addCylMesh(g, 0.22, 0.14, 2.15, 8, 31.55, f2 + 2.18, -6.6, p.gold);
  scope.rotation.z = -1.18;
  addPottedPlant(g, 31.2, f2, 8.0, p, p.flowerPink, 1.45);
  addPottedPlant(g, 26.2, f2, -7.8, p, p.flowerGold, 1.25);

  /* ======================================================================== */
  /* 3F ATTIC OBSERVATORY & LUSH SKY GARDEN (y = 13.87)                       */
  /* ======================================================================== */
  const f3 = 13.87;

  const astrolabe = new THREE.Group();
  astrolabe.position.set(-11.2, f3 + 3.2, 1.0);
  addCylMesh(astrolabe, 0.4, 0.78, 2.35, 8, 0, -1.94, 0, p.woodDark);
  addCylMesh(astrolabe, 0.96, 1.12, 0.28, 8, 0, -3.06, 0, p.stoneLight);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.105, 6, 24), p.gold);
  const astrolabeInner = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.082, 6, 18), p.copper);
  astrolabeInner.rotation.y = Math.PI * 0.5;
  const thirdRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.06, 6, 14), p.brass);
  thirdRing.rotation.x = Math.PI * 0.35;
  const astrolabeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), p.glowLantern);
  astrolabeCore.name = "villa_astrolabe";
  astrolabe.add(outerRing, astrolabeInner, thirdRing, astrolabeCore);
  g.add(astrolabe);

  addBoxMesh(g, 2.2, 1.65, 0.08, -4.2, f3 + 2.15, -6.8, p.woodDark, -0.35);
  addBoxMesh(g, 1.98, 1.44, 0.06, -4.15, f3 + 2.15, -6.72, p.fabricBlue, -0.35);
  addCylMesh(g, 0.1, 0.12, 2.8, 5, -4.22, f3 + 1.4, -6.96, p.woodOak);

  addBoxMesh(g, 8.2, 0.05, 5.6, -11.2, f3 + 0.04, 1.0, p.fabricPurple, 0, false, true);
  addBoxMesh(g, 4.9, 0.7, 2.5, -17.6, f3 + 0.36, 7.2, p.woodOak);
  addBoxMesh(g, 4.6, 0.4, 2.22, -17.6, f3 + 0.9, 7.2, p.fabricBlue);
  addBoxMesh(g, 0.96, 0.38, 1.1, -19.2, f3 + 1.24, 7.2, p.fabricGold, 0.16);
  addBoxMesh(g, 0.82, 0.34, 0.92, -18.0, f3 + 1.18, 6.5, p.fabricRed, -0.2);
  addBoxMesh(g, 2.25, 1.2, 1.42, -4.4, f3 + 0.6, 7.8, p.woodDark, 0.18);
  addBoxMesh(g, 1.82, 0.96, 1.18, -4.4, f3 + 1.68, 7.8, p.copper, -0.14);
  addBookshelf(g, -17.6, f3, -12.3, 4.8, 4.0, 0.9, p);

  // EAST SKY GARDEN (x in [2.2, 23.2])
  for (const px of [4.6, 19.8]) {
    for (const pz of [-10.2, 0.8]) {
      addBoxMesh(g, 0.42, 4.8, 0.42, px, f3 + 2.4, pz, p.woodDark);
    }
  }
  for (let pz = -10.4; pz <= 1.0; pz += 1.26) {
    addBoxMesh(g, 16.4, 0.26, 0.3, 12.2, f3 + 4.88, pz, p.woodOak);
  }
  addBoxMesh(g, 15.6, 0.48, 10.4, 12.2, f3 + 5.25, -4.7, p.foliageBright);
  for (let wx = 5.4; wx <= 19.0; wx += 1.94) {
    addConeMesh(g, 0.46, 1.25, 5, wx, f3 + 4.3, 1.0, p.blossomPink);
  }
  for (const lx of [5.2, 7.5, 9.8, 12.2, 14.6, 16.9, 19.2]) {
    addCylMesh(g, 0.19, 0.15, 0.36, 6, lx, f3 + 4.2, -0.1, p.glowLantern, false, false);
  }

  const beds: Array<[number, number, number, number]> = [
    [6.4, -10.8, 7.0, 2.3],
    [17.2, -10.8, 7.6, 2.3],
    [20.6, 5.0, 2.6, 11.4],
    [6.8, 10.4, 8.2, 2.3],
  ];
  const flowerPalette = [p.flowerPink, p.flowerGold, p.flowerViolet, p.glowArcane];
  for (let b = 0; b < beds.length; b++) {
    const [bx, bz, bw, bd] = beds[b];
    addBoxMesh(g, bw, 0.82, bd, bx, f3 + 0.41, bz, p.stoneLight);
    addBoxMesh(g, bw - 0.38, 0.24, bd - 0.38, bx, f3 + 0.82, bz, p.dirt);
    for (let f = 0; f < 10; f++) {
      const fx = bx + ((f % 5) - 2.0) * (bw * 0.18);
      const fz = bz + (Math.floor(f / 5) - 0.5) * (bd * 0.34);
      const h = 0.8 + (f % 3) * 0.26;
      addConeMesh(g, 0.4, h, 5, fx, f3 + 0.94 + h * 0.45, fz, p.foliageMid);
      const blossom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.3, 0),
        flowerPalette[(b + f) % flowerPalette.length]
      );
      blossom.position.set(fx, f3 + 1.15 + h, fz);
      g.add(blossom);
    }
  }

  // Ornamental Cherry-Blossom Tree
  addCylMesh(g, 0.4, 0.62, 3.8, 6, 18.8, f3 + 1.9, -9.8, p.woodDark);
  const blossomClusters: Array<[number, number, number, number]> = [
    [18.8, f3 + 4.9, -9.8, 2.85],
    [16.6, f3 + 4.2, -8.9, 1.95],
    [20.5, f3 + 4.4, -8.7, 1.85],
  ];
  for (const [cx, cy, cz, cr] of blossomClusters) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(cr, 0), p.blossomPink);
    crown.position.set(cx, cy, cz);
    crown.castShadow = true;
    g.add(crown);
  }

  // Interactive Two-Tier Enchanted Stone Fountain + Garden Bench
  addCylMesh(g, 2.55, 2.8, 0.94, 10, 12.2, f3 + 0.47, 5.2, p.stoneLight);
  const fountainWater = addCylMesh(
    g,
    2.2,
    2.2,
    0.16,
    10,
    12.2,
    f3 + 0.96,
    5.2,
    p.waterPool,
    false,
    false
  );
  fountainWater.name = "villa_fountain";
  addCylMesh(g, 0.4, 0.54, 1.7, 8, 12.2, f3 + 1.66, 5.2, p.stoneLight);
  addCylMesh(g, 1.15, 0.64, 0.32, 8, 12.2, f3 + 2.42, 5.2, p.stoneLight);
  addCylMesh(g, 0.92, 0.92, 0.1, 8, 12.2, f3 + 2.62, 5.2, p.waterFoam, false, false);
  addConeMesh(g, 0.32, 0.76, 6, 12.2, f3 + 3.12, 5.2, p.glowArcane);

  addBoxMesh(g, 5.0, 0.66, 1.12, 12.2, f3 + 0.33, -4.2, p.woodOak);
  addBoxMesh(g, 5.0, 0.84, 0.2, 12.2, f3 + 1.06, -4.72, p.woodDark);
  addCylMesh(g, 0.74, 0.74, 0.12, 8, 12.2, f3 + 0.88, -1.6, p.woodOak);
  addCylMesh(g, 0.16, 0.24, 0.86, 6, 12.2, f3 + 0.43, -1.6, p.iron);

  return {
    fireMesh,
    arcaneCrystal,
    cauldronLiquid,
    cauldronBubbles,
    runeRing,
    innerRuneRing,
    chandelier,
    astrolabe,
    astrolabeInner,
    astrolabeCore,
    bathSteam,
    floatingBooks,
    fountainWater,
  };
}
