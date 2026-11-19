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
import { buildVillaExterior } from "./villaExterior";

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
    let disposed = false;

    const cleanupFns: Array<() => void> = [];

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
      const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.4, 280);
      // Unobstructed front-right heroic cutaway framing all 4 levels + Balcony + Pool + Deep Forest
      camera.position.set(13.8, 12.4, 36.2);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(2.6, 4.9, 0.2);
      controls.enableDamping = true;
      controls.dampingFactor = 0.068;
      controls.minDistance = 5;
      controls.maxDistance = 88;
      controls.maxPolarAngle = Math.PI * 0.495;
      controls.panSpeed = 0.95;
      controls.update();

      /* ---- Scene & Twilight D&D Deep Forest Atmosphere ---- */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x131b2e);
      scene.fog = new THREE.FogExp2(0x131b2e, 0.0105);

      /* ---- Lighting ---- */
      const hemiLight = new THREE.HemisphereLight(0x9ac0ff, 0x2a3b2e, 0.8);
      scene.add(hemiLight);

      const moonLight = new THREE.DirectionalLight(0xd4e6ff, 1.4);
      moonLight.position.set(26, 44, 28);
      moonLight.castShadow = true;
      moonLight.shadow.mapSize.set(1024, 1024);
      moonLight.shadow.camera.near = 5;
      moonLight.shadow.camera.far = 110;
      moonLight.shadow.camera.left = -34;
      moonLight.shadow.camera.right = 34;
      moonLight.shadow.camera.top = 34;
      moonLight.shadow.camera.bottom = -34;
      moonLight.shadow.bias = -0.0006;
      scene.add(moonLight);

      const hearthLight = new THREE.PointLight(0xff8c3b, 20, 24, 1.5);
      hearthLight.position.set(-5.8, 2.2, 0.4);
      const diningLight = new THREE.PointLight(0xffcf73, 14, 20, 1.5);
      diningLight.position.set(4.8, 3.0, 1.6);
      const cellarArcaneLight = new THREE.PointLight(0x4be3ff, 18, 20, 1.5);
      cellarArcaneLight.position.set(-4.0, -1.6, 1.6);
      const upperFloorLight = new THREE.PointLight(0xffd894, 16, 24, 1.5);
      upperFloorLight.position.set(0.2, 7.2, 1.8);
      const atticLight = new THREE.PointLight(0xffd27d, 13, 18, 1.5);
      atticLight.position.set(-4.0, 11.4, 0.8);
      const gardenLight = new THREE.PointLight(0xffcf82, 12, 18, 1.5);
      gardenLight.position.set(4.8, 11.8, 0.5);
      const poolGlowLight = new THREE.PointLight(0x38e0ee, 14, 20, 1.5);
      poolGlowLight.position.set(15.6, 1.4, 0.8);
      scene.add(
        hearthLight,
        diningLight,
        cellarArcaneLight,
        upperFloorLight,
        atticLight,
        gardenLight,
        poolGlowLight
      );

      /* ---- Build Modular Villa World ---- */
      const palette = createVillaPalette();
      const worldGroup = new THREE.Group();
      scene.add(worldGroup);

      buildVillaShell(worldGroup, palette);
      const interiorRefs = buildVillaInteriors(worldGroup, palette);
      const exteriorRefs = buildVillaExterior(worldGroup, palette);

      cleanupFns.push(() => {
        exteriorRefs.dispose();
        worldGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) obj.geometry.dispose();
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

      /* ---- Interactive Clicks ---- */
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      let pointerDownPos: { x: number; y: number } | null = null;
      let fireBoost = 0;
      let crystalPulse = 0;
      let cauldronPulse = 0;

      const clickTargets = [
        interiorRefs.fireMesh,
        interiorRefs.arcaneCrystal,
        interiorRefs.cauldronLiquid,
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
        } else if (hitName === "villa_arcane_crystal") {
          crystalPulse = 2.0;
          playWarmChime(5);
        } else if (hitName === "villa_cauldron") {
          cauldronPulse = 1.8;
          playWarmChime(2);
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

      /* ---- WASD + Q/E + Shift Navigation ---- */
      const keysDown = new Set<string>();
      const moveVelocity = new THREE.Vector3();
      const moveInput = new THREE.Vector3();
      const camForward = new THREE.Vector3();
      const camRight = new THREE.Vector3();
      const worldUp = new THREE.Vector3(0, 1, 0);

      const isEditableTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false;
        const tag = target.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (isEditableTarget(e.target)) return;
        const code = e.code;
        if (
          code === "KeyW" || code === "KeyA" || code === "KeyS" || code === "KeyD" ||
          code === "KeyQ" || code === "KeyE" || code === "ShiftLeft" || code === "ShiftRight"
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

      /* ---- Animation Loop ---- */
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

          const speed = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight") ? 32 : 16;
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
          const nextTx = THREE.MathUtils.clamp(controls.target.x + moveVelocity.x * delta, -42, 42);
          const nextTy = THREE.MathUtils.clamp(controls.target.y + moveVelocity.y * delta, -4.0, 26);
          const nextTz = THREE.MathUtils.clamp(controls.target.z + moveVelocity.z * delta, -42, 42);
          camera.position.x += nextTx - controls.target.x;
          camera.position.y = Math.max(-2.5, camera.position.y + (nextTy - controls.target.y));
          camera.position.z += nextTz - controls.target.z;
          controls.target.set(nextTx, nextTy, nextTz);
        }

        controls.update();

        fireBoost = Math.max(0, fireBoost - delta * 0.85);
        crystalPulse = Math.max(0, crystalPulse - delta * 0.9);
        cauldronPulse = Math.max(0, cauldronPulse - delta * 0.85);

        const fireFlicker = 1.0 + Math.sin(t * 14) * 0.1 + Math.cos(t * 21) * 0.06 + fireBoost * 0.45;
        interiorRefs.fireMesh.scale.set(1 + fireBoost * 0.2, fireFlicker, 1 + fireBoost * 0.2);
        hearthLight.intensity = 20 + Math.sin(t * 12) * 2.5 + fireBoost * 16;

        interiorRefs.arcaneCrystal.position.y = -2.3 + Math.sin(t * 2.2) * 0.24 + crystalPulse * 0.3;
        interiorRefs.arcaneCrystal.rotation.y = t * (0.9 + crystalPulse * 2.6);
        interiorRefs.floatingBooks.rotation.y = -t * 0.65;
        interiorRefs.runeRing.rotation.z = t * 0.35;
        cellarArcaneLight.intensity = 18 + Math.sin(t * 3.0) * 2.0 + crystalPulse * 14;

        const cScale = 1.0 + Math.sin(t * 6.5) * 0.05 + cauldronPulse * 0.25;
        interiorRefs.cauldronLiquid.scale.set(cScale, 1 + cauldronPulse * 0.6, cScale);

        interiorRefs.chandelier.rotation.z = Math.sin(t * 1.1) * 0.03;
        interiorRefs.astrolabe.rotation.y = t * 0.45;
        interiorRefs.bathSteam.position.y = 6.0 + Math.sin(t * 1.6) * 0.18;

        exteriorRefs.poolWater.position.y = -0.16 + Math.sin(t * 2.4) * 0.035;
        exteriorRefs.fireflies.rotation.y = t * 0.04;
        exteriorRefs.fireflies.position.y = Math.sin(t * 1.1) * 0.45;

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
