import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DummyType } from "../types";

export function PrismaticWall({ start, end, onDone, applyDamage }: { start: THREE.Vector3, end: THREE.Vector3, onDone: () => void, applyDamage: (hitTest: any, min: number, max: number, color: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const life = useRef(0);
  const dist = start.distanceTo(end);
  const mid = start.clone().lerp(end, 0.5);

  const colors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];
  
  useEffect(() => {
    if (ref.current) {
      ref.current.lookAt(end.x, mid.y, end.z);
    }
  }, [start, end, mid]);

  useFrame((_, delta) => {
    life.current += delta;
    if (life.current > 5) {
      onDone();
      return;
    }
    if (ref.current) {
      const s = Math.min(1, life.current * 4) * Math.min(1, (5 - life.current) * 4);
      ref.current.scale.set(1, s, 1);
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const line = new THREE.Line3(start, end);
      applyDamage((d: DummyType) => {
        const closest = new THREE.Vector3();
        line.closestPointToPoint(d.pos, true, closest);
        return d.pos.distanceTo(closest) < 3.5; // Increased hit radius
      }, 6, 60, "rainbow");
    }, 1000);
    return () => clearInterval(interval);
  }, [start, end, applyDamage]);

  return (
    <group ref={ref} position={mid}>
      <pointLight color="#ff00ff" intensity={15} distance={25} position={[0, 3, 0]} />
      {colors.map((c, i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.8, 0]}>
          <boxGeometry args={[3.5, 0.8, dist]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={10} transparent opacity={0.7} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
