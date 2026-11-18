import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./InfiniteTerrain";

export type RavenousVoidStageCallback = (tick: number, center: THREE.Vector3) => void;

export interface RavenousVoidProps {
  center: THREE.Vector3;
  onStage?: RavenousVoidStageCallback;
  onDone: () => void;
}

// Ravenous Void: persistent 20 ft (r=6) void sphere, 12 ticks total.
// Timeline (Scene wiring unchanged):
//   0-0.8s    rift opening: torus 0.3->1, orb 0.2->1.2, light 0->80
//   0.8s+     sustained: black sphere r=6 + rim 1.18r pulse 1±0.07,
//             accretion disk Torus(6.6,0.35,16,64), ground glow 1.6r
//   ticks     onStage every 1s x12 (centre passed through)
//   12s + 0.3 fade; 12.5s onDone
//   500 spiral particles: radii > r*0.5 respawn at 10-16, sine heights
const TOTAL_TICKS = 12;
const SPHERE_R = 6; // 20 ft
const CRACK_AT = 0.8;
const FADE_START = TOTAL_TICKS + 0.2; // 12.2
const FADE_LEN = 0.3;
const PARTICLE_COUNT = 800;
const OUTFLOW_COUNT = 200;

// Void particle colour ramp: pale lavender -> violet -> abyss.
function pickVoidColour(
  rand: number,
  out: Float32Array,
  i: number
): void {
  if (rand < 0.35) {
    out[i * 4] = 0.7;
    out[i * 4 + 1] = 0.53;
    out[i * 4 + 2] = 1.0;
  } else if (rand < 0.75) {
    out[i * 4] = 0.43;
    out[i * 4 + 1] = 0.16;
    out[i * 4 + 2] = 0.85;
  } else {
    out[i * 4] = 0.29;
    out[i * 4 + 1] = 0.08;
    out[i * 4 + 2] = 0.55;
  }
  out[i * 4 + 3] = 0.85;
}

// Spawn position for a freshly-recycled ingress particle.
function spawnIngress(
  radii: Float32Array,
  heights: Float32Array,
  i: number
): void {
  radii[i] = 10 + Math.random() * 6;
  heights[i] = 0.5 + Math.random() * 10;
}

// Spiral height profile: gentle sine undulation along the inflow band.
function wobbleHeight(base: number, t: number, i: number): number {
  return base * (0.6 + 0.4 * Math.sin(t * 2 + i));
}

export function RavenousVoid({ center, onStage, onDone }: RavenousVoidProps) {
  // Crack-phase refs
  const riftRef = useRef<THREE.Mesh>(null);
  const crackOrbRef = useRef<THREE.Mesh>(null);
  const crackLightRef = useRef<THREE.PointLight>(null);

  // Sustained refs
  const sphereRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  // --- FX boost refs (moons / ripple / outflow / rim2 / crack shards) ------
  const rim2Ref = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const rippleLightRef = useRef<THREE.PointLight>(null);
  const outflowRef = useRef<THREE.Points>(null);
  const moonsRef = useRef<THREE.Group>(null);
  const crackShardsRef = useRef<THREE.InstancedMesh>(null);
  const crackDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const lastStageRef = useRef(0);
  const rippleStartRef = useRef(-10);

  // Timers / stage state
  const stageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageCountRef = useRef(0);
  const startedRef = useRef(false);
  const life = useRef(0);
  const onStageRef = useRef<RavenousVoidStageCallback | undefined>(onStage);
  const onDoneRef = useRef<() => void>(onDone);
  const centerRef = useRef<THREE.Vector3>(center.clone());
  const wobbleRef = useRef(0);

  useEffect(() => {
    onStageRef.current = onStage;
  }, [onStage]);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    centerRef.current.copy(center);
  }, [center]);

  const groundY = useMemo(() => {
    try {
      return getTerrainHeight(center.x, center.z).height;
    } catch {
      return 0;
    }
  }, [center]);

  // --- geometries (one-time) -------------------------------------------------
  const riftGeo = useMemo(() => new THREE.TorusGeometry(1, 0.09, 16, 48), []);
  const crackOrbGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 36, 24), []);
  const rimGeo = useMemo(() => new THREE.SphereGeometry(1, 28, 18), []);
  const diskGeo = useMemo(() => new THREE.TorusGeometry(6.6, 0.35, 16, 64), []);
  const glowGeo = useMemo(() => new THREE.CircleGeometry(1, 48), []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.6, 1.0, 64, 1), []);
  // --- FX boost geometries --------------------------------------------------
  const moonGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 0), []);
  const crackGeo = useMemo(() => new THREE.TetrahedronGeometry(0.32), []);
  // 16 crack shards: angle / tilt / phase for the 0-0.8s radial burst.
  const crackData = useMemo(() => {
    const data: Array<{ angle: number; tilt: number; phase: number; speed: number }> = [];
    for (let i = 0; i < 16; i++) {
      data.push({
        angle: (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.08,
        tilt: 0.3 + Math.random() * 0.5,
        phase: Math.random() * 0.2,
        speed: 6 + Math.random() * 5,
      });
    }
    return data;
  }, []);
  // 200 outflow particles: outward eject (1/4 re-spray), speed 4-8u.
  const outflowData = useMemo(() => {
    const radii = new Float32Array(OUTFLOW_COUNT);
    const angles = new Float32Array(OUTFLOW_COUNT);
    const heights = new Float32Array(OUTFLOW_COUNT);
    const speeds = new Float32Array(OUTFLOW_COUNT);
    for (let i = 0; i < OUTFLOW_COUNT; i++) {
      radii[i] = 6 + Math.random() * 4;
      angles[i] = Math.random() * Math.PI * 2;
      heights[i] = 1.5 + Math.random() * 4.5;
      speeds[i] = 4 + Math.random() * 4;
    }
    return { count: OUTFLOW_COUNT, radii, angles, heights, speeds };
  }, []);
  const outflowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(outflowData.count * 3);
    const c = new Float32Array(outflowData.count * 4);
    for (let i = 0; i < outflowData.count; i++) {
      pickVoidColour(Math.random(), c, i);
      const a = outflowData.angles[i];
      p[i * 3] = Math.cos(a) * outflowData.radii[i];
      p[i * 3 + 1] = outflowData.heights[i];
      p[i * 3 + 2] = Math.sin(a) * outflowData.radii[i];
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    return g;
  }, [outflowData]);

  // --- particle buffers --------------------------------------------------------
  const particleData = useMemo(() => {
    const count = PARTICLE_COUNT;
    const radii = new Float32Array(count);
    const angles = new Float32Array(count);
    const heights = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      radii[i] = 6 + Math.random() * 8;
      angles[i] = Math.random() * Math.PI * 2;
      heights[i] = 0.5 + Math.random() * 10;
      speeds[i] = 3 + Math.random() * 5;
    }
    return { count, radii, angles, heights, speeds };
  }, []);

  const particleGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(particleData.count * 3);
    const c = new Float32Array(particleData.count * 4);
    for (let i = 0; i < particleData.count; i++) {
      pickVoidColour(Math.random(), c, i);
      // initialise positions immediately so headless renders show material
      const a = particleData.angles[i];
      p[i * 3] = Math.cos(a) * particleData.radii[i];
      p[i * 3 + 1] = particleData.heights[i];
      p[i * 3 + 2] = Math.sin(a) * particleData.radii[i];
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    return g;
  }, [particleData]);

  // --- materials ----------------------------------------------------------------
  const riftMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b388ff",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const crackOrbMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d9c8ff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const sphereMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#050508",
        transparent: true,
        opacity: 0.97,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b388ff",
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    []
  );

  const diskMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#6e3fd4",
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#4a148c",
        transparent: true,
        opacity: 0.45,
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
        color: "#b388ff",
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const particleMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.38,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const rim2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d9c8ff",
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    []
  );
  const rippleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#b388ff",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );
  const moonMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e6dcff",
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const crackMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d9c8ff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const outflowMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.34,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  // --- timers ---------------------------------------------------------------------
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    stageIntervalRef.current = setInterval(() => {
      stageCountRef.current += 1;
      if (onStageRef.current) {
        onStageRef.current(stageCountRef.current, centerRef.current.clone());
      }
    }, 1000);

    doneTimeoutRef.current = setTimeout(() => {
      if (onDoneRef.current) {
        onDoneRef.current();
      }
    }, TOTAL_TICKS * 1000 + 500);

    return () => {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current);
        stageIntervalRef.current = null;
      }
      if (doneTimeoutRef.current) {
        clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      riftGeo.dispose();
      crackOrbGeo.dispose();
      sphereGeo.dispose();
      rimGeo.dispose();
      diskGeo.dispose();
      glowGeo.dispose();
      ringGeo.dispose();
      particleGeo.dispose();
      riftMat.dispose();
      crackOrbMat.dispose();
      sphereMat.dispose();
      rimMat.dispose();
      diskMat.dispose();
      glowMat.dispose();
      ringMat.dispose();
      particleMat.dispose();
      moonGeo.dispose();
      crackGeo.dispose();
      outflowGeo.dispose();
      rim2Mat.dispose();
      rippleMat.dispose();
      moonMat.dispose();
      crackMat.dispose();
      outflowMat.dispose();
    };
  }, [riftGeo, crackOrbGeo, sphereGeo, rimGeo, diskGeo, glowGeo, ringGeo, particleGeo, riftMat, crackOrbMat, sphereMat, rimMat, diskMat, glowMat, ringMat, particleMat]);

  // --- per-frame timeline ---------------------------------------------------------
  useFrame((_, delta) => {
    life.current += delta;
    const t = life.current;
    wobbleRef.current += delta;
    const wobble = wobbleRef.current;
    const cx = centerRef.current.x;
    const cz = centerRef.current.z;
    const cy = groundY + 3;
    const fadeT = t > FADE_START ? Math.max(0, 1 - (t - FADE_START) / FADE_LEN) : 1;
    const pulse = 1 + Math.sin(t * 3) * 0.07;

    // Phase A: rift opening 0 - 0.8s ------------------------------------------
    if (t < CRACK_AT) {
      const crackT = t / CRACK_AT;
      if (riftRef.current) {
        riftRef.current.visible = true;
        riftRef.current.position.set(cx, cy, cz);
        riftRef.current.rotation.x = Math.PI / 2.4 + delta * 0.4;
        riftRef.current.rotation.z += delta * (1.2 + crackT * 2.5);
        riftRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.0, crackT));
        riftMat.opacity = THREE.MathUtils.lerp(0.35, 0.85, crackT) * fadeT;
      }
      if (crackOrbRef.current) {
        crackOrbRef.current.visible = true;
        crackOrbRef.current.position.set(cx, cy, cz);
        crackOrbRef.current.scale.setScalar(THREE.MathUtils.lerp(0.2, 1.2, crackT));
        crackOrbRef.current.rotation.y += delta * 2.0;
        crackOrbMat.opacity = THREE.MathUtils.lerp(0.5, 0.95, crackT) * fadeT;
      }
      if (crackLightRef.current) {
        crackLightRef.current.position.set(cx, cy, cz);
        crackLightRef.current.intensity = THREE.MathUtils.lerp(0, 80, crackT) * fadeT;
        crackLightRef.current.visible = true;
      }
      // Sustained shells begin scaled by crack progress so the hand-off is seamless.
      const openT = THREE.MathUtils.lerp(0.15, 1.0, crackT);
      if (sphereRef.current) {
        sphereRef.current.visible = true;
        sphereRef.current.position.set(cx, cy, cz);
        sphereRef.current.scale.setScalar(SPHERE_R * pulse * openT);
        sphereMat.opacity = 0.97 * fadeT;
      }
      if (rimRef.current) {
        rimRef.current.visible = true;
        rimRef.current.position.set(cx, cy, cz);
        rimRef.current.scale.setScalar(SPHERE_R * 1.18 * pulse * openT);
        rimRef.current.rotation.y += delta * 0.8;
        rimMat.opacity = 0.35 * fadeT;
      }
      if (diskRef.current) {
        diskRef.current.visible = true;
        diskRef.current.position.set(cx, groundY + 0.7, cz);
        diskRef.current.rotation.x = Math.PI / 2;
        diskRef.current.rotation.z += delta * 0.6;
        diskRef.current.scale.setScalar(openT);
        diskMat.opacity = 0.55 * fadeT;
      }
      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.position.set(cx, groundY + 0.08, cz);
        ringRef.current.rotation.x = -Math.PI / 2;
        ringRef.current.scale.setScalar(SPHERE_R * 1.1 * openT);
        ringMat.opacity = 0.4 * fadeT;
      }
      if (glowRef.current) {
        glowRef.current.visible = true;
        glowRef.current.position.set(cx, groundY + 0.05, cz);
        glowRef.current.rotation.x = -Math.PI / 2;
        glowRef.current.scale.setScalar(SPHERE_R * 1.6);
        glowMat.opacity = 0.45 * fadeT;
      }
      if (lightRef.current) {
        lightRef.current.position.set(cx, cy + 2, cz);
        lightRef.current.intensity = (30 + Math.sin(t * 5) * 12) * fadeT;
        lightRef.current.visible = fadeT > 0.02;
      }
      if (particlesRef.current) {
        particlesRef.current.visible = true;
        particlesRef.current.position.set(cx, groundY, cz);
        const pPos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const pCol = particlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const radii = particleData.radii;
        const angles = particleData.angles;
        const heights = particleData.heights;
        const speeds = particleData.speeds;
        for (let i = 0; i < particleData.count; i++) {
          radii[i] -= speeds[i] * delta * 0.7;
          angles[i] += delta * 1.2;
          if (radii[i] < SPHERE_R * 0.5) {
            spawnIngress(radii, heights, i);
            angles[i] = Math.random() * Math.PI * 2;
          }
          pPos.setXYZ(
            i,
            Math.cos(angles[i]) * radii[i],
            wobbleHeight(heights[i], t, i),
            Math.sin(angles[i]) * radii[i]
          );
          pCol.setW(i, 0.85 * fadeT);
        }
        pPos.needsUpdate = true;
        pCol.needsUpdate = true;
      }
    } else {
      // Crack visuals retire at 0.8s; sustained shells take over at full size.
      if (riftRef.current) riftRef.current.visible = false;
      if (crackOrbRef.current) crackOrbRef.current.visible = false;
      if (crackLightRef.current) crackLightRef.current.visible = false;

      if (sphereRef.current) {
        sphereRef.current.visible = true;
        sphereRef.current.position.set(cx, cy, cz);
        sphereRef.current.scale.setScalar(SPHERE_R * pulse);
        sphereMat.opacity = 0.97 * fadeT;
      }
      if (rimRef.current) {
        rimRef.current.visible = true;
        rimRef.current.position.set(cx, cy, cz);
        rimRef.current.scale.setScalar(SPHERE_R * 1.18 * pulse);
        rimRef.current.rotation.y += delta * 0.8;
        rimRef.current.rotation.x += delta * 0.3;
        rimMat.opacity = (0.32 + Math.sin(t * 4) * 0.08) * fadeT;
      }
      if (diskRef.current) {
        diskRef.current.visible = true;
        diskRef.current.position.set(cx, groundY + 0.7, cz);
        diskRef.current.rotation.x = Math.PI / 2;
        diskRef.current.rotation.z += delta * 0.6;
        // accretion disk breathing: 1 ± 0.06 swell over the 3s cycle
        diskRef.current.scale.setScalar(1 + Math.sin(t * 2.1) * 0.06);
        diskMat.opacity = (0.5 + Math.sin(t * 3.1) * 0.12) * fadeT;
      }
      if (ringRef.current) {
        ringRef.current.visible = true;
        ringRef.current.position.set(cx, groundY + 0.08, cz);
        ringRef.current.rotation.x = -Math.PI / 2;
        ringRef.current.scale.setScalar(SPHERE_R * 1.1);
        ringMat.opacity = (0.35 + Math.sin(t * 3.4) * 0.08) * fadeT;
      }
      if (glowRef.current) {
        glowRef.current.visible = true;
        glowRef.current.position.set(cx, groundY + 0.05, cz);
        glowRef.current.rotation.x = -Math.PI / 2;
        glowRef.current.scale.setScalar(SPHERE_R * 1.6);
        glowMat.opacity = (0.42 + Math.sin(t * 2.6) * 0.08) * fadeT;
      }
      if (lightRef.current) {
        lightRef.current.position.set(cx, cy + 2, cz);
        lightRef.current.intensity = (60 + Math.sin(t * 5) * 15 + Math.sin(wobble * 11) * 5) * fadeT;
        lightRef.current.visible = fadeT > 0.02;
      }
      // 500 spiralling ingress particles (sustained rate).
      if (particlesRef.current) {
        particlesRef.current.visible = true;
        particlesRef.current.position.set(cx, groundY, cz);
        const pPos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const pCol = particlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const radii = particleData.radii;
        const angles = particleData.angles;
        const heights = particleData.heights;
        const speeds = particleData.speeds;
        for (let i = 0; i < particleData.count; i++) {
          radii[i] -= speeds[i] * delta;
          angles[i] += delta * (1.0 + speeds[i] * 0.12);
          if (radii[i] < SPHERE_R * 0.5) {
            spawnIngress(radii, heights, i);
            angles[i] = Math.random() * Math.PI * 2;
          }
          pPos.setXYZ(
            i,
            Math.cos(angles[i]) * radii[i],
            wobbleHeight(heights[i], t, i),
            Math.sin(angles[i]) * radii[i]
          );
          pCol.setW(i, 0.85 * fadeT);
        }
        pPos.needsUpdate = true;
        pCol.needsUpdate = true;
      }
    }
    // Phase FX: tick ripple (self-triggered on every onStage tick, 0.6s) -----
    if (stageCountRef.current !== lastStageRef.current) {
      lastStageRef.current = stageCountRef.current;
      rippleStartRef.current = t;
    }
    const rippleT = (t - rippleStartRef.current) / 0.6;
    if (rippleT >= 0 && rippleT < 1) {
      if (rippleRef.current) {
        rippleRef.current.visible = true;
        rippleRef.current.position.set(cx, groundY + 0.06, cz);
        rippleRef.current.rotation.x = -Math.PI / 2;
        const r = THREE.MathUtils.lerp(1.1, 30, rippleT);
        rippleRef.current.scale.set(r, r, 1);
        rippleMat.opacity = THREE.MathUtils.lerp(0.5, 0, rippleT) * fadeT;
      }
      if (rippleLightRef.current) {
        rippleLightRef.current.position.set(cx, cy + 2, cz);
        rippleLightRef.current.intensity = THREE.MathUtils.lerp(60, 140, rippleT) * (1 - rippleT * 0.4) * fadeT;
        rippleLightRef.current.visible = fadeT > 0.02;
      }
    } else {
      if (rippleRef.current) rippleRef.current.visible = false;
      if (rippleLightRef.current) rippleLightRef.current.visible = false;
    }
    // Phase FX: orbiting moons (3, retrograde at disk radius 8) ---------------
    if (moonsRef.current) {
      moonsRef.current.visible = true;
      moonsRef.current.position.set(cx, groundY + 2.2, cz);
      moonsRef.current.children.forEach((child, i) => {
        const angle = (i / 3) * Math.PI * 2 - t * 0.5;
        const moon = child as THREE.Mesh;
        moon.position.set(Math.cos(angle) * 8, Math.sin(t * 1.1 + i * 2.1) * 0.4, Math.sin(angle) * 8);
        moon.rotation.y -= delta * 1.2;
        moon.rotation.x += delta * 0.4;
        moon.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08);
      });
      moonMat.opacity = 0.85 * fadeT;
    }
    // Phase FX: nested event-horizon rim2 (outer alpha 0.2 shell) --------------
    if (rim2Ref.current) {
      rim2Ref.current.visible = fadeT > 0.02;
      rim2Ref.current.position.set(cx, cy, cz);
      rim2Ref.current.scale.setScalar(SPHERE_R * 1.32 * pulse * (t < CRACK_AT ? THREE.MathUtils.lerp(0.15, 1.0, t / CRACK_AT) : 1));
      rim2Ref.current.rotation.y += delta * 0.6;
      rim2Mat.opacity = 0.2 * fadeT;
    }
    // Phase FX: outflow spray (200, outward eject 4-8u) -----------------------
    if (outflowRef.current) {
      outflowRef.current.visible = fadeT > 0.02;
      outflowRef.current.position.set(cx, groundY, cz);
      const pPos = outflowRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const pCol = outflowRef.current.geometry.attributes.color as THREE.BufferAttribute;
      const radii = outflowData.radii;
      const angles = outflowData.angles;
      const heights = outflowData.heights;
      const speeds = outflowData.speeds;
      for (let i = 0; i < outflowData.count; i++) {
        radii[i] += speeds[i] * delta;
        angles[i] += delta * 0.4;
        if (radii[i] > 20) {
          radii[i] = 6 + Math.random() * 2;
          angles[i] = Math.random() * Math.PI * 2;
          heights[i] = 1.5 + Math.random() * 4.5;
        }
        pPos.setXYZ(i, Math.cos(angles[i]) * radii[i], heights[i] + Math.sin(t * 1.7 + i) * 0.3, Math.sin(angles[i]) * radii[i]);
        pCol.setW(i, 0.7 * fadeT);
      }
      pPos.needsUpdate = true;
      pCol.needsUpdate = true;
    }
    // Phase FX: crack shards (16 tetra, 0-0.8s radial) -------------------------
    if (t < CRACK_AT) {
      if (crackShardsRef.current) {
        crackShardsRef.current.visible = true;
        const dummy = crackDummyRef.current;
        for (let i = 0; i < crackData.length; i++) {
          const d = crackData[i];
          const localT = Math.max(0, Math.min(1, (t - d.phase) / (CRACK_AT - d.phase)));
          const dist = d.speed * localT;
          dummy.position.set(cx + Math.cos(d.angle) * dist, cy + Math.sin(localT * Math.PI) * 2.2 + 0.5, cz + Math.sin(d.angle) * dist);
          dummy.rotation.set(wobble * 3 + d.tilt, d.angle + wobble * 2, d.tilt);
          dummy.scale.setScalar(Math.max(0.001, (1 - localT * 0.4) * 1.2));
          dummy.updateMatrix();
          crackShardsRef.current.setMatrixAt(i, dummy.matrix);
        }
        crackShardsRef.current.instanceMatrix.needsUpdate = true;
        crackMat.opacity = (1 - t / CRACK_AT) * 0.9 * fadeT;
      }
    } else if (crackShardsRef.current) {
      crackShardsRef.current.visible = false;
    }
  });

  return (
    <group>
      {/* rift opening */}
      <mesh ref={riftRef} geometry={riftGeo} material={riftMat} visible={false} />
      <mesh ref={crackOrbRef} geometry={crackOrbGeo} material={crackOrbMat} visible={false} />
      <pointLight ref={crackLightRef} color="#b388ff" intensity={0} distance={35} decay={2} visible={false} />

      {/* sustained void */}
      <mesh ref={sphereRef} geometry={sphereGeo} material={sphereMat} />
      <mesh ref={rimRef} geometry={rimGeo} material={rimMat} />
      <mesh ref={diskRef} geometry={diskGeo} material={diskMat} />
      <mesh ref={glowRef} geometry={glowGeo} material={glowMat} />
      <mesh ref={ringRef} geometry={ringGeo} material={ringMat} />
      <pointLight ref={lightRef} color="#b388ff" intensity={60} distance={50} decay={2} />
      <points ref={particlesRef} geometry={particleGeo} material={particleMat} />
      {/* FX boost: nested rim, tick ripple, moons, outflow, crack shards */}
      <mesh ref={rim2Ref} geometry={rimGeo} material={rim2Mat} visible={false} />
      <mesh ref={rippleRef} geometry={ringGeo} material={rippleMat} visible={false} />
      <pointLight ref={rippleLightRef} color="#b388ff" intensity={0} distance={50} decay={2} visible={false} />
      <group ref={moonsRef} visible={false}>
        <mesh geometry={moonGeo} material={moonMat} />
        <mesh geometry={moonGeo} material={moonMat} />
        <mesh geometry={moonGeo} material={moonMat} />
      </group>
      <points ref={outflowRef} geometry={outflowGeo} material={outflowMat} visible={false} />
      <instancedMesh ref={crackShardsRef} args={[crackGeo, crackMat, 16]} visible={false} />
    </group>
  );
}
