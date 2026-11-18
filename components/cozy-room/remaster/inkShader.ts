import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type VillageThemeId = "archival" | "blueprint" | "nocturne";

export interface VillageThemePalette {
  id: VillageThemeId;
  label: string;
  background: string;
  paperLit: string;
  paperMid: string;
  paperShadow: string;
  inkPrimary: string;
  inkSecondary: string;
  inkFine: string;
  hatchColor: string;
  waterTint: string;
  windowGlow: string;
  fogColor: string;
}

export const VILLAGE_THEMES: Record<VillageThemeId, VillageThemePalette> = {
  archival: {
    id: "archival",
    label: "钢笔手稿",
    background: "#f2ece1",
    paperLit: "#fbf7ef",
    paperMid: "#ece4d6",
    paperShadow: "#d5cbb8",
    inkPrimary: "#181615",
    inkSecondary: "#2c2825",
    inkFine: "#5e564d",
    hatchColor: "#36302a",
    waterTint: "#e3ded2",
    windowGlow: "#f5e9c9",
    fogColor: "#f2ece1",
  },
  blueprint: {
    id: "blueprint",
    label: "建筑蓝图",
    background: "#0a1c38",
    paperLit: "#12325f",
    paperMid: "#0d2549",
    paperShadow: "#07162e",
    inkPrimary: "#e3f6ff",
    inkSecondary: "#9bd7f5",
    inkFine: "#528fb8",
    hatchColor: "#63aed8",
    waterTint: "#081831",
    windowGlow: "#8be9fd",
    fogColor: "#0a1c38",
  },
  nocturne: {
    id: "nocturne",
    label: "夜巡版画",
    background: "#0d1017",
    paperLit: "#1c2230",
    paperMid: "#131722",
    paperShadow: "#090b10",
    inkPrimary: "#e8ecf2",
    inkSecondary: "#a7b3c6",
    inkFine: "#566378",
    hatchColor: "#7888a0",
    waterTint: "#0a0e16",
    windowGlow: "#ffbe5c",
    fogColor: "#0d1017",
  },
};

export interface InkOcclusionUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uSunDir: THREE.IUniform<THREE.Vector3>;
  uPaperLit: THREE.IUniform<THREE.Color>;
  uPaperMid: THREE.IUniform<THREE.Color>;
  uPaperShadow: THREE.IUniform<THREE.Color>;
  uHatchColor: THREE.IUniform<THREE.Color>;
  uFogColor: THREE.IUniform<THREE.Color>;
  uFogNear: THREE.IUniform<number>;
  uFogFar: THREE.IUniform<number>;
  uHatchEnabled: THREE.IUniform<number>;
  uHatchScale: THREE.IUniform<number>;
}

export function createInkOcclusionMaterial(
  palette: VillageThemePalette,
  options?: { isWater?: boolean; hatchScale?: number }
): THREE.ShaderMaterial {
  const uniforms: InkOcclusionUniforms = {
    uSunDir: { value: new THREE.Vector3(0.58, 0.72, 0.38).normalize() },
    uPaperLit: { value: new THREE.Color(options?.isWater ? palette.waterTint : palette.paperLit) },
    uPaperMid: { value: new THREE.Color(options?.isWater ? palette.waterTint : palette.paperMid) },
    uPaperShadow: { value: new THREE.Color(options?.isWater ? palette.paperShadow : palette.paperShadow) },
    uHatchColor: { value: new THREE.Color(palette.hatchColor) },
    uFogColor: { value: new THREE.Color(palette.fogColor) },
    uFogNear: { value: 96.0 },
    uFogFar: { value: 270.0 },
    uHatchEnabled: { value: options?.isWater ? 0.0 : 1.0 },
    uHatchScale: { value: options?.hatchScale ?? 1.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying float vViewDist;

      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPos = viewMatrix * worldPos;
        vViewDist = -mvPos.z;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uPaperLit;
      uniform vec3 uPaperMid;
      uniform vec3 uPaperShadow;
      uniform vec3 uHatchColor;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      uniform float uHatchEnabled;
      uniform float uHatchScale;

      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying float vViewDist;

      float hatchStripe(float coord, float freq, float thickness) {
        float phase = coord * freq;
        float dist = abs(fract(phase) - 0.5);
        float fw = max(fwidth(phase), 0.001);
        return 1.0 - smoothstep(thickness - fw, thickness + fw, dist);
      }

      void main() {
        vec3 n = normalize(vWorldNormal);
        float ndl = dot(n, normalize(uSunDir));
        float light = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);

        // Stepped architectural cel-paper shading
        vec3 base = mix(uPaperShadow, uPaperMid, smoothstep(0.22, 0.52, light));
        base = mix(base, uPaperLit, smoothstep(0.56, 0.82, light));

        // Subtle world-space triplanar pen-and-ink hatching in shadow zones
        if (uHatchEnabled > 0.5) {
          vec3 blend = abs(n);
          blend = blend / (blend.x + blend.y + blend.z + 1e-5);

          float pX = (vWorldPos.y + vWorldPos.z * 0.65);
          float pY = (vWorldPos.x * 0.75 + vWorldPos.z * 0.75);
          float pZ = (vWorldPos.y + vWorldPos.x * 0.65);
          float coord1 = pX * blend.x + pY * blend.y + pZ * blend.z;
          float coord2 = (vWorldPos.y - vWorldPos.z * 0.65) * blend.x
                       + (vWorldPos.x * 0.75 - vWorldPos.z * 0.75) * blend.y
                       + (vWorldPos.y - vWorldPos.x * 0.65) * blend.z;

          // Fade hatching cleanly with distance to avoid moire aliasing
          float distFade = 1.0 - smoothstep(32.0, 88.0, vViewDist);
          float freq = 5.5 * uHatchScale;

          float h1 = hatchStripe(coord1, freq, 0.09);
          float h2 = hatchStripe(coord2, freq, 0.085);

          float shadow1 = (1.0 - smoothstep(0.28, 0.52, light)) * 0.36;
          float shadow2 = (1.0 - smoothstep(0.10, 0.30, light)) * 0.34;
          float inkMask = clamp((h1 * shadow1 + h2 * shadow2) * distFade, 0.0, 0.55);
          base = mix(base, uHatchColor, inkMask);
        }

        float fogFactor = smoothstep(uFogNear, uFogFar, vViewDist);
        vec3 finalCol = mix(base, uFogColor, fogFactor);
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
    side: THREE.FrontSide,
  });
}

export function createWeightedLineMaterial(
  color: string,
  linewidth: number,
  resolution: THREE.Vector2
): LineMaterial {
  const mat = new LineMaterial({
    color: new THREE.Color(color).getHex(),
    linewidth,
    worldUnits: false,
    alphaToCoverage: true,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    fog: true,
    resolution,
  });
  return mat;
}

const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();

/**
 * Accumulates line segment endpoints into a flat Float32Array-backed LineSegmentsGeometry.
 */
export class LineBucket {
  private coords: number[] = [];

  addSegment(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    this.coords.push(x1, y1, z1, x2, y2, z2);
  }

  addSegmentVec(a: THREE.Vector3, b: THREE.Vector3) {
    this.coords.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  addPolyline(points: Array<[number, number, number]>, closed = false) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      this.coords.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    if (closed && points.length > 2) {
      const last = points[points.length - 1];
      const first = points[0];
      this.coords.push(last[0], last[1], last[2], first[0], first[1], first[2]);
    }
  }

  addTransformedSegment(a: THREE.Vector3, b: THREE.Vector3, matrix: THREE.Matrix4) {
    _tmpV1.copy(a).applyMatrix4(matrix);
    _tmpV2.copy(b).applyMatrix4(matrix);
    this.coords.push(_tmpV1.x, _tmpV1.y, _tmpV1.z, _tmpV2.x, _tmpV2.y, _tmpV2.z);
  }

  addEdgesFromGeometry(
    geometry: THREE.BufferGeometry,
    thresholdAngle = 22,
    matrix?: THREE.Matrix4
  ) {
    const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
    const pos = edges.getAttribute("position");
    if (pos) {
      for (let i = 0; i < pos.count; i += 2) {
        _tmpV1.fromBufferAttribute(pos, i);
        _tmpV2.fromBufferAttribute(pos, i + 1);
        if (matrix) {
          _tmpV1.applyMatrix4(matrix);
          _tmpV2.applyMatrix4(matrix);
        }
        this.coords.push(_tmpV1.x, _tmpV1.y, _tmpV1.z, _tmpV2.x, _tmpV2.y, _tmpV2.z);
      }
    }
    edges.dispose();
  }

  get count(): number {
    return this.coords.length / 6;
  }

  toLineSegmentsGeometry(): LineSegmentsGeometry {
    const geo = new LineSegmentsGeometry();
    if (this.coords.length >= 6) {
      geo.setPositions(new Float32Array(this.coords));
    } else {
      geo.setPositions(new Float32Array([0, -9999, 0, 0, -9999.01, 0]));
    }
    return geo;
  }
}

/**
 * Collects non-indexed solid geometries with matching attributes for clean single-draw-call merging.
 */
export class SolidBucket {
  private parts: THREE.BufferGeometry[] = [];

  add(geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (matrix) {
      g.applyMatrix4(matrix);
    }
    if (g.hasAttribute("uv")) {
      g.deleteAttribute("uv");
    }
    if (!g.hasAttribute("normal")) {
      g.computeVertexNormals();
    }
    this.parts.push(g);
  }

  toMergedGeometry(): THREE.BufferGeometry {
    if (this.parts.length === 0) {
      return new THREE.BufferGeometry();
    }
    const merged = mergeGeometries(this.parts, false);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    return merged ?? new THREE.BufferGeometry();
  }
}
