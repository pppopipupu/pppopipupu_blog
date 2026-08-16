"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

export interface StrikePoint {
  x: number;
  y: number;
}

interface ThunderStrikeOverlayProps {
  active: boolean;
  strikePoints: StrikePoint[];
  onStrikePeak?: () => void;
  onComplete?: () => void;
}

export function ThunderStrikeOverlay({
  active,
  strikePoints,
  onStrikePeak,
  onComplete,
}: ThunderStrikeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [showCracks, setShowCracks] = useState(false);
  const [crackPoints, setCrackPoints] = useState<StrikePoint[]>([]);

  const startAnimation = useCallback(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    setFlashOpacity(0.95);
    setShowCracks(true);
    setCrackPoints(strikePoints.length > 0 ? strikePoints : [{ x: width / 2, y: height / 2 }]);

    const pageEl = document.body;
    let shakeFrame = 0;
    const maxShakeFrames = 25;
    const shakeInterval = setInterval(() => {
      shakeFrame++;
      if (shakeFrame > maxShakeFrames) {
        clearInterval(shakeInterval);
        pageEl.style.transform = "";
      } else {
        const decay = 1 - shakeFrame / maxShakeFrames;
        const dx = (Math.random() - 0.5) * 28 * decay;
        const dy = (Math.random() - 0.5) * 28 * decay;
        const rot = (Math.random() - 0.5) * 2.5 * decay;
        pageEl.style.transform = `translate3d(${dx}px, ${dy}px, 0px) rotate(${rot}deg)`;
      }
    }, 16);

    setTimeout(() => {
      onStrikePeak?.();
    }, 80);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, width, 0, height, -1000, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const dom = renderer.domElement;
    dom.style.position = "absolute";
    dom.style.inset = "0";
    dom.style.pointerEvents = "none";
    dom.style.zIndex = "9998";

    containerRef.current.appendChild(dom);

    const lightningGroup = new THREE.Group();
    scene.add(lightningGroup);

    function createLightningBranch(
      start: THREE.Vector3,
      end: THREE.Vector3,
      displacement: number,
      depth = 0
    ): THREE.Vector3[] {
      if (depth > 5 || displacement < 4) {
        return [start, end];
      }

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const normal = new THREE.Vector3(-(end.y - start.y), end.x - start.x, 0).normalize();
      const offset = (Math.random() - 0.5) * displacement;
      mid.addScaledVector(normal, offset);

      const left = createLightningBranch(start, mid, displacement * 0.55, depth + 1);
      const right = createLightningBranch(mid, end, displacement * 0.55, depth + 1);

      return left.slice(0, -1).concat(right);
    }

    function createRibbonGeometry(path: THREE.Vector3[], baseWidth: number) {
      const positions: number[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        const perp = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(baseWidth);

        positions.push(
          p1.x - perp.x, p1.y - perp.y, p1.z,
          p1.x + perp.x, p1.y + perp.y, p1.z,
          p2.x - perp.x, p2.y - perp.y, p2.z,
          p1.x + perp.x, p1.y + perp.y, p1.z,
          p2.x + perp.x, p2.y + perp.y, p2.z,
          p2.x - perp.x, p2.y - perp.y, p2.z
        );
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      return geom;
    }

    const targets = strikePoints.length > 0 ? strikePoints : [
      { x: width * 0.25, y: height * 0.6 },
      { x: width * 0.5, y: height * 0.4 },
      { x: width * 0.75, y: height * 0.7 }
    ];

    targets.forEach((pt) => {
      const startX = pt.x + (Math.random() - 0.5) * 300;
      const start = new THREE.Vector3(startX, -50, 0);
      const target = new THREE.Vector3(pt.x, pt.y, 0);

      const mainPath = createLightningBranch(start, target, 120, 0);
      
      const glowGeom = createRibbonGeometry(mainPath, 8.0);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      lightningGroup.add(new THREE.Mesh(glowGeom, glowMat));

      const coreGeom = createRibbonGeometry(mainPath, 2.5);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      lightningGroup.add(new THREE.Mesh(coreGeom, coreMat));

      for (let i = 2; i < mainPath.length - 2; i += 3) {
        if (Math.random() < 0.65) {
          const branchStart = mainPath[i];
          const branchAngle = (Math.random() - 0.5) * 1.6 + 0.3;
          const branchLen = 80 + Math.random() * 120;
          const branchEnd = new THREE.Vector3(
            branchStart.x + Math.sin(branchAngle) * branchLen,
            branchStart.y + Math.cos(branchAngle) * branchLen,
            0
          );
          const subPath = createLightningBranch(branchStart, branchEnd, 40, 2);
          const subGeom = createRibbonGeometry(subPath, 2.0);
          const subMat = new THREE.MeshBasicMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          lightningGroup.add(new THREE.Mesh(subGeom, subMat));
        }
      }
    });

    const sparkCount = targets.length * 80;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: { x: number; y: number; life: number; maxLife: number }[] = [];

    targets.forEach((pt, tIdx) => {
      for (let i = 0; i < 80; i++) {
        const idx = tIdx * 80 + i;
        sparkPositions[idx * 3] = pt.x;
        sparkPositions[idx * 3 + 1] = pt.y;
        sparkPositions[idx * 3 + 2] = 0;

        const angle = Math.random() * Math.PI * 2;
        const spd = 5 + Math.random() * 18;
        sparkVelocities.push({
          x: Math.cos(angle) * spd,
          y: Math.sin(angle) * spd - (Math.random() * 8),
          life: 0,
          maxLife: 30 + Math.random() * 30,
        });
      }
    });

    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x88ffff,
      size: 4.5,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMat);
    scene.add(sparkPoints);

    let animId: number;
    let elapsedFrames = 0;
    const totalFrames = 50;

    const animate = () => {
      elapsedFrames++;
      const progress = elapsedFrames / totalFrames;

      if (elapsedFrames < 18) {
        const flicker = Math.random() > 0.3 ? 1.0 : 0.2;
        lightningGroup.children.forEach((mesh) => {
          if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
            mesh.material.opacity = flicker * (1 - elapsedFrames / 20);
          }
        });
      } else {
        lightningGroup.children.forEach((mesh) => {
          if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
            mesh.material.opacity = Math.max(0, mesh.material.opacity - 0.08);
          }
        });
      }

      const posAttr = sparkGeom.getAttribute("position");
      for (let i = 0; i < sparkCount; i++) {
        const vel = sparkVelocities[i];
        vel.life++;
        vel.y += 0.4;
        vel.x *= 0.96;
        vel.y *= 0.96;

        const curX = posAttr.getX(i) + vel.x;
        const curY = posAttr.getY(i) + vel.y;
        posAttr.setXY(i, curX, curY);
      }
      posAttr.needsUpdate = true;
      sparkMat.opacity = Math.max(0, 1 - progress * 1.3);

      if (elapsedFrames <= 5) {
        setFlashOpacity(0.9);
      } else {
        setFlashOpacity((prev) => Math.max(0, prev - 0.08));
      }

      renderer.render(scene, camera);

      if (elapsedFrames < totalFrames) {
        animId = requestAnimationFrame(animate);
      } else {
        if (containerRef.current?.contains(dom)) {
          containerRef.current.removeChild(dom);
        }
        renderer.dispose();
        setFlashOpacity(0);
        setTimeout(() => setShowCracks(false), 800);
        onComplete?.();
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(shakeInterval);
      pageEl.style.transform = "";
      if (containerRef.current?.contains(dom)) {
        containerRef.current.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [strikePoints, onStrikePeak, onComplete]);

  useEffect(() => {
    if (active) {
      const cleanup = startAnimation();
      return cleanup;
    }
  }, [active, startAnimation]);

  if (!active && flashOpacity === 0 && !showCracks) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
        overflow: "hidden",
      }}
    >
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#e6ffff",
            opacity: flashOpacity,
            mixBlendMode: "screen",
            transition: "opacity 0.05s linear",
          }}
        />
      )}

      {showCracks && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: flashOpacity * 1.2 + 0.3,
            filter: "drop-shadow(0 0 6px #00ffff)",
          }}
        >
          {crackPoints.map((pt, pIdx) => {
            const crackLines: string[] = [];
            const numCracks = 12;
            for (let i = 0; i < numCracks; i++) {
              const angle = (i / numCracks) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
              const len = 120 + Math.random() * 220;
              const mid1X = pt.x + Math.cos(angle) * (len * 0.35) + (Math.random() - 0.5) * 30;
              const mid1Y = pt.y + Math.sin(angle) * (len * 0.35) + (Math.random() - 0.5) * 30;
              const mid2X = pt.x + Math.cos(angle) * (len * 0.7) + (Math.random() - 0.5) * 40;
              const mid2Y = pt.y + Math.sin(angle) * (len * 0.7) + (Math.random() - 0.5) * 40;
              const endX = pt.x + Math.cos(angle) * len;
              const endY = pt.y + Math.sin(angle) * len;
              crackLines.push(`M ${pt.x} ${pt.y} L ${mid1X} ${mid1Y} L ${mid2X} ${mid2Y} L ${endX} ${endY}`);
            }

            return (
              <g key={pIdx}>
                {crackLines.map((d, lIdx) => (
                  <path
                    key={lIdx}
                    d={d}
                    stroke="#ffffff"
                    strokeWidth={lIdx % 2 === 0 ? "2.5" : "1.2"}
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="35"
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="75"
                  fill="none"
                  stroke="#66e5ff"
                  strokeWidth="1.5"
                  strokeDasharray="10 8"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
