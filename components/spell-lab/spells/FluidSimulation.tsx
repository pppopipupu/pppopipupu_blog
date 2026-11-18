import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
	cameraPosition,
	cos,
	cross,
	dFdx,
	dFdy,
	float,
	max,
	mix,
	normalize,
	positionWorld,
	pow,
	sin,
	smoothstep,
	uniform,
	vec2,
	vec3,
	vertexColor,
} from "three/tsl";
import { getTerrainHeight, getModifiedHeight, getWaterEnabled } from "./InfiniteTerrain";
import { createWaterBindings, type WaterBindings } from "../webgpu/water-bindings";
import { CHUNK_SIZE } from "../types";

const SIZE = 64;

function rebuildWetIndices(w: Float32Array): number[] {
	const wet: number[] = [];
	for (let idx = 0; idx < SIZE * SIZE; idx++) {
		if (w[idx] > 0.08) {
			wet.push(idx);
		}
	}
	return wet;
}
export function FluidSimulation({ craters, cameraPos, viewDistance = 3 }: { craters: { x: number; z: number; r: number; d: number }[]; cameraPos: THREE.Vector3; viewDistance?: number }) {
	const isWaterEnabled = getWaterEnabled();
	if (!isWaterEnabled) return null;

	const meshRef = useRef<THREE.Mesh>(null);
	const initialized = useRef(false);

	const tGrid = useRef(new Float32Array(SIZE * SIZE));
	const wGrid = useRef(new Float32Array(SIZE * SIZE));
	// 水面语义: baseLevelGrid 存真实河流水面高 baseWaterLevel(初始化时取, crater 后不变),
	// 水面 Y = baseLevelGrid + wave, 不用 t+w(避免 crater 污染水面).
	const baseLevelGrid = useRef(new Float32Array(SIZE * SIZE));
	const isRiverGrid = useRef(new Uint8Array(SIZE * SIZE));
	// 渲染子集缓存: localW > 0.08 顶点索引, useFrame 只更新子集而非全 4096 顶点.
	const wetIndices = useRef<number[]>([]);
	const frameCount = useRef(0);
	// 地形/crater/chunk 变化后全量刷新干顶点 Y(t-1.5)一次, 之后每 2 帧更新子集.
	const geoDirty = useRef(true);

	const flowL = useRef(new Float32Array(SIZE * SIZE));
	const flowR = useRef(new Float32Array(SIZE * SIZE));
	const flowU = useRef(new Float32Array(SIZE * SIZE));
	const flowD = useRef(new Float32Array(SIZE * SIZE));
	const nextWGrid = useRef(new Float32Array(SIZE * SIZE));

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

		const chunkShifted =
			cx !== prevCx.current || cz !== prevCz.current || viewDistance !== prevVD.current || craters.length < prevCratersLength.current;
		prevCratersLength.current = craters.length;
		if (chunkShifted) {
			if (initialized.current) {
				const oldCenterWorldX = prevCx.current * CHUNK_SIZE + CHUNK_SIZE / 2;
				const oldCenterWorldZ = prevCz.current * CHUNK_SIZE + CHUNK_SIZE / 2;
				const oldRange = (2 * prevVD.current + 1) * CHUNK_SIZE;
				const oldCellSize = oldRange / SIZE;
				const chunkDataMap: Record<string, Record<string, number>> = {};
				for (let idx = 0; idx < SIZE * SIZE; idx++) {
					const localW = w[idx];
					if (localW > 0.01) {
						const x = idx % SIZE;
						const z = (idx / SIZE) | 0;
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
				if (typeof window !== "undefined") {
					Object.keys(chunkDataMap).forEach((chunkKey) => {
						const waterMap = chunkDataMap[chunkKey];
						const saved = localStorage.getItem(chunkKey);
						let parsed: Record<string, unknown> = {};
						if (saved) {
							try {
								parsed = JSON.parse(saved) as Record<string, unknown>;
							} catch {}
						}
						parsed.water = waterMap;
						const next = JSON.stringify(parsed);
						// 内容无变化不写 localStorage, 减少无谓写入.
						if (next !== saved) {
							localStorage.setItem(chunkKey, next);
						}
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

			const loadedChunks: Record<string, unknown> = {};
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

			for (let idx = 0; idx < SIZE * SIZE; idx++) {
				const x = idx % SIZE;
				const z = (idx / SIZE) | 0;
				const wx = centerWorldX - range / 2 + x * cellSize;
				const wz = centerWorldZ - range / 2 + z * cellSize;
				const hInfo = getTerrainHeight(wx, wz);
				const baseH = getModifiedHeight(wx, wz, craters);
				t[idx] = baseH;
				// 水面高(baseWaterLevel)取未改动河流水面, crater 后保持不变.
				baseLevelGrid.current[idx] = hInfo.baseWaterLevel;
				isRiverGrid.current[idx] = hInfo.isWater ? 1 : 0;

				const chunkX = Math.floor(wx / CHUNK_SIZE);
				const chunkZ = Math.floor(wz / CHUNK_SIZE);
				const chunkKey = `spell_lab_chunk_${chunkX}_${chunkZ}`;
				const chunkData = loadedChunks[chunkKey] as { water?: Record<string, number> } | undefined;
				const coordKey = `${Math.round(wx * 10) / 10}_${Math.round(wz * 10) / 10}`;

				if (chunkData && chunkData.water && chunkData.water[coordKey] !== undefined) {
					w[idx] = chunkData.water[coordKey];
				} else {
					w[idx] = hInfo.isWater ? Math.max(0, hInfo.baseWaterLevel - baseH) : 0;
				}
			}
			initialized.current = true;
			geoDirty.current = true;
			wetIndices.current = rebuildWetIndices(w);
		} else {
			// crater 变化: t 跟随 crater 变化, 河流格水深 w = baseLevel - t 重算,
			// baseLevel 不变 => 水面不被 crater 下沉.
			for (let idx = 0; idx < SIZE * SIZE; idx++) {
				const x = idx % SIZE;
				const z = (idx / SIZE) | 0;
				const wx = centerWorldX - range / 2 + x * cellSize;
				const wz = centerWorldZ - range / 2 + z * cellSize;
				t[idx] = getModifiedHeight(wx, wz, craters);
				if (isRiverGrid.current[idx] === 1) {
					w[idx] = Math.max(0, baseLevelGrid.current[idx] - t[idx]);
				}
			}
			geoDirty.current = true;
			wetIndices.current = rebuildWetIndices(w);
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
				for (let idx = 0; idx < SIZE * SIZE; idx++) {
					const localW = w[idx];
					if (localW > 0.01) {
						const x = idx % SIZE;
						const z = (idx / SIZE) | 0;
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
				if (typeof window !== "undefined") {
					Object.keys(chunkDataMap).forEach((chunkKey) => {
						const waterMap = chunkDataMap[chunkKey];
						const saved = localStorage.getItem(chunkKey);
						let parsed: Record<string, unknown> = {};
						if (saved) {
							try {
								parsed = JSON.parse(saved) as Record<string, unknown>;
							} catch {}
						}
						parsed.water = waterMap;
						const next = JSON.stringify(parsed);
						// 内容无变化不写 localStorage, 减少无谓写入.
						if (next !== saved) {
							localStorage.setItem(chunkKey, next);
						}
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

	const bindingsRef = useRef<WaterBindings | null>(null);
	const uTimeNodeRef = useRef<ReturnType<typeof uniform> | null>(null);

	const mat = useMemo(() => {
		const bindings = createWaterBindings();
		bindingsRef.current = bindings;
		const material = new MeshBasicNodeMaterial();
		material.vertexColors = true;
		material.transparent = true;
		material.depthWrite = false;
		material.side = THREE.DoubleSide;
		material.polygonOffset = true;
		material.polygonOffsetFactor = -1;
		material.polygonOffsetUnits = -1;
		material.alphaTest = 0.02;

		const uTimeNode = uniform(0);
		uTimeNodeRef.current = uTimeNode;

		const depth = vertexColor().r;

		depth.lessThanEqual(0.02).discard();

		const alpha = smoothstep(0.0, 0.4, depth).mul(0.8);
		material.opacityNode = alpha;

		// 避大面积>1.0 逼近阈值: 浅色 0,0.85,0.95→0.02,0.62,0.72、深色 0.02,0.08,0.28→0.03,0.07,0.22 (降低 base 水色亮度，避免与 caustics/foam/spec 累加后大面积逼近 Bloom 阈值 1.1 洗白)
		const shallowColor = vec3(0.02, 0.62, 0.72);
		const deepColor = vec3(0.03, 0.07, 0.22);
		const waterColor = mix(shallowColor, deepColor, smoothstep(0.0, 2.0, depth));

		const uv = positionWorld.xz.mul(0.4);

		const v1: unknown = bindings.voronoi2({
			p: uv.add(vec2(uTimeNode.mul(0.1), uTimeNode.mul(0.05))),
			time: uTimeNode.mul(1.5),
		});
		const v2: unknown = bindings.voronoi2({
			p: uv.mul(1.8).sub(vec2(uTimeNode.mul(0.05), uTimeNode.mul(-0.08))),
			time: uTimeNode.add(3.14).mul(2.0),
		});

		const c1 = float(1.0).sub(v1 as never);
		const c2 = float(1.0).sub(v2 as never);
		const caustics = pow(mix(c1, c2, 0.5), 3.0).mul(0.35);

		const foamStrength = smoothstep(0.18, 0.02, depth);
		// 性能: foam 高频 sin 6.0→3.0, 减 WebGPU 片元 sin 成本; caustics pow(...,3.0) 保留.
		const n1 = sin(positionWorld.x.mul(3.0).add(uTimeNode.mul(2.0))).mul(cos(positionWorld.z.mul(4.0).sub(uTimeNode.mul(1.5))));
		const n2 = sin(positionWorld.x.sub(positionWorld.z).mul(5.0).sub(uTimeNode.mul(2.5))).mul(0.5).add(0.5);
		const foamNoise = mix(n1.mul(0.5).add(0.5), n2, 0.5);
		const foamColor = vec3(1.0, 1.0, 1.0).mul(foamStrength).mul(foamNoise).mul(0.4);

		const viewDir: unknown = normalize((cameraPosition as unknown as any).sub(positionWorld));
		const normalDir: unknown = normalize((cross as unknown as any)(dFdx(positionWorld), dFdy(positionWorld)));
		const normalDirAdj: unknown = (normalDir as any).y.lessThan(0.0).select((normalDir as any).negate(), normalDir);
		const fresnel = pow(float(1.0).sub(max(0.0, (viewDir as any).dot(normalDirAdj))), 3.0);

		const lightDir = normalize(vec3(-0.5, 0.8, 0.3));
		const halfDir = normalize((viewDir as any).add(lightDir));
		const spec = pow(max(0.0, (normalDirAdj as any).dot(halfDir)), 64.0).mul(0.6);

		// 避大面积>1.0 逼近阈值: caustics 0.6→0.30、foam 0.4→0.20、fresnel 0.15→0.08、spec 0.6 保留 (HDR 累加压低后大面积水体低于 Bloom 阈值 1.1, 仅 specular 细碎点仍越阈)
		const finalColor = waterColor.add(vec3(caustics).mul(0.30)).add(foamColor.mul(0.20)).add(vec3(spec.add(fresnel.mul(0.08))));
		material.colorNode = finalColor;

		return material;
	}, []);

	useFrame((state) => {
		// shader 时间每帧推进(voronoi/caustics 动画不变), 顶点只每 2 帧更新:
		// 波动 sin/cos 在 60Hz 下两帧差 ~0.06*0.11, 肉眼不可分辨, JS 成本减半.
		if (uTimeNodeRef.current) {
			(uTimeNodeRef.current as unknown as { value: number }).value = state.clock.elapsedTime;
		}
		if (!meshRef.current) {
			return;
		}
		frameCount.current++;
		const dirty = geoDirty.current;
		if (frameCount.current % 2 === 1 && !dirty) {
			return;
		}
		const g = meshRef.current.geometry as THREE.PlaneGeometry;
		const pos = g.attributes.position;
		const arr = pos.array as Float32Array;
		const colAttr = g.attributes.color as THREE.BufferAttribute;
		const colArr = colAttr.array as Float32Array;
		const time = state.clock.elapsedTime;
		const w = wGrid.current;
		const t = tGrid.current;
		const baseLevel = baseLevelGrid.current;
		const isRiver = isRiverGrid.current;

		if (dirty) {
			// 地形/crater/chunk 刚变: 全量对齐干顶点 Y=t-1.5 与 color, 湿顶点走子集.
			for (let idx = 0; idx < SIZE * SIZE; idx++) {
				const localW = w[idx];
				colArr[idx * 3] = localW;
				colArr[idx * 3 + 1] = t[idx];
				colArr[idx * 3 + 2] = 0;
				if (localW <= 0.08) {
					arr[idx * 3 + 1] = t[idx] - 1.5;
				}
			}
			geoDirty.current = false;
		}
		// 仅更新湿子集: 水面 Y = baseWaterLevel + wave(不随 crater 下沉).
		// 非河流遗存湿格(极少数/历史存档)回落 t+w, 保证水深一致.
		const wet = wetIndices.current;
		for (let i = 0; i < wet.length; i++) {
			const idx = wet[i];
			const x = idx % SIZE;
			const z = (idx / SIZE) | 0;
			const localW = w[idx];
			colArr[idx * 3] = localW;
			colArr[idx * 3 + 1] = t[idx];
			const wave = Math.sin(x * 0.25 + time * 1.6) * 0.06 + Math.cos(z * 0.25 + time * 1.3) * 0.06;
			const surfaceY = isRiver[idx] === 1 ? baseLevel[idx] : t[idx] + localW;
			arr[idx * 3 + 1] = surfaceY + wave;
		}
		pos.needsUpdate = true;
		colAttr.needsUpdate = true;
	});

	useEffect(() => {
		return () => {
			if (geo) {
				geo.dispose();
			}
		};
	}, [geo]);

	useEffect(() => {
		return () => {
			if (mat) {
				mat.dispose();
			}
			bindingsRef.current = null;
			uTimeNodeRef.current = null;
		};
	}, []);

	return <mesh ref={meshRef} position={[centerWorldX, 0, centerWorldZ]} geometry={geo} material={mat} receiveShadow />;
}
