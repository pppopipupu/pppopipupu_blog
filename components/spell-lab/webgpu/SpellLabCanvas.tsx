"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, type GLProps } from "@react-three/fiber";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { init, type Gpu } from "vgpu";

export interface SpellLabCanvasProps {
  camera?: {
    position?: [number, number, number];
    fov?: number;
    far?: number;
  };
  shadows?: boolean;
  style?: React.CSSProperties;
  dpr?: number | [number, number];
  children: React.ReactNode;
}

export default function SpellLabCanvas({
  camera = { position: [0, 60, 80], fov: 50, far: 3000 },
  shadows = true,
  style = { width: "100%", height: "100%", cursor: "crosshair" },
  dpr,
  children,
}: SpellLabCanvasProps) {
  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null);
  const [gpu, setGpu] = useState<Gpu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gpuRef = useRef<Gpu | null>(null);
  const rendererRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const initGpu = useCallback(async () => {
    try {
      const gpuInstance = await init({ label: "spell-lab" });
      if (!mountedRef.current) {
        gpuInstance.dispose();
        return;
      }
      gpuRef.current = gpuInstance;
      setGpu(gpuInstance);

      if (gpuInstance.gpu) {
        gpuInstance.gpu.lost
          .then((info: GPUDeviceLostInfo) => {
            if (mountedRef.current) {
              setError(`WebGPU device lost: ${info.message}`);
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, []);

  const glFactory = useCallback(
    async (props: { canvas: HTMLCanvasElement | OffscreenCanvas }) => {
      if (!gpu) {
        throw new Error("WebGPU device is not initialized");
      }
      try {
        const canvas = props.canvas as HTMLCanvasElement;
        const renderer = new WebGPURenderer({
          canvas,
          device: gpu.gpu,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
        await renderer.init();
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        rendererRef.current = renderer;
        return renderer;
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : String(err));
        }
        throw err;
      }
    },
    [gpu]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (typeof navigator !== "undefined" && "gpu" in navigator) {
      setWebgpuSupported(true);
      initGpu();
    } else {
      setWebgpuSupported(false);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initGpu]);

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        try {
          rendererRef.current.dispose();
        } catch (e) {}
        rendererRef.current = null;
      }
      if (gpuRef.current) {
        try {
          gpuRef.current.dispose();
        } catch (e) {}
        gpuRef.current = null;
      }
    };
  }, []);

  if (webgpuSupported === false) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a0a2e",
          color: "#ff6b6b",
          fontSize: "18px",
          textAlign: "center",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        此法术实验室需要 WebGPU 支持。您的浏览器不支持 WebGPU 或未启用。
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a0a2e",
          color: "#ff6b6b",
          fontSize: "18px",
          textAlign: "center",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {error}
      </div>
    );
  }

  if (!gpu) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a0a2e",
          color: "#ffd54a",
          fontSize: "18px",
          textAlign: "center",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        正在初始化 WebGPU...
      </div>
    );
  }

  return (
    <Canvas
      camera={camera}
      shadows={shadows}
      style={style}
      dpr={dpr}
      gl={glFactory as unknown as GLProps}
    >
      {children}
    </Canvas>
  );
}
