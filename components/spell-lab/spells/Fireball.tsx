import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Fireball({ pos, onDone }: { pos: THREE.Vector3; onDone: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const phase = useRef<"fly" | "explode" | "fade">("fly");
  const life = useRef(0);
  const startPos = useMemo(() => new THREE.Vector3(pos.x - 8, 12, pos.z - 8), [pos]);

  const particleGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 500;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      p[i * 3] = 0; p[i * 3 + 1] = 0; p[i * 3 + 2] = 0;
      c[i * 4] = 1; c[i * 4 + 1] = 0.5 + Math.random() * 0.5;
      c[i * 4 + 2] = 0; c[i * 4 + 3] = 1;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.3) * Math.PI;
      const speed = 5 + Math.random() * 15;
      v[i * 3] = Math.cos(angle) * Math.cos(elev) * speed;
      v[i * 3 + 1] = Math.sin(elev) * speed + 2;
      v[i * 3 + 2] = Math.sin(angle) * Math.cos(elev) * speed;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    life.current += delta;
    if (phase.current === "fly") {
      if (!groupRef.current || !ballRef.current) return;
      const t = Math.min(life.current / 0.6, 1);
      const eased = t * t;
      groupRef.current.position.lerpVectors(startPos, pos, eased);
      groupRef.current.position.y += Math.sin(t * Math.PI) * 3;
      ballRef.current.rotation.x += delta * 10;
      ballRef.current.rotation.z += delta * 8;
      if (t >= 1) {
        phase.current = "explode";
        life.current = 0;
        if (ballRef.current) ballRef.current.visible = false;
      }
    } else if (phase.current === "explode") {
      if (!particlesRef.current) return;
      particlesRef.current.visible = true;
      const pPos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const vel = particlesRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
      const col = particlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < pPos.count; i++) {
        pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta);
        pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta);
        pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta);
        vel.setY(i, vel.getY(i) - 9.8 * delta);
        col.setW(i, Math.max(0, col.getW(i) - delta * 0.8));
      }
      pPos.needsUpdate = true;
      col.needsUpdate = true;
      if (life.current > 2) onDone();
    }
  });

  return (
    <group ref={groupRef} position={startPos}>
      <mesh ref={ballRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff6600"
          emissiveIntensity={6}
          flatShading
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ff4400" intensity={50} distance={40} />
      <points ref={particlesRef} visible={false} position={[0, 0, 0]} geometry={particleGeo}>
        <pointsMaterial
          size={0.6}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
