import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DummyType } from "../types";

export function DummyEntity({ data }: { data: DummyType }) {
  const ref = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * 100, []);
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    if (data.hp > 0) {
      const t = state.clock.elapsedTime + timeOffset;
      
      // 随机改变目标点让小人四处游荡
      if (Math.random() < 0.02) {
         data.target.set(
           data.pos.x + (Math.random() - 0.5) * 30,
           0,
           data.pos.z + (Math.random() - 0.5) * 30
         );
      }
      
      const dir = data.target.clone().sub(data.pos);
      const isMoving = dir.lengthSq() > 1;
      
      if (isMoving) {
        dir.normalize();
        data.pos.addScaledVector(dir, 5 * delta); // 移动速度
        
        const targetRotation = Math.atan2(dir.x, dir.z);
        // 平滑旋转
        let diff = targetRotation - ref.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        ref.current.rotation.y += diff * 10 * delta;

        // 行走动画
        const walkPhase = t * 15;
        if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(walkPhase) * 0.5;
        if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(walkPhase + Math.PI) * 0.5;
        if (leftArm.current) leftArm.current.rotation.x = Math.sin(walkPhase + Math.PI) * 0.5;
        if (rightArm.current) rightArm.current.rotation.x = Math.sin(walkPhase) * 0.5;
        if (bodyGroup.current) bodyGroup.current.position.y = Math.abs(Math.sin(walkPhase * 2)) * 0.1;
      } else {
        if (leftLeg.current) leftLeg.current.rotation.x = 0;
        if (rightLeg.current) rightLeg.current.rotation.x = 0;
        if (leftArm.current) leftArm.current.rotation.x = 0;
        if (rightArm.current) rightArm.current.rotation.x = 0;
        if (bodyGroup.current) bodyGroup.current.position.y = 0;
      }
      
      ref.current.position.copy(data.pos);
    } else {
      // 死亡动画：仰面倒下并下沉
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -Math.PI / 2, 5 * delta);
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, -0.4, 5 * delta);
    }
  });

  const hpPercent = data.hp / data.maxHp;
  const hpColor = hpPercent > 0.5 ? "green" : hpPercent > 0.2 ? "orange" : "red";
  const hitFlash = data.hitFlash && data.hitFlash > 0;
  
  const isDead = data.hp <= 0;

  return (
    <group ref={ref} position={data.pos}>
      {!isDead && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ width: "40px", height: "6px", background: "#333", border: "1px solid #000" }}>
            <div style={{ width: `${Math.max(0, hpPercent) * 100}%`, height: "100%", background: hpColor, transition: "width 0.2s" }} />
          </div>
        </Html>
      )}

      <group ref={bodyGroup} position={[0, 0, 0]}>
        {/* 头 */}
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#775544" : "#ffccaa")} emissive={hitFlash ? "#aa0000" : "#000"} />
        </mesh>
        {/* 身体 */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.4]} />
          <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2a2a2a" : "#3a3a3a")} emissive={hitFlash ? "#aa0000" : "#000"} />
        </mesh>
        {/* 手臂 (原点设在肩膀处以便旋转) */}
        <group position={[-0.55, 1.4, 0]} ref={leftArm}>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2a2a2a" : "#3a3a3a")} />
          </mesh>
        </group>
        <group position={[0.55, 1.4, 0]} ref={rightArm}>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2a2a2a" : "#3a3a3a")} />
          </mesh>
        </group>
        {/* 腿 (原点设在髋部以便旋转) */}
        <group position={[-0.2, 0.7, 0]} ref={leftLeg}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.3, 0.7, 0.3]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2a2a2a" : "#3a3a3a")} />
          </mesh>
        </group>
        <group position={[0.2, 0.7, 0]} ref={rightLeg}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.3, 0.7, 0.3]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2a2a2a" : "#3a3a3a")} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
