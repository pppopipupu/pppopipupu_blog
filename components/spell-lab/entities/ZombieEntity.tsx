import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DummyType, ZombieType } from "../types";
import { getTerrainHeight, getModifiedHeight } from "../spells/InfiniteTerrain";

export const ZombieEntity = React.memo(function ZombieEntity({
  data,
  dummies,
  onAttack,
  craters = []
}: {
  data: ZombieType;
  dummies: DummyType[];
  onAttack: (dummyId: number, damage: number) => void;
  craters?: { x: number; z: number; r: number; d: number }[]
}) {
  const ref = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * 100, []);
  
  const currentTargetId = useRef<number | null>(null);
  const localLastAttackTime = useRef<number>(0);
  const vy = useRef(0);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const terrainY = getModifiedHeight(data.pos.x, data.pos.z, craters);
    
    if (data.hp > 0) {
      const t = state.clock.elapsedTime + timeOffset;

      if (currentTargetId.current === null || Math.random() < 0.05) {
        let minDist = Infinity;
        let bestTarget: DummyType | null = null;
        for (let i = 0; i < dummies.length; i++) {
          const d = dummies[i];
          if (d.hp > 0) {
            const dist = data.pos.distanceTo(d.pos);
            if (dist < minDist) {
              minDist = dist;
              bestTarget = d;
            }
          }
        }
        if (bestTarget) {
          currentTargetId.current = bestTarget.id;
        } else {
          currentTargetId.current = null;
        }
      }

      const activeTarget = dummies.find(d => d.id === currentTargetId.current && d.hp > 0);
      if (activeTarget) {
        data.target.copy(activeTarget.pos);
      } else {
        currentTargetId.current = null;
        if (Math.random() < 0.02) {
          const tx = data.pos.x + (Math.random() - 0.5) * 20;
          const tz = data.pos.z + (Math.random() - 0.5) * 20;
          const th = getModifiedHeight(tx, tz, craters);
          data.target.set(tx, th, tz);
        }
      }

      const dir = data.target.clone().sub(data.pos);
      const horizontalDistSq = dir.x * dir.x + dir.z * dir.z;
      const isCloseToTarget = activeTarget && horizontalDistSq <= 9.0;
      
      if (isCloseToTarget && activeTarget) {
        const horizontalDir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
        const targetRotation = Math.atan2(horizontalDir.x, horizontalDir.z);
        let diff = targetRotation - ref.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        ref.current.rotation.y += diff * 10 * delta;

        if (leftLeg.current) leftLeg.current.rotation.x = 0;
        if (rightLeg.current) rightLeg.current.rotation.x = 0;
        if (bodyGroup.current) bodyGroup.current.position.y = 0;

        const animPhase = t * 10;
        if (leftArm.current) leftArm.current.rotation.x = -Math.PI / 2.5 + Math.sin(animPhase) * 0.3;
        if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 2.5 + Math.cos(animPhase) * 0.3;

        if (state.clock.elapsedTime - localLastAttackTime.current > 1.5) {
          localLastAttackTime.current = state.clock.elapsedTime;
          const dmgAmt = Math.floor(Math.random() * 6) + 2;
          onAttack(activeTarget.id, dmgAmt);
        }
      } else if (horizontalDistSq > 1.0) {
        const horizontalDir = new THREE.Vector3(dir.x, 0, dir.z).normalize();
        data.pos.addScaledVector(horizontalDir, 2.2 * delta);
        const nextTerrainY = getModifiedHeight(data.pos.x, data.pos.z, craters);
        if (data.pos.y < nextTerrainY) {
          data.pos.y = nextTerrainY;
        }

        const targetRotation = Math.atan2(horizontalDir.x, horizontalDir.z);
        let diff = targetRotation - ref.current.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        ref.current.rotation.y += diff * 6 * delta;

        const walkPhase = t * 6;
        if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(walkPhase) * 0.4;
        if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(walkPhase + Math.PI) * 0.4;
        
        if (leftArm.current) leftArm.current.rotation.x = -Math.PI / 3 + Math.sin(walkPhase) * 0.15;
        if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 3 + Math.sin(walkPhase + Math.PI) * 0.15;
        
        if (bodyGroup.current) bodyGroup.current.position.y = Math.abs(Math.sin(walkPhase * 2)) * 0.05;
      } else {
        if (leftLeg.current) leftLeg.current.rotation.x = 0;
        if (rightLeg.current) rightLeg.current.rotation.x = 0;
        if (leftArm.current) leftArm.current.rotation.x = -Math.PI / 4;
        if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 4;
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
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -Math.PI / 2, 5 * delta);
      ref.current.position.copy(data.pos);
    }
  });

  const hpPercent = data.hp / data.maxHp;
  const hitFlash = data.hitFlash && data.hitFlash > 0;
  const isDead = data.hp <= 0;

  return (
    <group ref={ref} position={data.pos}>
      {!isDead && data.hp < data.maxHp && (
        <Html position={[0, 2.8, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{ width: "40px", height: "6px", background: "#333", border: "1px solid #000" }}>
            <div style={{ width: `${Math.max(0, hpPercent) * 100}%`, height: "100%", background: "#4caf50", transition: "width 0.2s" }} />
          </div>
        </Html>
      )}

      <group ref={bodyGroup} position={[0, 0, 0]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2b3d18" : "#4c662b")} emissive={hitFlash ? "#aa0000" : "#000"} />
        </mesh>
        
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.4]} />
          <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#1b1918" : "#3b3835")} emissive={hitFlash ? "#aa0000" : "#000"} />
        </mesh>
        
        <group position={[-0.55, 1.4, 0]} ref={leftArm}>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2b3d18" : "#4c662b")} />
          </mesh>
        </group>
        <group position={[0.55, 1.4, 0]} ref={rightArm}>
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#2b3d18" : "#4c662b")} />
          </mesh>
        </group>
        
        <group position={[-0.2, 0.7, 0]} ref={leftLeg}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.3, 0.7, 0.3]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#1b1918" : "#3b3835")} />
          </mesh>
        </group>
        <group position={[0.2, 0.7, 0]} ref={rightLeg}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.3, 0.7, 0.3]} />
            <meshStandardMaterial color={hitFlash ? "#ff0000" : (isDead ? "#1b1918" : "#3b3835")} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
