import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./InfiniteTerrain";

export interface PulseWaveImpact {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  halfAngleCos: number;
}

export interface PulseWaveProps {
  center: THREE.Vector3;
  onImpact?: (impact: PulseWaveImpact) => void;
  onDone: () => void;
}

// 3rd-level Pulse Wave: a 30 ft cone shockwave aimed toward the camera.
// Timeline (Scene wiring unchanged):
//   0-0.25s   pre-charge: orb at origin expands, cone preview at low opacity
//   0.25s     onImpact (Scene: 6d6 force + 15 ft push inside cone)
//   0.25-0.9s main shock: cone 0->1 (9u), ring -Z 0.3->2.6, 64 shards, light 160
//   0.9-1.5s  aftershock: halo ring expands + fades; ground dust 120 settles
//   1.5s      onDone
const IMPACT_AT = 0.25;
const TOTAL_LIFE = 1.5;
const CONE_LENGTH = 9; // 30 ft
const CONE_HALF_ANGLE = Math.PI / 12; // 15 deg
const AFT_PATH_END = 1.5;
const DUST_COUNT = 300;
const SHARD_COUNT = 64;
// FX boost (stacked layers, Scene wiring unchanged):
//   24 instanced darts (0.25-0.9s, cone axis +-15 deg, 9u travel)
//   dual shock halo: ring 0.3-1.3s + sphere wave 0.5-1.5s (0.5 -> 6)
//   spray 120 -> 300 with gravity droop; cone double sine opacity pulse
//   point light double flash 160 -> 80 -> 40 over the shock window

// Dust colour ramp: pale cyan -> mid azure -> white.
function pickDustColour(
  rand: number,
  out: Float32Array,
  i: number
): void {
  if (rand < 0.5) {
    out[i * 4] = 0.5;
    out[i * 4 + 1] = 0.86;
    out[i * 4 + 2] = 1.0;
  } else if (rand < 0.85) {
    out[i * 4] = 0.75;
    out[i * 4 + 1] = 0.94;
    out[i * 4 + 2] = 1.0;
  } else {
    out[i * 4] = 0.95;
    out[i * 4 + 1] = 0.99;
    out[i * 4 + 2] = 1.0;
  }
  out[i * 4 + 3] = 1.0;
}

// Spawn a ground dust particle: hugging the deck inside the cone frustum.
function spawnDust(
  p: Float32Array,
  v: Float32Array,
  i: number,
  seed: number
): void {
  void seed;
  const azimuth = Math.random() * Math.PI * 2;
  const dist = Math.random() * CONE_LENGTH;
  const spread = Math.tan(CONE_HALF_ANGLE) * dist * (0.4 + Math.random() * 0.8);
  p[i * 3] = Math.cos(azimuth) * spread;
  p[i * 3 + 1] = 0.05 + Math.random() * 0.35;
  p[i * 3 + 2] = -dist;
  const speed = 4 + Math.random() * 6;
  v[i * 3] = Math.cos(azimuth) * speed * 0.25;
  v[i * 3 + 1] = 0.4 + Math.random() * 0.8;
  v[i * 3 + 2] = -speed;
}

export function PulseWave({ center, onImpact, onDone }: PulseWaveProps) {
  const groupRef = useRef<THREE.Group>(null);
  const chargeOrbRef = useRef<THREE.Mesh>(null);
  const chargeLightRef = useRef<THREE.PointLight>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const aftershockRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const shardsRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  // --- FX boost refs (darts / shock halo x2) -------------------------------
  const dartsRef = useRef<THREE.InstancedMesh>(null);
  const halo1Ref = useRef<THREE.Mesh>(null);
  const halo2Ref = useRef<THREE.Mesh>(null);
  const dartDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const life = useRef(0);
  const impactCalled = useRef(false);
  const doneCalled = useRef(false);
  const impactTimeoutRef = useRef<number | null>(null);
  const onImpactRef = useRef<PulseWaveProps["onImpact"]>(undefined);
  const onDoneRef = useRef<PulseWaveProps["onDone"]>(onDone);
  const shardDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const wobbleRef = useRef(0);

  useEffect(() => {
    onImpactRef.current = onImpact;
    onDoneRef.current = onDone;
  });

  const camera = useThree((s) => s.camera);

  // Direction derives from camera quaternion (unchanged from original logic).
  const direction = useMemo(() => {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    dir.normalize();
    return dir;
  }, [camera]);

  // Origin snaps to terrain height so the cone hugs the ground.
  const origin = useMemo(() => {
    try {
      const h = getTerrainHeight(center.x, center.z).height;
      return new THREE.Vector3(center.x, h + 1.2, center.z);
    } catch {
      return new THREE.Vector3(center.x, center.y + 1.2, center.z);
    }
  }, [center]);

  const groundY = useMemo(() => {
    try {
      return getTerrainHeight(center.x, center.z).height;
    } catch {
      return center.y - 1.2;
    }
  }, [center]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(origin);
      groupRef.current.lookAt(
        origin.x + direction.x,
        origin.y + direction.y,
        origin.z + direction.z
      );
    }
  }, [origin, direction]);

  // --- geometries -------------------------------------------------------------
  const chargeOrbGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(2.6, CONE_LENGTH, 32, 1, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, -CONE_LENGTH / 2);
    return g;
  }, []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.7, 1.0, 48, 1), []);
  const aftershockGeo = useMemo(() => new THREE.RingGeometry(0.55, 1.0, 64, 1), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 12), []);
  const shardGeo = useMemo(() => new THREE.TetrahedronGeometry(0.22), []);
  const dartGeo = useMemo(() => new THREE.ConeGeometry(0.08, 0.9, 6, 1), []);

  // 64 shards: theta / phi / speed / phase / spin.
  const shardData = useMemo(() => {
    const data: Array<{
      theta: number;
      phi: number;
      speed: number;
      phase: number;
      spin: number;
      size: number;
    }> = [];
    for (let i = 0; i < SHARD_COUNT; i++) {
      data.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.random() * CONE_HALF_ANGLE,
        speed: 14 + Math.random() * 10,
        phase: Math.random() * 0.3,
        spin: 2 + Math.random() * 8,
        size: 0.7 + Math.random() * 0.9,
      });
    }
    return data;
  }, []);
  // 24 instanced darts: fine needles along the cone axis, +-15 deg.
  const dartData = useMemo(() => {
    const data: Array<{ theta: number; phi: number; speed: number; phase: number; size: number }> = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.random() * CONE_HALF_ANGLE,
        speed: 9 + Math.random() * 3,
        phase: Math.random() * 0.12,
        size: 0.8 + Math.random() * 0.5,
      });
    }
    return data;
  }, []);

  // 300 ground spray particles (positions + velocities + RGBW colour).
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(DUST_COUNT * 3);
    const c = new Float32Array(DUST_COUNT * 4);
    const v = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      spawnDust(p, v, i, i);
      pickDustColour(Math.random(), c, i);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  // --- materials ----------------------------------------------------------------
  const chargeOrbMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#bfefff",
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const coneMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#7fdbff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e0f7ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const aftershockMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#9be7ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d7f4ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const shardMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#bfefff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const dustMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.32,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const dartMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e0f7ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const halo1Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#bfefff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );
  const halo2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#7fdbff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  // --- timers + dispose -----------------------------------------------------------
  useEffect(() => {
    impactTimeoutRef.current = window.setTimeout(() => {
      if (!impactCalled.current) {
        impactCalled.current = true;
        if (onImpactRef.current) {
          onImpactRef.current({
            origin: origin.clone(),
            direction: direction.clone(),
            length: CONE_LENGTH,
            halfAngleCos: Math.cos(CONE_HALF_ANGLE),
          });
        }
      }
    }, IMPACT_AT * 1000);

    return () => {
      if (impactTimeoutRef.current !== null) {
        clearTimeout(impactTimeoutRef.current);
        impactTimeoutRef.current = null;
      }
      chargeOrbGeo.dispose();
      coneGeo.dispose();
      ringGeo.dispose();
      aftershockGeo.dispose();
      haloGeo.dispose();
      shardGeo.dispose();
      dustGeo.dispose();
      chargeOrbMat.dispose();
      coneMat.dispose();
      ringMat.dispose();
      aftershockMat.dispose();
      haloMat.dispose();
      shardMat.dispose();
      dustMat.dispose();
      dartGeo.dispose();
      dartMat.dispose();
      halo1Mat.dispose();
      halo2Mat.dispose();
    };
  }, [chargeOrbGeo, coneGeo, ringGeo, aftershockGeo, haloGeo, shardGeo, dustGeo, chargeOrbMat, coneMat, ringMat, aftershockMat, haloMat, shardMat, dustMat, origin, direction]);

  // --- per-frame timeline ---------------------------------------------------------
  useFrame((_, delta) => {
    life.current += delta;
    const t = life.current;
    wobbleRef.current += delta;
    const wobble = wobbleRef.current;

    // Phase A: pre-charge 0 - 0.25s ------------------------------------------
    if (t < IMPACT_AT) {
      const chargeT = t / IMPACT_AT;
      if (chargeOrbRef.current) {
        chargeOrbRef.current.visible = true;
        chargeOrbRef.current.position.set(0, 0, 0);
        chargeOrbRef.current.scale.setScalar(THREE.MathUtils.lerp(0.15, 0.9, chargeT));
        chargeOrbRef.current.rotation.y += delta * 3.0;
        chargeOrbMat.opacity = THREE.MathUtils.lerp(0.4, 0.9, chargeT);
      }
      if (chargeLightRef.current) {
        chargeLightRef.current.position.set(0, 0, 0);
        chargeLightRef.current.intensity = THREE.MathUtils.lerp(0, 60, chargeT);
        chargeLightRef.current.visible = true;
      }
      // Cone preview hovers at low opacity, not yet expanded.
      if (coneRef.current) {
        coneRef.current.visible = true;
        coneRef.current.scale.set(0.55, 0.55, 0.55);
        coneMat.opacity = THREE.MathUtils.lerp(0.06, 0.16, chargeT);
      }
      if (ringRef.current) ringRef.current.visible = false;
      if (aftershockRef.current) aftershockRef.current.visible = false;
      if (lightRef.current) lightRef.current.visible = false;
      if (haloRef.current) haloRef.current.visible = false;
      if (shardsRef.current) shardsRef.current.visible = false;
      if (dustRef.current) dustRef.current.visible = false;
      if (dartsRef.current) dartsRef.current.visible = false;
      if (halo1Ref.current) halo1Ref.current.visible = false;
      if (halo2Ref.current) halo2Ref.current.visible = false;
    } else {
      if (chargeOrbRef.current) chargeOrbRef.current.visible = false;
      if (chargeLightRef.current) chargeLightRef.current.visible = false;
    }

    // Phase B: main shock 0.25 - 0.9s ----------------------------------------
    if (t >= IMPACT_AT && t < 0.9) {
      const shockT = (t - IMPACT_AT) / (0.9 - IMPACT_AT); // 0..1
      const expandT = Math.min((t - IMPACT_AT) / 0.5, 1);
      const fadeT = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.35) : 1;
      if (coneRef.current) {
        coneRef.current.visible = true;
        coneRef.current.scale.set(
          Math.max(0.001, expandT),
          Math.max(0.001, expandT),
          expandT
        );
        // cone body: two sine opacity pulses over the 0.25-0.9s shock window
        coneMat.opacity = 0.5 * fadeT * (0.78 + 0.22 * Math.sin(wobble * 18 + 1) * Math.sin(wobble * 11));
      }
      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.position.set(0, 0, -CONE_LENGTH * expandT);
        const ringR = THREE.MathUtils.lerp(0.3, 2.6, expandT);
        ringRef.current.scale.set(ringR, ringR, 1);
        ringMat.opacity = 0.9 * fadeT;
      }
      if (lightRef.current) {
        lightRef.current.position.set(origin.x, origin.y, origin.z);
        // double flash: 160 -> 80 (first half), 80 -> 40 (second half)
        const flicker = 1 + Math.sin(wobble * 47) * 0.18 + Math.sin(wobble * 93) * 0.1;
        const flashBase =
          shockT < 0.5
            ? THREE.MathUtils.lerp(160, 80, shockT / 0.5)
            : THREE.MathUtils.lerp(80, 40, (shockT - 0.5) / 0.5);
        lightRef.current.intensity = flashBase * flicker * fadeT;
        lightRef.current.visible = fadeT > 0.02;
      }
      if (haloRef.current) {
        haloRef.current.visible = true;
        haloRef.current.position.set(0, 0, -CONE_LENGTH * 0.35 * expandT);
        haloRef.current.scale.setScalar(THREE.MathUtils.lerp(0.6, 3.0, expandT));
        haloRef.current.rotation.y += delta * 2.5;
        haloMat.opacity = 0.28 * fadeT;
      }
      if (shardsRef.current) {
        shardsRef.current.visible = true;
        const dummy = shardDummyRef.current;
        for (let i = 0; i < shardData.length; i++) {
          const d = shardData[i];
          const dist = Math.max(0, (t - IMPACT_AT - d.phase) * d.speed);
          const spread = Math.tan(d.phi) * dist;
          dummy.position.set(
            Math.cos(d.theta) * spread,
            Math.sin(d.theta) * spread,
            -Math.min(dist, CONE_LENGTH)
          );
          dummy.rotation.set(wobble * d.spin + d.theta, d.phi + wobble * d.spin * 0.5, wobble * d.spin * 0.3);
          dummy.scale.setScalar(Math.max(0.001, fadeT * d.size));
          dummy.updateMatrix();
          shardsRef.current.setMatrixAt(i, dummy.matrix);
        }
        shardsRef.current.instanceMatrix.needsUpdate = true;
        shardMat.opacity = fadeT;
      }
      // 24 darts fly outward along the cone axis inside the shock window.
      if (dartsRef.current) {
        dartsRef.current.visible = true;
        const dummy = dartDummyRef.current;
        for (let i = 0; i < dartData.length; i++) {
          const d = dartData[i];
          const localT = Math.max(0, Math.min(1, (t - IMPACT_AT - d.phase) / 0.65));
          const dist = THREE.MathUtils.lerp(0.5, 9, localT);
          const spread = Math.tan(d.phi) * dist;
          dummy.position.set(Math.cos(d.theta) * spread, Math.sin(d.theta) * spread, -dist);
          // needle orientation: axis points outward, slight tilt from cone ray
          dummy.rotation.set(d.theta, 0, d.phi + Math.PI / 2 + wobble * 0.6);
          dummy.scale.setScalar(Math.max(0.001, fadeT * d.size));
          dummy.updateMatrix();
          dartsRef.current.setMatrixAt(i, dummy.matrix);
        }
        dartsRef.current.instanceMatrix.needsUpdate = true;
        dartMat.opacity = fadeT;
      }
      // Ground dust travels down-cone, skimming the deck.
      if (dustRef.current) {
        dustRef.current.visible = true;
        // Dust lives in cone-local space (group already faces camera dir),
        // so no world transform needed; groundY tie keeps it deck-hugging.
        void groundY;
        const pPos = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = dustRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = dustRef.current.geometry.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < pPos.count; i++) {
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta);
          vel.setY(i, vel.getY(i) - 1.2 * delta);
          // pin to deck: never sink below local +0.02
          if (pPos.getY(i) < 0.02) {
            pPos.setY(i, 0.02);
            vel.setY(i, Math.abs(vel.getY(i)) * 0.2);
          }
          col.setW(i, fadeT);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
      void shockT;
    } else if (t >= 0.9) {
      if (coneRef.current) coneRef.current.visible = false;
      if (ringRef.current) ringRef.current.visible = false;
      if (lightRef.current) lightRef.current.visible = false;
      if (haloRef.current) haloRef.current.visible = false;
      if (shardsRef.current) shardsRef.current.visible = false;
    }

    // Phase C: aftershock 0.9 - 1.5s -----------------------------------------
    if (t >= 0.9 && t < AFT_PATH_END) {
      const aftT = (t - 0.9) / (AFT_PATH_END - 0.9);
      if (aftershockRef.current) {
        aftershockRef.current.visible = true;
        aftershockRef.current.position.set(0, 0, -CONE_LENGTH * 0.6);
        const r = THREE.MathUtils.lerp(0.7, 4.2, aftT);
        aftershockRef.current.scale.set(r, r, 1);
        aftershockMat.opacity = THREE.MathUtils.lerp(0.55, 0, aftT);
      }
      if (haloRef.current) {
        haloRef.current.visible = true;
        haloRef.current.position.set(0, 0, -CONE_LENGTH * 0.6);
        haloRef.current.scale.setScalar(THREE.MathUtils.lerp(1.2, 4.6, aftT));
        haloRef.current.rotation.y -= delta * 1.8;
        haloMat.opacity = THREE.MathUtils.lerp(0.22, 0, aftT);
      }
      // Dust coasts to a halt during the aftershock window.
      if (dustRef.current) {
        dustRef.current.visible = true;
        const pPos = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = dustRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = dustRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const fade = Math.max(0, 0.35 - aftT * 0.35);
        for (let i = 0; i < pPos.count; i++) {
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta * 0.5);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta * 0.5);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta * 0.5);
          vel.setX(i, vel.getX(i) * 0.97);
          vel.setY(i, vel.getY(i) * 0.97);
          vel.setZ(i, vel.getZ(i) * 0.97);
          if (pPos.getY(i) < 0.02) pPos.setY(i, 0.02);
          col.setW(i, fade);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (t >= AFT_PATH_END) {
      if (aftershockRef.current) aftershockRef.current.visible = false;
      if (haloRef.current) haloRef.current.visible = false;
      if (dustRef.current) dustRef.current.visible = false;
    }
    // Phase D: shock halo layer 1 (ring 0.3-1.3s) + sphere halo wave 2 -------
    if (t >= 0.3 && t < 1.3) {
      const haloT = (t - 0.3) / 1.0;
      if (halo1Ref.current) {
        halo1Ref.current.visible = true;
        halo1Ref.current.position.set(0, 0, -CONE_LENGTH * 0.5 * haloT);
        const r = THREE.MathUtils.lerp(0.5, 6, haloT);
        halo1Ref.current.scale.set(r, r, 1);
        halo1Ref.current.rotation.z += delta * 1.5;
        halo1Mat.opacity = THREE.MathUtils.lerp(0.6, 0, haloT);
      }
    } else if (halo1Ref.current) {
      halo1Ref.current.visible = false;
    }
    if (t >= 0.5 && t < 1.5) {
      const waveT = (t - 0.5) / 1.0;
      if (halo2Ref.current) {
        halo2Ref.current.visible = true;
        halo2Ref.current.position.set(0, 0, -CONE_LENGTH * 0.45 * waveT);
        halo2Ref.current.scale.setScalar(THREE.MathUtils.lerp(0.8, 5.2, waveT));
        halo2Ref.current.rotation.y -= delta * 2.2;
        halo2Mat.opacity = THREE.MathUtils.lerp(0.32, 0, waveT);
      }
    } else if (halo2Ref.current) {
      halo2Ref.current.visible = false;
    }
    if (t >= 0.9 && dartsRef.current) {
      dartsRef.current.visible = false;
    }

    if (t >= TOTAL_LIFE && !doneCalled.current) {
      doneCalled.current = true;
      if (onDoneRef.current) {
        onDoneRef.current();
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* pre-charge */}
      <mesh ref={chargeOrbRef} geometry={chargeOrbGeo} material={chargeOrbMat} visible={false} />
      <pointLight ref={chargeLightRef} color="#bfefff" intensity={0} distance={18} decay={2} visible={false} />

      {/* cone + main ring */}
      <mesh ref={coneRef} geometry={coneGeo} material={coneMat} visible={false} />
      <mesh ref={ringRef} geometry={ringGeo} material={ringMat} visible={false} />
      <pointLight ref={lightRef} color="#7fdbff" intensity={0} distance={30} decay={2} visible={false} />

      {/* shards + dust + aftershock */}
      <instancedMesh ref={shardsRef} args={[shardGeo, shardMat, SHARD_COUNT]} visible={false} />
      <points ref={dustRef} geometry={dustGeo} material={dustMat} visible={false} />
      <mesh ref={aftershockRef} geometry={aftershockGeo} material={aftershockMat} visible={false} />
      <mesh ref={haloRef} geometry={haloGeo} material={haloMat} visible={false} />
      {/* FX boost: instanced darts + dual shock halo */}
      <instancedMesh ref={dartsRef} args={[dartGeo, dartMat, 24]} visible={false} />
      <mesh ref={halo1Ref} geometry={ringGeo} material={halo1Mat} visible={false} />
      <mesh ref={halo2Ref} geometry={haloGeo} material={halo2Mat} visible={false} />
    </group>
  );
}
