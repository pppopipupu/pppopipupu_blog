import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Gemini 4 Neon — Monumental Real-Scale Medieval Metropolis Palette
 * Museum-grade warm vellum paper with crisp sepia-charcoal ink,
 * high-altitude tonal lift, and aerial perspective mist across a 960m world.
 */
export const NEON_TOWN_PALETTE = {
  background: "#f4efe4",
  paperLit: "#fdfaf2",
  paperMid: "#eee6d7",
  paperShadow: "#d4c8b4",
  paperDeep: "#bcb097",
  inkPrimary: "#161311",
  inkSecondary: "#2d2722",
  inkFine: "#62584c",
  inkSilhouette: "#13100e",
  hatchColor: "#332c25",
  waterTint: "#e1dcd0",
  roofTint: "#e2d8c5",
  windowGlow: "#f7e6ba",
  fogColor: "#f4efe4",
} as const;

export function createTownOcclusionMaterial(options?: {
  isWater?: boolean;
  isRoof?: boolean;
  isDarkInk?: boolean;
  hatchScale?: number;
  fogNear?: number;
  fogFar?: number;
}): THREE.ShaderMaterial {
  const isWater = options?.isWater ?? false;
  const isRoof = options?.isRoof ?? false;
  const isDarkInk = options?.isDarkInk ?? false;

  const uniforms: Record<string, THREE.IUniform<unknown>> = {
    uSunDir: { value: new THREE.Vector3(0.56, 0.72, 0.41).normalize() },
    uPaperLit: {
      value: new THREE.Color(
        isDarkInk
          ? "#3b342d"
          : isWater
            ? NEON_TOWN_PALETTE.waterTint
            : isRoof
              ? NEON_TOWN_PALETTE.roofTint
              : NEON_TOWN_PALETTE.paperLit
      ),
    },
    uPaperMid: {
      value: new THREE.Color(
        isDarkInk
          ? "#26211c"
          : isWater
            ? NEON_TOWN_PALETTE.waterTint
            : NEON_TOWN_PALETTE.paperMid
      ),
    },
    uPaperShadow: {
      value: new THREE.Color(isDarkInk ? "#181512" : NEON_TOWN_PALETTE.paperShadow),
    },
    uPaperDeep: {
      value: new THREE.Color(isDarkInk ? "#120f0d" : NEON_TOWN_PALETTE.paperDeep),
    },
    uHatchColor: { value: new THREE.Color(NEON_TOWN_PALETTE.hatchColor) },
    uFogColor: { value: new THREE.Color(NEON_TOWN_PALETTE.fogColor) },
    uFogNear: { value: options?.fogNear ?? 420.0 },
    uFogFar: { value: options?.fogFar ?? 1480.0 },
    uHatchEnabled: { value: isWater || isDarkInk ? 0.0 : 1.0 },
    uHatchScale: { value: options?.hatchScale ?? 1.0 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;
      varying float vViewDist;

      void main() {
        #ifdef USE_INSTANCING
          vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        #endif
        vWorldPos = worldPos.xyz;
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
      uniform vec3 uPaperDeep;
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
        float fw = max(fwidth(phase), 0.0012);
        return 1.0 - smoothstep(thickness - fw, thickness + fw, dist);
      }

      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 sunDir = normalize(uSunDir);
        float ndl = dot(n, sunDir);
        float light = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);

        // Elevation tonal lift calibrated for 148m Castle Keep & alpine peaks
        float elevLift = smoothstep(-2.0, 140.0, vWorldPos.y) * 0.12;
        float skyFactor = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        float shade = clamp(light * 0.85 + skyFactor * 0.15 + elevLift, 0.0, 1.0);

        vec3 base = mix(uPaperDeep, uPaperShadow, smoothstep(0.14, 0.34, shade));
        base = mix(base, uPaperMid, smoothstep(0.36, 0.60, shade));
        base = mix(base, uPaperLit, smoothstep(0.64, 0.86, shade));

        if (uHatchEnabled > 0.5) {
          vec3 blend = abs(n);
          blend = blend / (blend.x + blend.y + blend.z + 1e-5);

          float c1 = (vWorldPos.y + vWorldPos.z * 0.62) * blend.x
                   + (vWorldPos.x * 0.72 + vWorldPos.z * 0.72) * blend.y
                   + (vWorldPos.y + vWorldPos.x * 0.62) * blend.z;
          float c2 = (vWorldPos.y - vWorldPos.z * 0.62) * blend.x
                   + (vWorldPos.x * 0.72 - vWorldPos.z * 0.72) * blend.y
                   + (vWorldPos.y - vWorldPos.x * 0.62) * blend.z;

          float distFade = 1.0 - smoothstep(110.0, 380.0, vViewDist);
          float freq = 3.2 * uHatchScale;

          float h1 = hatchStripe(c1, freq, 0.082);
          float h2 = hatchStripe(c2, freq, 0.075);

          float shadow1 = (1.0 - smoothstep(0.28, 0.54, light)) * 0.34;
          float shadow2 = (1.0 - smoothstep(0.08, 0.28, light)) * 0.36;
          float inkMask = clamp((h1 * shadow1 + h2 * shadow2) * distFade, 0.0, 0.52);
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

/**
 * View-space normal + normalized linear depth material (supports InstancedMesh)
 * used for crisp screen-space silhouette ink detection.
 */
export function createNormalDepthMaterial(cameraNear: number, cameraFar: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uNear: { value: cameraNear },
      uFar: { value: cameraFar },
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewNormal;
      varying float vLinearDepth;
      uniform float uNear;
      uniform float uFar;

      void main() {
        #ifdef USE_INSTANCING
          vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vViewNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        #else
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewNormal = normalize(normalMatrix * normal);
        #endif
        vLinearDepth = clamp((-mvPos.z - uNear) / (uFar - uNear), 0.0, 1.0);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vViewNormal;
      varying float vLinearDepth;

      void main() {
        vec3 encN = normalize(vViewNormal) * 0.5 + 0.5;
        gl_FragColor = vec4(encN, vLinearDepth);
      }
    `,
    side: THREE.FrontSide,
  });
}

/**
 * Post-processing architectural engraving composite shader calibrated for 2200m far plane.
 */
export const ArchitecturalInkPostShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tNormalDepth: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1024, 700) },
    uInkColor: { value: new THREE.Color(NEON_TOWN_PALETTE.inkSilhouette) },
    uPaperColor: { value: new THREE.Color(NEON_TOWN_PALETTE.background) },
    uEdgeStrength: { value: 0.76 },
    uGrainStrength: { value: 0.019 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tNormalDepth;
    uniform vec2 uResolution;
    uniform vec3 uInkColor;
    uniform vec3 uPaperColor;
    uniform float uEdgeStrength;
    uniform float uGrainStrength;

    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 baseSample = texture2D(tDiffuse, vUv);
      vec3 col = baseSample.rgb;

      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      vec4 c  = texture2D(tNormalDepth, vUv);
      vec4 nL = texture2D(tNormalDepth, vUv + vec2(-texel.x, 0.0));
      vec4 nR = texture2D(tNormalDepth, vUv + vec2( texel.x, 0.0));
      vec4 nU = texture2D(tNormalDepth, vUv + vec2(0.0,  texel.y));
      vec4 nD = texture2D(tNormalDepth, vUv + vec2(0.0, -texel.y));

      float dCenter = c.a;
      float dDiff = abs(nL.a - dCenter) + abs(nR.a - dCenter) + abs(nU.a - dCenter) + abs(nD.a - dCenter);
      float depthEdge = smoothstep(0.0009, 0.0052, dDiff);

      vec3 nc = c.rgb * 2.0 - 1.0;
      float nDiff = length(nc - (nL.rgb * 2.0 - 1.0))
                  + length(nc - (nR.rgb * 2.0 - 1.0))
                  + length(nc - (nU.rgb * 2.0 - 1.0))
                  + length(nc - (nD.rgb * 2.0 - 1.0));
      float normalEdge = smoothstep(0.62, 1.35, nDiff) * 0.5;

      float distAtten = 1.0 - smoothstep(0.22, 0.68, dCenter);
      float skyMask = 1.0 - smoothstep(0.985, 0.998, dCenter);

      float edge = clamp(max(depthEdge, normalEdge) * distAtten * skyMask * uEdgeStrength, 0.0, 0.85);
      col = mix(col, uInkColor, edge);

      float grain = (hash12(vUv * uResolution * 0.75) - 0.5) * 2.0;
      col += vec3(grain * uGrainStrength);

      vec2 centered = vUv * 2.0 - 1.0;
      float vig = smoothstep(0.78, 1.58, dot(centered, centered));
      col = mix(col, uPaperColor * 0.93, vig * 0.24);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createTownLineMaterial(
  color: string,
  linewidth: number,
  resolution: THREE.Vector2
): LineMaterial {
  return new LineMaterial({
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
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class TownLineBucket {
  private coords: number[] = [];

  addSegment(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    this.coords.push(x1, y1, z1, x2, y2, z2);
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

  addTransformedSegment(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    matrix: THREE.Matrix4
  ) {
    _v1.set(x1, y1, z1).applyMatrix4(matrix);
    _v2.set(x2, y2, z2).applyMatrix4(matrix);
    this.coords.push(_v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z);
  }

  addEdges(geometry: THREE.BufferGeometry, thresholdAngle = 24, matrix?: THREE.Matrix4) {
    const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
    const pos = edges.getAttribute("position");
    if (pos) {
      for (let i = 0; i < pos.count; i += 2) {
        _v1.fromBufferAttribute(pos, i);
        _v2.fromBufferAttribute(pos, i + 1);
        if (matrix) {
          _v1.applyMatrix4(matrix);
          _v2.applyMatrix4(matrix);
        }
        this.coords.push(_v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z);
      }
    }
    edges.dispose();
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

export class TownSolidBucket {
  private parts: THREE.BufferGeometry[] = [];

  add(geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (matrix) g.applyMatrix4(matrix);
    if (g.hasAttribute("uv")) g.deleteAttribute("uv");
    if (!g.hasAttribute("normal")) g.computeVertexNormals();
    this.parts.push(g);
  }

  toMergedGeometry(): THREE.BufferGeometry {
    if (this.parts.length === 0) return new THREE.BufferGeometry();
    const merged = mergeGeometries(this.parts, false);
    for (const p of this.parts) p.dispose();
    this.parts = [];
    return merged ?? new THREE.BufferGeometry();
  }
}
