"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const TRAIL_LENGTH = 80;
const SPARK_COUNT = 60;
const TOTAL = TRAIL_LENGTH + SPARK_COUNT;

const vertexShader = `
attribute float aSize;
attribute float aLife;
attribute float aRandom;
uniform float uTime;
uniform float uPixelRatio;
varying float vLife;
varying float vRandom;

void main() {
  vLife = aLife;
  vRandom = aRandom;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.0, 500.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uTime;
varying float vLife;
varying float vRandom;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 xv = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(xv) - 0.5;
  vec3 ox = floor(xv + 0.5);
  vec3 a0 = xv - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  float nd = dist * 2.0;

  float coreGlow = exp(-nd * nd * 6.0);

  float ring = exp(-pow(nd - 0.38, 2.0) * 50.0) * 0.35;

  float angle = atan(center.y, center.x);
  float noiseVal = snoise(vec2(angle * 1.5 + uTime * 2.5, nd * 3.0 + vRandom * 20.0));
  float energy = max(0.0, noiseVal) * smoothstep(0.5, 0.12, nd) * 0.3;

  float runePattern = 0.0;
  if (vLife < 0.25) {
    float runeNoise = snoise(vec2(angle * 3.0 + uTime * 1.5, nd * 5.0));
    runePattern = smoothstep(0.2, 0.6, abs(runeNoise)) * smoothstep(0.5, 0.2, nd) * 0.2 * (1.0 - vLife / 0.25);
  }

  float totalGlow = coreGlow + ring + energy + runePattern;

  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 cyan = vec3(0.2, 0.85, 1.0);
  vec3 blue = vec3(0.35, 0.15, 1.0);
  vec3 purple = vec3(0.6, 0.0, 0.85);
  vec3 darkPurple = vec3(0.25, 0.0, 0.45);

  float t = vLife + sin(uTime * 1.8 + vRandom * 6.283) * 0.08;
  t = clamp(t, 0.0, 1.0);

  vec3 color = darkPurple;
  if (t < 0.1) {
    color = mix(white, cyan, t / 0.1);
  } else if (t < 0.35) {
    color = mix(cyan, blue, (t - 0.1) / 0.25);
  } else if (t < 0.7) {
    color = mix(blue, purple, (t - 0.35) / 0.35);
  } else {
    color = mix(purple, darkPurple, (t - 0.7) / 0.3);
  }

  color += white * pow(coreGlow, 4.0) * 0.6 * (1.0 - t * 0.7);
  color += cyan * ring * 0.4;
  color += cyan * runePattern;

  float fade = pow(1.0 - t, 1.8);
  float alpha = totalGlow * fade * 0.85;

  gl_FragColor = vec4(color * totalGlow, alpha);
}
`;

interface SparkData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
}

function ArcaneTrail() {
  const { camera } = useThree();
  const mouseWorld = useRef(new THREE.Vector3(999, 999, 0));
  const trailBuf = useRef(new Float32Array(TRAIL_LENGTH * 3).fill(999));
  const sparks = useRef<SparkData[] | null>(null);
  const sparkIdx = useRef(0);
  const hasMoved = useRef(false);

  if (sparks.current === null) {
    sparks.current = Array.from({ length: SPARK_COUNT }, () => ({
      x: 999, y: 999, z: 0, vx: 0, vy: 0, vz: 0, life: 1, maxLife: 1,
    }));
  }

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(TOTAL * 3);
    const sizes = new Float32Array(TOTAL);
    const lives = new Float32Array(TOTAL);
    const randoms = new Float32Array(TOTAL);

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      sizes[i] = (1.0 - (i / TRAIL_LENGTH) * 0.88);
      lives[i] = i / TRAIL_LENGTH;
      randoms[i] = Math.random();
    }

    for (let i = 0; i < SPARK_COUNT; i++) {
      const idx = TRAIL_LENGTH + i;
      sizes[idx] = 0.12 + Math.random() * 0.32;
      lives[idx] = 1.0;
      randoms[idx] = Math.random();
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useEffect(() => {
    const _v = new THREE.Vector3();
    const onMove = (e: MouseEvent) => {
      hasMoved.current = true;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      _v.set(nx, ny, 0.5).unproject(camera);
      _v.sub(camera.position).normalize();
      const d = -camera.position.z / _v.z;
      mouseWorld.current.copy(camera.position).add(_v.multiplyScalar(d));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [camera]);

  useFrame((state, delta) => {
    if (!hasMoved.current) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const livesAttr = geometry.getAttribute("aLife") as THREE.BufferAttribute;

    const trail = trailBuf.current;
    for (let i = (TRAIL_LENGTH - 1) * 3; i >= 3; i -= 3) {
      trail[i] = trail[i - 3];
      trail[i + 1] = trail[i - 2];
      trail[i + 2] = trail[i - 1];
    }
    trail[0] = mouseWorld.current.x;
    trail[1] = mouseWorld.current.y;
    trail[2] = mouseWorld.current.z;

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      posAttr.setXYZ(i, trail[i * 3], trail[i * 3 + 1], trail[i * 3 + 2]);
    }

    const dt = Math.min(delta, 0.05);
    const sparkArr = sparks.current!;
    for (let s = 0; s < 2; s++) {
      const si = sparkIdx.current % SPARK_COUNT;
      sparkIdx.current++;
      const ti = Math.floor(Math.random() * 15);
      const sp = sparkArr[si];
      sp.x = trail[ti * 3];
      sp.y = trail[ti * 3 + 1];
      sp.z = trail[ti * 3 + 2];
      sp.vx = (Math.random() - 0.5) * 0.8;
      sp.vy = Math.random() * 0.5 + 0.15;
      sp.vz = (Math.random() - 0.5) * 0.3;
      sp.life = 0;
      sp.maxLife = Math.random() * 1.2 + 0.5;
    }

    for (let i = 0; i < SPARK_COUNT; i++) {
      const sp = sparkArr[i];
      sp.life += dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.z += sp.vz * dt;
      sp.vx *= 0.97;
      sp.vy *= 0.97;

      const idx = TRAIL_LENGTH + i;
      posAttr.setXYZ(idx, sp.x, sp.y, sp.z);
      livesAttr.setX(idx, Math.min(sp.life / sp.maxLife, 1.0));
    }

    posAttr.needsUpdate = true;
    livesAttr.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} />;
}

export default function ArcaneCursorTrail() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 10000,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: false }}
        events={() => ({ enabled: false, priority: 0, compute: () => false } as any)}
      >
        <ArcaneTrail />
      </Canvas>
    </div>
  );
}
