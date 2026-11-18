"use client";

import React from "react";
import * as THREE from "three";
import type {
  DummyType,
  DamageType,
  ZombieType,
} from "../types";
import { DAMAGE_INFO } from "../types";
import { getTerrainHeight, saveCraterToChunk } from "../spells/InfiniteTerrain";
import type { PulseWaveImpact } from "../spells/PulseWave";
import type {
  ApplyDamageFn,
  DamageTextItem,
} from "./damageHelpers";

export function recordSpellCast(onCastSpellAction?: () => void): void {
  if (onCastSpellAction) onCastSpellAction();
  if (typeof window === "undefined") return;
  const key = "spell_lab_alert_shown";
  if (localStorage.getItem(key)) return;
  const countKey = "spell_lab_cast_count";
  const count = parseInt(localStorage.getItem(countKey) || "0", 10) + 1;
  localStorage.setItem(countKey, count.toString());
  if (count === 5) {
    localStorage.setItem(key, "true");
    setTimeout(() => {
      const go = window.confirm(
        "你已释放了5个法术！是否前往多态主页 https://center.mcmod.cn/1408244/的置顶看看？那里有AES128密文，密钥为pppopipupu ascii转hex code，不足的位数补零，快去解密吧！！！",
      );
      if (go) window.open("https://center.mcmod.cn/1408244/", "_blank");
    }, 300);
  }
}

export interface CraterPlan {
  x: number;
  z: number;
  r: number;
  d: number;
}

export interface DamagePlan {
  min: number;
  max: number;
  damageType: DamageType;
  radius?: number;
  radiusCenter?: THREE.Vector3;
  lineStart?: THREE.Vector3;
  lineEnd?: THREE.Vector3;
  lineTol?: number;
}

export interface DelayedPlan {
  delay: number;
  shake: number;
  craters: CraterPlan[];
  flashes: { pos: THREE.Vector3; color: string; id: number }[];
  debris: { pos: THREE.Vector3; color: string; id: number }[];
  damages: DamagePlan[];
}

export type ImmediatePlan =
  | { kind: "none" }
  | { kind: "fireball"; pos: THREE.Vector3; id: number }
  | { kind: "lightning"; pos: THREE.Vector3; id: number; count: number }
  | { kind: "ray"; start: THREE.Vector3; end: THREE.Vector3; id: number }
  | { kind: "sunburst"; pos: THREE.Vector3; id: number }
  | { kind: "wave"; pos: THREE.Vector3; id: number; variant: "radiant" | "necrotic" }
  | { kind: "storm"; center: THREE.Vector3; id: number }
  | { kind: "gravity"; pos: THREE.Vector3; id: number }
  | { kind: "pulse"; pos: THREE.Vector3; id: number }
  | { kind: "void"; center: THREE.Vector3; id: number }
  | { kind: "animateDead"; dummyId: number; pos: THREE.Vector3; id: number };

export interface InstantCastPlan {
  record: boolean;
  immediate: ImmediatePlan;
  delayed?: DelayedPlan;
}

export function buildInstantCast(
  spell: string,
  point: THREE.Vector3,
  ctx: { camera: THREE.Camera; dummies: DummyType[] },
): InstantCastPlan {
  const terrainY = getTerrainHeight(point.x, point.z).height;
  const adjusted = new THREE.Vector3(point.x, terrainY, point.z);

  if (spell === "animate-dead") {
    const dead = ctx.dummies.find(
      (d) => d.hp <= 0 && d.hp > -999 && d.pos.distanceTo(adjusted) < 5.0,
    );
    if (!dead) return { record: false, immediate: { kind: "none" } };
    return {
      record: true,
      immediate: { kind: "animateDead", dummyId: dead.id, pos: dead.pos.clone(), id: Date.now() + Math.random() },
    };
  }

  const id = Date.now() + Math.random();
  const delayedWith = (partial: Partial<DelayedPlan>): DelayedPlan => ({
    delay: 0,
    shake: 0,
    craters: [],
    flashes: [],
    debris: [],
    damages: [],
    ...partial,
  });

  if (spell === "fireball") {
    return {
      record: true,
      immediate: { kind: "fireball", pos: adjusted.clone(), id },
      delayed: delayedWith({
        delay: 600,
        shake: 4.0,
        craters: [{ x: adjusted.x, z: adjusted.z, r: 4.5, d: 1.5 }],
        flashes: [{ pos: adjusted.clone(), color: "#ff6600", id }],
        debris: [{ pos: adjusted.clone(), color: "#4a2d1a", id }],
        damages: [{ min: 8, max: 48, damageType: "fire", radius: 6.0, radiusCenter: adjusted.clone() }],
      }),
    };
  }
  if (spell === "lightning") {
    const count = 3 + Math.floor(Math.random() * 4);
    return {
      record: true,
      immediate: { kind: "lightning", pos: adjusted.clone(), id, count },
      delayed: delayedWith({
        delay: 300,
        shake: 1.8,
        craters: [{ x: adjusted.x, z: adjusted.z, r: 1.8, d: 0.6 }],
        flashes: [{ pos: adjusted.clone(), color: "#4488ff", id }],
        debris: [{ pos: adjusted.clone(), color: "#2d2d3a", id }],
        damages: [{ min: 3, max: 30, damageType: "lightning", radius: 2.5, radiusCenter: adjusted.clone() }],
      }),
    };
  }
  if (spell === "disintegrate") {
    const start = ctx.camera.position.clone();
    start.y -= 1;
    const p1 = new THREE.Vector2(start.x, start.z);
    const p2 = new THREE.Vector2(adjusted.x, adjusted.z);
    const dist = p1.distanceTo(p2);
    const steps = Math.ceil(dist / 1.5);
    const craters: CraterPlan[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      craters.push({
        x: THREE.MathUtils.lerp(p1.x, p2.x, t),
        z: THREE.MathUtils.lerp(p1.y, p2.y, t),
        r: 3.5,
        d: 2.5,
      });
    }
    const mid = start.clone().lerp(adjusted, 0.5);
    return {
      record: true,
      immediate: { kind: "ray", start: start.clone(), end: adjusted.clone(), id },
      delayed: delayedWith({
        delay: 50,
        shake: 3.0,
        craters,
        flashes: [{ pos: adjusted.clone(), color: "#00ff00", id }],
        debris: [
          { pos: adjusted.clone(), color: "#1a4a1a", id },
          { pos: mid.clone(), color: "#1a4a1a", id: id + 1 },
        ],
        damages: [
          {
            min: 50,
            max: 100,
            damageType: "force",
            lineStart: start.clone(),
            lineEnd: adjusted.clone(),
            lineTol: 3.5,
          },
        ],
      }),
    };
  }
  if (spell === "sunburst") return { record: true, immediate: { kind: "sunburst", pos: adjusted.clone(), id } };
  if (spell === "destructive-wave") {
    const variant = Math.random() < 0.5 ? "radiant" : "necrotic";
    return { record: true, immediate: { kind: "wave", pos: adjusted.clone(), id, variant } };
  }
  if (spell === "storm-of-vengeance") return { record: true, immediate: { kind: "storm", center: adjusted.clone(), id } };
  if (spell === "gravity-sinkhole") return { record: true, immediate: { kind: "gravity", pos: adjusted.clone(), id } };
  if (spell === "pulse-wave") return { record: true, immediate: { kind: "pulse", pos: adjusted.clone(), id } };
  if (spell === "ravenous-void") return { record: true, immediate: { kind: "void", center: adjusted.clone(), id } };
  return { record: true, immediate: { kind: "none" } };
}

export interface CastDeps {
  shakeIntensity: React.RefObject<number>;
  applyDamage: ApplyDamageFn;
  recordCast: () => void;
  setFireballs: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; id: number }[]>>;
  setLightnings: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; id: number; count: number }[]>>;
  setRays: React.Dispatch<React.SetStateAction<{ start: THREE.Vector3; end: THREE.Vector3; id: number }[]>>;
  setSunbursts: React.Dispatch<React.SetStateAction<{ id: number; pos: THREE.Vector3 }[]>>;
  setWaves: React.Dispatch<
    React.SetStateAction<{ id: number; pos: THREE.Vector3; variant: "radiant" | "necrotic" }[]>
  >;
  setStorms: React.Dispatch<React.SetStateAction<{ id: number; center: THREE.Vector3 }[]>>;
  setGravitySinks: React.Dispatch<React.SetStateAction<{ id: number; pos: THREE.Vector3 }[]>>;
  setPulseWaves: React.Dispatch<React.SetStateAction<{ id: number; pos: THREE.Vector3 }[]>>;
  setVoids: React.Dispatch<React.SetStateAction<{ id: number; center: THREE.Vector3 }[]>>;
  setCraters: React.Dispatch<React.SetStateAction<CraterPlan[]>>;
  setCratersVersion: React.Dispatch<React.SetStateAction<number>>;
  setFlashes: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; color: string; id: number }[]>>;
  setDebris: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; color: string; id: number }[]>>;
  setDummies: React.Dispatch<React.SetStateAction<DummyType[]>>;
  setZombies: React.Dispatch<React.SetStateAction<ZombieType[]>>;
  setDamageTexts: React.Dispatch<React.SetStateAction<DamageTextItem[]>>;
}

function damageHitTest(plan: DamagePlan): (d: { pos: THREE.Vector3 }) => boolean {
  if (plan.lineStart && plan.lineEnd) {
    const line = new THREE.Line3(plan.lineStart, plan.lineEnd);
    const tol = plan.lineTol ?? 3.5;
    return (d) => {
      const closest = new THREE.Vector3();
      line.closestPointToPoint(d.pos, true, closest);
      return d.pos.distanceTo(closest) < tol;
    };
  }
  const c = plan.radiusCenter ?? new THREE.Vector3();
  const r = plan.radius ?? 0;
  return (d) => d.pos.distanceTo(c) < r;
}

export function applyInstantPlan(plan: InstantCastPlan, deps: CastDeps): void {
  if (plan.record) deps.recordCast();
  const im = plan.immediate;
  if (im.kind === "animateDead") {
    const id = im.id;
    deps.setDummies((prev) => prev.map((d) => (d.id === im.dummyId ? { ...d, hp: -999, consumed: true } : d)));
    deps.setFlashes((prev) => [...prev, { pos: im.pos.clone(), color: "#7000aa", id }]);
    deps.setDebris((prev) => [...prev, { pos: im.pos.clone(), color: "#2b0044", id }]);
    deps.setZombies((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        pos: im.pos.clone(),
        target: im.pos.clone(),
        hp: 100,
        maxHp: 100,
        lastAttackTime: 0,
      },
    ]);
    deps.setDamageTexts((prev) => [
      ...prev,
      { id: Math.random(), pos: im.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), text: "+ 唤醒僵尸", color: "#a020f0" },
    ]);
  } else if (im.kind === "fireball") {
    deps.setFireballs((prev) => [...prev, { pos: im.pos.clone(), id: im.id }]);
  } else if (im.kind === "lightning") {
    deps.setLightnings((prev) => [...prev, { pos: im.pos.clone(), id: im.id, count: im.count }]);
  } else if (im.kind === "ray") {
    deps.setRays((prev) => [...prev, { start: im.start.clone(), end: im.end.clone(), id: im.id }]);
  } else if (im.kind === "sunburst") {
    deps.setSunbursts((prev) => [...prev, { id: im.id, pos: im.pos.clone() }]);
  } else if (im.kind === "wave") {
    deps.setWaves((prev) => [...prev, { id: im.id, pos: im.pos.clone(), variant: im.variant }]);
  } else if (im.kind === "storm") {
    deps.setStorms((prev) => [...prev, { id: im.id, center: im.center.clone() }]);
  } else if (im.kind === "gravity") {
    deps.setGravitySinks((prev) => [...prev, { id: im.id, pos: im.pos.clone() }]);
  } else if (im.kind === "pulse") {
    deps.setPulseWaves((prev) => [...prev, { id: im.id, pos: im.pos.clone() }]);
  } else if (im.kind === "void") {
    deps.setVoids((prev) => [...prev, { id: im.id, center: im.center.clone() }]);
  }

  if (!plan.delayed) return;
  const delayed = plan.delayed;
  setTimeout(() => {
    deps.shakeIntensity.current = delayed.shake;
    for (const c of delayed.craters) saveCraterToChunk(c);
    if (delayed.craters.length > 0) {
      deps.setCraters((prev) => [...prev, ...delayed.craters]);
      deps.setCratersVersion((v) => v + 1);
    }
    if (delayed.flashes.length > 0) {
      deps.setFlashes((prev) => [...prev, ...delayed.flashes.map((f) => ({ pos: f.pos.clone(), color: f.color, id: f.id }))]);
    }
    if (delayed.debris.length > 0) {
      deps.setDebris((prev) => [...prev, ...delayed.debris.map((f) => ({ pos: f.pos.clone(), color: f.color, id: f.id }))]);
    }
    for (const dmg of delayed.damages) {
      deps.applyDamage(damageHitTest(dmg), dmg.min, dmg.max, dmg.damageType);
    }
  }, delayed.delay);
}

export function createCastInstantSpell(
  deps: CastDeps,
  getCtx: () => { camera: THREE.Camera; dummies: DummyType[] },
): (spell: string, point: THREE.Vector3) => void {
  return (spell, point) => {
    applyInstantPlan(buildInstantCast(spell, point, getCtx()), deps);
  };
}

export interface CrowdDeps {
  shakeIntensity: React.RefObject<number>;
  applyDamage: ApplyDamageFn;
  setCraters: React.Dispatch<React.SetStateAction<CraterPlan[]>>;
  setCratersVersion: React.Dispatch<React.SetStateAction<number>>;
  setDummies: React.Dispatch<React.SetStateAction<DummyType[]>>;
  setDamageTexts: React.Dispatch<React.SetStateAction<DamageTextItem[]>>;
  setFlashes: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; color: string; id: number }[]>>;
  setDebris: React.Dispatch<React.SetStateAction<{ pos: THREE.Vector3; color: string; id: number }[]>>;
}

function addCrater(deps: CrowdDeps, c: CraterPlan, flashColor?: string, debrisColor?: string): void {
  saveCraterToChunk(c);
  deps.setCraters((prev) => [...prev, c]);
  deps.setCratersVersion((v) => v + 1);
  void flashColor;
  void debrisColor;
}

export function createCrowdHandlers(deps: CrowdDeps) {
  return {
    sunburst: (pos: THREE.Vector3) => {
      deps.shakeIntensity.current = 6;
      addCrater(deps, { x: pos.x, z: pos.z, r: 5, d: 0.8 });
      deps.applyDamage((d) => d.pos.distanceTo(pos) < 18, 12, 72, "radiant");
      deps.setDamageTexts((p) => [
        ...p,
        { id: Math.random(), pos: pos.clone().add(new THREE.Vector3(0, 2, 0)), text: "目盲", color: "#ffe066" },
      ]);
    },
    wave: (pos: THREE.Vector3, variant: "radiant" | "necrotic") => {
      deps.shakeIntensity.current = 3.5;
      addCrater(deps, { x: pos.x, z: pos.z, r: 4, d: 1.2 });
      deps.applyDamage((d) => d.pos.distanceTo(pos) < 9, 5, 30, "thunder");
      deps.applyDamage((d) => d.pos.distanceTo(pos) < 9, 5, 30, variant);
      const color = variant === "radiant" ? "#ffcf5a" : "#a855f7";
      deps.setDamageTexts((p) => [
        ...p,
        { id: Math.random(), pos: pos.clone().add(new THREE.Vector3(0, 2.2, 0)), text: "击倒", color },
      ]);
    },
    storm: (center: THREE.Vector3, stage: number, points?: THREE.Vector3[]) => {
      if (stage === 1) {
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 1, 6, "acid");
      } else if (stage === 2) {
        deps.shakeIntensity.current = 2.5;
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 10, 60, "lightning");
      } else if (stage === 3) {
        if (points && points.length > 0) {
          const newCraters: CraterPlan[] = points.map((pt) => ({ x: pt.x, z: pt.z, r: 1.5, d: 0.5 }));
          for (const c of newCraters) saveCraterToChunk(c);
          deps.setCraters((p) => [...p, ...newCraters]);
          deps.setCratersVersion((v) => v + 1);
          const id1 = Date.now() + Math.random();
          const id2 = Date.now() + Math.random() + 1;
          deps.setFlashes((p) => [
            ...p,
            { pos: center.clone(), color: "#88ccff", id: id1 },
            { pos: center.clone().add(new THREE.Vector3(10, 0, 10)), color: "#88ccff", id: id2 },
          ]);
          deps.setDebris((p) => [...p, { pos: center.clone(), color: "#3a4a5a", id: Date.now() + Math.random() + 2 }]);
        }
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 2, 12, "bludgeoning");
      } else if (stage === 5) {
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 4, 24, "cold");
      } else if (stage === 6) {
        deps.shakeIntensity.current = 3.0;
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 10, 60, "thunder");
      } else if (stage === 8) {
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 1, 6, "acid");
      } else if (stage === 10) {
        deps.applyDamage((d) => d.pos.distanceTo(center) < 90, 1, 6, "bludgeoning");
      }
    },
    gravity: (pos: THREE.Vector3) => {
      deps.shakeIntensity.current = 3;
      addCrater(deps, { x: pos.x, z: pos.z, r: 6, d: 1.2 });
      deps.applyDamage((d) => d.pos.distanceTo(pos) < 6, 5, 50, "force");
      deps.setDummies((prev) =>
        prev.map((d) => {
          if (d.hp <= 0 || d.pos.distanceTo(pos) >= 6) return d;
          const nextPos = d.pos.clone().lerp(pos, 0.35);
          nextPos.y = getTerrainHeight(nextPos.x, nextPos.z).height;
          return { ...d, pos: nextPos };
        }),
      );
      deps.setDamageTexts((p) => [
        ...p,
        { id: Math.random(), pos: pos.clone().add(new THREE.Vector3(0, 2, 0)), text: "拉扯", color: "#8c6cff" },
      ]);
    },
    pulse: (pos: THREE.Vector3, impact: PulseWaveImpact) => {
      deps.shakeIntensity.current = 2.5;
      const inCone = (d: { pos: THREE.Vector3 }) => {
        const to = d.pos.clone().sub(impact.origin);
        const dist = to.length();
        if (dist > impact.length) return false;
        to.normalize();
        return to.dot(impact.direction) > impact.halfAngleCos;
      };
      deps.applyDamage((d) => d.pos.distanceTo(pos) < 9 && inCone(d), 6, 36, "force");
      deps.setDummies((prev) =>
        prev.map((d) => {
          if (d.hp <= 0 || !inCone(d)) return d;
          const away = d.pos.clone().sub(impact.origin).setY(0).normalize();
          const nextPos = d.pos.clone().addScaledVector(away, 4.5);
          nextPos.y = getTerrainHeight(nextPos.x, nextPos.z).height;
          return { ...d, pos: nextPos };
        }),
      );
      deps.setDamageTexts((p) => [
        ...p,
        { id: Math.random(), pos: pos.clone().add(new THREE.Vector3(0, 2.2, 0)), text: "推开", color: "#7fdbff" },
      ]);
    },
    voidStage: (tick: number, c: THREE.Vector3) => {
      deps.applyDamage((d) => d.pos.distanceTo(c) < 30, 2, 20, "force");
      deps.setDummies((prev) =>
        prev.map((d) => {
          if (d.hp <= 0 || d.pos.distanceTo(c) >= 30) return d;
          const nextPos = d.pos.clone().lerp(c, 0.12);
          nextPos.y = getTerrainHeight(nextPos.x, nextPos.z).height;
          return { ...d, pos: nextPos };
        }),
      );
      if (tick === 1) {
        deps.setDamageTexts((p) => [
          ...p,
          { id: Math.random(), pos: c.clone().add(new THREE.Vector3(0, 2, 0)), text: "撕扯", color: "#b388ff" },
        ]);
      }
    },
  };
}

export function getDamageTextColor(damageType: DamageType): string {
  return DAMAGE_INFO[damageType].color;
}
