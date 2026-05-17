import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ==================== Lightning Bolt Geometry ==================== */
export function createBoltGeometry(start: THREE.Vector3, end: THREE.Vector3, segments: number = 12): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const dir = end.clone().sub(start);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = start.clone().add(dir.clone().multiplyScalar(t));
    if (i > 0 && i < segments) {
      p.x += (Math.random() - 0.5) * 1.5;
      p.z += (Math.random() - 0.5) * 1.5;
    }
    points.push(p);
  }
  const verts: number[] = [];
  const width = 0.15;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const d = b.clone().sub(a).normalize();
    const perp = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(width);
    verts.push(a.x - perp.x, a.y, a.z - perp.z);
    verts.push(a.x + perp.x, a.y, a.z + perp.z);
    verts.push(b.x - perp.x, b.y, b.z - perp.z);
    verts.push(b.x + perp.x, b.y, b.z + perp.z);
    verts.push(b.x - perp.x, b.y, b.z - perp.z);
    verts.push(a.x + perp.x, a.y, a.z + perp.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

/* ==================== Lightning Strike ==================== */
export function LightningStrike({ pos, boltCount, onDone }: { pos: THREE.Vector3; boltCount: number; onDone: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const life = useRef(0);
  const flashRef = useRef<THREE.PointLight>(null);

  const boltsData = useMemo(() => {
    const b: { geo: THREE.BufferGeometry; delay: number; opacity: number }[] = [];
    for (let i = 0; i < boltCount; i++) {
      const start = new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 3,
        18,
        pos.z + (Math.random() - 0.5) * 3
      );
      const end = new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 0.5,
        0,
        pos.z + (Math.random() - 0.5) * 0.5
      );
      b.push({
        geo: createBoltGeometry(start, end, 15),
        delay: (i / boltCount) * 1.5,
        opacity: 0,
      });
    }
    return b;
  }, [pos, boltCount]);

  const materialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const glowMaterialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, delta) => {
    life.current += delta;
    let maxIntensity = 0;
    
    boltsData.forEach((b, i) => {
      const t = life.current - b.delay;
      if (t >= 0) {
        if (t < 0.1) {
          b.opacity = Math.min(1, t / 0.05);
        } else if (t < 0.3) {
          b.opacity = 1 - (t - 0.1) / 0.2;
        } else {
          b.opacity = 0;
        }
      } else {
        b.opacity = 0;
      }
      
      maxIntensity = Math.max(maxIntensity, b.opacity);
      
      if (materialsRef.current[i]) {
        materialsRef.current[i]!.opacity = b.opacity;
      }
      if (glowMaterialsRef.current[i]) {
        glowMaterialsRef.current[i]!.opacity = b.opacity * 0.3;
      }
    });

    if (flashRef.current) {
      flashRef.current.intensity = maxIntensity * 50;
    }

    if (life.current > 2.5) onDone();
  });

  return (
    <group ref={groupRef}>
      <pointLight ref={flashRef} position={[pos.x, 8, pos.z]} color="#aaccff" intensity={0} distance={30} />
      {boltsData.map((b, i) => (
        <mesh key={i} geometry={b.geo}>
          <meshBasicMaterial
            ref={(el) => { materialsRef.current[i] = el; }}
            color="#ccddff"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {boltsData.map((b, i) => (
        <mesh key={`glow-${i}`} geometry={b.geo} scale={[3, 1, 3]}>
          <meshBasicMaterial
            ref={(el) => { glowMaterialsRef.current[i] = el; }}
            color="#4488ff"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
