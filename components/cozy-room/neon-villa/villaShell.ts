import * as THREE from "three";
import {
  VillaPalette,
  addBoxMesh,
  addConeMesh,
  addCylMesh,
  addWallSconce,
} from "./villaPrimitives";

export interface VillaShellRefs {
  chimneySmoke: THREE.Group;
}

/**
 * Colossal 48.0m x 27.0m 5-Level (B2 + B1 + 1F + 2F + 3F) Western Fantasy D&D Cutaway Villa Shell:
 * - Main footprint enlarged to 48.0m (x in [-24.0, 24.0]) x 27.0m (z in [-13.5, 13.5])
 * - Brand-new B2 Deep Underdark Vault (y = -12.8 .. -6.2) with vaulted ribs & crypt stairs
 * - Zero coplanar Z-fighting across all corners, window layers, slabs, and fascia beams
 * - West 1F Glasshouse Herb Conservatory, East 2F Covered Pergola Balcony,
 *   Grand Octagonal Archmage Turret (spire y = 37.2), Stone Chimney with animated smoke.
 */
export function buildVillaShell(root: THREE.Group, p: VillaPalette): VillaShellRefs {
  const shell = new THREE.Group();
  shell.name = "villa_shell";
  root.add(shell);

  /* ======================================================================== */
  /* 0. B2 DEEP UNDERDARK VAULT (y = -12.8 .. -6.2)                           */
  /* ======================================================================== */
  // B2 Floor slab (top at y = -12.8, z in [-13.95, 13.6])
  addBoxMesh(shell, 49.0, 0.7, 27.55, 0, -13.15, -0.175, p.stoneDark);
  // B2 Back wall (z = -13.5, d = 0.9 -> inner face -13.05)
  addBoxMesh(shell, 48.9, 6.6, 0.9, 0, -9.5, -13.5, p.stoneDark);
  // B2 Side walls strictly abutting back wall (z in [-13.03, 13.5], d = 26.53)
  addBoxMesh(shell, 0.9, 6.6, 26.53, -24.0, -9.5, 0.235, p.stoneDark);
  addBoxMesh(shell, 0.9, 6.6, 26.53, 24.0, -9.5, 0.235, p.stoneDark);
  // Vaulted stone ribs & overhead dark-stone beams
  for (const px of [-17.5, -9.0, 9.0, 17.5]) {
    addBoxMesh(shell, 0.9, 6.4, 0.85, px, -9.6, -12.6, p.stoneAncient);
    addBoxMesh(shell, 0.62, 0.48, 25.8, px, -6.72, 0.1, p.stoneWall);
  }
  addBoxMesh(shell, 47.0, 0.42, 0.58, 0, -12.59, 13.22, p.stoneAncient);
  for (const tx of [-20.0, -13.0, -5.8, 5.8, 13.0, 20.0]) {
    addWallSconce(shell, tx, -8.5, -12.92, p);
  }

  /* ======================================================================== */
  /* 1. B1 BASEMENT (y = -6.2 .. 0.0)                                         */
  /* ======================================================================== */
  // B1 Floor slab (top at y = -6.2, z in [-13.95, 13.6])
  addBoxMesh(shell, 49.0, 0.6, 27.55, 0, -6.5, -0.175, p.stoneDark);
  // Back wall (z = -13.5, d = 0.85 -> inner face -13.075)
  addBoxMesh(shell, 48.85, 6.2, 0.85, 0, -3.1, -13.5, p.stoneDark);
  // Side walls strictly abutting back wall (z in [-13.05, 13.5], depth 26.55)
  addBoxMesh(shell, 0.85, 6.2, 26.55, -24.0, -3.1, 0.225, p.stoneDark);
  addBoxMesh(shell, 0.85, 6.2, 26.55, 24.0, -3.1, 0.225, p.stoneDark);

  for (const px of [-17.5, -8.8, 0.0, 8.8, 17.5]) {
    addBoxMesh(shell, 0.82, 6.0, 0.78, px, -3.18, -12.64, p.stoneWall);
    addBoxMesh(shell, 0.54, 0.44, 25.8, px, -0.5, 0.1, p.woodDark);
  }
  addBoxMesh(shell, 47.1, 0.38, 0.54, 0, -6.01, 13.24, p.stoneWall);
  for (const tx of [-20.5, -13.2, -4.4, 4.4, 13.2, 20.5]) {
    addWallSconce(shell, tx, -2.1, -12.94, p);
  }

  /* ======================================================================== */
  /* 2. GROUND FLOOR (1F: y = 0.0 .. 6.8) + WEST HERB CONSERVATORY            */
  /* ======================================================================== */
  addBoxMesh(shell, 49.2, 0.52, 27.6, 0, -0.26, 0, p.woodFloor);
  addBoxMesh(shell, 48.78, 6.8, 0.78, 0, 3.4, -13.5, p.stoneWall);
  addBoxMesh(shell, 47.1, 1.65, 0.16, 0, 0.83, -12.98, p.woodDark);
  addBoxMesh(shell, 47.1, 0.18, 0.22, 0, 1.74, -12.94, p.woodOak);

  // West wall (z in [-13.09, 13.5]) with arched doorway to West Conservatory (z in [3.8, 8.2])
  addBoxMesh(shell, 0.78, 6.8, 16.89, -24.0, 3.4, -4.645, p.stoneWall);
  addBoxMesh(shell, 0.78, 6.8, 5.3, -24.0, 3.4, 10.85, p.stoneWall);
  addBoxMesh(shell, 0.88, 1.55, 4.4, -24.0, 6.02, 6.0, p.woodDark);

  // East wall (z in [-13.09, 13.5]) with grand arched opening to Pool Terrace (z in [-4.4, 5.0])
  addBoxMesh(shell, 0.78, 6.8, 8.69, 24.0, 3.4, -8.745, p.stoneWall);
  addBoxMesh(shell, 0.78, 6.8, 8.5, 24.0, 3.4, 9.25, p.stoneWall);
  addBoxMesh(shell, 0.88, 1.55, 9.4, 24.0, 6.02, 0.3, p.woodDark);

  // Corner stone quoins on 1F front cutaway edges
  for (let q = 0; q < 6; q++) {
    const qy = 0.65 + q * 1.12;
    const qw = q % 2 === 0 ? 1.18 : 0.92;
    addBoxMesh(shell, qw, 0.52, 0.7, -24.0, qy, 13.58, p.stoneLight);
    addBoxMesh(shell, qw, 0.52, 0.7, 24.0, qy, 13.58, p.stoneLight);
  }

  // Room divider between Grand Hearth Guildhall (West) and Tavern Banquet/Kitchen (East)
  addBoxMesh(shell, 0.48, 6.32, 12.2, 1.6, 3.16, -6.9, p.plasterWarm);
  addBoxMesh(shell, 0.56, 1.55, 12.16, 1.6, 0.78, -6.9, p.woodDark);
  addBoxMesh(shell, 0.56, 0.48, 26.2, 1.6, 6.52, 0.1, p.woodDark);
  for (const bx of [-17.0, -8.6, 9.0, 17.2]) {
    addBoxMesh(shell, 0.4, 0.42, 26.0, bx, 6.52, 0.1, p.woodDark);
  }

  // Tall Stained-Glass Gothic Mullioned Windows on 1F Back Wall
  for (const wx of [-16.4, -7.4, 9.8, 17.8]) {
    addBoxMesh(shell, 3.4, 2.4, 0.82, wx, 3.2, -13.5, p.glass, 0, false, false);
    addBoxMesh(shell, 1.52, 1.04, 0.82, wx - 0.86, 5.04, -13.5, p.stainedAmber, 0, false, false);
    addBoxMesh(shell, 1.52, 1.04, 0.82, wx + 0.86, 5.04, -13.5, p.stainedCyan, 0, false, false);
    addBoxMesh(shell, 3.9, 0.32, 1.02, wx, 5.72, -13.5, p.woodDark);
    addBoxMesh(shell, 3.9, 0.32, 1.08, wx, 1.88, -13.5, p.stoneLight);
    addBoxMesh(shell, 0.18, 3.68, 0.92, wx, 3.8, -13.5, p.woodDark);
    addBoxMesh(shell, 3.55, 0.16, 0.92, wx, 4.46, -13.5, p.woodDark);
    addBoxMesh(shell, 3.55, 0.14, 0.92, wx, 3.14, -13.5, p.woodDark);
  }
  for (const sx of [-11.9, -2.8, 5.6, 13.8]) {
    addWallSconce(shell, sx, 3.9, -12.98, p);
  }

  // WEST 1F COVERED HERB & ALCHEMY CONSERVATORY (x = -32.4 .. -24.4)
  addBoxMesh(shell, 8.0, 0.56, 20.0, -28.4, -0.4, 0.2, p.stoneLight);
  addBoxMesh(shell, 7.8, 1.25, 0.48, -28.3, 0.5, -9.56, p.stoneWall);
  addBoxMesh(shell, 0.48, 1.25, 19.3, -32.18, 0.5, 0.3, p.stoneWall);
  for (const vz of [-9.5, -3.1, 3.3, 9.9]) {
    addBoxMesh(shell, 0.34, 4.9, 0.34, -32.18, 2.35, vz, p.woodDark);
  }
  addBoxMesh(shell, 0.38, 0.34, 19.7, -32.18, 4.88, 0.2, p.woodDark);
  const verandaGlass = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.08, 19.8), p.glass);
  verandaGlass.position.set(-28.35, 5.88, 0.2);
  verandaGlass.rotation.z = 0.24;
  shell.add(verandaGlass);
  for (const vz of [-9.5, -4.65, 0.2, 5.05, 9.9]) {
    const rft = addBoxMesh(shell, 8.55, 0.22, 0.26, -28.35, 5.7, vz, p.woodDark);
    rft.rotation.z = 0.24;
  }

  /* ======================================================================== */
  /* 3. SECOND FLOOR (2F: y = 7.06 .. 13.48) + COVERED EAST BALCONY           */
  /* ======================================================================== */
  addBoxMesh(shell, 49.4, 0.54, 27.7, 0, 6.8, 0, p.woodFloor);
  addBoxMesh(shell, 48.7, 6.42, 0.7, 0, 10.27, -13.5, p.plasterWarm);
  addBoxMesh(shell, 0.7, 6.42, 26.64, -24.0, 10.27, 0.18, p.plasterWarm);
  for (const tz of [-9.0, 0.0, 9.0]) {
    addBoxMesh(shell, 0.14, 6.3, 0.28, -24.43, 10.27, tz, p.woodDark);
  }
  addBoxMesh(shell, 0.14, 0.28, 26.4, -24.43, 10.27, 0.18, p.woodDark);

  // East wall with grand double-door archway to East Balcony (z in [-4.4, 4.8])
  addBoxMesh(shell, 0.7, 6.42, 8.74, 24.0, 10.27, -8.77, p.plasterWarm);
  addBoxMesh(shell, 0.7, 6.42, 8.7, 24.0, 10.27, 9.15, p.plasterWarm);
  addBoxMesh(shell, 0.82, 1.35, 9.2, 24.0, 12.82, 0.2, p.woodDark);

  // 2F Room Partitions: Master Suite (x < -6.2) | Bathhouse (-6.2..6.2) | Archmage Study (x > 6.2)
  addBoxMesh(shell, 0.4, 6.3, 17.6, -6.2, 10.22, -4.3, p.plasterWarm);
  addBoxMesh(shell, 0.4, 6.3, 17.6, 6.2, 10.22, -4.3, p.plasterWarm);
  addBoxMesh(shell, 0.48, 6.3, 0.32, -6.2, 10.22, 4.66, p.woodDark);
  addBoxMesh(shell, 0.48, 6.3, 0.32, 6.2, 10.22, 4.66, p.woodDark);

  // Bathroom tiled floor (top at y = 7.17, strictly proud of 7.07) & back wainscot
  addBoxMesh(shell, 11.9, 0.1, 25.8, 0.0, 7.12, 0.1, p.tileBath);
  addBoxMesh(shell, 11.9, 3.3, 0.14, 0.0, 8.82, -13.06, p.plasterBath);

  for (const wx of [-14.8, 14.8]) {
    addBoxMesh(shell, 3.4, 3.1, 0.76, wx, 10.35, -13.5, p.glass, 0, false, false);
    addBoxMesh(shell, 3.8, 0.28, 0.92, wx, 12.0, -13.5, p.woodDark);
    addBoxMesh(shell, 3.8, 0.28, 0.96, wx, 8.7, -13.5, p.woodDark);
    addBoxMesh(shell, 0.18, 3.16, 0.86, wx, 10.35, -13.5, p.woodDark);
    addBoxMesh(shell, 3.45, 0.16, 0.86, wx, 10.35, -13.5, p.woodDark);
  }

  // Front cutaway timber fascia beams & corbels
  addBoxMesh(shell, 49.6, 0.46, 0.46, 0, 6.84, 14.04, p.woodDark);
  addBoxMesh(shell, 49.6, 0.46, 0.46, 0, 13.52, 14.04, p.woodDark);
  for (const cx of [-19.2, -9.6, 0.0, 9.6, 19.2]) {
    addBoxMesh(shell, 0.34, 0.5, 0.5, cx, 6.34, 13.78, p.woodOak);
    addBoxMesh(shell, 0.34, 0.5, 0.5, cx, 13.02, 13.78, p.woodOak);
  }
  for (const bx of [-15.0, 0.0, 15.0]) {
    addBoxMesh(shell, 0.4, 0.4, 26.2, bx, 13.14, 0.1, p.woodDark);
  }
  addWallSconce(shell, -9.8, 10.8, -13.04, p);
  addWallSconce(shell, 0.0, 10.95, -13.04, p);
  addWallSconce(shell, 9.8, 10.8, -13.04, p);

  // EXPANDED COVERED EAST BALCONY (阳台: x = 24.4 .. 33.4, y = 6.8)
  addBoxMesh(shell, 9.0, 0.48, 20.0, 28.9, 6.8, 0.2, p.woodOak);
  for (const bz of [-7.6, -2.4, 2.8, 8.0]) {
    const brace = addBoxMesh(shell, 6.4, 0.42, 0.42, 26.8, 4.6, bz, p.woodDark);
    brace.rotation.z = 0.68;
  }
  for (const bz of [-9.6, -3.1, 3.4, 10.0]) {
    addBoxMesh(shell, 0.32, 5.1, 0.32, 33.18, 9.55, bz, p.woodDark);
    addBoxMesh(shell, 0.4, 0.28, 0.4, 33.18, 8.62, bz, p.gold);
  }
  addBoxMesh(shell, 0.28, 0.26, 19.9, 33.18, 8.5, 0.2, p.woodDark);
  addBoxMesh(shell, 8.7, 0.26, 0.28, 28.75, 8.5, -9.6, p.woodDark);
  addBoxMesh(shell, 8.7, 0.26, 0.28, 28.75, 8.5, 10.0, p.woodDark);
  for (let bz = -8.7; bz <= 9.1; bz += 1.0) {
    addBoxMesh(shell, 0.14, 1.4, 0.14, 33.18, 7.72, bz, p.woodOak);
  }
  addBoxMesh(shell, 0.34, 0.34, 20.2, 33.18, 12.15, 0.2, p.woodDark);
  for (let bz = -9.4; bz <= 9.8; bz += 1.92) {
    addBoxMesh(shell, 9.0, 0.22, 0.26, 28.85, 12.42, bz, p.woodOak);
  }
  addBoxMesh(shell, 8.0, 0.3, 18.2, 28.85, 12.7, 0.2, p.foliageBright);
  for (const lz of [-6.2, 0.2, 6.6]) {
    addCylMesh(shell, 0.19, 0.15, 0.36, 6, 32.4, 11.68, lz, p.glowLantern, false, false);
  }
  for (const vz of [-7.4, -2.2, 3.0, 8.0]) {
    addBoxMesh(shell, 0.28, 3.1, 0.44, 33.52, 5.55, vz, p.foliageBright);
  }

  /* ======================================================================== */
  /* 4. THIRD FLOOR: ATTIC OBSERVATORY (West) & SKY GARDEN (East)             */
  /* ======================================================================== */
  addBoxMesh(shell, 49.6, 0.58, 27.8, 0, 13.5, 0, p.stoneLight);
  addBoxMesh(shell, 24.8, 0.08, 26.2, -11.4, 13.83, 0.1, p.woodFloor);

  // West Attic Observatory Walls
  addBoxMesh(shell, 25.3, 5.6, 0.7, -11.7, 16.58, -13.5, p.plasterWarm);
  addBoxMesh(shell, 0.7, 5.6, 26.64, -24.0, 16.58, 0.16, p.plasterWarm);
  addBoxMesh(shell, 0.14, 5.5, 0.28, -24.43, 16.58, -6.4, p.woodDark);
  addBoxMesh(shell, 0.14, 5.5, 0.28, -24.43, 16.58, 6.4, p.woodDark);
  addBoxMesh(shell, 0.6, 5.6, 9.0, 1.2, 16.58, -8.65, p.plasterWarm);
  addBoxMesh(shell, 0.6, 5.6, 8.6, 1.2, 16.58, 9.2, p.plasterWarm);
  addBoxMesh(shell, 0.68, 1.35, 9.6, 1.2, 18.7, 0.4, p.woodDark);

  const backSlope = new THREE.Mesh(new THREE.BoxGeometry(28.4, 0.48, 18.8), p.roofSlate);
  backSlope.position.set(-11.3, 21.8, -6.8);
  backSlope.rotation.x = 0.52;
  backSlope.castShadow = true;
  backSlope.receiveShadow = true;
  shell.add(backSlope);
  const roofMossPatch = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 4.4), p.roofMoss);
  roofMossPatch.position.set(-17.4, 21.45, -8.6);
  roofMossPatch.rotation.x = 0.52;
  shell.add(roofMossPatch);

  addBoxMesh(shell, 3.6, 3.1, 3.6, -10.8, 22.6, -7.0, p.plasterWarm);
  addConeMesh(shell, 2.75, 2.8, 4, -10.8, 25.4, -7.0, p.roofSlate, Math.PI * 0.25);
  addBoxMesh(shell, 2.0, 1.8, 0.16, -10.8, 22.6, -5.14, p.stainedAmber, 0, false, false);

  for (const rx of [-22.8, -17.0, -11.2, -5.4, 0.4]) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 16.2), p.woodDark);
    rafter.position.set(rx, 21.45, 5.8);
    rafter.rotation.x = -0.52;
    shell.add(rafter);
    addCylMesh(shell, 0.18, 0.18, 0.26, 6, rx, 22.2, 3.0, p.glowLantern, false, false);
    addCylMesh(shell, 0.15, 0.15, 0.22, 6, rx, 20.0, 7.6, p.glowLantern, false, false);
  }
  addBoxMesh(shell, 28.8, 0.64, 0.64, -11.3, 25.8, 0.35, p.woodDark);
  addConeMesh(shell, 0.46, 1.8, 6, 3.0, 27.0, 0.35, p.gold);

  // COLOSSAL OCTAGONAL ARCHMAGE TURRET on Back-Left (-24.8, -13.8)
  addCylMesh(shell, 4.0, 4.45, 36.2, 8, -24.8, 5.3, -13.8, p.stoneWall);
  addCylMesh(shell, 4.65, 4.1, 1.5, 8, -24.8, 22.8, -13.8, p.stoneLight);
  addCylMesh(shell, 4.3, 4.3, 0.46, 8, -24.8, 14.2, -13.8, p.woodDark);
  for (const wy of [-3.0, 5.8, 12.8, 19.6]) {
    addBoxMesh(shell, 0.78, 2.0, 0.28, -24.8, wy, -9.55, p.stainedAmber, 0, false, false);
    addBoxMesh(shell, 0.28, 2.0, 0.78, -20.55, wy, -13.8, p.stainedCyan, 0, false, false);
  }
  addConeMesh(shell, 5.5, 11.0, 8, -24.8, 28.8, -13.8, p.roofSlate);
  addCylMesh(shell, 0.13, 0.13, 4.0, 6, -24.8, 35.5, -13.8, p.gold);
  const crescent = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.11, 6, 12, Math.PI * 1.45),
    p.gold
  );
  crescent.position.set(-24.8, 37.35, -13.8);
  crescent.rotation.z = 0.6;
  shell.add(crescent);

  // TALL STONE HEARTH CHIMNEY + Animated Smoke Puffs
  addBoxMesh(shell, 3.1, 41.2, 4.4, -26.0, 7.8, -1.8, p.stoneDark);
  addBoxMesh(shell, 3.7, 0.78, 5.0, -26.0, 28.65, -1.8, p.stoneLight);
  addCylMesh(shell, 0.5, 0.58, 1.35, 6, -26.0, 29.68, -2.8, p.copper);
  addCylMesh(shell, 0.5, 0.58, 1.35, 6, -26.0, 29.68, -0.8, p.copper);

  const chimneySmoke = new THREE.Group();
  chimneySmoke.position.set(-26.0, 30.8, -1.8);
  for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.56 + i * 0.17, 0),
      p.steam
    );
    puff.position.set(i * 0.26, i * 1.0, -i * 0.15);
    chimneySmoke.add(puff);
  }
  shell.add(chimneySmoke);

  // EAST ROOFTOP GARDEN PARAPET
  addBoxMesh(shell, 22.8, 1.48, 0.62, 12.9, 14.52, -13.5, p.stoneLight);
  addBoxMesh(shell, 0.62, 1.48, 26.66, 24.0, 14.52, 0.12, p.stoneLight);
  addBoxMesh(shell, 22.2, 0.4, 0.44, 12.5, 13.98, 13.5, p.stoneLight);
  for (let bx = 2.4; bx <= 22.6; bx += 1.55) {
    addBoxMesh(shell, 0.28, 0.72, 0.28, bx, 14.56, 13.5, p.stoneLight);
  }
  addBoxMesh(shell, 22.6, 0.26, 0.48, 12.5, 15.04, 13.5, p.stoneLight);
  for (const [ux, uz] of [
    [23.9, 13.45],
    [23.9, -13.45],
    [1.8, 13.45],
  ] as Array<[number, number]>) {
    addCylMesh(shell, 0.5, 0.34, 0.74, 6, ux, 15.6, uz, p.stoneWall);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), p.glowLantern);
    orb.position.set(ux, 16.2, uz);
    shell.add(orb);
  }

  /* ======================================================================== */
  /* 5. INTERIOR STAIRCASES WITH HANDRAILS (All 5 Levels Connected!)          */
  /* ======================================================================== */
  // B2 -> B1 Stone Crypt Stairs (back-left x = -19.8)
  for (let s = 0; s < 14; s++) {
    addBoxMesh(shell, 2.8, 0.44, 0.62, -19.8, -12.45 + s * 0.47, -11.8 + s * 0.56, p.stoneAncient);
  }
  const b2Rail = addBoxMesh(shell, 0.11, 0.11, 9.6, -18.35, -8.5, -8.1, p.iron);
  b2Rail.rotation.x = -0.69;

  // B1 -> 1F Stone Cellar Stairs (back-right x = 19.6)
  for (let s = 0; s < 14; s++) {
    addBoxMesh(shell, 2.8, 0.42, 0.62, 19.6, -5.85 + s * 0.45, -11.8 + s * 0.56, p.stoneLight);
  }
  const b1Rail = addBoxMesh(shell, 0.11, 0.11, 9.4, 18.1, -2.15, -8.1, p.iron);
  b1Rail.rotation.x = -0.68;

  // 1F -> 2F Grand Oak Staircase with Red Carpet Runner (back-center x = -2.2)
  for (let s = 0; s < 15; s++) {
    const sy = 0.38 + s * 0.45;
    const sz = -11.9 + s * 0.56;
    addBoxMesh(shell, 3.0, 0.24, 0.58, -2.2, sy, sz, p.woodOak);
    addBoxMesh(shell, 1.9, 0.05, 0.5, -2.2, sy + 0.145, sz, p.fabricRed, 0, false, true);
  }
  const f1Rail = addBoxMesh(shell, 0.13, 0.13, 10.2, -3.65, 4.35, -7.8, p.woodDark);
  f1Rail.rotation.x = -0.68;
  addBoxMesh(shell, 0.22, 1.5, 0.22, -3.65, 0.75, -11.95, p.woodDark);
  addBoxMesh(shell, 0.22, 1.5, 0.22, -3.65, 7.35, -4.0, p.woodDark);

  // 2F -> 3F Attic Oak Stairs along far back-left corner (x = -21.4)
  for (let s = 0; s < 14; s++) {
    addBoxMesh(shell, 2.2, 0.24, 0.56, -21.4, 7.35 + s * 0.47, -11.9 + s * 0.56, p.woodOak);
  }
  const f2Rail = addBoxMesh(shell, 0.11, 0.11, 9.6, -20.2, 11.3, -8.1, p.woodDark);
  f2Rail.rotation.x = -0.69;

  return { chimneySmoke };
}
