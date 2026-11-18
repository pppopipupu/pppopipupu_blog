"use client";

import React, { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { DummyType } from "../types";
import { getTerrainHeight } from "../spells/InfiniteTerrain";

export function FirstPersonClick({
  firstPerson,
  playerHp,
  playerDummy,
  onCast,
}: {
  firstPerson: boolean;
  playerHp: number;
  playerDummy: DummyType;
  onCast: (point: THREE.Vector3) => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!firstPerson) return;
    playerDummy.pos.copy(camera.position);
    playerDummy.pos.y -= 1.8;
    playerDummy.target.copy(playerDummy.pos);
  });

  useEffect(() => {
    if (!firstPerson || playerHp <= 0) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest(".glass-overlay") || target.closest("button") || target.closest("input"))) {
        return;
      }
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPoint = new THREE.Vector3();
      let castPoint: THREE.Vector3 | null = null;
      if (raycaster.ray.intersectPlane(plane, targetPoint)) {
        const dir = targetPoint.clone().sub(camera.position);
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const dot = dir.dot(lookDir);
        if (dot > 0 && dir.length() < 120) castPoint = targetPoint;
      }
      if (!castPoint) {
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        castPoint = camera.position.clone().addScaledVector(lookDir, 40);
      }
      castPoint.y = getTerrainHeight(castPoint.x, castPoint.z).height;
      onCast(castPoint);
    };
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [firstPerson, camera, onCast, playerHp]);

  return null;
}
