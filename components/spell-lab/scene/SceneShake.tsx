"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { smoothstep } from "./smoothstep";

export function SceneShake({
  intensityRef,
  children,
}: {
  intensityRef: React.RefObject<number>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const s = intensityRef.current ?? 0;
    if (s > 0.01) {
      groupRef.current.position.set(
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2,
      );
      Reflect.set(intensityRef, "current", s * 0.92);
    } else {
      groupRef.current.position.set(0, 0, 0);
      Reflect.set(intensityRef, "current", 0);
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

export function useCelestialCycle(firstPerson: boolean) {
  const { camera, controls, gl } = useThree();
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const sunPos = useMemo(() => new THREE.Vector3(), []);
  const viewCenter = useMemo(() => new THREE.Vector3(), []);
  const dayColor = useMemo(() => new THREE.Color("#4f8fcf"), []);
  const sunsetColor = useMemo(() => new THREE.Color("#d35400"), []);
  const nightColor = useMemo(() => new THREE.Color("#050510"), []);
  const currentFogColor = useMemo(() => new THREE.Color(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const sunTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const loader = new THREE.TextureLoader();
    return loader.load("/face_angry.png");
  }, []);
  const moonTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const loader = new THREE.TextureLoader();
    return loader.load("/face_cry_angry.png");
  }, []);

  useEffect(() => {
    return () => {
      sunTexture?.dispose();
      moonTexture?.dispose();
    };
  }, [sunTexture, moonTexture]);

  useFrame((state) => {
    let ctrlTarget: THREE.Vector3 | null = null;
    if (controls && typeof controls === "object" && "target" in controls) {
      const raw: unknown = controls.target;
      if (raw instanceof THREE.Vector3) ctrlTarget = raw;
    }
    if (firstPerson) {
      viewCenter.copy(state.camera.position);
    } else if (ctrlTarget) {
      viewCenter.copy(ctrlTarget);
    } else {
      viewCenter.set(state.camera.position.x, 0, state.camera.position.z - 50);
    }

    const angle = (state.clock.elapsedTime * 0.1) % (Math.PI * 2);
    const radius = 120;
    const sy = Math.sin(angle) * radius;
    const sz = Math.cos(angle) * radius;
    sunPos.set(0, sy, sz);

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunPos);
      sunLightRef.current.intensity = Math.max(0, Math.sin(angle)) * 1.5;
    }
    if (moonLightRef.current) {
      moonLightRef.current.position.set(0, -sy, -sz);
      moonLightRef.current.intensity = Math.max(0, -Math.sin(angle)) * 0.5;
    }
    if (ambientLightRef.current) {
      const sunHeight = Math.sin(angle);
      let amb = 0.1;
      if (sunHeight > 0.2) {
        amb = THREE.MathUtils.lerp(0.3, 0.6, smoothstep(0.2, 0.5, sunHeight));
      } else if (sunHeight > -0.2) {
        amb = THREE.MathUtils.lerp(0.1, 0.3, smoothstep(-0.2, 0.2, sunHeight));
      }
      ambientLightRef.current.intensity = amb;
    }
    if (fogRef.current) {
      const sunHeight = Math.sin(angle);
      if (sunHeight > 0.2) {
        currentFogColor.lerpColors(sunsetColor, dayColor, smoothstep(0.2, 0.5, sunHeight));
      } else if (sunHeight > -0.2) {
        currentFogColor.lerpColors(nightColor, sunsetColor, smoothstep(-0.2, 0.2, sunHeight));
      } else {
        currentFogColor.copy(nightColor);
      }
      fogRef.current.color.copy(currentFogColor);
      gl.setClearColor(currentFogColor);
    }
    if (sunMeshRef.current) {
      tmpPos.copy(sunPos).normalize().multiplyScalar(450).add(state.camera.position);
      sunMeshRef.current.position.copy(tmpPos);
      sunMeshRef.current.lookAt(state.camera.position);
      sunMeshRef.current.visible = sunPos.y > -10;
    }
    if (moonMeshRef.current) {
      tmpPos.copy(sunPos).negate().normalize().multiplyScalar(450).add(state.camera.position);
      moonMeshRef.current.position.copy(tmpPos);
      moonMeshRef.current.lookAt(state.camera.position);
      moonMeshRef.current.visible = sunPos.y < 10;
    }
  });

  return {
    viewCenter,
    sunPos,
    ambientLightRef,
    sunLightRef,
    moonLightRef,
    fogRef,
    sunMeshRef,
    moonMeshRef,
    sunTexture,
    moonTexture,
  };
}
