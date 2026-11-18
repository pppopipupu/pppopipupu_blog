import { tslExports } from "vgpu/three";
import {
	float,
	Fn,
	sin,
	vec2,
} from "three/tsl";

export type WaterVoronoiContract = {
	voronoi2: { p: unknown; time: unknown };
	hash22: { p: unknown };
};

export type WaterBindings = {
	voronoi2: (inputs: WaterVoronoiContract["voronoi2"]) => unknown;
	hash22: (inputs: WaterVoronoiContract["hash22"]) => unknown;
	usedVgpu: boolean;
	error?: unknown;
};

const WATER_WGSL = /* wgsl */ `
fn hash22(p: vec2f) -> vec2f {
  let q = vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

fn voronoi2(p: vec2f, time: f32) -> f32 {
  let n = floor(p);
  let f = fract(p);
  var m: f32 = 8.0;
  for (var j: i32 = -1; j <= 1; j = j + 1) {
    for (var i: i32 = -1; i <= 1; i = i + 1) {
      let g = vec2f(f32(i), f32(j));
      var o = hash22(n + g);
      o = 0.5 + 0.5 * sin(time + o * 6.2831);
      let r = g - f + o;
      let d = dot(r, r);
      if (d < m) {
        m = d;
      }
    }
  }
  return sqrt(m);
}
`;

function createTslFallback(): WaterBindings {
	const hash22Simple = Fn(([p]: [unknown]) => {
		const pp = vec2(p as never);
		const qx = (pp as any).dot(vec2(127.1, 311.7));
		const qy = (pp as any).dot(vec2(269.5, 183.3));
		const q = vec2(qx, qy);
		return (q as any).sin().mul(43758.5453123).fract().mul(2.0).sub(1.0);
	}) as any;

	const voronoi2Simple = Fn(([p, t]: [unknown, unknown]) => {
		const pp = vec2(p as never);
		const tt = typeof t === "number" ? float(t) : (t as never);
		const n = (pp as any).floor();
		const f = (pp as any).fract();
		let m = float(1e10).toVar() as any;

		const cells = [
			[-1, -1],
			[0, -1],
			[1, -1],
			[-1, 0],
			[0, 0],
			[1, 0],
			[-1, 1],
			[0, 1],
			[1, 1],
		];
		for (let c = 0; c < cells.length; c++) {
			const gx = cells[c][0];
			const gy = cells[c][1];
			const g = vec2(gx, gy);
			const o = hash22Simple(n.add(g));
			const oAnim = (sin((tt as any).add((o as any).mul(6.2831))) as any).mul(0.5).add(0.5);
			const r = (g as any).sub(f).add(oAnim);
			const d = (r as any).dot(r);
			m = (m as any).lessThan(d).select(m, d);
		}
		return (m as any).sqrt();
	}) as any;

	return {
		voronoi2: (inputs: WaterVoronoiContract["voronoi2"]) => voronoi2Simple(inputs.p, inputs.time),
		hash22: (inputs: WaterVoronoiContract["hash22"]) => hash22Simple(inputs.p),
		usedVgpu: false,
	};
}

export function createWaterBindings(): WaterBindings {
	try {
		const select = tslExports(WATER_WGSL) as unknown as (...names: string[]) => Record<string, (inputs: Record<string, unknown>) => unknown>;
		const res = select("voronoi2", "hash22");
		if (!res.voronoi2 || !res.hash22) {
			throw new Error("tslExports did not return voronoi2/hash22");
		}
		return {
			voronoi2: (inputs: WaterVoronoiContract["voronoi2"]) => res.voronoi2({ p: inputs.p, time: inputs.time }),
			hash22: (inputs: WaterVoronoiContract["hash22"]) => res.hash22({ p: inputs.p }),
			usedVgpu: true,
		};
	} catch (error) {
		console.error("vgpu/three tslExports failed for water bindings, falling back to pure TSL:", error);
		const fb = createTslFallback();
		return {
			...fb,
			error,
		};
	}
}

export {
	cameraPosition,
	color,
	dFdx,
	dFdy,
	float,
	Fn,
	mix,
	normalWorld,
	positionWorld,
	pow,
	smoothstep,
	time,
	vec2,
	vec3,
	vertexColor,
} from "three/tsl";
