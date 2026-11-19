import * as THREE from "three";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import {
  BannerMount,
  TownBuildContext,
  WindmillMount,
  buildTerrainAndRiver,
  getTownHeight,
} from "./townTerrain";
import { buildFortificationsAndGatehouse } from "./districts/fortifications";
import { buildPlazaAndCastle } from "./districts/plazaAndCastle";
import { buildUrbanQuarters } from "./districts/urbanQuarters";
import { buildStreetProps } from "./districts/streetProps";
import { buildOuterFarmlandsAndSky } from "./districts/outerFarmlands";

export { getTownHeight };
export type { WindmillMount, BannerMount };

export interface NeonTownSceneData {
  terrainGeo: THREE.BufferGeometry;
  waterGeo: THREE.BufferGeometry;
  staticOcclusionGeo: THREE.BufferGeometry;
  roofOcclusionGeo: THREE.BufferGeometry;
  windowGlowGeo: THREE.BufferGeometry;
  primaryLinesGeo: LineSegmentsGeometry;
  secondaryLinesGeo: LineSegmentsGeometry;
  fineLinesGeo: LineSegmentsGeometry;
  terrainContourLinesGeo: LineSegmentsGeometry;
  riverRippleGeo: LineSegmentsGeometry;
  fountainOrigin: THREE.Vector3;
  fountainJetsGeo: LineSegmentsGeometry;
  fountainRippleGeo: LineSegmentsGeometry;
  windmillMounts: WindmillMount[];
  windmillSailsOcclusionGeo: THREE.BufferGeometry;
  windmillSailsLinesGeo: LineSegmentsGeometry;
  bannerMounts: BannerMount[];
  bannerOcclusionGeo: THREE.BufferGeometry;
  bannerLinesGeo: LineSegmentsGeometry;
  chimneyTops: THREE.Vector3[];
  smokeRingGeo: LineSegmentsGeometry;
  birdLinesGeo: LineSegmentsGeometry;
  cloudOcclusionGeo: THREE.BufferGeometry;
  cloudLinesGeo: LineSegmentsGeometry;
  dispose: () => void;
}

/**
 * Composes all modular district builders into merged GPU-ready geometries
 * for the 960m x 960m Gemini 4 Neon Grand Medieval Metropolis.
 */
export function buildNeonMedievalTownData(): NeonTownSceneData {
  const ctx = new TownBuildContext();

  const { terrainGeo, waterGeo, riverRippleGeo } = buildTerrainAndRiver(ctx);
  buildFortificationsAndGatehouse(ctx);
  const { fountainOrigin, fountainJetsGeo, fountainRippleGeo } = buildPlazaAndCastle(ctx);
  buildUrbanQuarters(ctx);
  buildStreetProps(ctx);
  const animGeos = buildOuterFarmlandsAndSky(ctx);

  const staticOcclusionGeo = ctx.solidWall.toMergedGeometry();
  const roofOcclusionGeo = ctx.solidRoof.toMergedGeometry();
  const windowGlowGeo = ctx.windowGlow.toMergedGeometry();
  const primaryLinesGeo = ctx.primary.toLineSegmentsGeometry();
  const secondaryLinesGeo = ctx.secondary.toLineSegmentsGeometry();
  const fineLinesGeo = ctx.fine.toLineSegmentsGeometry();
  const terrainContourLinesGeo = ctx.contour.toLineSegmentsGeometry();

  return {
    terrainGeo,
    waterGeo,
    staticOcclusionGeo,
    roofOcclusionGeo,
    windowGlowGeo,
    primaryLinesGeo,
    secondaryLinesGeo,
    fineLinesGeo,
    terrainContourLinesGeo,
    riverRippleGeo,
    fountainOrigin,
    fountainJetsGeo,
    fountainRippleGeo,
    windmillMounts: ctx.windmillMounts,
    bannerMounts: ctx.bannerMounts,
    chimneyTops: ctx.chimneyTops,
    ...animGeos,
    dispose: () => {
      terrainGeo.dispose();
      waterGeo.dispose();
      staticOcclusionGeo.dispose();
      roofOcclusionGeo.dispose();
      windowGlowGeo.dispose();
      primaryLinesGeo.dispose();
      secondaryLinesGeo.dispose();
      fineLinesGeo.dispose();
      terrainContourLinesGeo.dispose();
      riverRippleGeo.dispose();
      fountainJetsGeo.dispose();
      fountainRippleGeo.dispose();
      animGeos.windmillSailsOcclusionGeo.dispose();
      animGeos.windmillSailsLinesGeo.dispose();
      animGeos.bannerOcclusionGeo.dispose();
      animGeos.bannerLinesGeo.dispose();
      animGeos.smokeRingGeo.dispose();
      animGeos.birdLinesGeo.dispose();
      animGeos.cloudOcclusionGeo.dispose();
      animGeos.cloudLinesGeo.dispose();
    },
  };
}
