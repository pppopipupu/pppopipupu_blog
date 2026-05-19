import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DummyType } from "../types";
import { getModifiedHeight } from "../spells/InfiniteTerrain";

export const DummyEntity = React.memo(function DummyEntity({ data, craters = [] }: { data: DummyType; craters?: { x: number; z: number; r: number; d: number }[] }) {
  if (data.consumed) return null;
  const ref = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * 100, []);
  const vy = useRef(0);
  const { camera } = useThree();
  const lastPos = useRef(new THREE.Vector3());
  const isPlayer = data.id === 99999;
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    const terrainY = getModifiedHeight(data.pos.x, data.pos.z, craters);
    if (data.hp > 0) {
      const t = state.clock.elapsedTime + timeOffset;
      
      if (isPlayer) {
        ref.current.position.copy(data.pos);
        const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        ref.current.rotation.y = Math.atan2(camDir.x, camDir.z);
        const distSq = data.pos.distanceToSquared(lastPos.current);
        const isMoving = distSq > 0.001;
        lastPos.current.copy(data.pos);
        
        if (isMoving) {
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
      } else {
        // 随机改变目标点让小人四处游荡
        if (Math.random() < 0.02) {
           const tx = data.pos.x + (Math.random() - 0.5) * 30;
           const tz = data.pos.z + (Math.random() - 0.5) * 30;
           const th = getModifiedHeight(tx, tz, craters);
           data.target.set(tx, th, tz);
        }
        
        const dir = data.target.clone().sub(data.pos);
        const horizontalDistSq = dir.x * dir.x + dir.z * dir.z;
        const isMoving = horizontalDistSq > 1;
        
        if (isMoving) {
          const horizontalDir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
          data.pos.addScaledVector(horizontalDir, 5 * delta);
          const nextTerrainY = getModifiedHeight(data.pos.x, data.pos.z, craters);
          if (data.pos.y < nextTerrainY) {
            data.pos.y = nextTerrainY;
          }
          
          const targetRotation = Math.atan2(horizontalDir.x, horizontalDir.z);
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
        
        if (data.pos.y > terrainY + 0.01) {
          vy.current -= 9.8 * delta;
          data.pos.y += vy.current * delta;
          if (data.pos.y <= terrainY) {
            data.pos.y = terrainY;
            vy.current = 0;
          }
        } else {
          data.pos.y = terrainY;
          vy.current = 0;
        }
        
        ref.current.position.copy(data.pos);
      }
    } else {
      const targetCorpseY = terrainY - 0.4;
      if (data.pos.y > targetCorpseY + 0.01) {
        vy.current -= 9.8 * delta;
        data.pos.y += vy.current * delta;
        if (data.pos.y <= targetCorpseY) {
          data.pos.y = targetCorpseY;
          vy.current = 0;
        }
      } else {
        data.pos.y = THREE.MathUtils.lerp(data.pos.y, targetCorpseY, 5 * delta);
        vy.current = 0;
      }
      // 死亡动画：仰面倒下并下沉
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -Math.PI / 2, 5 * delta);
      ref.current.position.copy(data.pos);
    }
  });

  const hpPercent = data.hp / data.maxHp;
  const hpColor = hpPercent > 0.5 ? "green" : hpPercent > 0.2 ? "orange" : "red";
  const hitFlash = data.hitFlash && data.hitFlash > 0;
  
  const isDead = data.hp <= 0;

  return (
    <group ref={ref} position={data.pos}>
      {!isDead && data.hp < data.maxHp && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ width: "40px", height: "6px", background: "#333", border: "1px solid #000" }}>
            <div style={{ width: `${Math.max(0, hpPercent) * 100}%`, height: "100%", background: hpColor, transition: "width 0.2s" }} />
          </div>
        </Html>
      )}

      <group ref={bodyGroup} position={[0, 0, 0]}>
        {/* 头 */}
        {!isPlayer && (
          <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#775544" : "#ffccaa")} emissive={hitFlash ? "#aa0000" : "#000"} />
          </mesh>
        )}
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
});
