"use client";

import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CHUNK_SIZE } from "../types";
import { getTerrainHeight, getBiomeAt } from "./InfiniteTerrain";

// Fog params for the integrator: mount `<fog attach="fog" args={[color, near, far]} />`.
// Keeps fog from flattening near terrain while far ring fades to sky color.
export function getFogParams(viewDistance: number): { near: number; far: number } {
  return {
    near: (viewDistance + 0.5) * CHUNK_SIZE * 0.4,
    far: (viewDistance + 3) * CHUNK_SIZE * 0.9,
  };
}

// Lazy trade-off (documented per spec): ring-following far terrain uses
// RingGeometry (circular hole) instead of a square-cutout plane because one
// geometry + one draw call fills the void beyond (2*vd+1)^2 chunks with no
// extra indexing code. Cost: the hole is round while main terrain is square,
// so the band between the square edge and the inner circle is covered only
// by overlap — the inner radius is set to 0.9 * mainHalf (slightly inside
// the square) and the ring sits at y=-0.3 below main terrain, so the overlap
// is hidden by depth and the seam is invisible. The spec's literal
// "0.7 * mainRange" (= 1.4 * mainHalf, i.e. a diameter/radius mix-up) would
// leave N/S/E/W gaps, so we intentionally use 0.9 * mainHalf instead.
// Vertex heights sample getTerrainHeight WITHOUT crater correction: craters
// are local gameplay edits; far terrain is low-res (64x8) and crater data is
// per-chunk localStorage, so skipping crater lookup here is a deliberate
// perf trade-off — distant craters don't show on the ring.
export function FarTerrain({ cameraPos, viewDistance = 3 }: { cameraPos: THREE.Vector3; viewDistance?: number }) {
  const camGridX = Math.floor(cameraPos.x / CHUNK_SIZE);
  const camGridZ = Math.floor(cameraPos.z / CHUNK_SIZE);
  const centerX = (camGridX + 0.5) * CHUNK_SIZE;
  const centerZ = (camGridZ + 0.5) * CHUNK_SIZE;

  const geo = useMemo(() => {
    const mainHalf = (2 * viewDistance + 1) * CHUNK_SIZE * 0.5;
    const innerRadius = mainHalf * 0.9;
    const outerRadius = Math.max((viewDistance + 4) * CHUNK_SIZE, mainHalf * 1.5 + 40);
    const g = new THREE.RingGeometry(innerRadius, outerRadius, 64, 8);
    g.rotateX(-Math.PI * 0.5);

    const pos = g.attributes.position;
    const arr = pos.array as Float32Array;
    const colors: number[] = [];
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const localX = arr[i * 3];
      const localZ = arr[i * 3 + 2];
      const worldX = centerX + localX;
      const worldZ = centerZ + localZ;
      const hInfo = getTerrainHeight(worldX, worldZ);
      arr[i * 3 + 1] = hInfo.height;
      const biome = getBiomeAt(worldX, worldZ);
      if (biome === "scorched-desolation") {
        tmp.set(hInfo.height < 4 ? "#8b0000" : hInfo.height < 12 ? "#111111" : "#222222");
      } else if (biome === "tundra-spire") {
        tmp.set(hInfo.height < 4 ? "#e0f7fa" : hInfo.height < 12 ? "#e3f2fd" : "#ffffff");
      } else if (biome === "arcane-forest") {
        tmp.set(hInfo.height < 4 ? "#6a0dad" : hInfo.height < 12 ? "#1d4d2b" : "#4b0082");
      } else {
        tmp.set(hInfo.height < 4 ? "#8db600" : hInfo.height < 12 ? "#3c6e47" : "#808080");
      }
      colors.push(tmp.r, tmp.g, tmp.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [camGridX, camGridZ, viewDistance, centerX, centerZ]);

  useEffect(() => {
    return () => {
      geo.dispose();
    };
  }, [geo]);

  return (
    <mesh position={[centerX, -0.3, centerZ]} geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0.05} fog />
    </mesh>
  );
}

export default FarTerrain;
