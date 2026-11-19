import * as THREE from "three";

export interface VillaPalette {
  stoneDark: THREE.MeshStandardMaterial;
  stoneWall: THREE.MeshStandardMaterial;
  stoneLight: THREE.MeshStandardMaterial;
  stoneMoss: THREE.MeshStandardMaterial;
  stoneAncient: THREE.MeshStandardMaterial;
  plasterWarm: THREE.MeshStandardMaterial;
  plasterCream: THREE.MeshStandardMaterial;
  plasterBath: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  woodOak: THREE.MeshStandardMaterial;
  woodCedar: THREE.MeshStandardMaterial;
  woodFloor: THREE.MeshStandardMaterial;
  roofSlate: THREE.MeshStandardMaterial;
  roofMoss: THREE.MeshStandardMaterial;
  tileBath: THREE.MeshStandardMaterial;
  fabricRed: THREE.MeshStandardMaterial;
  fabricBlue: THREE.MeshStandardMaterial;
  fabricEmerald: THREE.MeshStandardMaterial;
  fabricPurple: THREE.MeshStandardMaterial;
  fabricTeal: THREE.MeshStandardMaterial;
  fabricCream: THREE.MeshStandardMaterial;
  fabricGold: THREE.MeshStandardMaterial;
  parchment: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  stainedAmber: THREE.MeshStandardMaterial;
  stainedCyan: THREE.MeshStandardMaterial;
  waterPool: THREE.MeshStandardMaterial;
  waterStream: THREE.MeshStandardMaterial;
  waterFoam: THREE.MeshStandardMaterial;
  steam: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  soilTilled: THREE.MeshStandardMaterial;
  foliageDeep: THREE.MeshStandardMaterial;
  foliageMid: THREE.MeshStandardMaterial;
  foliageBright: THREE.MeshStandardMaterial;
  blossomPink: THREE.MeshStandardMaterial;
  flowerPink: THREE.MeshStandardMaterial;
  flowerGold: THREE.MeshStandardMaterial;
  flowerViolet: THREE.MeshStandardMaterial;
  pumpkinOrange: THREE.MeshStandardMaterial;
  wheatGold: THREE.MeshStandardMaterial;
  glowFire: THREE.MeshStandardMaterial;
  glowEmber: THREE.MeshStandardMaterial;
  glowArcane: THREE.MeshStandardMaterial;
  glowRuneGold: THREE.MeshStandardMaterial;
  crystalViolet: THREE.MeshStandardMaterial;
  glowPotionGreen: THREE.MeshStandardMaterial;
  glowPotionPink: THREE.MeshStandardMaterial;
  glowLantern: THREE.MeshStandardMaterial;
  moonGlow: THREE.MeshStandardMaterial;
  dispose: () => void;
}

function flatMat(
  color: number,
  roughness = 0.85,
  metalness = 0.05,
  extra?: Partial<THREE.MeshStandardMaterialParameters>
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: true,
    ...extra,
  });
}

export function createVillaPalette(): VillaPalette {
  const mats = {
    stoneDark: flatMat(0x363b47, 0.92, 0.06),
    stoneWall: flatMat(0x6c707d, 0.88, 0.05),
    stoneLight: flatMat(0xb2aba0, 0.86, 0.04),
    stoneMoss: flatMat(0x5b6b5c, 0.92, 0.04),
    stoneAncient: flatMat(0x4b535e, 0.9, 0.08),
    plasterWarm: flatMat(0xf4e8d1, 0.88, 0.02),
    plasterCream: flatMat(0xfaefe0, 0.86, 0.02),
    plasterBath: flatMat(0xdcece9, 0.6, 0.05),
    woodDark: flatMat(0x472d1e, 0.84, 0.04),
    woodOak: flatMat(0x825636, 0.78, 0.04),
    woodCedar: flatMat(0x9b5a34, 0.76, 0.04),
    woodFloor: flatMat(0xa37449, 0.74, 0.05),
    roofSlate: flatMat(0x283652, 0.76, 0.14),
    roofMoss: flatMat(0x3a5448, 0.86, 0.05),
    tileBath: flatMat(0xc5e4e2, 0.34, 0.08),
    fabricRed: flatMat(0xa82a38, 0.88, 0.02),
    fabricBlue: flatMat(0x285284, 0.86, 0.04),
    fabricEmerald: flatMat(0x1f6e52, 0.86, 0.04),
    fabricPurple: flatMat(0x5b3582, 0.84, 0.06),
    fabricTeal: flatMat(0x237a80, 0.84, 0.04),
    fabricCream: flatMat(0xf7efe0, 0.9, 0.02),
    fabricGold: flatMat(0xdca944, 0.65, 0.24),
    parchment: flatMat(0xf0dfb8, 0.92, 0.02),
    copper: flatMat(0xc47344, 0.3, 0.78),
    brass: flatMat(0xd6a646, 0.3, 0.82),
    iron: flatMat(0x272a32, 0.52, 0.75),
    gold: flatMat(0xf5c852, 0.24, 0.88),
    glass: flatMat(0x9ee0ff, 0.14, 0.12, { transparent: true, opacity: 0.45 }),
    stainedAmber: flatMat(0xffc966, 0.22, 0.08, {
      transparent: true,
      opacity: 0.72,
      emissive: new THREE.Color(0xff9f2e),
      emissiveIntensity: 0.55,
    }),
    stainedCyan: flatMat(0x6ae4ff, 0.22, 0.08, {
      transparent: true,
      opacity: 0.72,
      emissive: new THREE.Color(0x22b8cf),
      emissiveIntensity: 0.5,
    }),
    waterPool: flatMat(0x26d0de, 0.12, 0.12, {
      transparent: true,
      opacity: 0.84,
      emissive: new THREE.Color(0x0f7885),
      emissiveIntensity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    waterStream: flatMat(0x29c7e0, 0.16, 0.1, {
      transparent: true,
      opacity: 0.82,
      emissive: new THREE.Color(0x127894),
      emissiveIntensity: 0.52,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    waterFoam: flatMat(0xbef6ff, 0.3, 0.02, {
      transparent: true,
      opacity: 0.74,
      emissive: new THREE.Color(0x5ce1f0),
      emissiveIntensity: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    steam: flatMat(0xeef8ff, 0.95, 0.0, { transparent: true, opacity: 0.34 }),
    grass: flatMat(0x285436, 0.94, 0.02),
    dirt: flatMat(0x5d4632, 0.95, 0.02),
    soilTilled: flatMat(0x463120, 0.96, 0.01),
    foliageDeep: flatMat(0x173827, 0.92, 0.02),
    foliageMid: flatMat(0x285c3a, 0.9, 0.02),
    foliageBright: flatMat(0x4b8e4a, 0.86, 0.02),
    blossomPink: flatMat(0xf49cc4, 0.82, 0.02),
    flowerPink: flatMat(0xf06ca8, 0.72, 0.02),
    flowerGold: flatMat(0xf8cf4c, 0.7, 0.04),
    flowerViolet: flatMat(0xa570f0, 0.72, 0.04),
    pumpkinOrange: flatMat(0xea7a22, 0.76, 0.04),
    wheatGold: flatMat(0xe2b94c, 0.82, 0.03),
    glowFire: flatMat(0xff922e, 0.35, 0.0, {
      emissive: new THREE.Color(0xff6b1a),
      emissiveIntensity: 2.2,
    }),
    glowEmber: flatMat(0xff501a, 0.55, 0.0, {
      emissive: new THREE.Color(0xd9380b),
      emissiveIntensity: 1.45,
    }),
    glowArcane: flatMat(0x70ecff, 0.2, 0.1, {
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 2.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    glowRuneGold: flatMat(0xffdf6b, 0.24, 0.2, {
      emissive: new THREE.Color(0xf5b324),
      emissiveIntensity: 1.8,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    crystalViolet: flatMat(0xc48bff, 0.22, 0.12, {
      emissive: new THREE.Color(0x9333ea),
      emissiveIntensity: 1.65,
    }),
    glowPotionGreen: flatMat(0x4ade80, 0.22, 0.05, {
      emissive: new THREE.Color(0x22c55e),
      emissiveIntensity: 1.75,
    }),
    glowPotionPink: flatMat(0xf472b6, 0.22, 0.05, {
      emissive: new THREE.Color(0xec4899),
      emissiveIntensity: 1.75,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
    glowLantern: flatMat(0xffe394, 0.28, 0.0, {
      emissive: new THREE.Color(0xffbd52),
      emissiveIntensity: 1.9,
    }),
    moonGlow: flatMat(0xfff5d6, 0.2, 0.0, {
      emissive: new THREE.Color(0xffe9b0),
      emissiveIntensity: 1.6,
    }),
  };

  return {
    ...mats,
    dispose: () => {
      for (const m of Object.values(mats)) {
        m.dispose();
      }
    },
  };
}

export function addBoxMesh(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rotY = 0,
  castShadow = true,
  receiveShadow = true
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (rotY !== 0) m.rotation.y = rotY;
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  parent.add(m);
  return m;
}

export function addCylMesh(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  seg: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  castShadow = true,
  receiveShadow = true
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  parent.add(m);
  return m;
}

export function addConeMesh(
  parent: THREE.Object3D,
  r: number,
  h: number,
  seg: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rotY = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export function addWallSconce(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  p: VillaPalette
) {
  addBoxMesh(parent, 0.16, 0.44, 0.18, x, y, z, p.iron, 0, false, false);
  addBoxMesh(parent, 0.1, 0.08, 0.24, x, y + 0.08, z + 0.13, p.iron, 0, false, false);
  addCylMesh(parent, 0.15, 0.09, 0.36, 6, x, y + 0.26, z + 0.22, p.glowLantern, false, false);
  addConeMesh(parent, 0.18, 0.14, 6, x, y + 0.48, z + 0.22, p.iron);
}

export function addLanternPost(
  parent: THREE.Object3D,
  x: number,
  baseY: number,
  z: number,
  height: number,
  p: VillaPalette
) {
  addCylMesh(parent, 0.11, 0.17, height, 6, x, baseY + height * 0.5, z, p.iron);
  addBoxMesh(parent, 0.38, 0.22, 0.38, x, baseY + 0.12, z, p.stoneDark);
  addBoxMesh(parent, 0.44, 0.54, 0.44, x, baseY + height + 0.27, z, p.glowLantern, 0, false, false);
  addConeMesh(parent, 0.38, 0.28, 4, x, baseY + height + 0.67, z, p.iron, Math.PI * 0.25);
}

export function addBookshelf(
  parent: THREE.Object3D,
  x: number,
  baseY: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  p: VillaPalette,
  rotY = 0
) {
  const shelf = new THREE.Group();
  shelf.position.set(x, baseY, z);
  shelf.rotation.y = rotY;
  parent.add(shelf);

  // Non-overlapping back panel, side walls, and top cornice (zero corner Z-fighting)
  const sideW = 0.14;
  const innerW = width - sideW * 2;
  addBoxMesh(shelf, innerW - 0.02, height - 0.16, 0.1, 0, height * 0.5 - 0.06, -depth * 0.5 + 0.06, p.woodDark);
  addBoxMesh(shelf, sideW, height - 0.16, depth, -width * 0.5 + sideW * 0.5, (height - 0.16) * 0.5, 0, p.woodDark);
  addBoxMesh(shelf, sideW, height - 0.16, depth, width * 0.5 - sideW * 0.5, (height - 0.16) * 0.5, 0, p.woodDark);
  addBoxMesh(shelf, width + 0.14, 0.16, depth + 0.1, 0, height - 0.08, 0.02, p.woodDark);

  const bookMats = [
    p.fabricRed,
    p.fabricBlue,
    p.fabricEmerald,
    p.fabricPurple,
    p.fabricGold,
    p.woodCedar,
    p.fabricTeal,
  ];
  const levels = Math.max(3, Math.floor(height / 0.85));
  const stepY = (height - 0.36) / levels;
  const shelfW = innerW - 0.04;

  for (let lv = 0; lv < levels; lv++) {
    const sy = 0.22 + lv * stepY;
    addBoxMesh(shelf, shelfW, 0.09, depth - 0.14, 0, sy, 0.04, p.woodOak);

    const bookCount = Math.max(4, Math.floor(shelfW / 0.24));
    const slotW = (shelfW - 0.08) / bookCount;
    for (let b = 0; b < bookCount; b++) {
      if ((lv + b) % 7 === 0) continue;
      const bh = Math.min(stepY - 0.18, 0.38 + ((lv * 3 + b * 5) % 4) * 0.07);
      const bx = -(shelfW - 0.08) * 0.5 + slotW * (b + 0.5);
      const tilt = (lv + b) % 9 === 0 ? 0.14 : 0;
      const bm = addBoxMesh(
        shelf,
        slotW * 0.8,
        bh,
        depth * 0.62,
        bx,
        sy + 0.05 + bh * 0.5,
        0.06,
        bookMats[(lv * 3 + b) % bookMats.length],
        0,
        false,
        true
      );
      if (tilt !== 0) bm.rotation.z = tilt;
    }
  }
}

export function addBanner(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  p: VillaPalette,
  rotY = 0
) {
  const banner = new THREE.Group();
  banner.position.set(x, y, z);
  banner.rotation.y = rotY;
  parent.add(banner);

  const rod = addCylMesh(banner, 0.05, 0.05, 1.28, 6, 0, 0.96, 0, p.gold);
  rod.rotation.z = Math.PI * 0.5;
  addBoxMesh(banner, 0.96, 1.75, 0.06, 0, 0, 0, mat, 0, false, true);
  // Gold central stripe strictly proud of cloth face (+0.035) to prevent Z-fighting
  addBoxMesh(banner, 0.18, 1.48, 0.02, 0, 0.04, 0.045, p.fabricGold, 0, false, false);
  const tail = addConeMesh(banner, 0.46, 0.52, 4, 0, -1.14, 0, mat, Math.PI * 0.25);
  tail.rotation.x = Math.PI;
  tail.scale.set(1.0, 1.0, 0.12);
}

export function addPottedPlant(
  parent: THREE.Object3D,
  x: number,
  baseY: number,
  z: number,
  p: VillaPalette,
  flowerMat?: THREE.Material,
  scale = 1.0
) {
  addCylMesh(parent, 0.34 * scale, 0.24 * scale, 0.46 * scale, 6, x, baseY + 0.23 * scale, z, p.copper);
  addConeMesh(parent, 0.44 * scale, 0.72 * scale, 6, x, baseY + 0.74 * scale, z, p.foliageMid);
  if (flowerMat) {
    const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24 * scale, 0), flowerMat);
    bloom.position.set(x, baseY + 1.15 * scale, z);
    parent.add(bloom);
  }
}

export function addCandleCluster(
  parent: THREE.Object3D,
  x: number,
  baseY: number,
  z: number,
  p: VillaPalette
) {
  addCylMesh(parent, 0.06, 0.06, 0.26, 6, x, baseY + 0.13, z, p.fabricCream, false, false);
  addCylMesh(parent, 0.04, 0.03, 0.1, 5, x, baseY + 0.31, z, p.glowLantern, false, false);
  addCylMesh(parent, 0.05, 0.05, 0.18, 6, x + 0.12, baseY + 0.09, z + 0.06, p.fabricCream, false, false);
  addCylMesh(parent, 0.035, 0.025, 0.09, 5, x + 0.12, baseY + 0.23, z + 0.06, p.glowLantern, false, false);
}
