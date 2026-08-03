"use client";

import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import AngryBall from "./AngryBall";
import { playSound } from "./Sounds";

export const WOOD = "#c98d5e";
export const WOOD_DARK = "#b5714a";
export const WOOD_LIGHT = "#e0a878";

const HOVER_GLOW = new THREE.Color(0xffffff);
const NO_GLOW = new THREE.Color(0x000000);

export function pointerGlow(e: ThreeEvent<PointerEvent>, on: boolean, cursor = true) {
  e.stopPropagation();
  const obj = e.object as THREE.Mesh;
  if (!obj.isMesh) return;
  const mat = obj.material;
  if (!mat || Array.isArray(mat)) return;
  const smat = mat as THREE.MeshStandardMaterial;
  if (!smat.emissive) return;
  smat.emissive.copy(on ? HOVER_GLOW : NO_GLOW);
  smat.emissiveIntensity = on ? 0.3 : 0;
  document.body.style.cursor = cursor ? (on ? "pointer" : "") : "";
}

const PLANK_COLORS = [
  WOOD, WOOD_DARK, WOOD, WOOD_DARK, WOOD, WOOD_DARK, WOOD, WOOD_DARK,
  WOOD, WOOD_DARK, WOOD, WOOD_DARK, WOOD, WOOD_DARK, WOOD, WOOD_DARK,
];

interface BookSpec {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  rz: number;
}

const BOOK_COLORS = [
  "#ff7eb6",
  "#7ec8ff",
  "#b6ff7e",
  "#ffe27e",
  "#c79eff",
  "#9efff0",
  "#ff9e7e",
  "#7effa8",
  "#ffb37e",
  "#7ee0ff",
  "#e07eff",
  "#d0ff7e",
];

const BOOKS: BookSpec[] = (() => {
  const list: BookSpec[] = [];
  const shelves = [0.05, 1.05, 2.05, 3.05];
  shelves.forEach((shelfY, s) => {
    for (let i = 0; i < 6; i++) {
      const x = -0.83 + (i + 0.5) * (1.66 / 6);
      const h = 0.34 + ((s * 11 + i * 3) % 4) * 0.08;
      list.push({
        x,
        y: shelfY + 0.06 + h / 2,
        z: 0.04,
        w: 0.11 + ((s * 5 + i * 7) % 4) * 0.015,
        h,
        d: 0.26,
        color: BOOK_COLORS[(s * 5 + i) % BOOK_COLORS.length],
        rz: ((s + i) % 2 ? -1 : 1) * (0.02 + ((s * 3 + i * 5) % 3) * 0.015),
      });
    }
  });
  return list;
})();

function RoomShell() {
  return (
    <group>
      {PLANK_COLORS.map((color, i) => (
        <mesh key={i} position={[0, 0.06, -6.5625 + i * 0.875]} receiveShadow castShadow>
          <boxGeometry args={[17, 0.12, 0.875]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.17, -7.48]}>
        <boxGeometry args={[17, 0.22, 0.06]} />
        <meshStandardMaterial color="#f2e6d8" flatShading />
      </mesh>
      <mesh position={[-8.48, 0.17, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.22, 0.06]} />
        <meshStandardMaterial color="#f2e6d8" flatShading />
      </mesh>
      <mesh position={[8.48, 0.17, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[14, 0.22, 0.06]} />
        <meshStandardMaterial color="#f2e6d8" flatShading />
      </mesh>
      <mesh position={[0, 0.17, 7.48]}>
        <boxGeometry args={[17, 0.22, 0.06]} />
        <meshStandardMaterial color="#f2e6d8" flatShading />
      </mesh>
      <mesh position={[0, 0.36, 7.55]} castShadow>
        <boxGeometry args={[17, 0.5, 0.12]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0, 4, -7.1]} receiveShadow>
        <boxGeometry args={[17, 8, 0.2]} />
        <meshStandardMaterial color="#ffe0cf" flatShading />
      </mesh>
      <mesh position={[-8.6, 4, 0]} receiveShadow>
        <boxGeometry args={[0.2, 8, 14]} />
        <meshStandardMaterial color="#f7e8d8" flatShading />
      </mesh>
      <mesh position={[8.6, 4, 0]} receiveShadow>
        <boxGeometry args={[0.2, 8, 14]} />
        <meshStandardMaterial color="#d8f0e6" flatShading />
      </mesh>
      <mesh position={[0, 8.05, 0]}>
        <boxGeometry args={[17.4, 0.2, 14.4]} />
        <meshStandardMaterial color="#fdf3e3" flatShading />
      </mesh>
      <mesh position={[0, 0.42, 7.56]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17, 0.7]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
    </group>
  );
}

function Bed() {
  return (
    <group position={[-6.8, 0, 2.6]}>
      {/* 床头板 + 顶部拱形 */}
      <mesh position={[-1.0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.16, 1.24, 3.4]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[-1.02, 1.32, 0]} castShadow>
        <boxGeometry args={[0.18, 0.14, 3.52]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      {/* 床架 + 床腿 */}
      <mesh position={[0.1, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.36, 3.4]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {(
        [
          [-1.0, -1.55],
          [-1.0, 1.55],
          [1.2, -1.55],
          [1.2, 1.55],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.09, lz]} castShadow>
          <boxGeometry args={[0.12, 0.18, 0.12]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {/* 床尾板 */}
      <mesh position={[-1.0, 0.32, 1.78]} castShadow>
        <boxGeometry args={[0.12, 0.64, 0.08]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      {/* 床垫 */}
      <mesh position={[0.1, 0.46, 0]} castShadow>
        <boxGeometry args={[2.1, 0.2, 3.3]} />
        <meshStandardMaterial color="#fdfaf3" flatShading />
      </mesh>
      {/* 被子三段褶皱 */}
      <mesh position={[-0.55, 0.66, 0.05]} rotation={[0, 0, 0.28]} castShadow>
        <boxGeometry args={[1.05, 0.2, 1.85]} />
        <meshStandardMaterial color="#f78fae" flatShading />
      </mesh>
      <mesh position={[0.1, 0.66, -0.1]} castShadow>
        <boxGeometry args={[2.1, 0.2, 1.9]} />
        <meshStandardMaterial color="#ff9eb5" flatShading />
      </mesh>
      <mesh position={[0.75, 0.66, 0.05]} rotation={[0, 0, -0.28]} castShadow>
        <boxGeometry args={[1.05, 0.2, 1.85]} />
        <meshStandardMaterial color="#ff87a8" flatShading />
      </mesh>
      <mesh position={[0.1, 0.62, 1.22]} rotation={[0.14, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.5]} />
        <meshStandardMaterial color="#ffb3c6" flatShading />
      </mesh>
      {/* 枕头双层 */}
      <mesh position={[-0.45, 0.75, -1.45]} castShadow>
        <boxGeometry args={[0.62, 0.26, 0.5]} />
        <meshStandardMaterial color="#fff3df" flatShading />
      </mesh>
      <mesh position={[-0.45, 0.82, -1.43]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.46]} />
        <meshStandardMaterial color="#ffe9cf" flatShading />
      </mesh>
      <mesh position={[0.65, 0.75, -1.45]} castShadow>
        <boxGeometry args={[0.62, 0.26, 0.5]} />
        <meshStandardMaterial color="#fff3df" flatShading />
      </mesh>
      <mesh position={[0.65, 0.82, -1.43]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.46]} />
        <meshStandardMaterial color="#ffe9cf" flatShading />
      </mesh>
      {/* 床尾毯 */}
      <mesh position={[0.1, 0.64, 1.42]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.7]} />
        <meshStandardMaterial color="#8fd9a8" flatShading />
      </mesh>
      <mesh position={[-0.5, 0.55, 0.35]} castShadow>
        <boxGeometry args={[0.6, 0.18, 0.2]} />
        <meshStandardMaterial color="#c79eff" flatShading />
      </mesh>
      <mesh position={[0.4, 0.53, 0.5]} castShadow>
        <boxGeometry args={[0.5, 0.14, 0.18]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      <mesh position={[0.1, 0.8, 1.35]} rotation={[0, 0, 0.08]} castShadow>
        <boxGeometry args={[1.9, 0.06, 0.95]} />
        <meshStandardMaterial color="#ffe2ef" flatShading />
      </mesh>
    </group>
  );
}

export function NightstandLamp() {
  const [on, setOn] = React.useState(true);
  const lightRef = useRef<THREE.PointLight>(null);
  const shadeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (shadeMatRef.current) shadeMatRef.current.emissiveIntensity = on ? 1.6 : 0.04;
    if (bulbMatRef.current) bulbMatRef.current.emissiveIntensity = on ? 1.6 : 0.04;
  }, [on]);

  useFrame((state) => {
    if (on && lightRef.current) {
      lightRef.current.intensity = 3.0 + Math.sin(state.clock.elapsedTime * 1.8) * 0.25;
    }
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    setOn((v) => !v);
    playSound("switch");
  };

  return (
    <group position={[-7.0, 0, 4.4]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.9, 1.05]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      {/* 抽屉面板 + 金色把手 */}
      <mesh position={[0.53, 0.28, 0]} castShadow>
        <boxGeometry args={[0.03, 0.32, 0.92]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0.575, 0.28, 0]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* 台面小书 */}
      <mesh position={[0.36, 0.94, 0.12]} castShadow>
        <boxGeometry args={[0.26, 0.06, 0.18]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      <mesh position={[0.33, 0.98, 0.1]}>
        <boxGeometry args={[0.2, 0.04, 0.14]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[0, 0.8, 0.27]}>
        <boxGeometry args={[0.9, 0.06, 0.4]} />
        <meshStandardMaterial color="#d9b48a" flatShading />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.1, 10]} />
        <meshStandardMaterial color="#e8b56a" flatShading />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.7, 8]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh
        name="nightstand-lamp"
        position={[0, 2.12, 0]}
        castShadow
        onClick={toggle}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <cylinderGeometry args={[0.42, 0.24, 0.42, 12, 1, true]} />
        <meshStandardMaterial
          ref={shadeMatRef}
          color="#ffdf9e"
          emissive="#ffb866"
          emissiveIntensity={1.6}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.0, 0]} intensity={3.0} distance={6} decay={2} color="#ffc97a" />
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial ref={bulbMatRef} color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group position={[2.2, 0, -5.6]}>
      {(
        [
          [-1.6, -0.68],
          [1.6, -0.68],
          [-1.6, 0.68],
          [1.6, 0.68],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.6, lz]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {/* 横撑 */}
      <mesh position={[0, 0.32, -0.68]} castShadow>
        <boxGeometry args={[3.05, 0.05, 0.05]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0.68]} castShadow>
        <boxGeometry args={[3.05, 0.05, 0.05]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh
        position={[0, 1.24, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => pointerGlow(e, true, false)}
        onPointerOut={(e) => pointerGlow(e, false, false)}
      >
        <boxGeometry args={[4.4, 0.09, 1.6]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      {/* 抽屉面板 + 把手 */}
      <mesh position={[0, 0.52, 0.72]} castShadow>
        <boxGeometry args={[4.2, 0.5, 0.05]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={i} position={[x, 0.52, 0.755]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      {/* 显示器 */}
      <mesh position={[-1.1, 1.32, 0]} castShadow>
        <boxGeometry args={[0.4, 0.05, 0.22]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[-1.1, 1.52, -0.05]} castShadow>
        <boxGeometry args={[0.44, 0.34, 0.04]} />
        <meshStandardMaterial color="#2a2a3a" flatShading />
      </mesh>
      <mesh position={[-1.1, 1.52, -0.065]}>
        <boxGeometry args={[0.4, 0.3, 0.01]} />
        <meshStandardMaterial color="#7ec8ff" emissive="#7ec8ff" emissiveIntensity={0.7} />
      </mesh>
      {/* 耳机挂显示器 */}
      <mesh position={[-1.55, 1.5, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.022, 8, 14]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      <mesh position={[-1.55, 1.38, 0.02]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.16, 10]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      <mesh position={[-1.55, 1.38, 0.1]}>
        <circleGeometry args={[0.035, 10]} />
        <meshStandardMaterial color="#ff7eb6" flatShading />
      </mesh>
      {/* 键盘 */}
      <mesh position={[-1.05, 1.33, 0.32]} castShadow>
        <boxGeometry args={[0.5, 0.03, 0.17]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      {/* 笔筒 + 笔 */}
      <mesh position={[-0.5, 1.34, 0.5]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.15, 10]} />
        <meshStandardMaterial color="#e07e5a" flatShading />
      </mesh>
      <mesh position={[-0.46, 1.43, 0.48]} rotation={[-0.25, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.17, 6]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      <mesh position={[-0.53, 1.42, 0.52]} rotation={[0.2, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
        <meshStandardMaterial color="#ff7eb6" flatShading />
      </mesh>
      {/* 马克杯 */}
      <mesh position={[1.2, 1.36, 0.1]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.14, 12]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      {/* 相框 */}
      <mesh position={[0.35, 1.34, -0.52]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.03]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[0.35, 1.34, -0.505]}>
        <boxGeometry args={[0.18, 0.24, 0.01]} />
        <meshStandardMaterial color="#fff6ea" flatShading />
      </mesh>
      <mesh position={[0.35, 1.31, -0.5]}>
        <coneGeometry args={[0.08, 0.1, 4]} />
        <meshStandardMaterial color="#8fd9a8" flatShading />
      </mesh>
      <mesh position={[0.42, 1.4, -0.5]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      {/* 手机 */}
      <mesh position={[0.78, 1.32, 0.42]} castShadow>
        <boxGeometry args={[0.24, 0.015, 0.11]} />
        <meshStandardMaterial color="#2a2a3a" flatShading />
      </mesh>
      <mesh position={[0.78, 1.33, 0.42]}>
        <boxGeometry args={[0.21, 0.005, 0.09]} />
        <meshStandardMaterial color="#7ec8ff" emissive="#7ec8ff" emissiveIntensity={0.45} />
      </mesh>
      {/* 摞起的书本 */}
      <mesh position={[1.55, 1.33, -0.25]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.28]} />
        <meshStandardMaterial color="#ff7eb6" flatShading />
      </mesh>
      <mesh position={[1.58, 1.39, -0.27]}>
        <boxGeometry args={[0.38, 0.05, 0.25]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      <AngryBall x={1.4} z={-0.2} />
    </group>
  );
}

function Chair() {
  return (
    <group position={[2.6, 0, -4.2]} rotation={[0, Math.PI, 0]}>
      <mesh position={[-0.22, 0.3, -0.22]} castShadow>
        <boxGeometry args={[0.07, 0.6, 0.07]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0.22, 0.3, -0.22]} castShadow>
        <boxGeometry args={[0.07, 0.6, 0.07]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[-0.22, 0.3, 0.22]} castShadow>
        <boxGeometry args={[0.07, 0.6, 0.07]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0.22, 0.3, 0.22]} castShadow>
        <boxGeometry args={[0.07, 0.6, 0.07]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {/* 横撑 */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.38, 0.04, 0.04]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      {/* 座垫双层 */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.08, 0.6]} />
        <meshStandardMaterial color="#e8b56a" flatShading />
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow>
        <boxGeometry args={[0.54, 0.05, 0.54]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      {/* 弧形靠背 */}
      <mesh position={[0, 1.0, -0.28]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.07]} />
        <meshStandardMaterial color="#e8b56a" flatShading />
      </mesh>
      <mesh position={[-0.26, 1.0, -0.26]} rotation={[-0.42, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 0.6, 0.06]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[0.26, 1.0, -0.26]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[0.28, 0.6, 0.06]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
    </group>
  );
}

function Bookshelf() {
  return (
    <group position={[-4.2, 0, -6.3]}>
      <mesh position={[-1.0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.1, 3.4, 0.45]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[1.0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.1, 3.4, 0.45]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0, 3.39, 0]} castShadow>
        <boxGeometry args={[2.1, 0.08, 0.49]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {[0.05, 1.05, 2.05, 3.05].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.06, 0.45]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {BOOKS.map((book, i) => (
        <mesh
          key={i}
          position={[book.x, book.y, book.z]}
          rotation={[0, book.rz, 0]}
          castShadow
          onPointerOver={(e) => pointerGlow(e, true, false)}
          onPointerOut={(e) => pointerGlow(e, false, false)}
        >
          <boxGeometry args={[book.w, book.h, book.d]} />
          <meshStandardMaterial color={book.color} flatShading />
        </mesh>
      ))}
      {/* 横卧书堆 */}
      <mesh position={[-0.6, 0.12, 0.04]} castShadow>
        <boxGeometry args={[0.34, 0.08, 0.26]} />
        <meshStandardMaterial color="#9efff0" flatShading />
      </mesh>
      <mesh position={[-0.56, 0.185, 0.03]}>
        <boxGeometry args={[0.3, 0.07, 0.24]} />
        <meshStandardMaterial color="#c79eff" flatShading />
      </mesh>
      {/* 书挡 */}
      <mesh position={[-0.86, 0.16, 0.04]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.07, 0.16, 0.24]} />
        <meshStandardMaterial color="#7ec8a0" flatShading />
      </mesh>
      {/* 顶部摆件:盆栽 + 水晶 + 蜡烛 + 相框 */}
      <group position={[0.55, 3.5, 0.06]}>
        <mesh position={[0, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.18, 8]} />
          <meshStandardMaterial color="#e07e5a" flatShading />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <icosahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#8fd9a8" flatShading />
        </mesh>
        <mesh position={[0.07, 0.14, 0.03]}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#a8e6b5" flatShading />
        </mesh>
      </group>
      <mesh position={[-0.62, 3.53, 0.08]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.22, 6]} />
        <meshStandardMaterial color="#ffe27e" emissive="#ffd166" emissiveIntensity={0.6} flatShading />
      </mesh>
      <mesh position={[-0.62, 3.66, 0.08]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.05, 3.56, 0.06]}>
        <icosahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#c79eff" flatShading />
      </mesh>
      <group position={[-0.28, 3.5, 0.1]}>
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.2, 0.24, 0.03]} />
          <meshStandardMaterial color="#5b4a3f" flatShading />
        </mesh>
        <mesh position={[0, 0.01, 0.02]}>
          <boxGeometry args={[0.16, 0.2, 0.01]} />
          <meshStandardMaterial color="#fff6ea" flatShading />
        </mesh>
        <mesh position={[-0.04, 0.02, 0.03]}>
          <circleGeometry args={[0.06, 8]} />
          <meshBasicMaterial color="#ff7eb6" />
        </mesh>
      </group>
    </group>
  );
}

function Wardrobe() {
  return (
    <group position={[-7.9, 0, -4.6]}>
      <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 2.9, 2.4]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0.06, 1.5, -0.6]} castShadow>
        <boxGeometry args={[0.05, 2.55, 1.16]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[0.06, 1.5, 0.6]} castShadow>
        <boxGeometry args={[0.05, 2.55, 1.16]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[0.08, 1.5, -0.6]}>
        <boxGeometry args={[0.02, 1.9, 0.9]} />
        <meshStandardMaterial color="#e8cba4" flatShading />
      </mesh>
      <mesh position={[0.08, 1.5, 0.6]}>
        <boxGeometry args={[0.02, 1.9, 0.9]} />
        <meshStandardMaterial color="#e8cba4" flatShading />
      </mesh>
      {/* 门板下部压条 */}
      <mesh position={[0.085, 0.55, -0.6]}>
        <boxGeometry args={[0.015, 0.09, 1.16]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0.085, 0.55, 0.6]}>
        <boxGeometry args={[0.015, 0.09, 1.16]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      {/* 顶部装饰线 */}
      <mesh position={[0, 2.96, 0]} castShadow>
        <boxGeometry args={[0.9, 0.07, 2.56]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0.1, 1.5, -0.28]} castShadow>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.1, 1.5, 0.28]} castShadow>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.42, 0]} castShadow>
        <boxGeometry args={[0.9, 0.12, 2.5]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.9, 0.12, 2.5]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
    </group>
  );
}

function Sofa() {
  return (
    <group position={[6.2, 0, -2.6]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.5, 1.05]} />
        <meshStandardMaterial color="#8fd9a8" flatShading />
      </mesh>
      {/* 座垫分块 */}
      {[-0.93, 0, 0.93].map((x, i) => (
        <mesh key={i} position={[x, 0.52, 0]} castShadow>
          <boxGeometry args={[0.82, 0.08, 0.9]} />
          <meshStandardMaterial color="#6fbf94" flatShading />
        </mesh>
      ))}
      {[-0.93, 0, 0.93].map((x, i) => (
        <mesh key={i} position={[x, 0.66, -0.03]} castShadow>
          <boxGeometry args={[0.86, 0.22, 0.82]} />
          <meshStandardMaterial color="#a8e6b5" flatShading />
        </mesh>
      ))}
      {/* 靠背软垫 x3 */}
      {[-0.93, 0, 0.93].map((x, i) => (
        <mesh key={i} position={[x, 0.95, -0.46]}>
          <boxGeometry args={[0.86, 0.75, 0.18]} />
          <meshStandardMaterial color={["#b8f0c8", "#ffb3c6", "#b8f0c8"][i]} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.95, -0.46]} castShadow>
        <boxGeometry args={[2.8, 0.85, 0.24]} />
        <meshStandardMaterial color="#7ec8a0" flatShading />
      </mesh>
      {[-0.93, 0, 0.93].map((x, i) => (
        <mesh key={i} position={[x, 0.92, -0.33]}>
          <boxGeometry args={[0.86, 0.55, 0.15]} />
          <meshStandardMaterial color="#b8f0c8" flatShading />
        </mesh>
      ))}
      {/* 前缘装饰垫 */}
      {[-0.93, 0, 0.93].map((x, i) => (
        <mesh key={i} position={[x, 0.72, 0.35]} castShadow>
          <boxGeometry args={[0.78, 0.16, 0.26]} />
          <meshStandardMaterial color={["#ffb3c6", "#ffe27e", "#7ec8ff"][i]} flatShading />
        </mesh>
      ))}
      {/* 抱枕 */}
      <mesh position={[0.55, 0.78, 0.5]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.26]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[-0.5, 0.82, 0.45]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.36, 0.13, 0.24]} />
        <meshStandardMaterial color="#c79eff" flatShading />
      </mesh>
      {/* 扶手 + 卷边 */}
      <mesh position={[-1.4, 0.55, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 1.05]} />
        <meshStandardMaterial color="#7ec8a0" flatShading />
      </mesh>
      <mesh position={[1.4, 0.55, 0]} castShadow>
        <boxGeometry args={[0.26, 0.6, 1.05]} />
        <meshStandardMaterial color="#7ec8a0" flatShading />
      </mesh>
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.26, 10]} />
          <meshStandardMaterial color="#6fbf94" flatShading />
        </mesh>
      ))}
      {/* 金属腿 */}
      {(
        [
          [-1.25, -0.42],
          [1.25, -0.42],
          [-1.25, 0.42],
          [1.25, 0.42],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.09, lz]}>
          <cylinderGeometry args={[0.035, 0.045, 0.18, 8]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.35} metalness={0.5} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function CoffeeTable() {
  return (
    <group position={[6.2, 0, -4.7]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.85]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      {(
        [
          [-0.65, -0.35],
          [0.65, -0.35],
          [-0.65, 0.35],
          [0.65, 0.35],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.2, lz]} castShadow>
          <boxGeometry args={[0.07, 0.4, 0.07]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      <mesh position={[-0.35, 0.5, 0.12]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.22]} />
        <meshStandardMaterial color="#ff7eb6" flatShading />
      </mesh>
      <mesh position={[-0.32, 0.55, 0.14]}>
        <boxGeometry args={[0.24, 0.04, 0.18]} />
        <meshStandardMaterial color="#7ec8ff" flatShading />
      </mesh>
      <mesh position={[0.42, 0.51, -0.12]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.14, 12]} />
        <meshStandardMaterial color="#ffe27e" flatShading />
      </mesh>
      {/* 杂志斜放 */}
      <mesh position={[0.1, 0.48, 0.3]} rotation={[0.5, 0, 0.15]} castShadow>
        <boxGeometry args={[0.26, 0.015, 0.3]} />
        <meshStandardMaterial color="#8fd9a8" flatShading />
      </mesh>
      <mesh position={[0.28, 0.47, 0.22]} rotation={[0.55, 0.4, 0]}>
        <boxGeometry args={[0.22, 0.015, 0.26]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      {/* 遥控器 */}
      <mesh position={[-0.1, 0.47, 0.3]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.14, 0.02, 0.045]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      {/* 杯垫 x2 */}
      <mesh position={[-0.25, 0.47, -0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.008, 10]} />
        <meshStandardMaterial color="#e8b56a" flatShading />
      </mesh>
      <mesh position={[0.25, 0.47, -0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.008, 10]} />
        <meshStandardMaterial color="#e8b56a" flatShading />
      </mesh>
      {/* 水果盘 */}
      <mesh position={[0.6, 0.47, 0.08]} castShadow>
        <cylinderGeometry args={[0.11, 0.08, 0.035, 12]} />
        <meshStandardMaterial color="#e07e5a" flatShading />
      </mesh>
      <mesh position={[0.57, 0.505, 0.07]}>
        <sphereGeometry args={[0.032, 8, 6]} />
        <meshStandardMaterial color="#ffb37e" flatShading />
      </mesh>
      <mesh position={[0.63, 0.5, 0.11]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#ffd166" flatShading />
      </mesh>
    </group>
  );
}

const TV_CHANNELS = [
  { color: "#0e2430", emissive: "#3fa9d9", intensity: 0.5 },
  { color: "#261016", emissive: "#d96a8a", intensity: 0.55 },
  { color: "#141f12", emissive: "#7fc46a", intensity: 0.5 },
  { color: "#241d0e", emissive: "#d9b45a", intensity: 0.55 },
];

function TVStand() {
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const channelRef = useRef(0);

  const changeChannel = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    channelRef.current = (channelRef.current + 1) % TV_CHANNELS.length;
    const c = TV_CHANNELS[channelRef.current];
    if (screenMatRef.current) {
      screenMatRef.current.color.set(c.color);
      screenMatRef.current.emissive.set(c.emissive);
      screenMatRef.current.emissiveIntensity = c.intensity;
    }
    playSound("blip");
  };

  return (
    <group position={[6.4, 0, -6.3]}>
      <mesh position={[0, 0.375, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.75, 0.55]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {/* 柜腿 */}
      {(
        [
          [-1.35, -0.18],
          [1.35, -0.18],
          [-1.35, 0.18],
          [1.35, 0.18],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.06, lz]} castShadow>
          <boxGeometry args={[0.09, 0.12, 0.09]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      <mesh position={[-0.75, 0.44, 0.02]}>
        <boxGeometry args={[0.03, 0.6, 0.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[0.75, 0.44, 0.02]}>
        <boxGeometry args={[0.03, 0.6, 0.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      <mesh position={[-0.75, 0.44, 0.24]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.75, 0.44, 0.24]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#ffd166" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* 音箱 x2 */}
      {[-0.35, 0.35].map((x, i) => (
        <group key={i} position={[x, 0.58, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.26, 0.12]} />
            <meshStandardMaterial color="#3a3a4a" flatShading />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <circleGeometry args={[0.08, 12]} />
            <meshStandardMaterial color="#1c1c28" flatShading />
          </mesh>
        </group>
      ))}
      {/* 游戏机 */}
      <mesh position={[1.25, 0.55, 0.06]} castShadow>
        <boxGeometry args={[0.24, 0.06, 0.16]} />
        <meshStandardMaterial color="#f0f0f0" flatShading />
      </mesh>
      <mesh position={[1.35, 0.6, 0.06]}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshStandardMaterial color="#7effa8" emissive="#7effa8" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.45, 0.07, 0.28]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      <mesh position={[0, 1.42, 0.01]} castShadow>
        <boxGeometry args={[2.3, 1.3, 0.08]} />
        <meshStandardMaterial color="#22222e" flatShading />
      </mesh>
      <mesh
        name="tv-screen"
        position={[0, 1.42, 0.06]}
        onClick={changeChannel}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <boxGeometry args={[2.05, 1.12, 0.015]} />
        <meshStandardMaterial
          ref={screenMatRef}
          color="#0e2430"
          emissive="#3fa9d9"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-1.15, 0.95, 0.03]} castShadow>
        <boxGeometry args={[0.34, 0.4, 0.26]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[1.15, 0.95, 0.03]} castShadow>
        <boxGeometry args={[0.34, 0.4, 0.26]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[-1.15, 0.95, 0.17]}>
        <circleGeometry args={[0.08, 10]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
      <mesh position={[1.15, 0.95, 0.17]}>
        <circleGeometry args={[0.08, 10]} />
        <meshStandardMaterial color="#3a3a4a" flatShading />
      </mesh>
    </group>
  );
}

function FloorLamp() {
  const [on, setOn] = React.useState(true);
  const lightRef = useRef<THREE.PointLight>(null);
  const shadeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (shadeMatRef.current) shadeMatRef.current.emissiveIntensity = on ? 1.2 : 0.04;
    if (bulbMatRef.current) bulbMatRef.current.emissiveIntensity = on ? 1.8 : 0.04;
  }, [on]);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = on ? 1.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.15 : 0;
    }
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    setOn((v) => !v);
    playSound("switch");
  };

  return (
    <group position={[3.8, 0, 4.8]}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.06, 12]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.07, 10]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 1.8, 8]} />
        <meshStandardMaterial color={WOOD_DARK} flatShading />
      </mesh>
      <mesh
        name="floor-lamp"
        position={[0, 1.9, 0]}
        castShadow
        onClick={toggle}
        onPointerOver={(e) => pointerGlow(e, true)}
        onPointerOut={(e) => pointerGlow(e, false)}
      >
        <cylinderGeometry args={[0.3, 0.18, 0.55, 6, 1, true]} />
        <meshStandardMaterial
          ref={shadeMatRef}
          color="#ffdf9e"
          emissive="#ffb866"
          emissiveIntensity={1.2}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial ref={bulbMatRef} color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.8} />
      </mesh>
      {/* 拉绳开关 */}
      <mesh position={[0.12, 1.6, 0]} onClick={toggle}>
        <cylinderGeometry args={[0.008, 0.008, 0.55, 6]} />
        <meshStandardMaterial color="#5b4a3f" flatShading />
      </mesh>
      <mesh position={[0.12, 1.32, 0]} onClick={toggle}>
        <sphereGeometry args={[0.032, 8, 6]} />
        <meshStandardMaterial color="#fff6ea" flatShading />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.75, 0]} intensity={1.5} distance={6} decay={2} color="#ffd9a0" />
    </group>
  );
}

function FootBench() {
  return (
    <group position={[-6.0, 0, 5.4]}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.12, 0.5]} />
        <meshStandardMaterial color={WOOD_LIGHT} flatShading />
      </mesh>
      {(
        [
          [-0.65, -0.18],
          [0.65, -0.18],
          [-0.65, 0.18],
          [0.65, 0.18],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.15, lz]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshStandardMaterial color={WOOD_DARK} flatShading />
        </mesh>
      ))}
      {/* 横撑 */}
      <mesh position={[0, 0.2, -0.18]}>
        <boxGeometry args={[1.16, 0.04, 0.04]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.18]}>
        <boxGeometry args={[1.16, 0.04, 0.04]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      {/* 木质圈边 + 双层垫 */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[1.0, 0.05, 0.42]} />
        <meshStandardMaterial color={WOOD} flatShading />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.95, 0.18, 0.38]} />
        <meshStandardMaterial color="#ffb3c6" flatShading />
      </mesh>
      <mesh position={[0, 0.59, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.38]} />
        <meshStandardMaterial color="#ffd166" flatShading />
      </mesh>
      <mesh position={[0, 0.56, 0.26]} castShadow>
        <boxGeometry args={[0.42, 0.14, 0.12]} />
        <meshStandardMaterial color="#fff3df" flatShading />
      </mesh>
    </group>
  );
}

export default function Furniture() {
  return (
    <group>
      <RoomShell />
      <Bed />
      <NightstandLamp />
      <Desk />
      <Chair />
      <Bookshelf />
      <Wardrobe />
      <Sofa />
      <CoffeeTable />
      <TVStand />
      <FloorLamp />
      <FootBench />
    </group>
  );
}
