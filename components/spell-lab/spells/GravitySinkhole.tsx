import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./InfiniteTerrain";

export interface GravitySinkholeProps {
  center: THREE.Vector3;
  onImpact?: () => void;
  onDone: () => void;
}

// 4th-level Gravity Sinkhole: a 20 ft radius (6 unit) force sphere collapses.
// Timeline (Scene wiring unchanged):
//   0-0.5s   charge: orb + corona + 24 filaments converge, light 0->220
//   0.5s     onImpact (Scene: 5d10 force damage + crater, dist < 6)
//   0.5-1.3s main burst: flash 0.5->18 fade, rings 1.5->18 / 2->22, ground glow
//   0.5-1.1s 48 instanced spears 2->20 with tilt
//   0.5-3.0s burst: 700 particles, UV-tri colours, velocity + gravity curl
//   3.0-5.0s embers: 150 rising motes; 5.0s onDone
const IMPACT_AT = 0.5;
const TOTAL_LIFE = 5.0;
const SPHERE_R = 6; // 20 ft radius in spell units (1 ft = 0.3 u)
const FLASH_END = 0.85;
const RING_END = 1.3;
const SPEAR_END = 1.1;
const BURST_END = 3.0;
const EMBER_END = 5.0;
const CHARGE_HEIGHT = 3; // charge orb / collapse centre above ground

// --- palette helpers --------------------------------------------------------
// UV three-stop ramp: violet core -> lavender mid -> white-violet tip.
function pickBurstColour(
  rand: number,
  out: Float32Array,
  i: number
): void {
  if (rand < 0.55) {
    // violet
    out[i * 4] = 0.55;
    out[i * 4 + 1] = 0.42;
    out[i * 4 + 2] = 1.0;
  } else if (rand < 0.85) {
    // lavender
    out[i * 4] = 0.77;
    out[i * 4 + 1] = 0.71;
    out[i * 4 + 2] = 0.99;
  } else {
    // pale tip
    out[i * 4] = 0.95;
    out[i * 4 + 1] = 0.92;
    out[i * 4 + 2] = 1.0;
  }
  out[i * 4 + 3] = 1.0;
}

// Ember ramp: deep violet -> purple -> pale.
function pickEmberColour(
  rand: number,
  out: Float32Array,
  i: number
): void {
  if (rand < 0.5) {
    out[i * 4] = 0.43;
    out[i * 4 + 1] = 0.16;
    out[i * 4 + 2] = 0.85;
  } else if (rand < 0.85) {
    out[i * 4] = 0.55;
    out[i * 4 + 1] = 0.42;
    out[i * 4 + 2] = 1.0;
  } else {
    out[i * 4] = 0.77;
    out[i * 4 + 1] = 0.71;
    out[i * 4 + 2] = 0.99;
  }
  out[i * 4 + 3] = 1.0;
}

// Random unit-sphere direction helper for burst velocities.
function randomDir(out: Float32Array, i: number, speedMin: number, speedMax: number): void {
  const azimuth = Math.random() * Math.PI * 2;
  const elevation = (Math.random() - 0.15) * Math.PI * 0.85;
  const speed = speedMin + Math.random() * (speedMax - speedMin);
  const cosE = Math.cos(elevation);
  out[i * 3] = Math.cos(azimuth) * cosE * speed;
  out[i * 3 + 1] = Math.sin(elevation) * speed;
  out[i * 3 + 2] = Math.sin(azimuth) * cosE * speed;
}
// Lightning bolt factory (style of LightningStrike.createBoltGeometry):
// jagged 8-point polyline from the collapse centre outward, stored as
// 7 line segments (14 endpoints) for lineSegments rendering.
function createBoltGeometry(azimuth: number, radius: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const poly = new Float32Array(8 * 3);
  for (let i = 0; i < 8; i++) {
    const f = i / 7;
    const jitter = i === 0 || i === 7 ? 0 : (Math.random() - 0.5) * 0.9;
    poly[i * 3] = Math.cos(azimuth) * radius * f + jitter * 0.4;
    poly[i * 3 + 1] = -f * 3.2 + jitter * 0.7;
    poly[i * 3 + 2] = Math.sin(azimuth) * radius * f + jitter * 0.4;
  }
  const segs = new Float32Array(7 * 2 * 3);
  for (let i = 0; i < 7; i++) {
    segs[i * 6] = poly[i * 3];
    segs[i * 6 + 1] = poly[i * 3 + 1];
    segs[i * 6 + 2] = poly[i * 3 + 2];
    segs[i * 6 + 3] = poly[(i + 1) * 3];
    segs[i * 6 + 4] = poly[(i + 1) * 3 + 1];
    segs[i * 6 + 5] = poly[(i + 1) * 3 + 2];
  }
  g.setAttribute("position", new THREE.BufferAttribute(segs, 3));
  return g;
}

export function GravitySinkhole({ center, onImpact, onDone }: GravitySinkholeProps) {
  // --- mesh / light refs ----------------------------------------------------
  const chargeOrbRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const chargeLightRef = useRef<THREE.PointLight>(null);
  const filamentsRef = useRef<THREE.Group>(null);

  const flashRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);

  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const groundGlowRef = useRef<THREE.Mesh>(null);

  const spearsRef = useRef<THREE.InstancedMesh>(null);

  const burstParticlesRef = useRef<THREE.Points>(null);
  const embersRef = useRef<THREE.Points>(null);

  // --- state refs ------------------------------------------------------------
  const life = useRef(0);
  const impactCalled = useRef(false);
  const doneCalled = useRef(false);
  const impactTimeoutRef = useRef<number | null>(null);
  const onImpactRef = useRef<GravitySinkholeProps["onImpact"]>(undefined);
  const onDoneRef = useRef<GravitySinkholeProps["onDone"]>(onDone);
  const spearDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const curlRef = useRef(0);
  // --- FX boost refs (rune shards / arcs / debris / aftershock) -------------
  const runeShardsRef = useRef<THREE.InstancedMesh>(null);
  const arcsRef = useRef<THREE.Group>(null);
  const debrisRef = useRef<THREE.Points>(null);
  const aftershockRef = useRef<THREE.Mesh>(null);
  const aftershockLightRef = useRef<THREE.PointLight>(null);
  const runeDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    onImpactRef.current = onImpact;
    onDoneRef.current = onDone;
  });

  const groundY = useMemo(() => {
    try {
      const h = getTerrainHeight(center.x, center.z);
      return h.height;
    } catch {
      return 0;
    }
  }, [center]);

  // --- geometries (one-time) -------------------------------------------------
  const chargeOrbGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const coronaGeo = useMemo(() => new THREE.TorusGeometry(1, 0.1, 16, 32), []);
  const flashGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.5, 1.0, 64, 1), []);
  const groundGlowGeo = useMemo(() => new THREE.RingGeometry(0.5, 1.0, 64, 1), []);
  const spearGeo = useMemo(() => new THREE.PlaneGeometry(0.09, 1), []);
  // 12 orbiting rune shards: OctahedronGeometry instanced, billboarded.
  const runeGeo = useMemo(() => new THREE.OctahedronGeometry(0.35, 0), []);
  const runeData = useMemo(() => {
    const data: Array<{ angle: number; radius: number; height: number; spin: number; size: number; eject: number }> = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        angle: (i / 12) * Math.PI * 2,
        radius: 2.6 + Math.random() * 0.8,
        height: (Math.random() - 0.5) * 1.2,
        spin: 2 + Math.random() * 4,
        size: 0.7 + Math.random() * 0.7,
        eject: 5 + Math.random() * 4,
      });
    }
    return data;
  }, []);
  // 6 lightning arcs from the centre toward 6 azimuths at radius 6.
  const boltGeos = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      geos.push(createBoltGeometry((i / 6) * Math.PI * 2 + 0.3, 6));
    }
    return geos;
  }, []);
  // Aftershock ring: inner-radius 0.85, scaled 0.7 -> 28 over 0.85-1.8s.
  const aftershockGeo = useMemo(() => new THREE.RingGeometry(0.85, 1.0, 64, 1), []);
  // 300 deferred debris: burst aftermath, dust rolling near the ground.
  const debrisGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 300;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 5;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = 0.15 + Math.random() * 1.2;
      p[i * 3 + 2] = Math.sin(a) * r;
      pickBurstColour(Math.random(), c, i);
      const spd = 2.5 + Math.random() * 4.5;
      v[i * 3] = Math.cos(a) * spd;
      v[i * 3 + 1] = 0.6 + Math.random() * 1.4;
      v[i * 3 + 2] = Math.sin(a) * spd;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  // 24 converging filaments (thin cylinders aimed inward).
  const filamentGeos = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 24; i++) {
      geos.push(new THREE.CylinderGeometry(0.02, 0.008, 1, 8));
    }
    return geos;
  }, []);

  const filamentData = useMemo(() => {
    const data: Array<{ angle: number; radius: number; wobble: number }> = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
      data.push({ angle, radius: 1.0 + Math.random() * 0.15, wobble: Math.random() * Math.PI * 2 });
    }
    return data;
  }, []);

  // 48 spears: angle / tilt / phase for the 0.5-1.1s radial volley.
  const spearData = useMemo(() => {
    const data: Array<{ angle: number; tilt: number; phase: number; len: number }> = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const tilt = (Math.random() * 18 + 12) * (Math.PI / 180);
      data.push({ angle, tilt, phase: Math.random() * 0.15, len: 0.85 + Math.random() * 0.35 });
    }
    return data;
  }, []);

  // 700 burst particles: position + velocity + 4-component colour (RGBW).
  const burstGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 1000;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      p[i * 3] = 0;
      p[i * 3 + 1] = 0;
      p[i * 3 + 2] = 0;
      pickBurstColour(Math.random(), c, i);
      randomDir(v, i, 10, 26);
      v[i * 3 + 1] *= 0.45; // keep burst low & wide
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  // 150 embers: small radial spawn, slow rise.
  const embersGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 250;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = Math.random() * 4;
      const a = Math.random() * Math.PI * 2;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = 0.4 + Math.random() * 1.5;
      p[i * 3 + 2] = Math.sin(a) * r;
      pickEmberColour(Math.random(), c, i);
      const az = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.2;
      v[i * 3] = Math.cos(az) * spd * 0.35;
      v[i * 3 + 1] = 1.0 + Math.random() * 2.0;
      v[i * 3 + 2] = Math.sin(az) * spd * 0.35;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  // --- materials (one-time, additive / toneMapped false) ---------------------
  const chargeOrbMat = useMemo(
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

  const coronaMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8c6cff",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const filamentMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#c4b5fd",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const flashMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e6dcff",
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const ring1Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8c6cff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const ring2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d9c8ff",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const groundGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#6d28d9",
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const spearMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e6dcff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const burstMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.45,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  const embersMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const runeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#f0e8ff",
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const boltMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#e6dcff",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const debrisMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );
  const aftershockMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8c6cff",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  // --- timers + dispose ------------------------------------------------------
  useEffect(() => {
    impactTimeoutRef.current = window.setTimeout(() => {
      if (!impactCalled.current) {
        impactCalled.current = true;
        if (onImpactRef.current) {
          onImpactRef.current();
        }
      }
    }, IMPACT_AT * 1000);

    return () => {
      if (impactTimeoutRef.current !== null) {
        clearTimeout(impactTimeoutRef.current);
        impactTimeoutRef.current = null;
      }
      chargeOrbGeo.dispose();
      coronaGeo.dispose();
      flashGeo.dispose();
      ringGeo.dispose();
      groundGlowGeo.dispose();
      spearGeo.dispose();
      filamentGeos.forEach((g) => g.dispose());
      burstGeo.dispose();
      embersGeo.dispose();
      chargeOrbMat.dispose();
      coronaMat.dispose();
      filamentMat.dispose();
      flashMat.dispose();
      ring1Mat.dispose();
      ring2Mat.dispose();
      groundGlowMat.dispose();
      spearMat.dispose();
      burstMat.dispose();
      embersMat.dispose();
      runeGeo.dispose();
      boltGeos.forEach((g) => g.dispose());
      aftershockGeo.dispose();
      debrisGeo.dispose();
      runeMat.dispose();
      boltMat.dispose();
      debrisMat.dispose();
      aftershockMat.dispose();
    };
  }, []);

  // --- per-frame timeline -----------------------------------------------------
  useFrame((_, delta) => {
    life.current += delta;
    const t = life.current;
    curlRef.current += delta;
    const curl = curlRef.current;
    const cx = center.x;
    const cz = center.z;
    const cy = groundY + CHARGE_HEIGHT;

    // Phase A: charge 0 - 0.5s ---------------------------------------------
    if (t < IMPACT_AT) {
      const chargeT = t / IMPACT_AT;
      const orbRadius = THREE.MathUtils.lerp(0.2, 1.2, chargeT);
      if (chargeOrbRef.current) {
        chargeOrbRef.current.scale.setScalar(orbRadius);
        chargeOrbRef.current.position.set(cx, cy, cz);
        chargeOrbRef.current.rotation.y += delta * 1.4;
        chargeOrbRef.current.rotation.x += delta * 0.8;
        chargeOrbRef.current.visible = true;
        chargeOrbMat.opacity = THREE.MathUtils.lerp(0.5, 0.95, chargeT);
      }
      if (coronaRef.current) {
        coronaRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.6, chargeT));
        coronaRef.current.position.set(cx, cy, cz);
        coronaRef.current.rotation.z += delta * (2 + chargeT * 4);
        coronaRef.current.rotation.x += delta * 1.6;
        coronaRef.current.visible = true;
        coronaMat.opacity = THREE.MathUtils.lerp(0.3, 0.85, chargeT);
      }
      if (chargeLightRef.current) {
        chargeLightRef.current.position.set(cx, cy, cz);
        chargeLightRef.current.intensity = THREE.MathUtils.lerp(0, 220, chargeT);
        chargeLightRef.current.visible = true;
      }
      if (filamentsRef.current) {
        filamentsRef.current.visible = true;
        filamentsRef.current.position.set(cx, cy, cz);
        filamentsRef.current.rotation.y += delta * 0.6;
        filamentsRef.current.children.forEach((child, i) => {
          const data = filamentData[i];
          const mesh = child as THREE.Mesh;
          if (mesh) {
            // converge: outer radius collapses toward the orb
            const r = THREE.MathUtils.lerp(data.radius * 1.6, data.radius * 0.35, chargeT);
            mesh.position.set(Math.cos(data.angle) * r, Math.sin(data.wobble + curl * 2) * 0.2, Math.sin(data.angle) * r);
            mesh.lookAt(0, 0, 0);
            const len = THREE.MathUtils.lerp(0.4, 1.1, chargeT);
            mesh.scale.set(1, len, 1);
            (mesh.material as THREE.MeshBasicMaterial).opacity = chargeT * 0.75;
          }
        });
      }
      if (flashRef.current) flashRef.current.visible = false;
      if (flashLightRef.current) flashLightRef.current.visible = false;
      if (ring1Ref.current) ring1Ref.current.visible = false;
      if (ring2Ref.current) ring2Ref.current.visible = false;
      if (groundGlowRef.current) groundGlowRef.current.visible = false;
      if (spearsRef.current) spearsRef.current.visible = false;
      if (burstParticlesRef.current) burstParticlesRef.current.visible = false;
      if (embersRef.current) embersRef.current.visible = false;
      if (runeShardsRef.current) runeShardsRef.current.visible = false;
      if (arcsRef.current) arcsRef.current.visible = false;
      if (debrisRef.current) debrisRef.current.visible = false;
      if (aftershockRef.current) aftershockRef.current.visible = false;
      if (aftershockLightRef.current) aftershockLightRef.current.visible = false;
    } else {
      if (chargeOrbRef.current) chargeOrbRef.current.visible = false;
      if (coronaRef.current) coronaRef.current.visible = false;
      if (chargeLightRef.current) chargeLightRef.current.visible = false;
      if (filamentsRef.current) filamentsRef.current.visible = false;
    }

    // Phase B: flash 0.5 - 0.85s -------------------------------------------
    if (t >= IMPACT_AT && t < FLASH_END) {
      const flashT = (t - IMPACT_AT) / (FLASH_END - IMPACT_AT);
      if (flashRef.current) {
        flashRef.current.visible = true;
        flashRef.current.position.set(cx, groundY + 2, cz);
        const flashRadius = THREE.MathUtils.lerp(0.5, 18, flashT);
        flashRef.current.scale.setScalar(flashRadius);
        (flashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - flashT * 1.2);
      }
      if (flashLightRef.current) {
        flashLightRef.current.position.set(cx, groundY + 3, cz);
        flashLightRef.current.intensity = THREE.MathUtils.lerp(420, 60, flashT);
        flashLightRef.current.visible = true;
      }
    } else if (t >= FLASH_END) {
      if (flashRef.current) flashRef.current.visible = false;
      if (flashLightRef.current) {
        // aftershock second flash: 0.85-1.8s, 80 -> 0
        if (t >= 0.85 && t < 1.8) {
          const aftT = (t - 0.85) / 0.95;
          flashLightRef.current.intensity = THREE.MathUtils.lerp(80, 0, aftT);
          flashLightRef.current.visible = true;
        } else if (flashLightRef.current.intensity > 1) {
          flashLightRef.current.intensity *= 0.9;
        } else {
          flashLightRef.current.visible = false;
        }
      }
    }

    // Phase C: rings 0.5 - 1.3s --------------------------------------------
    if (t >= IMPACT_AT && t < RING_END) {
      const ringT = (t - IMPACT_AT) / (RING_END - IMPACT_AT);
      if (ring1Ref.current) {
        ring1Ref.current.visible = true;
        ring1Ref.current.position.set(cx, groundY + 0.05, cz);
        ring1Ref.current.rotation.x = -Math.PI / 2;
        const outerR = THREE.MathUtils.lerp(1.5, 18, ringT);
        ring1Ref.current.scale.set(outerR, outerR, 1);
        (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.9, 0.1, ringT);
      }
      const ring2T = Math.min((t - IMPACT_AT) / (RING_END - IMPACT_AT - 0.12), 1);
      if (ring2Ref.current) {
        ring2Ref.current.visible = true;
        ring2Ref.current.position.set(cx, groundY + 0.06, cz);
        ring2Ref.current.rotation.x = -Math.PI / 2;
        const outerR = THREE.MathUtils.lerp(2, 22, Math.max(0, ring2T));
        ring2Ref.current.scale.set(outerR, outerR, 1);
        (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.8, 0.05, Math.max(0, ring2T));
      }
    } else if (t >= RING_END) {
      if (ring1Ref.current) ring1Ref.current.visible = false;
      if (ring2Ref.current) ring2Ref.current.visible = false;
    }

    // Phase D: ground glow 0.5 - 4.5s (18u parameter decay) -----------------
    if (t >= IMPACT_AT && t < 4.5) {
      const glowT = (t - IMPACT_AT) / 4.0;
      if (groundGlowRef.current) {
        groundGlowRef.current.visible = true;
        groundGlowRef.current.position.set(cx, groundY + 0.02, cz);
        groundGlowRef.current.rotation.x = -Math.PI / 2;
        groundGlowRef.current.scale.set(18, 18, 1);
        (groundGlowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.6, 0, glowT);
      }
    } else if (t >= 4.5) {
      if (groundGlowRef.current) groundGlowRef.current.visible = false;
    }

    // Phase E: spears 0.5 - 1.1s -------------------------------------------
    if (t >= IMPACT_AT && t < SPEAR_END) {
      const spearT = (t - IMPACT_AT) / (SPEAR_END - IMPACT_AT);
      if (spearsRef.current) {
        spearsRef.current.visible = true;
        const dummy = spearDummyRef.current;
        for (let i = 0; i < spearData.length; i++) {
          const data = spearData[i];
          const localT = Math.max(0, Math.min(1, spearT - data.phase));
          const dist = THREE.MathUtils.lerp(2, 20, localT);
          const height = THREE.MathUtils.lerp(4, 20, localT) * data.len;
          dummy.position.set(cx + Math.cos(data.angle) * dist, groundY + height * 0.5, cz + Math.sin(data.angle) * dist);
          dummy.rotation.set(data.tilt, data.angle + Math.PI / 2, 0);
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          spearsRef.current.setMatrixAt(i, dummy.matrix);
        }
        spearsRef.current.instanceMatrix.needsUpdate = true;
        (spearsRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.9, 0, Math.min(1, spearT * 1.5));
      }
    } else if (t >= SPEAR_END) {
      if (spearsRef.current) spearsRef.current.visible = false;
    }

    // Phase F: burst 0.5 - 3.0s (700, gravity curl) --------------------------
    if (t >= IMPACT_AT && t < BURST_END) {
      if (burstParticlesRef.current) {
        burstParticlesRef.current.visible = true;
        burstParticlesRef.current.position.set(cx, groundY + 1, cz);
        const pPos = burstParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = burstParticlesRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = burstParticlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const burstT = Math.min((t - IMPACT_AT) / (BURST_END - IMPACT_AT), 1);
        const fade = Math.max(0, 1.0 - burstT * 1.15);
        for (let i = 0; i < pPos.count; i++) {
          const ix = i * 3;
          // gravity curl: vortex pull toward collapse centre + downward suction
          const angle = Math.atan2(pPos.getZ(i), pPos.getX(i)) + delta * 1.4;
          const r = Math.hypot(pPos.getX(i), pPos.getZ(i));
          const pull = Math.max(0.2, r * 0.12);
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta * 0.35 + Math.cos(angle) * pull * delta * 0.4);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta * 0.35 + Math.sin(angle) * pull * delta * 0.4);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta * 0.35 - 1.5 * delta);
          vel.setY(i, vel.getY(i) - 3.0 * delta);
          vel.setX(i, vel.getX(i) * 0.995);
          vel.setZ(i, vel.getZ(i) * 0.995);
          col.setW(i, fade);
          void ix;
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (t >= BURST_END) {
      if (burstParticlesRef.current) burstParticlesRef.current.visible = false;
    }

    // Phase G: embers 3.0 - 5.0s -------------------------------------------
    if (t >= BURST_END && t < EMBER_END) {
      if (embersRef.current) {
        embersRef.current.visible = true;
        embersRef.current.position.set(cx, groundY, cz);
        const pPos = embersRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = embersRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = embersRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const emberT = (t - BURST_END) / (EMBER_END - BURST_END);
        const fade = Math.max(0, 1.0 - emberT);
        for (let i = 0; i < pPos.count; i++) {
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta + Math.sin(curl * 2 + i) * delta * 0.6);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta + Math.cos(curl * 1.7 + i) * delta * 0.6);
          vel.setX(i, vel.getX(i) * 0.98);
          vel.setZ(i, vel.getZ(i) * 0.98);
          if (pPos.getY(i) > 6) {
            pPos.setY(i, 0.4);
            pPos.setX(i, (Math.random() - 0.5) * 6);
            pPos.setZ(i, (Math.random() - 0.5) * 6);
          }
          col.setW(i, fade);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (t >= EMBER_END) {
      if (embersRef.current) embersRef.current.visible = false;
    }
    // Phase H: rune shards 0-1.5s (orbit converge, then weightless eject) ----
    if (t < 1.5) {
      if (runeShardsRef.current) {
        runeShardsRef.current.visible = true;
        const dummy = runeDummyRef.current;
        for (let i = 0; i < runeData.length; i++) {
          const d = runeData[i];
          if (t < IMPACT_AT) {
            const chargeT = t / IMPACT_AT;
            const angle = d.angle + curl * (1.2 + chargeT * 2.2);
            const r = THREE.MathUtils.lerp(d.radius + 1.2, d.radius * 0.35, chargeT);
            dummy.position.set(cx + Math.cos(angle) * r, cy + d.height * chargeT, cz + Math.sin(angle) * r);
          } else {
            const ejectT = Math.min((t - IMPACT_AT) / 1.0, 1);
            const angle = d.angle + curl * 3.4;
            const r = d.radius * 0.35 + d.eject * ejectT;
            dummy.position.set(cx + Math.cos(angle) * r, cy + d.height * (1 - ejectT) + ejectT * 1.6, cz + Math.sin(angle) * r);
          }
          dummy.lookAt(camera.position);
          dummy.rotateZ(curl * d.spin + i);
          dummy.scale.setScalar(d.size);
          dummy.updateMatrix();
          runeShardsRef.current.setMatrixAt(i, dummy.matrix);
        }
        runeShardsRef.current.instanceMatrix.needsUpdate = true;
        runeMat.opacity = t < IMPACT_AT ? THREE.MathUtils.lerp(0.5, 0.95, t / IMPACT_AT) : THREE.MathUtils.lerp(0.95, 0, Math.min((t - IMPACT_AT) / 1.0, 1));
      }
    } else if (runeShardsRef.current) {
      runeShardsRef.current.visible = false;
    }
    // Phase I: lightning arcs 0.5-1.0s (struck from the centre, 6 azimuths) ---
    if (t >= IMPACT_AT && t < 1.0) {
      if (arcsRef.current) {
        arcsRef.current.visible = true;
        arcsRef.current.position.set(cx, cy, cz);
        arcsRef.current.children.forEach((child, i) => {
          const line = child as THREE.LineSegments;
          line.visible = i % 2 === 0 || (Math.sin(curl * 31 + i) > -0.4);
        });
        boltMat.opacity = THREE.MathUtils.lerp(0.95, 0.1, (t - IMPACT_AT) / 0.5);
      }
    } else if (arcsRef.current) {
      arcsRef.current.visible = false;
    }
    // Phase J: debris 1.5-4.0s (speed curve rises then falls, dust rolling) ---
    if (t >= 1.5 && t < 4.0) {
      if (debrisRef.current) {
        debrisRef.current.visible = true;
        debrisRef.current.position.set(cx, groundY + 0.1, cz);
        const pPos = debrisRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = debrisRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = debrisRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const debrisT = (t - 1.5) / 2.5;
        const speedCurve = Math.sin(Math.PI * Math.min(debrisT * 1.6, 1));
        const fade = Math.max(0, 1.0 - debrisT);
        for (let i = 0; i < pPos.count; i++) {
          const swirl = Math.sin(curl * 1.8 + i) * 0.5;
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * speedCurve * delta + swirl * delta * 0.4);
          pPos.setY(i, Math.max(0.08, Math.min(pPos.getY(i) + vel.getY(i) * speedCurve * delta * 0.5, 1.2)));
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * speedCurve * delta - swirl * delta * 0.4);
          vel.setX(i, vel.getX(i) * 0.985);
          vel.setZ(i, vel.getZ(i) * 0.985);
          col.setW(i, fade * 0.8);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (debrisRef.current) {
      debrisRef.current.visible = false;
    }
    // Phase K: aftershock 0.85-1.8s (ring 0.7->28 + third point light 80->0) -
    if (t >= 0.85 && t < 1.8) {
      const aftT = (t - 0.85) / 0.95;
      if (aftershockRef.current) {
        aftershockRef.current.visible = true;
        aftershockRef.current.position.set(cx, groundY + 0.04, cz);
        aftershockRef.current.rotation.x = -Math.PI / 2;
        const outerR = THREE.MathUtils.lerp(0.7, 28, aftT);
        aftershockRef.current.scale.set(outerR, outerR, 1);
        aftershockMat.opacity = THREE.MathUtils.lerp(0.7, 0, aftT);
      }
      if (aftershockLightRef.current) {
        aftershockLightRef.current.position.set(cx, groundY + 3, cz);
        aftershockLightRef.current.intensity = THREE.MathUtils.lerp(80, 0, aftT);
        aftershockLightRef.current.visible = true;
      }
    } else {
      if (aftershockRef.current) aftershockRef.current.visible = false;
      if (aftershockLightRef.current) aftershockLightRef.current.visible = false;
    }

    if (t >= TOTAL_LIFE && !doneCalled.current) {
      doneCalled.current = true;
      if (onDoneRef.current) {
        onDoneRef.current();
      }
    }
  });

  return (
    <group>
      {/* charge cluster */}
      <mesh ref={chargeOrbRef} geometry={chargeOrbGeo} material={chargeOrbMat} visible={false} />
      <mesh ref={coronaRef} geometry={coronaGeo} material={coronaMat} visible={false} />
      <group ref={filamentsRef} visible={false}>
        {filamentGeos.map((geo, i) => (
          <mesh key={i} geometry={geo} material={filamentMat} />
        ))}
      </group>
      <pointLight ref={chargeLightRef} color="#8c6cff" intensity={0} distance={40} decay={2} visible={false} />

      {/* flash cluster */}
      <mesh ref={flashRef} geometry={flashGeo} material={flashMat} visible={false} />
      <pointLight ref={flashLightRef} color="#e6dcff" intensity={0} distance={60} decay={2} visible={false} />

      {/* ground rings + glow */}
      <mesh ref={ring1Ref} geometry={ringGeo} material={ring1Mat} visible={false} />
      <mesh ref={ring2Ref} geometry={ringGeo} material={ring2Mat} visible={false} />
      <mesh ref={groundGlowRef} geometry={groundGlowGeo} material={groundGlowMat} visible={false} />

      {/* radial spears */}
      <instancedMesh ref={spearsRef} args={[spearGeo, spearMat, 48]} visible={false} />

      {/* particles */}
      <points ref={burstParticlesRef} geometry={burstGeo} material={burstMat} visible={false} />
      <points ref={embersRef} geometry={embersGeo} material={embersMat} visible={false} />
      {/* FX boost: rune shards, lightning arcs, debris, aftershock */}
      <instancedMesh ref={runeShardsRef} args={[runeGeo, runeMat, 12]} visible={false} />
      <group ref={arcsRef} visible={false}>
        {boltGeos.map((geo, i) => (
          <lineSegments key={i} geometry={geo} material={boltMat} />
        ))}
      </group>
      <points ref={debrisRef} geometry={debrisGeo} material={debrisMat} visible={false} />
      <mesh ref={aftershockRef} geometry={aftershockGeo} material={aftershockMat} visible={false} />
      <pointLight ref={aftershockLightRef} color="#8c6cff" intensity={0} distance={60} decay={2} visible={false} />
    </group>
  );
}
