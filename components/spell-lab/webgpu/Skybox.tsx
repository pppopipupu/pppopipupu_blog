"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
	exp,
	float,
	Fn,
	mix,
	normalize,
	positionGeometry,
	smoothstep,
	uniform,
	vec3,
} from "three/tsl";
import { tslExports } from "vgpu/three";

/**
 * Camera-following sky dome: a TSL gradient (day / sunset / night) plus a
 * sun/moon glow bound from inline WGSL through `vgpu/three` `tslExports`.
 *
 * Direction is derived from `normalize(positionGeometry)` (the sphere's local
 * direction, which equals the view direction because the dome is centred on
 * the camera), so no world-space or normal accessors are required.
 */

const SKY_WGSL = /* wgsl */ `
fn sunGlow(dir: vec3f, sunDir: vec3f) -> f32 {
  let d = max(dot(dir, sunDir), 0.0);
  return pow(d, 15.0);
}

fn moonGlow(dir: vec3f, sunDir: vec3f) -> f32 {
  let d = max(dot(dir, -sunDir), 0.0);
  return pow(d, 150.0);
}
`;

type GlowInputs = { dir: unknown; sunDir: unknown };
type GlowNode = (inputs: GlowInputs) => any;
type SkyGlow = { sunGlow: GlowNode; moonGlow: GlowNode; usedVgpu: boolean };

function createTslGlowFallback(): { sunGlow: GlowNode; moonGlow: GlowNode } {
	const sunGlowTsl = Fn(([d, s]: [any, any]) => {
		return d.dot(s).max(float(0.0)).pow(15);
	}) as unknown as (d: unknown, s: unknown) => any;
	// The moon sits opposite the sun, so the sun direction is negated first.
	const moonGlowTsl = Fn(([d, s]: [any, any]) => {
		return d.dot(s.negate()).max(float(0.0)).pow(150);
	}) as unknown as (d: unknown, s: unknown) => any;

	return {
		sunGlow: (inputs: GlowInputs) => sunGlowTsl(inputs.dir, inputs.sunDir),
		moonGlow: (inputs: GlowInputs) => moonGlowTsl(inputs.dir, inputs.sunDir),
	};
}

function createSkyGlow(): SkyGlow {
	try {
		const select = tslExports(SKY_WGSL) as unknown as (
			...names: string[]
		) => Record<string, (inputs: GlowInputs) => unknown>;
		const res = select("sunGlow", "moonGlow");
		if (!res.sunGlow || !res.moonGlow) {
			throw new Error("tslExports did not return sunGlow/moonGlow");
		}
		return {
			sunGlow: (inputs: GlowInputs) => res.sunGlow({ dir: inputs.dir, sunDir: inputs.sunDir }) as any,
			moonGlow: (inputs: GlowInputs) => res.moonGlow({ dir: inputs.dir, sunDir: inputs.sunDir }) as any,
			usedVgpu: true,
		};
	} catch (error) {
		console.error("vgpu/three tslExports failed for sky glow bindings, falling back to pure TSL:", error);
		return { ...createTslGlowFallback(), usedVgpu: false };
	}
}

export function Skybox({ sunPos }: { sunPos: THREE.Vector3 }) {
	const meshRef = useRef<THREE.Mesh>(null);
	const uSunPos = useMemo(() => uniform(new THREE.Vector3(0, 1, 0)), []);
	const materialRef = useRef<MeshBasicNodeMaterial | null>(null);

	useFrame((state) => {
		uSunPos.value.copy(sunPos);
		if (meshRef.current) {
			meshRef.current.position.copy(state.camera.position);
		}
	});

	useEffect(() => {
		return () => {
			if (materialRef.current) {
				try {
					materialRef.current.dispose();
				} catch (e) {
				}
				materialRef.current = null;
			}
		};
	}, []);

	const material = useMemo(() => {
		const glow = createSkyGlow();
		const mat = new MeshBasicNodeMaterial();
		mat.side = THREE.BackSide;
		mat.depthWrite = false;
		mat.depthTest = false;
		mat.fog = false;

		// Local sphere direction == view direction for a camera-centred dome.
		const dir = normalize(positionGeometry as never) as any;
		const sunDir = normalize(uSunPos as never) as any;
		const sunHeight = sunDir.y as any;
		const h = dir.y.mul(0.5).add(0.5);

		const dayTop = vec3(0.4, 0.6, 1.0);
		const dayBottom = vec3(0.1, 0.3, 0.8);
		const sunsetTop = vec3(0.25, 0.15, 0.4);
		const sunsetBottom = vec3(0.95, 0.45, 0.2);
		const nightTop = vec3(0.01, 0.01, 0.03);
		const nightBottom = vec3(0.04, 0.05, 0.1);

		const daySky = mix(dayBottom as never, dayTop as never, h as never);
		const sunsetSky = mix(sunsetBottom as never, sunsetTop as never, h as never);
		const nightSky = mix(nightBottom as never, nightTop as never, h as never);

		const dayMix = smoothstep(-0.05, 0.3, sunHeight as never) as any;
		const sunsetMix = exp(sunHeight.mul(sunHeight).mul(-5.5)) as any;
		const nightMix = float(1.0).sub(dayMix) as any;

		let sky = mix(nightSky as never, daySky as never, dayMix as never) as any;
		sky = mix(sky as never, sunsetSky as never, sunsetMix as never) as any;
		// Deep night darkens the horizon band slightly more than the zenith.
		sky = sky.add(nightSky.mul(nightMix).mul(0.15) as never) as any;

		const sunGlow = glow.sunGlow({ dir, sunDir });
		const moonGlow = glow.moonGlow({ dir, sunDir });
		const sunVis = smoothstep(-0.35, 0.05, sunHeight as never) as any;
		const moonVis = smoothstep(0.35, -0.05, sunHeight as never) as any;

		const glowColor = vec3(1.0, 0.75, 0.4)
			.mul(sunGlow as never)
			.mul(sunVis as never) as any;
		const moonColor = vec3(0.75, 0.85, 1.0)
			.mul(moonGlow as never)
			.mul(moonVis.mul(3.0) as never) as any;

		mat.colorNode = sky.add(glowColor as never).add(moonColor as never) as never;

		materialRef.current = mat;
		return mat;
	}, [uSunPos]);

	return (
		<mesh ref={meshRef} scale={[1, 1, 1]} frustumCulled={false} renderOrder={-1}>
			<sphereGeometry args={[2000, 64, 32]} />
			<primitive object={material} attach="material" />
		</mesh>
	);
}

export default Skybox;
