import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
} from "./villaPrimitives";

export interface B2UnderdarkRefs {
  mythallarCore: THREE.Mesh;
  mythallarRings: THREE.Group;
  swordInStone: THREE.Mesh;
  dwarfAnvil: THREE.Mesh;
  forgeFlame: THREE.Mesh;
  underdarkRiver: THREE.Mesh;
}

/**
 * Builds the brand-new B2 Deep Underdark Vault & Dwarven Magma Forge (y = -12.8 .. -6.2):
 * - Centerpiece: Subterranean glowing arcane mana canal crossed by a carved stone bridge,
 *   leading to a Levitating Netherese Mythallar Core (clickable!) and Ancient Dragon Skeleton ribs
 * - West Wing: Forgotten Crypt with carved sarcophagi, soul-fire braziers, glowing crystal veins,
 *   and the Legendary Sword in the Stone (clickable!)
 * - East Wing: Deep Dwarven Magma Forge, Mithril Anvil (clickable!), glowing ore minecart on rails,
 *   stone tunnel arch, and giant bioluminescent Underdark mushrooms
 */
export function buildB2Underdark(root: THREE.Group, p: VillaPalette): B2UnderdarkRefs {
  const grp = new THREE.Group();
  grp.name = "villa_b2_underdark";
  root.add(grp);

  const b2Y = -12.8;

  /* ======================================================================== */
  /* 1. CENTERPIECE: SUBTERRANEAN ARCANE RIVER, BRIDGE & MYTHALLAR CORE       */
  /* ======================================================================== */
  // Glowing subterranean mana canal running N-S through B2 center (x in [-4.4, 4.4])
  const underdarkRiver = addBoxMesh(
    grp,
    8.2,
    0.16,
    24.6,
    0,
    b2Y + 0.08,
    0.2,
    p.waterStream,
    0,
    false,
    false
  );
  // Stone canal curbs flanking the river
  addBoxMesh(grp, 0.72, 0.42, 24.8, -4.45, b2Y + 0.21, 0.2, p.stoneAncient);
  addBoxMesh(grp, 0.72, 0.42, 24.8, 4.45, b2Y + 0.21, 0.2, p.stoneAncient);

  // Carved Stone Arch Bridge crossing the canal at z = 6.2
  for (let s = -4; s <= 4; s++) {
    const archY = b2Y + 0.92 - s * s * 0.04;
    addBoxMesh(grp, 1.15, 0.24, 3.4, s * 1.12, archY, 6.2, p.stoneLight);
  }
  addBoxMesh(grp, 9.8, 0.22, 0.24, 0, b2Y + 1.48, 4.6, p.stoneWall);
  addBoxMesh(grp, 9.8, 0.22, 0.24, 0, b2Y + 1.48, 7.8, p.stoneWall);

  // Central Ritual Island in the subterranean river (z = -2.4)
  addCylMesh(grp, 3.6, 4.1, 0.72, 8, 0, b2Y + 0.36, -2.4, p.stoneAncient);
  const b2Rune = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.85, 28), p.glowRuneGold);
  b2Rune.rotation.x = -Math.PI * 0.5;
  b2Rune.position.set(0, b2Y + 0.76, -2.4);
  grp.add(b2Rune);

  // Levitating Netherese Mythallar Arcane Core (clickable!)
  const mythallarCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), p.glowArcane);
  mythallarCore.position.set(0, b2Y + 3.4, -2.4);
  mythallarCore.name = "villa_mythallar";
  grp.add(mythallarCore);

  const mythallarRings = new THREE.Group();
  mythallarRings.position.set(0, b2Y + 3.4, -2.4);
  const mr1 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.09, 6, 20), p.gold);
  const mr2 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.075, 6, 18), p.crystalViolet);
  mr2.rotation.x = Math.PI * 0.5;
  mythallarRings.add(mr1, mr2);
  grp.add(mythallarRings);

  // Giant Ancient Dragon Ribcage Arching over the Northern Canal (z = -9.2)
  for (let r = 0; r < 5; r++) {
    const rz = -10.8 + r * 1.35;
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(3.8 - Math.abs(r - 2) * 0.35, 0.22, 5, 10, Math.PI),
      p.fabricCream
    );
    rib.position.set(0, b2Y + 0.6, rz);
    grp.add(rib);
  }

  /* ======================================================================== */
  /* 2. WEST WING: FORGOTTEN CRYPT, SARCOPHAGI & SWORD IN THE STONE           */
  /* ======================================================================== */
  // Twin Carved Stone Sarcophagi with Glowing Green Soul-Braziers
  for (const [sx, sz] of [
    [-16.5, -6.5],
    [-16.5, 2.5],
  ] as Array<[number, number]>) {
    addBoxMesh(grp, 4.2, 0.95, 2.0, sx, b2Y + 0.475, sz, p.stoneAncient);
    addBoxMesh(grp, 3.8, 0.34, 1.65, sx, b2Y + 1.12, sz, p.stoneLight);
    addBoxMesh(grp, 2.4, 0.12, 0.42, sx, b2Y + 1.35, sz, p.gold);
  }
  for (const bz of [-9.5, -2.0, 5.5]) {
    addCylMesh(grp, 0.42, 0.54, 1.35, 6, -21.0, b2Y + 0.675, bz, p.stoneDark);
    addConeMesh(grp, 0.34, 0.72, 6, -21.0, b2Y + 1.72, bz, p.glowPotionGreen);
  }

  // Legendary Sword in the Stone Pedestal (x = -11.2, z = 4.6, clickable!)
  addCylMesh(grp, 2.2, 2.6, 0.45, 8, -11.2, b2Y + 0.225, 4.6, p.stoneMoss);
  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 0), p.stoneAncient);
  boulder.position.set(-11.2, b2Y + 1.15, 4.6);
  boulder.scale.set(1.2, 0.85, 1.1);
  grp.add(boulder);
  const swordInStone = addBoxMesh(
    grp,
    0.2,
    2.45,
    0.09,
    -11.2,
    b2Y + 2.85,
    4.6,
    p.glowArcane,
    0.2,
    false,
    false
  );
  swordInStone.name = "villa_sword_stone";
  addBoxMesh(grp, 0.85, 0.16, 0.16, -11.2, b2Y + 3.45, 4.6, p.gold, 0.2);
  addCylMesh(grp, 0.12, 0.12, 0.16, 6, -11.2, b2Y + 4.12, 4.6, p.crystalViolet);

  // Giant Bioluminescent Underdark Crystal Clusters & Ceiling Stalactites
  for (const [cx, cz, mat] of [
    [-21.8, -11.2, p.crystalViolet],
    [-10.4, -11.4, p.glowArcane],
    [10.2, -11.4, p.crystalViolet],
    [21.6, 8.8, p.glowPotionPink],
  ] as Array<[number, number, THREE.Material]>) {
    const c1 = addConeMesh(grp, 0.75, 3.2, 5, cx, b2Y + 1.6, cz, mat);
    c1.rotation.z = 0.2;
    const c2 = addConeMesh(grp, 0.55, 2.2, 5, cx + 0.8, b2Y + 1.1, cz + 0.4, mat);
    c2.rotation.z = -0.3;
  }
  for (const [stx, stz] of [
    [-14.0, -4.0],
    [-7.5, 2.0],
    [7.8, -4.5],
    [15.2, 3.0],
  ] as Array<[number, number]>) {
    const stal = addConeMesh(grp, 0.65, 2.1, 5, stx, b2Y + 5.55, stz, p.stoneDark);
    stal.rotation.x = Math.PI;
  }

  /* ======================================================================== */
  /* 3. EAST WING: DEEP DWARVEN MAGMA FORGE, MITHRIL ANVIL & MINECART         */
  /* ======================================================================== */
  // Monumental Dwarven Magma Furnace along East Wall (x = 20.6, z = -3.8)
  addBoxMesh(grp, 3.6, 5.4, 6.2, 20.6, b2Y + 2.7, -3.8, p.stoneDark);
  addBoxMesh(grp, 3.9, 0.48, 6.8, 20.4, b2Y + 3.6, -3.8, p.iron);
  addBoxMesh(grp, 0.42, 2.2, 3.2, 18.65, b2Y + 1.65, -3.8, p.glowEmber, 0, false, false);
  const forgeFlame = addConeMesh(grp, 1.15, 2.35, 6, 18.9, b2Y + 1.85, -3.8, p.glowFire);

  // Legendary Dwarven Mithril Anvil (x = 13.6, z = -3.2, clickable!)
  addBoxMesh(grp, 1.8, 0.55, 1.35, 13.6, b2Y + 0.275, -3.2, p.woodDark);
  const dwarfAnvil = addBoxMesh(grp, 1.95, 0.72, 1.05, 13.6, b2Y + 0.92, -3.2, p.iron);
  dwarfAnvil.name = "villa_dwarf_anvil";
  addConeMesh(grp, 0.36, 0.9, 5, 12.25, b2Y + 1.02, -3.2, p.iron);
  const horn = grp.children[grp.children.length - 1] as THREE.Mesh;
  horn.rotation.z = Math.PI * 0.5;
  // Glowing red-hot blade cooling on the anvil
  addBoxMesh(grp, 1.35, 0.08, 0.24, 13.6, b2Y + 1.34, -3.2, p.glowFire, 0.18, false, false);

  // Iron Minecart Track & Ore Cart filled with Glowing Crystals (z = 5.4)
  for (let tx = 8.4; tx <= 21.4; tx += 1.3) {
    addBoxMesh(grp, 0.24, 0.1, 2.0, tx, b2Y + 0.06, 5.4, p.woodDark);
  }
  addBoxMesh(grp, 13.6, 0.1, 0.12, 14.9, b2Y + 0.14, 4.7, p.iron);
  addBoxMesh(grp, 13.6, 0.1, 0.12, 14.9, b2Y + 0.14, 6.1, p.iron);
  // Ore Minecart
  addBoxMesh(grp, 2.5, 1.2, 1.6, 13.2, b2Y + 1.05, 5.4, p.iron);
  addConeMesh(grp, 0.42, 0.95, 5, 12.8, b2Y + 1.85, 5.2, p.glowArcane);
  addConeMesh(grp, 0.38, 0.85, 5, 13.6, b2Y + 1.82, 5.6, p.crystalViolet);
  addConeMesh(grp, 0.34, 0.72, 5, 13.1, b2Y + 1.78, 5.7, p.glowRuneGold);

  // Giant Bioluminescent Underdark Mushrooms (East-South corner)
  for (const [mx, mz, h, mat] of [
    [9.2, 9.2, 2.2, p.glowPotionPink],
    [11.4, 10.2, 1.5, p.glowArcane],
    [7.6, 10.4, 1.2, p.crystalViolet],
  ] as Array<[number, number, number, THREE.Material]>) {
    addCylMesh(grp, 0.22, 0.32, h, 6, mx, b2Y + h * 0.5, mz, p.fabricCream);
    addConeMesh(grp, h * 0.52, h * 0.38, 7, mx, b2Y + h + h * 0.14, mz, mat);
  }

  return {
    mythallarCore,
    mythallarRings,
    swordInStone,
    dwarfAnvil,
    forgeFlame,
    underdarkRiver,
  };
}
