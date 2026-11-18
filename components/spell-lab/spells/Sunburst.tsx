import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./InfiniteTerrain";

export interface SunburstProps {
  center: THREE.Vector3;
  onImpact?: () => void;
  onDone: () => void;
}

export function Sunburst({ center, onImpact, onDone }: SunburstProps) {
  const groupRef = useRef<THREE.Group>(null);
  const chargeOrbRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const chargeLightRef = useRef<THREE.PointLight>(null);
  const filamentsRef = useRef<THREE.Group>(null);

  const flashRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);

  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const groundGlowRef = useRef<THREE.Mesh>(null);

  const spearsRef = useRef<THREE.InstancedMesh>(null);

  const burstParticlesRef = useRef<THREE.Points>(null);
  const embersRef = useRef<THREE.Points>(null);

  const life = useRef(0);
  const impactCalled = useRef(false);
  const doneCalled = useRef(false);
  const impactTimeoutRef = useRef<number | null>(null);
  const onImpactRef = useRef<SunburstProps["onImpact"]>(undefined);
  const onDoneRef = useRef<SunburstProps["onDone"]>(onDone);
  const spearDummyRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useEffect(() => {
    onImpactRef.current = onImpact;
    onDoneRef.current = onDone;
  });

  const groundY = useMemo(() => {
    try {
      const h = getTerrainHeight(center.x, center.z);
      return h.height;
    } catch {
      return 0;
    }
  }, [center]);

  const chargeOrbGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const coronaGeo = useMemo(() => new THREE.TorusGeometry(1, 0.08, 16, 32), []);
  const flashGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.5, 1.0, 64, 1), []);
  const groundGlowGeo = useMemo(() => new THREE.RingGeometry(0.5, 1.0, 64, 1), []);
  const spearGeo = useMemo(() => new THREE.PlaneGeometry(0.08, 1), []);

  const filamentGeos = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 24; i++) {
      geos.push(new THREE.CylinderGeometry(0.015, 0.008, 1, 8));
    }
    return geos;
  }, []);

  const filamentData = useMemo(() => {
    const data: Array<{ angle: number; radius: number }> = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      data.push({ angle, radius: 1.0 });
    }
    return data;
  }, []);

  const spearData = useMemo(() => {
    const data: Array<{ angle: number; tilt: number; phase: number }> = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const tilt = (Math.random() * 20 + 15) * (Math.PI / 180);
      data.push({ angle, tilt, phase: Math.random() * 0.2 });
    }
    return data;
  }, []);

  const burstGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 700;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      p[i * 3] = 0;
      p[i * 3 + 1] = 0;
      p[i * 3 + 2] = 0;
      const t = Math.random();
      if (t < 0.6) {
        c[i * 4] = 1.0;
        c[i * 4 + 1] = 0.965;
        c[i * 4 + 2] = 0.76;
      } else if (t < 0.85) {
        c[i * 4] = 1.0;
        c[i * 4 + 1] = 0.835;
        c[i * 4 + 2] = 0.29;
      } else {
        c[i * 4] = 1.0;
        c[i * 4 + 1] = 0.616;
        c[i * 4 + 2] = 0.0;
      }
      c[i * 4 + 3] = 1.0;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.1) * Math.PI * 0.6;
      const speed = 12 + Math.random() * 18;
      v[i * 3] = Math.cos(angle) * Math.cos(elev) * speed;
      v[i * 3 + 1] = Math.sin(elev) * speed * 0.3;
      v[i * 3 + 2] = Math.sin(angle) * Math.cos(elev) * speed;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  const embersGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pCount = 150;
    const p = new Float32Array(pCount * 3);
    const c = new Float32Array(pCount * 4);
    const v = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      p[i * 3] = (Math.random() - 0.5) * 4;
      p[i * 3 + 1] = 0.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 4;
      c[i * 4] = 1.0;
      c[i * 4 + 1] = 0.835;
      c[i * 4 + 2] = 0.29;
      c[i * 4 + 3] = 1.0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      v[i * 3] = Math.cos(angle) * speed * 0.3;
      v[i * 3 + 1] = 1.5 + Math.random() * 2.5;
      v[i * 3 + 2] = Math.sin(angle) * speed * 0.3;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 4));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  const chargeOrbMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#fff6c2",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const coronaMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffd54a",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const filamentMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#fff6c2",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const flashMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const ring1Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffd54a",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const ring2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const groundGlowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff9d00",
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const spearMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#fff6c2",
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  const burstMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  const embersMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  useEffect(() => {
    impactTimeoutRef.current = window.setTimeout(() => {
      if (!impactCalled.current) {
        impactCalled.current = true;
        if (onImpactRef.current) {
          onImpactRef.current();
        }
      }
    }, 500);

    return () => {
      if (impactTimeoutRef.current !== null) {
        clearTimeout(impactTimeoutRef.current);
        impactTimeoutRef.current = null;
      }
      chargeOrbGeo.dispose();
      coronaGeo.dispose();
      flashGeo.dispose();
      ringGeo.dispose();
      groundGlowGeo.dispose();
      spearGeo.dispose();
      filamentGeos.forEach((g) => g.dispose());
      burstGeo.dispose();
      embersGeo.dispose();

      chargeOrbMat.dispose();
      coronaMat.dispose();
      filamentMat.dispose();
      flashMat.dispose();
      ring1Mat.dispose();
      ring2Mat.dispose();
      groundGlowMat.dispose();
      spearMat.dispose();
      burstMat.dispose();
      embersMat.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    life.current += delta;
    const t = life.current;

    if (t < 0.5) {
      const chargeT = t / 0.5;
      const orbRadius = THREE.MathUtils.lerp(0.2, 1.2, chargeT);
      if (chargeOrbRef.current) {
        chargeOrbRef.current.scale.setScalar(orbRadius);
        chargeOrbRef.current.position.set(center.x, groundY + 2.2, center.z);
        chargeOrbRef.current.visible = true;
      }
      if (coronaRef.current) {
        coronaRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.5, chargeT));
        coronaRef.current.position.set(center.x, groundY + 2.2, center.z);
        coronaRef.current.rotation.z += delta * (2 + chargeT * 3);
        coronaRef.current.rotation.x += delta * 1.5;
        coronaRef.current.visible = true;
      }
      if (chargeLightRef.current) {
        chargeLightRef.current.position.set(center.x, groundY + 2.2, center.z);
        chargeLightRef.current.intensity = THREE.MathUtils.lerp(0, 220, chargeT);
        chargeLightRef.current.visible = true;
      }
      if (filamentsRef.current) {
        filamentsRef.current.visible = true;
        filamentsRef.current.position.set(center.x, groundY + 2.2, center.z);
        filamentsRef.current.rotation.y += delta * 0.5;
        filamentsRef.current.children.forEach((child, i) => {
          const data = filamentData[i];
          const mesh = child as THREE.Mesh;
          if (mesh) {
            const r = THREE.MathUtils.lerp(data.radius * 1.5, data.radius * 0.3, chargeT);
            mesh.position.set(Math.cos(data.angle) * r, 0, Math.sin(data.angle) * r);
            mesh.lookAt(0, 0, 0);
            const scale = THREE.MathUtils.lerp(0.3, 1.0, chargeT);
            mesh.scale.set(1, scale, 1);
            (mesh.material as THREE.MeshBasicMaterial).opacity = chargeT * 0.7;
          }
        });
      }
      if (flashRef.current) flashRef.current.visible = false;
      if (flashLightRef.current) flashLightRef.current.visible = false;
      if (ring1Ref.current) ring1Ref.current.visible = false;
      if (ring2Ref.current) ring2Ref.current.visible = false;
      if (groundGlowRef.current) groundGlowRef.current.visible = false;
      if (spearsRef.current) spearsRef.current.visible = false;
      if (burstParticlesRef.current) burstParticlesRef.current.visible = false;
      if (embersRef.current) embersRef.current.visible = false;
    } else {
      if (chargeOrbRef.current) chargeOrbRef.current.visible = false;
      if (coronaRef.current) coronaRef.current.visible = false;
      if (chargeLightRef.current) chargeLightRef.current.visible = false;
      if (filamentsRef.current) filamentsRef.current.visible = false;
    }

    if (t >= 0.5 && t < 0.85) {
      const flashT = (t - 0.5) / 0.35;
      if (flashRef.current) {
        flashRef.current.visible = true;
        flashRef.current.position.set(center.x, groundY + 2, center.z);
        const flashRadius = THREE.MathUtils.lerp(0.5, 18, flashT);
        flashRef.current.scale.setScalar(flashRadius);
        (flashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - flashT * 1.2);
      }
      if (flashLightRef.current) {
        flashLightRef.current.position.set(center.x, groundY + 3, center.z);
        flashLightRef.current.intensity = THREE.MathUtils.lerp(500, 50, flashT);
        flashLightRef.current.visible = true;
      }
    } else if (t >= 0.85) {
      if (flashRef.current) flashRef.current.visible = false;
      if (flashLightRef.current) {
        flashLightRef.current.intensity *= 0.9;
        if (flashLightRef.current.intensity < 1) flashLightRef.current.visible = false;
      }
    }

    if (t >= 0.5 && t < 1.3) {
      const ringT = (t - 0.5) / 0.8;
      if (ring1Ref.current) {
        ring1Ref.current.visible = true;
        ring1Ref.current.position.set(center.x, groundY + 0.05, center.z);
        ring1Ref.current.rotation.x = -Math.PI / 2;
        const outerR = THREE.MathUtils.lerp(1.5, 18, ringT);
        ring1Ref.current.scale.set(outerR, outerR, 1);
        (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.9, 0.1, ringT);
      }
    } else if (t >= 1.3) {
      if (ring1Ref.current) ring1Ref.current.visible = false;
    }

    if (t >= 0.62 && t < 1.3) {
      const ringT = (t - 0.62) / 0.68;
      if (ring2Ref.current) {
        ring2Ref.current.visible = true;
        ring2Ref.current.position.set(center.x, groundY + 0.06, center.z);
        ring2Ref.current.rotation.x = -Math.PI / 2;
        const outerR = THREE.MathUtils.lerp(2, 22, ringT);
        ring2Ref.current.scale.set(outerR, outerR, 1);
        (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.8, 0.05, ringT);
      }
    } else if (t >= 1.3) {
      if (ring2Ref.current) ring2Ref.current.visible = false;
    }

    if (t >= 0.5 && t < 4.5) {
      const glowT = (t - 0.5) / 4.0;
      if (groundGlowRef.current) {
        groundGlowRef.current.visible = true;
        groundGlowRef.current.position.set(center.x, groundY + 0.02, center.z);
        groundGlowRef.current.rotation.x = -Math.PI / 2;
        groundGlowRef.current.scale.set(18, 18, 1);
        (groundGlowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.6, 0, glowT);
      }
    } else if (t >= 4.5) {
      if (groundGlowRef.current) groundGlowRef.current.visible = false;
    }

    if (t >= 0.5 && t < 1.1) {
      const spearT = (t - 0.5) / 0.6;
      if (spearsRef.current) {
        spearsRef.current.visible = true;
        const dummy = spearDummyRef.current;
        for (let i = 0; i < spearData.length; i++) {
          const data = spearData[i];
          const startDist = 2;
          const dist = THREE.MathUtils.lerp(startDist, 20, spearT);
          const height = THREE.MathUtils.lerp(4, 20, spearT);
          const x = Math.cos(data.angle) * dist;
          const z = Math.sin(data.angle) * dist;
          dummy.position.set(center.x + x, groundY + height * 0.5, center.z + z);
          dummy.rotation.set(data.tilt, data.angle + Math.PI / 2, 0);
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          spearsRef.current.setMatrixAt(i, dummy.matrix);
        }
        spearsRef.current.instanceMatrix.needsUpdate = true;
        const mat = spearsRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(0.9, 0, spearT * 1.5);
      }
    } else if (t >= 1.1) {
      if (spearsRef.current) spearsRef.current.visible = false;
    }

    if (t >= 0.5 && t < 3.0) {
      if (burstParticlesRef.current) {
        burstParticlesRef.current.visible = true;
        burstParticlesRef.current.position.set(center.x, groundY + 1, center.z);
        const pPos = burstParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = burstParticlesRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = burstParticlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const burstT = Math.min((t - 0.5) / 2.5, 1);
        for (let i = 0; i < pPos.count; i++) {
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta * 0.3);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta * 0.3);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta * 0.3);
          vel.setY(i, vel.getY(i) - 2.0 * delta);
          const fade = Math.max(0, 1.0 - burstT * 1.2);
          col.setW(i, fade);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (t >= 3.0) {
      if (burstParticlesRef.current) burstParticlesRef.current.visible = false;
    }

    if (t >= 3.0 && t < 5.0) {
      if (embersRef.current) {
        embersRef.current.visible = true;
        embersRef.current.position.set(center.x, groundY, center.z);
        const pPos = embersRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const vel = embersRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        const col = embersRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const emberT = (t - 3.0) / 2.0;
        for (let i = 0; i < pPos.count; i++) {
          pPos.setX(i, pPos.getX(i) + vel.getX(i) * delta);
          pPos.setY(i, pPos.getY(i) + vel.getY(i) * delta);
          pPos.setZ(i, pPos.getZ(i) + vel.getZ(i) * delta);
          vel.setX(i, vel.getX(i) * 0.98);
          vel.setZ(i, vel.getZ(i) * 0.98);
          const fade = Math.max(0, 1.0 - emberT);
          col.setW(i, fade);
        }
        pPos.needsUpdate = true;
        vel.needsUpdate = true;
        col.needsUpdate = true;
      }
    } else if (t >= 5.0) {
      if (embersRef.current) embersRef.current.visible = false;
    }

    if (t >= 5.0 && !doneCalled.current) {
      doneCalled.current = true;
      if (onDoneRef.current) {
        onDoneRef.current();
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={chargeOrbRef} geometry={chargeOrbGeo} material={chargeOrbMat} visible={false} />
      <mesh ref={coronaRef} geometry={coronaGeo} material={coronaMat} visible={false} />
      <group ref={filamentsRef} visible={false}>
        {filamentGeos.map((geo, i) => (
          <mesh key={i} geometry={geo} material={filamentMat} />
        ))}
      </group>
      <pointLight ref={chargeLightRef} color="#fff6c2" intensity={0} distance={30} decay={2} visible={false} />

      <mesh ref={flashRef} geometry={flashGeo} material={flashMat} visible={false} />
      <pointLight ref={flashLightRef} color="#ffffff" intensity={0} distance={60} decay={2} visible={false} />

      <mesh ref={ring1Ref} geometry={ringGeo} material={ring1Mat} visible={false} />
      <mesh ref={ring2Ref} geometry={ringGeo} material={ring2Mat} visible={false} />
      <mesh ref={groundGlowRef} geometry={groundGlowGeo} material={groundGlowMat} visible={false} />

      <instancedMesh ref={spearsRef} args={[spearGeo, spearMat, 48]} visible={false} />

      <points ref={burstParticlesRef} geometry={burstGeo} material={burstMat} visible={false} />

      <points ref={embersRef} geometry={embersGeo} material={embersMat} visible={false} />
    </group>
  );
}
