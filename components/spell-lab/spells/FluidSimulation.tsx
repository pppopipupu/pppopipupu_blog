import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getModifiedHeight } from "./InfiniteTerrain";

const SIZE = 64;
const CHUNK_SIZE = 16;

export function FluidSimulation({ craters, cameraPos, viewDistance = 3 }: { craters: { x: number; z: number; r: number; d: number }[]; cameraPos: THREE.Vector3; viewDistance?: number }) {
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

  useEffect(() => {
    const t = tGrid.current;
    const w = wGrid.current;

    const chunkShifted = cx !== prevCx.current || cz !== prevCz.current || viewDistance !== prevVD.current;
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
    return g;
  }, [range]);

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
      const time = state.clock.elapsedTime;

      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = x + z * SIZE;
          const localW = w[idx];
          const vertexIdx = x + z * SIZE;
          if (localW > 0.08) {
            const wave = Math.sin(x * 0.25 + time * 1.6) * 0.06 + Math.cos(z * 0.25 + time * 1.3) * 0.06;
            arr[vertexIdx * 3 + 1] = t[idx] + localW + wave;
          } else {
            arr[vertexIdx * 3 + 1] = t[idx] - 1.5;
          }
        }
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} position={[centerWorldX, 0, centerWorldZ]} geometry={geo} receiveShadow>
      <meshStandardMaterial
        transparent
        opacity={0.65}
        color="#005d6e"
        roughness={0.1}
        metalness={0.8}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
