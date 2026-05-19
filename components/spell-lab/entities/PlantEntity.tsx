import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PlantData, PlantPart, CraterType } from "../types";

export function generatePartsForPlant(type: string): PlantPart[] {
  const parts: PlantPart[] = [];
  if (type === "arcane-tree") {
    parts.push(
      { id: "trunk", localOffset: new THREE.Vector3(0, 1.5, 0), size: new THREE.Vector3(0.5, 3.0, 0.5), type: "cylinder", color: "#4e342e", segments: 8 },
      { id: "leaves_1", localOffset: new THREE.Vector3(0, 3.8, 0), size: new THREE.Vector3(2.4, 2.2, 2.4), type: "cone", color: "#00e676", segments: 8 },
      { id: "leaves_2", localOffset: new THREE.Vector3(0, 4.9, 0), size: new THREE.Vector3(1.8, 1.8, 1.8), type: "cone", color: "#d500f9", segments: 8 },
      { id: "berry_1", localOffset: new THREE.Vector3(-0.9, 3.2, 0.9), size: new THREE.Vector3(0.35, 0.35, 0.35), type: "sphere", color: "#00e5ff", segments: 8 },
      { id: "berry_2", localOffset: new THREE.Vector3(0.9, 3.2, -0.9), size: new THREE.Vector3(0.35, 0.35, 0.35), type: "sphere", color: "#ff007f", segments: 8 }
    );
  } else if (type === "giant-mushroom") {
    parts.push(
      { id: "stem", localOffset: new THREE.Vector3(0, 1.0, 0), size: new THREE.Vector3(0.6, 2.0, 0.6), type: "cylinder", color: "#f5f5f5", segments: 8 },
      { id: "cap", localOffset: new THREE.Vector3(0, 2.3, 0), size: new THREE.Vector3(2.8, 1.0, 2.8), type: "sphere", color: "#7b1fa2", segments: 12 },
      { id: "spot_1", localOffset: new THREE.Vector3(-0.6, 2.7, 0.6), size: new THREE.Vector3(0.35, 0.35, 0.35), type: "sphere", color: "#00e5ff", segments: 8 },
      { id: "spot_2", localOffset: new THREE.Vector3(0.6, 2.7, -0.6), size: new THREE.Vector3(0.35, 0.35, 0.35), type: "sphere", color: "#00e5ff", segments: 8 },
      { id: "spot_3", localOffset: new THREE.Vector3(0, 2.85, 0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "sphere", color: "#ffffff", segments: 8 }
    );
  } else if (type === "ash-pillar") {
    parts.push(
      { id: "base", localOffset: new THREE.Vector3(0, 1.0, 0), size: new THREE.Vector3(1.2, 2.0, 1.2), type: "cylinder", color: "#37474f", segments: 8 },
      { id: "mid", localOffset: new THREE.Vector3(0.2, 2.6, 0.1), size: new THREE.Vector3(0.8, 1.8, 0.8), type: "box", color: "#263238", rotation: new THREE.Euler(0.15, 0, 0.1) },
      { id: "shard_1", localOffset: new THREE.Vector3(-0.6, 1.5, 0.4), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#ff3d00", rotation: new THREE.Euler(0.4, 0.4, 0.4) },
      { id: "shard_2", localOffset: new THREE.Vector3(0.6, 2.2, -0.4), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#ff9100", rotation: new THREE.Euler(-0.4, -0.4, -0.4) }
    );
  } else if (type === "basalt-spire") {
    parts.push(
      { id: "spire_1", localOffset: new THREE.Vector3(-0.3, 1.8, -0.2), size: new THREE.Vector3(0.8, 3.6, 0.8), type: "cylinder", color: "#212121", segments: 6 },
      { id: "spire_2", localOffset: new THREE.Vector3(0.4, 1.2, 0.3), size: new THREE.Vector3(0.6, 2.4, 0.6), type: "cylinder", color: "#424242", segments: 6 },
      { id: "magma_1", localOffset: new THREE.Vector3(0, 1.5, 0), size: new THREE.Vector3(0.5, 0.5, 0.5), type: "sphere", color: "#ff3c00", segments: 8 },
      { id: "magma_2", localOffset: new THREE.Vector3(0.2, 2.8, 0.1), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "sphere", color: "#ff9100", segments: 8 }
    );
  } else if (type === "frost-spike") {
    parts.push(
      { id: "spike_main", localOffset: new THREE.Vector3(0, 2.0, 0), size: new THREE.Vector3(0.8, 4.0, 0.8), type: "cone", color: "#80deea", segments: 6 },
      { id: "spike_side1", localOffset: new THREE.Vector3(-0.5, 1.2, 0.3), size: new THREE.Vector3(0.5, 2.2, 0.5), type: "cone", color: "#00e5ff", rotation: new THREE.Euler(0.4, 0, 0.3), segments: 6 },
      { id: "spike_side2", localOffset: new THREE.Vector3(0.5, 1.0, -0.3), size: new THREE.Vector3(0.4, 1.8, 0.4), type: "cone", color: "#00e5ff", rotation: new THREE.Euler(-0.4, 0, -0.3), segments: 6 }
    );
  } else if (type === "snowy-pine") {
    parts.push(
      { id: "trunk", localOffset: new THREE.Vector3(0, 1.2, 0), size: new THREE.Vector3(0.35, 2.4, 0.35), type: "cylinder", color: "#5d4037", segments: 8 },
      { id: "leaves_1", localOffset: new THREE.Vector3(0, 2.2, 0), size: new THREE.Vector3(2.2, 1.5, 2.2), type: "cone", color: "#2e7d32", segments: 8 },
      { id: "leaves_2", localOffset: new THREE.Vector3(0, 3.1, 0), size: new THREE.Vector3(1.6, 1.2, 1.6), type: "cone", color: "#2e7d32", segments: 8 },
      { id: "leaves_3", localOffset: new THREE.Vector3(0, 3.9, 0), size: new THREE.Vector3(1.0, 0.9, 1.0), type: "cone", color: "#2e7d32", segments: 8 },
      { id: "snow_1", localOffset: new THREE.Vector3(0, 2.25, 0), size: new THREE.Vector3(2.24, 0.15, 2.24), type: "cone", color: "#ffffff", segments: 8 },
      { id: "snow_2", localOffset: new THREE.Vector3(0, 3.15, 0), size: new THREE.Vector3(1.64, 0.12, 1.64), type: "cone", color: "#ffffff", segments: 8 },
      { id: "snow_3", localOffset: new THREE.Vector3(0, 3.94, 0), size: new THREE.Vector3(1.04, 0.1, 1.04), type: "cone", color: "#ffffff", segments: 8 }
    );
  }
  return parts;
}

export const PlantEntity = React.memo(function PlantEntity({
  data,
  craters = [],
  spawnDebris,
  onDamage
}: {
  data: PlantData;
  craters?: CraterType[];
  spawnDebris: (pos: THREE.Vector3, color: string) => void;
  onDamage?: (dmg: number, pos: THREE.Vector3) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const destroyedPartsRef = useRef<Record<string, boolean>>({});

  const wobbleX = useRef(0);
  const wobbleZ = useRef(0);
  const wobbleVx = useRef(0);
  const wobbleVz = useRef(0);

  const squashY = useRef(1.0);
  const squashVy = useRef(0);

  const lastY = useRef(data.pos.y);
  const lastVy = useRef(0);

  const hitFlashTimer = useRef(0);
  const lastDestroyedCount = useRef(0);
  const lastCraterCount = useRef(craters.length);

  const timeOffset = useMemo(() => Math.random() * 100, []);

  const partStatuses = useMemo(() => {
    const statuses: Record<string, { isDestroyed: boolean; worldPos: THREE.Vector3 }> = {};
    data.parts.forEach((part) => {
      const rotatedOffset = part.localOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), data.rotation);
      const worldPos = data.pos.clone().add(rotatedOffset.multiplyScalar(data.scale));
      let isDestroyed = false;
      for (const c of craters) {
        const dx = worldPos.x - c.x;
        const dz = worldPos.z - c.z;
        if (dx * dx + dz * dz < c.r * c.r) {
          isDestroyed = true;
          break;
        }
      }
      statuses[part.id] = { isDestroyed, worldPos };
    });
    return statuses;
  }, [data.parts, data.pos, data.rotation, data.scale, craters]);

  useEffect(() => {
    Object.keys(partStatuses).forEach((id) => {
      const status = partStatuses[id];
      if (status.isDestroyed && !destroyedPartsRef.current[id]) {
        destroyedPartsRef.current[id] = true;
        const part = data.parts.find((p) => p.id === id);
        if (part) {
          spawnDebris(status.worldPos, part.color);
          if (onDamage) {
            onDamage(25, status.worldPos);
          }
        }
      }
    });

    const currentDestroyedCount = Object.values(partStatuses).filter(v => v.isDestroyed).length;
    if (currentDestroyedCount > lastDestroyedCount.current) {
      hitFlashTimer.current = 0.25;
      wobbleVx.current += (Math.random() - 0.5) * 15;
      wobbleVz.current += (Math.random() - 0.5) * 15;
      lastDestroyedCount.current = currentDestroyedCount;
    }
  }, [partStatuses, data.parts, spawnDebris, onDamage]);

  useFrame((state, delta) => {
    if (craters.length < lastCraterCount.current) {
      lastCraterCount.current = craters.length;
    }
    if (craters.length > lastCraterCount.current) {
      const newCraters = craters.slice(lastCraterCount.current);
      newCraters.forEach((crater) => {
        const dx = data.pos.x - crater.x;
        const dz = data.pos.z - crater.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < crater.r + 5.0) {
          const force = (1.0 - dist / (crater.r + 5.0)) * 25.0;
          const pushX = (dx / (dist + 0.001)) * force;
          const pushZ = (dz / (dist + 0.001)) * force;
          wobbleVx.current += pushX;
          wobbleVz.current += pushZ;
        }
      });
      lastCraterCount.current = craters.length;
    }

    wobbleVx.current += -12.0 * wobbleX.current * delta;
    wobbleVx.current *= Math.exp(-4.5 * delta);
    wobbleX.current += wobbleVx.current * delta;

    wobbleVz.current += -12.0 * wobbleZ.current * delta;
    wobbleVz.current *= Math.exp(-4.5 * delta);
    wobbleZ.current += wobbleVz.current * delta;

    const currentVy = (data.pos.y - lastY.current) / (delta + 0.0001);
    lastY.current = data.pos.y;

    if (lastVy.current < -1.5 && currentVy === 0) {
      const speed = Math.abs(lastVy.current);
      squashVy.current -= Math.min(speed * 0.12, 1.2);
    }
    lastVy.current = currentVy;

    const squashAcc = -24.0 * (squashY.current - 1.0);
    squashVy.current += squashAcc * delta;
    squashVy.current *= Math.exp(-6.5 * delta);
    squashY.current += squashVy.current * delta;
    squashY.current = THREE.MathUtils.clamp(squashY.current, 0.4, 1.8);

    if (hitFlashTimer.current > 0) {
      hitFlashTimer.current -= delta;
    }

    if (ref.current) {
      const swayAngle = state.clock.elapsedTime * 1.5 + timeOffset;
      const swayX = Math.sin(swayAngle) * 0.018;
      const swayZ = Math.cos(swayAngle * 0.8) * 0.018;

      ref.current.position.copy(data.pos);
      ref.current.rotation.x = wobbleX.current + swayX;
      ref.current.rotation.y = data.rotation;
      ref.current.rotation.z = wobbleZ.current + swayZ;

      ref.current.scale.set(
        data.scale / Math.sqrt(squashY.current),
        data.scale * squashY.current,
        data.scale / Math.sqrt(squashY.current)
      );
    }
  });

  const renderGeometry = (part: PlantPart) => {
    if (part.type === "box") {
      return <boxGeometry args={[part.size.x, part.size.y, part.size.z]} />;
    } else if (part.type === "cylinder") {
      return <cylinderGeometry args={[part.size.x * 0.5, part.size.x * 0.5, part.size.y, part.segments ?? 8]} />;
    } else if (part.type === "cone") {
      return <coneGeometry args={[part.size.x * 0.5, part.size.y, part.segments ?? 8]} />;
    } else if (part.type === "sphere") {
      return <sphereGeometry args={[part.size.x * 0.5, part.segments ?? 12, part.segments ?? 10]} />;
    }
    return null;
  };

  const renderPartMesh = (part: PlantPart) => {
    const status = partStatuses[part.id];
    if (status?.isDestroyed) return null;

    const rotationVal = part.rotation ?? new THREE.Euler();
    const flash = hitFlashTimer.current > 0;

    return (
      <mesh
        key={part.id}
        position={part.localOffset}
        rotation={rotationVal}
        castShadow
        receiveShadow
      >
        {renderGeometry(part)}
        <meshStandardMaterial 
          color={flash ? "#ffffff" : part.color} 
          emissive={flash ? "#ffffff" : "#000000"} 
          emissiveIntensity={flash ? 0.8 : 0} 
          flatShading 
          roughness={0.8} 
        />
      </mesh>
    );
  };

  return (
    <group ref={ref}>
      {data.parts.map((part) => renderPartMesh(part))}
    </group>
  );
});
