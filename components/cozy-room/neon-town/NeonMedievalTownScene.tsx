"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import SceneErrorBoundary from "../SceneErrorBoundary";
import { checkWebGL } from "../webgl";
import {
  ArchitecturalInkPostShader,
  NEON_TOWN_PALETTE,
  createNormalDepthMaterial,
  createTownLineMaterial,
  createTownOcclusionMaterial,
} from "./townShader";
import { buildNeonMedievalTownData, getTownHeight } from "./townBuilder";
import { createTownNpcSystem } from "./townNpcs";
import { attachTownInteractions } from "./townInteractions";

const MAX_CONTEXT_RETRIES = 3;

function createLineObject(
  geometry: ConstructorParameters<typeof LineSegments2>[0],
  material: ConstructorParameters<typeof LineSegments2>[1]
): LineSegments2 {
  const seg = new LineSegments2(geometry, material);
  seg.computeLineDistances();
  return seg;
}

export default function NeonMedievalTownScene({
  frameloop = "always",
}: {
  frameloop?: "always" | "never";
}) {
  const [webglSupported] = useState(() =>
    typeof window !== "undefined" ? checkWebGL() : true
  );
  const [generation, setGeneration] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const frameloopRef = useRef(frameloop);

  useEffect(() => {
    frameloopRef.current = frameloop;
  }, [frameloop]);

  useEffect(() => {
    if (!webglSupported) return;
    const host = hostRef.current;
    if (!host) return;

    const initW = Math.max(1, host.clientWidth || 960);
    const initH = Math.max(1, host.clientHeight || 700);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    /* ---- Renderer ---- */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(initW, initH, false);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.outline = "none";
    renderer.domElement.tabIndex = 0;
    host.appendChild(renderer.domElement);

    /* ---- Heroic Real-Scale Camera & OrbitControls ---- */
    const cameraNear = 1.5;
    const cameraFar = 2200;
    const camera = new THREE.PerspectiveCamera(42, initW / initH, cameraNear, cameraFar);
    camera.position.set(192, 82, 338);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 32, -24);
    controls.enableDamping = true;
    controls.dampingFactor = 0.068;
    controls.minDistance = 8;
    controls.maxDistance = 860;
    controls.maxPolarAngle = Math.PI * 0.488;
    controls.panSpeed = 1.05;
    controls.update();

    /* ---- Main Scene & Normal-Depth G-Buffer Scene ---- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(NEON_TOWN_PALETTE.background);
    scene.fog = new THREE.Fog(NEON_TOWN_PALETTE.fogColor, 420, 1480);

    const gBufferScene = new THREE.Scene();
    gBufferScene.background = new THREE.Color(0x8080ff);

    const data = buildNeonMedievalTownData();
    const resolution = new THREE.Vector2(initW, initH);

    /* ---- Materials ---- */
    const matWall = createTownOcclusionMaterial({ hatchScale: 1.0 });
    const matRoof = createTownOcclusionMaterial({ isRoof: true, hatchScale: 1.15 });
    const matTerrain = createTownOcclusionMaterial({ hatchScale: 0.48 });
    const matWater = createTownOcclusionMaterial({ isWater: true });
    const matDarkInk = createTownOcclusionMaterial({ isDarkInk: true });
    const matWindow = new THREE.MeshBasicMaterial({
      color: new THREE.Color(NEON_TOWN_PALETTE.windowGlow),
      polygonOffset: true,
      polygonOffsetFactor: 1.4,
      polygonOffsetUnits: 1.4,
    });
    const matPrimaryLine = createTownLineMaterial(NEON_TOWN_PALETTE.inkPrimary, 1.85, resolution);
    const matSecondaryLine = createTownLineMaterial(NEON_TOWN_PALETTE.inkSecondary, 1.2, resolution);
    const matFineLine = createTownLineMaterial(NEON_TOWN_PALETTE.inkFine, 0.8, resolution);
    const matContourLine = createTownLineMaterial(NEON_TOWN_PALETTE.inkFine, 0.66, resolution);
    const matNormalDepth = createNormalDepthMaterial(cameraNear, cameraFar);

    /* ---- Static World Meshes ---- */
    scene.add(
      new THREE.Mesh(data.terrainGeo, matTerrain),
      new THREE.Mesh(data.waterGeo, matWater),
      new THREE.Mesh(data.staticOcclusionGeo, matWall),
      new THREE.Mesh(data.roofOcclusionGeo, matRoof),
      new THREE.Mesh(data.windowGlowGeo, matWindow)
    );
    gBufferScene.add(
      new THREE.Mesh(data.terrainGeo, matNormalDepth),
      new THREE.Mesh(data.staticOcclusionGeo, matNormalDepth),
      new THREE.Mesh(data.roofOcclusionGeo, matNormalDepth)
    );

    /* ---- Weighted Architectural Ink Line Layers ---- */
    scene.add(
      createLineObject(data.primaryLinesGeo, matPrimaryLine),
      createLineObject(data.secondaryLinesGeo, matSecondaryLine),
      createLineObject(data.fineLinesGeo, matFineLine),
      createLineObject(data.terrainContourLinesGeo, matContourLine)
    );

    /* ---- Living NPCs: Townsfolk, Guards, Sheep, Cows, Horses & Carts ---- */
    const npcSystem = createTownNpcSystem(scene, gBufferScene, getTownHeight, {
      personMat: matDarkInk,
      sheepMat: matWall,
      cowMat: matRoof,
      horseMat: matDarkInk,
      cartMat: matRoof,
      normalDepthMat: matNormalDepth,
    });

    /* ---- Animated Environmental Elements ---- */
    const riverRipples = new THREE.Group();
    riverRipples.add(createLineObject(data.riverRippleGeo, matFineLine));
    scene.add(riverRipples);

    const fountainGroup = new THREE.Group();
    fountainGroup.position.copy(data.fountainOrigin);
    const fountainJets = createLineObject(data.fountainJetsGeo, matSecondaryLine);
    const fountainRipple = createLineObject(data.fountainRippleGeo, matFineLine);
    fountainGroup.add(fountainJets, fountainRipple);
    scene.add(fountainGroup);

    const windmillRotors: Array<{ rotor: THREE.Group; speed: number; boost: number }> = [];
    const windmillAnchors: THREE.Object3D[] = [];
    for (const mount of data.windmillMounts) {
      const anchor = new THREE.Group();
      anchor.position.copy(mount.hub);
      anchor.rotation.y = mount.rotY;
      const rotor = new THREE.Group();
      rotor.add(new THREE.Mesh(data.windmillSailsOcclusionGeo, matWall));
      rotor.add(createLineObject(data.windmillSailsLinesGeo, matPrimaryLine));
      anchor.add(rotor);
      scene.add(anchor);
      windmillAnchors.push(anchor);
      windmillRotors.push({ rotor, speed: mount.speed, boost: 0 });
    }

    const bannerNodes: Array<{ node: THREE.Group; baseRotY: number; phase: number }> = [];
    for (const mount of data.bannerMounts) {
      const node = new THREE.Group();
      node.position.copy(mount.pos);
      node.rotation.y = mount.rotY;
      node.scale.setScalar(mount.scale);
      node.add(new THREE.Mesh(data.bannerOcclusionGeo, matRoof));
      node.add(createLineObject(data.bannerLinesGeo, matPrimaryLine));
      scene.add(node);
      bannerNodes.push({ node, baseRotY: mount.rotY, phase: mount.phase });
    }

    const smokeCount = Math.min(40, Math.max(16, data.chimneyTops.length * 2));
    const smokeNodes: THREE.Group[] = [];
    for (let i = 0; i < smokeCount; i++) {
      const g = new THREE.Group();
      g.add(createLineObject(data.smokeRingGeo, matFineLine));
      scene.add(g);
      smokeNodes.push(g);
    }

    const birdsGroup = new THREE.Group();
    birdsGroup.position.set(0, 0, -90);
    birdsGroup.add(createLineObject(data.birdLinesGeo, matPrimaryLine));
    scene.add(birdsGroup);

    const cloudsGroup = new THREE.Group();
    cloudsGroup.add(new THREE.Mesh(data.cloudOcclusionGeo, matWall));
    cloudsGroup.add(createLineObject(data.cloudLinesGeo, matFineLine));
    scene.add(cloudsGroup);

    /* ---- Interactive Mouse Drag (NPCs) & Click (Windmills, Fountain) ---- */
    let fountainSurge = 0;
    const interactions = attachTownInteractions(
      renderer.domElement,
      camera,
      controls,
      scene,
      npcSystem,
      windmillAnchors,
      data.fountainOrigin,
      {
        onWindmillClick: (idx) => {
          if (windmillRotors[idx]) windmillRotors[idx].boost = 2.6;
        },
        onFountainClick: () => {
          fountainSurge = 1.6;
        },
      }
    );

    /* ---- Post-Processing Pipeline ---- */
    const rtWidth = Math.max(1, Math.floor(initW * dpr));
    const rtHeight = Math.max(1, Math.floor(initH * dpr));
    const normalDepthTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
    });

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(initW, initH);

    const renderPass = new RenderPass(scene, camera);
    const inkPostPass = new ShaderPass(ArchitecturalInkPostShader);
    inkPostPass.uniforms.tNormalDepth.value = normalDepthTarget.texture;
    inkPostPass.uniforms.uResolution.value.set(rtWidth, rtHeight);

    composer.addPass(renderPass);
    composer.addPass(inkPostPass);

    (window as unknown as Record<string, unknown>).__COZYROOM__ = {
      scene,
      camera,
      gl: renderer,
    };

    /* ---- WASD + OrbitControls Wide-World Navigation ---- */
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
        code === "KeyW" ||
        code === "KeyA" ||
        code === "KeyS" ||
        code === "KeyD" ||
        code === "KeyQ" ||
        code === "KeyE" ||
        code === "ShiftLeft" ||
        code === "ShiftRight"
      ) {
        keysDown.add(code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };

    const onWindowBlur = () => {
      keysDown.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

    /* ---- WebGL Context Recovery ---- */
    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
      setGeneration((g) => (g < MAX_CONTEXT_RETRIES ? g + 1 : g));
    };
    const onRestored = () => setContextLost(false);
    renderer.domElement.addEventListener("webglcontextlost", onLost, false);
    renderer.domElement.addEventListener("webglcontextrestored", onRestored, false);

    /* ---- Responsive ResizeObserver ---- */
    const handleResize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      const curDpr = Math.min(window.devicePixelRatio || 1, 1.75);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(curDpr);
      renderer.setSize(w, h, false);
      composer.setPixelRatio(curDpr);
      composer.setSize(w, h);
      const rtw = Math.max(1, Math.floor(w * curDpr));
      const rth = Math.max(1, Math.floor(h * curDpr));
      normalDepthTarget.setSize(rtw, rth);
      inkPostPass.uniforms.uResolution.value.set(rtw, rth);
      resolution.set(w, h);
      matPrimaryLine.resolution.set(w, h);
      matSecondaryLine.resolution.set(w, h);
      matFineLine.resolution.set(w, h);
      matContourLine.resolution.set(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(host);

    /* ---- Animation Loop ---- */
    let rafId = 0;
    let lastTime = performance.now();
    let simTime = 0;
    let disposed = false;

    const animate = (now: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);

      const rawDelta = (now - lastTime) * 0.001;
      lastTime = now;
      if (frameloopRef.current === "never") return;

      const delta = Math.min(Math.max(rawDelta, 0.001), 0.05);
      simTime += delta;
      const t = simTime;

      // WASD horizontal camera-relative locomotion + Q/E vertical lift
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
        if (camForward.lengthSq() > 1e-6) {
          camForward.normalize();
        } else {
          camForward.set(0, 0, -1);
        }
        camRight.crossVectors(camForward, worldUp).normalize();

        const speed = keysDown.has("ShiftLeft") || keysDown.has("ShiftRight") ? 245 : 96;
        const targetVx = (camForward.x * moveInput.z + camRight.x * moveInput.x) * speed;
        const targetVz = (camForward.z * moveInput.z + camRight.z * moveInput.x) * speed;
        const targetVy = moveInput.y * speed * 0.65;
        const accel = 1 - Math.exp(-delta * 10);
        moveVelocity.x += (targetVx - moveVelocity.x) * accel;
        moveVelocity.y += (targetVy - moveVelocity.y) * accel;
        moveVelocity.z += (targetVz - moveVelocity.z) * accel;
      } else {
        const decel = Math.exp(-delta * 9);
        moveVelocity.multiplyScalar(decel);
        if (moveVelocity.lengthSq() < 1e-4) moveVelocity.set(0, 0, 0);
      }

      if (moveVelocity.lengthSq() > 0) {
        const dx = moveVelocity.x * delta;
        const dy = moveVelocity.y * delta;
        const dz = moveVelocity.z * delta;

        const nextTargetX = THREE.MathUtils.clamp(controls.target.x + dx, -450, 450);
        const nextTargetZ = THREE.MathUtils.clamp(controls.target.z + dz, -450, 450);
        const groundAtTarget = getTownHeight(nextTargetX, nextTargetZ);
        const nextTargetY = THREE.MathUtils.clamp(
          controls.target.y + dy,
          Math.max(2.0, groundAtTarget + 1.5),
          260
        );

        const appliedDx = nextTargetX - controls.target.x;
        const appliedDy = nextTargetY - controls.target.y;
        const appliedDz = nextTargetZ - controls.target.z;

        controls.target.set(nextTargetX, nextTargetY, nextTargetZ);
        camera.position.x += appliedDx;
        camera.position.z += appliedDz;
        const groundAtCam = getTownHeight(camera.position.x, camera.position.z);
        camera.position.y = Math.max(groundAtCam + 3.2, camera.position.y + appliedDy);
      }

      controls.update();

      // Update animated NPCs
      npcSystem.update(t, delta);

      // Update windmills (with click gust boost decay)
      for (const wm of windmillRotors) {
        wm.boost = Math.max(0, wm.boost - delta * 0.85);
        wm.rotor.rotation.z -= delta * (wm.speed + wm.boost);
      }

      for (const b of bannerNodes) {
        b.node.rotation.y = b.baseRotY + Math.sin(t * 3.0 + b.phase) * 0.24;
        b.node.rotation.z = Math.cos(t * 2.3 + b.phase) * 0.06;
      }

      // Fountain pulse + interactive water surge decay
      fountainSurge = Math.max(0, fountainSurge - delta * 0.55);
      const fPulse = 0.96 + Math.sin(t * 5.0) * 0.04 + fountainSurge * 0.22;
      fountainJets.scale.set(1 + fountainSurge * 0.08, fPulse, 1 + fountainSurge * 0.08);
      const ripPhase = (t * (0.5 + fountainSurge * 0.7)) % 1;
      const ripScale = 0.72 + ripPhase * 0.36;
      fountainRipple.scale.set(ripScale, 1, ripScale);

      riverRipples.position.x = ((t * 3.2) % 12.0) - 6.0;

      if (data.chimneyTops.length > 0) {
        for (let i = 0; i < smokeNodes.length; i++) {
          const g = smokeNodes[i];
          const chim = data.chimneyTops[i % data.chimneyTops.length];
          const phase = (t * 0.22 + i * 0.11) % 1;
          g.position.set(
            chim.x + Math.sin(t * 0.75 + i) * phase * 2.4,
            chim.y + phase * 10.5,
            chim.z + Math.cos(t * 0.6 + i) * phase * 1.6
          );
          const s = 0.32 + phase * 1.1;
          g.scale.set(s, 1, s);
        }
      }

      birdsGroup.rotation.y = t * 0.09;
      birdsGroup.position.y = Math.sin(t * 0.9) * 3.2;
      cloudsGroup.position.x = Math.sin(t * 0.02) * 48;
      cloudsGroup.position.z = Math.cos(t * 0.016) * 26;

      // Pass 1: Normal+Depth G-buffer
      renderer.setRenderTarget(normalDepthTarget);
      renderer.clear();
      renderer.render(gBufferScene, camera);
      renderer.setRenderTarget(null);

      // Pass 2 & 3: Main Hidden-Line Scene + Engraving Post-Processing Composite
      composer.render();
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onRestored);
      interactions.dispose();
      npcSystem.dispose();
      controls.dispose();
      composer.dispose();
      normalDepthTarget.dispose();
      matWall.dispose();
      matRoof.dispose();
      matTerrain.dispose();
      matWater.dispose();
      matDarkInk.dispose();
      matWindow.dispose();
      matPrimaryLine.dispose();
      matSecondaryLine.dispose();
      matFineLine.dispose();
      matContourLine.dispose();
      matNormalDepth.dispose();
      data.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch {}
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [webglSupported, generation]);

  if (!webglSupported) {
    return (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: NEON_TOWN_PALETTE.background,
          color: NEON_TOWN_PALETTE.inkPrimary,
          fontFamily: "monospace",
        }}
      >
        当前浏览器不支持 WebGL2，无法渲染 3D 线条宏伟中世纪城镇。
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
          backgroundColor: NEON_TOWN_PALETTE.background,
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
