import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getModifiedHeight, getWaterEnabled } from "./InfiniteTerrain";

const SIZE = 64;
const CHUNK_SIZE = 16;

export function FluidSimulation({ craters, cameraPos, viewDistance = 3 }: { craters: { x: number; z: number; r: number; d: number }[]; cameraPos: THREE.Vector3; viewDistance?: number }) {
  const isWaterEnabled = getWaterEnabled();
  if (!isWaterEnabled) return null;

  const meshRef = useRef<THREE.Mesh>(null);
  const initialized = useRef(false);

  const tGrid = useRef(new Float32Array(SIZE * SIZE));
  const wGrid = useRef(new Float32Array(SIZE * SIZE));

  const flowL = useRef(new Float32Array(SIZE * SIZE));
  const flowR = useRef(new Float32Array(SIZE * SIZE));
  const flowU = useRef(new Float32Array(SIZE * SIZE));
  const flowD = useRef(new Float32Array(SIZE * SIZE));

  const cx = Math.floor(cameraPos.x / CHUNK_SIZE);
  const cz = Math.floor(cameraPos.z / CHUNK_SIZE);
  const centerWorldX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerWorldZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
  const range = (2 * viewDistance + 1) * CHUNK_SIZE;
  const cellSize = range / SIZE;

  const prevCx = useRef(cx);
  const prevCz = useRef(cz);
  const prevVD = useRef(viewDistance);
  const prevCratersLength = useRef(craters.length);

  useEffect(() => {
    const t = tGrid.current;
    const w = wGrid.current;

    const chunkShifted = cx !== prevCx.current || cz !== prevCz.current || viewDistance !== prevVD.current || craters.length < prevCratersLength.current;
    prevCratersLength.current = craters.length;
    if (chunkShifted) {
      prevCx.current = cx;
      prevCz.current = cz;
      prevVD.current = viewDistance;
      initialized.current = false;
    }

    if (!initialized.current) {
      flowL.current.fill(0);
      flowR.current.fill(0);
      flowU.current.fill(0);
      flowD.current.fill(0);

      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = x + z * SIZE;
          const wx = centerWorldX - range / 2 + x * cellSize;
          const wz = centerWorldZ - range / 2 + z * cellSize;
          const hInfo = getTerrainHeight(wx, wz);
          const baseH = getModifiedHeight(wx, wz, craters);
          t[idx] = baseH;
          w[idx] = hInfo.isWater ? Math.max(0, hInfo.baseWaterLevel - baseH) : 0;
        }
      }
      initialized.current = true;
    } else {
      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = x + z * SIZE;
          const wx = centerWorldX - range / 2 + x * cellSize;
          const wz = centerWorldZ - range / 2 + z * cellSize;
          t[idx] = getModifiedHeight(wx, wz, craters);
        }
      }
    }
  }, [craters, cx, cz, viewDistance, centerWorldX, centerWorldZ, range, cellSize]);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(range, range, SIZE - 1, SIZE - 1);
    g.rotateX(-Math.PI * 0.5);
    const colors = new Float32Array(SIZE * SIZE * 3);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [range]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vColor;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vColor = color;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying vec3 vViewPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          float depth = vColor.r;

          if (depth <= 0.08) {
            discard;
          }

          float alpha = smoothstep(0.08, 0.4, depth) * 0.75;

          vec3 shallowColor = vec3(0.0, 0.95, 1.0);
          vec3 deepColor = vec3(0.0, 0.12, 0.45);
          vec3 waterColor = mix(shallowColor, deepColor, smoothstep(0.08, 1.8, depth));

          vec2 flowDir = vec2(0.3, 0.2) * uTime;
          vec2 posUV = vWorldPosition.xz * 0.25;
          float wave1 = sin((posUV.x - flowDir.x) * 3.0) * cos((posUV.y - flowDir.y) * 3.0) * 0.5 + 0.5;
          float wave2 = sin((posUV.y - flowDir.y * 1.5) * 5.0) * cos((posUV.x - flowDir.x * 0.7) * 5.0) * 0.5 + 0.5;
          float caustics = pow(mix(wave1, wave2, 0.5), 4.0) * 0.22;

          float foamStrength = smoothstep(0.18, 0.08, depth);
          float foamNoise = sin(uTime * 4.5 + vWorldPosition.x * 8.0) * cos(uTime * 3.5 + vWorldPosition.z * 8.0) * 0.5 + 0.5;
          vec3 foamColor = vec3(1.0, 1.0, 1.0) * foamStrength * foamNoise * 0.35;

          vec3 finalColor = waterColor + vec3(caustics) + foamColor;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(0.03, delta);

    const t = tGrid.current;
    const w = wGrid.current;

    for (let z = 0; z < SIZE; z++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = x + z * SIZE;
        const wx = centerWorldX - range / 2 + x * cellSize;
        const wz = centerWorldZ - range / 2 + z * cellSize;
        t[idx] = getModifiedHeight(wx, wz, craters);
      }
    }

    const fL = flowL.current;
    const fR = flowR.current;
    const fU = flowU.current;
    const fD = flowD.current;

    const nextW = new Float32Array(SIZE * SIZE);
    nextW.set(w);

    const flowSpeed = 0.55;

    for (let z = 1; z < SIZE - 1; z++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const idx = x + z * SIZE;
        if (w[idx] <= 0) continue;

        const hSelf = t[idx] + w[idx];
        const idxL = idx - 1;
        const idxR = idx + 1;
        const idxU = idx - SIZE;
        const idxD = idx + SIZE;

        const hL = t[idxL] + w[idxL];
        const hR = t[idxR] + w[idxR];
        const hU = t[idxU] + w[idxU];
        const hD = t[idxD] + w[idxD];

        fL[idx] = Math.max(0, fL[idx] + (hSelf - hL) * flowSpeed);
        fR[idx] = Math.max(0, fR[idx] + (hSelf - hR) * flowSpeed);
        fU[idx] = Math.max(0, fU[idx] + (hSelf - hU) * flowSpeed);
        fD[idx] = Math.max(0, fD[idx] + (hSelf - hD) * flowSpeed);

        let sumFlow = fL[idx] + fR[idx] + fU[idx] + fD[idx];
        if (sumFlow > 0) {
          const maxOutflow = w[idx] / dt;
          if (sumFlow > maxOutflow) {
            const factor = maxOutflow / sumFlow;
            fL[idx] *= factor;
            fR[idx] *= factor;
            fU[idx] *= factor;
            fD[idx] *= factor;
            sumFlow = maxOutflow;
          }
        }
      }
    }

    for (let z = 1; z < SIZE - 1; z++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const idx = x + z * SIZE;
        const outFlow = (fL[idx] + fR[idx] + fU[idx] + fD[idx]) * dt;
        const inFlow = (fR[idx - 1] + fL[idx + 1] + fD[idx - SIZE] + fU[idx + SIZE]) * dt;
        nextW[idx] = Math.max(0, w[idx] + inFlow - outFlow);
      }
    }

    wGrid.current.set(nextW);

    if (meshRef.current) {
      const g = meshRef.current.geometry as THREE.PlaneGeometry;
      const pos = g.attributes.position;
      const arr = pos.array as Float32Array;
      const colAttr = g.attributes.color as THREE.BufferAttribute;
      const colArr = colAttr.array as Float32Array;
      const time = state.clock.elapsedTime;

      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = x + z * SIZE;
          const localW = w[idx];
          const vertexIdx = x + z * SIZE;

          colArr[vertexIdx * 3] = localW;
          colArr[vertexIdx * 3 + 1] = t[idx];
          colArr[vertexIdx * 3 + 2] = 0;

          if (localW > 0.08) {
            const wave = Math.sin(x * 0.25 + time * 1.6) * 0.06 + Math.cos(z * 0.25 + time * 1.3) * 0.06;
            arr[vertexIdx * 3 + 1] = t[idx] + localW + wave;
          } else {
            arr[vertexIdx * 3 + 1] = t[idx] - 1.5;
          }
        }
      }
      pos.needsUpdate = true;
      colAttr.needsUpdate = true;
      g.computeVertexNormals();
    }

    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} position={[centerWorldX, 0, centerWorldZ]} geometry={geo} material={mat} receiveShadow />
  );
}
