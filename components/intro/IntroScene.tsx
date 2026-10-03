"use client";

// The intro scene: the red arcade button in the void, the word slamming in letter by letter, then
// the morph onto the landing canvas word. The Director below is the only reader of the score clock
// and it mutates refs only - never per-frame state.

import { useFrame, useThree } from "@react-three/fiber";
import { Center, Text3D, useFont } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { BloomEffect } from "postprocessing";
import {
  HERO_CAMERA,
  HERO_EMISSIVE_BASE,
  HERO_MATERIAL,
  HERO_TEXT,
  TEXT3D_FONT_URL,
  TEXT3D_FRONT_OFFSET,
  TEXT3D_GEOMETRY,
  visibleWorldHeight,
} from "@/lib/heroText";
import {
  GRID_START,
  HANDOFF_DURATION,
  HANDOFF_TIME,
  IMPACT_TIMES,
  INTRO_BEAT,
  INTRO_CAMERA_PUSH_IN_Z,
  INTRO_HARD_END,
  LAST_IMPACT_TIME,
} from "./introConfig";
import type { IntroSequence } from "./introAudio";
import {
  clamp01,
  createPose,
  createSoftSprite,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  evaluateLetter,
  makeFlight,
  mulberry32,
  penOffsets,
  solveHandoff,
  wordBounds,
  type LetterFlight,
  type LetterPose,
  type WordOffset,
} from "./introMotion";

export type IntroTarget = { x: number; y: number; width: number; height: number };

/** Depth of the hero word's centre: Text3D + <Center> puts the canvas word's centre on z = 0. */
const WORD_PLANE_Z = 0;

export type IntroSceneProps = {
  sequence: IntroSequence;
  /**
   * Screen-pixel rect of the landing canvas word's visible outline, read once at handoff. An
   * extrusion shows its front face, so callers report that face's projected rect, not the rect of
   * the word's centre plane.
   */
  getTarget: () => IntroTarget | null;
  onPress: () => void;
  /** The word has morphed onto the canvas rect: the canvas may start its rotation. */
  onHandoff: () => void;
  /** The overlay should fade itself out now. */
  onFadeOut: () => void;
};

type LetterUnit = {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  flight: LetterFlight;
  landing: WordOffset;
  pose: LetterPose;
  landed: boolean;
  flash: number;
};

type RingUnit = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  progress: { value: number };
  opacity: { value: number };
  color: { value: THREE.Color };
  life: number;
  span: number;
};

type SparkBank = {
  burst(origin: THREE.Vector3, strength: number, color: THREE.Color, count: number): void;
};

type ShockwaveHook = (position: THREE.Vector3, size: number, span: number, tint: string) => void;

type Shell = {
  letters: LetterUnit[];
  wordGroup: THREE.Group | null;
  /** Ink width of the laid out word (fit scale included); the morph solves its scale against it. */
  localWidth: number;
  restScale: number;
  buttonGroup: THREE.Group | null;
  buttonCap: THREE.Group | null;
  capMaterials: THREE.MeshStandardMaterial[];
  cursor: THREE.Group | null;
  tapRings: (RingUnit | undefined)[];
  shockwaves: RingUnit[];
  spawnShockwave: ShockwaveHook | null;
  sparks: SparkBank | null;
  flashMesh: THREE.Mesh | null;
  flashMaterial: THREE.MeshBasicMaterial | null;
  bloom: BloomEffect | null;
  hovered: boolean;
  pressed: boolean;
  pressStamp: number;
  shakeAmp: number;
  bloomFlash: number;
};

function createShell(): Shell {
  return {
    letters: [],
    wordGroup: null,
    localWidth: 1,
    restScale: 1,
    buttonGroup: null,
    buttonCap: null,
    capMaterials: [],
    cursor: null,
    tapRings: [],
    shockwaves: [],
    spawnShockwave: null,
    sparks: null,
    flashMesh: null,
    flashMaterial: null,
    bloom: null,
    hovered: false,
    pressed: false,
    pressStamp: -1,
    shakeAmp: 0,
    bloomFlash: 0,
  };
}

// ---------------------------------------------------------------- ring shader

function createRing(edge: number): RingUnit {
  const progress = { value: 0 };
  const opacity = { value: 0 };
  const color = { value: new THREE.Color("#ffffff") };
  const material = new THREE.ShaderMaterial({
    uniforms: { uProgress: progress, uOpacity: opacity, uColor: color, uEdge: { value: edge } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uProgress;
      uniform float uOpacity;
      uniform float uEdge;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float band = uEdge * (0.5 + uProgress * 0.7);
        float ring = smoothstep(uProgress - band, uProgress, d) * (1.0 - smoothstep(uProgress, uProgress + band * 0.3, d));
        float core = (1.0 - smoothstep(0.0, uProgress + 1e-4, d)) * 0.03;
        float alpha = (ring + core) * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor * alpha * 1.6, alpha);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  return { mesh, material, progress, opacity, color, life: 0, span: 1 };
}

function triggerRing(unit: RingUnit, size: number, span: number, tint: string) {
  unit.mesh.scale.setScalar(size);
  unit.life = span;
  unit.span = span;
  unit.progress.value = 0;
  unit.opacity.value = 1;
  unit.color.value.set(tint);
  unit.mesh.visible = true;
}

function updateRing(unit: RingUnit, delta: number, camera: THREE.Camera | null) {
  if (unit.life <= 0) {
    if (unit.mesh.visible) unit.mesh.visible = false;
    return;
  }
  unit.life -= delta;
  const u = clamp01(1 - unit.life / unit.span);
  unit.progress.value = u;
  unit.opacity.value = (1 - u) * (1 - u);
  if (camera) unit.mesh.quaternion.copy(camera.quaternion);
  if (unit.life <= 0) unit.mesh.visible = false;
}

// ---------------------------------------------------------------- word

function WordLetters({ shell }: { shell: Shell }) {
  const font = useFont(TEXT3D_FONT_URL);
  const { size } = useThree();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const materials = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const layout = useMemo(() => penOffsets(font, HERO_TEXT, TEXT3D_GEOMETRY.size), [font]);

  // The letters arrive in a shuffled order: slots stay left to right, arrival order does not.
  const arrivalOrder = useMemo(() => {
    const order = Array.from({ length: layout.chars.length }, (_, index) => index);
    const rng = mulberry32((Math.random() * 2 ** 31) | 0);
    for (let index = order.length - 1; index > 0; index--) {
      const swap = Math.floor(rng() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    return order;
  }, [layout.chars.length]);

  useLayoutEffect(() => {
    const geometrySlotOf = (index: number) => meshes.current[index]?.geometry;
    const bounds = wordBounds(layout.chars.map((_, index) => geometrySlotOf(index)), layout.x);
    const rng = mulberry32((Math.random() * 2 ** 31) | 0);
    const aspect = size.width / Math.max(1, size.height);
    // Fit the word to the framing at the end of the camera push-in, not at the start: this is the
    // tightest the intro ever gets and the letters land after it.
    const viewWorldWidth = visibleWorldHeight(HERO_CAMERA.fov, INTRO_CAMERA_PUSH_IN_Z) * aspect;
    const restScale = Math.min(1, (viewWorldWidth * 0.8) / Math.max(0.001, bounds.width));
    // Each letter is one Text3D mesh extruded forward from its origin; pull it back by half its
    // drawn thickness so the word's centre sits on the same z = 0 plane as the canvas word.
    const restZ = -(TEXT3D_GEOMETRY.height / 2) * restScale;
    const arrivalOf = new Map<number, number>();
    arrivalOrder.forEach((letterIndex, impactIndex) => arrivalOf.set(letterIndex, impactIndex));

    const units: LetterUnit[] = [];
    for (let index = 0; index < layout.chars.length; index++) {
      const mesh = meshes.current[index];
      const material = materials.current[index];
      if (!mesh || !material) continue;
      // Letters land on the glyph-union centre: the word group's origin is the drawn word's centre,
      // which is what the handoff morphs onto the landing canvas word.
      const landing: WordOffset = { x: layout.x[index] + bounds.offsetX, y: bounds.offsetY };
      mesh.position.set(landing.x * restScale, landing.y * restScale, restZ);
      mesh.scale.setScalar(0);
      mesh.visible = false;
      const impact = arrivalOf.get(index) ?? 0;
      // Pure quarter-note landings: every letter gets exactly one beat of flight into its hit.
      const flight = makeFlight(rng, IMPACT_TIMES[impact], INTRO_BEAT, landing, {
        aspect,
        fov: HERO_CAMERA.fov,
        cameraZ: INTRO_CAMERA_PUSH_IN_Z,
        scale: restScale,
        restZ,
      });
      units.push({ mesh, material, flight, landing, pose: createPose(), landed: false, flash: 0 });
    }
    shell.letters = units;
    shell.restScale = restScale;
    shell.localWidth = Math.max(0.001, bounds.width * restScale);
    return () => {
      shell.letters = [];
      shell.wordGroup = null;
    };
  }, [arrivalOrder, layout, shell, size.height, size.width]);

  return (
    <group
      ref={(group) => {
        shell.wordGroup = group;
      }}
    >
      {layout.chars.map((char, index) => (
        <Text3D
          key={`${char}-${index}`}
          ref={(mesh: THREE.Mesh | null) => {
            meshes.current[index] = mesh;
          }}
          font={TEXT3D_FONT_URL}
          {...TEXT3D_GEOMETRY}
        >
          {char}
          <meshStandardMaterial
            ref={(material: THREE.MeshStandardMaterial | null) => {
              materials.current[index] = material;
            }}
            {...HERO_MATERIAL}
            emissiveIntensity={HERO_EMISSIVE_BASE}
            toneMapped={false}
          />
        </Text3D>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- button

function TapRing({ shell, index }: { shell: Shell; index: number }) {
  const unit = useMemo(() => createRing(0.1), []);
  useLayoutEffect(() => {
    // Flat on the cap, not billboarded: it reads as a ripple running across the button top.
    unit.mesh.rotation.set(-Math.PI / 2, 0, 0);
    unit.mesh.position.set(0, 0.05, 0);
    shell.tapRings[index] = unit;
    return () => {
      delete shell.tapRings[index];
      unit.mesh.geometry.dispose();
      unit.material.dispose();
    };
  }, [index, shell, unit]);
  return <primitive object={unit.mesh} />;
}

function IntroButton({ shell, onPress }: { shell: Shell; onPress: () => void }) {
  return (
    <group
      ref={(group) => {
        shell.buttonGroup = group;
      }}
      position={[0, -0.05, 0]}
      rotation={[0.42, 0, 0]}
    >
      <mesh position={[0, -0.66, 0]}>
        <cylinderGeometry args={[1.5, 1.62, 0.44, 64]} />
        <meshStandardMaterial color="#15151d" roughness={0.32} metalness={0.95} />
      </mesh>
      <mesh position={[0, -0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.44, 0.05, 12, 96]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.14} metalness={1} />
      </mesh>
      <pointLight position={[0, 0.9, 1.6]} color="#ff2038" intensity={6} distance={9} decay={2} />
      <group
        ref={(group) => {
          shell.buttonCap = group;
        }}
      >
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.98, 1.08, 0.36, 64]} />
          <meshStandardMaterial
            ref={(material: THREE.MeshStandardMaterial | null) => {
              if (material) shell.capMaterials[0] = material;
            }}
            color="#e8070f"
            emissive="#ff0a1e"
            emissiveIntensity={1.15}
            roughness={0.24}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.98, 64]} />
          <meshStandardMaterial
            ref={(material: THREE.MeshStandardMaterial | null) => {
              if (material) shell.capMaterials[1] = material;
            }}
            color="#ff3040"
            emissive="#ff1024"
            emissiveIntensity={0.9}
            roughness={0.3}
            metalness={0.25}
          />
        </mesh>
        <group position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <Center>
            <Text3D
              font={TEXT3D_FONT_URL}
              size={0.42}
              height={0.045}
              curveSegments={6}
              bevelEnabled
              bevelThickness={0.008}
              bevelSize={0.006}
              bevelSegments={2}
            >
              START
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffe9ec"
                emissiveIntensity={0.5}
                roughness={0.35}
                metalness={0.1}
                toneMapped={false}
              />
            </Text3D>
          </Center>
        </group>
        {[0, 1, 2].map((index) => (
          <TapRing key={index} shell={shell} index={index} />
        ))}
      </group>
      {/* Invisible but raycastable hit volume: the whole plinth is a target, not just the cap. */}
      <mesh
        position={[0, 0.05, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          shell.hovered = true;
        }}
        onPointerOut={() => {
          shell.hovered = false;
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (shell.pressed) return;
          shell.pressed = true;
          onPress();
        }}
      >
        <cylinderGeometry args={[1.3, 1.3, 1.35, 28]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Cursor({ shell }: { shell: Shell }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.34, -1.5);
    shape.lineTo(0.72, -1.1);
    shape.lineTo(1.02, -1.72);
    shape.lineTo(1.4, -1.55);
    shape.lineTo(1.1, -0.94);
    shape.lineTo(1.62, -0.92);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.028,
      bevelSegments: 2,
      curveSegments: 4,
    });
  }, []);
  useLayoutEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <group
      ref={(group) => {
        shell.cursor = group;
      }}
      position={[0.52, 1.0, 0.9]}
      rotation={[0, 0, 0.34]}
      scale={0.4}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#eef1f6"
          emissive="#ffffff"
          emissiveIntensity={0.12}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- particles

function Sparks({ shell, capacity = 460 }: { shell: Shell; capacity?: number }) {
  const positions = useMemo(() => new Float32Array(capacity * 3), [capacity]);
  const colors = useMemo(() => new Float32Array(capacity * 3), [capacity]);
  const baseColors = useMemo(() => new Float32Array(capacity * 3), [capacity]);
  const velocities = useMemo(() => new Float32Array(capacity * 3), [capacity]);
  const life = useMemo(() => new Float32Array(capacity), [capacity]);
  const maxLife = useMemo(() => new Float32Array(capacity), [capacity]);
  const cursor = useRef(0);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  // Soft round sprite: default point rendering gives hard squares, which read as pixel noise.
  const sprite = useMemo(() => createSoftSprite(), []);

  useLayoutEffect(() => {
    for (let index = 0; index < capacity; index++) positions[index * 3 + 1] = 9999;
    shell.sparks = {
      burst(origin, strength, color, count) {
        const sparks = Math.min(count, capacity);
        for (let index = 0; index < sparks; index++) {
          const slot = cursor.current % capacity;
          cursor.current += 1;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const speed = (3.5 + Math.random() * 9) * strength;
          positions[slot * 3] = origin.x;
          positions[slot * 3 + 1] = origin.y;
          positions[slot * 3 + 2] = origin.z;
          velocities[slot * 3] = Math.sin(phi) * Math.cos(theta) * speed;
          velocities[slot * 3 + 1] = (Math.cos(phi) * 0.8 + 0.55) * speed;
          velocities[slot * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed * 0.6;
          baseColors[slot * 3] = color.r;
          baseColors[slot * 3 + 1] = color.g;
          baseColors[slot * 3 + 2] = color.b;
          const span = 0.35 + Math.random() * 0.55;
          life[slot] = span;
          maxLife[slot] = span;
        }
      },
    };
    return () => {
      shell.sparks = null;
    };
  }, [baseColors, capacity, life, maxLife, positions, shell, velocities]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    for (let index = 0; index < capacity; index++) {
      if (life[index] <= 0) continue;
      life[index] -= step;
      const slot = index * 3;
      if (life[index] <= 0) {
        positions[slot + 1] = 9999;
        baseColors[slot] = 0;
        baseColors[slot + 1] = 0;
        baseColors[slot + 2] = 0;
        colors[slot] = 0;
        colors[slot + 1] = 0;
        colors[slot + 2] = 0;
        continue;
      }
      positions[slot] += velocities[slot] * step;
      positions[slot + 1] += velocities[slot + 1] * step;
      positions[slot + 2] += velocities[slot + 2] * step;
      velocities[slot + 1] -= 22 * step;
      velocities[slot] *= 1 - 1.6 * step;
      velocities[slot + 1] *= 1 - 1.1 * step;
      velocities[slot + 2] *= 1 - 1.6 * step;
      // Additive blending: colour scaled down fades to nothing, so no alpha attribute needed.
      const tint = (life[index] / maxLife[index]) ** 2 * 1.6;
      colors[slot] = baseColors[slot] * tint;
      colors[slot + 1] = baseColors[slot + 1] * tint;
      colors[slot + 2] = baseColors[slot + 2] * tint;
    }
    const geometry = geometryRef.current;
    if (geometry) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }
  });

  useLayoutEffect(() => () => sprite.dispose(), [sprite]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={0.16}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Dust({ count = 260 }: { count?: number }) {
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) {
      data[index * 3] = (Math.random() - 0.5) * 34;
      data[index * 3 + 1] = (Math.random() - 0.5) * 20;
      data[index * 3 + 2] = -12 + Math.random() * 14;
    }
    return data;
  }, [count]);
  const speeds = useMemo(() => {
    const data = new Float32Array(count);
    for (let index = 0; index < count; index++) data[index] = 0.25 + Math.random() * 0.9;
    return data;
  }, [count]);
  const sprite = useMemo(() => createSoftSprite(32), []);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  useLayoutEffect(() => () => sprite.dispose(), [sprite]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    for (let index = 0; index < count; index++) {
      const slot = index * 3;
      positions[slot + 1] += speeds[index] * step;
      positions[slot] += Math.sin(state.clock.elapsedTime * speeds[index] + index) * step * 0.25;
      if (positions[slot + 1] > 11) positions[slot + 1] = -11;
    }
    const geometry = geometryRef.current;
    if (geometry) geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        color="#8892a8"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

function ShockwaveRings({ shell, count = 7 }: { shell: Shell; count?: number }) {
  const units = useMemo(() => Array.from({ length: count }, () => createRing(0.06)), [count]);
  const cursor = useRef(0);
  useLayoutEffect(() => {
    shell.shockwaves = units;
    shell.spawnShockwave = (position, size, span, tint) => {
      const unit = units[cursor.current % units.length];
      cursor.current += 1;
      unit.mesh.position.copy(position);
      triggerRing(unit, size, span, tint);
    };
    return () => {
      shell.shockwaves = [];
      shell.spawnShockwave = null;
      for (const unit of units) {
        unit.mesh.geometry.dispose();
        unit.material.dispose();
      }
    };
  }, [shell, units]);
  return (
    <>
      {units.map((unit, index) => (
        <primitive key={index} object={unit.mesh} />
      ))}
    </>
  );
}

function FlashPlane({ shell }: { shell: Shell }) {
  return (
    <mesh
      ref={(mesh) => {
        shell.flashMesh = mesh;
      }}
      frustumCulled={false}
      renderOrder={10}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={(material) => {
          shell.flashMaterial = material;
        }}
        color="#fff4f0"
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------- director

function Director({
  shell,
  sequence,
  getTarget,
  onHandoff,
  onFadeOut,
}: {
  shell: Shell;
  sequence: IntroSequence;
  getTarget: () => IntroTarget | null;
  onHandoff: () => void;
  onFadeOut: () => void;
}) {
  const progress = useMemo(
    () => ({
      handoff: false,
      fade: false,
      finished: false,
      lastBeat: -1,
      target: null as IntroTarget | null,
      handoffScale: 1,
      cameraLock: false,
      cameraPosition: new THREE.Vector3(),
      cameraQuaternion: new THREE.Quaternion(),
    }),
    [],
  );
  const scratch = useMemo(
    () => ({
      left: new THREE.Vector3(),
      right: new THREE.Vector3(),
      center: new THREE.Vector3(),
      spark: new THREE.Vector3(),
      sparkColor: new THREE.Color(),
    }),
    [],
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const now = state.clock.elapsedTime;
    const t = sequence.elapsed();
    const started = t > -1e5;
    const camera = state.camera;

    // ---- camera: idle orbit, push-in through the count-in, shake on impact, frozen for the
    // handoff (the morph target is measured through this camera, so it must not move).
    if (progress.cameraLock) {
      camera.position.copy(progress.cameraPosition);
      camera.quaternion.copy(progress.cameraQuaternion);
    } else {
      const pushIn = started
        ? THREE.MathUtils.lerp(HERO_CAMERA.z, INTRO_CAMERA_PUSH_IN_Z, easeOutCubic(clamp01((t + 0.4) / (GRID_START + 1.4))))
        : HERO_CAMERA.z;
      const orbitX = started ? Math.sin(now * 0.14) * 0.12 : Math.sin(now * 0.3) * 0.42;
      const eyeY = started ? 0.12 : 0.3 + Math.cos(now * 0.24) * 0.2;
      const lookY = started
        ? THREE.MathUtils.lerp(-0.12, 0.05, easeOutCubic(clamp01((t + 0.4) / 1.6)))
        : -0.12;
      shell.shakeAmp *= Math.exp(-8.5 * delta);
      camera.position.set(
        orbitX + Math.sin(now * 61) * shell.shakeAmp,
        eyeY + Math.cos(now * 47) * shell.shakeAmp * 0.7,
        pushIn,
      );
      camera.lookAt(orbitX * 0.2, lookY, 0);
      if (shell.shakeAmp > 1e-4) camera.rotateZ(Math.sin(now * 53) * shell.shakeAmp * 0.06);
      if (started && t >= HANDOFF_TIME) {
        progress.cameraLock = true;
        progress.cameraPosition.copy(camera.position);
        progress.cameraQuaternion.copy(camera.quaternion);
      }
    }
    camera.updateMatrixWorld();

    // ---- flashes
    shell.bloomFlash *= Math.exp(-11 * delta);
    if (shell.bloom) shell.bloom.intensity = 2.5 + shell.bloomFlash;
    if (shell.flashMaterial && shell.flashMesh) {
      shell.flashMaterial.opacity = Math.min(0.1, shell.bloomFlash * 0.06);
      const depth = 1.4;
      const height = visibleWorldHeight(HERO_CAMERA.fov, depth) * 1.15;
      shell.flashMesh.position.copy(camera.position);
      shell.flashMesh.quaternion.copy(camera.quaternion);
      shell.flashMesh.translateZ(-depth);
      shell.flashMesh.scale.set(height * (state.size.width / Math.max(1, state.size.height)) * 1.15, height, 1);
    }

    // ---- button: attract loop with the tap cursor, then a press-and-sink exit.
    if (shell.pressed && shell.pressStamp < 0) shell.pressStamp = now;
    const buttonGroup = shell.buttonGroup;
    const buttonCap = shell.buttonCap;
    if (buttonGroup && buttonCap) {
      if (shell.pressed) {
        const sink = clamp01((now - shell.pressStamp) / 0.55);
        buttonGroup.position.y = -0.05 - 1.9 * easeInCubic(sink);
        buttonGroup.scale.setScalar(1 - 0.35 * sink);
        buttonGroup.visible = sink < 1;
        if (shell.cursor) shell.cursor.visible = false;
      } else {
        const cycle = now % 1.35;
        const dive = easeInCubic(clamp01(cycle / 0.4));
        const retreat = clamp01((cycle - 0.55) / 0.5);
        const hovered = shell.hovered ? 1 : 0;
        const capPress = Math.sin(Math.PI * clamp01(cycle / 0.42)) * 0.13 * (1 - retreat) * (1 + hovered * 0.4);
        buttonCap.position.y = -capPress;
        buttonCap.scale.setScalar(1 + Math.sin(now * 3.4) * 0.012 + hovered * 0.035 - capPress * 0.05);
        const glow = 1.05 + Math.sin(now * 3.4) * 0.18 + hovered * 0.5 + capPress * 3;
        for (const material of shell.capMaterials) material.emissiveIntensity = glow;

        const cursor = shell.cursor;
        if (cursor) {
          cursor.visible = true;
          const height = THREE.MathUtils.lerp(1.0, 0.08, dive) + retreat * 0.95;
          cursor.position.set(0.52 - dive * 0.22, height, 0.9 - dive * 0.36);
          cursor.rotation.z = 0.34 - dive * 0.16;
          cursor.scale.setScalar(0.4 * (1 + Math.sin(now * 6) * 0.02));
        }
        if (cycle >= 0.4 && cycle - delta < 0.4) {
          const unit = shell.tapRings.find((candidate) => candidate && candidate.life <= 0);
          if (unit) {
            unit.mesh.position.set(0, 0.05, 0);
            triggerRing(unit, 2.1, 0.62, hovered ? "#ffffff" : "#ff6a78");
          }
        }
        for (const unit of shell.tapRings) {
          if (!unit) continue;
          updateRing(unit, delta, null);
          unit.mesh.rotation.set(-Math.PI / 2, 0, 0);
        }
      }
    }

    // ---- count-in: one expanding ring per beat over the void where the button was.
    if (started && t >= 0 && t < GRID_START) {
      const beat = Math.floor(t / INTRO_BEAT);
      if (beat !== progress.lastBeat) {
        progress.lastBeat = beat;
        shell.bloomFlash = Math.min(1, shell.bloomFlash + 0.3);
        shell.spawnShockwave?.(scratch.center.set(0, 0, -1.2), 5.5 + beat * 2, INTRO_BEAT * 1.4, beat % 2 === 0 ? "#ffffff" : "#79dcff");
      }
    }

    // ---- letters
    const groups = shell.wordGroup;
    const handoffProgress = started ? clamp01((t - HANDOFF_TIME) / HANDOFF_DURATION) : 0;
    const ease = easeInOutCubic(handoffProgress);
    const held = started && t >= LAST_IMPACT_TIME;
    const beatPulse = held ? Math.exp(-5 * Math.max(0, t % INTRO_BEAT)) : 0;
    // The intro's letters are twice the screen size of the landing canvas word. Ten oversized
    // glyphs glowing at the canvas value would wash the viewport in gold through the shared bloom,
    // so they start below the bloom threshold and ramp up to the canvas value across the hold,
    // which also reads as the word "lighting up" before it hands off.
    const glowRamp = easeInOutCubic(started ? clamp01((t - LAST_IMPACT_TIME) / Math.max(0.001, HANDOFF_TIME - LAST_IMPACT_TIME)) : 0);
    const emissiveBase = HERO_EMISSIVE_BASE * (0.6 + 0.4 * glowRamp);

    for (const letter of shell.letters) {
      const visible = evaluateLetter(letter.flight, letter.landing, shell.restScale, t, letter.pose);
      if (visible && !letter.landed && t >= letter.flight.land) {
        letter.landed = true;
        letter.flash = 1;
        shell.shakeAmp = Math.min(0.4, shell.shakeAmp + 0.16);
        shell.bloomFlash = Math.min(0.7, shell.bloomFlash + 0.52);
        scratch.spark.set(letter.pose.position.x, letter.pose.position.y, 0);
        shell.spawnShockwave?.(scratch.spark, 4.6, 0.45, "#ffe6a8");
        scratch.sparkColor.set("#ffd27a");
        shell.sparks?.burst(scratch.spark, 1.5, scratch.sparkColor, 34);
      }
      if (!visible) {
        letter.mesh.visible = false;
        continue;
      }
      letter.mesh.visible = true;
      letter.mesh.position.copy(letter.pose.position);
      letter.mesh.rotation.copy(letter.pose.rotation);
      letter.mesh.scale.copy(letter.pose.scale);
      letter.flash *= Math.exp(-8 * delta);
      letter.material.emissiveIntensity = emissiveBase + 2.2 * letter.flash + 1.2 * beatPulse;
    }

    // ---- hold pulse and handoff morph onto the landing canvas word
    if (groups) {
      if (started && t >= HANDOFF_TIME && !progress.target) {
        progress.target = getTarget();
        const rect = progress.target;
        if (rect) {
          progress.handoffScale = solveHandoff(
            rect,
            camera,
            state.size,
            shell.localWidth,
            WORD_PLANE_Z,
            TEXT3D_FRONT_OFFSET * shell.restScale,
            scratch,
          );
          shell.bloomFlash = Math.min(1, shell.bloomFlash + 0.4);
        }
      }
      if (progress.target && handoffProgress > 0) {
        // The group origin is the drawn word's centre, so scaling about it leaves the centre put and
        // the centre itself travels a straight line from the intro's centre to the canvas word's.
        const scale = THREE.MathUtils.lerp(1, progress.handoffScale, ease);
        groups.scale.setScalar(scale);
        groups.position.set(
          THREE.MathUtils.lerp(0, scratch.center.x, ease),
          THREE.MathUtils.lerp(0, scratch.center.y, ease),
          0,
        );
        for (const letter of shell.letters) letter.material.emissiveIntensity = HERO_EMISSIVE_BASE;
      } else {
        groups.scale.setScalar(1 + 0.03 * beatPulse);
        groups.position.set(0, 0, 0);
      }
      if (!progress.handoff && handoffProgress >= 1) {
        progress.handoff = true;
        onHandoff();
      }
      if (progress.handoff && !progress.fade) {
        progress.fade = true;
        onFadeOut();
      }
      if (started && t > INTRO_HARD_END && !progress.finished) {
        // Tab throttling / dead clock: snap to the final state instead of hanging on a frozen frame.
        progress.finished = true;
        if (!progress.handoff) {
          progress.handoff = true;
          onHandoff();
        }
        if (!progress.fade) {
          progress.fade = true;
          onFadeOut();
        }
      }
    }

    for (const unit of shell.shockwaves) updateRing(unit, delta, camera);
  });

  return null;
}

// ---------------------------------------------------------------- scene

function SceneContents({ shell, sequence, getTarget, onPress, onHandoff, onFadeOut }: IntroSceneProps & { shell: Shell }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[-10, 0, 0]} intensity={2.0} color="#ff0040" />
      <directionalLight position={[10, 0, 0]} intensity={2.0} color="#0080ff" />
      <directionalLight position={[0, -10, 0]} intensity={2.0} color="#80ff80" />
      <directionalLight position={[0, 10, 0]} intensity={2.0} color="#ffff00" />
      <Dust />
      <Suspense fallback={null}>
        <WordLetters shell={shell} />
        <IntroButton shell={shell} onPress={onPress} />
        <Cursor shell={shell} />
      </Suspense>
      <ShockwaveRings shell={shell} />
      <Sparks shell={shell} />
      <FlashPlane shell={shell} />
      <EffectComposer>
        <Bloom
          ref={(effect: BloomEffect | null) => {
            shell.bloom = effect;
          }}
          luminanceThreshold={1.2}
          luminanceSmoothing={0.9}
          intensity={2.5}
          mipmapBlur
        />
      </EffectComposer>
      <Director shell={shell} sequence={sequence} getTarget={getTarget} onHandoff={onHandoff} onFadeOut={onFadeOut} />
    </>
  );
}

export default function IntroScene(props: IntroSceneProps) {
  const shell = useMemo(() => createShell(), []);
  return <SceneContents {...props} shell={shell} />;
}
