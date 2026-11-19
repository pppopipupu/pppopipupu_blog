import * as THREE from "three";

export interface VillaPalette {
  stoneDark: THREE.MeshStandardMaterial;
  stoneWall: THREE.MeshStandardMaterial;
  stoneLight: THREE.MeshStandardMaterial;
  plasterWarm: THREE.MeshStandardMaterial;
  plasterBath: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  woodOak: THREE.MeshStandardMaterial;
  woodFloor: THREE.MeshStandardMaterial;
  roofSlate: THREE.MeshStandardMaterial;
  roofMoss: THREE.MeshStandardMaterial;
  tileBath: THREE.MeshStandardMaterial;
  fabricRed: THREE.MeshStandardMaterial;
  fabricBlue: THREE.MeshStandardMaterial;
  fabricEmerald: THREE.MeshStandardMaterial;
  fabricCream: THREE.MeshStandardMaterial;
  fabricGold: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  waterPool: THREE.MeshStandardMaterial;
  steam: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  foliageDeep: THREE.MeshStandardMaterial;
  foliageMid: THREE.MeshStandardMaterial;
  foliageBright: THREE.MeshStandardMaterial;
  blossomPink: THREE.MeshStandardMaterial;
  flowerPink: THREE.MeshStandardMaterial;
  flowerGold: THREE.MeshStandardMaterial;
  flowerViolet: THREE.MeshStandardMaterial;
  glowFire: THREE.MeshStandardMaterial;
  glowArcane: THREE.MeshStandardMaterial;
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
    plasterWarm: flatMat(0xf4e8d1, 0.88, 0.02),
    plasterBath: flatMat(0xdcece9, 0.6, 0.05),
    woodDark: flatMat(0x472d1e, 0.84, 0.04),
    woodOak: flatMat(0x825636, 0.78, 0.04),
    woodFloor: flatMat(0xa37449, 0.74, 0.05),
    roofSlate: flatMat(0x283652, 0.76, 0.14),
    roofMoss: flatMat(0x3a5448, 0.86, 0.05),
    tileBath: flatMat(0xc5e4e2, 0.34, 0.08),
    fabricRed: flatMat(0xa82a38, 0.88, 0.02),
    fabricBlue: flatMat(0x285284, 0.86, 0.04),
    fabricEmerald: flatMat(0x1f6e52, 0.86, 0.04),
    fabricCream: flatMat(0xf7efe0, 0.9, 0.02),
    fabricGold: flatMat(0xdca944, 0.65, 0.24),
    copper: flatMat(0xc47344, 0.3, 0.78),
    iron: flatMat(0x272a32, 0.52, 0.75),
    gold: flatMat(0xf5c852, 0.24, 0.88),
    glass: flatMat(0x9ee0ff, 0.14, 0.12, { transparent: true, opacity: 0.45 }),
    waterPool: flatMat(0x26d0de, 0.12, 0.12, {
      transparent: true,
      opacity: 0.84,
      emissive: new THREE.Color(0x0f7885),
      emissiveIntensity: 0.55,
    }),
    steam: flatMat(0xeef8ff, 0.95, 0.0, { transparent: true, opacity: 0.34 }),
    grass: flatMat(0x285436, 0.94, 0.02),
    dirt: flatMat(0x5d4632, 0.95, 0.02),
    foliageDeep: flatMat(0x173827, 0.92, 0.02),
    foliageMid: flatMat(0x285c3a, 0.9, 0.02),
    foliageBright: flatMat(0x4b8e4a, 0.86, 0.02),
    blossomPink: flatMat(0xf49cc4, 0.82, 0.02),
    flowerPink: flatMat(0xf06ca8, 0.72, 0.02),
    flowerGold: flatMat(0xf8cf4c, 0.7, 0.04),
    flowerViolet: flatMat(0xa570f0, 0.72, 0.04),
    glowFire: flatMat(0xff922e, 0.35, 0.0, {
      emissive: new THREE.Color(0xff6b1a),
      emissiveIntensity: 2.2,
    }),
    glowArcane: flatMat(0x70ecff, 0.2, 0.1, {
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 2.2,
    }),
    glowPotionGreen: flatMat(0x4ade80, 0.22, 0.05, {
      emissive: new THREE.Color(0x22c55e),
      emissiveIntensity: 1.75,
    }),
    glowPotionPink: flatMat(0xf472b6, 0.22, 0.05, {
      emissive: new THREE.Color(0xec4899),
      emissiveIntensity: 1.75,
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
  addBoxMesh(parent, 0.16, 0.42, 0.18, x, y, z, p.iron, 0, false, false);
  addCylMesh(parent, 0.14, 0.09, 0.34, 6, x, y + 0.24, z + 0.16, p.glowLantern, false, false);
}
