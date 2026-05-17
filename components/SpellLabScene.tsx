"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbitControls } from "@react-three/drei";
import { 
  DummyType, Fireball, LightningStrike, DisintegrateRay, 
  PrismaticWall, ImpactFlash, DebrisParticles, BloodParticles, DamageText, DummyEntity 
} from "./spell-lab/Spells";

/* ==================== Terrain ==================== */
function Terrain({ craters }: { craters: { x: number; z: number; r: number; d: number }[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(400, 20, 400, 200, 1, 200);
    g.translate(0, -10, 0);
    const pos = g.attributes.position;
    const isTop = new Float32Array(pos.count);
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > -0.1) {
        isTop[i] = 1;
        const x = pos.getX(i), z = pos.getZ(i);
        const h = Math.sin(x * 0.5) * 0.15 + Math.cos(z * 0.7) * 0.1;
        pos.setY(i, h);
        colors[i * 3] = 0.22; colors[i * 3 + 1] = 0.49; colors[i * 3 + 2] = 0.22; // #3a7d3a
      } else {
        colors[i * 3] = 0.33; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.33; // #555555
      }
    }
    g.setAttribute("isTop", new THREE.BufferAttribute(isTop, 1));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const prevCratersLength = useRef(0);

  useEffect(() => {
    if (!meshRef.current) return;
    const g = meshRef.current.geometry as THREE.BoxGeometry;
    const pos = g.attributes.position;
    const isTop = g.attributes.isTop as THREE.BufferAttribute;
    const colors = g.attributes.color as THREE.BufferAttribute;
    
    let needsUpdate = false;

    if (craters.length === 0) {
      for (let i = 0; i < pos.count; i++) {
        if (isTop.getX(i) > 0.5) {
          const x = pos.getX(i), z = pos.getZ(i);
          const h = Math.sin(x * 0.5) * 0.15 + Math.cos(z * 0.7) * 0.1;
          pos.setY(i, h);
          colors.setXYZ(i, 0.22, 0.49, 0.22);
        }
      }
      needsUpdate = true;
    } else if (craters.length > prevCratersLength.current) {
      for (let idx = prevCratersLength.current; idx < craters.length; idx++) {
        const c = craters[idx];
        for (let i = 0; i < pos.count; i++) {
          if (isTop.getX(i) > 0.5) {
            const x = pos.getX(i), z = pos.getZ(i);
            const dx = x - c.x, dz = z - c.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < c.r * c.r) {
              const dist = Math.sqrt(distSq);
              const h = pos.getY(i) - c.d * (1 - dist / c.r) * (1 - dist / c.r);
              pos.setY(i, h);
              if (h > -0.5) {
                colors.setXYZ(i, 0.22, 0.49, 0.22);
              } else if (h > -2.0) {
                colors.setXYZ(i, 0.36, 0.25, 0.20);
              } else {
                colors.setXYZ(i, 0.33, 0.33, 0.33);
              }
              needsUpdate = true;
            }
          }
        }
      }
    }
    prevCratersLength.current = craters.length;
    
    if (needsUpdate) {
      pos.needsUpdate = true;
      colors.needsUpdate = true;
      g.computeVertexNormals();
    }
  }, [craters]);

  return (
    <mesh ref={meshRef} geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

/* ==================== Grass Blades ==================== */
interface GrassBladeData {
  pos: THREE.Vector3;
  scale: number;
  phase: number;
  destroyed: boolean;
  hidden: boolean;
}

function GrassBlades({ craters }: { craters: { x: number; z: number; r: number; d: number }[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20000;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const grassDataRef = useRef<GrassBladeData[]>([]);
  if (grassDataRef.current.length === 0) {
    const half = 400 / 2;
    for (let i = 0; i < count; i++) {
      grassDataRef.current.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * half * 2 * 0.9,
          0,
          (Math.random() - 0.5) * half * 2 * 0.9
        ),
        scale: 0.15 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        destroyed: false,
        hidden: false
      });
    }
  }
  const grassData = grassDataRef.current;

  useEffect(() => {
    if (craters.length === 0) {
       for (const d of grassData) { d.destroyed = false; d.hidden = false; }
       return;
    }
    const c = craters[craters.length - 1]; // 只检测最新生成的陨石坑，不重复遍历旧坑，巨大性能提升
    for (const d of grassData) {
      if (d.destroyed) continue;
      const dx = d.pos.x - c.x, dz = d.pos.z - c.z;
      if (dx * dx + dz * dz < c.r * c.r * 0.64) {
        d.destroyed = true;
      }
    }
  }, [craters, grassData]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const d = grassData[i];
      if (d.destroyed) {
        if (!d.hidden) {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          d.hidden = true;
        }
      } else {
        dummy.position.copy(d.pos);
        dummy.rotation.set(0, Math.sin(t + d.phase) * 0.1, Math.sin(t * 2 + d.phase * 0.5) * 0.15);
        dummy.scale.set(0.05, d.scale, 0.05);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={true}>
      <coneGeometry args={[1, 4, 3]} />
      <meshStandardMaterial color="#2d8a2d" flatShading />
    </instancedMesh>
  );
}

/* ==================== Camera Shake ==================== */
function KeyboardControls({ controlsRef }: { controlsRef: React.RefObject<{ target: THREE.Vector3 } | null> }) {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 25 * delta;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; right.normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();

    const move = new THREE.Vector3();
    if (keys.current["w"]) move.addScaledVector(forward, speed);
    if (keys.current["s"]) move.addScaledVector(forward, -speed);
    if (keys.current["a"]) move.addScaledVector(right, -speed);
    if (keys.current["d"]) move.addScaledVector(right, speed);
    
    if (move.lengthSq() > 0 && controlsRef.current) {
      camera.position.add(move);
      controlsRef.current.target.add(move);
    }
  });
  return null;
}

function SceneShake({ intensity, children }: { intensity: React.MutableRefObject<number>, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const s = intensity.current;
    if (s > 0.01) {
      groupRef.current.position.set(
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2
      );
      intensity.current *= 0.92;
    } else {
      groupRef.current.position.set(0, 0, 0);
      intensity.current = 0;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}





/* ==================== Scene Content ==================== */
function SceneContent({
  spell,
  shakeIntensity,
}: {
  spell: string;
  shakeIntensity: React.MutableRefObject<number>;
}) {
  const [craters, setCraters] = useState<{ x: number; z: number; r: number; d: number }[]>([]);
  const [debris, setDebris] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [fireballs, setFireballs] = useState<{ pos: THREE.Vector3; id: number }[]>([]);
  const [lightnings, setLightnings] = useState<{ pos: THREE.Vector3; id: number; count: number }[]>([]);
  const [flashes, setFlashes] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [rays, setRays] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  
  const [dummies, setDummies] = useState<DummyType[]>([]);
  const [damageTexts, setDamageTexts] = useState<{ id: number; pos: THREE.Vector3; text: string; color: string }[]>([]);
  const [bloods, setBloods] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
  const [walls, setWalls] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

  const { camera, controls } = useThree();

  const spawnDummies = useCallback(() => {
    const newDummies: DummyType[] = [];
    for(let i = 0; i < 200; i++) {
      const half = 400 / 2 * 0.9;
      const x = (Math.random() - 0.5) * half * 2;
      const z = (Math.random() - 0.5) * half * 2;
      newDummies.push({
        id: i,
        pos: new THREE.Vector3(x, 0, z),
        hp: 200,
        maxHp: 200,
        target: new THREE.Vector3(x, 0, z),
        color: `hsl(${Math.random() * 360}, 80%, 60%)`
      });
    }
    setDummies(newDummies);
  }, []);

  const applyDamage = useCallback((hitTest: (d: DummyType) => boolean, minDmg: number, maxDmg: number, color: string) => {
    setDummies(prev => {
      let updated = false;
      const next = prev.map(d => {
        if (d.hp <= 0 || !hitTest(d)) return d;
        updated = true;
        const dmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg));
        setTimeout(() => {
          setDamageTexts(texts => [...texts, { id: Math.random(), pos: d.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), text: `-${dmg}`, color }]);
          setBloods(b => [...b, { id: Math.random(), pos: d.pos.clone().add(new THREE.Vector3(0, 1, 0)) }]);
        }, 0);
        return { ...d, hp: d.hp - dmg };
      });
      return updated ? next : prev;
    });
  }, []);

  const recordSpellCast = useCallback(() => {
    if (typeof window === "undefined") return;
    const key = "spell_lab_alert_shown";
    if (localStorage.getItem(key)) return;

    const countKey = "spell_lab_cast_count";
    const count = parseInt(localStorage.getItem(countKey) || "0", 10) + 1;
    localStorage.setItem(countKey, count.toString());

    if (count === 5) {
      localStorage.setItem(key, "true");
      setTimeout(() => {
        const go = window.confirm("你已释放了5个法术！是否前往多态主页 https://center.mcmod.cn/1408244/的置顶看看？那里有AES128密文，密钥为pppopipupu ascii转hex code，不足的位数补零，快去解密吧！！！");
        if (go) {
          window.open("https://center.mcmod.cn/1408244/", "_blank");
        }
      }, 300);
    }
  }, []);

  const castInstantSpell = useCallback((point: THREE.Vector3) => {
    recordSpellCast();
    const id = Date.now() + Math.random();
    if (spell === "fireball") {
        setFireballs((prev) => [...prev, { pos: point.clone(), id }]);
        setTimeout(() => {
          shakeIntensity.current = 2.5;
          setCraters((prev) => [...prev, { x: point.x, z: point.z, r: 2.5, d: 1.0 }]);
          setFlashes((prev) => [...prev, { pos: point.clone(), color: "#ff6600", id }]);
          setDebris((prev) => [...prev, { pos: point.clone(), color: "#4a2d1a", id }]);
          applyDamage((d) => d.pos.distanceTo(point) < 3.0, 8, 48, "#ff6600");
        }, 600);
      } else if (spell === "lightning") {
        const boltCount = 3 + Math.floor(Math.random() * 4);
        setLightnings((prev) => [...prev, { pos: point.clone(), id, count: boltCount }]);
        setTimeout(() => {
          shakeIntensity.current = 1.8;
          setCraters((prev) => [...prev, { x: point.x, z: point.z, r: 1.8, d: 0.6 }]);
          setFlashes((prev) => [...prev, { pos: point.clone(), color: "#4488ff", id }]);
          setDebris((prev) => [...prev, { pos: point.clone(), color: "#2d2d3a", id }]);
          applyDamage((d) => d.pos.distanceTo(point) < 2.5, 3, 30, "#4488ff");
        }, 300);
      } else if (spell === "disintegrate") {
        const start = camera.position.clone();
        start.y -= 1;
        setRays((prev) => [...prev, { start, end: point.clone(), id }]);
        setTimeout(() => {
          shakeIntensity.current = 3.0;
          const p1 = new THREE.Vector2(start.x, start.z);
          const p2 = new THREE.Vector2(point.x, point.z);
          const dist = p1.distanceTo(p2);
          const steps = Math.ceil(dist / 1.5);
          const newCraters: { x: number; z: number; r: number; d: number }[] = [];
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            newCraters.push({
              x: THREE.MathUtils.lerp(p1.x, p2.x, t),
              z: THREE.MathUtils.lerp(p1.y, p2.y, t),
              r: 3.5,
              d: 2.5
            });
          }
          setCraters((prev) => [...prev, ...newCraters]);
          setFlashes((prev) => [...prev, { pos: point.clone(), color: "#00ff00", id }]);
          
          const mid = start.clone().lerp(point, 0.5);
          setDebris((prev) => [
            ...prev, 
            { pos: point.clone(), color: "#1a4a1a", id },
            { pos: mid, color: "#1a4a1a", id: id + 1 }
          ]);
          
          const line = new THREE.Line3(start, point);
          applyDamage((d) => {
            const closest = new THREE.Vector3();
            line.closestPointToPoint(d.pos, true, closest);
            return d.pos.distanceTo(closest) < 3.5;
          }, 50, 100, "#00ff00");
        }, 50);
      }
    },
    [spell, shakeIntensity, camera, applyDamage, recordSpellCast]
  );

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    if (spell === "prismatic-wall") {
      setDragStart(e.point.clone());
      setDragCurrent(e.point.clone());
      if (controls) (controls as any).enabled = false;
    } else {
      castInstantSpell(e.point);
    }
  }, [spell, controls, castInstantSpell]);

  const handlePointerMove = useCallback((e: any) => {
    if (dragStart && spell === "prismatic-wall") {
      setDragCurrent(e.point.clone());
    }
  }, [dragStart, spell]);

  const handlePointerUp = useCallback((e: any) => {
    if (spell === "prismatic-wall" && dragStart) {
      e.stopPropagation();
      setWalls((prev) => [...prev, { start: dragStart, end: e.point.clone(), id: Date.now() + Math.random() }]);
      setDragStart(null);
      setDragCurrent(null);
      if (controls) (controls as any).enabled = true;
      recordSpellCast();
    }
  }, [spell, dragStart, controls, recordSpellCast]);

  const resetScene = useCallback(() => {
    setCraters([]);
    setDebris([]);
    setFireballs([]);
    setLightnings([]);
    setFlashes([]);
    setRays([]);
    setWalls([]);
    setDamageTexts([]);
    setBloods([]);
    spawnDummies();
  }, [spawnDummies]);

  useEffect(() => {
    (window as any).__spellLabReset = resetScene;
    spawnDummies();
    return () => { delete (window as any).__spellLabReset; };
  }, [resetScene, spawnDummies]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 15, 5]} intensity={1.2} color="#ffeedd" castShadow />
      <directionalLight position={[-5, 10, -8]} intensity={0.5} color="#aaccff" />
      <fog attach="fog" args={["#1a0a2e", 60, 150]} />

      <SceneShake intensity={shakeIntensity}>
        <Terrain craters={craters} />
        <GrassBlades craters={craters} />

        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        >
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {dragStart && dragCurrent && spell === "prismatic-wall" && (
          <mesh 
            position={dragStart.clone().lerp(dragCurrent, 0.5)}
            onUpdate={(self) => self.lookAt(dragCurrent.x, dragStart.clone().lerp(dragCurrent, 0.5).y, dragCurrent.z)}
          >
            <boxGeometry args={[2.5, 0.8, dragStart.distanceTo(dragCurrent)]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}

        {dummies.map((d) => (
          <DummyEntity key={`dummy-${d.id}`} data={d} />
        ))}

        {damageTexts.map((dt) => (
          <DamageText key={dt.id} pos={dt.pos} text={dt.text} color={dt.color} onDone={() => setDamageTexts(p => p.filter(x => x.id !== dt.id))} />
        ))}

        {bloods.map((b) => (
          <BloodParticles key={b.id} pos={b.pos} onDone={() => setBloods(p => p.filter(x => x.id !== b.id))} />
        ))}

        {fireballs.map((f) => (
          <Fireball key={f.id} pos={f.pos} onDone={() => setFireballs((p) => p.filter((x) => x.id !== f.id))} />
        ))}

        {lightnings.map((l) => (
          <LightningStrike
            key={l.id}
            pos={l.pos}
            boltCount={l.count}
            onDone={() => setLightnings((p) => p.filter((x) => x.id !== l.id))}
          />
        ))}

        {flashes.map((f) => (
          <ImpactFlash key={f.id} pos={f.pos} color={f.color} onDone={() => setFlashes(p => p.filter(x => x.id !== f.id))} />
        ))}

        {rays.map((r) => (
          <DisintegrateRay key={r.id} start={r.start} end={r.end} onDone={() => setRays(p => p.filter(x => x.id !== r.id))} />
        ))}

        {walls.map((w) => (
          <PrismaticWall key={w.id} start={w.start} end={w.end} applyDamage={applyDamage} onDone={() => setWalls(p => p.filter(x => x.id !== w.id))} />
        ))}

        {debris.map((d) => (
          <DebrisParticles key={d.id} pos={d.pos} color={d.color} onDone={() => setDebris(p => p.filter(x => x.id !== d.id))} />
        ))}
      </SceneShake>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1.0} mipmapBlur intensity={2.5} radius={0.5} />
      </EffectComposer>
    </>
  );
}

/* ==================== Main Exported Component ==================== */
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall";

export default function SpellLabScene({
  spell,
}: {
  spell: SpellType;
  onReset?: () => void;
}) {
  const shakeIntensity = useRef(0);
  const controlsRef = useRef<{ target: THREE.Vector3 } | null>(null);

  return (
    <Canvas
      camera={{ position: [0, 60, 80], fov: 50, far: 3000 }}
      shadows
      style={{ width: "100%", height: "100%", cursor: "crosshair" }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
    >
      <React.Suspense fallback={null}>
        <SceneContent spell={spell} shakeIntensity={shakeIntensity} />
        <KeyboardControls controlsRef={controlsRef} />
      </React.Suspense>
      <OrbitControls 
        ref={controlsRef}
        makeDefault
        mouseButtons={{
          LEFT: THREE.MOUSE.NONE,
          MIDDLE: THREE.MOUSE.ROTATE,
          RIGHT: THREE.MOUSE.PAN
        }}
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
