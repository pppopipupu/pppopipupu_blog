"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { pointerGlow, WOOD, WOOD_DARK, WOOD_LIGHT } from "./Furniture";
import { playSound } from "./Sounds";

const FRINGE_ANGLES = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);

const BRICKS: { x: number; y: number; dark: boolean }[] = (() => {
  const list: { x: number; y: number; dark: boolean }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      list.push({
        x: -0.22 + c * 0.11 + (r % 2 ? 0.055 : 0),
        y: 0.22 + r * 0.055,
        dark: (r + c) % 2 === 0,
      });
    }
  }
  return list;
})();

const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

/* ---------- 飞镖盘 ---------- */

const DART_COUNT = 6;
const DART_SPEED = 7; // 每秒飞行距离（世界单位）
const DARTBOARD = { x: -6.4, y: 3.4, z: -6.6 };
const DART_FWD = new THREE.Vector3(0, 1, 0); // 飞镖模型 +Y 为尖端

interface DartSlot {
  group: THREE.Group | null;
  pos: THREE.Vector3;
  from: THREE.Vector3;
  to: THREE.Vector3;
  dir: THREE.Vector3;
  quat: THREE.Quaternion;
  spin: THREE.Quaternion;
  t: number;
  step: number;
  active: boolean;
}

const DART_SLOTS: DartSlot[] = Array.from({ length: DART_COUNT }, () => ({
  group: null,
  pos: new THREE.Vector3(),
  from: new THREE.Vector3(),
  to: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  spin: new THREE.Quaternion(),
  t: 0,
  step: 0,
  active: false,
}));

/* ---------- 猫的细节数据（模块级生成，禁止渲染/帧内分配） ---------- */

const CAT_BODY = new THREE.Vector3(0, 0.36, 0.05);

const CAT_STRIPES: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number, number] }[] = (() => {
  const up = new THREE.Vector3(0, 1, 0);
  const specs = [
    { d: new THREE.Vector3(0.2, 1, 0.05), size: [0.24, 0.05, 0.09] as [number, number, number] },
    { d: new THREE.Vector3(-0.16, 1, 0.12), size: [0.2, 0.05, 0.09] as [number, number, number] },
    { d: new THREE.Vector3(0, 0.15, 1), size: [0.16, 0.045, 0.08] as [number, number, number] },
  ];
  const v = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  return specs.map((s) => {
    s.d.normalize();
    v.copy(CAT_BODY).addScaledVector(s.d, 0.335);
    q.setFromUnitVectors(up, s.d);
    e.setFromQuaternion(q);
    return { pos: [v.x, v.y, v.z] as [number, number, number], rot: [e.x, e.y, e.z] as [number, number, number], size: s.size };
  });
})();

const CAT_WHISKERS: { pos: [number, number, number]; rz: number }[] = (() => {
  const list: { pos: [number, number, number]; rz: number }[] = [];
  const side = (x: number, rz: number) => list.push({ pos: [x, -0.02, -0.19], rz });
  side(-0.1, 0.2);
  side(-0.14, 0.07);
  side(-0.18, -0.07);
  side(0.12, -0.2);
  side(0.16, -0.07);
  side(0.2, 0.07);
  return list;
})();

const CAT_TOES: [number, number, number][] = [
  [0.165, 0.415, 0.325],
  [0.205, 0.455, 0.345],
  [0.245, 0.42, 0.365],
];

function WindowWithSky() {
  const curtainLRef = useRef<THREE.Group>(null);
  const curtainRRef = useRef<THREE.Group>(null);
  const starMatRef = useRef<THREE.PointsMaterial>(null);
  const moonMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7.6;
      arr[i * 3 + 1] = Math.random() * 4.6;
      arr[i * 3 + 2] = 0;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useEffect(() => {
    return () => {
      starGeo.dispose();
    };
  }, [starGeo]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (curtainLRef.current) curtainLRef.current.rotation.z = Math.sin(t * 0.6) * 0.05;
    if (curtainRRef.current) curtainRRef.current.rotation.z = -Math.sin(t * 0.6 + 1) * 0.05;
    if (starMatRef.current) starMatRef.current.opacity = 0.55 + Math.sin(t * 1.3) * 0.3;
    if (moonMatRef.current) {
      moonMatRef.current.color.setHSL(0.13, 0.9, 0.72 + Math.sin(t * 0.8) * 0.05);
    }
  });

  return (
    <group>
      <mesh position={[2.2, 4.5, -6.65]}>
        <planeGeometry args={[8.6, 8.4]} />
        <meshBasicMaterial color="#22295c" />
      </mesh>
      <mesh position={[2.2, 0.05, -6.65]}>
        <planeGeometry args={[8.6, 1.6]} />
        <meshBasicMaterial color="#0d1030" />
      </mesh>
      <points position={[2.2, 3.0, -6.62]} geometry={starGeo}>
        <pointsMaterial
          ref={starMatRef}
          size={0.07}
          color="#ffffff"
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh position={[3.6, 6.0, -6.62]}>
        <sphereGeometry args={[0.5, 14, 10]} />
        <meshBasicMaterial ref={moonMatRef} color="#fff3b8" />
      </mesh>
      <mesh position={[2.2, 7.3, -6.4]}>
        <boxGeometry args={[4.6, 0.14, 0.18]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[2.2, 2.3, -6.4]}>
        <boxGeometry args={[4.6, 0.14, 0.18]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[0.0, 4.8, -6.4]}>
        <boxGeometry args={[0.14, 5.2, 0.18]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[4.4, 4.8, -6.4]}>
        <boxGeometry args={[0.14, 5.2, 0.18]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      {/* 2x2 竖中挺 */}
      <mesh position={[1.1, 4.8, -6.4]}>
        <boxGeometry args={[0.1, 5.0, 0.16]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[3.3, 4.8, -6.4]}>
        <boxGeometry args={[0.1, 5.0, 0.16]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[2.2, 4.8, -6.4]}>
        <boxGeometry args={[4.6, 0.1, 0.14]} />
        <meshStandardMaterial color="#f5e8d2" flatShading />
      </mesh>
      <mesh position={[2.2, 4.8, -6.5]}>
        <planeGeometry args={[3.9, 3.9]} />
        <meshStandardMaterial color="#bfd8ff" transparent opacity={0.22} roughness={0.15} metalness={0.2} />
      </mesh>
      {/* 窗帘双层（前片 + 后片） */}
      <group ref={curtainLRef} position={[0.1, 7.3, -6.32]}>
        <mesh position={[0, -2.42, 0]} castShadow>
          <boxGeometry args={[0.7, 5.4, 0.1]} />
          <meshStandardMaterial color="#ff8fae" flatShading />
        </mesh>
        <mesh position={[0.28, -2.38, 0.06]}>
          <boxGeometry args={[0.42, 5.0, 0.05]} />
          <meshStandardMaterial color="#e07395" flatShading />
        </mesh>
      </group>
      <group ref={curtainRRef} position={[4.3, 7.3, -6.32]}>
        <mesh position={[0, -2.42, 0]}>
          <boxGeometry args={[0.7, 5.4, 0.1]} />
          <meshStandardMaterial color="#ff8fae" flatShading />
        </mesh>
        <mesh position={[-0.28, -2.38, 0.06]}>
          <boxGeometry args={[0.42, 5.0, 0.05]} />
          <meshStandardMaterial color="#e07395" flatShading />
        </mesh>
      </group>
      <mesh position={[2.2, 2.1, -6.32]} castShadow>
        <boxGeometry args={[4.8, 0.16, 0.6]} />
        <meshStandardMaterial color="#f0dcc0" flatShading />
      </mesh>
      <group position={[0.9, 2.22, -6.42]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.16, 8]} />
          <meshStandardMaterial color="#e07e5a" flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#a8e6b5" flatShading />
        </mesh>
        <mesh position={[0.08, 0.12, 0.02]}>
          <icosahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial color="#8fd9a8" flatShading />
        </mesh>
      </group>
      <group position={[3.5, 2.22, -6.42]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.16, 8]} />
          <meshStandardMaterial color="#e07e5a" flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#ffd166" flatShading />
        </mesh>
        <mesh position={[-0.07, 0.13, -0.02]}>
          <icosahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial color="#ffb37e" flatShading />
        </mesh>
      </group>
      {/* 窗台闹钟 */}
      <group position={[2.35, 2.23, -6.42]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff7eb6" flatShading />
        </mesh>
        <mesh position={[0, 0.11, 0.025]}>
          <boxGeometry args={[0.14, 0.02, 0.02]} />
          <meshStandardMaterial color="#fff6ea" flatShading />
        </mesh>
        {[-0.055, 0.055].map((x, i) => (
          <mesh key={i} position={[x, 0.115, 0]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#e8b56a" flatShading />
          </mesh>
        ))}
      </group>
      {/* 窗台相框 */}
      <group position={[2.95, 2.24, -6.45]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[0.16, 0.2, 0.03]} />
          <meshStandardMaterial color="#5b4a3f" flatShading />
        </mesh>
        <mesh position={[0, 0.04, 0.02]}>
          <boxGeometry args={[0.12, 0.16, 0.01]} />
          <meshStandardMaterial color="#fff6ea" flatShading />
        </mesh>
        <mesh position={[0.02, 0.06, 0.03]}>
          <circleGeometry args={[0.05, 8]} />
          <meshBasicMaterial color="#7ec8ff" />
        </mesh>
      </group>
    </group>
  );
}

function WallArt({
  position,
  rotation,
  colors,
  variant,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  colors: string[];
  variant: "mountains" | "circle" | "diamond" | "sunset";
}) {
  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => pointerGlow(e, true, false)}
      onPointerOut={(e) => pointerGlow(e, false, false)}
    >
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.1, 0.06]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.35, 0.95, 0.02]} />
        <meshStandardMaterial color="#fff6ea" flatShading />
      </mesh>
      {variant === "mountains" && (
        <>
          <mesh position={[-0.25, 0.05, 0.06]}>
            <coneGeometry args={[0.42, 0.55, 4]} />
            <meshStandardMaterial color={colors[0]} flatShading />
          </mesh>
          <mesh position={[0.3, -0.12, 0.06]}>
            <coneGeometry args={[0.3, 0.4, 4]} />
            <meshStandardMaterial color={colors[1]} flatShading />
          </mesh>
          <mesh position={[0.35, 0.25, 0.06]}>
            <circleGeometry args={[0.12, 8]} />
            <meshBasicMaterial color={colors[2]} />
          </mesh>
        </>
      )}
      {variant === "circle" && (
        <>
          <mesh position={[0, 0.05, 0.06]}>
            <circleGeometry args={[0.42, 12]} />
            <meshBasicMaterial color={colors[0]} />
          </mesh>
          <mesh position={[0, 0.05, 0.07]}>
            <circleGeometry args={[0.28, 10]} />
            <meshBasicMaterial color={colors[1]} />
          </mesh>
          <mesh position={[0, 0.05, 0.08]}>
            <circleGeometry args={[0.14, 8]} />
            <meshBasicMaterial color={colors[2]} />
          </mesh>
        </>
      )}
      {variant === "diamond" && (
        <>
          <mesh position={[-0.22, 0.08, 0.06]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.5, 0.5, 0.02]} />
            <meshBasicMaterial color={colors[0]} />
          </mesh>
          <mesh position={[0.26, -0.08, 0.06]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.34, 0.34, 0.02]} />
            <meshBasicMaterial color={colors[1]} />
          </mesh>
          <mesh position={[0.05, 0.3, 0.06]}>
            <circleGeometry args={[0.08, 8]} />
            <meshBasicMaterial color={colors[2]} />
          </mesh>
        </>
      )}
      {variant === "sunset" && (
        <>
          <mesh position={[0, -0.08, 0.06]}>
            <boxGeometry args={[1.35, 0.5, 0.02]} />
            <meshBasicMaterial color={colors[0]} />
          </mesh>
          <mesh position={[0, 0.16, 0.06]}>
            <circleGeometry args={[0.5, 14]} />
            <meshBasicMaterial color={colors[1]} />
          </mesh>
          <mesh position={[0.15, 0.18, 0.07]}>
            <circleGeometry args={[0.13, 8]} />
            <meshBasicMaterial color={colors[2]} />
          </mesh>
        </>
      )}
    </group>
  );
}

function WallClock() {
  const minuteRef = useRef<THREE.Mesh>(null);
  const hourRef = useRef<THREE.Mesh>(null);
  const pendulumRef = useRef<THREE.Group>(null);
  const kickRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (minuteRef.current) minuteRef.current.rotation.z = -(t * 0.3) % (Math.PI * 2);
    if (hourRef.current) hourRef.current.rotation.z = -(t * 0.025) % (Math.PI * 2);
    if (kickRef.current > 0) kickRef.current = Math.max(0, kickRef.current - delta);
    const kick = kickRef.current > 0 ? Math.min(1, kickRef.current / 2) * 0.65 : 0;
    if (pendulumRef.current) {
      pendulumRef.current.rotation.z = Math.sin(t * 3.1) * (0.28 + kick);
    }
  });

  const chime = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    kickRef.current = 2;
    playSound("tick");
  };

  return (
    <group position={[7.2, 5.2, -6.6]}>
      <mesh
        name="wall-clock"
        position={[0, 0, 0.05]}
        castShadow
        onClick={chime}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <cylinderGeometry args={[0.45, 0.45, 0.08, 20]} />
        <meshStandardMaterial color="#fff8ec" flatShading />
      </mesh>
      {/* 12 刻度 */}
      {CLOCK_TICKS.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0.1]}>
          <boxGeometry args={[0.022, 0.055, 0.012]} />
          <meshStandardMaterial color="#333333" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0.1]}>
        <boxGeometry args={[0.03, 0.09, 0.01]} />
        <meshStandardMaterial color="#333333" flatShading />
      </mesh>
      <mesh position={[0, -0.32, 0.1]}>
        <boxGeometry args={[0.03, 0.09, 0.01]} />
        <meshStandardMaterial color="#333333" flatShading />
      </mesh>
      <mesh position={[0.32, 0, 0.1]}>
        <boxGeometry args={[0.09, 0.03, 0.01]} />
        <meshStandardMaterial color="#333333" flatShading />
      </mesh>
      <mesh position={[-0.32, 0, 0.1]}>
        <boxGeometry args={[0.09, 0.03, 0.01]} />
        <meshStandardMaterial color="#333333" flatShading />
      </mesh>
      <mesh ref={hourRef} position={[0, 0, 0.11]}>
        <boxGeometry args={[0.07, 0.26, 0.015]} />
        <meshStandardMaterial color="#c95d4a" flatShading />
      </mesh>
      <mesh ref={minuteRef} position={[0, 0, 0.12]}>
        <boxGeometry args={[0.045, 0.38, 0.015]} />
        <meshStandardMaterial color="#5a4a8f" flatShading />
      </mesh>
      {/* 顶部小拱 */}
      <mesh position={[0, 0.51, 0.06]}>
        <boxGeometry args={[0.16, 0.08, 0.02]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      {/* 钟摆 */}
      <group ref={pendulumRef} position={[0, -0.48, 0.1]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.02, 0.14, 0.012]} />
          <meshStandardMaterial color="#c95d4a" flatShading />
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.025, 12]} />
          <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.5} flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Dartboard() {
  const bullRef = useRef<THREE.Mesh>(null);
  const bullMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseRef = useRef(0);
  const nextRef = useRef(0);

  useFrame((_, delta) => {
    let landed = false;
    for (let i = 0; i < DART_COUNT; i++) {
      const s = DART_SLOTS[i];
      if (!s.active || !s.group) continue;
      s.t += delta * s.step;
      if (s.t >= 1) {
        s.t = 1;
        s.active = false;
        s.group.position.copy(s.to);
        landed = true;
      } else {
        s.pos.lerpVectors(s.from, s.to, s.t);
        s.pos.z += Math.sin(s.t * Math.PI) * 0.06; // 轻微抛物线
        s.group.position.copy(s.pos);
        s.spin.setFromAxisAngle(DART_FWD, delta * 10);
        s.group.quaternion.multiply(s.spin);
      }
    }
    if (landed) {
      pulseRef.current = 1;
      playSound("tick");
    }
    if (pulseRef.current > 0) pulseRef.current = Math.max(0, pulseRef.current - delta * 2.5);
    const p = pulseRef.current;
    if (bullRef.current) bullRef.current.scale.setScalar(1 + p * 0.35);
    if (bullMatRef.current) bullMatRef.current.emissiveIntensity = 0.6 + p * 1.6;
  });

  const throwDart = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const s = DART_SLOTS[nextRef.current];
    nextRef.current = (nextRef.current + 1) % DART_COUNT;
    // 发射点：盘面前方固定"手"的位置，飞镖射向鼠标点击处
    s.from.set(DARTBOARD.x, DARTBOARD.y + 0.2, DARTBOARD.z + 1.0);
    s.to.copy(e.point);
    s.dir.subVectors(s.to, s.from).normalize();
    const dist = s.from.distanceTo(s.to);
    s.step = dist > 0.01 ? DART_SPEED / dist : DART_SPEED;
    s.quat.setFromUnitVectors(DART_FWD, s.dir);
    s.t = 0;
    s.active = true;
    if (s.group) {
      s.group.visible = true;
      s.group.position.copy(s.from);
      // 落点：尖端扎进盘面约 0.04
      s.to.addScaledVector(s.dir, -0.04);
      s.group.quaternion.copy(s.quat).multiply(
        new THREE.Quaternion().setFromAxisAngle(DART_FWD, Math.random() * Math.PI * 2)
      );
    }
    playSound("toss");
  };

  return (
    <>
      <group
        name="dartboard"
        position={[DARTBOARD.x, DARTBOARD.y, DARTBOARD.z]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={throwDart}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        {/* 暖木外圈/背板 */}
        <mesh position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.8, 0.8, 0.07, 28]} />
          <meshStandardMaterial color="#b5784f" emissive="#b5784f" emissiveIntensity={0.5} flatShading />
        </mesh>
        {/* 红色盘面 */}
        <mesh position={[0, 0, 0.055]}>
          <cylinderGeometry args={[0.68, 0.68, 0.028, 28]} />
          <meshStandardMaterial color="#e2574f" emissive="#e2574f" emissiveIntensity={0.6} flatShading />
        </mesh>
        {/* 奶油内环 */}
        <mesh position={[0, 0, 0.065]}>
          <cylinderGeometry args={[0.42, 0.42, 0.022, 22]} />
          <meshStandardMaterial color="#f5e0c8" emissive="#f5e0c8" emissiveIntensity={0.55} flatShading />
        </mesh>
        {/* 粉色中环 */}
        <mesh position={[0, 0, 0.073]}>
          <cylinderGeometry args={[0.2, 0.2, 0.018, 18]} />
          <meshStandardMaterial color="#ff9eb5" emissive="#ff9eb5" emissiveIntensity={0.55} flatShading />
        </mesh>
        {/* 金色靶心（命中时脉冲） */}
        <mesh ref={bullRef} position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.082, 0.082, 0.015, 16]} />
          <meshStandardMaterial
            ref={bullMatRef}
            color="#ffd166"
            emissive="#ffd98a"
            emissiveIntensity={0.6}
            flatShading
          />
        </mesh>
      </group>
      {/* 飞镖池（世界坐标原点，避免受盘面位移影响） */}
      <group>
        {DART_SLOTS.map((slot, i) => (
          <group
            key={i}
            ref={(g) => {
              slot.group = g;
            }}
            visible={false}
          >
            {/* 尖端 */}
            <mesh position={[0, 0.061, 0]}>
              <coneGeometry args={[0.022, 0.07, 6]} />
              <meshStandardMaterial color="#e8b56a" flatShading />
            </mesh>
            {/* 镖身 */}
            <mesh position={[0, -0.006, 0]}>
              <cylinderGeometry args={[0.014, 0.016, 0.12, 6]} />
              <meshStandardMaterial color="#d8d4c8" roughness={0.35} metalness={0.4} flatShading />
            </mesh>
            {/* 握环 */}
            <mesh position={[0, 0.036, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.018, 6]} />
              <meshStandardMaterial color="#5b4a3f" flatShading />
            </mesh>
            {/* 尾翼 x2 */}
            <mesh position={[0, -0.078, 0]}>
              <boxGeometry args={[0.07, 0.065, 0.01]} />
              <meshStandardMaterial color="#ff7eb6" flatShading />
            </mesh>
            <mesh position={[0, -0.078, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.07, 0.065, 0.01]} />
              <meshStandardMaterial color="#ff7eb6" flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

function RockingChair() {
  const groupRef = useRef<THREE.Group>(null);
  const kickRef = useRef(0);

  useFrame((state, delta) => {
    if (kickRef.current > 0) kickRef.current = Math.max(0, kickRef.current - delta);
    const kick = kickRef.current > 0 ? Math.min(1, kickRef.current / 1.5) * 0.09 : 0;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * (0.7 + kick * 2.2)) * (0.06 + kick);
    }
  });

  const rock = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    kickRef.current = 1.5;
    playSound("creak");
  };

  return (
    <group position={[2.8, 0, 3.2]} rotation={[0, -0.5, 0]}>
      <group ref={groupRef}>
        <mesh
          name="rocking-chair"
          position={[0, 0.55, 0]}
          castShadow
          onClick={rock}
          onPointerOver={(e) => pointerGlow(e, true)}
          onPointerOut={(e) => pointerGlow(e, false)}
        >
          <boxGeometry args={[0.85, 0.1, 0.7]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[0, 0.95, 0.33]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.85, 0.9, 0.08]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        {/* 双层坐垫 */}
        <mesh position={[0, 0.63, -0.02]}>
          <boxGeometry args={[0.7, 0.06, 0.6]} />
          <meshStandardMaterial color="#ffb37e" flatShading />
        </mesh>
        <mesh position={[0, 0.67, 0.02]}>
          <boxGeometry args={[0.72, 0.04, 0.5]} />
          <meshStandardMaterial color="#f5e0c8" flatShading />
        </mesh>
        {/* 扶手弧块 */}
        <mesh position={[-0.44, 0.75, 0.2]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.4]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[0.44, 0.75, 0.2]} castShadow>
          <boxGeometry args={[0.07, 0.07, 0.4]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[-0.44, 0.75, 0.05]}>
          <boxGeometry args={[0.06, 0.06, 0.65]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[0.44, 0.75, 0.05]}>
          <boxGeometry args={[0.06, 0.06, 0.65]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[-0.35, 0.27, -0.25]} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[0.35, 0.27, -0.25]} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[-0.35, 0.27, 0.25]} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[0.35, 0.27, 0.25]} castShadow>
          <boxGeometry args={[0.07, 0.5, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[-0.36, 0.05, 0]} rotation={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.09, 1.2]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
        <mesh position={[0.36, 0.05, 0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.06, 0.09, 1.2]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Rug() {
  return (
    <group position={[0, 0.15, 1.2]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[3.6, 3.6, 0.05, 32]} />
        <meshStandardMaterial color="#c39bd8" flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[2.6, 2.6, 0.04, 28]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.03, 24]} />
        <meshStandardMaterial color="#8fd9a8" flatShading />
      </mesh>
      {FRINGE_ANGLES.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 3.78, 0.03, Math.sin(a) * 3.78]}
          rotation={[0, -a, 0]}
        >
          <boxGeometry args={[0.06, 0.02, 0.42]} />
          <meshStandardMaterial color="#a883b8" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Plant({
  position = [5.7, 0, 4.2],
  variant = "tree",
}: {
  position?: [number, number, number];
  variant?: "tree" | "cactus";
}) {
  const crownRef = useRef<THREE.Group>(null);
  const swayRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (crownRef.current) crownRef.current.rotation.y = t * 0.15;
    if (swayRef.current && variant === "cactus") {
      swayRef.current.rotation.z = Math.sin(t * 0.9) * 0.02;
      swayRef.current.rotation.x = Math.cos(t * 0.7) * 0.015;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.26, 0.55, 12]} />
        <meshStandardMaterial color="#e07e5a" flatShading />
      </mesh>
      <mesh
        position={[0, 0.52, 0]}
        onPointerOver={(e) => pointerGlow(e, true, false)}
        onPointerOut={(e) => pointerGlow(e, false, false)}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.06, 12]} />
        <meshStandardMaterial color="#6b4a38" flatShading />
      </mesh>
      {variant === "tree" && (
        <>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.4, 8]} />
            <meshStandardMaterial color="#8a5a3b" flatShading />
          </mesh>
          <group ref={crownRef} position={[0, 1.0, 0]}>
            <mesh position={[0, 0.15, 0]} castShadow>
              <icosahedronGeometry args={[0.34, 0]} />
              <meshStandardMaterial color="#8fd9a8" flatShading />
            </mesh>
            <mesh position={[0.22, 0.02, 0.1]}>
              <icosahedronGeometry args={[0.2, 0]} />
              <meshStandardMaterial color="#7ec8a0" flatShading />
            </mesh>
            <mesh position={[-0.2, -0.02, -0.12]}>
              <icosahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color="#a8e6b5" flatShading />
            </mesh>
          </group>
        </>
      )}
      {variant === "cactus" && (
        <group ref={swayRef} position={[0, 0.55, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.13, 0.44, 8]} />
            <meshStandardMaterial color="#6fbf94" flatShading />
          </mesh>
          <mesh position={[-0.13, 0.12, 0.02]} rotation={[0, 0, -0.9]} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 0.24, 8]} />
            <meshStandardMaterial color="#7ec8a0" flatShading />
          </mesh>
          <mesh position={[0.12, 0.06, -0.04]} rotation={[0, 0, 0.95]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.2, 8]} />
            <meshStandardMaterial color="#7ec8a0" flatShading />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#ffb37e" flatShading />
          </mesh>
          {/* 刺点 */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.57) * 0.13, 0.2 + (i % 2) * 0.1, Math.sin(i * 1.57) * 0.13]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshStandardMaterial color="#c9ffdd" flatShading />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function CatCorner() {
  const catRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Mesh>(null);
  const earRRef = useRef<THREE.Mesh>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const awakeRef = useRef(false);
  const animRef = useRef(0);

  const poke = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    awakeRef.current = !awakeRef.current;
    playSound(awakeRef.current ? "meow" : "purr");
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const target = awakeRef.current ? 1 : 0;
    animRef.current += (target - animRef.current) * Math.min(1, delta * 3);
    const k = animRef.current;
    if (catRef.current) {
      const s = 1 + Math.sin(t * (1.1 + k * 2.5)) * (0.02 + k * 0.02);
      catRef.current.scale.set(s, s, s);
    }
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(t * (1.2 + k * 4)) * (0.1 + k * 0.3);
    }
    if (headRef.current) {
      headRef.current.position.y = 0.52 + k * 0.09;
      headRef.current.rotation.z = k * 0.35;
    }
    // 耳朵抖动：醒着时偶尔来一阵
    const twitch = k * Math.max(0, Math.sin(t * 0.53)) ** 3 * Math.sin(t * 13.7) * 0.1;
    if (earLRef.current) earLRef.current.rotation.z = 0.5 + twitch;
    if (earRRef.current) earRRef.current.rotation.z = -0.4 - twitch * 0.85;
    // 眼睛开合：睡着眯成一条线，醒来睁开
    const eyeY = 0.15 + k * 0.85;
    if (eyeLRef.current) eyeLRef.current.scale.y = eyeY;
    if (eyeRRef.current) eyeRRef.current.scale.y = eyeY;
  });

  return (
    <group position={[7.4, 0, 4.8]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.12, 18]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.05, 16]} />
        <meshStandardMaterial color="#ff9e7e" flatShading />
      </mesh>
      <group ref={catRef}>
        <mesh
          name="cat"
          position={[0, 0.36, 0.05]}
          castShadow
          onClick={poke}
          onPointerOver={(e) => pointerGlow(e, true)}
          onPointerOut={(e) => pointerGlow(e, false)}
        >
          <sphereGeometry args={[0.32, 16, 12]} />
          <meshStandardMaterial color="#f5e0c8" flatShading />
        </mesh>
        {/* 背部斑纹（贴合球面切线） */}
        {CAT_STRIPES.map((st, i) => (
          <mesh key={i} position={st.pos} rotation={st.rot}>
            <boxGeometry args={st.size} />
            <meshStandardMaterial color="#d9b48a" flatShading />
          </mesh>
        ))}
        {/* 肚皮浅色 */}
        <mesh position={[0.05, 0.24, 0.13]} scale={[0.9, 0.6, 0.9]}>
          <sphereGeometry args={[0.3, 12, 10]} />
          <meshStandardMaterial color="#fff6ea" flatShading />
        </mesh>
        {/* 头部（可抬头） */}
        <group ref={headRef} position={[0.18, 0.52, -0.26]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 14, 10]} />
            <meshStandardMaterial color="#f5e0c8" flatShading />
          </mesh>
          {/* 耳朵（醒着会偶尔抖动） */}
          <mesh ref={earLRef} position={[-0.06, 0.16, -0.05]} rotation={[0, 0, 0.5]}>
            <coneGeometry args={[0.09, 0.14, 6]} />
            <meshStandardMaterial color="#f5e0c8" flatShading />
          </mesh>
          <mesh ref={earRRef} position={[0.1, 0.14, -0.01]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.09, 0.14, 6]} />
            <meshStandardMaterial color="#f5e0c8" flatShading />
          </mesh>
          <mesh position={[-0.05, 0.15, -0.02]}>
            <coneGeometry args={[0.05, 0.07, 6]} />
            <meshStandardMaterial color="#ff9eb5" flatShading />
          </mesh>
          <mesh position={[0.09, 0.13, 0.02]}>
            <coneGeometry args={[0.05, 0.07, 6]} />
            <meshStandardMaterial color="#ff9eb5" flatShading />
          </mesh>
          {/* 眼睛（睡着眯成一条线） */}
          <mesh ref={eyeRRef} position={[0.09, 0.02, -0.19]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color="#2a2a3a" flatShading />
          </mesh>
          <mesh ref={eyeLRef} position={[-0.06, 0.035, -0.195]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshStandardMaterial color="#2a2a3a" flatShading />
          </mesh>
          {/* 鼻子 */}
          <mesh position={[0.01, -0.015, -0.185]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshStandardMaterial color="#e8738f" flatShading />
          </mesh>
          {/* 小嘴 */}
          <mesh position={[0.0, -0.048, -0.185]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[0.022, 0.013, 0.008]} />
            <meshStandardMaterial color="#d9a07a" flatShading />
          </mesh>
          <mesh position={[0.03, -0.052, -0.184]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.022, 0.013, 0.008]} />
            <meshStandardMaterial color="#d9a07a" flatShading />
          </mesh>
          {/* 胡须 */}
          {CAT_WHISKERS.map((w, i) => (
            <mesh key={i} position={w.pos} rotation={[0, 0, w.rz]}>
              <boxGeometry args={[0.1, 0.006, 0.004]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.85} flatShading />
            </mesh>
          ))}
          {/* 腮红 */}
          <mesh position={[-0.135, -0.055, -0.132]}>
            <circleGeometry args={[0.032, 10]} />
            <meshBasicMaterial color="#ffb3c4" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0.135, -0.055, -0.132]}>
            <circleGeometry args={[0.032, 10]} />
            <meshBasicMaterial color="#ffb3c4" transparent opacity={0.6} />
          </mesh>
        </group>
        {/* 项圈 + 铃铛 */}
        <group position={[0.257, 0.588, -0.393]} quaternion={[-0.63, 0.708, 0, 0.331]}>
          <mesh>
            <torusGeometry args={[0.135, 0.022, 8, 16]} />
            <meshStandardMaterial color="#ff7eb6" flatShading />
          </mesh>
        </group>
        <mesh position={[0.29, 0.44, -0.45]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.5} flatShading />
        </mesh>
        <mesh position={[0.29, 0.437, -0.452]}>
          <boxGeometry args={[0.012, 0.008, 0.012]} />
          <meshStandardMaterial color="#b8863b" flatShading />
        </mesh>
        {/* 前爪（蜷在脑袋下） */}
        <mesh position={[0.12, 0.26, -0.3]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial color="#f5e0c8" flatShading />
        </mesh>
        <mesh position={[-0.1, 0.27, -0.32]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial color="#f5e0c8" flatShading />
        </mesh>
        {/* 后腿 + 粉爪垫（睡觉时翻出来） */}
        <mesh position={[0.2, 0.3, 0.35]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <meshStandardMaterial color="#f5e0c8" flatShading />
        </mesh>
        <mesh position={[0.2, 0.4, 0.35]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#ff9eb5" flatShading />
        </mesh>
        {CAT_TOES.map((t, i) => (
          <mesh key={i} position={t}>
            <sphereGeometry args={[0.015, 8, 6]} />
            <meshStandardMaterial color="#ff8fae" flatShading />
          </mesh>
        ))}
        {/* 尾巴（三节，尖端带斑纹色） */}
        <group ref={tailRef} position={[-0.22, 0.36, 0.3]}>
          <mesh position={[0, 0.07, 0.1]} rotation={[0.7, 0, 0.3]}>
            <coneGeometry args={[0.055, 0.24, 6]} />
            <meshStandardMaterial color="#f5e0c8" flatShading />
          </mesh>
          <mesh position={[0.02, 0.17, 0.25]} rotation={[1.15, 0, 0.22]}>
            <coneGeometry args={[0.04, 0.21, 6]} />
            <meshStandardMaterial color="#f5e0c8" flatShading />
          </mesh>
          <mesh position={[0.04, 0.26, 0.38]} rotation={[1.55, 0, 0.12]}>
            <coneGeometry args={[0.028, 0.18, 6]} />
            <meshStandardMaterial color="#d9b48a" flatShading />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function CeilingLamp() {
  const lightRef = useRef<THREE.PointLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lightRef.current) {
      lightRef.current.intensity = 2.9 + Math.sin(t * 1.4) * 0.22;
    }
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
      groupRef.current.rotation.x = Math.cos(t * 0.7) * 0.015;
    }
  });

  return (
    <group>
      {/* 两节灯链 */}
      <mesh position={[0, 7.72, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.56, 6]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[0, 7.16, 0]} castShadow>
        <cylinderGeometry args={[0.034, 0.028, 0.56, 6]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <group ref={groupRef} position={[0, 6.6, 0]}>
        <mesh
          name="ceiling-lamp"
          position={[0, 0, 0]}
          castShadow
          onPointerOver={(e) => pointerGlow(e, true, false)}
          onPointerOut={(e) => pointerGlow(e, false, false)}
        >
          <cylinderGeometry args={[0.55, 0.24, 0.5, 14, 1, true]} />
          <meshStandardMaterial
            color="#ffdf9e"
            emissive="#ffb866"
            emissiveIntensity={1.7}
            transparent
            opacity={0.94}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>
        {/* 内衬 */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.16, 0.44, 10, 1, true]} />
          <meshStandardMaterial color="#e8cba4" side={THREE.DoubleSide} flatShading />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.06, 12]} />
          <meshStandardMaterial color="#e8b56a" flatShading />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={2} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={[0, 5.5, 0]} intensity={2.9} distance={15} decay={2} color="#ffd9a0" />
    </group>
  );
}

function Fireplace() {
  const flameLRef = useRef<THREE.Mesh>(null);
  const flameRRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const boostRef = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (boostRef.current > 0) boostRef.current = Math.max(0, boostRef.current - delta);
    const boost = boostRef.current > 0 ? Math.min(1, boostRef.current / 2) : 0;
    const flicker = 0.8 + Math.sin(t * 7.3) * 0.14 + Math.sin(t * 13.1 + 1.7) * 0.1;
    const k = 1 + boost * 0.55;
    if (flameLRef.current) {
      flameLRef.current.scale.y = (0.85 + Math.sin(t * 8.1) * 0.18) * k;
      flameLRef.current.scale.x = (0.9 + Math.sin(t * 6.3 + 2) * 0.12) * k;
      flameLRef.current.position.y = 1.06 + Math.sin(t * 9.2) * 0.03 + boost * 0.06;
    }
    if (flameRRef.current) {
      flameRRef.current.scale.y = (0.9 + Math.sin(t * 7.7 + 4) * 0.2) * k;
      flameRRef.current.scale.x = (0.95 + Math.sin(t * 9.4 + 1) * 0.1) * k;
      flameRRef.current.position.y = 1.0 + Math.sin(t * 8.6 + 3) * 0.035 + boost * 0.05;
    }
    if (lightRef.current) lightRef.current.intensity = 2.6 * flicker * k;
    if (glowMatRef.current) glowMatRef.current.opacity = (0.28 + Math.sin(t * 6.9) * 0.08) * k;
  });

  const stoke = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    boostRef.current = 2;
    playSound("crackle");
  };

  return (
    <group position={[8.0, 0, 1.2]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2.2, 2.4]} />
        <meshStandardMaterial color="#c0714f" flatShading />
      </mesh>
      {/* 砖块贴面 */}
      {BRICKS.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, -1.21]}>
          <boxGeometry args={[0.1, 0.05, 0.012]} />
          <meshStandardMaterial color={b.dark ? "#a55f3f" : "#c98d5e"} flatShading />
        </mesh>
      ))}
      {/* 烟囱三段 + 顶盖 */}
      <mesh position={[0.4, 2.4, 0]} castShadow>
        <boxGeometry args={[0.24, 2.4, 2.4]} />
        <meshStandardMaterial color="#a05f43" flatShading />
      </mesh>
      <mesh position={[0.4, 4.8, 0]} castShadow>
        <boxGeometry args={[0.22, 2.4, 2.35]} />
        <meshStandardMaterial color="#b5704f" flatShading />
      </mesh>
      <mesh position={[0.4, 7.0, 0]} castShadow>
        <boxGeometry args={[0.2, 2.0, 2.3]} />
        <meshStandardMaterial color="#a05f43" flatShading />
      </mesh>
      <mesh position={[0.42, 7.85, 0]}>
        <boxGeometry args={[0.28, 0.22, 2.5]} />
        <meshStandardMaterial color="#8a5a3f" flatShading />
      </mesh>
      {/* 炉膛 */}
      <mesh position={[0, 0.35, -0.62]}>
        <boxGeometry args={[0.6, 0.7, 0.28]} />
        <meshStandardMaterial color="#2a1c18" flatShading />
      </mesh>
      {/* 木柴 */}
      {[-0.14, 0.0, 0.14].map((x, i) => (
        <mesh key={i} position={[x, 0.16, -0.62]} rotation={[Math.PI / 2, 0, 0.35 + i * 0.2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.42, 6]} />
          <meshStandardMaterial color="#7a4a33" flatShading />
        </mesh>
      ))}
      {/* 炉栅 */}
      {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 0.08, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 5]} />
          <meshStandardMaterial color="#3a2a22" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[0.5, 0.1, 2.6]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[0, 0.06, -0.62]}>
        <boxGeometry args={[0.62, 0.12, 0.34]} />
        <meshStandardMaterial color="#5a3b2e" flatShading />
      </mesh>
      <mesh position={[-0.14, 1.06, -0.62]}>
        <cylinderGeometry args={[0.035, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#7a4a33" flatShading />
      </mesh>
      <mesh position={[0.16, 1.04, -0.62]} rotation={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.6, 6]} />
        <meshStandardMaterial color="#6b4028" flatShading />
      </mesh>
      <mesh
        name="fireplace-flame"
        ref={flameLRef}
        position={[-0.1, 1.05, -0.62]}
        onClick={stoke}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <coneGeometry args={[0.16, 0.42, 8]} />
        <meshBasicMaterial color="#ff8f3a" />
      </mesh>
      <mesh
        ref={flameRRef}
        position={[0.12, 1.0, -0.62]}
        onClick={stoke}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <coneGeometry args={[0.11, 0.32, 8]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      <mesh position={[0, 1.0, -0.62]}>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshBasicMaterial ref={glowMatRef} color="#ff9a4d" transparent opacity={0.3} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.35, -0.3]} intensity={2.6} distance={8} decay={2} color="#ff9a4d" />
      {/* 炉台摆件：蜡烛 + 相框 + 花瓶 */}
      <mesh position={[-0.16, 2.36, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.18, 8]} />
        <meshStandardMaterial color="#ffe27e" emissive="#ffd166" emissiveIntensity={0.5} flatShading />
      </mesh>
      <mesh position={[-0.16, 2.46, 0.3]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.2, 2.37, 0.28]} castShadow>
        <boxGeometry args={[0.2, 0.24, 0.03]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[0.2, 2.37, 0.3]}>
        <boxGeometry args={[0.16, 0.2, 0.01]} />
        <meshStandardMaterial color="#fff6ea" flatShading />
      </mesh>
      <mesh position={[0.2, 2.39, 0.31]}>
        <circleGeometry args={[0.07, 8]} />
        <meshBasicMaterial color="#8fd9a8" />
      </mesh>
      <mesh position={[0.02, 2.37, -0.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.065, 0.16, 8]} />
        <meshStandardMaterial color="#e07e5a" flatShading />
      </mesh>
      <mesh position={[0.02, 2.48, -0.25]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.3, 8]} />
        <meshStandardMaterial color="#e8dcc0" emissive="#ffd98a" emissiveIntensity={0.8} flatShading />
      </mesh>
      <mesh position={[0, 2.62, 0]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function Door() {
  const doorRef = useRef<THREE.Group>(null);
  const openRef = useRef(false);
  const animRef = useRef(0);

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    openRef.current = !openRef.current;
    playSound("creak");
  };

  useFrame((state, delta) => {
    void state;
    const target = openRef.current ? 1 : 0;
    animRef.current += (target - animRef.current) * Math.min(1, delta * 2.5);
    if (doorRef.current) {
      doorRef.current.rotation.y = -animRef.current * 0.95;
    }
  });

  return (
    <group position={[8.15, 0, -5.2]}>
      {/* 门框 */}
      <mesh position={[-0.05, 1.35, -0.82]} castShadow>
        <boxGeometry args={[0.14, 2.7, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[-0.05, 1.35, 0.82]} castShadow>
        <boxGeometry args={[0.14, 2.7, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[-0.05, 2.72, 0]} castShadow>
        <boxGeometry args={[0.14, 0.14, 1.76]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      {/* 门扇 */}
      <group ref={doorRef}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 2.7, 1.5]} />
          <meshStandardMaterial color={WOOD_LIGHT} flatShading />
        </mesh>
        <mesh position={[0, 1.35, -0.02]}>
          <boxGeometry args={[0.05, 2.55, 1.36]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
        <mesh position={[0, 1.05, 0.31]}>
          <boxGeometry args={[0.06, 0.4, 0.02]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[0, 1.65, 0.31]}>
          <boxGeometry args={[0.06, 0.4, 0.02]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        <mesh position={[0, 2.05, 0.02]}>
          <boxGeometry args={[0.04, 0.02, 1.5]} />
          <meshStandardMaterial color={WOOD} flatShading />
        </mesh>
        {/* 圆片把手 */}
        <mesh position={[-0.055, 1.25, 0.62]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.015, 10]} />
          <meshStandardMaterial color="#e8b56a" flatShading />
        </mesh>
        <mesh position={[-0.075, 1.25, 0.62]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
      {/* 点击区 */}
      <mesh
        name="door"
        position={[0.05, 1.35, 0]}
        onClick={toggle}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <boxGeometry args={[0.01, 2.7, 1.5]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
    </group>
  );
}

export default function Decor() {
  return (
    <group>
      <WindowWithSky />
      <WallArt
        position={[-8.35, 4.4, 2.6]}
        rotation={[0, Math.PI / 2, 0]}
        colors={["#ff9eb5", "#8fd9a8", "#ffd166"]}
        variant="mountains"
      />
      <WallArt
        position={[8.38, 4.6, 1.2]}
        rotation={[0, -Math.PI / 2, 0]}
        colors={["#9ecbff", "#c79eff", "#ff8f6b"]}
        variant="sunset"
      />
      <WallArt
        position={[-3.0, 4.4, -6.6]}
        rotation={[0, 0, 0]}
        colors={["#ffe27e", "#7ec8ff", "#ff7eb6"]}
        variant="circle"
      />
      <WallArt
        position={[6.8, 4.0, -6.6]}
        rotation={[0, 0, 0]}
        colors={["#ffb37e", "#8fd9a8", "#7ec8ff"]}
        variant="diamond"
      />
      <WallClock />
      <Dartboard />
      <RockingChair />
      <Rug />
      <Plant position={[8.0, 0, 6.3]} variant="tree" />
      <Plant position={[8.05, 0, -4.0]} variant="cactus" />
      <CatCorner />
      <CeilingLamp />
      <Fireplace />
      <Door />
    </group>
  );
}
