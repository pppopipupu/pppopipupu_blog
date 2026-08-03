"use client";

import React, { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { playSound } from "./Sounds";

export function RoomColliders() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[8.5, 0.15, 7]} position={[0, -0.15, 0]} />
        <CuboidCollider args={[0.1, 2.0, 7]} position={[-8.5, 2.0, 0]} />
        <CuboidCollider args={[0.1, 2.0, 7]} position={[8.5, 2.0, 0]} />
        <CuboidCollider args={[8.5, 2.0, 0.1]} position={[0, 2.0, -7]} />
        <CuboidCollider args={[8.5, 0.3, 0.1]} position={[0, 0.3, 7.1]} />
        <CuboidCollider args={[2.2, 0.08, 0.8]} position={[2.2, 1.25, -5.6]} />
        <CuboidCollider args={[1.1, 0.1, 1.7]} position={[-6.6, 0.58, 2.6]} />
        <CuboidCollider args={[0.53, 0.5, 0.53]} position={[-7.0, 0.5, 4.4]} />
        <CuboidCollider args={[0.43, 1.45, 1.2]} position={[-7.9, 1.45, -4.6]} />
        <CuboidCollider args={[1.4, 0.35, 0.55]} position={[6.2, 0.35, -2.6]} />
        <CuboidCollider args={[0.75, 0.22, 0.43]} position={[6.2, 0.22, -4.7]} />
        <CuboidCollider args={[1.5, 0.4, 0.28]} position={[6.4, 0.4, -6.3]} />
        <CuboidCollider args={[0.75, 0.2, 0.25]} position={[-6.0, 0.2, 5.4]} />
      </RigidBody>
    </group>
  );
}

const BALL_START: [number, number, number] = [1.0, 1.45, -5.55];

function BouncyBall() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const HOVER = new THREE.Color(0xffffff);
  const NONE = new THREE.Color(0x000000);

  const throwBall = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const body = bodyRef.current;
    if (!body) return;
    const dir = Math.random() * Math.PI * 2;
    body.applyImpulse(
      { x: Math.cos(dir) * 2.6 + (Math.random() - 0.5) * 1.2, y: 4.6 + Math.random() * 1.4, z: Math.sin(dir) * 2.6 },
      true
    );
    playSound("whistle");
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={BALL_START}
      colliders="ball"
      restitution={0.82}
      friction={0.5}
      linearDamping={0.12}
      angularDamping={0.4}
      canSleep
    >
      <mesh
        castShadow
        receiveShadow
        onClick={throwBall}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (matRef.current) {
            matRef.current.emissive.copy(HOVER);
            matRef.current.emissiveIntensity = 0.45;
          }
        }}
        onPointerOut={() => {
          if (matRef.current) {
            matRef.current.emissive.copy(NONE);
            matRef.current.emissiveIntensity = 0;
          }
        }}
      >
        <sphereGeometry args={[0.16, 18, 14]} />
        <meshStandardMaterial ref={matRef} color="#59d8ff" roughness={0.3} emissive="#0a84ff" />
      </mesh>
    </RigidBody>
  );
}

const BOX_START: [number, number, number] = [1.6, 0.24, 2.2];

function GiftBox() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const kick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const body = bodyRef.current;
    if (!body) return;
    const dir = Math.random() * Math.PI * 2;
    body.applyImpulse(
      { x: Math.cos(dir) * 2.4, y: 2.2 + Math.random() * 0.8, z: Math.sin(dir) * 2.4 },
      true
    );
    playSound("tick");
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={BOX_START}
      colliders="cuboid"
      restitution={0.45}
      friction={0.6}
      linearDamping={0.2}
      angularDamping={0.3}
      canSleep
    >
      <group
        onClick={kick}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (matRef.current) {
            matRef.current.emissive.copy(new THREE.Color(0xffffff));
            matRef.current.emissiveIntensity = 0.4;
          }
        }}
        onPointerOut={() => {
          if (matRef.current) {
            matRef.current.emissive.copy(new THREE.Color(0x000000));
            matRef.current.emissiveIntensity = 0;
          }
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.34, 0.34]} />
          <meshStandardMaterial ref={matRef} color="#ffd166" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.175, 0]}>
          <boxGeometry args={[0.38, 0.07, 0.38]} />
          <meshStandardMaterial color="#ff9e7e" roughness={0.5} />
        </mesh>
        <mesh rotation={[0, Math.PI / 4, 0]} position={[0, 0, 0.0]}>
          <boxGeometry args={[0.1, 0.36, 0.1]} />
          <meshStandardMaterial color="#ff7eb6" roughness={0.5} />
        </mesh>
        <mesh rotation={[0, -Math.PI / 4, 0]} position={[0, 0, 0.0]}>
          <boxGeometry args={[0.1, 0.36, 0.1]} />
          <meshStandardMaterial color="#ff7eb6" roughness={0.5} />
        </mesh>
      </group>
    </RigidBody>
  );
}

export function PhysicalToys() {
  return (
    <group>
      <BouncyBall />
      <GiftBox />
    </group>
  );
}
