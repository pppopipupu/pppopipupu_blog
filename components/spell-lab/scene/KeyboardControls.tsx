"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { getTerrainHeight } from "../spells/InfiniteTerrain";
export function KeyboardControls({
  controlsRef,
  firstPerson,
}: {
  controlsRef: React.RefObject<OrbitControlsType | null>;
  firstPerson: boolean;
}) {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  const rightVec = useMemo(() => new THREE.Vector3(), []);
  const forwardVec = useMemo(() => new THREE.Vector3(), []);
  const moveVec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const blur = () => {
      keys.current = {};
    };
    const context = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    // Middle-click (button 1) must be `preventDefault`ed to protect OrbitControls.
    window.addEventListener("contextmenu", context);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("contextmenu", context);
    };
  }, []);

  useFrame((_, delta) => {
    const baseSpeed = 25;
    const multiplier = keys.current["shift"] ? 2.5 : 1.0;
    const speed = baseSpeed * multiplier * delta;
    rightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
    rightVec.y = 0;
    rightVec.normalize();
    forwardVec.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forwardVec.y = 0;
    forwardVec.normalize();
    moveVec.set(0, 0, 0);
    if (keys.current["w"]) moveVec.addScaledVector(forwardVec, speed);
    if (keys.current["s"]) moveVec.addScaledVector(forwardVec, -speed);
    if (keys.current["a"]) moveVec.addScaledVector(rightVec, -speed);
    if (keys.current["d"]) moveVec.addScaledVector(rightVec, speed);

    if (moveVec.lengthSq() > 0) {
      camera.position.add(moveVec);
      if (firstPerson) {
        const hInfo = getTerrainHeight(camera.position.x, camera.position.z);
        const targetY = hInfo.height + 1.8;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
      } else if (controlsRef.current) {
        controlsRef.current.target.add(moveVec);
        controlsRef.current.update();
      }
    } else if (firstPerson) {
      const hInfo = getTerrainHeight(camera.position.x, camera.position.z);
      const targetY = hInfo.height + 1.8;
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
    }
  });
  return null;
}
