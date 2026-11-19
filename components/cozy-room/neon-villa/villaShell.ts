import * as THREE from "three";
import { VillaPalette, addBoxMesh, addConeMesh, addCylMesh, addWallSconce } from "./villaPrimitives";

/**
 * 3-Story + Basement Western Fantasy D&D Cutaway Villa Architectural Shell:
 * - Front (+Z) wall cleanly cut away across B1, 1F, 2F, and 3F Attic
 * - Timber wainscoting, exposed ceiling crossbeams, stone arch pilasters,
 *   stained-glass Gothic windows, wizard turret, stone chimney,
 *   cantilevered East Balcony, and low-balustrade Rooftop Garden terrace.
 */
export function buildVillaShell(root: THREE.Group, p: VillaPalette) {
  const shell = new THREE.Group();
  shell.name = "villa_shell";
  root.add(shell);

  /* ---- 1. BASEMENT (B1: y = -4.2 .. 0.0) ---- */
  addBoxMesh(shell, 19.4, 0.6, 13.4, 0, -4.5, 0, p.stoneDark);
  addBoxMesh(shell, 18.8, 4.2, 0.8, 0, -2.1, -6.0, p.stoneDark);
  addBoxMesh(shell, 0.8, 4.2, 12.4, -9.0, -2.1, 0, p.stoneDark);
  addBoxMesh(shell, 0.8, 4.2, 12.4, 9.0, -2.1, 0, p.stoneDark);
  // Stone vault pilasters tucked cleanly along back wall so cutaway view is 100% unobstructed
  for (const px of [-6.0, -1.2, 3.8]) {
    addBoxMesh(shell, 0.65, 4.1, 0.65, px, -2.1, -5.45, p.stoneWall);
    addBoxMesh(shell, 0.45, 0.35, 11.6, px, -0.35, 0, p.woodDark);
  }
  addBoxMesh(shell, 18.8, 0.32, 0.45, 0, -4.16, 6.0, p.stoneWall);
  // Basement warm torches on back stone wall
  for (const tx of [-7.2, 1.2, 6.8]) {
    addWallSconce(shell, tx, -1.4, -5.5, p);
  }

  /* ---- 2. GROUND FLOOR (1F: y = 0.0 .. 4.5) ---- */
  addBoxMesh(shell, 18.8, 0.45, 12.6, 0, -0.22, 0, p.woodFloor);
  addBoxMesh(shell, 18.6, 4.5, 0.65, 0, 2.25, -6.0, p.stoneWall);
  // Warm interior timber wainscoting along 1F back wall
  addBoxMesh(shell, 17.8, 1.15, 0.16, 0, 0.58, -5.6, p.woodDark);
  addBoxMesh(shell, 0.65, 4.5, 12.4, -9.0, 2.25, 0, p.stoneWall);
  // Right wall with wide arched opening to Pool Terrace
  addBoxMesh(shell, 0.65, 4.5, 4.4, 9.0, 2.25, -3.8, p.stoneWall);
  addBoxMesh(shell, 0.65, 4.5, 3.6, 9.0, 2.25, 4.2, p.stoneWall);
  addBoxMesh(shell, 0.72, 1.05, 4.6, 9.0, 3.98, 0.3, p.woodDark);

  // Room divider between Hearth Hall (West) and Kitchen/Dining (East) with timber archway header
  addBoxMesh(shell, 0.36, 4.3, 5.2, 0.6, 2.15, -3.2, p.plasterWarm);
  addBoxMesh(shell, 0.42, 0.36, 12.0, 0.6, 4.18, 0, p.woodDark);
  // Exposed oak ceiling joists on 1F
  for (const bx of [-6.0, -2.5, 4.8]) {
    addBoxMesh(shell, 0.32, 0.32, 11.8, bx, 4.18, 0, p.woodDark);
  }

  // Tall Gothic Mullioned Windows on 1F Back Wall
  for (const wx of [-5.2, 4.8]) {
    addBoxMesh(shell, 2.6, 2.6, 0.78, wx, 2.45, -6.0, p.glass, 0, false, false);
    addBoxMesh(shell, 2.85, 0.24, 0.88, wx, 3.8, -6.0, p.woodDark);
    addBoxMesh(shell, 2.85, 0.24, 0.88, wx, 1.12, -6.0, p.woodDark);
    addBoxMesh(shell, 0.16, 2.65, 0.84, wx, 2.45, -6.0, p.woodDark);
    addBoxMesh(shell, 2.65, 0.14, 0.84, wx, 2.45, -6.0, p.woodDark);
  }
  addWallSconce(shell, -2.4, 2.75, -5.6, p);
  addWallSconce(shell, 2.2, 2.75, -5.6, p);

  /* ---- 3. SECOND FLOOR (2F: y = 4.5 .. 8.8) + EAST BALCONY ---- */
  addBoxMesh(shell, 19.0, 0.42, 12.6, 0, 4.45, 0, p.woodFloor);
  addBoxMesh(shell, 18.6, 4.3, 0.6, 0, 6.75, -6.0, p.plasterWarm);
  addBoxMesh(shell, 0.6, 4.3, 12.4, -9.0, 6.75, 0, p.plasterWarm);
  // East wall with double-door opening to Balcony
  addBoxMesh(shell, 0.6, 4.3, 4.2, 9.0, 6.75, -3.9, p.plasterWarm);
  addBoxMesh(shell, 0.6, 4.3, 3.8, 9.0, 6.75, 4.1, p.plasterWarm);
  addBoxMesh(shell, 0.68, 0.95, 4.4, 9.0, 8.42, 0.2, p.woodDark);

  // 2F Room Partitions: Bedroom (West x < -2.6) | Bathroom (Center -2.6..2.8) | Study (East > 2.8)
  addBoxMesh(shell, 0.3, 4.2, 8.2, -2.6, 6.7, -1.8, p.plasterWarm);
  addBoxMesh(shell, 0.3, 4.2, 8.2, 2.8, 6.7, -1.8, p.plasterWarm);
  // Bathroom tiled floor & tiled back wainscot
  addBoxMesh(shell, 5.1, 0.08, 11.4, 0.1, 4.7, 0, p.tileBath);
  addBoxMesh(shell, 5.1, 2.1, 0.14, 0.1, 5.75, -5.62, p.plasterBath);

  // Exposed ceiling beams & front cutaway trim fascia
  addBoxMesh(shell, 19.2, 0.36, 0.46, 0, 4.55, 6.1, p.woodDark);
  addBoxMesh(shell, 19.2, 0.36, 0.46, 0, 8.85, 6.1, p.woodDark);
  for (const bx of [-5.8, 0.1, 5.8]) {
    addBoxMesh(shell, 0.3, 0.3, 11.8, bx, 8.55, 0, p.woodDark);
  }
  addWallSconce(shell, -5.8, 7.1, -5.6, p);
  addWallSconce(shell, 0.1, 7.3, -5.6, p);
  addWallSconce(shell, 5.6, 7.1, -5.6, p);

  // CANTILEVERED EAST BALCONY (阳台: x = 9.0 .. 14.0, y = 4.5)
  addBoxMesh(shell, 5.0, 0.38, 9.6, 11.5, 4.45, 0.2, p.woodOak);
  for (const bz of [-3.5, 0.2, 3.9]) {
    const brace = addBoxMesh(shell, 3.6, 0.34, 0.34, 10.6, 3.15, bz, p.woodDark);
    brace.rotation.z = 0.68;
  }
  for (const bz of [-4.5, -1.5, 1.5, 4.9]) {
    addBoxMesh(shell, 0.24, 1.25, 0.24, 13.8, 5.25, bz, p.woodDark);
  }
  addBoxMesh(shell, 0.22, 0.2, 9.6, 13.8, 5.82, 0.2, p.woodDark);
  addBoxMesh(shell, 5.0, 0.2, 0.22, 11.5, 5.82, -4.5, p.woodDark);
  addBoxMesh(shell, 5.0, 0.2, 0.22, 11.5, 5.82, 4.9, p.woodDark);
  for (let bz = -3.9; bz <= 4.4; bz += 0.82) {
    addBoxMesh(shell, 0.12, 1.1, 0.12, 13.8, 5.2, bz, p.woodOak);
  }
  // Hanging vine tendrils draping off balcony edge
  for (const vz of [-2.8, 0.6, 3.2]) {
    addBoxMesh(shell, 0.22, 1.8, 0.35, 13.95, 3.8, vz, p.foliageBright);
  }

  /* ---- 4. THIRD FLOOR: ATTIC OBSERVATORY (West) & ROOFTOP GARDEN (East) ---- */
  addBoxMesh(shell, 19.2, 0.44, 12.8, 0, 8.85, 0, p.stoneLight);
  addBoxMesh(shell, 9.5, 0.08, 11.8, -4.35, 9.1, 0, p.woodFloor);

  // West Attic Walls & Cutaway Steep Fantasy Roof
  addBoxMesh(shell, 9.8, 3.5, 0.55, -4.4, 10.75, -6.0, p.plasterWarm);
  addBoxMesh(shell, 0.55, 3.5, 12.2, -9.0, 10.75, 0, p.plasterWarm);
  addBoxMesh(shell, 0.45, 3.5, 4.4, 0.4, 10.75, -3.8, p.plasterWarm);
  addBoxMesh(shell, 0.45, 3.5, 3.4, 0.4, 10.75, 4.3, p.plasterWarm);
  addBoxMesh(shell, 0.52, 0.85, 4.6, 0.4, 12.1, 0.3, p.woodDark);

  const backSlope = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.38, 8.8), p.roofSlate);
  backSlope.position.set(-4.3, 13.6, -3.2);
  backSlope.rotation.x = 0.52;
  backSlope.castShadow = true;
  backSlope.receiveShadow = true;
  shell.add(backSlope);
  // Exposed timber rafters & warm glowing fairy-light orbs along cutaway front slope
  for (const rx of [-8.6, -5.8, -3.0, -0.1]) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 7.6), p.woodDark);
    rafter.position.set(rx, 13.4, 2.8);
    rafter.rotation.x = -0.52;
    shell.add(rafter);
    addCylMesh(shell, 0.14, 0.14, 0.18, 6, rx, 13.8, 1.4, p.glowLantern, false, false);
  }
  addBoxMesh(shell, 11.8, 0.48, 0.48, -4.3, 15.6, 0.2, p.woodDark);

  // Iconic Corner Wizard Turret on Back-Left (-9.3, -6.0)
  addCylMesh(shell, 2.1, 2.4, 16.8, 8, -9.3, 6.4, -6.0, p.stoneWall);
  addConeMesh(shell, 2.9, 6.2, 8, -9.3, 17.6, -6.0, p.roofSlate);
  addCylMesh(shell, 0.09, 0.09, 2.4, 6, -9.3, 21.4, -6.0, p.gold);

  // Tall Stone Hearth Chimney rising along West exterior wall
  addBoxMesh(shell, 1.9, 17.8, 2.6, -9.6, 7.6, -1.0, p.stoneDark);
  addBoxMesh(shell, 2.35, 0.52, 3.0, -9.6, 16.6, -1.0, p.stoneLight);

  // East Rooftop Garden Parapet (low front stone balustrade so garden flowers & fountain are 100% visible!)
  addBoxMesh(shell, 9.0, 1.15, 0.45, 4.8, 9.65, -6.0, p.stoneLight);
  addBoxMesh(shell, 0.45, 1.15, 12.4, 9.1, 9.65, 0, p.stoneLight);
  addBoxMesh(shell, 9.0, 0.35, 0.35, 4.8, 9.25, 6.0, p.stoneLight);
  for (let bx = 1.4; bx <= 8.6; bx += 1.2) {
    addBoxMesh(shell, 0.22, 0.55, 0.22, bx, 9.55, 6.0, p.stoneLight);
  }
  addBoxMesh(shell, 9.0, 0.18, 0.36, 4.8, 9.88, 6.0, p.stoneLight);

  /* ---- 5. INTERIOR STAIRCASES (Cleanly Placed With Zero Furniture Overlap!) ---- */
  // B1 -> 1F Stone Cellar Stairs (back-right)
  for (let s = 0; s < 10; s++) {
    addBoxMesh(shell, 2.1, 0.35, 0.55, 6.4, -3.9 + s * 0.42, -5.0 + s * 0.42, p.stoneLight);
  }
  // 1F -> 2F Oak Staircase (back-center)
  for (let s = 0; s < 11; s++) {
    addBoxMesh(shell, 1.9, 0.24, 0.46, -1.5, 0.3 + s * 0.4, -5.1 + s * 0.43, p.woodOak);
  }
  // 2F -> 3F Attic Stairs cleanly along the left-back corner (x = -8.0, clear of bed at x = -5.4!)
  for (let s = 0; s < 10; s++) {
    addBoxMesh(shell, 1.35, 0.22, 0.44, -8.0, 4.85 + s * 0.42, -5.1 + s * 0.42, p.woodOak);
  }
}
