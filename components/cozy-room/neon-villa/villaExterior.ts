import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
  addLanternPost,
  addPottedPlant,
} from "./villaPrimitives";
import {
  buildStreamAndPlantation,
  StreamPlantationRefs,
} from "./villaStreamAndPlantation";
import {
  buildAncientStatues,
  AncientStatuesRefs,
} from "./villaAncientStatues";
import { buildDeepForest, DeepForestRefs } from "./villaDeepForest";

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

export interface VillaExteriorRefs
  extends StreamPlantationRefs,
    AncientStatuesRefs,
    DeepForestRefs {
  poolWater: THREE.Mesh;
  waterfallStream: THREE.Mesh;
  lotusGroup: THREE.Group;
}

/**
 * Orchestrates the expanded outdoor estate around the 48m x 27m 5-Level Grand D&D Villa:
 * - Deep two-tier sunken cutaway courtyard exposing BOTH B1 and B2 with zero Z-fighting!
 * - Shifted & expanded East Enchanted Pool, Front Cobblestone Avenue, Stream, Plantation, Statues & Deep Forest
 */
export function buildVillaExterior(root: THREE.Group, p: VillaPalette): VillaExteriorRefs {
  const rand = mulberry32(773319);
  const ext = new THREE.Group();
  ext.name = "villa_exterior";
  root.add(ext);

  /* ======================================================================== */
  /* 1. FOREST CLEARING GROUND (Exact Non-Overlapping Tiling, Zero Z-Fighting)*/
  /* ======================================================================== */
  // Deep cutaway pit opening: x in [-24.8, +24.8], z in [-13.9, +25.4], grass top y = -0.25
  addBoxMesh(ext, 520, 2.0, 240.1, 0, -1.25, -133.95, p.grass, 0, false, true);
  addBoxMesh(ext, 235.2, 2.0, 265.9, -142.4, -1.25, 119.05, p.grass, 0, false, true);
  addBoxMesh(ext, 235.2, 2.0, 265.9, 142.4, -1.25, 119.05, p.grass, 0, false, true);
  addBoxMesh(ext, 49.6, 2.0, 226.6, 0, -1.25, 138.7, p.grass, 0, false, true);

  // Deep B2-level sunken cutaway courtyard apron (y = -12.8, z in [13.65, 25.3])
  addBoxMesh(ext, 49.0, 0.7, 11.65, 0, -13.15, 19.475, p.stoneDark, 0, false, true);
  // Retaining stone chasm walls strictly inside pit opening (±24.5, outer face ±24.78 < ±24.8)
  addBoxMesh(ext, 0.56, 12.8, 11.65, -24.5, -6.5, 19.475, p.stoneWall);
  addBoxMesh(ext, 0.56, 12.8, 11.65, 24.5, -6.5, 19.475, p.stoneWall);
  addBoxMesh(ext, 49.6, 12.8, 0.65, 0, -6.5, 25.45, p.stoneDark);
  addBoxMesh(ext, 49.6, 0.4, 0.8, 0, -0.05, 25.45, p.stoneLight);
  // Long stone stairs climbing from B2 deep courtyard (-12.8) up to forest clearing (-0.25)
  for (let s = 0; s < 16; s++) {
    addBoxMesh(
      ext,
      4.6,
      0.78,
      0.76,
      -17.2,
      -12.4 + s * 0.78,
      14.2 + s * 0.7,
      p.stoneLight
    );
  }
  addLanternPost(ext, -21.2, -12.8, 15.8, 3.0, p);
  addLanternPost(ext, 21.0, -12.8, 22.0, 3.0, p);

  /* ======================================================================== */
  /* 2. OUTDOOR ENCHANTED SWIMMING POOL, WATERFALL GROTTO & LOUNGE DECK       */
  /* ======================================================================== */
  const poolX = 36.6;
  const poolZ = 1.6;
  // Deck x in [26.8, 46.4], z in [-11.4, 14.6]
  addBoxMesh(ext, 19.6, 1.5, 26.0, poolX, -0.89, poolZ, p.stoneLight);
  addBoxMesh(ext, 2.44, 0.32, 8.2, 25.6, -0.13, 0.4, p.stoneLight);

  addBoxMesh(ext, 0.92, 0.38, 18.0, poolX - 7.2, 0.05, poolZ, p.stoneLight);
  addBoxMesh(ext, 0.92, 0.38, 18.0, poolX + 5.2, 0.05, poolZ, p.stoneLight);
  addBoxMesh(ext, 11.48, 0.38, 0.92, poolX - 1.0, 0.05, poolZ - 8.54, p.stoneLight);
  addBoxMesh(ext, 11.48, 0.38, 0.92, poolX - 1.0, 0.05, poolZ + 8.54, p.stoneLight);

  const poolWater = addBoxMesh(
    ext,
    11.44,
    0.18,
    16.1,
    poolX - 1.0,
    -0.02,
    poolZ,
    p.waterPool,
    0,
    false,
    false
  );
  addBoxMesh(ext, 3.0, 0.16, 0.95, poolX - 4.8, -0.11, poolZ - 7.3, p.tileBath);

  const lotusGroup = new THREE.Group();
  ext.add(lotusGroup);
  const lotusCoords: Array<[number, number, THREE.Material]> = [
    [poolX + 1.2, poolZ + 3.0, p.glowPotionPink],
    [poolX - 3.2, poolZ + 5.0, p.glowArcane],
    [poolX + 2.4, poolZ - 3.4, p.flowerGold],
  ];
  for (const [lx, lz, lmat] of lotusCoords) {
    addCylMesh(lotusGroup, 0.68, 0.62, 0.08, 8, lx, 0.1, lz, p.foliageBright, false, false);
    addConeMesh(lotusGroup, 0.34, 0.36, 6, lx, 0.28, lz, lmat);
  }
  addCylMesh(ext, 0.06, 0.06, 1.6, 6, poolX - 6.4, 0.52, poolZ - 6.0, p.gold);
  addCylMesh(ext, 0.06, 0.06, 1.6, 6, poolX - 6.4, 0.52, poolZ - 7.1, p.gold);

  addBoxMesh(ext, 5.8, 3.5, 2.2, poolX - 1.0, 1.6, poolZ - 9.75, p.stoneWall);
  addBoxMesh(ext, 3.4, 2.0, 1.6, poolX - 3.6, 0.85, poolZ - 9.5, p.stoneMoss);
  addBoxMesh(ext, 3.2, 2.2, 1.6, poolX + 1.8, 0.95, poolZ - 9.5, p.stoneMoss);
  const waterfallStream = addBoxMesh(
    ext,
    2.25,
    3.0,
    0.38,
    poolX - 1.0,
    1.36,
    poolZ - 8.45,
    p.waterPool,
    0,
    false,
    false
  );
  addCylMesh(ext, 1.48, 1.72, 0.14, 8, poolX - 1.0, 0.09, poolZ - 7.9, p.waterFoam, false, false);

  for (const lz of [-4.0, 4.0]) {
    addBoxMesh(ext, 2.7, 0.24, 1.2, poolX + 7.6, 0.28, poolZ + lz, p.woodOak);
    addBoxMesh(ext, 0.96, 0.76, 1.2, poolX + 8.55, 0.7, poolZ + lz, p.fabricCream);
  }
  addCylMesh(ext, 0.58, 0.58, 0.1, 8, poolX + 7.5, 0.66, poolZ, p.woodOak);
  addCylMesh(ext, 0.08, 0.12, 0.62, 6, poolX + 7.5, 0.36, poolZ, p.iron);
  addCylMesh(ext, 0.1, 0.12, 4.2, 6, poolX + 7.7, 1.98, poolZ, p.woodDark);
  addConeMesh(ext, 3.15, 1.0, 8, poolX + 7.7, 4.18, poolZ, p.fabricRed);
  addConeMesh(ext, 1.58, 0.54, 8, poolX + 7.7, 4.46, poolZ, p.fabricCream);
  for (const lz of [-10.6, 11.2]) {
    addLanternPost(ext, poolX + 8.0, -0.14, poolZ + lz, 3.0, p);
  }
  addPottedPlant(ext, poolX - 8.2, -0.14, poolZ + 11.0, p, p.flowerPink, 1.45);

  /* ======================================================================== */
  /* 3. FRONT COBBLESTONE AVENUE, MEDIEVAL SIGNPOST & LANTERNS                */
  /* ======================================================================== */
  for (let i = 0; i < 18; i++) {
    const px = -16.8 + Math.sin(i * 0.38) * 2.8;
    const pz = 27.4 + i * 2.5;
    addBoxMesh(
      ext,
      3.0 + rand() * 0.75,
      0.14,
      1.5 + rand() * 0.45,
      px,
      -0.18,
      pz,
      p.stoneLight,
      (rand() - 0.5) * 0.28,
      false,
      true
    );
  }
  addCylMesh(ext, 0.15, 0.19, 3.8, 6, -11.0, 1.65, 31.0, p.woodDark);
  addBoxMesh(ext, 1.75, 0.42, 0.12, -10.2, 2.8, 31.0, p.woodOak, 0.15);
  addBoxMesh(ext, 1.55, 0.38, 0.12, -11.75, 2.28, 31.0, p.woodCedar, -0.2);
  addCylMesh(ext, 0.16, 0.12, 0.32, 6, -9.45, 2.42, 31.0, p.glowLantern, false, false);

  for (const [lx, lz] of [
    [-24.2, 28.2],
    [24.2, 28.2],
    [-11.2, 43.0],
    [-15.6, 58.0],
  ] as Array<[number, number]>) {
    addLanternPost(ext, lx, -0.25, lz, 2.7, p);
  }

  /* ======================================================================== */
  /* 4. MODULAR WORLD LANDMARKS                                               */
  /* ======================================================================== */
  const streamPlantationRefs = buildStreamAndPlantation(ext, p);
  const statueRefs = buildAncientStatues(ext, p);
  const forestRefs = buildDeepForest(ext, p);

  return {
    poolWater,
    waterfallStream,
    lotusGroup,
    ...streamPlantationRefs,
    ...statueRefs,
    ...forestRefs,
  };
}
