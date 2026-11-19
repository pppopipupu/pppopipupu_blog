import * as THREE from "three";
import { VillaPalette, addBoxMesh, addConeMesh, addCylMesh } from "./villaPrimitives";

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

export interface VillaExteriorRefs {
  poolWater: THREE.Mesh;
  fireflies: THREE.Points;
  dispose: () => void;
}

/**
 * Builds the outdoor Enchanted Swimming Pool & Waterfall Deck (泳池),
 * cutaway basement courtyard with stone stairs, cobblestone garden path,
 * starry twilight moon sky, and a dense surrounding Deep Fantasy Forest (周围深林)
 * with a clean front camera viewing corridor so NO tree ever blocks the villa!
 */
export function buildVillaExterior(root: THREE.Group, p: VillaPalette): VillaExteriorRefs {
  const rand = mulberry32(773319);
  const ext = new THREE.Group();
  ext.name = "villa_exterior";
  root.add(ext);

  /* ---- 1. FOREST CLEARING GROUND (Front Basement Cutaway Pit Open) ---- */
  addBoxMesh(ext, 210, 2.0, 96, 0, -1.25, -54.0, p.grass, 0, false, true);
  addBoxMesh(ext, 95, 2.0, 112, -57.0, -1.25, 50.0, p.grass, 0, false, true);
  addBoxMesh(ext, 84, 2.0, 112, 64.0, -1.25, 50.0, p.grass, 0, false, true);
  addBoxMesh(ext, 36, 2.0, 94, 6.0, -1.25, 59.5, p.grass, 0, false, true);

  // Sunken basement cutaway courtyard apron (y = -4.2, z in [6, 12.5])
  addBoxMesh(ext, 20.4, 0.5, 7.2, 0, -4.45, 9.2, p.stoneDark, 0, false, true);
  addBoxMesh(ext, 0.75, 4.4, 7.2, -9.9, -2.2, 9.2, p.stoneWall);
  addBoxMesh(ext, 0.75, 4.4, 7.2, 9.9, -2.2, 9.2, p.stoneWall);
  for (let s = 0; s < 8; s++) {
    addBoxMesh(ext, 3.2, 0.52, 0.75, -6.6, -4.0 + s * 0.52, 7.2 + s * 0.72, p.stoneLight);
  }

  /* ---- 2. OUTDOOR ENCHANTED SWIMMING POOL, WATERFALL & LOUNGE DECK (泳池) ---- */
  const poolX = 15.6;
  const poolZ = 0.8;
  addBoxMesh(ext, 12.6, 1.4, 15.6, poolX, -0.95, poolZ, p.stoneLight);
  // Sunken turquoise crystal pool basin rim
  addBoxMesh(ext, 8.8, 0.34, 0.72, poolX, -0.1, poolZ - 5.2, p.stoneLight);
  addBoxMesh(ext, 8.8, 0.34, 0.72, poolX, -0.1, poolZ + 5.2, p.stoneLight);
  addBoxMesh(ext, 0.72, 0.34, 10.8, poolX - 4.1, -0.1, poolZ, p.stoneLight);
  addBoxMesh(ext, 0.72, 0.34, 10.8, poolX + 4.1, -0.1, poolZ, p.stoneLight);
  // Glowing turquoise pool water surface + underwater tile accents
  const poolWater = addBoxMesh(ext, 7.6, 0.18, 9.8, poolX, -0.16, poolZ, p.waterPool, 0, false, false);
  addBoxMesh(ext, 2.2, 0.2, 0.7, poolX - 2.6, -0.25, poolZ - 4.4, p.tileBath);
  // Floating glowing water-lotus & pool brass ladder rails
  addCylMesh(ext, 0.52, 0.46, 0.08, 8, poolX + 1.2, -0.04, poolZ + 1.4, p.foliageBright, false, false);
  addConeMesh(ext, 0.26, 0.28, 6, poolX + 1.2, 0.12, poolZ + 1.4, p.glowPotionPink);
  addCylMesh(ext, 0.06, 0.06, 1.35, 6, poolX - 3.6, 0.35, poolZ - 3.8, p.gold);
  addCylMesh(ext, 0.06, 0.06, 1.35, 6, poolX - 3.6, 0.35, poolZ - 4.7, p.gold);
  // Decorative Stone Waterfall Feature on North Pool Rim
  addBoxMesh(ext, 2.6, 1.8, 1.1, poolX, 0.65, poolZ - 5.6, p.stoneWall);
  addBoxMesh(ext, 1.2, 1.4, 0.25, poolX, 0.45, poolZ - 5.05, p.waterPool, 0, false, false);
  // Poolside Lounge Chairs + Striped Fantasy Parasol + Lanterns
  for (const lz of [-2.4, 2.4]) {
    addBoxMesh(ext, 2.3, 0.24, 0.98, poolX + 5.5, 0.18, poolZ + lz, p.woodOak);
    addBoxMesh(ext, 0.78, 0.65, 0.98, poolX + 6.3, 0.55, poolZ + lz, p.fabricCream);
  }
  addCylMesh(ext, 0.08, 0.1, 3.2, 6, poolX + 5.7, 1.45, poolZ, p.woodDark);
  addConeMesh(ext, 2.2, 0.78, 8, poolX + 5.7, 3.12, poolZ, p.fabricRed);
  for (const lz of [-5.8, 6.8]) {
    addCylMesh(ext, 0.12, 0.18, 2.4, 6, poolX + 5.3, 1.05, poolZ + lz, p.iron);
    addBoxMesh(ext, 0.46, 0.58, 0.46, poolX + 5.3, 2.45, poolZ + lz, p.glowLantern, 0, false, false);
  }

  /* ---- 3. COBBLESTONE GARDEN PATH, WOODEN SIGNPOST & GARDEN LANTERNS ---- */
  for (let i = 0; i < 12; i++) {
    const px = -6.6 + Math.sin(i * 0.45) * 1.4;
    const pz = 14.5 + i * 2.1;
    addBoxMesh(ext, 2.2 + rand() * 0.6, 0.12, 1.3 + rand() * 0.4, px, -0.22, pz, p.stoneLight, (rand() - 0.5) * 0.25, false, true);
  }
  // Garden Lanterns flanking the front cobblestone approach
  for (const [lx, lz] of [[-11.2, 14.5], [10.8, 15.5], [-4.2, 22.5]] as Array<[number, number]>) {
    addCylMesh(ext, 0.11, 0.16, 2.2, 6, lx, 0.9, lz, p.iron);
    addBoxMesh(ext, 0.42, 0.52, 0.42, lx, 2.2, lz, p.glowLantern, 0, false, false);
  }

  /* ---- 4. DEEP SURROUNDING FANTASY FOREST (Zero Trees in Front Camera Wedge!) ---- */
  function addPineTree(x: number, z: number, scale: number) {
    const tH = 3.2 * scale;
    addCylMesh(ext, 0.28 * scale, 0.48 * scale, tH, 6, x, -0.25 + tH * 0.5, z, p.woodDark);
    const mat = rand() > 0.4 ? p.foliageDeep : p.foliageMid;
    addConeMesh(ext, 2.5 * scale, 4.8 * scale, 7, x, -0.25 + tH + 1.6 * scale, z, mat, rand() * 3);
    addConeMesh(ext, 1.9 * scale, 4.2 * scale, 7, x, -0.25 + tH + 3.9 * scale, z, p.foliageMid, rand() * 3);
    addConeMesh(ext, 1.25 * scale, 3.2 * scale, 7, x, -0.25 + tH + 5.9 * scale, z, p.foliageBright, rand() * 3);
  }

  function addMysticOak(x: number, z: number, scale: number) {
    const tH = 3.8 * scale;
    addCylMesh(ext, 0.38 * scale, 0.62 * scale, tH, 6, x, -0.25 + tH * 0.5, z, p.woodDark);
    for (let c = 0; c < 3; c++) {
      const a = (c / 3) * Math.PI * 2 + rand();
      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry((1.8 + rand() * 0.6) * scale, 0),
        c === 2 ? p.foliageBright : p.foliageMid
      );
      canopy.position.set(
        x + Math.cos(a) * 1.1 * scale,
        -0.25 + tH + (1.2 + c * 0.5) * scale,
        z + Math.sin(a) * 1.1 * scale
      );
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      ext.add(canopy);
    }
  }

  for (let i = 0; i < 110; i++) {
    const angle = rand() * Math.PI * 2;
    const rad = 20 + rand() * 62;
    const tx = Math.cos(angle) * rad;
    const tz = Math.sin(angle) * rad;

    // Keep villa, pool terrace, AND the entire front-south/front-right camera viewing corridor 100% clear!
    if (tx > -14 && tx < 26 && tz > -12 && tz < 16) continue;
    if (tz > 10 && tx > -22 && tx < 34) continue;

    const scale = 0.95 + rand() * 1.35 + (rad > 46 ? 0.6 : 0);
    if (rand() > 0.32) {
      addPineTree(tx, tz, scale);
    } else {
      addMysticOak(tx, tz, scale);
    }
  }

  // Mossy Boulders & Glowing Fantasy Mushrooms scattered around the clearing
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const r = 16 + rand() * 32;
    const rx = Math.cos(a) * r;
    const rz = Math.sin(a) * r;
    if (rx > -11 && rx < 23 && rz > -9 && rz < 14) continue;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65 + rand() * 1.1, 0), p.stoneWall);
    rock.position.set(rx, -0.1, rz);
    rock.rotation.set(rand() * 3, rand() * 3, 0);
    rock.scale.set(1.2, 0.65, 1.0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    ext.add(rock);

    if (rand() > 0.42) {
      const glowMat = rand() > 0.5 ? p.glowArcane : p.glowPotionPink;
      addCylMesh(ext, 0.08, 0.1, 0.36, 5, rx + 0.9, -0.05, rz + 0.5, p.fabricCream, false, false);
      addConeMesh(ext, 0.3, 0.26, 6, rx + 0.9, 0.24, rz + 0.5, glowMat);
    }
  }

  /* ---- 5. GLOWING TWILIGHT MOON & FLOATING FOREST FIREFLIES ---- */
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1), p.moonGlow);
  moon.position.set(-42, 46, -82);
  ext.add(moon);

  const fireflyCount = 130;
  const ffPositions = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount; i++) {
    const a = rand() * Math.PI * 2;
    const r = 10 + rand() * 48;
    ffPositions[i * 3] = Math.cos(a) * r;
    ffPositions[i * 3 + 1] = 0.8 + rand() * 17.5;
    ffPositions[i * 3 + 2] = Math.sin(a) * r;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute("position", new THREE.BufferAttribute(ffPositions, 3));
  const ffMat = new THREE.PointsMaterial({
    color: 0xffe484,
    size: 0.32,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  ext.add(fireflies);

  return {
    poolWater,
    fireflies,
    dispose: () => {
      ffGeo.dispose();
      ffMat.dispose();
    },
  };
}
