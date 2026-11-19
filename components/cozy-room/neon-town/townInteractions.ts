import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { NpcKind, TownNpcSystem } from "./townNpcs";
import { NEON_TOWN_PALETTE } from "./townShader";
import { playSoftClick, playWarmChime } from "../remaster/remasterAudio";

export interface TownInteractionHandlers {
  onWindmillClick: (windmillIndex: number) => void;
  onFountainClick: () => void;
}

export interface TownInteractionController {
  dispose: () => void;
}

/**
 * Pure-canvas pointer interactions (no HUD or control bars):
 * - Hover NPCs -> grab cursor; hover interactive landmarks -> pointer cursor
 * - Press & drag any NPC (person, sheep, cow, horse) -> pauses OrbitControls, lifts & wiggles NPC
 *   with an architectural drop-target ink ring, and drops/relocates it with bounce on release
 * - Quick click an NPC -> joyful jump & chime
 * - Click a Windmill -> gust spin boost
 * - Click the Central Fountain -> triumphant water-jet surge
 */
export function attachTownInteractions(
  domElement: HTMLCanvasElement,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  scene: THREE.Scene,
  npcSystem: TownNpcSystem,
  windmillAnchors: THREE.Object3D[],
  fountainOrigin: THREE.Vector3,
  handlers: TownInteractionHandlers
): TownInteractionController {
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();

  // Subtle ink drop-target ring & vertical tether line shown only while dragging an NPC
  const markerGroup = new THREE.Group();
  markerGroup.visible = false;
  const ringGeo = new THREE.RingGeometry(1.1, 1.55, 24);
  ringGeo.rotateX(-Math.PI * 0.5);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(NEON_TOWN_PALETTE.inkPrimary),
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  const tetherGeo = new THREE.BufferGeometry();
  tetherGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 5.5, 0], 3));
  const tetherMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(NEON_TOWN_PALETTE.inkPrimary),
  });
  const tetherLine = new THREE.Line(tetherGeo, tetherMat);
  markerGroup.add(ringMesh, tetherLine);
  scene.add(markerGroup);

  // Invisible hit proxy sphere around the Central Fountain for crisp click detection
  const fountainHitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(15.5, 16.0, 26.0, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  fountainHitMesh.position.set(fountainOrigin.x, fountainOrigin.y + 13.0, fountainOrigin.z);
  scene.add(fountainHitMesh);

  let activeDrag: {
    kind: NpcKind;
    index: number;
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null = null;

  let clickStart: { x: number; y: number } | null = null;

  function setNdcFromEvent(e: PointerEvent) {
    const rect = domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
  }

  function raycastNpcs(): { kind: NpcKind; index: number; distance: number } | null {
    raycaster.setFromCamera(pointerNdc, camera);
    let best: { kind: NpcKind; index: number; distance: number } | null = null;
    for (const target of npcSystem.interactiveMeshes) {
      const hits = raycaster.intersectObject(target.mesh, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const hit = hits[0];
        if (!best || hit.distance < best.distance) {
          best = { kind: target.kind, index: hit.instanceId!, distance: hit.distance };
        }
      }
    }
    return best;
  }

  function raycastLandmarks(): { type: "fountain" } | { type: "windmill"; index: number } | null {
    raycaster.setFromCamera(pointerNdc, camera);
    const fHits = raycaster.intersectObject(fountainHitMesh, false);
    if (fHits.length > 0) return { type: "fountain" };

    for (let i = 0; i < windmillAnchors.length; i++) {
      const wHits = raycaster.intersectObject(windmillAnchors[i], true);
      if (wHits.length > 0) return { type: "windmill", index: i };
    }
    return null;
  }

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    setNdcFromEvent(e);
    clickStart = { x: e.clientX, y: e.clientY };

    const npcHit = raycastNpcs();
    if (npcHit) {
      const startPos = npcSystem.beginDrag(npcHit.kind, npcHit.index);
      if (startPos) {
        activeDrag = {
          kind: npcHit.kind,
          index: npcHit.index,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
        };
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), startPos);
        controls.enabled = false;
        domElement.style.cursor = "grabbing";
        try {
          domElement.setPointerCapture(e.pointerId);
        } catch {}
        markerGroup.visible = true;
        markerGroup.position.set(startPos.x, startPos.y + 0.15, startPos.z);
        playSoftClick(npcHit.kind === "person" ? 560 : 420);
      }
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    setNdcFromEvent(e);

    if (activeDrag) {
      const distPx = Math.hypot(e.clientX - activeDrag.startX, e.clientY - activeDrag.startY);
      if (distPx > 5) activeDrag.moved = true;

      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        const res = npcSystem.moveDrag(hitPoint.x, hitPoint.z);
        if (res) {
          markerGroup.position.set(res.x, res.groundY + 0.15, res.z);
          const posAttr = tetherGeo.getAttribute("position") as THREE.BufferAttribute;
          posAttr.setXYZ(1, 0, Math.max(0.5, res.y - res.groundY), 0);
          posAttr.needsUpdate = true;
        }
      }
      return;
    }

    // Hover cursor feedback (only when not orbiting)
    if (e.buttons === 0) {
      if (raycastNpcs()) {
        domElement.style.cursor = "grab";
      } else if (raycastLandmarks()) {
        domElement.style.cursor = "pointer";
      } else {
        domElement.style.cursor = "";
      }
    }
  };

  const finishDrag = () => {
    if (!activeDrag) return;
    const { kind, index, moved, pointerId } = activeDrag;
    try {
      domElement.releasePointerCapture(pointerId);
    } catch {}
    npcSystem.endDrag();
    if (!moved) {
      npcSystem.pokeNpc(kind, index);
      playWarmChime(kind === "person" ? 3 : 1);
    } else {
      playSoftClick(340);
    }
    markerGroup.visible = false;
    controls.enabled = true;
    domElement.style.cursor = "";
    activeDrag = null;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (activeDrag) {
      finishDrag();
      clickStart = null;
      return;
    }
    if (!clickStart || e.button !== 0) return;
    const deltaPx = Math.hypot(e.clientX - clickStart.x, e.clientY - clickStart.y);
    clickStart = null;
    if (deltaPx > 6) return; // Ignore orbit drags

    setNdcFromEvent(e);
    const landmark = raycastLandmarks();
    if (!landmark) return;

    if (landmark.type === "fountain") {
      handlers.onFountainClick();
      playWarmChime(4);
    } else if (landmark.type === "windmill") {
      handlers.onWindmillClick(landmark.index);
      playSoftClick(640);
    }
  };

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", finishDrag);

  return {
    dispose: () => {
      finishDrag();
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("pointercancel", finishDrag);
      scene.remove(markerGroup, fountainHitMesh);
      ringGeo.dispose();
      ringMat.dispose();
      tetherGeo.dispose();
      tetherMat.dispose();
      fountainHitMesh.geometry.dispose();
      (fountainHitMesh.material as THREE.Material).dispose();
    },
  };
}
