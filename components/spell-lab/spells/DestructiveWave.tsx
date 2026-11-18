import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type DestructiveWaveVariant = "radiant" | "necrotic";

export interface DestructiveWaveProps {
  center: THREE.Vector3;
  variant: DestructiveWaveVariant;
  onImpact?: () => void;
  onDone: () => void;
}

export function DestructiveWave({ center, variant, onImpact, onDone }: DestructiveWaveProps) {
  const groupRef = useRef<THREE.Group>(null);
  const life = useRef(0);
  const onImpactCalled = useRef(false);
  const onDoneCalled = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onImpactRef.current = onImpact;
  }, [onImpact]);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const variantColor = useMemo(
    () => new THREE.Color(variant === "radiant" ? "#ffcf5a" : "#a855f7"),
    [variant]
  );
  const thunderColor = useMemo(() => new THREE.Color("#bff7ff"), []);

  // Sigil arcs
  const sigilArcGeo1 = useMemo(() => {
    const geo = new THREE.RingGeometry(1, 1.15, 64, 1, 0, Math.PI * 1.5);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const sigilArcGeo2 = useMemo(() => {
    const geo = new THREE.RingGeometry(1, 1.15, 64, 1, Math.PI, Math.PI * 1.5);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const sigilMat1 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: variantColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [variantColor]
  );
  const sigilMat2 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: thunderColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [thunderColor]
  );

  // Rings - use ring band not filled disc
  const ringGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(0.82, 1, 64, 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const ringMatOuter = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: variantColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [variantColor]
  );
  const ringMatInner = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: thunderColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [thunderColor]
  );

  // Hemisphere shell
  const shellGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const shellMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: variantColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [variantColor]
  );

  // Lightning arcs along circumference
  const arcData = useMemo(() => {
    const arcs: Array<{ geo: THREE.BufferGeometry; mat: THREE.LineBasicMaterial; angle: number; delay: number }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const geo = new THREE.BufferGeometry();
      const points: number[] = [];
      const segs = 4;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const r = 1 * (0.7 + Math.random() * 0.3);
        const jitter = (Math.random() - 0.5) * 0.4;
        const a = angle + jitter;
        points.push(Math.cos(a) * r * (1 - t * 0.3), 0.05 + Math.random() * 0.1, Math.sin(a) * r * (1 - t * 0.3));
      }
      geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      const mat = new THREE.LineBasicMaterial({
        color: thunderColor,
        transparent: true,
        opacity: 0,
        linewidth: 1,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      arcs.push({ geo, mat, angle, delay: Math.random() * 0.05 });
    }
    return arcs;
  }, [thunderColor]);

  const arcLines = useMemo(
    () =>
      arcData.map((arc, i) => {
        const line = new THREE.Line(arc.geo, arc.mat);
        line.name = `arc${i}`;
        return line;
      }),
    [arcData]
  );

  // Dust particles (450) - thrown outward/up with gravity
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 450;
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    const col = new THREE.Color("#8b7355");
    for (let i = 0; i < count; i++) {
      p[i * 3] = 0;
      p[i * 3 + 1] = 0.01;
      p[i * 3 + 2] = 0;
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      v[i * 3] = Math.cos(angle) * speed;
      v[i * 3 + 1] = 2 + Math.random() * 4;
      v[i * 3 + 2] = Math.sin(angle) * speed;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);
  const dustMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
    []
  );

  // Sparks (250) variant colored
  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 250;
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = 0;
      p[i * 3 + 1] = 0.01;
      p[i * 3 + 2] = 0;
      c[i * 3] = variantColor.r;
      c[i * 3 + 1] = variantColor.g;
      c[i * 3 + 2] = variantColor.b;
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      v[i * 3] = Math.cos(angle) * speed;
      v[i * 3 + 1] = 3 + Math.random() * 5;
      v[i * 3 + 2] = Math.sin(angle) * speed;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(v, 3));
    return g;
  }, [variantColor]);
  const sparkMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    []
  );

  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!onImpactCalled.current && onImpactRef.current) {
        onImpactCalled.current = true;
        onImpactRef.current();
      }
    }, 550);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      // Dispose manual resources on unmount
      sigilArcGeo1.dispose();
      sigilArcGeo2.dispose();
      sigilMat1.dispose();
      sigilMat2.dispose();
      ringGeo.dispose();
      ringMatOuter.dispose();
      ringMatInner.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      arcData.forEach((a) => {
        a.geo.dispose();
        a.mat.dispose();
      });
      dustGeo.dispose();
      dustMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    life.current += delta;
    const t = life.current;

    // Sigil 0-0.15s
    const sigil1 = groupRef.current?.getObjectByName("sigil1") as THREE.Mesh;
    const sigil2 = groupRef.current?.getObjectByName("sigil2") as THREE.Mesh;
    if (sigil1 && sigil2) {
      if (t <= 0.15) {
        const p = t / 0.15;
        const r = 1 + p * 8;
        sigil1.scale.set(r, 1, r);
        sigil2.scale.set(r, 1, r);
        sigil1.rotation.z += delta * 2;
        sigil2.rotation.z -= delta * 2.5;
        sigilMat1.opacity = p * 0.9;
        sigilMat2.opacity = p * 0.9;
      } else {
        sigilMat1.opacity = Math.max(0, sigilMat1.opacity - delta * 4);
        sigilMat2.opacity = Math.max(0, sigilMat2.opacity - delta * 4);
        sigil1.rotation.z += delta * 2;
        sigil2.rotation.z -= delta * 2.5;
      }
    }

    // Rings 0.15-0.75s
    const ringOut = groupRef.current?.getObjectByName("ringOut") as THREE.Mesh;
    const ringIn = groupRef.current?.getObjectByName("ringIn") as THREE.Mesh;
    if (ringOut && ringIn) {
      if (t >= 0.15 && t <= 0.75) {
        const p = (t - 0.15) / 0.6;
        const r = p * 9;
        ringOut.scale.set(r, 1, r);
        ringMatOuter.opacity = (1 - p) * 0.9;
        const innerStart = 0.15 + 0.08;
        if (t >= innerStart) {
          const p2 = Math.min(1, (t - innerStart) / (0.75 - innerStart));
          const r2 = p2 * 9;
          ringIn.scale.set(r2, 1, r2);
          ringMatInner.opacity = (1 - p2) * 0.9;
        } else {
          ringIn.scale.set(0, 1, 0);
          ringMatInner.opacity = 0;
        }
      } else {
        ringMatOuter.opacity = Math.max(0, ringMatOuter.opacity - delta * 6);
        ringMatInner.opacity = Math.max(0, ringMatInner.opacity - delta * 6);
      }
    }

    // Shell 0.15-0.65s
    const shell = groupRef.current?.getObjectByName("shell") as THREE.Mesh;
    if (shell) {
      if (t >= 0.15 && t <= 0.65) {
        const p = (t - 0.15) / 0.5;
        const r = p * 9;
        shell.scale.set(r, r, r);
        shellMat.opacity = (1 - p) * 0.4;
      } else {
        shellMat.opacity = Math.max(0, shellMat.opacity - delta * 6);
      }
    }

    // Arcs scale with ring
    const ringScale = t >= 0.15 && t <= 0.75 ? Math.max(0, (t - 0.15) / 0.6) * 9 : (t > 0.75 ? 9 : 0);
    arcData.forEach((arc, i) => {
      const arcObj = groupRef.current?.getObjectByName(`arc${i}`) as THREE.Line;
      if (arcObj && arcObj.material) {
        const mat = arcObj.material as THREE.LineBasicMaterial;
        if (ringScale > 0 && t >= 0.15 && t <= 0.4) {
          const localT = (t - 0.15 - arc.delay) / 0.25;
          if (localT >= 0 && localT <= 1) {
            mat.opacity = Math.sin(localT * Math.PI) * 0.9;
            arcObj.scale.set(ringScale, 1, ringScale);
          } else {
            mat.opacity = Math.max(0, mat.opacity - delta * 10);
            arcObj.scale.set(ringScale, 1, ringScale);
          }
        } else {
          mat.opacity = Math.max(0, mat.opacity - delta * 10);
          if (ringScale > 0) {
            arcObj.scale.set(ringScale, 1, ringScale);
          }
        }
      }
    });

    // Particles 0.15-1.4s
    if (t >= 0.15 && t <= 1.4) {
      dustMat.opacity = 0.8;
      sparkMat.opacity = 0.9;
      const dustPos = dustGeo.attributes.position as THREE.BufferAttribute;
      const dustVel = dustGeo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < dustPos.count; i++) {
        dustPos.setX(i, dustPos.getX(i) + dustVel.getX(i) * delta);
        dustPos.setY(i, dustPos.getY(i) + dustVel.getY(i) * delta);
        dustPos.setZ(i, dustPos.getZ(i) + dustVel.getZ(i) * delta);
        dustVel.setY(i, dustVel.getY(i) - 9.8 * delta * 0.5);
      }
      dustPos.needsUpdate = true;
      dustVel.needsUpdate = true;

      const sparkPos = sparkGeo.attributes.position as THREE.BufferAttribute;
      const sparkVel = sparkGeo.attributes.velocity as THREE.BufferAttribute;
      for (let i = 0; i < sparkPos.count; i++) {
        sparkPos.setX(i, sparkPos.getX(i) + sparkVel.getX(i) * delta);
        sparkPos.setY(i, sparkPos.getY(i) + sparkVel.getY(i) * delta);
        sparkPos.setZ(i, sparkPos.getZ(i) + sparkVel.getZ(i) * delta);
        sparkVel.setY(i, sparkVel.getY(i) - 12 * delta);
      }
      sparkPos.needsUpdate = true;
      sparkVel.needsUpdate = true;
    } else {
      dustMat.opacity = Math.max(0, dustMat.opacity - delta * 3);
      sparkMat.opacity = Math.max(0, sparkMat.opacity - delta * 3);
    }

    // Light flash at impact
    if (lightRef.current) {
      if (t >= 0.15 && t <= 0.25) {
        const p = 1 - (t - 0.15) / 0.1;
        lightRef.current.intensity = p * 80;
      } else {
        lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 200);
      }
    }

    if (t >= 2.4 && !onDoneCalled.current) {
      onDoneCalled.current = true;
      onDoneRef.current();
    }
  });

  return (
    <group ref={groupRef} position={[center.x, center.y + 0.01, center.z]}>
      <mesh name="sigil1" geometry={sigilArcGeo1} material={sigilMat1} rotation={[0, 0, 0]} />
      <mesh name="sigil2" geometry={sigilArcGeo2} material={sigilMat2} rotation={[0, Math.PI / 4, 0]} />
      <mesh name="ringOut" geometry={ringGeo} material={ringMatOuter} scale={[0, 1, 0]} />
      <mesh name="ringIn" geometry={ringGeo} material={ringMatInner} scale={[0, 1, 0]} />
      <mesh name="shell" geometry={shellGeo} material={shellMat} position={[0, 0, 0]} scale={[0, 0, 0]} />
      {arcLines.map((line) => (
        <primitive key={line.name} object={line} />
      ))}
      <points geometry={dustGeo} material={dustMat} />
      <points geometry={sparkGeo} material={sparkMat} />
      <pointLight ref={lightRef} position={[0, 2, 0]} color={thunderColor} intensity={0} distance={30} />
    </group>
  );
}
