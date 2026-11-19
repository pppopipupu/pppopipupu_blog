"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import SceneErrorBoundary from "../SceneErrorBoundary";
import { checkWebGL } from "../webgl";
import { playSoftClick, playWarmChime } from "../remaster/remasterAudio";
import { createVillaPalette } from "./villaPrimitives";
import { buildVillaShell } from "./villaShell";
import { buildVillaInteriors } from "./villaInteriors";
import { buildDndLoreItems } from "./villaDndLore";
import { buildB2Underdark } from "./villaB2Underdark";
import { buildVillaExterior } from "./villaExterior";
import { buildWizardAvatar } from "./villaWizardAvatar";

const MAX_CONTEXT_RETRIES = 3;

export default function NeonFantasyVillaScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "never";
}) {
  const [webglSupported] = useState(() =>
    typeof window !== "undefined" ? checkWebGL() : true
  );
  const [generation, setGeneration] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const frameloopRef = useRef(frameloop);

  useEffect(() => {
    frameloopRef.current = frameloop;
  }, [frameloop]);

  useEffect(() => {
    if (!webglSupported) return;
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let composer: EffectComposer | null = null;
    let controls: OrbitControls | null = null;
    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let toastTimer = 0;
    let disposed = false;

    const cleanupFns: Array<() => void> = [];

    const showToast = (msg: string) => {
      const el = toastRef.current;
      if (!el) return;
      el.textContent = msg;
      el.style.opacity = "1";
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        if (toastRef.current) toastRef.current.style.opacity = "0";
      }, 2800);
    };

    try {
      const initW = Math.max(1, host.clientWidth || 960);
      const initH = Math.max(1, host.clientHeight || 700);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      /* ---- Renderer ---- */
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      });
      renderer.setPixelRatio(dpr);
      renderer.setSize(initW, initH, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      renderer.domElement.style.outline = "none";
      renderer.domElement.tabIndex = 0;
      host.appendChild(renderer.domElement);

      /* ---- Heroic Isometric Cutaway Camera & OrbitControls ---- */
      const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.9, 680);
      camera.position.set(33.5, 29.0, 86.5);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(1.2, 6.2, 0.5);
      controls.enableDamping = true;
      controls.dampingFactor = 0.068;
      controls.minDistance = 5;
      controls.maxDistance = 290;
      controls.maxPolarAngle = Math.PI * 0.495;
      controls.panSpeed = 1.15;
      controls.update();

      /* ---- Scene & Twilight D&D Deep Forest Atmosphere ---- */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x131b2e);
      scene.fog = new THREE.FogExp2(0x131b2e, 0.0038);

      /* ---- Lighting ---- */
      const hemiLight = new THREE.HemisphereLight(0x9ac0ff, 0x2a3b2e, 0.94);
      scene.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0xd4e6ff, 1.52);
      moonLight.position.set(64, 102, 64);
      moonLight.castShadow = true;
      moonLight.shadow.mapSize.set(1024, 1024);
      moonLight.shadow.camera.near = 14;
      moonLight.shadow.camera.far = 300;
      moonLight.shadow.camera.left = -108;
      moonLight.shadow.camera.right = 108;
      moonLight.shadow.camera.top = 108;
      moonLight.shadow.camera.bottom = -108;
      moonLight.shadow.bias = -0.0005;
      scene.add(moonLight);

      const b2CrystalLight = new THREE.PointLight(0x38e8ff, 34, 46, 1.36);
      b2CrystalLight.position.set(-4.0, -9.2, 1.5);
      const b2ForgeLight = new THREE.PointLight(0xff7b29, 32, 40, 1.36);
      b2ForgeLight.position.set(16.5, -9.4, -3.2);
      const hearthLight = new THREE.PointLight(0xff8c3b, 42, 48, 1.36);
      hearthLight.position.set(-14.5, 3.6, 1.2);
      const diningLight = new THREE.PointLight(0xffcf73, 30, 42, 1.36);
      diningLight.position.set(12.6, 4.6, 3.0);
      const cellarArcaneLight = new THREE.PointLight(0x4be3ff, 34, 42, 1.36);
      cellarArcaneLight.position.set(-11.4, -2.4, 2.6);
      const upperFloorLight = new THREE.PointLight(0xffd894, 34, 48, 1.36);
      upperFloorLight.position.set(0.0, 10.8, 3.0);
      const atticLight = new THREE.PointLight(0xffd27d, 26, 38, 1.36);
      atticLight.position.set(-11.2, 17.6, 1.6);
      const gardenLight = new THREE.PointLight(0xffcf82, 26, 38, 1.36);
      gardenLight.position.set(12.2, 17.8, 1.2);
      const poolGlowLight = new THREE.PointLight(0x38e0ee, 28, 42, 1.36);
      poolGlowLight.position.set(35.8, 2.8, 1.6);
      const statueLight = new THREE.PointLight(0xc084fc, 30, 44, 1.36);
      statueLight.position.set(58.0, 9.2, -27.5);
      const farmLight = new THREE.PointLight(0xffd17a, 26, 46, 1.36);
      farmLight.position.set(-66.0, 4.8, 10.0);
      const portalLight = new THREE.PointLight(0x38e8ff, 30, 44, 1.36);
      portalLight.position.set(-14.0, 5.6, -57.0);
      scene.add(
        b2CrystalLight,
        b2ForgeLight,
        hearthLight,
        diningLight,
        cellarArcaneLight,
        upperFloorLight,
        atticLight,
        gardenLight,
        poolGlowLight,
        statueLight,
        farmLight,
        portalLight
      );

      /* ---- Build Modular 5-Level Villa World & Wizard Avatar ---- */
      const palette = createVillaPalette();
      const worldGroup = new THREE.Group();
      scene.add(worldGroup);

      const shellRefs = buildVillaShell(worldGroup, palette);
      const interiorRefs = buildVillaInteriors(worldGroup, palette);
      const dndRefs = buildDndLoreItems(worldGroup, palette);
      const b2Refs = buildB2Underdark(worldGroup, palette);
      const exteriorRefs = buildVillaExterior(worldGroup, palette);
      const wizardRefs = buildWizardAvatar(worldGroup, palette);

      cleanupFns.push(() => {
        window.clearTimeout(toastTimer);
        exteriorRefs.dispose();
        worldGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh && !(obj instanceof THREE.InstancedMesh)) {
            obj.geometry.dispose();
          }
        });
        palette.dispose();
      });

      /* ---- Post-Processing: Subtle Magical UnrealBloomPass ---- */
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(dpr);
      composer.setSize(initW, initH);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.34, 0.52, 0.84);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());

      (window as unknown as Record<string, unknown>).__COZYROOM__ = {
        scene,
        camera,
        gl: renderer,
      };

      /* ---- Interactive Clicks (18 Clickable D&D Objects across B2..3F & Forest!) ---- */
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      let pointerDownPos: { x: number; y: number } | null = null;

      let fireBoost = 0;
      let crystalPulse = 0;
      let cauldronPulse = 0;
      let astrolabePulse = 0;
      let fountainPulse = 0;
      let statuePulse = 0;
      let portalPulse = 0;
      let mimicPulse = 0;
      let beholderPulse = 0;
      let dragonPulse = 0;
      let d20Pulse = 0;
      let questPulse = 0;
      let grimoirePulse = 0;
      let spelljammerPulse = 0;
      let dragonEggPulse = 0;
      let mythallarPulse = 0;
      let swordStonePulse = 0;
      let anvilPulse = 0;

      const clickTargets: THREE.Object3D[] = [
        interiorRefs.fireMesh,
        interiorRefs.arcaneCrystal,
        interiorRefs.cauldronLiquid,
        interiorRefs.astrolabeCore,
        interiorRefs.fountainWater,
        exteriorRefs.statueEye,
        exteriorRefs.forestPortal,
        dndRefs.mimicHitbox,
        dndRefs.beholderHitbox,
        dndRefs.dragonHitbox,
        dndRefs.giantD20,
        dndRefs.questSigil,
        dndRefs.grimoireHitbox,
        dndRefs.spelljammerHitbox,
        dndRefs.dragonEgg,
        b2Refs.mythallarCore,
        b2Refs.swordInStone,
        b2Refs.dwarfAnvil,
      ];

      const canvasEl = renderer.domElement;
      const setNdc = (e: PointerEvent) => {
        const rect = canvasEl.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.button === 0) pointerDownPos = { x: e.clientX, y: e.clientY };
      };
      const onPointerMove = (e: PointerEvent) => {
        if (e.buttons !== 0) return;
        setNdc(e);
        raycaster.setFromCamera(pointerNdc, camera);
        const hit = raycaster.intersectObjects(clickTargets, false);
        canvasEl.style.cursor = hit.length > 0 ? "pointer" : "";
      };
      const onPointerUp = (e: PointerEvent) => {
        if (!pointerDownPos || e.button !== 0) return;
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        pointerDownPos = null;
        if (dist > 6) return;
        setNdc(e);
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(clickTargets, false);
        if (hits.length === 0) return;
        const hitName = hits[0].object.name;

        if (hitName === "villa_fireplace") {
          fireBoost = 1.8;
          playSoftClick(480);
          showToast("🔥 壁炉火焰熊熊燃起，温暖了整个公会大厅！");
        } else if (hitName === "villa_arcane_crystal") {
          crystalPulse = 2.0;
          playWarmChime(5);
          showToast("💎 奥术水晶共鸣！地下室法阵魔力涌动。");
        } else if (hitName === "villa_cauldron") {
          cauldronPulse = 1.8;
          playWarmChime(2);
          showToast("🧪 炼金坩埚沸腾冒泡，飘出奇异的治疗药水香气！");
        } else if (hitName === "villa_astrolabe") {
          astrolabePulse = 2.2;
          playWarmChime(7);
          showToast("✨ 黄铜星盘加速运转，星界轨迹清晰显现。");
        } else if (hitName === "villa_fountain") {
          fountainPulse = 1.8;
          playWarmChime(4);
          showToast("⛲ 屋顶花园魔力喷泉泛起晶莹涟漪。");
        } else if (hitName === "villa_eye_statue") {
          statuePulse = 2.4;
          playWarmChime(9);
          showToast("👁️ 远古浮空独眼巨像凝视着你，符文碎片飞速旋转！");
        } else if (hitName === "villa_forest_portal") {
          portalPulse = 2.5;
          playWarmChime(11);
          showToast("🌀 深林星界传送门发出嗡鸣，通往未知位面...");
        } else if (hitName === "villa_mimic_chest") {
          mimicPulse = 2.4;
          playSoftClick(260);
          showToast("🦷 警告！这是一只宝箱怪 (Mimic)，它猛地张开了利齿！");
        } else if (hitName === "villa_beholder_jar") {
          beholderPulse = 2.2;
          playWarmChime(8);
          showToast("👁️ 标本罐里的迷你眼魔 (Beholder) 眨了眨反魔主眼！");
        } else if (hitName === "villa_dragon_trophy") {
          dragonPulse = 2.3;
          playSoftClick(320);
          showToast("🐉 红龙战利品发出低沉咆哮，喷出一缕炽热龙息！");
        } else if (hitName === "villa_giant_d20") {
          d20Pulse = 2.6;
          const roll = Math.floor(Math.random() * 20) + 1;
          playWarmChime(roll === 20 ? 12 : roll === 1 ? 1 : 6);
          if (roll === 20) {
            showToast("🎲 命运 D20 检定：20 — 大成功 (Natural 20 Critical)!");
          } else if (roll === 1) {
            showToast("🎲 命运 D20 检定：1 — 大失败 (Natural 1 Fumble)...");
          } else {
            showToast(`🎲 命运 D20 检定：投出了 ${roll} 点！`);
          }
        } else if (hitName === "villa_quest_board") {
          questPulse = 2.0;
          playWarmChime(6);
          showToast("📜 冒险者公会悬赏：『深林古龙巢穴调查』奖励 500 金币！");
        } else if (hitName === "villa_grimoire") {
          grimoirePulse = 2.2;
          playWarmChime(10);
          showToast("📖 悬浮魔导书自动翻页，金色奥术符文浮现空中！");
        } else if (hitName === "villa_spelljammer") {
          spelljammerPulse = 2.4;
          playWarmChime(7);
          showToast("⛵ 微缩法术船 (Spelljammer) 扬起星界光帆加速巡航！");
        } else if (hitName === "villa_dragon_egg") {
          dragonEggPulse = 2.2;
          playWarmChime(3);
          showToast("🥚 龙蛋在余烬暖巢中微微颤动，似乎快要孵化了...");
        } else if (hitName === "villa_mythallar") {
          mythallarPulse = 2.6;
          playWarmChime(12);
          showToast("🌌 幽暗地域密瑟拉魔核苏醒，整座庄园魔网震颤！");
        } else if (hitName === "villa_sword_stone") {
          swordStonePulse = 2.2;
          playWarmChime(9);
          showToast("⚔️ 石中圣剑发出清脆剑鸣，奥术微光顺着剑刃流淌！");
        } else if (hitName === "villa_dwarf_anvil") {
          anvilPulse = 2.0;
          playSoftClick(640);
          showToast("🔨 矮人秘银铁砧发出清越打铁声，熔炉火花四溅！");
        }
      };

      canvasEl.addEventListener("pointerdown", onPointerDown);
      canvasEl.addEventListener("pointermove", onPointerMove);
      canvasEl.addEventListener("pointerup", onPointerUp);
      cleanupFns.push(() => {
        canvasEl.removeEventListener("pointerdown", onPointerDown);
        canvasEl.removeEventListener("pointermove", onPointerMove);
        canvasEl.removeEventListener("pointerup", onPointerUp);
      });

      /* ---- Keyboard Navigation + UI-Free Wizard Roam & Flight Mode (T + SPACE) ---- */
      const keysDown = new Set<string>();
      const moveVelocity = new THREE.Vector3();
      const moveInput = new THREE.Vector3();
      const camForward = new THREE.Vector3();
      const camRight = new THREE.Vector3();
      const worldUp = new THREE.Vector3(0, 1, 0);

      let wizardMode = false;
      let wizardFlying = false;
      let wizardYaw = Math.PI;
      let wizardWalkCycle = 0;
      const wizardPos = new THREE.Vector3(0, 0.0, 10.5);
      const wizardVel = new THREE.Vector3();
      const savedCameraPos = new THREE.Vector3();
      const savedTarget = new THREE.Vector3();

      const getWizardMinFloor = (x: number, z: number): number => {
        // Inside the 48m x 27m villa + deep sunken pit: can walk/descend all the way to B2 (-12.8)
        if (Math.abs(x) <= 24.5 && z >= -13.5 && z <= 25.0) return -12.8;
        return -0.25;
      };

      const toggleWizardMode = () => {
        if (!controls) return;
        wizardMode = !wizardMode;
        if (wizardMode) {
          savedCameraPos.copy(camera.position);
          savedTarget.copy(controls.target);
          wizardPos.set(0, 0.0, 10.5);
          wizardVel.set(0, 0, 0);
          wizardYaw = Math.PI;
          wizardFlying = false;
          wizardRefs.root.position.copy(wizardPos);
          wizardRefs.root.rotation.y = wizardYaw;
          wizardRefs.root.visible = true;
          controls.target.set(wizardPos.x, wizardPos.y + 2.0, wizardPos.z);
          camera.position.set(wizardPos.x, wizardPos.y + 5.6, wizardPos.z + 12.5);
          controls.update();
          playWarmChime(6);
        } else {
          wizardRefs.root.visible = false;
          wizardVel.set(0, 0, 0);
          wizardFlying = false;
          camera.position.copy(savedCameraPos);
          controls.target.copy(savedTarget);
          controls.update();
          playSoftClick(420);
        }
      };

      const isEditableTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false;
        const tag = target.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (isEditableTarget(e.target)) return;
        const code = e.code;
        if (code === "KeyT" && !e.repeat) {
          toggleWizardMode();
          return;
        }
        if (wizardMode && code === "Space") {
          e.preventDefault();
        }
        if (
          code === "KeyW" || code === "KeyA" || code === "KeyS" || code === "KeyD" ||
          code === "KeyQ" || code === "KeyE" || code === "KeyC" ||
          code === "Space" || code === "ControlLeft" || code === "ControlRight" ||
          code === "ShiftLeft" || code === "ShiftRight"
        ) {
          keysDown.add(code);
        }
      };
      const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.code);
      const onWindowBlur = () => keysDown.clear();

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onWindowBlur);
      cleanupFns.push(() => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onWindowBlur);
      });

      /* ---- WebGL Context Recovery ---- */
      const onLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
        setGeneration((g) => (g < MAX_CONTEXT_RETRIES ? g + 1 : g));
      };
      const onRestored = () => setContextLost(false);
      canvasEl.addEventListener("webglcontextlost", onLost, false);
      canvasEl.addEventListener("webglcontextrestored", onRestored, false);
      cleanupFns.push(() => {
        canvasEl.removeEventListener("webglcontextlost", onLost);
        canvasEl.removeEventListener("webglcontextrestored", onRestored);
      });

      /* ---- ResizeObserver ---- */
      const handleResize = () => {
        if (!renderer || !composer) return;
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        const curDpr = Math.min(window.devicePixelRatio || 1, 1.5);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(curDpr);
        renderer.setSize(w, h, false);
        composer.setPixelRatio(curDpr);
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
      };
      ro = new ResizeObserver(handleResize);
      ro.observe(host);

      /* ---- Animation Loop (Zero Per-Frame Allocations) ---- */
      let lastTime = performance.now();
      let simTime = 0;

      const animate = (now: number) => {
        if (disposed || !composer || !controls) return;
        rafId = requestAnimationFrame(animate);

        const rawDelta = (now - lastTime) * 0.001;
        lastTime = now;
        if (frameloopRef.current === "never") return;

        const delta = Math.min(Math.max(rawDelta, 0.001), 0.05);
        simTime += delta;
        const t = simTime;

        if (wizardMode) {
          /* ---- Third-Person Wizard Walk & SPACE Flight ---- */
          moveInput.set(0, 0, 0);
          if (keysDown.has("KeyW")) moveInput.z += 1;
          if (keysDown.has("KeyS")) moveInput.z -= 1;
          if (keysDown.has("KeyD")) moveInput.x += 1;
          if (keysDown.has("KeyA")) moveInput.x -= 1;

          const sprint = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight");
          const horizSpeed = sprint ? 24 : 12;
          const accel = 1 - Math.exp(-delta * 11);

          if (moveInput.lengthSq() > 0) {
            moveInput.normalize();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            if (camForward.lengthSq() > 1e-6) camForward.normalize();
            else camForward.set(0, 0, -1);
            camRight.crossVectors(camForward, worldUp).normalize();

            const tvx = (camForward.x * moveInput.z + camRight.x * moveInput.x) * horizSpeed;
            const tvz = (camForward.z * moveInput.z + camRight.z * moveInput.x) * horizSpeed;
            wizardVel.x += (tvx - wizardVel.x) * accel;
            wizardVel.z += (tvz - wizardVel.z) * accel;
          } else {
            wizardVel.x *= Math.exp(-delta * 10);
            wizardVel.z *= Math.exp(-delta * 10);
          }

          const ascending = keysDown.has("Space") || keysDown.has("KeyE");
          const descending =
            keysDown.has("KeyQ") ||
            keysDown.has("KeyC") ||
            keysDown.has("ControlLeft") ||
            keysDown.has("ControlRight");

          if (ascending) {
            wizardFlying = true;
            const liftSpeed = sprint ? 18 : 12.5;
            wizardVel.y += (liftSpeed - wizardVel.y) * accel;
          } else if (descending) {
            const dropSpeed = sprint ? -17 : -11.5;
            wizardVel.y += (dropSpeed - wizardVel.y) * accel;
          } else if (wizardFlying) {
            // Smooth magical hover when airborne
            wizardVel.y *= Math.exp(-delta * 8);
          } else {
            wizardVel.y = 0;
          }

          const prevX = wizardPos.x;
          const prevY = wizardPos.y;
          const prevZ = wizardPos.z;

          wizardPos.x = THREE.MathUtils.clamp(wizardPos.x + wizardVel.x * delta, -155, 155);
          wizardPos.z = THREE.MathUtils.clamp(wizardPos.z + wizardVel.z * delta, -155, 155);
          const minFloor = getWizardMinFloor(wizardPos.x, wizardPos.z);
          wizardPos.y = THREE.MathUtils.clamp(wizardPos.y + wizardVel.y * delta, minFloor, 68);

          if (wizardPos.y <= minFloor + 0.04 && !ascending) {
            wizardPos.y = minFloor;
            wizardVel.y = 0;
            wizardFlying = false;
          }

          const dx = wizardPos.x - prevX;
          const dy = wizardPos.y - prevY;
          const dz = wizardPos.z - prevZ;

          // Follow-camera tracks wizard smoothly while preserving mouse OrbitControls rotation
          controls.target.x += dx;
          controls.target.y += dy;
          controls.target.z += dz;
          camera.position.x += dx;
          camera.position.y += dy;
          camera.position.z += dz;

          // Smoothly rotate wizard toward travel heading
          const horizMag = Math.hypot(wizardVel.x, wizardVel.z);
          if (horizMag > 0.35) {
            const targetYaw = Math.atan2(wizardVel.x, wizardVel.z);
            let diff = targetYaw - wizardYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            wizardYaw += diff * Math.min(1, delta * 12);
          }

          wizardRefs.root.position.copy(wizardPos);
          wizardRefs.root.rotation.y = wizardYaw;

          // Procedural walk & levitation flight animations
          if (wizardFlying) {
            wizardRefs.body.position.y = 0.22 + Math.sin(t * 4.2) * 0.14;
            wizardRefs.body.rotation.x = Math.min(0.28, horizMag * 0.015);
            wizardRefs.leftLeg.rotation.x = 0.28;
            wizardRefs.rightLeg.rotation.x = -0.18;
            wizardRefs.leftArm.rotation.x = -0.35;
            wizardRefs.rightArm.rotation.x = -0.45;
            wizardRefs.cape.rotation.x = 0.42 + Math.sin(t * 7.5) * 0.1;
            wizardRefs.flightHalo.scale.setScalar(1.0 + Math.sin(t * 5.0) * 0.1);
            wizardRefs.flightHalo.rotation.z = t * 2.2;
          } else {
            wizardWalkCycle += horizMag * delta * 1.15;
            const swing = Math.sin(wizardWalkCycle) * Math.min(0.68, horizMag * 0.08);
            wizardRefs.body.position.y = Math.abs(Math.cos(wizardWalkCycle)) * Math.min(0.1, horizMag * 0.01);
            wizardRefs.body.rotation.x = 0;
            wizardRefs.leftLeg.rotation.x = swing;
            wizardRefs.rightLeg.rotation.x = -swing;
            wizardRefs.leftArm.rotation.x = -swing * 0.7;
            wizardRefs.rightArm.rotation.x = swing * 0.5;
            wizardRefs.cape.rotation.x = 0.14 + Math.min(0.25, horizMag * 0.02);
            wizardRefs.flightHalo.scale.setScalar(0.001);
          }
          wizardRefs.staffOrb.rotation.y = t * 2.4;
        } else {
          /* ---- Normal Free-Camera WASD + Q/E Exploration ---- */
          moveInput.set(0, 0, 0);
          if (keysDown.has("KeyW")) moveInput.z += 1;
          if (keysDown.has("KeyS")) moveInput.z -= 1;
          if (keysDown.has("KeyD")) moveInput.x += 1;
          if (keysDown.has("KeyA")) moveInput.x -= 1;
          if (keysDown.has("KeyE")) moveInput.y += 1;
          if (keysDown.has("KeyQ")) moveInput.y -= 1;

          if (moveInput.lengthSq() > 0) {
            moveInput.normalize();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            if (camForward.lengthSq() > 1e-6) camForward.normalize();
            else camForward.set(0, 0, -1);
            camRight.crossVectors(camForward, worldUp).normalize();

            const speed = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight") ? 64 : 28;
            const targetVx = (camForward.x * moveInput.z + camRight.x * moveInput.x) * speed;
            const targetVz = (camForward.z * moveInput.z + camRight.z * moveInput.x) * speed;
            const targetVy = moveInput.y * speed * 0.7;
            const accel = 1 - Math.exp(-delta * 10);
            moveVelocity.x += (targetVx - moveVelocity.x) * accel;
            moveVelocity.y += (targetVy - moveVelocity.y) * accel;
            moveVelocity.z += (targetVz - moveVelocity.z) * accel;
          } else {
            moveVelocity.multiplyScalar(Math.exp(-delta * 9));
            if (moveVelocity.lengthSq() < 1e-4) moveVelocity.set(0, 0, 0);
          }

          if (moveVelocity.lengthSq() > 0) {
            const nextTx = THREE.MathUtils.clamp(controls.target.x + moveVelocity.x * delta, -165, 165);
            const nextTy = THREE.MathUtils.clamp(controls.target.y + moveVelocity.y * delta, -13.0, 64);
            const nextTz = THREE.MathUtils.clamp(controls.target.z + moveVelocity.z * delta, -165, 165);
            camera.position.x += nextTx - controls.target.x;
            camera.position.y = Math.max(-11.0, camera.position.y + (nextTy - controls.target.y));
            camera.position.z += nextTz - controls.target.z;
            controls.target.set(nextTx, nextTy, nextTz);
          }
        }

        controls.update();

        fireBoost = Math.max(0, fireBoost - delta * 0.85);
        crystalPulse = Math.max(0, crystalPulse - delta * 0.9);
        cauldronPulse = Math.max(0, cauldronPulse - delta * 0.85);
        astrolabePulse = Math.max(0, astrolabePulse - delta * 0.85);
        fountainPulse = Math.max(0, fountainPulse - delta * 0.85);
        statuePulse = Math.max(0, statuePulse - delta * 0.85);
        portalPulse = Math.max(0, portalPulse - delta * 0.8);
        mimicPulse = Math.max(0, mimicPulse - delta * 0.9);
        beholderPulse = Math.max(0, beholderPulse - delta * 0.85);
        dragonPulse = Math.max(0, dragonPulse - delta * 0.9);
        d20Pulse = Math.max(0, d20Pulse - delta * 0.95);
        questPulse = Math.max(0, questPulse - delta * 0.9);
        grimoirePulse = Math.max(0, grimoirePulse - delta * 0.85);
        spelljammerPulse = Math.max(0, spelljammerPulse - delta * 0.8);
        dragonEggPulse = Math.max(0, dragonEggPulse - delta * 0.9);
        mythallarPulse = Math.max(0, mythallarPulse - delta * 0.85);
        swordStonePulse = Math.max(0, swordStonePulse - delta * 0.9);
        anvilPulse = Math.max(0, anvilPulse - delta * 0.95);

        // B2 Underdark Mythallar, Forge Flame, Sword in Stone & River
        b2Refs.mythallarCore.position.y = -9.4 + Math.sin(t * 2.0) * 0.3 + mythallarPulse * 0.45;
        b2Refs.mythallarCore.rotation.y = t * (0.8 + mythallarPulse * 3.0);
        b2Refs.mythallarRings.rotation.y = -t * (0.6 + mythallarPulse * 2.4);
        b2Refs.mythallarRings.rotation.z = Math.sin(t * 0.8) * 0.28;
        b2CrystalLight.intensity = 34 + Math.sin(t * 2.4) * 3.5 + mythallarPulse * 22;
        b2Refs.swordInStone.position.y = -9.95 + Math.sin(t * 3.0) * 0.04 + swordStonePulse * 0.25;
        b2Refs.forgeFlame.scale.set(
          1 + anvilPulse * 0.28,
          1 + Math.sin(t * 15) * 0.12 + anvilPulse * 0.55,
          1 + anvilPulse * 0.28
        );
        b2ForgeLight.intensity = 32 + Math.sin(t * 14) * 4.0 + anvilPulse * 22;
        b2Refs.underdarkRiver.position.y = -12.72 + Math.sin(t * 2.2) * 0.025;

        // Fireplace & Campfire
        const fireFlicker = 1.0 + Math.sin(t * 14) * 0.1 + Math.cos(t * 21) * 0.06 + fireBoost * 0.45;
        interiorRefs.fireMesh.scale.set(1 + fireBoost * 0.2, fireFlicker, 1 + fireBoost * 0.2);
        hearthLight.intensity = 42 + Math.sin(t * 12) * 4.0 + fireBoost * 24 + dragonPulse * 16;
        exteriorRefs.campFire.scale.set(1, 1 + Math.sin(t * 13) * 0.12, 1);

        // Chimney smoke
        const smokeChildren = shellRefs.chimneySmoke.children;
        for (let i = 0; i < smokeChildren.length; i++) {
          const phase = (t * 0.5 + i / smokeChildren.length) % 1;
          smokeChildren[i].position.set(
            phase * 2.2 + Math.sin(t * 1.4 + i) * 0.26,
            phase * 7.4,
            -phase * 0.95
          );
          smokeChildren[i].scale.setScalar(0.55 + phase * 1.35);
        }

        // B1 Arcane Circle, Cauldron, Mimic & Beholder
        interiorRefs.arcaneCrystal.position.y = -3.3 + Math.sin(t * 2.2) * 0.3 + crystalPulse * 0.4;
        interiorRefs.arcaneCrystal.rotation.y = t * (0.9 + crystalPulse * 2.6);
        interiorRefs.floatingBooks.rotation.y = -t * 0.65;
        interiorRefs.runeRing.rotation.z = t * 0.35;
        interiorRefs.innerRuneRing.rotation.z = -t * 0.52;
        cellarArcaneLight.intensity = 34 + Math.sin(t * 3.0) * 3.2 + crystalPulse * 20;

        const cScale = 1.0 + Math.sin(t * 6.5) * 0.05 + cauldronPulse * 0.25;
        interiorRefs.cauldronLiquid.scale.set(cScale, 1 + cauldronPulse * 0.6, cScale);
        const bubbleChildren = interiorRefs.cauldronBubbles.children;
        for (let i = 0; i < bubbleChildren.length; i++) {
          const bPhase = (t * (0.65 + cauldronPulse * 0.8) + i / bubbleChildren.length) % 1;
          bubbleChildren[i].position.y = bPhase * 2.2;
          bubbleChildren[i].scale.setScalar(
            Math.max(0.05, Math.sin(bPhase * Math.PI) * (0.9 + cauldronPulse * 0.4))
          );
        }

        dndRefs.mimicLid.rotation.x =
          mimicPulse > 0.02
            ? -0.22 - Math.abs(Math.sin(t * 12)) * Math.min(1, mimicPulse) * 0.95
            : -0.08 - Math.sin(t * 1.6) * 0.04;
        dndRefs.beholderBody.position.y = 2.53 + Math.sin(t * 2.5) * 0.16;
        dndRefs.beholderBody.rotation.y = t * (0.65 + beholderPulse * 3.4);

        // 1F Chandelier, Dragon Trophy, Giant D20 & Quest Sigil
        interiorRefs.chandelier.rotation.z = Math.sin(t * 1.1) * 0.03;
        dndRefs.dragonHead.rotation.z = dragonPulse > 0.02 ? Math.sin(t * 20) * 0.06 * dragonPulse : 0;
        const breathAmt = Math.min(1, dragonPulse);
        dndRefs.dragonBreath.scale.set(
          Math.max(0.01, breathAmt * 1.25),
          Math.max(0.01, breathAmt * (1.15 + Math.sin(t * 24) * 0.15)),
          Math.max(0.01, breathAmt * 1.25)
        );
        dndRefs.giantD20.position.y = 2.3 + Math.sin(t * 2.4) * 0.16 + d20Pulse * 0.38;
        dndRefs.giantD20.rotation.x = t * (0.7 + d20Pulse * 4.5);
        dndRefs.giantD20.rotation.y = t * (0.9 + d20Pulse * 5.2);
        dndRefs.questSigil.position.y = 4.45 + Math.sin(t * 3.2) * 0.18 + questPulse * 0.45;
        dndRefs.questSigil.rotation.y = t * (1.2 + questPulse * 3.5);

        // 2F Bath Steam & Floating Grimoire
        interiorRefs.bathSteam.position.y = 8.925 + Math.sin(t * 1.6) * 0.24;
        dndRefs.grimoireBook.position.y = 2.08 + Math.sin(t * 2.2) * 0.12 + grimoirePulse * 0.34;
        dndRefs.grimoireBook.rotation.y = Math.sin(t * 0.9) * 0.25 + grimoirePulse * 2.2;

        // 3F Astrolabe, Spelljammer, Fountain & Dragon Egg
        interiorRefs.astrolabe.rotation.y = t * (0.45 + astrolabePulse * 1.8);
        interiorRefs.astrolabeInner.rotation.x = t * (0.6 + astrolabePulse * 2.2);
        interiorRefs.astrolabeCore.scale.setScalar(1 + astrolabePulse * 0.35 + Math.sin(t * 4) * 0.06);
        atticLight.intensity = 26 + astrolabePulse * 14;

        const sjAngle = t * (0.55 + spelljammerPulse * 1.4);
        dndRefs.spelljammer.position.set(
          -11.2 + Math.cos(sjAngle) * 6.0,
          18.2 + Math.sin(t * 2.2) * 0.26,
          1.0 + Math.sin(sjAngle) * 4.2
        );
        dndRefs.spelljammer.rotation.y = -sjAngle + Math.PI * 0.5;

        interiorRefs.fountainWater.scale.set(
          1 + Math.sin(t * 5) * 0.03 + fountainPulse * 0.14,
          1 + fountainPulse * 0.5,
          1 + Math.sin(t * 5) * 0.03 + fountainPulse * 0.14
        );
        dndRefs.dragonEgg.rotation.z =
          dragonEggPulse > 0.02
            ? Math.sin(t * 18) * 0.22 * Math.min(1, dragonEggPulse)
            : Math.sin(t * 2.0) * 0.04;
        dndRefs.dragonEgg.scale.set(
          0.84 + dragonEggPulse * 0.08,
          1.28 + dragonEggPulse * 0.12,
          0.84 + dragonEggPulse * 0.08
        );

        // Exterior Pool, Stream, Waterwheel, Ancient Statues & Astral Portal
        exteriorRefs.poolWater.position.y = -0.02 + Math.sin(t * 2.4) * 0.038;
        exteriorRefs.waterfallStream.scale.x = 1 + Math.sin(t * 8.5) * 0.05;
        exteriorRefs.lotusGroup.position.y = Math.sin(t * 2.4) * 0.038;
        exteriorRefs.waterwheel.rotation.x = -t * 0.75;

        const streamSegs = exteriorRefs.streamWater.children;
        for (let i = 0; i < streamSegs.length; i++) {
          const phase = (streamSegs[i].userData.phase as number) || 0;
          streamSegs[i].position.y = -0.15 + Math.sin(t * 3.2 - phase) * 0.018;
        }

        exteriorRefs.statueEye.position.y = 8.45 + Math.sin(t * 2.0) * 0.28 + statuePulse * 0.45;
        exteriorRefs.statueEye.rotation.y = t * (0.7 + statuePulse * 2.6);
        exteriorRefs.statueShards.rotation.y = -t * (0.55 + statuePulse * 1.8);
        statueLight.intensity = 30 + Math.sin(t * 2.6) * 3.2 + statuePulse * 20;

        exteriorRefs.totemHalo.rotation.y = t * 0.48;
        exteriorRefs.forestPortal.rotation.z = t * (0.65 + portalPulse * 2.4);
        const pScale = 1.0 + Math.sin(t * 3.6) * 0.04 + portalPulse * 0.18;
        exteriorRefs.forestPortal.scale.setScalar(pScale);
        exteriorRefs.portalFloatStones.rotation.y = -t * (0.4 + portalPulse * 1.6);
        portalLight.intensity = 30 + Math.sin(t * 3.2) * 3.0 + portalPulse * 20;

        exteriorRefs.fireflies.rotation.y = t * 0.03;
        exteriorRefs.fireflies.position.y = Math.sin(t * 1.1) * 0.65;
        exteriorRefs.stars.rotation.y = t * 0.003;

        composer.render();
      };

      rafId = requestAnimationFrame(animate);
    } catch {
      setRenderFailed(true);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      for (const fn of cleanupFns) fn();
      controls?.dispose();
      composer?.dispose();
      if (renderer) {
        renderer.dispose();
        try {
          renderer.forceContextLoss();
        } catch {}
        if (renderer.domElement.parentNode === host) {
          host.removeChild(renderer.domElement);
        }
      }
    };
  }, [webglSupported, generation]);

  if (!webglSupported || renderFailed) {
    return (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#131b2e",
          color: "#ffdf8c",
          fontFamily: "monospace",
        }}
      >
        当前浏览器 WebGL2 资源不足，无法渲染 3D 低多边形奇幻别墅。
      </div>
    );
  }

  return (
    <SceneErrorBoundary>
      <div
        ref={hostRef}
        style={{
          position: "relative",
          width: "100%",
          height: "700px",
          backgroundColor: "#131b2e",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <div
          ref={toastRef}
          aria-live="polite"
          style={{
            position: "absolute",
            bottom: "18px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 223, 140, 0.55)",
            backgroundColor: "rgba(12, 18, 34, 0.86)",
            color: "#ffdf8c",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 0.25s ease",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        />
        {contextLost && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.75)",
              color: "#ffd166",
              fontFamily: "monospace",
            }}
          >
            WebGL 上下文正在恢复中...
          </div>
        )}
      </div>
    </SceneErrorBoundary>
  );
}
