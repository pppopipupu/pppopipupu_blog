"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbitControls, PointerLockControls } from "@react-three/drei";
import { 
  DummyType, ZombieType, Fireball, LightningStrike, DisintegrateRay, 
  PrismaticWall, ImpactFlash, DebrisParticles, BloodParticles, DamageText, DummyEntity, ZombieEntity,
  DamageType, DAMAGE_INFO, InfiniteTerrain, FluidSimulation, saveCraterToChunk, getTerrainHeight, CHUNK_SIZE,
  setWaterEnabled,
  StructureType, StructureData, StructureEntity, generatePartsForStructure,
  PlantType, PlantData, PlantEntity, generatePartsForPlant, getBiomeAt
} from "./spell-lab/Spells";




/* ==================== Grass Blades ==================== */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface GrassBladeData {
  pos: THREE.Vector3;
  scale: number;
  phase: number;
  destroyed: boolean;
  hidden: boolean;
  biome: string;
}

function GrassBlades({ 
  craters,
  cameraPos,
  viewDistance = 3,
}: { 
  craters: { x: number; z: number; r: number; d: number }[];
  cameraPos: THREE.Vector3;
  viewDistance?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const camGridX = Math.floor(cameraPos.x / CHUNK_SIZE);
  const camGridZ = Math.floor(cameraPos.z / CHUNK_SIZE);

  const density = viewDistance <= 2 ? 400 : viewDistance <= 3 ? 300 : 150;
  const count = (2 * viewDistance + 1) * (2 * viewDistance + 1) * density;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const grassData = useMemo(() => {
    const data: GrassBladeData[] = [];
    
    for (let dx = -viewDistance; dx <= viewDistance; dx++) {
      for (let dz = -viewDistance; dz <= viewDistance; dz++) {
        const cx = camGridX + dx;
        const cz = camGridZ + dz;
        
        for (let i = 0; i < density; i++) {
          const rx = seededRandom(cx * 341.12 + cz * 713.43 + i * 13.57);
          const rz = seededRandom(cx * 123.45 + cz * 456.78 + i * 29.81);
          const rs = seededRandom(cx * 987.65 + cz * 213.24 + i * 7.12);
          
          const x = (cx + rx) * CHUNK_SIZE;
          const z = (cz + rz) * CHUNK_SIZE;
          const hInfo = getTerrainHeight(x, z);
          const biome = getBiomeAt(x, z);
          
          let destroyed = false;
          for (const c of craters) {
            const dxVal = x - c.x;
            const dzVal = z - c.z;
            if (dxVal * dxVal + dzVal * dzVal < c.r * c.r * 0.64) {
              destroyed = true;
              break;
            }
          }

          data.push({
            pos: new THREE.Vector3(x, hInfo.height, z),
            scale: 0.15 + rs * 0.1,
            phase: rs * Math.PI * 2,
            destroyed: destroyed,
            hidden: hInfo.isWater || destroyed,
            biome
          });
        }
      }
    }
    return data;
  }, [camGridX, camGridZ, viewDistance, density, craters]);

  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((state) => {
    Reflect.set(uniforms.uTime, "value", state.clock.elapsedTime);
  });

  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      const d = grassData[i];
      if (!d || d.hidden || d.destroyed) {
        dummy.scale.set(0, 0, 0);
      } else {
        dummy.position.copy(d.pos);
        dummy.rotation.set(0, 0, 0);
        if (d.biome === "scorched-desolation") {
          dummy.scale.set(d.scale * 0.4, d.scale * 1.5, d.scale * 0.4);
        } else if (d.biome === "tundra-spire") {
          dummy.scale.set(d.scale * 0.7, d.scale * 0.8, d.scale * 0.7);
        } else {
          dummy.scale.set(0.05, d.scale, 0.05);
        }
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      let colorVal = new THREE.Color("#2d8a2d");
      if (d) {
        if (d.biome === "scorched-desolation") {
          const orange = new THREE.Color("#ff5722");
          const charcoal = new THREE.Color("#212121");
          colorVal = i % 2 === 0 ? orange : charcoal;
        } else if (d.biome === "tundra-spire") {
          const white = new THREE.Color("#e0f7fa");
          const icy = new THREE.Color("#00e5ff");
          colorVal = i % 3 === 0 ? white : icy;
        } else {
          const green = new THREE.Color("#00e676");
          const purple = new THREE.Color("#d500f9");
          colorVal = i % 4 === 0 ? purple : green;
        }
      }
      meshRef.current.setColorAt(i, colorVal);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [grassData, count, dummy]);

  return (
    <instancedMesh key={`grass-${viewDistance}-${camGridX}-${camGridZ}`} ref={meshRef} args={[undefined, undefined, count]} frustumCulled={true}>
      <coneGeometry args={[1, 4, 3]} />
      <meshStandardMaterial
        color="#ffffff"
        flatShading
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = uniforms.uTime;
          shader.vertexShader = `
            uniform float uTime;
          ` + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            float phase = instanceMatrix[3][0] * 0.1 + instanceMatrix[3][2] * 0.1;
            float wave = sin(uTime * 2.0 + phase) * 0.1 * (position.y + 2.0);
            transformed.x += wave;
            transformed.z += wave * 0.5;
            `
          );
        }}
      />
    </instancedMesh>
  );
}

function KeyboardControls({ 
  controlsRef,
  firstPerson
}: { 
  controlsRef: React.RefObject<import("three-stdlib").OrbitControls | null>;
  firstPerson: boolean;
}) {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const blur = () => { keys.current = {}; };
    const context = (e: Event) => { e.preventDefault(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("contextmenu", context);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("contextmenu", context);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 25 * delta;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; right.normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();

    const move = new THREE.Vector3();
    if (keys.current["w"]) move.addScaledVector(forward, speed);
    if (keys.current["s"]) move.addScaledVector(forward, -speed);
    if (keys.current["a"]) move.addScaledVector(right, -speed);
    if (keys.current["d"]) move.addScaledVector(right, speed);
    
    if (move.lengthSq() > 0) {
      camera.position.add(move);
      if (firstPerson) {
        const hInfo = getTerrainHeight(camera.position.x, camera.position.z);
        const targetY = hInfo.height + 1.8;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
      } else if (controlsRef.current) {
        controlsRef.current.target.add(move);
      }
    } else if (firstPerson) {
      const hInfo = getTerrainHeight(camera.position.x, camera.position.z);
      const targetY = hInfo.height + 1.8;
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.2);
    }
  });
  return null;
}

function SceneShake({ intensityRef, children }: { intensityRef: React.RefObject<number>, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const s = intensityRef.current ?? 0;
    if (s > 0.01) {
      groupRef.current.position.set(
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2,
        (Math.random() - 0.5) * s * 0.2
      );
      Reflect.set(intensityRef, "current", s * 0.92);
    } else {
      groupRef.current.position.set(0, 0, 0);
      Reflect.set(intensityRef, "current", 0);
    }
  });
  return <group ref={groupRef}>{children}</group>;
}





function Skybox({ sunPos }: { sunPos: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uSunPos: { value: new THREE.Vector3() },
    uTime: { value: 0 }
  }), []);
  useFrame((state) => {
    uniforms.uSunPos.value.copy(sunPos);
    Reflect.set(uniforms.uTime, "value", state.clock.elapsedTime);
    if (meshRef.current) {
      meshRef.current.position.copy(state.camera.position);
    }
  });
  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 32, 15]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vWorldPosition;
          uniform vec3 uSunPos;
          void main() {
            vec3 dir = normalize(vWorldPosition);
            vec3 sunDir = normalize(uSunPos);
            float h = dir.y * 0.5 + 0.5;
            vec3 daySky = mix(vec3(0.4, 0.6, 1.0), vec3(0.1, 0.3, 0.8), h);
            vec3 sunsetSky = mix(vec3(0.9, 0.4, 0.2), vec3(0.2, 0.1, 0.3), h);
            vec3 nightSky = mix(vec3(0.01, 0.01, 0.05), vec3(0.002, 0.002, 0.01), h);
            float sunHeight = sunDir.y;
            vec3 skyColor;
            if (sunHeight > 0.2) {
              skyColor = mix(sunsetSky, daySky, smoothstep(0.2, 0.5, sunHeight));
            } else if (sunHeight > -0.2) {
              skyColor = mix(nightSky, sunsetSky, smoothstep(-0.2, 0.2, sunHeight));
            } else {
              skyColor = nightSky;
            }
            float sunGlow = pow(max(0.0, dot(dir, sunDir)), 15.0);
            skyColor += vec3(1.0, 0.8, 0.5) * sunGlow * 0.5 * step(0.0, sunHeight);
            float moonGlow = pow(max(0.0, dot(dir, -sunDir)), 150.0);
            skyColor += vec3(0.7, 0.8, 1.0) * moonGlow * step(0.0, -sunHeight);
            gl_FragColor = vec4(skyColor, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/* ==================== Scene Content ==================== */
function SceneContent({
  spell,
  shakeIntensity,
  viewDistance = 3,
  fogEnabled = true,
  waterEnabled = false,
  onCastSpellAction,
  firstPerson = false,
  playerHp = 100,
  onPlayerHpChange,
}: {
  spell: string;
  shakeIntensity: React.RefObject<number>;
  viewDistance?: number;
  fogEnabled?: boolean;
  waterEnabled?: boolean;
  onCastSpellAction?: () => void;
  firstPerson?: boolean;
  playerHp?: number;
  onPlayerHpChange?: (hp: number) => void;
}) {
  const [craters, setCraters] = useState<{ x: number; z: number; r: number; d: number }[]>([]);
  const [cratersVersion, setCratersVersion] = useState(0);
  const [debris, setDebris] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [fireballs, setFireballs] = useState<{ pos: THREE.Vector3; id: number }[]>([]);
  const [lightnings, setLightnings] = useState<{ pos: THREE.Vector3; id: number; count: number }[]>([]);
  const [flashes, setFlashes] = useState<{ pos: THREE.Vector3; color: string; id: number }[]>([]);
  const [rays, setRays] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  
  const [dummies, setDummies] = useState<DummyType[]>([]);
  const [zombies, setZombies] = useState<ZombieType[]>([]);
  const [damageTexts, setDamageTexts] = useState<{ id: number; pos: THREE.Vector3; text: string; color: string }[]>([]);
  const [bloods, setBloods] = useState<{ id: number; pos: THREE.Vector3 }[]>([]);
  const [walls, setWalls] = useState<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>([]);
  const [structures, setStructures] = useState<StructureData[]>([]);
  const [plants, setPlants] = useState<PlantData[]>([]);
  
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

  const { camera, controls } = useThree();

  const playerDummy: DummyType = useMemo(() => ({
    id: 99999,
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    hp: playerHp,
    maxHp: 100,
    color: "#00ffff"
  }), [playerHp]);

  const zombieTargets = useMemo(() => {
    if (firstPerson && playerHp > 0) {
      return [playerDummy, ...dummies];
    }
    return dummies;
  }, [firstPerson, playerHp, playerDummy, dummies]);

  const sunMeshRef = useRef<THREE.Mesh>(null);
  const sunTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const loader = new THREE.TextureLoader();
    return loader.load("/face_angry.png");
  }, []);

  const moonMeshRef = useRef<THREE.Mesh>(null);
  const moonTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const loader = new THREE.TextureLoader();
    return loader.load("/face_cry_angry.png");
  }, []);

  useEffect(() => {
    if (firstPerson) {
      const targetX = (controls && (controls as any).target) ? (controls as any).target.x : 0;
      const targetZ = (controls && (controls as any).target) ? (controls as any).target.z : 0;
      const hInfo = getTerrainHeight(targetX, targetZ);
      camera.position.set(targetX, hInfo.height + 1.8, targetZ);
      camera.lookAt(targetX, hInfo.height + 1.8, targetZ - 10);
    } else {
      camera.position.set(camera.position.x, 60, camera.position.z + 50);
      if (controls && (controls as any).target && (controls as any).update) {
        (controls as any).target.set(camera.position.x, 0, camera.position.z - 50);
        (controls as any).update();
      }
    }
  }, [firstPerson, camera, controls]);

  useEffect(() => {
    setWaterEnabled(!!waterEnabled);
  }, [waterEnabled]);

  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const sunPos = useMemo(() => new THREE.Vector3(), []);
  const lastTeleportCheck = useRef(0);
  const structureVys = useRef<Record<number, number>>({});
  const plantVys = useRef<Record<number, number>>({});

  const spawnDebris = useCallback((pos: THREE.Vector3, color: string) => {
    const id = Date.now() + Math.random();
    setDebris((prev) => [...prev, { pos: pos.clone(), color, id }]);
  }, []);

  useFrame((state, delta) => {
    const angle = (state.clock.elapsedTime * 0.1) % (Math.PI * 2);
    const radius = 120;
    const sy = Math.sin(angle) * radius;
    const sz = Math.cos(angle) * radius;
    sunPos.set(0, sy, sz);

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunPos);
      sunLightRef.current.intensity = Math.max(0, Math.sin(angle)) * 1.5;
    }
    if (moonLightRef.current) {
      moonLightRef.current.position.set(0, -sy, -sz);
      moonLightRef.current.intensity = Math.max(0, -Math.sin(angle)) * 0.5;
    }
    if (ambientLightRef.current) {
      const sunHeight = Math.sin(angle);
      let amb = 0.1;
      if (sunHeight > 0.2) {
        amb = THREE.MathUtils.lerp(0.3, 0.6, smoothstep(0.2, 0.5, sunHeight));
      } else if (sunHeight > -0.2) {
        amb = THREE.MathUtils.lerp(0.1, 0.3, smoothstep(-0.2, 0.2, sunHeight));
      }
      ambientLightRef.current.intensity = amb;
    }
      if (fogRef.current) {
        const sunHeight = Math.sin(angle);
        const dayColor = new THREE.Color("#4f8fcf");
        const sunsetColor = new THREE.Color("#d35400");
        const nightColor = new THREE.Color("#050510");
        const currentFogColor = new THREE.Color();
        if (sunHeight > 0.2) {
          currentFogColor.lerpColors(sunsetColor, dayColor, smoothstep(0.2, 0.5, sunHeight));
        } else if (sunHeight > -0.2) {
          currentFogColor.lerpColors(nightColor, sunsetColor, smoothstep(-0.2, 0.2, sunHeight));
        } else {
          currentFogColor.copy(nightColor);
        }
        fogRef.current.color.copy(currentFogColor);
        state.gl.setClearColor(currentFogColor);
      }

      if (sunMeshRef.current) {
        const sunWorldPos = sunPos.clone().normalize().multiplyScalar(450).add(state.camera.position);
        sunMeshRef.current.position.copy(sunWorldPos);
        sunMeshRef.current.lookAt(state.camera.position);
        sunMeshRef.current.visible = sunPos.y > -10;
      }

      if (moonMeshRef.current) {
        const moonWorldPos = sunPos.clone().negate().normalize().multiplyScalar(450).add(state.camera.position);
        moonMeshRef.current.position.copy(moonWorldPos);
        moonMeshRef.current.lookAt(state.camera.position);
        moonMeshRef.current.visible = sunPos.y < 10;
      }

      structures.forEach((s) => {
        const terrainY = getTerrainHeight(s.pos.x, s.pos.z).height;
        let finalH = terrainY;
        for (const c of craters) {
          const dx = s.pos.x - c.x;
          const dz = s.pos.z - c.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < c.r) {
            const depth = c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
            finalH -= depth;
          }
        }
        if (s.pos.y > finalH + 0.01) {
          const currentVy = structureVys.current[s.id] ?? 0;
          const nextVy = currentVy - 9.8 * delta;
          structureVys.current[s.id] = nextVy;
          s.pos.y += nextVy * delta;
          if (s.pos.y <= finalH) {
            s.pos.y = finalH;
            structureVys.current[s.id] = 0;
          }
        } else {
          s.pos.y = finalH;
          structureVys.current[s.id] = 0;
        }
      });

      plants.forEach((p) => {
        const terrainY = getTerrainHeight(p.pos.x, p.pos.z).height;
        let finalH = terrainY;
        for (const c of craters) {
          const dx = p.pos.x - c.x;
          const dz = p.pos.z - c.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < c.r) {
            const depth = c.d * Math.cos((dist / c.r) * Math.PI * 0.5);
            finalH -= depth;
          }
        }
        if (p.pos.y > finalH + 0.01) {
          const currentVy = plantVys.current[p.id] ?? 0;
          const nextVy = currentVy - 9.8 * delta;
          plantVys.current[p.id] = nextVy;
          p.pos.y += nextVy * delta;
          if (p.pos.y <= finalH) {
            p.pos.y = finalH;
            plantVys.current[p.id] = 0;
          }
        } else {
          p.pos.y = finalH;
          plantVys.current[p.id] = 0;
        }
      });

      if (state.clock.elapsedTime - lastTeleportCheck.current > 1.5) {
        lastTeleportCheck.current = state.clock.elapsedTime;
        const maxDist = (viewDistance + 1) * CHUNK_SIZE;
        const camGridX = Math.floor(camera.position.x / CHUNK_SIZE);
        const camGridZ = Math.floor(camera.position.z / CHUNK_SIZE);
        setDummies((prev) => {
          let changed = false;
          const next = prev.map((d) => {
            const dist = d.pos.distanceTo(camera.position);
            const isExpiredCorpse = d.hp <= 0 && d.deathTime && (Date.now() - d.deathTime > 60000);
            if (dist > maxDist || isExpiredCorpse) {
              changed = true;
              const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
              const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
              const cx = camGridX + dx;
              const cz = camGridZ + dz;
              const x = (cx + Math.random()) * CHUNK_SIZE;
              const z = (cz + Math.random()) * CHUNK_SIZE;
              const hInfo = getTerrainHeight(x, z);
              return {
                ...d,
                pos: new THREE.Vector3(x, hInfo.height, z),
                target: new THREE.Vector3(x, hInfo.height, z),
                hp: 200,
                deathTime: undefined,
                consumed: undefined
              };
            }
            return d;
          });
          return changed ? next : prev;
        });

        setZombies((prev) => {
          let changed = false;
          const next = prev.filter((z) => {
            const dist = z.pos.distanceTo(camera.position);
            if (dist > maxDist) {
              changed = true;
              return false;
            }
            if (z.hp <= 0) {
              if (!z.deathTime) {
                z.deathTime = Date.now();
                return true;
              }
              if (Date.now() - z.deathTime > 5000) {
                changed = true;
                return false;
              }
            }
            return true;
          });
          return changed ? next : prev;
        });

        setStructures((prev) => {
          let changed = false;
          const next = prev.map((s) => {
            const dist = s.pos.distanceTo(camera.position);
            if (dist > maxDist) {
              changed = true;
              const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
              const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
              const cx = camGridX + dx;
              const cz = camGridZ + dz;
              const x = (cx + Math.random()) * CHUNK_SIZE;
              const z = (cz + Math.random()) * CHUNK_SIZE;
              const hInfo = getTerrainHeight(x, z);
              const types: StructureType[] = [
                "cabin",
                "windmill",
                "mine",
                "tower",
                "well",
                "obelisk",
                "shrine",
                "ruins",
                "campfire",
                "box-pile"
              ];
              const type = types[Math.floor(Math.random() * types.length)];
              return {
                ...s,
                type,
                pos: new THREE.Vector3(x, hInfo.height, z),
                rotation: Math.random() * Math.PI * 2,
                scale: 1.4 + Math.random() * 0.8,
                parts: generatePartsForStructure(type)
              };
            }
            return s;
          });
          return changed ? next : prev;
        });

        setPlants((prev) => {
          let changed = false;
          const next = prev.map((p) => {
            const dist = p.pos.distanceTo(camera.position);
            if (dist > maxDist) {
              changed = true;
              let x = 0;
              let z = 0;
              let biome = "prairie";
              let attempts = 0;
              while (biome === "prairie" && attempts < 10) {
                const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
                const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
                const cx = camGridX + dx;
                const cz = camGridZ + dz;
                x = (cx + Math.random()) * CHUNK_SIZE;
                z = (cz + Math.random()) * CHUNK_SIZE;
                biome = getBiomeAt(x, z);
                attempts++;
              }
              const hInfo = getTerrainHeight(x, z);
              let type: PlantType = "arcane-tree";
              if (biome === "scorched-desolation") {
                type = Math.random() > 0.5 ? "ash-pillar" : "basalt-spire";
              } else if (biome === "tundra-spire") {
                type = Math.random() > 0.5 ? "frost-spike" : "snowy-pine";
              } else {
                type = Math.random() > 0.5 ? "arcane-tree" : "giant-mushroom";
              }
              return {
                ...p,
                type,
                pos: new THREE.Vector3(x, hInfo.height, z),
                rotation: Math.random() * Math.PI * 2,
                scale: 1.2 + Math.random() * 0.8,
                parts: generatePartsForPlant(type),
                hp: 100,
                maxHp: 100
              };
            }
            return p;
          });
          return changed ? next : prev;
        });
      }
    });

  const spawnDummies = useCallback(() => {
    const newDummies: DummyType[] = [];
    const camGridX = Math.floor(camera.position.x / CHUNK_SIZE);
    const camGridZ = Math.floor(camera.position.z / CHUNK_SIZE);
    const totalDummies = viewDistance <= 2 ? 50 : viewDistance <= 3 ? 100 : 180;
    for(let i = 0; i < totalDummies; i++) {
      const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
      const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
      const cx = camGridX + dx;
      const cz = camGridZ + dz;
      const x = (cx + Math.random()) * CHUNK_SIZE;
      const z = (cz + Math.random()) * CHUNK_SIZE;
      const hInfo = getTerrainHeight(x, z);
      newDummies.push({
        id: i,
        pos: new THREE.Vector3(x, hInfo.height, z),
        hp: 200,
        maxHp: 200,
        target: new THREE.Vector3(x, hInfo.height, z),
        color: `hsl(${Math.random() * 360}, 80%, 60%)`
      });
    }
    setDummies(newDummies);
  }, [camera, viewDistance]);

  const spawnStructures = useCallback(() => {
    const newStructures: StructureData[] = [];
    const camGridX = Math.floor(camera.position.x / CHUNK_SIZE);
    const camGridZ = Math.floor(camera.position.z / CHUNK_SIZE);
    const totalStructures = viewDistance <= 2 ? 10 : viewDistance <= 3 ? 20 : 35;
    const types: StructureType[] = [
      "cabin",
      "windmill",
      "mine",
      "tower",
      "well",
      "obelisk",
      "shrine",
      "ruins",
      "campfire",
      "box-pile"
    ];
    for (let i = 0; i < totalStructures; i++) {
      const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
      const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
      const cx = camGridX + dx;
      const cz = camGridZ + dz;
      const x = (cx + Math.random()) * CHUNK_SIZE;
      const z = (cz + Math.random()) * CHUNK_SIZE;
      const hInfo = getTerrainHeight(x, z);
      const type = types[Math.floor(Math.random() * types.length)];
      newStructures.push({
        id: i,
        type,
        pos: new THREE.Vector3(x, hInfo.height, z),
        rotation: Math.random() * Math.PI * 2,
        scale: 1.4 + Math.random() * 0.8,
        parts: generatePartsForStructure(type)
      });
    }
    setStructures(newStructures);
  }, [camera, viewDistance]);

  const spawnPlants = useCallback(() => {
    const newPlants: PlantData[] = [];
    const camGridX = Math.floor(camera.position.x / CHUNK_SIZE);
    const camGridZ = Math.floor(camera.position.z / CHUNK_SIZE);
    const totalPlants = viewDistance <= 2 ? 15 : viewDistance <= 3 ? 30 : 50;
    for (let i = 0; i < totalPlants; i++) {
      let x = 0;
      let z = 0;
      let biome = "prairie";
      let attempts = 0;
      while (biome === "prairie" && attempts < 10) {
        const dx = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
        const dz = Math.floor((Math.random() - 0.5) * 2 * viewDistance);
        const cx = camGridX + dx;
        const cz = camGridZ + dz;
        x = (cx + Math.random()) * CHUNK_SIZE;
        z = (cz + Math.random()) * CHUNK_SIZE;
        biome = getBiomeAt(x, z);
        attempts++;
      }
      const hInfo = getTerrainHeight(x, z);
      let type: PlantType = "arcane-tree";
      if (biome === "scorched-desolation") {
        type = Math.random() > 0.5 ? "ash-pillar" : "basalt-spire";
      } else if (biome === "tundra-spire") {
        type = Math.random() > 0.5 ? "frost-spike" : "snowy-pine";
      } else {
        type = Math.random() > 0.5 ? "arcane-tree" : "giant-mushroom";
      }
      newPlants.push({
        id: i,
        type,
        pos: new THREE.Vector3(x, hInfo.height, z),
        rotation: Math.random() * Math.PI * 2,
        scale: 1.2 + Math.random() * 0.8,
        parts: generatePartsForPlant(type),
        hp: 100,
        maxHp: 100
      });
    }
    setPlants(newPlants);
  }, [camera, viewDistance]);

  const applyDamage = useCallback((hitTest: (d: DummyType) => boolean, minDmg: number, maxDmg: number, damageType: DamageType) => {
    setDummies(prev => {
      let updated = false;
      const newDamageTexts: { id: number; pos: THREE.Vector3; text: string; color: string }[] = [];
      const newBloods: { id: number; pos: THREE.Vector3 }[] = [];
      const next = prev.map(d => {
        if (d.hp <= 0 || !hitTest(d)) return d;
        updated = true;
        const dmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));
        const info = DAMAGE_INFO[damageType];
        newDamageTexts.push({
          id: Math.random(),
          pos: d.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
          text: `-${dmg} ${info.name}`,
          color: info.color
        });
        newBloods.push({
          id: Math.random(),
          pos: d.pos.clone().add(new THREE.Vector3(0, 1, 0))
        });
        const nextHp = Math.max(0, d.hp - dmg);
        return { ...d, hp: nextHp, deathTime: nextHp <= 0 ? (d.deathTime || Date.now()) : undefined };
      });
      if (updated) {
        setTimeout(() => {
          setDamageTexts(texts => [...texts, ...newDamageTexts]);
          setBloods(b => [...b, ...newBloods]);
        }, 0);
      }
      return updated ? next : prev;
    });

    setZombies(prev => {
      let updated = false;
      const newDamageTexts: { id: number; pos: THREE.Vector3; text: string; color: string }[] = [];
      const next = prev.map(z => {
        if (z.hp <= 0 || !hitTest(z as any)) return z;
        updated = true;
        const dmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));
        const info = DAMAGE_INFO[damageType];
        newDamageTexts.push({
          id: Math.random(),
          pos: z.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
          text: `-${dmg} ${info.name}`,
          color: info.color
        });
        return { ...z, hp: Math.max(0, z.hp - dmg) };
      });
      if (updated) {
        setTimeout(() => {
          setDamageTexts(texts => [...texts, ...newDamageTexts]);
        }, 0);
      }
      return updated ? next : prev;
    });
  }, []);

  const recordSpellCast = useCallback(() => {
    if (onCastSpellAction) {
      onCastSpellAction();
    }
    if (typeof window === "undefined") return;
    const key = "spell_lab_alert_shown";
    if (localStorage.getItem(key)) return;

    const countKey = "spell_lab_cast_count";
    const count = parseInt(localStorage.getItem(countKey) || "0", 10) + 1;
    localStorage.setItem(countKey, count.toString());

    if (count === 5) {
      localStorage.setItem(key, "true");
      setTimeout(() => {
        const go = window.confirm("你已释放了5个法术！是否前往多态主页 https://center.mcmod.cn/1408244/的置顶看看？那里有AES128密文，密钥为pppopipupu ascii转hex code，不足的位数补零，快去解密吧！！！");
        if (go) {
          window.open("https://center.mcmod.cn/1408244/", "_blank");
        }
      }, 300);
    }
  }, [onCastSpellAction]);

  const castInstantSpell = useCallback((point: THREE.Vector3) => {
    const terrainY = getTerrainHeight(point.x, point.z).height;
    const adjustedPoint = new THREE.Vector3(point.x, terrainY, point.z);
    
    if (spell === "animate-dead") {
      const deadDummy = dummies.find((d) => d.hp <= 0 && d.pos.distanceTo(adjustedPoint) < 5.0 && d.hp > -999);
      if (deadDummy) {
        recordSpellCast();
        const id = Date.now() + Math.random();
        setDummies((prev) =>
          prev.map((d) => (d.id === deadDummy.id ? { ...d, hp: -999, consumed: true } : d))
        );
        setFlashes((prev) => [...prev, { pos: deadDummy.pos.clone(), color: "#7000aa", id }]);
        setDebris((prev) => [...prev, { pos: deadDummy.pos.clone(), color: "#2b0044", id }]);
        setZombies((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            pos: deadDummy.pos.clone(),
            target: deadDummy.pos.clone(),
            hp: 100,
            maxHp: 100,
            lastAttackTime: 0
          }
        ]);
        setDamageTexts((texts) => [
          ...texts,
          {
            id: Math.random(),
            pos: deadDummy.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
            text: "+ 唤醒僵尸",
            color: "#a020f0"
          }
        ]);
      }
      return;
    }

    recordSpellCast();
    const id = Date.now() + Math.random();
    if (spell === "fireball") {
        setFireballs((prev) => [...prev, { pos: adjustedPoint.clone(), id }]);
        setTimeout(() => {
          shakeIntensity.current = 4.0;
          const newCrater = { x: adjustedPoint.x, z: adjustedPoint.z, r: 4.5, d: 1.5 };
          saveCraterToChunk(newCrater);
          setCraters((prev) => [...prev, newCrater]);
          setCratersVersion((v) => v + 1);
          setFlashes((prev) => [...prev, { pos: adjustedPoint.clone(), color: "#ff6600", id }]);
          setDebris((prev) => [...prev, { pos: adjustedPoint.clone(), color: "#4a2d1a", id }]);
          applyDamage((d) => d.pos.distanceTo(adjustedPoint) < 6.0, 8, 48, "fire");
        }, 600);
      } else if (spell === "lightning") {
        const boltCount = 3 + Math.floor(Math.random() * 4);
        setLightnings((prev) => [...prev, { pos: adjustedPoint.clone(), id, count: boltCount }]);
        setTimeout(() => {
          shakeIntensity.current = 1.8;
          const newCrater = { x: adjustedPoint.x, z: adjustedPoint.z, r: 1.8, d: 0.6 };
          saveCraterToChunk(newCrater);
          setCraters((prev) => [...prev, newCrater]);
          setCratersVersion((v) => v + 1);
          setFlashes((prev) => [...prev, { pos: adjustedPoint.clone(), color: "#4488ff", id }]);
          setDebris((prev) => [...prev, { pos: adjustedPoint.clone(), color: "#2d2d3a", id }]);
          applyDamage((d) => d.pos.distanceTo(adjustedPoint) < 2.5, 3, 30, "lightning");
        }, 300);
      } else if (spell === "disintegrate") {
        const start = camera.position.clone();
        start.y -= 1;
        setRays((prev) => [...prev, { start, end: adjustedPoint.clone(), id }]);
        setTimeout(() => {
          shakeIntensity.current = 3.0;
          const p1 = new THREE.Vector2(start.x, start.z);
          const p2 = new THREE.Vector2(adjustedPoint.x, adjustedPoint.z);
          const dist = p1.distanceTo(p2);
          const steps = Math.ceil(dist / 1.5);
          const newCraters: { x: number; z: number; r: number; d: number }[] = [];
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const c = {
              x: THREE.MathUtils.lerp(p1.x, p2.x, t),
              z: THREE.MathUtils.lerp(p1.y, p2.y, t),
              r: 3.5,
              d: 2.5
            };
            saveCraterToChunk(c);
            newCraters.push(c);
          }
          setCraters((prev) => [...prev, ...newCraters]);
          setCratersVersion((v) => v + 1);
          setFlashes((prev) => [...prev, { pos: adjustedPoint.clone(), color: "#00ff00", id }]);
          
          const mid = start.clone().lerp(adjustedPoint, 0.5);
          setDebris((prev) => [
            ...prev, 
            { pos: adjustedPoint.clone(), color: "#1a4a1a", id },
            { pos: mid, color: "#1a4a1a", id: id + 1 }
          ]);
          
          const line = new THREE.Line3(start, adjustedPoint);
          applyDamage((d) => {
            const closest = new THREE.Vector3();
            line.closestPointToPoint(d.pos, true, closest);
            return d.pos.distanceTo(closest) < 3.5;
          }, 50, 100, "force");
        }, 50);
      }
    },
    [spell, shakeIntensity, camera, applyDamage, recordSpellCast, dummies]
  );

  const handlePointerDown = useCallback((e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
    const adjustedPoint = new THREE.Vector3(e.point.x, terrainY, e.point.z);
    if (spell === "prismatic-wall") {
      setDragStart(adjustedPoint.clone());
      setDragCurrent(adjustedPoint.clone());
      const ctrl = controls as import("three-stdlib").OrbitControls | null;
      if (ctrl) {
        Reflect.set(ctrl, "enabled", false);
      }
    } else {
      castInstantSpell(e.point);
    }
  }, [spell, controls, castInstantSpell]);

  const handlePointerMove = useCallback((e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
    if (dragStart && spell === "prismatic-wall") {
      const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
      const adjustedPoint = new THREE.Vector3(e.point.x, terrainY, e.point.z);
      setDragCurrent(adjustedPoint.clone());
    }
  }, [dragStart, spell]);

  const handlePointerUp = useCallback((e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    if (spell === "prismatic-wall" && dragStart) {
      e.stopPropagation();
      const terrainY = getTerrainHeight(e.point.x, e.point.z).height;
      const adjustedPoint = new THREE.Vector3(e.point.x, terrainY, e.point.z);
      setWalls((prev) => [...prev, { start: dragStart, end: adjustedPoint.clone(), id: Date.now() + Math.random() }]);
      setDragStart(null);
      setDragCurrent(null);
      const ctrl = controls as import("three-stdlib").OrbitControls | null;
      if (ctrl) {
        Reflect.set(ctrl, "enabled", true);
      }
      recordSpellCast();
    }
  }, [spell, dragStart, controls, recordSpellCast]);

  const handleZombieAttack = useCallback((dummyId: number, damage: number) => {
    if (dummyId === 99999) {
      if (playerHp > 0 && onPlayerHpChange) {
        onPlayerHpChange(Math.max(0, playerHp - damage));
        const info = DAMAGE_INFO["bludgeoning"];
        setTimeout(() => {
          setDamageTexts((texts) => [
            ...texts,
            {
              id: Math.random(),
              pos: camera.position.clone().add(new THREE.Vector3(0, -0.5, -1).applyQuaternion(camera.quaternion)),
              text: `-${damage} HP`,
              color: info.color
            }
          ]);
          setBloods((b) => [
            ...b,
            {
              id: Math.random(),
              pos: camera.position.clone().add(new THREE.Vector3(0, -0.8, -1.2).applyQuaternion(camera.quaternion))
            }
          ]);
        }, 0);
      }
      return;
    }
    setDummies((prev) =>
      prev.map((d) => {
        if (d.id === dummyId && d.hp > 0) {
          const nextHp = Math.max(0, d.hp - damage);
          const info = DAMAGE_INFO["bludgeoning"];
          setTimeout(() => {
            setDamageTexts((texts) => [
              ...texts,
              {
                id: Math.random(),
                pos: d.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
                text: `-${damage} ${info.name}`,
                color: info.color
              }
            ]);
            setBloods((b) => [
              ...b,
              {
                id: Math.random(),
                pos: d.pos.clone().add(new THREE.Vector3(0, 1, 0))
              }
            ]);
          }, 0);
          return {
            ...d,
            hp: nextHp,
            deathTime: nextHp <= 0 ? (d.deathTime || Date.now()) : undefined
          };
        }
        return d;
      })
    );
  }, [playerHp, onPlayerHpChange, camera]);

  const resetScene = useCallback(() => {
    setCraters([]);
    setDebris([]);
    setFireballs([]);
    setLightnings([]);
    setFlashes([]);
    setRays([]);
    setWalls([]);
    setDamageTexts([]);
    setBloods([]);
    setZombies([]);
    spawnDummies();
    spawnStructures();
    spawnPlants();
  }, [spawnDummies, spawnStructures, spawnPlants]);

  useFrame(() => {
    if (firstPerson) {
      playerDummy.pos.copy(camera.position);
      playerDummy.pos.y -= 1.8;
      playerDummy.target.copy(playerDummy.pos);
    }
  });

  useEffect(() => {
    if (!firstPerson || playerHp <= 0) return;
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".glass-overlay") || (e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
        return;
      }
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPoint = new THREE.Vector3();
      
      let castPoint: THREE.Vector3 | null = null;
      if (raycaster.ray.intersectPlane(plane, targetPoint)) {
        const dir = targetPoint.clone().sub(camera.position);
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const dot = dir.dot(lookDir);
        if (dot > 0 && dir.length() < 120) {
          castPoint = targetPoint;
        }
      }
      
      if (!castPoint) {
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        castPoint = camera.position.clone().addScaledVector(lookDir, 40);
      }
      
      const terrainY = getTerrainHeight(castPoint.x, castPoint.z).height;
      castPoint.y = terrainY;
      castInstantSpell(castPoint);
    };
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [firstPerson, camera, castInstantSpell, playerHp]);

  useEffect(() => {
    Reflect.set(window, "__spellLabReset", resetScene);
    const handle = requestAnimationFrame(() => {
      spawnDummies();
      spawnStructures();
      spawnPlants();
    });
    return () => {
      Reflect.deleteProperty(window, "__spellLabReset");
      cancelAnimationFrame(handle);
    };
  }, [resetScene, spawnDummies, spawnStructures, spawnPlants]);

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.3} />
      <directionalLight ref={sunLightRef} position={[10, 15, 5]} intensity={1.2} color="#ffeedd" castShadow />
      <directionalLight ref={moonLightRef} position={[-5, 10, -8]} intensity={0.5} color="#aaccff" />
      <fog ref={fogRef} attach="fog" args={["#1a0a2e", fogEnabled ? (viewDistance + 0.5) * CHUNK_SIZE * 0.4 : 1000, fogEnabled ? (viewDistance + 0.5) * CHUNK_SIZE : 5000]} />
      <Skybox sunPos={sunPos} />

      <SceneShake intensityRef={shakeIntensity}>
        <InfiniteTerrain cameraPos={camera.position} cratersVersion={cratersVersion} viewDistance={viewDistance} />
        {waterEnabled && <FluidSimulation craters={craters} cameraPos={camera.position} viewDistance={viewDistance} />}
        <GrassBlades craters={craters} cameraPos={camera.position} viewDistance={viewDistance} />

        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.01, 0]} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        >
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {dragStart && dragCurrent && spell === "prismatic-wall" && (
          <mesh 
            position={dragStart.clone().lerp(dragCurrent, 0.5)}
            onUpdate={(self) => self.lookAt(dragCurrent.x, dragStart.clone().lerp(dragCurrent, 0.5).y, dragCurrent.z)}
          >
            <boxGeometry args={[2.5, 0.8, dragStart.distanceTo(dragCurrent)]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}

        {sunTexture && (
          <mesh ref={sunMeshRef}>
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial 
              map={sunTexture} 
              transparent 
              color={new THREE.Color(2.0, 1.6, 0.4)} 
              depthWrite={false} 
              toneMapped={false} 
            />
          </mesh>
        )}

        {moonTexture && (
          <mesh ref={moonMeshRef}>
            <planeGeometry args={[80, 80]} />
            <meshBasicMaterial 
              map={moonTexture} 
              transparent 
              color={new THREE.Color(0.8, 0.9, 1.0)} 
              depthWrite={false} 
              toneMapped={false} 
            />
          </mesh>
        )}

        {firstPerson && playerHp > 0 && (
          <DummyEntity key="dummy-player" data={playerDummy} craters={craters} />
        )}
        {dummies.map((d) => (
          <DummyEntity key={`dummy-${d.id}`} data={d} craters={craters} />
        ))}

        {zombies.map((z) => (
          <ZombieEntity key={`zombie-${z.id}`} data={z} dummies={zombieTargets} onAttack={handleZombieAttack} craters={craters} />
        ))}

        {structures.map((s) => (
          <StructureEntity key={`structure-${s.id}`} data={s} craters={craters} spawnDebris={spawnDebris} />
        ))}

        {plants.map((p) => (
          <PlantEntity key={`plant-${p.id}`} data={p} craters={craters} spawnDebris={spawnDebris} />
        ))}

        {damageTexts.map((dt) => (
          <DamageText key={dt.id} pos={dt.pos} text={dt.text} color={dt.color} onDone={() => setDamageTexts(p => p.filter(x => x.id !== dt.id))} />
        ))}

        {bloods.map((b) => (
          <BloodParticles key={b.id} pos={b.pos} onDone={() => setBloods(p => p.filter(x => x.id !== b.id))} />
        ))}

        {fireballs.map((f) => (
          <Fireball key={f.id} pos={f.pos} onDone={() => setFireballs((p) => p.filter((x) => x.id !== f.id))} />
        ))}

        {lightnings.map((l) => (
          <LightningStrike
            key={l.id}
            pos={l.pos}
            boltCount={l.count}
            onDone={() => setLightnings((p) => p.filter((x) => x.id !== l.id))}
          />
        ))}

        {flashes.map((f) => (
          <ImpactFlash key={f.id} pos={f.pos} color={f.color} onDone={() => setFlashes(p => p.filter(x => x.id !== f.id))} />
        ))}

        {rays.map((r) => (
          <DisintegrateRay key={r.id} start={r.start} end={r.end} onDone={() => setRays(p => p.filter(x => x.id !== r.id))} />
        ))}

        {walls.map((w) => (
          <PrismaticWall key={w.id} start={w.start} end={w.end} applyDamage={applyDamage} onDone={() => setWalls(p => p.filter(x => x.id !== w.id))} />
        ))}

        {debris.map((d) => (
          <DebrisParticles key={d.id} pos={d.pos} color={d.color} onDone={() => setDebris(p => p.filter(x => x.id !== d.id))} />
        ))}
      </SceneShake>

      <EffectComposer>
        <Bloom luminanceThreshold={1.0} mipmapBlur intensity={2.5} radius={0.5} />
      </EffectComposer>
    </>
  );
}

/* ==================== Main Exported Component ==================== */
export type SpellType = "fireball" | "lightning" | "disintegrate" | "prismatic-wall" | "animate-dead";

export default function SpellLabScene({
  spell,
  viewDistance = 3,
  fogEnabled = true,
  waterEnabled = false,
  onCastSpellAction,
  firstPerson = false,
  playerHp = 100,
  onPlayerHpChange,
}: {
  spell: SpellType;
  onResetAction?: () => void;
  viewDistance?: number;
  fogEnabled?: boolean;
  waterEnabled?: boolean;
  onCastSpellAction?: () => void;
  firstPerson?: boolean;
  playerHp?: number;
  onPlayerHpChange?: (hp: number) => void;
}) {
  const shakeIntensity = useRef(0);
  const controlsRef = useRef<import("three-stdlib").OrbitControls | null>(null);

  return (
    <Canvas
      camera={{ position: [0, 60, 80], fov: 50, far: 3000 }}
      shadows
      style={{ width: "100%", height: "100%", cursor: "crosshair" }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
    >
      <React.Suspense fallback={null}>
        <SceneContent 
          spell={spell} 
          shakeIntensity={shakeIntensity} 
          viewDistance={viewDistance} 
          fogEnabled={fogEnabled} 
          waterEnabled={waterEnabled} 
          onCastSpellAction={onCastSpellAction}
          firstPerson={firstPerson}
          playerHp={playerHp}
          onPlayerHpChange={onPlayerHpChange}
        />
        <KeyboardControls controlsRef={controlsRef} firstPerson={firstPerson} />
      </React.Suspense>
      {firstPerson ? (
        <PointerLockControls makeDefault />
      ) : (
        <OrbitControls 
          ref={controlsRef}
          makeDefault
          mouseButtons={{
            LEFT: -1 as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.PAN
          }}
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      )}
    </Canvas>
  );
}
