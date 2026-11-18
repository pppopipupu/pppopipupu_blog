import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBoltGeometry } from "./LightningStrike";

export interface StormOfVengeanceProps {
  center: THREE.Vector3;
  radius?: number;
  onStage?: (stage: number, strikePoints?: THREE.Vector3[]) => void;
  onDone: () => void;
}

export function StormOfVengeance({
  center,
  radius = 90,
  onStage,
  onDone,
}: StormOfVengeanceProps) {
  const groupRef = useRef<THREE.Group>(null);

  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageCountRef = useRef(0);
  const startedRef = useRef(false);

  const onStageRef = useRef<typeof onStage>(onStage);
  const onDoneRef = useRef<typeof onDone>(onDone);

  const centerRef = useRef<THREE.Vector3>(center.clone());
  const radiusRef = useRef<number>(radius);

  const strikePointsRef = useRef<THREE.Vector3[]>([]);

  const cloudLayer1Ref = useRef<THREE.Mesh>(null);
  const cloudLayer2Ref = useRef<THREE.Mesh>(null);
  const cloudLayer3Ref = useRef<THREE.Mesh>(null);
  const cloudGroupRef = useRef<THREE.Group>(null);

  const bolt1GroupRef = useRef<THREE.Group>(null);
  const bolt2GroupRef = useRef<THREE.Group>(null);
  const bolt3GroupRef = useRef<THREE.Group>(null);
  const boltFlickerRef = useRef({ t: 0, next: 0.05 });

  const flashLightRef = useRef<THREE.PointLight>(null);
  const cloudFlashRef = useRef<THREE.PointLight>(null);

  const hailRef = useRef<THREE.Points>(null);
  const rainRef = useRef<THREE.Points>(null);
  const streaksRef = useRef<THREE.Points>(null);
  const mistRef = useRef<THREE.Points>(null);

  const cloudY = 38;
  const cloudBaseRadius = Math.min(radiusRef.current * 0.666, 60);
  const cloudMaxRadius = radiusRef.current;

  useEffect(() => {
    onStageRef.current = onStage;
  }, [onStage]);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    centerRef.current.copy(center);
    radiusRef.current = radius;
  }, [center, radius]);

  const boltGeo1 = useMemo(() => {
    const start = new THREE.Vector3(0, cloudY - 2, 0);
    const end = new THREE.Vector3(15, 2, 10);
    return createBoltGeometry(start, end, 14);
  }, []);

  const boltGeo2 = useMemo(() => {
    const start = new THREE.Vector3(5, cloudY - 2, -8);
    const end = new THREE.Vector3(-12, 2, -15);
    return createBoltGeometry(start, end, 14);
  }, []);

  const boltGeo3 = useMemo(() => {
    const start = new THREE.Vector3(-10, cloudY - 1, 5);
    const end = new THREE.Vector3(0, 1, 0);
    return createBoltGeometry(start, end, 12);
  }, []);

  const cloudMat1 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#1a1028"),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const cloudMat2 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#241630"),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const cloudMat3 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#15101d"),
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const boltMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#f0f8ff"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const boltGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#dceeff"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  const hailGeo = useMemo(() => {
    const count = 300;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color("#f8fbff");
    const rMax = cloudMaxRadius;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * rMax * 0.8;
      const h = cloudY - Math.random() * 4;
      pos[i * 3 + 0] = Math.cos(angle) * r;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i * 3 + 0] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = -(12 + Math.random() * 8);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cloudMaxRadius]);

  const rainGeo = useMemo(() => {
    const count = 2500;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color("#7dff9a");
    const rMax = cloudMaxRadius;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * rMax;
      const h = cloudY - Math.random() * 6;
      pos[i * 3 + 0] = Math.cos(angle) * r;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
      vel[i * 3 + 1] = -(16 + Math.random() * 10);
      vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cloudMaxRadius]);

  const streaksGeo = useMemo(() => {
    const count = 1200;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color("#d6f4ff");
    const c2 = new THREE.Color("#ffffff");
    const rMax = cloudMaxRadius;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * rMax;
      const h = Math.random() * 25 + 5;
      pos[i * 3 + 0] = Math.cos(angle) * r;
      pos[i * 3 + 1] = h;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      const dir = angle + Math.PI * 0.25;
      vel[i * 3 + 0] = Math.cos(dir) * (28 + Math.random() * 16);
      vel[i * 3 + 1] = -(2 + Math.random() * 4);
      vel[i * 3 + 2] = Math.sin(dir) * (28 + Math.random() * 16);
      const t = Math.random();
      const c = t < 0.5 ? c1 : c2;
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cloudMaxRadius]);

  const mistGeo = useMemo(() => {
    const count = 600;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color("#b8e6ff");
    const rMax = cloudMaxRadius;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * rMax * 0.9;
      pos[i * 3 + 0] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 2.5 + 0.2;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i * 3 + 0] = (Math.random() - 0.5) * 1.2;
      vel[i * 3 + 1] = Math.random() * 0.4;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [cloudMaxRadius]);

  const hailMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.25,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const rainMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const streakMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const mistMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  const activeStagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const c = centerRef.current;
    const r = radiusRef.current;

    stageCountRef.current = 1;
    activeStagesRef.current.add(1);
    if (onStageRef.current) {
      onStageRef.current(1);
    }
    if (bolt3GroupRef.current) {
      bolt3GroupRef.current.visible = true;
      boltMat.opacity = 0.9;
      boltGlowMat.opacity = 0.5;
    }
    if (flashLightRef.current) {
      flashLightRef.current.intensity = 120;
    }
    if (cloudFlashRef.current) {
      cloudFlashRef.current.intensity = 80;
    }

    stageIntervalRef.current = setInterval(() => {
      stageCountRef.current += 1;
      const stage = stageCountRef.current;
      if (stage > 10) {
        if (stageIntervalRef.current) {
          clearInterval(stageIntervalRef.current);
          stageIntervalRef.current = null;
        }
        return;
      }
      activeStagesRef.current.add(stage);

      if (stage === 2) {
        if (hailMat) hailMat.opacity = 0.9;
      } else if (stage === 3) {
        const rLimit = r * 0.85;
        const localPts: THREE.Vector3[] = [];
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const pr = Math.random() * rLimit;
          localPts.push(new THREE.Vector3(Math.cos(angle) * pr, 0, Math.sin(angle) * pr));
        }
        const worldPts: THREE.Vector3[] = localPts.map(
          (lp) => new THREE.Vector3(c.x + lp.x, c.y, c.z + lp.z)
        );
        strikePointsRef.current = worldPts;
        if (bolt1GroupRef.current && bolt2GroupRef.current) {
          bolt1GroupRef.current.visible = true;
          bolt2GroupRef.current.visible = true;
          bolt1GroupRef.current.position.set(
            localPts[0].x - 15 + (Math.random() - 0.5) * 4,
            0,
            localPts[0].z - 10 + (Math.random() - 0.5) * 4
          );
          bolt2GroupRef.current.position.set(
            localPts[1].x + 12 + (Math.random() - 0.5) * 4,
            0,
            localPts[1].z + 15 + (Math.random() - 0.5) * 4
          );
        }
        boltMat.opacity = 1.0;
        boltGlowMat.opacity = 0.6;
        if (flashLightRef.current) {
          flashLightRef.current.intensity = 200;
        }
        if (cloudFlashRef.current) {
          cloudFlashRef.current.intensity = 140;
        }
        if (onStageRef.current) {
          onStageRef.current(3, strikePointsRef.current);
        }
        return;
      } else if (stage === 4) {
        if (rainMat) rainMat.opacity = 0.85;
      } else if (stage >= 5 && stage <= 10) {
        if (streakMat) streakMat.opacity = 0.8;
        if (mistMat) mistMat.opacity = 0.4;
      }

      if (onStageRef.current) {
        onStageRef.current(stage);
      }
    }, 1200);

    doneTimeoutRef.current = setTimeout(() => {
      if (onDoneRef.current) {
        onDoneRef.current();
      }
    }, 12000);

    return () => {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      if (doneTimeoutRef.current) {
        clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (cloudLayer1Ref.current) {
      cloudLayer1Ref.current.rotation.y += delta * 0.08;
    }
    if (cloudLayer2Ref.current) {
      cloudLayer2Ref.current.rotation.y -= delta * 0.06;
    }
    if (cloudLayer3Ref.current) {
      cloudLayer3Ref.current.rotation.y += delta * 0.04;
    }

    boltFlickerRef.current.t += delta;
    if (boltFlickerRef.current.t > boltFlickerRef.current.next) {
      boltFlickerRef.current.t = 0;
      boltFlickerRef.current.next = 0.03 + Math.random() * 0.12;
      const flicker = Math.random() < 0.25;
      if (bolt3GroupRef.current && activeStagesRef.current.has(1)) {
        bolt3GroupRef.current.visible = flicker || Math.random() < 0.15;
        if (bolt3GroupRef.current.visible) {
          boltMat.opacity = 0.6 + Math.random() * 0.4;
          boltGlowMat.opacity = 0.3 + Math.random() * 0.3;
        } else {
          boltMat.opacity *= 0.5;
          boltGlowMat.opacity *= 0.5;
        }
      }
      if (cloudFlashRef.current) {
        cloudFlashRef.current.intensity = flicker ? 40 + Math.random() * 60 : 10 + Math.random() * 20;
      }
    }

    if (flashLightRef.current && flashLightRef.current.intensity > 0) {
      flashLightRef.current.intensity *= Math.max(0, 1 - delta * 4);
      if (flashLightRef.current.intensity < 0.01) flashLightRef.current.intensity = 0;
    }
    if (cloudFlashRef.current && cloudFlashRef.current.intensity > 0) {
      cloudFlashRef.current.intensity *= Math.max(0, 1 - delta * 2.5);
    }

    if (boltMat.opacity > 0) {
      boltMat.opacity *= Math.max(0, 1 - delta * 6);
    }
    if (boltGlowMat.opacity > 0) {
      boltGlowMat.opacity *= Math.max(0, 1 - delta * 6);
    }
    if (boltMat.opacity < 0.01) {
      if (bolt1GroupRef.current) bolt1GroupRef.current.visible = false;
      if (bolt2GroupRef.current) bolt2GroupRef.current.visible = false;
      if (bolt3GroupRef.current && !activeStagesRef.current.has(1)) {
        bolt3GroupRef.current.visible = false;
      }
    }

    const rMax = radiusRef.current;

    if (hailRef.current && activeStagesRef.current.has(2)) {
      const geo = hailRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const velAttr = geo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + velAttr.getY(i) * delta;
        if (y < 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * rMax * 0.8;
          posAttr.setX(i, Math.cos(angle) * r);
          posAttr.setY(i, cloudY - Math.random() * 3);
          posAttr.setZ(i, Math.sin(angle) * r);
          velAttr.setY(i, -(12 + Math.random() * 8));
        } else {
          posAttr.setX(i, posAttr.getX(i) + velAttr.getX(i) * delta);
          posAttr.setY(i, y);
          posAttr.setZ(i, posAttr.getZ(i) + velAttr.getZ(i) * delta);
        }
      }
      posAttr.needsUpdate = true;
    }

    if (rainRef.current && activeStagesRef.current.has(4)) {
      const geo = rainRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const velAttr = geo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + velAttr.getY(i) * delta;
        if (y < 0.2) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * rMax;
          posAttr.setX(i, Math.cos(angle) * r);
          posAttr.setY(i, cloudY - Math.random() * 4);
          posAttr.setZ(i, Math.sin(angle) * r);
          velAttr.setY(i, -(16 + Math.random() * 10));
        } else {
          posAttr.setX(i, posAttr.getX(i) + velAttr.getX(i) * delta);
          posAttr.setY(i, y);
          posAttr.setZ(i, posAttr.getZ(i) + velAttr.getZ(i) * delta);
        }
      }
      posAttr.needsUpdate = true;
    }

    if (streaksRef.current && stageCountRef.current >= 5 && stageCountRef.current <= 10) {
      const geo = streaksRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const velAttr = geo.attributes.velocity as THREE.BufferAttribute;
      const limitR = rMax * 1.2;
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setX(i, posAttr.getX(i) + velAttr.getX(i) * delta);
        posAttr.setY(i, posAttr.getY(i) + velAttr.getY(i) * delta);
        posAttr.setZ(i, posAttr.getZ(i) + velAttr.getZ(i) * delta);
        const r = Math.sqrt(posAttr.getX(i) * posAttr.getX(i) + posAttr.getZ(i) * posAttr.getZ(i));
        if (r > limitR || posAttr.getY(i) < 0.1) {
          const angle = Math.random() * Math.PI * 2;
          const r2 = Math.random() * rMax;
          posAttr.setX(i, Math.cos(angle) * r2);
          posAttr.setY(i, Math.random() * 30 + 2);
          posAttr.setZ(i, Math.sin(angle) * r2);
          const dir = angle + Math.PI * 0.25;
          velAttr.setX(i, Math.cos(dir) * (28 + Math.random() * 16));
          velAttr.setY(i, -(2 + Math.random() * 4));
          velAttr.setZ(i, Math.sin(dir) * (28 + Math.random() * 16));
        }
      }
      posAttr.needsUpdate = true;
    }

    if (mistRef.current && stageCountRef.current >= 5 && stageCountRef.current <= 10) {
      const geo = mistRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const velAttr = geo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setX(i, posAttr.getX(i) + velAttr.getX(i) * delta);
        posAttr.setY(i, posAttr.getY(i) + velAttr.getY(i) * delta);
        posAttr.setZ(i, posAttr.getZ(i) + velAttr.getZ(i) * delta);
        if (posAttr.getY(i) > 4) {
          posAttr.setY(i, Math.random() * 2.5 + 0.2);
        }
        const r = Math.sqrt(posAttr.getX(i) * posAttr.getX(i) + posAttr.getZ(i) * posAttr.getZ(i));
        if (r > rMax * 0.95) {
          const angle = Math.random() * Math.PI * 2;
          const r2 = Math.random() * rMax * 0.8;
          posAttr.setX(i, Math.cos(angle) * r2);
          posAttr.setZ(i, Math.sin(angle) * r2);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      if (doneTimeoutRef.current) {
        clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }

      boltGeo1.dispose();
      boltGeo2.dispose();
      boltGeo3.dispose();
      hailGeo.dispose();
      rainGeo.dispose();
      streaksGeo.dispose();
      mistGeo.dispose();

      cloudMat1.dispose();
      cloudMat2.dispose();
      cloudMat3.dispose();
      boltMat.dispose();
      boltGlowMat.dispose();
      hailMat.dispose();
      rainMat.dispose();
      streakMat.dispose();
      mistMat.dispose();
    };
  }, [
    boltGeo1,
    boltGeo2,
    boltGeo3,
    boltGlowMat,
    boltMat,
    cloudMat1,
    cloudMat2,
    cloudMat3,
    hailGeo,
    hailMat,
    mistGeo,
    mistMat,
    rainGeo,
    rainMat,
    streakMat,
    streaksGeo,
  ]);

  return (
    <group ref={groupRef} position={[center.x, center.y, center.z]}>
      <group ref={cloudGroupRef} position={[0, cloudY, 0]}>
        <mesh ref={cloudLayer1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[cloudBaseRadius + 10, 48]} />
          <primitive object={cloudMat1} attach="material" />
        </mesh>
        <mesh ref={cloudLayer2Ref} rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <circleGeometry args={[cloudBaseRadius + 20, 48]} />
          <primitive object={cloudMat2} attach="material" />
        </mesh>
        <mesh ref={cloudLayer3Ref} rotation={[Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
          <circleGeometry args={[cloudMaxRadius, 56]} />
          <primitive object={cloudMat3} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]} position={[0, -1, 0]}>
          <circleGeometry args={[cloudBaseRadius + 5, 40]} />
          <meshBasicMaterial
            color="#2a1f3a"
            transparent
            opacity={0.42}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group ref={bolt3GroupRef} visible={false}>
        <mesh geometry={boltGeo3}>
          <primitive object={boltMat} attach="material" />
        </mesh>
        <mesh geometry={boltGeo3} scale={[1.4, 1, 1.4]}>
          <primitive object={boltGlowMat} attach="material" />
        </mesh>
      </group>
      <group ref={bolt1GroupRef} visible={false}>
        <mesh geometry={boltGeo1}>
          <primitive object={boltMat} attach="material" />
        </mesh>
        <mesh geometry={boltGeo1} scale={[1.5, 1, 1.5]}>
          <primitive object={boltGlowMat} attach="material" />
        </mesh>
      </group>
      <group ref={bolt2GroupRef} visible={false}>
        <mesh geometry={boltGeo2}>
          <primitive object={boltMat} attach="material" />
        </mesh>
        <mesh geometry={boltGeo2} scale={[1.5, 1, 1.5]}>
          <primitive object={boltGlowMat} attach="material" />
        </mesh>
      </group>

      <pointLight ref={flashLightRef} position={[0, cloudY - 5, 0]} color="#f0f8ff" intensity={0} distance={160} decay={2} />
      <pointLight ref={cloudFlashRef} position={[0, cloudY, 0]} color="#e6f0ff" intensity={0} distance={120} decay={2} />

      <points ref={hailRef} geometry={hailGeo} material={hailMat} />
      <points ref={rainRef} geometry={rainGeo} material={rainMat} />
      <points ref={streaksRef} geometry={streaksGeo} material={streakMat} />
      <points ref={mistRef} geometry={mistGeo} material={mistMat} />
    </group>
  );
}
