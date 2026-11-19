import * as THREE from "three";
import { VillaPalette, addBoxMesh, addConeMesh, addCylMesh } from "./villaPrimitives";

export interface VillaInteractiveRefs {
  fireMesh: THREE.Mesh;
  arcaneCrystal: THREE.Mesh;
  cauldronLiquid: THREE.Mesh;
  runeRing: THREE.Mesh;
  chandelier: THREE.Group;
  astrolabe: THREE.Group;
  bathSteam: THREE.Group;
  floatingBooks: THREE.Group;
}

/**
 * Indie-Game Detailed Fantasy D&D Interiors for all 4 Levels:
 * - B1 Basement: Double-ring arcane rune circle, floating spellbooks, bubbling cauldron, potion rack, weapon rack, treasure hoard, wine barrels
 * - 1F Ground Floor: Grand stone hearth with dragon crest, velvet sofa + cushions + D&D tabletop miniatures, feast dining table + hanging copper pots
 * - 2F Second Floor: Canopy bed + vanity dresser + paintings, full luxury bathroom (copper clawfoot tub with steam & candles, brass faucet, sink + mirror, toilet + partition), wizard study + balcony telescope & flowers
 * - 3F Attic & Rooftop Garden: Rotating brass astrolabe, cozy pillowed daybed, pergola with glowing string lanterns, cherry blossom tree, vibrant flower planters & garden fountain
 */
export function buildVillaInteriors(root: THREE.Group, p: VillaPalette): VillaInteractiveRefs {
  const g = new THREE.Group();
  g.name = "villa_interiors";
  root.add(g);

  /* ======================================================================== */
  /* B1 BASEMENT — D&D Alchemy Workshop, Rune Circle & Adventurer Vault       */
  /* ======================================================================== */
  const bY = -4.2;

  // Double-ring Glowing Arcane Rune Circle
  const runeRing = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.15, 28), p.glowArcane);
  runeRing.rotation.x = -Math.PI * 0.5;
  runeRing.position.set(-4.2, bY + 0.06, 1.4);
  g.add(runeRing);
  const innerRune = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.08, 16), p.glowPotionPink);
  innerRune.rotation.x = -Math.PI * 0.5;
  innerRune.position.set(-4.2, bY + 0.07, 1.4);
  g.add(innerRune);

  // Floating Arcane Crystal (clickable!) + Orbiting Floating Spellbooks
  const arcaneCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.66, 0), p.glowArcane);
  arcaneCrystal.position.set(-4.2, bY + 1.9, 1.4);
  arcaneCrystal.name = "villa_arcane_crystal";
  g.add(arcaneCrystal);

  const floatingBooks = new THREE.Group();
  floatingBooks.position.set(-4.2, bY + 2.0, 1.4);
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * Math.PI * 2;
    addBoxMesh(
      floatingBooks,
      0.52,
      0.1,
      0.38,
      Math.cos(a) * 1.45,
      Math.sin(b * 2) * 0.25,
      Math.sin(a) * 1.45,
      b === 0 ? p.fabricRed : b === 1 ? p.fabricBlue : p.fabricEmerald,
      a
    );
  }
  g.add(floatingBooks);

  // Bubbling Alchemy Cauldron (clickable!)
  addCylMesh(g, 0.85, 0.65, 0.98, 10, -0.6, bY + 0.55, -1.8, p.iron);
  const cauldronLiquid = addCylMesh(g, 0.72, 0.72, 0.14, 10, -0.6, bY + 1.0, -1.8, p.glowPotionGreen, false, false);
  cauldronLiquid.name = "villa_cauldron";
  addCylMesh(g, 0.58, 0.68, 0.18, 8, -0.6, bY + 0.1, -1.8, p.glowFire, false, false);

  // Alchemist Potion Rack & Workbench along Back-Left Wall
  addBoxMesh(g, 3.8, 1.0, 1.15, -5.6, bY + 0.5, -4.7, p.woodDark);
  addBoxMesh(g, 3.8, 2.3, 0.45, -5.6, bY + 2.15, -5.1, p.woodOak);
  const potionMats = [p.glowPotionGreen, p.glowPotionPink, p.glowArcane, p.glowFire];
  for (let i = 0; i < 8; i++) {
    addCylMesh(
      g,
      0.13,
      0.17,
      0.4,
      6,
      -7.0 + i * 0.4,
      bY + 1.22 + (i % 2) * 0.74,
      -4.88,
      potionMats[i % potionMats.length],
      false,
      false
    );
  }

  // Adventurer's Weapon & Shield Rack (Back-Center-Right)
  addBoxMesh(g, 2.2, 2.4, 0.35, 2.4, bY + 1.2, -5.1, p.woodDark);
  addBoxMesh(g, 0.14, 1.85, 0.08, 1.8, bY + 1.35, -4.85, p.glowArcane, 0, false, false); // Enchanted Greatsword
  addBoxMesh(g, 0.52, 0.12, 0.12, 1.8, bY + 0.85, -4.85, p.gold);
  addCylMesh(g, 0.55, 0.42, 0.12, 6, 2.9, bY + 1.4, -4.85, p.fabricRed); // Heraldic Shield

  // Adventurer's Treasure Chest & Overflowing Gold/Gem Hoard
  addBoxMesh(g, 1.9, 0.98, 1.15, 2.4, bY + 0.49, 2.2, p.woodDark, -0.22);
  addBoxMesh(g, 1.96, 0.2, 1.2, 2.4, bY + 0.98, 2.2, p.gold, -0.22);
  addCylMesh(g, 0.55, 0.7, 0.32, 8, 2.4, bY + 1.15, 2.2, p.gold);
  addConeMesh(g, 0.18, 0.34, 5, 2.1, bY + 1.38, 2.1, p.glowPotionPink);
  addConeMesh(g, 0.18, 0.34, 5, 2.7, bY + 1.38, 2.3, p.glowArcane);

  // Stacked Oak Wine Barrels along East Wall
  for (let i = 0; i < 3; i++) {
    const barrel = addCylMesh(g, 0.55, 0.55, 1.38, 8, 7.6, bY + 0.6, -1.5 + i * 1.48, p.woodOak);
    barrel.rotation.z = Math.PI * 0.5;
  }
  const topBarrel = addCylMesh(g, 0.55, 0.55, 1.38, 8, 7.6, bY + 1.56, -0.75, p.woodOak);
  topBarrel.rotation.z = Math.PI * 0.5;

  /* ======================================================================== */
  /* 1F GROUND FLOOR — Grand Hearth Hall & Tavern Feast Kitchen               */
  /* ======================================================================== */
  const f1 = 0.0;

  // Monumental Stone Hearth Fireplace with Golden Dragon Crest
  addBoxMesh(g, 1.55, 3.6, 3.4, -8.1, f1 + 1.8, -1.0, p.stoneDark);
  addBoxMesh(g, 1.8, 0.36, 3.7, -8.0, f1 + 2.5, -1.0, p.woodDark);
  // Golden shield crest above mantel
  addBoxMesh(g, 0.16, 0.85, 0.72, -7.25, f1 + 3.2, -1.0, p.gold);
  addBoxMesh(g, 0.2, 0.55, 0.45, -7.2, f1 + 3.2, -1.0, p.fabricRed);
  // Crackling Fire Flame Cone (clickable!)
  const fireMesh = addConeMesh(g, 0.68, 1.35, 6, -7.7, f1 + 0.76, -1.0, p.glowFire);
  fireMesh.name = "villa_fireplace";
  addCylMesh(g, 0.16, 0.16, 1.3, 6, -7.7, f1 + 0.22, -1.0, p.woodDark);

  // Cozy Hearth Rug, Velvet Sofa with Cushions, Armchair & D&D Campaign Map Table
  addBoxMesh(g, 5.4, 0.06, 4.6, -4.1, f1 + 0.04, 0.5, p.fabricRed, 0, false, true);
  addBoxMesh(g, 4.9, 0.07, 4.1, -4.1, f1 + 0.05, 0.5, p.fabricGold, 0, false, true);
  addBoxMesh(g, 4.5, 0.08, 3.7, -4.1, f1 + 0.06, 0.5, p.fabricRed, 0, false, true);
  // Sofa + Throw Pillows
  addBoxMesh(g, 1.38, 0.68, 3.5, -1.7, f1 + 0.36, 0.5, p.fabricBlue);
  addBoxMesh(g, 0.36, 1.15, 3.5, -1.15, f1 + 0.88, 0.5, p.fabricBlue);
  addBoxMesh(g, 1.38, 0.9, 0.36, -1.7, f1 + 0.58, -1.2, p.fabricBlue);
  addBoxMesh(g, 1.38, 0.9, 0.36, -1.7, f1 + 0.58, 2.2, p.fabricBlue);
  addBoxMesh(g, 0.45, 0.42, 0.55, -1.5, f1 + 0.88, -0.5, p.fabricGold, 0.2);
  addBoxMesh(g, 0.45, 0.42, 0.55, -1.5, f1 + 0.88, 1.5, p.fabricRed, -0.2);
  // Armchair on North side
  addBoxMesh(g, 1.48, 0.68, 1.48, -4.4, f1 + 0.36, -2.5, p.fabricEmerald, 0.25);
  addBoxMesh(g, 1.48, 1.12, 0.36, -4.5, f1 + 0.88, -3.1, p.fabricEmerald, 0.25);
  // Coffee Table with D&D Map, Miniature Tower & Glowing Candle
  addBoxMesh(g, 1.9, 0.16, 2.7, -4.1, f1 + 0.68, 0.5, p.woodOak);
  for (const lx of [-0.75, 0.75]) {
    for (const lz of [-1.1, 1.1]) {
      addBoxMesh(g, 0.16, 0.65, 0.16, -4.1 + lx, f1 + 0.32, 0.5 + lz, p.woodDark);
    }
  }
  addBoxMesh(g, 1.35, 0.04, 1.9, -4.1, f1 + 0.78, 0.5, p.fabricCream, 0.08, false, true);
  addConeMesh(g, 0.14, 0.36, 5, -4.2, f1 + 0.98, 0.2, p.gold); // D&D campaign mini
  addCylMesh(g, 0.08, 0.08, 0.24, 6, -3.7, f1 + 0.92, 0.9, p.glowLantern, false, false);

  // Hanging Wrought-Iron Chandelier
  const chandelier = new THREE.Group();
  chandelier.position.set(-4.1, f1 + 3.55, 0.5);
  addCylMesh(chandelier, 0.06, 0.06, 0.95, 6, 0, 0.48, 0, p.iron);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.08, 6, 12), p.iron);
  ring.rotation.x = Math.PI * 0.5;
  chandelier.add(ring);
  for (let c = 0; c < 6; c++) {
    const a = (c / 6) * Math.PI * 2;
    addCylMesh(chandelier, 0.09, 0.09, 0.32, 6, Math.cos(a) * 1.18, 0.18, Math.sin(a) * 1.18, p.glowLantern, false, false);
  }
  g.add(chandelier);

  // East Wing — Medieval Fantasy Kitchen & Oak Banquet Dining Table
  addBoxMesh(g, 4.6, 0.22, 2.15, 4.8, f1 + 1.05, 1.6, p.woodOak);
  for (const lx of [-1.95, 1.95]) {
    addBoxMesh(g, 0.28, 1.0, 1.75, 4.8 + lx, f1 + 0.5, 1.6, p.woodDark);
  }
  addBoxMesh(g, 4.0, 0.16, 0.58, 4.8, f1 + 0.55, 0.12, p.woodOak);
  addBoxMesh(g, 4.0, 0.16, 0.58, 4.8, f1 + 0.55, 3.08, p.woodOak);
  // Table Feast: Candelabra, Golden Platter, Wine Goblets & Cheese Wheel
  addCylMesh(g, 0.18, 0.26, 0.56, 6, 4.8, f1 + 1.42, 1.6, p.gold);
  addCylMesh(g, 0.08, 0.08, 0.28, 6, 4.8, f1 + 1.78, 1.6, p.glowLantern, false, false);
  addCylMesh(g, 0.58, 0.5, 0.14, 8, 3.6, f1 + 1.24, 1.6, p.copper); // Feast platter
  addCylMesh(g, 0.34, 0.34, 0.22, 8, 6.0, f1 + 1.28, 1.5, p.flowerGold); // Cheese wheel
  for (const gx of [-0.9, 0.9]) {
    addCylMesh(g, 0.11, 0.08, 0.26, 6, 4.8 + gx, f1 + 1.3, 1.05, p.copper);
  }
  // Kitchen Counter, Hanging Copper Pot Rack & Glowing Brick Hearth Oven
  addBoxMesh(g, 4.8, 1.1, 1.35, 4.6, f1 + 0.55, -4.85, p.woodDark);
  addBoxMesh(g, 5.0, 0.15, 1.45, 4.6, f1 + 1.15, -4.85, p.stoneLight);
  addBoxMesh(g, 3.4, 0.12, 0.12, 4.6, f1 + 3.2, -4.75, p.iron);
  for (let cp = 0; cp < 4; cp++) {
    addCylMesh(g, 0.24, 0.22, 0.32, 6, 3.4 + cp * 0.8, f1 + 2.85, -4.75, p.copper);
  }
  addBoxMesh(g, 1.85, 2.35, 1.45, 7.6, f1 + 1.18, -4.8, p.stoneDark);
  addBoxMesh(g, 0.95, 0.72, 0.22, 7.6, f1 + 1.12, -4.02, p.glowFire, 0, false, false);

  /* ======================================================================== */
  /* 2F SECOND FLOOR — Master Bedroom, Luxury Bathroom (卫生间) & Study       */
  /* ======================================================================== */
  const f2 = 4.7;

  // West Wing — Four-Poster Canopy Bed (cleanly positioned at x = -5.2, clear of stairs at x = -8.0!)
  addBoxMesh(g, 3.0, 0.58, 3.9, -5.2, f2 + 0.35, -1.5, p.woodDark);
  addBoxMesh(g, 2.75, 0.42, 3.6, -5.2, f2 + 0.82, -1.5, p.fabricCream);
  addBoxMesh(g, 2.78, 0.45, 2.3, -5.2, f2 + 0.86, -0.85, p.fabricRed);
  addBoxMesh(g, 1.0, 0.26, 0.62, -5.85, f2 + 1.14, -2.85, p.fabricCream);
  addBoxMesh(g, 1.0, 0.26, 0.62, -4.55, f2 + 1.14, -2.85, p.fabricCream);
  for (const px of [-1.4, 1.4]) {
    for (const pz of [-1.85, 1.85]) {
      addBoxMesh(g, 0.16, 2.9, 0.16, -5.2 + px, f2 + 1.5, -1.5 + pz, p.woodDark);
    }
  }
  addBoxMesh(g, 3.1, 0.16, 4.0, -5.2, f2 + 2.98, -1.5, p.fabricGold);
  // Bedside Rug, Nightstand Lamp, Framed Wall Painting & Carved Wardrobe
  addBoxMesh(g, 3.6, 0.05, 1.8, -5.2, f2 + 0.06, 1.6, p.fabricBlue, 0, false, true);
  addBoxMesh(g, 0.82, 0.78, 0.82, -3.2, f2 + 0.4, -2.9, p.woodOak);
  addCylMesh(g, 0.22, 0.16, 0.42, 6, -3.2, f2 + 1.0, -2.9, p.glowLantern, false, false);
  addBoxMesh(g, 1.05, 2.7, 2.3, -8.1, f2 + 1.35, 2.8, p.woodDark);
  // Framed landscape painting above headboard
  addBoxMesh(g, 2.0, 1.3, 0.1, -5.2, f2 + 2.4, -5.62, p.gold);
  addBoxMesh(g, 1.75, 1.05, 0.12, -5.2, f2 + 2.4, -5.6, p.foliageMid);

  // Center 2F — LUXURY FANTASY BATHROOM (卫生间: x in [-2.4, 2.6])
  // Copper Clawfoot Soaking Bathtub with Brass Faucet, Rim Candles & Rising Steam!
  addBoxMesh(g, 2.75, 0.88, 1.42, 0.1, f2 + 0.54, -3.85, p.copper);
  addBoxMesh(g, 2.45, 0.12, 1.15, 0.1, f2 + 0.94, -3.85, p.waterPool, 0, false, false);
  for (const lx of [-1.1, 1.1]) {
    for (const lz of [-0.5, 0.5]) {
      addCylMesh(g, 0.1, 0.12, 0.22, 6, 0.1 + lx, f2 + 0.11, -3.85 + lz, p.gold);
    }
  }
  // Brass faucet & warm candles on tub corners
  addCylMesh(g, 0.07, 0.09, 0.55, 6, -1.1, f2 + 1.2, -3.85, p.gold);
  addCylMesh(g, 0.09, 0.09, 0.24, 6, 1.25, f2 + 1.1, -4.35, p.glowLantern, false, false);
  addCylMesh(g, 0.09, 0.09, 0.2, 6, 1.25, f2 + 1.08, -3.35, p.glowLantern, false, false);
  const bathSteam = new THREE.Group();
  bathSteam.position.set(0.1, f2 + 1.3, -3.85);
  for (let s = 0; s < 4; s++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + s * 0.05, 0), p.steam);
    puff.position.set((s - 1.5) * 0.45, s * 0.25, (s % 2 - 0.5) * 0.25);
    bathSteam.add(puff);
  }
  g.add(bathSteam);

  // Pedestal Vanity Sink, Golden Framed Mirror & Folded Towel Shelf
  addCylMesh(g, 0.22, 0.32, 0.95, 8, -1.8, f2 + 0.48, 0.1, p.stoneLight);
  addCylMesh(g, 0.58, 0.36, 0.32, 8, -1.8, f2 + 1.05, 0.1, p.tileBath);
  addBoxMesh(g, 0.1, 1.35, 1.08, -2.36, f2 + 2.15, 0.1, p.glass);
  addBoxMesh(g, 0.14, 1.5, 1.22, -2.4, f2 + 2.15, 0.1, p.gold);
  // Fantasy Toilet / Privy with Oak Seat & Privacy Glass/Timber Partition
  addBoxMesh(g, 0.72, 0.58, 0.82, 1.9, f2 + 0.3, 0.4, p.stoneLight);
  addBoxMesh(g, 0.68, 0.1, 0.75, 1.9, f2 + 0.64, 0.4, p.woodOak);
  addBoxMesh(g, 0.36, 1.15, 0.72, 2.3, f2 + 0.95, 0.4, p.stoneLight);
  addBoxMesh(g, 1.3, 2.2, 0.14, 1.85, f2 + 1.1, -0.85, p.woodOak);
  // Wooden bath threshold trim, stool & folded cream/red towels
  addBoxMesh(g, 5.1, 0.12, 0.24, 0.1, f2 + 0.08, 5.7, p.woodDark);
  addBoxMesh(g, 0.72, 0.52, 0.62, -1.6, f2 + 0.26, 2.8, p.woodOak);
  addBoxMesh(g, 0.56, 0.14, 0.48, -1.6, f2 + 0.58, 2.8, p.fabricCream);
  addBoxMesh(g, 0.52, 0.12, 0.44, -1.6, f2 + 0.7, 2.8, p.fabricRed);
  // Plush Bath Mat
  addBoxMesh(g, 1.7, 0.05, 1.05, 0.1, f2 + 0.08, -2.0, p.fabricBlue, 0, false, true);

  // East Wing — Wizard's Arcane Study & Balcony (阳台)
  addBoxMesh(g, 2.5, 0.18, 1.45, 5.6, f2 + 1.02, -1.6, p.woodOak);
  for (const lx of [-1.1, 1.1]) {
    addBoxMesh(g, 0.2, 0.98, 1.25, 5.6 + lx, f2 + 0.5, -1.6, p.woodDark);
  }
  addCylMesh(g, 0.18, 0.24, 0.2, 8, 6.2, f2 + 1.2, -1.6, p.gold);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), p.glowArcane);
  orb.position.set(6.2, f2 + 1.58, -1.6);
  g.add(orb);
  addBoxMesh(g, 0.68, 0.1, 0.5, 5.0, f2 + 1.16, -1.6, p.fabricCream, 0.18);
  // Tall Colorful Bookcases along Back-East Wall
  for (const bx of [4.4, 6.9]) {
    addBoxMesh(g, 2.1, 3.2, 0.72, bx, f2 + 1.6, -5.2, p.woodDark);
    for (let sh = 0; sh < 3; sh++) {
      addBoxMesh(g, 1.8, 0.36, 0.48, bx, f2 + 0.72 + sh * 0.85, -5.05, sh === 0 ? p.fabricRed : sh === 1 ? p.fabricBlue : p.fabricEmerald);
    }
  }
  // East Balcony Bistro Table, Cushioned Chairs, Brass Telescope & Flower Boxes
  addCylMesh(g, 0.65, 0.65, 0.12, 8, 11.4, f2 + 0.85, 0.2, p.woodOak);
  addCylMesh(g, 0.12, 0.22, 0.85, 6, 11.4, f2 + 0.42, 0.2, p.iron);
  addBoxMesh(g, 0.8, 0.52, 0.8, 11.4, f2 + 0.28, -1.25, p.woodOak);
  addBoxMesh(g, 0.8, 0.52, 0.8, 11.4, f2 + 0.28, 1.65, p.woodOak);
  // Brass Spyglass Telescope on Balcony
  addCylMesh(g, 0.08, 0.25, 1.35, 6, 12.6, f2 + 0.68, -2.8, p.woodDark);
  const scope = addCylMesh(g, 0.14, 0.1, 1.3, 8, 12.9, f2 + 1.48, -2.8, p.gold);
  scope.rotation.z = -1.2;
  // Potted Blossom on Balcony
  addCylMesh(g, 0.34, 0.26, 0.48, 6, 12.8, f2 + 0.24, 3.8, p.copper);
  addConeMesh(g, 0.48, 0.8, 6, 12.8, f2 + 0.78, 3.8, p.flowerPink);

  /* ======================================================================== */
  /* 3F ATTIC OBSERVATORY (阁楼) & LUSH ROOFTOP GARDEN (楼顶花园)             */
  /* ======================================================================== */
  const f3 = 9.15;

  // West Attic — Rotating Brass Astrolabe, Cozy Day-Bed & Treasure Trunks
  const astrolabe = new THREE.Group();
  astrolabe.position.set(-4.0, f3 + 1.9, 0.2);
  addCylMesh(astrolabe, 0.22, 0.45, 1.5, 8, 0, -1.1, 0, p.woodDark);
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.06, 6, 16), p.gold);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.05, 6, 14), p.copper);
  r2.rotation.y = Math.PI * 0.5;
  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), p.glowLantern);
  astrolabe.add(r1, r2, starCore);
  g.add(astrolabe);

  // Cozy Pillowed Attic Day-Bed & Stacked Antique Trunks
  addBoxMesh(g, 2.8, 0.55, 1.6, -6.4, f3 + 0.28, 2.8, p.woodOak);
  addBoxMesh(g, 2.6, 0.32, 1.4, -6.4, f3 + 0.66, 2.8, p.fabricBlue);
  addBoxMesh(g, 0.6, 0.28, 0.7, -7.2, f3 + 0.9, 2.8, p.fabricGold, 0.15);
  addBoxMesh(g, 1.4, 0.85, 0.95, -1.6, f3 + 0.42, -3.6, p.woodDark, 0.14);
  addBoxMesh(g, 1.15, 0.68, 0.82, -1.6, f3 + 1.18, -3.6, p.copper, -0.1);

  // East Rooftop Garden (楼顶花园: x in [0.8, 8.8])
  // Timber Garden Pergola with Hanging Glowing Lanterns & Lush Vine Roof
  for (const px of [1.9, 7.7]) {
    for (const pz of [-4.4, 0.4]) {
      addBoxMesh(g, 0.26, 3.25, 0.26, px, f3 + 1.62, pz, p.woodDark);
    }
  }
  for (let pz = -4.6; pz <= 0.6; pz += 1.04) {
    addBoxMesh(g, 6.5, 0.18, 0.22, 4.8, f3 + 3.28, pz, p.woodOak);
  }
  addBoxMesh(g, 6.0, 0.34, 4.6, 4.8, f3 + 3.52, -2.0, p.foliageBright);
  // Warm string lanterns hanging under pergola
  for (const lx of [2.8, 4.8, 6.8]) {
    addCylMesh(g, 0.16, 0.12, 0.28, 6, lx, f3 + 2.85, 0.35, p.glowLantern, false, false);
  }

  // Vibrant Stone Planter Beds bursting with Fantasy Flowers & Moonblossoms
  const beds: Array<[number, number, number, number]> = [
    [2.6, -4.6, 3.2, 1.5],
    [6.8, -4.6, 3.2, 1.5],
    [7.6, 2.6, 1.8, 4.8],
    [2.6, 4.4, 3.4, 1.5],
  ];
  const flowerPalette = [p.flowerPink, p.flowerGold, p.flowerViolet, p.glowArcane];
  for (let b = 0; b < beds.length; b++) {
    const [bx, bz, bw, bd] = beds[b];
    addBoxMesh(g, bw, 0.62, bd, bx, f3 + 0.31, bz, p.stoneLight);
    addBoxMesh(g, bw - 0.3, 0.2, bd - 0.3, bx, f3 + 0.6, bz, p.dirt);
    for (let f = 0; f < 6; f++) {
      const fx = bx + ((f % 3) - 1) * (bw * 0.27);
      const fz = bz + (Math.floor(f / 3) - 0.4) * (bd * 0.26);
      addConeMesh(g, 0.34, 0.68, 5, fx, f3 + 0.96, fz, p.foliageMid);
      const blossom = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.22, 0),
        flowerPalette[(b + f) % flowerPalette.length]
      );
      blossom.position.set(fx, f3 + 1.38, fz);
      g.add(blossom);
    }
  }
  // Ornamental Pink Cherry-Blossom Fantasy Tree + Stone Fountain + Garden Bench
  addCylMesh(g, 0.24, 0.36, 2.1, 6, 7.2, f3 + 1.05, -4.4, p.woodDark);
  const blossomCrown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.75, 0), p.blossomPink);
  blossomCrown.position.set(7.2, f3 + 2.85, -4.4);
  blossomCrown.castShadow = true;
  g.add(blossomCrown);

  addCylMesh(g, 1.25, 1.38, 0.68, 8, 4.8, f3 + 0.34, 2.4, p.stoneLight);
  addCylMesh(g, 1.05, 1.05, 0.14, 8, 4.8, f3 + 0.68, 2.4, p.waterPool, false, false);
  addCylMesh(g, 0.22, 0.3, 0.85, 6, 4.8, f3 + 1.05, 2.4, p.stoneLight);
  addBoxMesh(g, 2.6, 0.5, 0.78, 4.8, f3 + 0.26, -1.6, p.woodOak);

  return {
    fireMesh,
    arcaneCrystal,
    cauldronLiquid,
    runeRing,
    chandelier,
    astrolabe,
    bathSteam,
    floatingBooks,
  };
}
