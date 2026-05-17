import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function DisintegrateRay({ start, end, onDone }: { start: THREE.Vector3, end: THREE.Vector3, onDone: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const life = useRef(0);
  
  const mid = useMemo(() => start.clone().lerp(end, 0.5), [start, end]);
  const dist = useMemo(() => start.distanceTo(end), [start, end]);

  useEffect(() => {
    if (ref.current) {
      ref.current.lookAt(end);
    }
  }, [end]);

  useFrame((_, delta) => {
    life.current += delta;
    if (ref.current) {
      ref.current.scale.set(1 - life.current / 0.5, 1 - life.current / 0.5, 1);
    }
    if (life.current > 0.5) onDone();
  });

  return (
    <group ref={ref} position={mid}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, dist, 8]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <mesh scale={[1.5, 1.5, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, dist, 8]} />
        <meshBasicMaterial color="#aaffaa" transparent opacity={0.4} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}
