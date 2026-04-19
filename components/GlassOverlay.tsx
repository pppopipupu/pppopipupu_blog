"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { Delaunay } from "d3-delaunay";
import { Environment } from "@react-three/drei";

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

      const color = new THREE.Color().setHSL(0.5, 0.2, 0.8 + Math.random() * 0.2);

      geometries.push({ geometry, center, color });
    }
    return geometries;
  }, [width, height, pointCount]);

  const rigidBodyRefs = useRef<any[]>([]);

  useEffect(() => {
    if (shattered && clickPos) {
      // Delay impulse application to ensure rigid bodies are fully initialized in Rapier
      setTimeout(() => {
        geometriesData.forEach((data, index) => {
          const rb = rigidBodyRefs.current[index];
          if (rb) {
            const shardPos = data.center;
            const direction = new THREE.Vector3().subVectors(shardPos, clickPos).normalize();

            direction.z += (Math.random() * 0.5 + 0.5);
            direction.normalize();

            const distance = shardPos.distanceTo(clickPos);
            const force = Math.max(0, (5 - distance) * 2) + Math.random() * 2;

            rb.applyImpulse(direction.multiplyScalar(force * 0.01), true);
            rb.applyTorqueImpulse(
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
              ),
              true
            );
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
          <mesh geometry={data.geometry}>
            <meshPhysicalMaterial
              color={data.color}
              transmission={0.9}
              transparent
              opacity={1}
              roughness={0.1}
              ior={1.5}
              thickness={0.05}
            />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

function CrackLines({ cracks }: { cracks: THREE.Vector3[][] }) {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    cracks.forEach((crack) => {
      for (let i = 0; i < crack.length - 1; i++) {
        pts.push(crack[i], crack[i + 1]);
      }
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [cracks]);

  if (cracks.length === 0) return null;

  return (
    <lineSegments geometry={geometry} position={[0, 0, 0.06]}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </lineSegments>
  );
}

function Scene({ onComplete, onShatter }: { onComplete: () => void, onShatter: () => void }) {
  const { viewport } = useThree();
  const [clickCount, setClickCount] = useState(0);
  const [shattered, setShattered] = useState(false);
  const [clickPos, setClickPos] = useState<THREE.Vector3 | null>(null);
  const [cracks, setCracks] = useState<THREE.Vector3[][]>([]);

  const reqClicks = 3;

  const generateCracks = (origin: THREE.Vector3) => {
    const newCracks: THREE.Vector3[][] = [];
    const numBranches = Math.floor(Math.random() * 4) + 6;

    for (let i = 0; i < numBranches; i++) {
      const points = [origin.clone()];
      let currentPos = origin.clone();

      let angle = Math.random() * Math.PI * 2;
      let length = Math.random() * 2 + 2;
      let segments = Math.floor(Math.random() * 10) + 5;

      for (let j = 0; j < segments; j++) {
        angle += (Math.random() - 0.5) * 0.8;
        const stepLength = length / segments * (Math.random() * 0.5 + 0.8);
        currentPos = currentPos.clone().add(
          new THREE.Vector3(Math.cos(angle) * stepLength, Math.sin(angle) * stepLength, 0)
        );
        points.push(currentPos);

        if (Math.random() < 0.25) {
          const forkPoints = [currentPos.clone()];
          let forkAngle = angle + (Math.random() > 0.5 ? 0.8 : -0.8);
          let forkPos = currentPos.clone();
          let forkSegments = Math.floor(segments / 2);
          for (let k = 0; k < forkSegments; k++) {
            forkAngle += (Math.random() - 0.5) * 0.5;
            forkPos = forkPos.clone().add(
              new THREE.Vector3(Math.cos(forkAngle) * stepLength, Math.sin(forkAngle) * stepLength, 0)
            );
            forkPoints.push(forkPos);
          }
          newCracks.push(forkPoints);
        }
      }
      newCracks.push(points);
    }
    setCracks((prev) => [...prev, ...newCracks]);
  }

  const handleClick = (e: any) => {
    if (shattered) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= reqClicks) {
      setClickPos(e.point);
      setShattered(true);
      onShatter();

      setTimeout(() => {
        onComplete();
      }, 10000);
    } else {
      generateCracks(e.point);
    }
  };

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" position={[0, -viewport.height / 2 - 0.1, 0]}>
          <CuboidCollider args={[viewport.width * 2, 0.2, 5]} />
        </RigidBody>

        <group onClick={handleClick}>
          {!shattered && (
            <mesh position={[0, 0, 0.05]}>
              <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
              <meshPhysicalMaterial
                color={new THREE.Color().setHSL(0.5, 0.1, 0.9)}
                transmission={0.9}
                transparent
                opacity={1}
                roughness={0.05}
                ior={1.5}
                thickness={0.1}
              />
            </mesh>
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
