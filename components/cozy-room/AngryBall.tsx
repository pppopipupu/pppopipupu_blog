"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { playSound } from "./Sounds";

export const ANGRY_BALL_Y = 1.71;
const SHARD_COUNT = 10;

export default function AngryBall({ x = 2.45, z = -4.85 }: { x?: number; z?: number }) {
  const stateRef = useRef<"idle" | "exploding" | "respawning">("idle");
  const ballRef = useRef<THREE.Mesh>(null);
  const ballMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const flashMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const respawnTimer = useRef(0);
  const shardTimer = useRef(0);
  const respawnPlayed = useRef(false);

  const texture = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/face_angry.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const shardData = useMemo(
    () =>
      Array.from({ length: SHARD_COUNT }, () => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          1.2 + Math.random() * 1.2,
          (Math.random() - 0.5) * 2.4
        ).normalize(),
        speed: 2.2 + Math.random() * 1.8,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        scale0: 0.06 + Math.random() * 0.09,
        color: new THREE.Color().setHSL(Math.random(), 0.75, 0.6),
      })),
    []
  );

  const explode = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6 || stateRef.current !== "idle") return;
    stateRef.current = "exploding";
    respawnPlayed.current = false;
    shardTimer.current = 0;
    const origin = new THREE.Vector3(x, ANGRY_BALL_Y, z);
    shardRefs.current.forEach((shard, i) => {
      if (!shard) return;
      shard.position.copy(origin);
      shard.userData.vel = shardData[i].dir.clone().multiplyScalar(shardData[i].speed);
      shard.userData.scale0 = shardData[i].scale0;
      shard.visible = true;
    });
    if (flashRef.current) {
      flashRef.current.visible = true;
      flashRef.current.scale.setScalar(0.5);
    }
    if (flashMatRef.current) flashMatRef.current.opacity = 0.85;
    playSound("pop");
  };

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (stateRef.current !== "idle") return;
    if (ballRef.current) ballRef.current.scale.setScalar(1.15);
    if (ballMatRef.current) ballMatRef.current.emissiveIntensity = 0.5;
  };

  const handleOut = () => {
    if (ballRef.current) ballRef.current.scale.setScalar(1);
    if (ballMatRef.current) ballMatRef.current.emissiveIntensity = 0;
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const st = stateRef.current;

    if (st === "idle" && ballRef.current) {
      ballRef.current.rotation.y += delta * 0.6;
      ballRef.current.rotation.x += delta * 0.18;
      ballRef.current.position.y = ANGRY_BALL_Y + Math.sin(t * 1.5) * 0.035;
    } else if (st === "exploding") {
      shardTimer.current += delta;
      shardRefs.current.forEach((shard, i) => {
        if (!shard) return;
        const vel = shard.userData.vel as THREE.Vector3 | undefined;
        if (!vel) return;
        vel.y -= 3.4 * delta;
        shard.position.addScaledVector(vel, delta);
        shard.rotation.x += shardData[i].spin.x * delta;
        shard.rotation.y += shardData[i].spin.y * delta;
        shard.rotation.z += shardData[i].spin.z * delta;
        shard.scale.setScalar(
          Math.max(0.001, (shard.userData.scale0 as number) * (1 - shardTimer.current * 0.55))
        );
      });
      if (flashMatRef.current) {
        flashMatRef.current.opacity = Math.max(0, 0.85 - shardTimer.current * 0.5);
      }
      if (flashRef.current) {
        flashRef.current.scale.setScalar(0.5 + shardTimer.current * 1.1);
      }
      if (shardTimer.current > 1.7) {
        stateRef.current = "respawning";
        respawnTimer.current = 0;
        shardRefs.current.forEach((s) => {
          if (s) s.visible = false;
        });
        if (flashRef.current) flashRef.current.visible = false;
      }
    } else if (st === "respawning" && ballRef.current) {
      respawnTimer.current += delta;
      const k = Math.min(1, respawnTimer.current / 0.75);
      const bounce = Math.abs(Math.sin(k * Math.PI * 2.6)) * (1 - k) * 0.35;
      ballRef.current.visible = true;
      ballRef.current.position.y = ANGRY_BALL_Y - 0.55 + k * 0.55 + bounce;
      ballRef.current.scale.setScalar(Math.max(0.02, k) * (1 + bounce * 0.35));
      ballRef.current.rotation.y += delta * 0.9;
      if (k >= 1 && !respawnPlayed.current) {
        respawnPlayed.current = true;
        playSound("tick");
        stateRef.current = "idle";
      }
    }
  });

  return (
    <group>
      <mesh
        ref={ballRef}
        name="angry-ball"
        position={[x, ANGRY_BALL_Y, z]}
        castShadow
        onClick={explode}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshStandardMaterial
          ref={ballMatRef}
          map={texture}
          emissive="#ff4444"
          emissiveIntensity={0}
          roughness={0.45}
        />
      </mesh>
      {shardData.map((data, i) => (
        <mesh
          key={i}
          name="angry-shard"
          ref={(el) => {
            shardRefs.current[i] = el;
          }}
          visible={false}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.35} flatShading />
        </mesh>
      ))}
      <mesh ref={flashRef} visible={false} scale={0.5}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial ref={flashMatRef} color="#ffd27f" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}
