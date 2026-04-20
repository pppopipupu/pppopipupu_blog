"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Delaunay } from "d3-delaunay";
import { Environment } from "@react-three/drei";

const CLICK_THROTTLE_MS = 300;
const CLICK_DEDUP_DISTANCE = 0.3;
const MAX_CRACK_BRANCHES = 150;

const _cachedShardMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  transparent: true,
  opacity: 1,
  roughness: 0.1,
  ior: 1.5,
  thickness: 0.05,
});

const _cachedCrackMaterial = new THREE.LineBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.8,
});

const _cachedGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color().setHSL(0.5, 0.1, 0.9),
  transmission: 0.9,
  transparent: true,
  opacity: 1,
  roughness: 0.05,
  ior: 1.5,
  thickness: 0.1,
});

const _tempDir = new THREE.Vector3();
const _tempTorque = new THREE.Vector3();

function Shards({
  width,
  height,
  pointCount = 40,
  shattered,
  clickPos,
}: {
  width: number;
  height: number;
  pointCount?: number;
  shattered: boolean;
  clickPos: THREE.Vector3 | null;
}) {
  const geometriesData = useMemo(() => {
    const points = Array.from({ length: pointCount }, () => [
      (Math.random() - 0.5) * width,
      (Math.random() - 0.5) * height,
    ]);

    for (let i = 0; i < 20; i++) {
      points.push([
        (Math.random() - 0.5) * width * 0.3,
        (Math.random() - 0.5) * height * 0.3,
      ]);
    }

    const allPointsCount = points.length;
    const delaunay = Delaunay.from(points as [number, number][]);
    const voronoi = delaunay.voronoi([-width / 2, -height / 2, width / 2, height / 2]);

    const geometries = [];
    for (let i = 0; i < allPointsCount; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;

      const shape = new THREE.Shape();
      shape.moveTo(polygon[0][0], polygon[0][1]);
      for (let j = 1; j < polygon.length; j++) {
        shape.lineTo(polygon[j][0], polygon[j][1]);
      }

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.05,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.005,
        bevelThickness: 0.005,
      });

      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      const material = _cachedShardMaterial.clone();
      material.color = new THREE.Color().setHSL(0.5, 0.2, 0.8 + Math.random() * 0.2);

      geometries.push({ geometry, center, material });
    }
    return geometries;
  }, [width, height, pointCount]);

  const rigidBodyRefs = useRef<any[]>([]);

  useEffect(() => {
    if (shattered && clickPos) {
      setTimeout(() => {
        geometriesData.forEach((data, index) => {
          const rb = rigidBodyRefs.current[index];
          if (rb) {
            const shardPos = data.center;
            _tempDir.subVectors(shardPos, clickPos).normalize();

            _tempDir.z += (Math.random() * 0.5 + 0.5);
            _tempDir.normalize();

            const distance = shardPos.distanceTo(clickPos);
            const force = Math.max(0, (5 - distance) * 2) + Math.random() * 2;

            rb.applyImpulse(_tempDir.multiplyScalar(force * 0.01), true);
            _tempTorque.set(
              (Math.random() - 0.5) * 0.005,
              (Math.random() - 0.5) * 0.005,
              (Math.random() - 0.5) * 0.005
            );
            rb.applyTorqueImpulse(_tempTorque, true);
          }
        });
      }, 50);
    }
  }, [shattered, clickPos, geometriesData]);

  const type = shattered ? "dynamic" : "kinematicPosition";

  return (
    <group visible={shattered}>
      {geometriesData.map((data, index) => (
        <RigidBody
          key={index}
          ref={(el) => { rigidBodyRefs.current[index] = el; }}
          type={type}
          position={[data.center.x, data.center.y, data.center.z]}
          colliders="hull"
        >
          <mesh geometry={data.geometry} material={data.material} />
        </RigidBody>
      ))}
    </group>
  );
}

function CrackLines({ cracks }: { cracks: THREE.Vector3[][] }) {
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  const geometry = useMemo(() => {
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }
    const pts: THREE.Vector3[] = [];
    cracks.forEach((crack) => {
      for (let i = 0; i < crack.length - 1; i++) {
        pts.push(crack[i], crack[i + 1]);
      }
    });
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geometryRef.current = geo;
    return geo;
  }, [cracks]);

  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
        geometryRef.current = null;
      }
    };
  }, []);

  if (cracks.length === 0) return null;

  return (
    <lineSegments geometry={geometry} position={[0, 0, 0.06]} material={_cachedCrackMaterial} />
  );
}

function Scene({ onComplete, onShatter }: { onComplete: () => void, onShatter: () => void }) {
  const { viewport } = useThree();
  const [clickCount, setClickCount] = useState(0);
  const [shattered, setShattered] = useState(false);
  const [clickPos, setClickPos] = useState<THREE.Vector3 | null>(null);
  const [cracks, setCracks] = useState<THREE.Vector3[][]>([]);
  const lastClickTime = useRef(0);
  const lastClickPos = useRef<THREE.Vector3 | null>(null);
  const crackCountRef = useRef(0);

  const reqClicks = 3;

  const generateCracks = useCallback((origin: THREE.Vector3) => {
    if (crackCountRef.current >= MAX_CRACK_BRANCHES) return;

    const newCracks: THREE.Vector3[][] = [];
    const numBranches = Math.floor(Math.random() * 4) + 6;
    const remaining = MAX_CRACK_BRANCHES - crackCountRef.current;
    const actualBranches = Math.min(numBranches, remaining);

    for (let i = 0; i < actualBranches; i++) {
      const points = [origin.clone()];
      let cx = origin.x, cy = origin.y;

      let angle = Math.random() * Math.PI * 2;
      let length = Math.random() * 2 + 2;
      let segments = Math.floor(Math.random() * 10) + 5;

      for (let j = 0; j < segments; j++) {
        angle += (Math.random() - 0.5) * 0.8;
        const stepLength = length / segments * (Math.random() * 0.5 + 0.8);
        cx += Math.cos(angle) * stepLength;
        cy += Math.sin(angle) * stepLength;
        const pt = new THREE.Vector3(cx, cy, 0);
        points.push(pt);

        if (Math.random() < 0.25 && crackCountRef.current + newCracks.length + 1 < MAX_CRACK_BRANCHES) {
          const forkPoints = [new THREE.Vector3(cx, cy, 0)];
          let forkAngle = angle + (Math.random() > 0.5 ? 0.8 : -0.8);
          let fx = cx, fy = cy;
          let forkSegments = Math.floor(segments / 2);
          for (let k = 0; k < forkSegments; k++) {
            forkAngle += (Math.random() - 0.5) * 0.5;
            fx += Math.cos(forkAngle) * stepLength;
            fy += Math.sin(forkAngle) * stepLength;
            forkPoints.push(new THREE.Vector3(fx, fy, 0));
          }
          newCracks.push(forkPoints);
        }
      }
      newCracks.push(points);
    }
    crackCountRef.current += newCracks.length;
    setCracks((prev) => [...prev, ...newCracks]);
  }, []);

  const handleClick = useCallback((e: any) => {
    if (shattered) return;

    const now = performance.now();
    if (now - lastClickTime.current < CLICK_THROTTLE_MS) return;

    const clickPoint = e.point as THREE.Vector3;
    if (lastClickPos.current && lastClickPos.current.distanceTo(clickPoint) < CLICK_DEDUP_DISTANCE) {
      return;
    }

    lastClickTime.current = now;
    lastClickPos.current = clickPoint.clone();

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= reqClicks) {
      setClickPos(clickPoint);
      setShattered(true);
      onShatter();

      setTimeout(() => {
        onComplete();
      }, 10000);
    } else {
      generateCracks(clickPoint);
    }
  }, [shattered, clickCount, onShatter, onComplete, generateCracks]);

  const planeGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(viewport.width * 2, viewport.height * 2);
  }, [viewport.width, viewport.height]);

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" position={[0, -viewport.height / 2 - 0.1, 0]}>
          <CuboidCollider args={[viewport.width * 2, 0.2, 5]} />
        </RigidBody>

        <group onClick={handleClick}>
          {!shattered && (
            <mesh position={[0, 0, 0.05]} geometry={planeGeometry} material={_cachedGlassMaterial} />
          )}
          {!shattered && <CrackLines cracks={cracks} />}

          <Shards
            width={Math.max(viewport.width, 10)}
            height={Math.max(viewport.height * 1.5, 10)}
            pointCount={50}
            shattered={shattered}
            clickPos={clickPos}
          />
        </group>
      </Physics>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
    </>
  );
}

export default function GlassOverlay() {
  const [active, setActive] = useState(true);
  const [isShattered, setIsShattered] = useState(false);

  if (!active) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        pointerEvents: isShattered ? "none" : "auto",
        background: "transparent",
      }}
      className={isShattered ? "" : "backdrop-blur-sm"}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%", display: 'block', pointerEvents: isShattered ? "none" : "auto" }}
      >
        <React.Suspense fallback={null}>
          <Scene onShatter={() => setIsShattered(true)} onComplete={() => setActive(false)} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
