import * as THREE from "three";

export type CottageTimeId = "dusk" | "night" | "morning";

export interface CottageTimePalette {
  id: CottageTimeId;
  label: string;
  skyTop: string;
  skyHorizon: string;
  skyBottom: string;
  sunColor: string;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambientIntensity: number;
  waterDeep: string;
  waterShallow: string;
  fogColor: string;
  starVisibility: number;
  fireflyIntensity: number;
  lampMultiplier: number;
}

export const COTTAGE_TIMES: Record<CottageTimeId, CottageTimePalette> = {
  dusk: {
    id: "dusk",
    label: "黄金黄昏",
    skyTop: "#272348",
    skyHorizon: "#e98a67",
    skyBottom: "#5c3b52",
    sunColor: "#ffb570",
    sunIntensity: 2.35,
    sunPos: [14, 10, 11],
    hemiSky: "#f4a27e",
    hemiGround: "#3b2c35",
    hemiIntensity: 0.72,
    ambientIntensity: 0.25,
    waterDeep: "#255873",
    waterShallow: "#54a2b8",
    fogColor: "#784c5e",
    starVisibility: 0.25,
    fireflyIntensity: 0.85,
    lampMultiplier: 1.0,
  },
  night: {
    id: "night",
    label: "星夜微光",
    skyTop: "#090d1f",
    skyHorizon: "#1c2b4f",
    skyBottom: "#0a0e1b",
    sunColor: "#9dc2ff",
    sunIntensity: 0.95,
    sunPos: [-12, 16, -9],
    hemiSky: "#415e96",
    hemiGround: "#151726",
    hemiIntensity: 0.55,
    ambientIntensity: 0.22,
    waterDeep: "#102845",
    waterShallow: "#27537d",
    fogColor: "#131d36",
    starVisibility: 1.0,
    fireflyIntensity: 1.4,
    lampMultiplier: 1.45,
  },
  morning: {
    id: "morning",
    label: "清晨晴空",
    skyTop: "#4f94db",
    skyHorizon: "#ccebff",
    skyBottom: "#9bc4b8",
    sunColor: "#fff4d6",
    sunIntensity: 2.6,
    sunPos: [12, 18, 9],
    hemiSky: "#cbe9ff",
    hemiGround: "#687a52",
    hemiIntensity: 0.9,
    ambientIntensity: 0.3,
    waterDeep: "#2b7899",
    waterShallow: "#6bc6db",
    fogColor: "#b8ddf0",
    starVisibility: 0.0,
    fireflyIntensity: 0.15,
    lampMultiplier: 0.45,
  },
};

export function createSkyDomeMaterial(palette: CottageTimePalette): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(palette.skyTop) },
      uHorizonColor: { value: new THREE.Color(palette.skyHorizon) },
      uBottomColor: { value: new THREE.Color(palette.skyBottom) },
      uStarVis: { value: palette.starVisibility },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uBottomColor;
      uniform float uStarVis;
      uniform float uTime;
      varying vec3 vWorldDir;

      float hash31(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      void main() {
        vec3 d = normalize(vWorldDir);
        float h = d.y;
        vec3 col = mix(uHorizonColor, uTopColor, smoothstep(0.0, 0.58, max(h, 0.0)));
        col = mix(col, uBottomColor, smoothstep(0.0, -0.38, min(h, 0.0)));

        if (uStarVis > 0.01 && h > 0.06) {
          vec3 grid = floor(d * 110.0);
          float r = hash31(grid);
          if (r > 0.992) {
            float twinkle = 0.55 + 0.45 * sin(uTime * 2.6 + r * 100.0);
            float starFade = smoothstep(0.06, 0.35, h) * uStarVis;
            col += vec3(0.95, 0.97, 1.0) * twinkle * starFade * 1.1;
          }
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function createBrookWaterMaterial(palette: CottageTimePalette): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(palette.waterDeep) },
      uShallowColor: { value: new THREE.Color(palette.waterShallow) },
      uFoamColor: { value: new THREE.Color("#e8f8ff") },
      uSunDir: { value: new THREE.Vector3(...palette.sunPos).normalize() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave = sin(pos.x * 2.2 + uTime * 2.4) * 0.025 + cos(pos.z * 1.8 - uTime * 2.0) * 0.025;
        pos.y += wave;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * vec3(-cos(pos.x * 2.2 + uTime * 2.4) * 0.08, 1.0, sin(pos.z * 1.8 - uTime * 2.0) * 0.08));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFoamColor;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      void main() {
        float flow = vUv.y * 10.0 - uTime * 1.35;
        float band1 = sin(flow * 3.1 + sin(vUv.x * 9.0) * 1.4);
        float band2 = cos(flow * 5.2 - vUv.x * 11.0);
        float caustic = smoothstep(0.65, 0.98, (band1 + band2) * 0.5);

        float edgeDist = abs(vUv.x - 0.5) * 2.0;
        float bankFoam = smoothstep(0.76, 0.96, edgeDist + 0.08 * sin(flow * 4.0));

        vec3 base = mix(uDeepColor, uShallowColor, 0.35 + 0.35 * (1.0 - edgeDist));
        base = mix(base, uFoamColor, clamp(caustic * 0.28 + bankFoam * 0.58, 0.0, 0.85));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 halfDir = normalize(normalize(uSunDir) + viewDir);
        float spec = pow(max(dot(normalize(vNormalW), halfDir), 0.0), 42.0);
        base += vec3(1.0, 0.95, 0.85) * spec * 0.45;

        gl_FragColor = vec4(base, 0.88);
      }
    `,
  });
}
