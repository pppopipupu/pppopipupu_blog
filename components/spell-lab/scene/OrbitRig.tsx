"use client";

import React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { CHUNK_SIZE } from "../types";
import { getTerrainHeight } from "../spells/InfiniteTerrain";

export function TerrainCollision({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsType | null>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const terrainY = getTerrainHeight(camera.position.x, camera.position.z).height;
    if (camera.position.y < terrainY + 1.2) {
      camera.position.y = terrainY + 1.2;
    }
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  return null;
}

export function OrbitRig({
  controlsRef,
  firstPerson,
  viewDistance = 3,
  cameraPos,
}: {
  controlsRef: React.RefObject<OrbitControlsType | null>;
  firstPerson: boolean;
  viewDistance?: number;
  cameraPos?: THREE.Vector3;
}) {
  void cameraPos;
  if (firstPerson) {
    return <PointerLockControls makeDefault />;
  }
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        panSpeed={0.9}
        screenSpacePanning
        zoomSpeed={0.9}
        minDistance={4}
        maxDistance={Math.max(200, viewDistance * CHUNK_SIZE * 2.2)}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI - 0.08}
        enablePan
        enableZoom
      />
      <TerrainCollision controlsRef={controlsRef} />
    </>
  );
}
