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
      if (initialized.current) {
        const oldCenterWorldX = prevCx.current * CHUNK_SIZE + CHUNK_SIZE / 2;
        const oldCenterWorldZ = prevCz.current * CHUNK_SIZE + CHUNK_SIZE / 2;
        const oldRange = (2 * prevVD.current + 1) * CHUNK_SIZE;
        const oldCellSize = oldRange / SIZE;
        const chunkDataMap: Record<string, Record<string, number>> = {};
        for (let z = 0; z < SIZE; z++) {
          for (let x = 0; x < SIZE; x++) {
            const idx = x + z * SIZE;
            const localW = w[idx];
            if (localW > 0.01) {
              const wx = oldCenterWorldX - oldRange / 2 + x * oldCellSize;
              const wz = oldCenterWorldZ - oldRange / 2 + z * oldCellSize;
              const chunkX = Math.floor(wx / CHUNK_SIZE);
              const chunkZ = Math.floor(wz / CHUNK_SIZE);
              const chunkKey = `spell_lab_chunk_${chunkX}_${chunkZ}`;
              if (!chunkDataMap[chunkKey]) {
                chunkDataMap[chunkKey] = {};
              }
              const coordKey = `${Math.round(wx * 10) / 10}_${Math.round(wz * 10) / 10}`;
              chunkDataMap[chunkKey][coordKey] = localW;
            }
          }
        }
        if (typeof window !== "undefined") {
          Object.keys(chunkDataMap).forEach((chunkKey) => {
            const waterMap = chunkDataMap[chunkKey];
            const saved = localStorage.getItem(chunkKey);
            let parsed: any = {};
            if (saved) {
              try {
                parsed = JSON.parse(saved);
              } catch {}
            }
            parsed.water = waterMap;
            localStorage.setItem(chunkKey, JSON.stringify(parsed));
          });
        }
      }
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

      const loadedChunks: Record<string, any> = {};
      if (typeof window !== "undefined") {
        const minChunkX = Math.floor((centerWorldX - range / 2) / CHUNK_SIZE);
        const maxChunkX = Math.floor((centerWorldX + range / 2) / CHUNK_SIZE);
        const minChunkZ = Math.floor((centerWorldZ - range / 2) / CHUNK_SIZE);
        const maxChunkZ = Math.floor((centerWorldZ + range / 2) / CHUNK_SIZE);
        for (let chx = minChunkX - 1; chx <= maxChunkX + 1; chx++) {
          for (let chz = minChunkZ - 1; chz <= maxChunkZ + 1; chz++) {
            const chunkKey = `spell_lab_chunk_${chx}_${chz}`;
            const saved = localStorage.getItem(chunkKey);
            if (saved) {
              try {
                loadedChunks[chunkKey] = JSON.parse(saved);
              } catch {}
            }
          }
        }
      }

      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = x + z * SIZE;
          const wx = centerWorldX - range / 2 + x * cellSize;
          const wz = centerWorldZ - range / 2 + z * cellSize;
          const hInfo = getTerrainHeight(wx, wz);
          const baseH = getModifiedHeight(wx, wz, craters);
          t[idx] = baseH;

          const chunkX = Math.floor(wx / CHUNK_SIZE);
          const chunkZ = Math.floor(wz / CHUNK_SIZE);
          const chunkKey = `spell_lab_chunk_${chunkX}_${chunkZ}`;
          const chunkData = loadedChunks[chunkKey];
          const coordKey = `${Math.round(wx * 10) / 10}_${Math.round(wz * 10) / 10}`;
          
          if (chunkData && chunkData.water && chunkData.water[coordKey] !== undefined) {
            w[idx] = chunkData.water[coordKey];
          } else {
            w[idx] = hInfo.isWater ? Math.max(0, hInfo.baseWaterLevel - baseH) : 0;
          }
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

  useEffect(() => {
    return () => {
      if (initialized.current) {
        const w = wGrid.current;
        const currentCenterWorldX = prevCx.current * CHUNK_SIZE + CHUNK_SIZE / 2;
        const currentCenterWorldZ = prevCz.current * CHUNK_SIZE + CHUNK_SIZE / 2;
        const currentRange = (2 * prevVD.current + 1) * CHUNK_SIZE;
        const currentCellSize = currentRange / SIZE;
        const chunkDataMap: Record<string, Record<string, number>> = {};
        for (let z = 0; z < SIZE; z++) {
          for (let x = 0; x < SIZE; x++) {
            const idx = x + z * SIZE;
            const localW = w[idx];
            if (localW > 0.01) {
              const wx = currentCenterWorldX - currentRange / 2 + x * currentCellSize;
              const wz = currentCenterWorldZ - currentRange / 2 + z * currentCellSize;
              const chunkX = Math.floor(wx / CHUNK_SIZE);
              const chunkZ = Math.floor(wz / CHUNK_SIZE);
              const chunkKey = `spell_lab_chunk_${chunkX}_${chunkZ}`;
              if (!chunkDataMap[chunkKey]) {
                chunkDataMap[chunkKey] = {};
              }
              const coordKey = `${Math.round(wx * 10) / 10}_${Math.round(wz * 10) / 10}`;
              chunkDataMap[chunkKey][coordKey] = localW;
            }
          }
        }
        if (typeof window !== "undefined") {
          Object.keys(chunkDataMap).forEach((chunkKey) => {
            const waterMap = chunkDataMap[chunkKey];
            const saved = localStorage.getItem(chunkKey);
            let parsed: any = {};
            if (saved) {
              try {
                parsed = JSON.parse(saved);
              } catch {}
            }
            parsed.water = waterMap;
            localStorage.setItem(chunkKey, JSON.stringify(parsed));
          });
        }
      }
    };
  }, []);


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

        vec2 hash22(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float voronoi(vec2 x, float time) {
          vec2 n = floor(x);
          vec2 f = fract(x);
          float m = 8.0;
          for(int j=-1; j<=1; j++) {
            for(int i=-1; i<=1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash22(n + g);
              o = 0.5 + 0.5 * sin(time + o * 6.2831);
              vec2 r = g - f + o;
              float d = dot(r, r);
              if(d < m) {
                m = d;
              }
            }
          }
          return sqrt(m);
        }

        void main() {
          float depth = vColor.r;

          if (depth <= 0.02) {
            discard;
          }

          float alpha = smoothstep(0.0, 0.4, depth) * 0.8;

          vec3 shallowColor = vec3(0.0, 0.85, 0.95);
          vec3 deepColor = vec3(0.02, 0.08, 0.28);
          vec3 waterColor = mix(shallowColor, deepColor, smoothstep(0.0, 2.0, depth));

          vec2 uv = vWorldPosition.xz * 0.4;
          float v1 = voronoi(uv + vec2(uTime * 0.1, uTime * 0.05), uTime * 1.5);
          float v2 = voronoi(uv * 1.8 - vec2(uTime * 0.05, -uTime * 0.08), uTime * 2.0 + 3.14);
          float c1 = 1.0 - v1;
          float c2 = 1.0 - v2;
          float caustics = pow(mix(c1, c2, 0.5), 3.0) * 0.35;

          float foamStrength = smoothstep(0.18, 0.02, depth);
          float n1 = sin(vWorldPosition.x * 6.0 + uTime * 2.0) * cos(vWorldPosition.z * 4.0 - uTime * 1.5);
          float n2 = sin((vWorldPosition.x - vWorldPosition.z) * 5.0 - uTime * 2.5) * 0.5 + 0.5;
          float foamNoise = mix(n1 * 0.5 + 0.5, n2, 0.5);
          vec3 foamColor = vec3(1.0, 1.0, 1.0) * foamStrength * foamNoise * 0.4;

          vec3 viewDir = normalize(vViewPosition);
          vec3 normalDir = normalize(vNormal);
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, normalDir)), 3.0);

          vec3 lightDir = normalize(vec3(-0.5, 0.8, 0.3));
          vec3 halfDir = normalize(viewDir + lightDir);
          float spec = pow(max(0.0, dot(normalDir, halfDir)), 64.0) * 0.6;

          vec3 finalColor = waterColor + vec3(caustics) * 0.6 + foamColor * 0.4 + vec3(spec + fresnel * 0.15);

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
