"use client";
import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  Fireball, LightningStrike, DisintegrateRay, PrismaticWall, ImpactFlash, DebrisParticles,
  BloodParticles, DamageText, DummyEntity, ZombieEntity, InfiniteTerrain, FluidSimulation,
  StructureEntity, PlantEntity, Sunburst, DestructiveWave, StormOfVengeance, GravitySinkhole,
  PulseWave, RavenousVoid,
} from "./spell-lab/Spells";
import type { DummyType, ZombieType, StructureData, PlantData } from "./spell-lab/types";
import { getTerrainHeight, setWaterEnabled } from "./spell-lab/spells/InfiniteTerrain";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import SpellLabCanvas from "./spell-lab/webgpu/SpellLabCanvas";
import PostProcessing from "./spell-lab/webgpu/RenderPipeline";
import { Skybox as WebGPUSkybox } from "./spell-lab/webgpu/Skybox";
import { GrassBlades as WebGPUGrassBlades } from "./spell-lab/webgpu/GrassBlades";
import { FarTerrain, getFogParams } from "./spell-lab/spells/FarTerrain";
import { KeyboardControls } from "./spell-lab/scene/KeyboardControls";
import { SceneShake, useCelestialCycle } from "./spell-lab/scene/SceneShake";
import { spawnDummies as buildDummies, spawnStructures as buildStructures, spawnPlants as buildPlants, clearChunkStorage, useWorldTick } from "./spell-lab/scene/spawnHelpers";
import { createApplyDamage, createHandleZombieAttack, type DamageTextItem, type BloodItem } from "./spell-lab/scene/damageHelpers";
import { recordSpellCast as recordCastHelper, createCastInstantSpell, createCrowdHandlers } from "./spell-lab/scene/castingHelpers";
import { OrbitRig } from "./spell-lab/scene/OrbitRig";
import { FirstPersonClick } from "./spell-lab/scene/FirstPersonClick";
function SceneContent({
  spell, shakeIntensity, viewDistance = 3, fogEnabled = true, waterEnabled = false,
  onCastSpellAction, firstPerson = false, playerHp = 100, onPlayerHpChange,
}: {
  spell: string; shakeIntensity: React.RefObject<number>; viewDistance?: number; fogEnabled?: boolean;
  waterEnabled?: boolean; onCastSpellAction?: () => void; firstPerson?: boolean; playerHp?: number;
  onPlayerHpChange?: (hp: number) => void;
}) {
  const [craters, setCraters] = useState<{ x: number; z: number; r: number; d: number }[]>([]);
  const [cratersVersion, setCratersVersion] = useState(0);
  const [debris, setDebris] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [fireballs, setFireballs] = useState<{ pos: THREE.Vector3; id: number }[]>([]);
  const [lightnings, setLightnings] = useState<{ pos: THREE.Vector3; id: number; count: number }[]>([]);
  const [flashes, setFlashes] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [rays, setRays] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  const [sunbursts, setSunbursts] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
  const [waves, setWaves] = useState<{ id: number; pos: THREE.Vector3; variant: "radiant" | "necrotic" }[]>([]);
  const [gravitySinks, setGravitySinks] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
  const [pulseWaves, setPulseWaves] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
  const [voids, setVoids] = useState<{ id: number; center: THREE.Vector3 }[]>([]);
  const [storms, setStorms] = useState<{ id: number; center: THREE.Vector3 }[]>([]);
  const [dummies, setDummies] = useState<DummyType[]>([]);
  const [zombies, setZombies] = useState<ZombieType[]>([]);
  const [damageTexts, setDamageTexts] = useState<DamageTextItem[]>([]);
  const [bloods, setBloods] = useState<BloodItem[]>([]);
  const [walls, setWalls] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);
  const downRef = useRef<{ x: number; y: number; t: number; used: boolean; point: THREE.Vector3 | null }>({ x: 0, y: 0, t: 0, used: false, point: null });
  const { camera, controls } = useThree();
  const { viewCenter, sunPos, ambientLightRef, sunLightRef, moonLightRef, fogRef, sunMeshRef, moonMeshRef, sunTexture, moonTexture } = useCelestialCycle(firstPerson);
  const playerDummy: DummyType = useMemo(() => ({ id: 99999, pos: new THREE.Vector3(), target: new THREE.Vector3(), hp: playerHp, maxHp: 100, color: "#00ffff" }), [playerHp]);
  const zombieTargets = useMemo(() => (firstPerson && playerHp > 0 ? [playerDummy, ...dummies] : dummies), [firstPerson, playerHp, playerDummy, dummies]);
  useWorldTick({ craters, structures, plants, viewDistance, setDummies, setZombies, setStructures, setPlants });
  useEffect(() => {
    let targetX = 0;
    let targetZ = 0;
    if (controls && typeof controls === "object" && "target" in controls) {
      const raw: unknown = controls.target;
      if (raw instanceof THREE.Vector3) { targetX = raw.x; targetZ = raw.z; }
    }
    if (firstPerson) {
      const h = getTerrainHeight(targetX, targetZ).height;
      camera.position.set(targetX, h + 1.8, targetZ);
      camera.lookAt(targetX, h + 1.8, targetZ - 10);
    } else {
      camera.position.set(camera.position.x, 60, camera.position.z + 50);
      if (controls && typeof controls === "object" && "target" in controls && "update" in controls) {
        // makeDefault OrbitControls exposes target/update at runtime.
        const c = controls as unknown as { target: THREE.Vector3; update: () => void };
        c.target.set(camera.position.x, 0, camera.position.z - 50);
        c.update();
      }
    }
  }, [firstPerson, camera, controls]);
  useEffect(() => { setWaterEnabled(!!waterEnabled); }, [waterEnabled]);
  const spawnDebris = useCallback((pos: THREE.Vector3, color: string) => {
    setDebris((p) => [...p, { pos: pos.clone(), color, id: Date.now() + Math.random() }]);
  }, []);
  const applyDamage = useMemo(() => createApplyDamage({ setDummies, setZombies, setDamageTexts, setBloods }), []);
  const recordCast = useCallback(() => recordCastHelper(onCastSpellAction), [onCastSpellAction]);
  const castDeps = useMemo(
    () => ({ shakeIntensity, applyDamage, recordCast, setFireballs, setLightnings, setRays, setSunbursts, setWaves, setStorms, setGravitySinks, setPulseWaves, setVoids, setCraters, setCratersVersion, setFlashes, setDebris, setDummies, setZombies, setDamageTexts }),
    [shakeIntensity, applyDamage, recordCast],
  );
  const caster = useMemo(() => createCastInstantSpell(castDeps, () => ({ camera, dummies })), [castDeps, camera, dummies]);
  const castInstantSpell = useCallback((pt: THREE.Vector3) => caster(spell, pt), [caster, spell]);
  const crowd = useMemo(
    () => createCrowdHandlers({ shakeIntensity, applyDamage, setCraters, setCratersVersion, setDummies, setDamageTexts, setFlashes, setDebris }),
    [shakeIntensity, applyDamage],
  );
  const handleZombieAttack = useCallback(
    createHandleZombieAttack({ camera, playerHp, onPlayerHpChange, setDummies, setDamageTexts, setBloods }),
    [camera, playerHp, onPlayerHpChange],
  );
  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      if (spell === "prismatic-wall") {
        const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
        const adjusted = new THREE.Vector3(e.point.x, terrainY, e.point.z);
        setDragStart(adjusted.clone());
        setDragCurrent(adjusted.clone());
        downRef.current = { x: e.clientX, y: e.clientY, t: performance.now(), used: true, point: null };
        // OrbitControls exposes enabled at runtime.
        const ctrl = controls as unknown as { enabled: boolean } | null;
        if (ctrl) ctrl.enabled = false;
        return;
      }
      downRef.current = { x: e.clientX, y: e.clientY, t: performance.now(), used: false, point: e.point.clone() };
    },
    [spell, controls],
  );
  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const dx = e.clientX - downRef.current.x;
      const dy = e.clientY - downRef.current.y;
      if (dx * dx + dy * dy > 36) downRef.current.used = true;
      if (dragStart && spell === "prismatic-wall") {
        const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
        setDragCurrent(new THREE.Vector3(e.point.x, terrainY, e.point.z));
      }
    },
    [dragStart, spell],
  );
  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      if (spell === "prismatic-wall" && dragStart) {
        e.stopPropagation();
        const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
        const adjusted = new THREE.Vector3(e.point.x, terrainY, e.point.z);
        setWalls((p) => [...p, { start: dragStart, end: adjusted.clone(), id: Date.now() + Math.random() }]);
        setDragStart(null);
        setDragCurrent(null);
        downRef.current.point = null;
        // OrbitControls exposes enabled at runtime.
        const ctrl = controls as unknown as { enabled: boolean } | null;
        if (ctrl) ctrl.enabled = true;
        recordCast();
        return;
      }
      const d = downRef.current;
      if (d.point && !d.used && performance.now() - d.t < 350) castInstantSpell(d.point);
      d.point = null;
    },
    [spell, dragStart, controls, recordCast, castInstantSpell],
  );
  const spawnAll = useCallback(() => {
    setDummies(buildDummies(camera.position, viewDistance));
    setStructures(buildStructures(camera.position, viewDistance));
    setPlants(buildPlants(camera.position, viewDistance));
  }, [camera, viewDistance]);
  const resetScene = useCallback(() => {
    clearChunkStorage();
    camera.position.set(0, 60, 80);
    if (controls && typeof controls === "object" && "target" in controls && "update" in controls) {
      // makeDefault OrbitControls exposes target/update at runtime.
      const c = controls as unknown as { target: THREE.Vector3; update: () => void };
      c.target.set(0, 0, 0);
      c.update();
    }
    setCraters([]); setCratersVersion((v) => v + 1); setDebris([]); setFireballs([]); setLightnings([]);
    setFlashes([]); setRays([]); setWalls([]); setDamageTexts([]); setBloods([]); setZombies([]);
    setSunbursts([]); setWaves([]); setStorms([]); setGravitySinks([]); setPulseWaves([]); setVoids([]);
    setDummies(buildDummies(camera.position, viewDistance));
    setStructures(buildStructures(camera.position, viewDistance));
    setPlants(buildPlants(camera.position, viewDistance));
  }, [camera, controls, viewDistance]);
  useEffect(() => {
    Reflect.set(window, "__spellLabReset", resetScene);
    const handle = requestAnimationFrame(() => spawnAll());
    return () => { Reflect.deleteProperty(window, "__spellLabReset"); cancelAnimationFrame(handle); };
  }, [resetScene, spawnAll]);
  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.3} />
      <directionalLight ref={sunLightRef} position={[10, 15, 5]} intensity={1.2} color="#ffeedd" castShadow />
      <directionalLight ref={moonLightRef} position={[-5, 10, -8]} intensity={0.5} color="#aaccff" />
      <WebGPUSkybox sunPos={sunPos} />
      {fogEnabled && (() => { const f = getFogParams(viewDistance); return <fog attach="fog" args={["#87ceeb", f.near, f.far]} />; })()}
      <FarTerrain cameraPos={viewCenter} viewDistance={viewDistance} />
      <FirstPersonClick firstPerson={firstPerson} playerHp={playerHp} playerDummy={playerDummy} onCast={castInstantSpell} />
      <SceneShake intensityRef={shakeIntensity}>
        <InfiniteTerrain cameraPos={viewCenter} cratersVersion={cratersVersion} viewDistance={viewDistance} />
        {waterEnabled && <FluidSimulation craters={craters} cameraPos={viewCenter} viewDistance={viewDistance} />}
        <WebGPUGrassBlades craters={craters} cameraPos={viewCenter} viewDistance={viewDistance} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerOut={handlePointerUp}>
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        {dragStart && dragCurrent && spell === "prismatic-wall" && (
          <mesh position={dragStart.clone().lerp(dragCurrent, 0.5)} onUpdate={(self) => self.lookAt(dragCurrent.x, dragStart.clone().lerp(dragCurrent, 0.5).y, dragCurrent.z)}>
            <boxGeometry args={[2.5, 0.8, dragStart.distanceTo(dragCurrent)]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}
        {sunTexture && (
          <mesh ref={sunMeshRef}>
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial map={sunTexture} transparent color={new THREE.Color(2.0, 1.6, 0.4)} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        {moonTexture && (
          <mesh ref={moonMeshRef}>
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial map={moonTexture} transparent color={new THREE.Color(0.8, 0.9, 1.0)} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        {firstPerson && playerHp > 0 && <DummyEntity key="dummy-player" data={playerDummy} craters={craters} />}
        {dummies.map((d) => <DummyEntity key={`dummy-${d.id}`} data={d} craters={craters} />)}
        {zombies.map((z) => <ZombieEntity key={`zombie-${z.id}`} data={z} dummies={zombieTargets} onAttack={handleZombieAttack} craters={craters} />)}
        {structures.map((s) => <StructureEntity key={`structure-${s.id}`} data={s} craters={craters} spawnDebris={spawnDebris} />)}
        {plants.map((p) => <PlantEntity key={`plant-${p.id}`} data={p} craters={craters} spawnDebris={spawnDebris} />)}
        {damageTexts.map((dt) => <DamageText key={dt.id} pos={dt.pos} text={dt.text} color={dt.color} onDone={() => setDamageTexts((p) => p.filter((x) => x.id !== dt.id))} />)}
        {bloods.map((b) => <BloodParticles key={b.id} pos={b.pos} onDone={() => setBloods((p) => p.filter((x) => x.id !== b.id))} />)}
        {fireballs.map((f) => <Fireball key={f.id} pos={f.pos} onDone={() => setFireballs((p) => p.filter((x) => x.id !== f.id))} />)}
        {lightnings.map((l) => <LightningStrike key={l.id} pos={l.pos} boltCount={l.count} onDone={() => setLightnings((p) => p.filter((x) => x.id !== l.id))} />)}
        {flashes.map((f) => <ImpactFlash key={f.id} pos={f.pos} color={f.color} onDone={() => setFlashes((p) => p.filter((x) => x.id !== f.id))} />)}
        {rays.map((r) => <DisintegrateRay key={r.id} start={r.start} end={r.end} onDone={() => setRays((p) => p.filter((x) => x.id !== r.id))} />)}
        {walls.map((w) => <PrismaticWall key={w.id} start={w.start} end={w.end} applyDamage={applyDamage} onDone={() => setWalls((p) => p.filter((x) => x.id !== w.id))} />)}
        {debris.map((d) => <DebrisParticles key={d.id} pos={d.pos} color={d.color} onDone={() => setDebris((p) => p.filter((x) => x.id !== d.id))} />)}
        {sunbursts.map((s) => <Sunburst key={s.id} center={s.pos} onImpact={() => crowd.sunburst(s.pos)} onDone={() => setSunbursts((p) => p.filter((x) => x.id !== s.id))} />)}
        {waves.map((w) => <DestructiveWave key={w.id} center={w.pos} variant={w.variant} onImpact={() => crowd.wave(w.pos, w.variant)} onDone={() => setWaves((p) => p.filter((x) => x.id !== w.id))} />)}
        {storms.map((st) => <StormOfVengeance key={st.id} center={st.center} onStage={(stage, points) => crowd.storm(st.center, stage, points)} onDone={() => setStorms((p) => p.filter((x) => x.id !== st.id))} />)}
        {gravitySinks.map((g) => <GravitySinkhole key={g.id} center={g.pos} onImpact={() => crowd.gravity(g.pos)} onDone={() => setGravitySinks((p) => p.filter((x) => x.id !== g.id))} />)}
        {pulseWaves.map((pw) => <PulseWave key={pw.id} center={pw.pos} onImpact={(impact) => crowd.pulse(pw.pos, impact)} onDone={() => setPulseWaves((p) => p.filter((x) => x.id !== pw.id))} />)}
        {voids.map((v) => <RavenousVoid key={v.id} center={v.center} onStage={(tick, c) => crowd.voidStage(tick, c)} onDone={() => setVoids((p) => p.filter((x) => x.id !== v.id))} />)}
      </SceneShake>
      <PostProcessing />
    </>
  );
}
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall" | "animate-dead" | "sunburst" | "destructive-wave" | "storm-of-vengeance" | "gravity-sinkhole" | "pulse-wave" | "ravenous-void";
export default function SpellLabScene({
  spell, viewDistance = 3, fogEnabled = true, waterEnabled = false, onCastSpellAction, firstPerson = false, playerHp = 100, onPlayerHpChange,
}: {
  spell: SpellType; onResetAction?: () => void; viewDistance?: number; fogEnabled?: boolean; waterEnabled?: boolean;
  onCastSpellAction?: () => void; firstPerson?: boolean; playerHp?: number; onPlayerHpChange?: (hp: number) => void;
}) {
  const shakeIntensity = useRef(0);
  const controlsRef = useRef<OrbitControlsType | null>(null);
  return (
    <SpellLabCanvas camera={{ position: [0, 60, 80], fov: 50, far: 3000 }} shadows style={{ width: "100%", height: "100%", cursor: "crosshair" }}>
      <React.Suspense fallback={null}>
        <SceneContent spell={spell} shakeIntensity={shakeIntensity} viewDistance={viewDistance} fogEnabled={fogEnabled} waterEnabled={waterEnabled} onCastSpellAction={onCastSpellAction} firstPerson={firstPerson} playerHp={playerHp} onPlayerHpChange={onPlayerHpChange} />
        <KeyboardControls controlsRef={controlsRef} firstPerson={firstPerson} />
      </React.Suspense>
      <OrbitRig controlsRef={controlsRef} firstPerson={firstPerson} viewDistance={viewDistance} />
    </SpellLabCanvas>
  );
}
