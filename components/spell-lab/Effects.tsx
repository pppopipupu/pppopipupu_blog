import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/* ==================== Impact Flash ==================== */
export function ImpactFlash({ pos, color, onDone }: { pos: THREE.Vector3; color: string; onDone: () => void }) {
  const ref = useRef<THREE.PointLight>(null);
  const life = useRef(0);
  useFrame((_, delta) => {
    life.current += delta;
    if (ref.current) {
      ref.current.intensity = Math.max(0, 50 * (1 - life.current / 0.2));
    }
    if (life.current > 0.2) onDone();
  });
  return <pointLight ref={ref} position={[pos.x, pos.y + 1, pos.z]} color={color} intensity={50} distance={20} />;
}

/* ==================== Debris Particles ==================== */
export function DebrisParticles({ pos, color, onDone }: { pos: THREE.Vector3; color: string; onDone: () => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const life = useRef(0);
  
  const particles = useMemo(() => {
    const count = 15 + Math.floor(Math.random() * 10); // 生成15-25个碎块
    const data = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 4 + Math.random() * 8; // 抛射初速度
      data.push({
        p: new THREE.Vector3(pos.x, pos.y + 0.5, pos.z),
        v: new THREE.Vector3(Math.cos(a) * s, 6 + Math.random() * 10, Math.sin(a) * s),
        r: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        rv: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10), // 自转角速度
        scale: 0.4 + Math.random() * 0.8 // 碎块随机大小
      });
    }
    return data;
  }, [pos]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    life.current += delta;
    if (meshRef.current) {
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (pt.p.y > -2) { // 直到掉落地表以下才停止运动
          pt.p.addScaledVector(pt.v, delta);
          pt.v.y -= 35 * delta; // 重力加速度
          pt.r.addScaledVector(pt.rv, delta); // 自转
        }
        dummy.position.copy(pt.p);
        dummy.rotation.set(pt.r.x, pt.r.y, pt.r.z);
        // 后期缩小消失
        const shrink = Math.max(0, 1 - life.current / 2.0);
        dummy.scale.setScalar(pt.scale * shrink);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      (meshRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - life.current / 2.0);
    }
    if (life.current > 2.0) onDone();
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, particles.length]}>
      <dodecahedronGeometry args={[0.8, 0]} /> {/* 0细分的十二面体，标准的低多边形块 */}
      <meshStandardMaterial color={color} roughness={0.9} transparent />
    </instancedMesh>
  );
}

/* ==================== Blood Particles ==================== */
export function BloodParticles({ pos, onDone }: { pos: THREE.Vector3; onDone: () => void }) {
  const ref = useRef<THREE.Points>(null);
  const life = useRef(0);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 15 + Math.floor(Math.random() * 10);
    const p = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = pos.x; p[i * 3 + 1] = pos.y + 0.5; p[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      v[i * 3] = Math.cos(a) * s;
      v[i * 3 + 1] = 1 + Math.random() * 2;
      v[i * 3 + 2] = Math.sin(a) * s;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, [pos]);

  useFrame((_, delta) => {
    life.current += delta;
    if (ref.current) {
      const pAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
      const vAttr = ref.current.geometry.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < pAttr.count; i++) {
        const y = pAttr.getY(i);
        if (y > 0) {
          pAttr.setX(i, pAttr.getX(i) + vAttr.getX(i) * delta);
          pAttr.setY(i, y + vAttr.getY(i) * delta);
          pAttr.setZ(i, pAttr.getZ(i) + vAttr.getZ(i) * delta);
          vAttr.setY(i, vAttr.getY(i) - 15 * delta);
        }
      }
      pAttr.needsUpdate = true;
      (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - life.current);
    }
    if (life.current > 1.0) onDone();
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.3} color="#aa0000" transparent depthWrite={false} toneMapped={false} />
    </points>
  );
}

/* ==================== Damage Text ==================== */
export function DamageText({ pos, text, color, onDone }: { pos: THREE.Vector3; text: string; color: string; onDone: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const life = useRef(0);

  useFrame((_, delta) => {
    life.current += delta;
    if (ref.current) {
      ref.current.position.y += delta * 2;
      ref.current.scale.setScalar(Math.max(0.01, 1 - life.current / 1.5));
    }
    if (life.current > 1.5) onDone();
  });

  const isRainbow = color === "rainbow";
  const style: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: "32px",
    fontFamily: "Impact, sans-serif",
    pointerEvents: "none",
    userSelect: "none",
    color: isRainbow ? "transparent" : color,
    backgroundImage: isRainbow ? "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)" : "none",
    WebkitBackgroundClip: isRainbow ? "text" : "border-box",
    backgroundClip: isRainbow ? "text" : "border-box",
    textShadow: isRainbow ? "none" : "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
    filter: isRainbow ? "drop-shadow(2px 2px 1px rgba(0,0,0,1))" : "none",
  };

  return (
    <group ref={ref} position={[pos.x, pos.y + 1.5, pos.z]}>
      <Html center zIndexRange={[100, 0]}>
        <div style={style}>{text}</div>
      </Html>
    </group>
  );
}
