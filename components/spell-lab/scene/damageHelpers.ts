"use client";

import React from "react";
import * as THREE from "three";
import {
  DAMAGE_INFO,
  type DamageType,
  type DummyType,
  type ZombieType,
} from "../types";

export interface DamageTextItem {
  id: number;
  pos: THREE.Vector3;
  text: string;
  color: string;
}

export interface BloodItem {
  id: number;
  pos: THREE.Vector3;
}

export type HitTest = (d: DummyType) => boolean;
export type ApplyDamageFn = (
  hitTest: HitTest,
  minDmg: number,
  maxDmg: number,
  damageType: DamageType,
) => void;

export interface DamageResult {
  dummies: DummyType[];
  zombies: ZombieType[];
  texts: DamageTextItem[];
  bloods: BloodItem[];
}

export function applyDamagePure({
  dummies,
  zombies,
  hitTest,
  minDmg,
  maxDmg,
  damageType,
}: {
  dummies: DummyType[];
  zombies: ZombieType[];
  hitTest: HitTest;
  minDmg: number;
  maxDmg: number;
  damageType: DamageType;
}): DamageResult {
  const info = DAMAGE_INFO[damageType];
  const texts: DamageTextItem[] = [];
  const bloods: BloodItem[] = [];

  let dummiesChanged = false;
  const nextDummies = dummies.map((d) => {
    if (d.hp <= 0 || !hitTest(d)) return d;
    dummiesChanged = true;
    const dmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));
    texts.push({
      id: Math.random(),
      pos: d.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
      text: `-${dmg} ${info.name}`,
      color: info.color,
    });
    bloods.push({ id: Math.random(), pos: d.pos.clone().add(new THREE.Vector3(0, 1, 0)) });
    const nextHp = Math.max(0, d.hp - dmg);
    return { ...d, hp: nextHp, deathTime: nextHp <= 0 ? (d.deathTime ?? Date.now()) : undefined };
  });

  let zombiesChanged = false;
  const zombieTexts: DamageTextItem[] = [];
  const nextZombies = zombies.map((z) => {
    // hitTest only reads `pos` (radius/line crowd checks); ZombieType satisfies it.
    const dummyView: DummyType = z as unknown as DummyType;
    if (z.hp <= 0 || !hitTest(dummyView)) return z;
    zombiesChanged = true;
    const dmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));
    zombieTexts.push({
      id: Math.random(),
      pos: z.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
      text: `-${dmg} ${info.name}`,
      color: info.color,
    });
    return { ...z, hp: Math.max(0, z.hp - dmg) };
  });

  return {
    dummies: dummiesChanged ? nextDummies : dummies,
    zombies: zombiesChanged ? nextZombies : zombies,
    texts: [...texts, ...zombieTexts],
    bloods,
  };
}

export function createApplyDamage(setters: {
  setDummies: React.Dispatch<React.SetStateAction<DummyType[]>>;
  setZombies: React.Dispatch<React.SetStateAction<ZombieType[]>>;
  setDamageTexts: React.Dispatch<React.SetStateAction<DamageTextItem[]>>;
  setBloods: React.Dispatch<React.SetStateAction<BloodItem[]>>;
}): ApplyDamageFn {
  return (hitTest, minDmg, maxDmg, damageType) => {
    setters.setDummies((prev) => {
      const res = applyDamagePure({ dummies: prev, zombies: [], hitTest, minDmg, maxDmg, damageType });
      if (res.texts.length > 0 || res.bloods.length > 0) {
        const texts = res.texts;
        const bloods = res.bloods;
        setTimeout(() => {
          if (texts.length > 0) setters.setDamageTexts((p) => [...p, ...texts]);
          if (bloods.length > 0) setters.setBloods((p) => [...p, ...bloods]);
        }, 0);
      }
      return res.dummies;
    });
    setters.setZombies((prev) => {
      const res = applyDamagePure({ dummies: [], zombies: prev, hitTest, minDmg, maxDmg, damageType });
      if (res.texts.length > 0) {
        const texts = res.texts;
        setTimeout(() => {
          setters.setDamageTexts((p) => [...p, ...texts]);
        }, 0);
      }
      return res.zombies;
    });
  };
}

export interface ZombieHitResult {
  dummies: DummyType[];
  texts: DamageTextItem[];
  bloods: BloodItem[];
}

export function applyZombieHitPure(
  dummies: DummyType[],
  dummyId: number,
  damage: number,
): ZombieHitResult {
  const info = DAMAGE_INFO["bludgeoning"];
  const texts: DamageTextItem[] = [];
  const bloods: BloodItem[] = [];
  const next = dummies.map((d) => {
    if (d.id !== dummyId || d.hp <= 0) return d;
    const nextHp = Math.max(0, d.hp - damage);
    texts.push({
      id: Math.random(),
      pos: d.pos.clone().add(new THREE.Vector3(0, 1.5, 0)),
      text: `-${damage} ${info.name}`,
      color: info.color,
    });
    bloods.push({ id: Math.random(), pos: d.pos.clone().add(new THREE.Vector3(0, 1, 0)) });
    return { ...d, hp: nextHp, deathTime: nextHp <= 0 ? (d.deathTime ?? Date.now()) : undefined };
  });
  return { dummies: next, texts, bloods };
}

export function createHandleZombieAttack(deps: {
  camera: THREE.Camera;
  playerHp: number;
  onPlayerHpChange?: (hp: number) => void;
  setDummies: React.Dispatch<React.SetStateAction<DummyType[]>>;
  setDamageTexts: React.Dispatch<React.SetStateAction<DamageTextItem[]>>;
  setBloods: React.Dispatch<React.SetStateAction<BloodItem[]>>;
}): (dummyId: number, damage: number) => void {
  return (dummyId, damage) => {
    if (dummyId === 99999) {
      if (deps.playerHp > 0 && deps.onPlayerHpChange) {
        deps.onPlayerHpChange(Math.max(0, deps.playerHp - damage));
        const info = DAMAGE_INFO["bludgeoning"];
        const fwdText = deps.camera.position
          .clone()
          .add(new THREE.Vector3(0, -0.5, -1).applyQuaternion(deps.camera.quaternion));
        const fwdBlood = deps.camera.position
          .clone()
          .add(new THREE.Vector3(0, -0.8, -1.2).applyQuaternion(deps.camera.quaternion));
        setTimeout(() => {
          deps.setDamageTexts((prev) => [
            ...prev,
            { id: Math.random(), pos: fwdText, text: `-${damage} HP`, color: info.color },
          ]);
          deps.setBloods((prev) => [...prev, { id: Math.random(), pos: fwdBlood }]);
        }, 0);
      }
      return;
    }
    deps.setDummies((prev) => {
      const res = applyZombieHitPure(prev, dummyId, damage);
      if (res.texts.length > 0) {
        const texts = res.texts;
        const bloods = res.bloods;
        setTimeout(() => {
          deps.setDamageTexts((prevTexts) => [...prevTexts, ...texts]);
          deps.setBloods((prevBloods) => [...prevBloods, ...bloods]);
        }, 0);
      }
      return res.dummies;
    });
  };
}
