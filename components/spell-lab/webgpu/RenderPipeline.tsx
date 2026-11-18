"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RenderPipeline } from "three/webgpu";
import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

export default function PostProcessing() {
  const { scene, camera, gl } = useThree();
  const pipelineRef = useRef<any>(null);

  useEffect(() => {
    try {
      const pipeline: any = new RenderPipeline(gl as any);

      const scenePass = pass(scene, camera);
      const color = scenePass.getTextureNode("output");

      // 水体大面不洗白，法术点光仍溢出: 强度 2.5→0.7、半径 0.5→0.55、阈值 1.0→1.1 (水体大面积浅色 HDR 累加在阈值 1.0 下直接越阈被 Bloom 放大洗白; 法术为小面积高亮点，仍在 1.1 阈值上溢出)
      const bloomPass = bloom(color, 0.7, 0.55, 1.1);
      if (pipeline.outputNode !== undefined) {
        pipeline.outputNode = (color as any).add(bloomPass);
      } else if (typeof pipeline.setOutputNode === "function") {
        pipeline.setOutputNode((color as any).add(bloomPass));
      }

      pipelineRef.current = pipeline;
    } catch (e) {
      console.error("Failed to create RenderPipeline:", e);
    }

    return () => {
      if (pipelineRef.current) {
        try {
          pipelineRef.current.dispose();
        } catch (e) {
          // Ignore cleanup errors
        }
        pipelineRef.current = null;
      }
    };
  }, [scene, camera, gl]);

  useFrame(() => {
    if (pipelineRef.current) {
      try {
        pipelineRef.current.render();
      } catch (e) {
        console.error("RenderPipeline render error:", e);
      }
    }
  }, 1);

  return null;
}
