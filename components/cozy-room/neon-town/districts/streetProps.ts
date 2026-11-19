import {
  TownBuildContext,
  WATER_LEVEL,
  composeMat,
  createGableRoofPrism,
  getTownHeight,
  riverCenterZ,
} from "../townTerrain";

/**
 * Adds fine medieval street-level micro-architecture across the 960m metropolis:
 * - Wrought-iron avenue street lamps & stone bollards
 * - Roofed stone wells in plazas, markets & slums
 * - Stacked barrels, cargo crates, merchant handcarts & notice boards
 * - Heraldic street banner standards & wayfinding signposts
 * - Moored wooden river barges along the southern riverbanks
 */
export function buildStreetProps(ctx: TownBuildContext) {
  /* ---- Helper: Street Lamp Post ---- */
  function addStreetLamp(x: number, z: number) {
    const y = getTownHeight(x, z);
    if (y < WATER_LEVEL + 1.0) return;
    ctx.addCyl(0.14, 0.24, 4.2, 6, composeMat(x, y + 2.1, z), ctx.solidWall, ctx.secondary, 28);
    ctx.addBox(0.58, 0.72, 0.58, composeMat(x, y + 4.45, z), ctx.windowGlow, ctx.primary);
    ctx.addCone(0.52, 0.58, 4, composeMat(x, y + 5.05, z, 0, Math.PI * 0.25, 0), ctx.solidRoof, ctx.secondary, 24);
  }

  /* ---- Helper: Roofed Medieval Stone Well ---- */
  function addStoneWell(x: number, z: number, rotY = 0) {
    const y = getTownHeight(x, z);
    const m = composeMat(x, y, z, 0, rotY, 0);
    // Circular stone well curb
    ctx.addCyl(1.45, 1.55, 1.15, 8, m.clone().multiply(composeMat(0, 0.58, 0)), ctx.solidWall, ctx.primary, 24);
    // Two timber posts & crossbar
    ctx.addBox(0.22, 2.4, 0.22, m.clone().multiply(composeMat(-1.25, 2.1, 0)), ctx.solidWall, ctx.secondary);
    ctx.addBox(0.22, 2.4, 0.22, m.clone().multiply(composeMat(1.25, 2.1, 0)), ctx.solidWall, ctx.secondary);
    ctx.secondary.addTransformedSegment(-1.25, 2.3, 0, 1.25, 2.3, 0, m);
    // Small pitched timber roof over well
    ctx.addBlock(
      createGableRoofPrism(3.3, 1.35, 2.4),
      m.clone().multiply(composeMat(0, 3.25, 0)),
      ctx.solidRoof,
      ctx.primary,
      22
    );
  }

  /* ---- Helper: Stacked Barrels & Cargo Crates Cluster ---- */
  function addCrateCluster(x: number, z: number, rotY = 0) {
    const y = getTownHeight(x, z);
    const m = composeMat(x, y, z, 0, rotY, 0);
    // Cargo crates
    ctx.addBox(1.15, 1.05, 1.15, m.clone().multiply(composeMat(-0.65, 0.52, 0)), ctx.solidWall, ctx.secondary);
    ctx.addBox(0.95, 0.9, 0.95, m.clone().multiply(composeMat(-0.55, 1.45, 0.1, 0, 0.28, 0)), ctx.solidWall, ctx.secondary);
    // Wooden wine barrels
    ctx.addCyl(0.46, 0.42, 1.08, 7, m.clone().multiply(composeMat(0.75, 0.54, -0.35)), ctx.solidRoof, ctx.secondary, 26);
    ctx.addCyl(0.46, 0.42, 1.08, 7, m.clone().multiply(composeMat(1.05, 0.54, 0.52)), ctx.solidRoof, ctx.secondary, 26);
  }

  /* ---- Helper: Wooden Merchant Handcart ---- */
  function addHandcart(x: number, z: number, rotY = 0) {
    const y = getTownHeight(x, z);
    const m = composeMat(x, y + 0.72, z, 0, rotY, 0);
    ctx.addBox(1.5, 0.62, 2.6, m, ctx.solidWall, ctx.secondary);
    for (const wx of [-0.85, 0.85]) {
      ctx.addCyl(0.55, 0.55, 0.14, 8, m.clone().multiply(composeMat(wx, -0.22, 0, 0, 0, Math.PI * 0.5)), ctx.solidWall, ctx.secondary, 26);
    }
    // Pull shafts
    ctx.secondary.addTransformedSegment(-0.5, -0.1, 1.3, -0.5, -0.35, 2.4, m);
    ctx.secondary.addTransformedSegment(0.5, -0.1, 1.3, 0.5, -0.35, 2.4, m);
  }

  /* ---- Helper: Wayfinding Signpost / Notice Board ---- */
  function addNoticeBoard(x: number, z: number, rotY = 0) {
    const y = getTownHeight(x, z);
    const m = composeMat(x, y, z, 0, rotY, 0);
    ctx.addBox(0.2, 2.8, 0.2, m.clone().multiply(composeMat(-1.0, 1.4, 0)), ctx.solidWall, ctx.secondary);
    ctx.addBox(0.2, 2.8, 0.2, m.clone().multiply(composeMat(1.0, 1.4, 0)), ctx.solidWall, ctx.secondary);
    ctx.addBox(2.1, 1.35, 0.14, m.clone().multiply(composeMat(0, 1.95, 0)), ctx.solidWall, ctx.primary);
    ctx.addBox(2.4, 0.18, 0.72, m.clone().multiply(composeMat(0, 2.82, 0, 0.2, 0, 0)), ctx.solidRoof, ctx.secondary);
  }

  /* ---- 1. Street Lamps & Stone Bollards Lining All Main Avenues ---- */
  // South Imperial Avenue (z = 104 to 218)
  for (let z = 106; z <= 216; z += 18) {
    addStreetLamp(-8.4, z);
    addStreetLamp(8.4, z);
    // Stone bollards between lamps
    const by = getTownHeight(-8.0, z + 9);
    ctx.addCyl(0.28, 0.34, 1.05, 6, composeMat(-8.0, by + 0.52, z + 9), ctx.solidWall, ctx.fine, 26);
    ctx.addCyl(0.28, 0.34, 1.05, 6, composeMat(8.0, by + 0.52, z + 9), ctx.solidWall, ctx.fine, 26);
  }
  // North Royal Processional Way
  for (let z = -6; z >= -42; z -= 14) {
    addStreetLamp(-9.0, z);
    addStreetLamp(9.0, z);
  }
  // West Commercial Avenue
  for (let x = -54; x >= -152; x -= 20) {
    const zMid = 56 - ((Math.abs(x) - 44) / 112) * 24;
    addStreetLamp(x, zMid - 7.5);
    addStreetLamp(x, zMid + 7.5);
  }
  // East Noble Boulevard
  for (let x = 54; x <= 162; x += 22) {
    const zMid = 48 - ((x - 44) / 124) * 26;
    addStreetLamp(x, zMid - 8.0);
    addStreetLamp(x, zMid + 8.0);
  }

  /* ---- 2. Medieval Stone Wells Across Districts ---- */
  const wells: Array<[number, number, number]> = [
    [-72, 56, 0.2],      // Main Market Square well
    [-128, 42, -0.35],   // West Artisan Quarter well
    [-98, 152, 0.45],    // South-West Slum communal well
    [94, 154, -0.25],    // South-East Slum communal well
    [98, 6, 0.1],        // Noble Quarter fountain-well
    [-22, 188, 0.15],    // Gatehouse Barracks well
  ];
  for (const [wx, wz, wrot] of wells) {
    addStoneWell(wx, wz, wrot);
  }

  /* ---- 3. Market & Street-Side Cargo Crates, Barrels, Handcarts & Notice Boards ---- */
  const crateSpots: Array<[number, number, number]> = [
    [-50, 44, 0.3], [-64, 62, -0.4], [-96, 48, 0.8], [-114, 72, 0.15],
    [-146, 52, 1.1], [-18, 198, -0.2], [18, 198, 0.25], [-74, 134, 0.6],
    [-126, 162, -0.5], [76, 136, 0.4], [118, 166, -0.7], [-44, 14, 0.2],
    [42, 16, -0.3], [-24, 214, 0.1], [24, 214, -0.15],
  ];
  for (const [cx, cz, crot] of crateSpots) {
    addCrateCluster(cx, cz, crot);
  }

  const cartSpots: Array<[number, number, number]> = [
    [-62, 46, 0.35], [-104, 64, -0.5], [-134, 34, 1.2],
    [-14, 172, 0.08], [16, 144, -0.12], [-84, 144, 0.9],
  ];
  for (const [hx, hz, hrot] of cartSpots) {
    addHandcart(hx, hz, hrot);
  }

  const boardSpots: Array<[number, number, number]> = [
    [-12, 96, 0.35], [12, 96, -0.35], [-52, 62, 0.18],
    [54, 42, -0.22], [-14, 218, 0.12],
  ];
  for (const [bx, bz, brot] of boardSpots) {
    addNoticeBoard(bx, bz, brot);
  }

  /* ---- 4. Plaza & Avenue Carved Stone Benches ---- */
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bx = Math.cos(a) * 20;
    const bz = 56 + Math.sin(a) * 20;
    const by = getTownHeight(bx, bz);
    ctx.addBox(3.4, 0.68, 1.05, composeMat(bx, by + 0.45, bz, 0, -a + Math.PI * 0.5, 0), ctx.solidWall, ctx.secondary);
  }

  /* ---- 5. Moored Wooden River Barges along Southern Riverbanks ---- */
  for (const [bx, bRot] of [
    [-46, 0.12],
    [-112, -0.08],
    [54, -0.14],
    [126, 0.1],
  ] as Array<[number, number]>) {
    const bz = riverCenterZ(bx) - 8.5;
    const m = composeMat(bx, WATER_LEVEL + 0.55, bz, 0, bRot, 0);
    ctx.addBox(9.2, 1.1, 3.2, m, ctx.solidWall, ctx.primary);
    ctx.addBox(3.4, 1.6, 2.2, m.clone().multiply(composeMat(-1.6, 1.15, 0)), ctx.solidRoof, ctx.secondary);
    // Wooden mooring pier reaching bank
    ctx.addBox(2.4, 0.45, 7.5, composeMat(bx, WATER_LEVEL + 1.0, bz - 5.2), ctx.solidWall, ctx.secondary);
  }
}
