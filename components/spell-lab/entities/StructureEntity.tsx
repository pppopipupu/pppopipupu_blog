import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { StructureData, StructurePart, CraterType } from "../types";

export function generatePartsForStructure(type: string): StructurePart[] {
  const parts: StructurePart[] = [];
  if (type === "cabin") {
    parts.push(
      { id: "wall_f", localOffset: new THREE.Vector3(0, 1.25, 1.75), size: new THREE.Vector3(4, 2.5, 0.2), type: "box", color: "#8b5a2b" },
      { id: "wall_b", localOffset: new THREE.Vector3(0, 1.25, -1.75), size: new THREE.Vector3(4, 2.5, 0.2), type: "box", color: "#8b5a2b" },
      { id: "wall_l", localOffset: new THREE.Vector3(-2, 1.25, 0), size: new THREE.Vector3(0.2, 2.5, 3.7), type: "box", color: "#8b5a2b" },
      { id: "wall_r", localOffset: new THREE.Vector3(2, 1.25, 0), size: new THREE.Vector3(0.2, 2.5, 3.7), type: "box", color: "#8b5a2b" },
      { id: "roof_l", localOffset: new THREE.Vector3(-1.1, 2.9, 0), size: new THREE.Vector3(2.6, 0.25, 4.2), type: "box", color: "#d32f2f", rotation: new THREE.Euler(0, 0, 0.5) },
      { id: "roof_r", localOffset: new THREE.Vector3(1.1, 2.9, 0), size: new THREE.Vector3(2.6, 0.25, 4.2), type: "box", color: "#d32f2f", rotation: new THREE.Euler(0, 0, -0.5) },
      { id: "chimney", localOffset: new THREE.Vector3(1.2, 3.5, 1.0), size: new THREE.Vector3(0.6, 1.6, 0.6), type: "box", color: "#5d4037" },
      { id: "door", localOffset: new THREE.Vector3(0, 0.9, 1.8), size: new THREE.Vector3(1.0, 1.8, 0.15), type: "box", color: "#3e2723" },
      { id: "window_l", localOffset: new THREE.Vector3(-1.0, 1.4, 1.8), size: new THREE.Vector3(0.6, 0.6, 0.15), type: "box", color: "#ffe082" },
      { id: "window_r", localOffset: new THREE.Vector3(1.0, 1.4, 1.8), size: new THREE.Vector3(0.6, 0.6, 0.15), type: "box", color: "#ffe082" }
    );
  } else if (type === "windmill") {
    parts.push(
      { id: "base", localOffset: new THREE.Vector3(0, 1.25, 0), size: new THREE.Vector3(2.6, 2.5, 2.6), type: "box", color: "#795548" },
      { id: "balcony", localOffset: new THREE.Vector3(0, 2.6, 0), size: new THREE.Vector3(3.2, 0.2, 3.2), type: "cylinder", color: "#5d4037", segments: 12 },
      { id: "tower", localOffset: new THREE.Vector3(0, 4.8, 0), size: new THREE.Vector3(1.8, 4.2, 1.8), type: "cylinder", color: "#d7ccc8", segments: 12 },
      { id: "cap", localOffset: new THREE.Vector3(0, 7.15, 0), size: new THREE.Vector3(2.0, 0.6, 2.0), type: "sphere", color: "#5d4037", segments: 12, segmentsHeight: 8 },
      { id: "hub", localOffset: new THREE.Vector3(0, 7.15, 1.1), size: new THREE.Vector3(0.5, 0.5, 0.5), type: "sphere", color: "#3e2723", segments: 12, segmentsHeight: 8 },
      { id: "blade_1", localOffset: new THREE.Vector3(0, 9.35, 1.2), size: new THREE.Vector3(0.4, 4.4, 0.06), type: "box", color: "#ffffff" },
      { id: "blade_2", localOffset: new THREE.Vector3(0, 4.95, 1.2), size: new THREE.Vector3(0.4, 4.4, 0.06), type: "box", color: "#ffffff" },
      { id: "blade_3", localOffset: new THREE.Vector3(-2.2, 7.15, 1.2), size: new THREE.Vector3(4.4, 0.4, 0.06), type: "box", color: "#ffffff" },
      { id: "blade_4", localOffset: new THREE.Vector3(2.2, 7.15, 1.2), size: new THREE.Vector3(4.4, 0.4, 0.06), type: "box", color: "#ffffff" }
    );
  } else if (type === "mine") {
    parts.push(
      { id: "frame_l1", localOffset: new THREE.Vector3(-1.6, 1.5, -0.6), size: new THREE.Vector3(0.35, 3.0, 0.35), type: "box", color: "#5d4037" },
      { id: "frame_r1", localOffset: new THREE.Vector3(1.6, 1.5, -0.6), size: new THREE.Vector3(0.35, 3.0, 0.35), type: "box", color: "#5d4037" },
      { id: "frame_t1", localOffset: new THREE.Vector3(0, 3.1, -0.6), size: new THREE.Vector3(3.5, 0.35, 0.35), type: "box", color: "#5d4037" },
      { id: "frame_l2", localOffset: new THREE.Vector3(-1.6, 1.5, 0.6), size: new THREE.Vector3(0.35, 3.0, 0.35), type: "box", color: "#5d4037" },
      { id: "frame_r2", localOffset: new THREE.Vector3(1.6, 1.5, 0.6), size: new THREE.Vector3(0.35, 3.0, 0.35), type: "box", color: "#5d4037" },
      { id: "frame_t2", localOffset: new THREE.Vector3(0, 3.1, 0.6), size: new THREE.Vector3(3.5, 0.35, 0.35), type: "box", color: "#5d4037" },
      { id: "plank_1", localOffset: new THREE.Vector3(-0.8, 3.35, 0), size: new THREE.Vector3(1.6, 0.12, 1.8), type: "box", color: "#3e2723", rotation: new THREE.Euler(0.08, 0, 0.08) },
      { id: "plank_2", localOffset: new THREE.Vector3(0.8, 3.35, 0.2), size: new THREE.Vector3(1.6, 0.12, 1.8), type: "box", color: "#3e2723", rotation: new THREE.Euler(-0.08, 0, -0.08) },
      { id: "cart_body", localOffset: new THREE.Vector3(0, 0.6, 0), size: new THREE.Vector3(1.4, 0.8, 1.0), type: "box", color: "#78909c" },
      { id: "cart_wheel_fl", localOffset: new THREE.Vector3(-0.5, 0.2, 0.5), size: new THREE.Vector3(0.4, 0.15, 0.4), type: "cylinder", color: "#212121", rotation: new THREE.Euler(1.57, 0, 0), segments: 12 },
      { id: "cart_wheel_fr", localOffset: new THREE.Vector3(0.5, 0.2, 0.5), size: new THREE.Vector3(0.4, 0.15, 0.4), type: "cylinder", color: "#212121", rotation: new THREE.Euler(1.57, 0, 0), segments: 12 },
      { id: "cart_wheel_bl", localOffset: new THREE.Vector3(-0.5, 0.2, -0.5), size: new THREE.Vector3(0.4, 0.15, 0.4), type: "cylinder", color: "#212121", rotation: new THREE.Euler(1.57, 0, 0), segments: 12 },
      { id: "cart_wheel_br", localOffset: new THREE.Vector3(0.5, 0.2, -0.5), size: new THREE.Vector3(0.4, 0.15, 0.4), type: "cylinder", color: "#212121", rotation: new THREE.Euler(1.57, 0, 0), segments: 12 }
    );
  } else if (type === "tower") {
    parts.push(
      { id: "base", localOffset: new THREE.Vector3(0, 1.8, 0), size: new THREE.Vector3(2.8, 3.6, 2.8), type: "cylinder", color: "#78909c", segments: 16 },
      { id: "trim_ring", localOffset: new THREE.Vector3(0, 3.7, 0), size: new THREE.Vector3(3.2, 0.3, 3.2), type: "cylinder", color: "#546e7a", segments: 16 },
      { id: "mid", localOffset: new THREE.Vector3(0, 5.7, 0), size: new THREE.Vector3(2.2, 3.6, 2.2), type: "cylinder", color: "#90a4ae", segments: 16 },
      { id: "top_balcony", localOffset: new THREE.Vector3(0, 7.7, 0), size: new THREE.Vector3(2.8, 0.5, 2.8), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "spire_cap", localOffset: new THREE.Vector3(0, 9.4, 0), size: new THREE.Vector3(2.6, 3.0, 2.6), type: "cone", color: "#1565c0", segments: 16 },
      { id: "crystal_orb", localOffset: new THREE.Vector3(0, 11.2, 0), size: new THREE.Vector3(0.7, 0.7, 0.7), type: "sphere", color: "#00e5ff", segments: 12, segmentsHeight: 10 },
      { id: "door", localOffset: new THREE.Vector3(0, 0.9, 1.35), size: new THREE.Vector3(0.9, 1.6, 0.15), type: "box", color: "#5d4037" }
    );
  } else if (type === "well") {
    parts.push(
      { id: "stone_base", localOffset: new THREE.Vector3(0, 0.75, 0), size: new THREE.Vector3(2.2, 1.5, 2.2), type: "cylinder", color: "#90a4ae", segments: 16 },
      { id: "post_l", localOffset: new THREE.Vector3(-0.9, 2.25, 0), size: new THREE.Vector3(0.18, 3.0, 0.18), type: "box", color: "#795548" },
      { id: "post_r", localOffset: new THREE.Vector3(0.9, 2.25, 0), size: new THREE.Vector3(0.18, 3.0, 0.18), type: "box", color: "#795548" },
      { id: "spindle", localOffset: new THREE.Vector3(0, 2.9, 0), size: new THREE.Vector3(1.7, 0.15, 0.15), type: "cylinder", color: "#5d4037", rotation: new THREE.Euler(0, 0, 1.57), segments: 8 },
      { id: "roof_l", localOffset: new THREE.Vector3(-0.65, 3.9, 0), size: new THREE.Vector3(1.5, 0.12, 2.6), type: "box", color: "#8d6e63", rotation: new THREE.Euler(0, 0, 0.4) },
      { id: "roof_r", localOffset: new THREE.Vector3(0.65, 3.9, 0), size: new THREE.Vector3(1.5, 0.12, 2.6), type: "box", color: "#8d6e63", rotation: new THREE.Euler(0, 0, -0.4) },
      { id: "bucket", localOffset: new THREE.Vector3(0, 1.4, 0), size: new THREE.Vector3(0.5, 0.6, 0.5), type: "cylinder", color: "#3e2723", segments: 12 }
    );
  } else if (type === "obelisk") {
    parts.push(
      { id: "base", localOffset: new THREE.Vector3(0, 0.5, 0), size: new THREE.Vector3(2.4, 1.0, 2.4), type: "box", color: "#37474f" },
      { id: "col_1", localOffset: new THREE.Vector3(0, 2.25, 0), size: new THREE.Vector3(1.7, 2.5, 1.7), type: "box", color: "#455a64" },
      { id: "col_2", localOffset: new THREE.Vector3(0, 4.75, 0), size: new THREE.Vector3(1.2, 2.5, 1.2), type: "box", color: "#546e7a" },
      { id: "crystal", localOffset: new THREE.Vector3(0, 6.75, 0), size: new THREE.Vector3(0.9, 1.5, 0.9), type: "cone", color: "#00e5ff", segments: 12 },
      { id: "ring_1", localOffset: new THREE.Vector3(-1.3, 5.5, 0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#00e5ff", rotation: new THREE.Euler(0.5, 0.5, 0.5) },
      { id: "ring_2", localOffset: new THREE.Vector3(1.3, 5.5, 0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#00e5ff", rotation: new THREE.Euler(-0.5, -0.5, -0.5) }
    );
  } else if (type === "shrine") {
    parts.push(
      { id: "altar_base", localOffset: new THREE.Vector3(0, 0.4, 0), size: new THREE.Vector3(3.6, 0.8, 3.6), type: "cylinder", color: "#cfd8dc", segments: 16 },
      { id: "step_1", localOffset: new THREE.Vector3(0, 0.2, 2.0), size: new THREE.Vector3(1.6, 0.4, 0.8), type: "box", color: "#b0bec5" },
      { id: "slab", localOffset: new THREE.Vector3(0, 1.15, 0), size: new THREE.Vector3(2.0, 0.7, 2.0), type: "box", color: "#eceff1" },
      { id: "pil_1", localOffset: new THREE.Vector3(-1.3, 1.5, -1.3), size: new THREE.Vector3(0.45, 2.2, 0.45), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "pil_2", localOffset: new THREE.Vector3(1.3, 1.5, -1.3), size: new THREE.Vector3(0.45, 2.2, 0.45), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "pil_3", localOffset: new THREE.Vector3(-1.3, 1.5, 1.3), size: new THREE.Vector3(0.45, 2.2, 0.45), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "pil_4", localOffset: new THREE.Vector3(1.3, 1.5, 1.3), size: new THREE.Vector3(0.45, 2.2, 0.45), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "roof", localOffset: new THREE.Vector3(0, 2.8, 0), size: new THREE.Vector3(3.6, 0.6, 3.6), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "core", localOffset: new THREE.Vector3(0, 1.8, 0), size: new THREE.Vector3(0.9, 0.9, 0.9), type: "sphere", color: "#e040fb", segments: 16, segmentsHeight: 12 }
    );
  } else if (type === "ruins") {
    parts.push(
      { id: "wall_1", localOffset: new THREE.Vector3(-1.2, 1.5, 0), size: new THREE.Vector3(0.5, 3.0, 2.2), type: "box", color: "#78909c" },
      { id: "wall_2", localOffset: new THREE.Vector3(1.0, 1.0, -1.0), size: new THREE.Vector3(2.2, 2.0, 0.5), type: "box", color: "#78909c" },
      { id: "pillar_1", localOffset: new THREE.Vector3(-1.2, 1.5, 1.4), size: new THREE.Vector3(0.45, 3.0, 0.45), type: "cylinder", color: "#b0bec5", segments: 12 },
      { id: "pillar_tilt", localOffset: new THREE.Vector3(0.3, 1.7, 1.2), size: new THREE.Vector3(0.45, 3.6, 0.45), type: "cylinder", color: "#b0bec5", rotation: new THREE.Euler(0.45, 0, 0.45), segments: 12 },
      { id: "rubble_1", localOffset: new THREE.Vector3(-0.6, 0.4, 1.0), size: new THREE.Vector3(1.0, 0.8, 1.0), type: "sphere", color: "#90a4ae", segments: 8, segmentsHeight: 6 },
      { id: "rubble_2", localOffset: new THREE.Vector3(1.0, 0.3, 1.0), size: new THREE.Vector3(0.8, 0.5, 0.8), type: "sphere", color: "#90a4ae", segments: 8, segmentsHeight: 6 }
    );
  } else if (type === "campfire") {
    parts.push(
      { id: "stone_1", localOffset: new THREE.Vector3(-1.3, 0.25, 0), size: new THREE.Vector3(0.65, 0.5, 0.65), type: "sphere", color: "#757575", segments: 8, segmentsHeight: 6 },
      { id: "stone_2", localOffset: new THREE.Vector3(1.3, 0.25, 0), size: new THREE.Vector3(0.65, 0.5, 0.65), type: "sphere", color: "#757575", segments: 8, segmentsHeight: 6 },
      { id: "stone_3", localOffset: new THREE.Vector3(0, 0.25, -1.3), size: new THREE.Vector3(0.65, 0.5, 0.65), type: "sphere", color: "#757575", segments: 8, segmentsHeight: 6 },
      { id: "stone_4", localOffset: new THREE.Vector3(0, 0.25, 1.3), size: new THREE.Vector3(0.65, 0.5, 0.65), type: "sphere", color: "#757575", segments: 8, segmentsHeight: 6 },
      { id: "log_1", localOffset: new THREE.Vector3(-0.5, 0.4, -0.5), size: new THREE.Vector3(0.35, 1.5, 0.35), type: "cylinder", color: "#5d4037", rotation: new THREE.Euler(0.5, 0, 0.5), segments: 8 },
      { id: "log_2", localOffset: new THREE.Vector3(0.5, 0.4, 0.5), size: new THREE.Vector3(0.35, 1.5, 0.35), type: "cylinder", color: "#5d4037", rotation: new THREE.Euler(-0.5, 0, -0.5), segments: 8 },
      { id: "fire_inner", localOffset: new THREE.Vector3(0, 1.0, 0), size: new THREE.Vector3(0.6, 1.0, 0.6), type: "cone", color: "#ffb300", segments: 8 },
      { id: "fire_outer", localOffset: new THREE.Vector3(0, 1.3, 0), size: new THREE.Vector3(1.0, 1.6, 1.0), type: "cone", color: "#ff3c00", segments: 8 }
    );
  } else if (type === "box-pile") {
    parts.push(
      { id: "box_lg", localOffset: new THREE.Vector3(-0.7, 0.7, 0), size: new THREE.Vector3(1.4, 1.4, 1.4), type: "box", color: "#8d6e63" },
      { id: "box_sm", localOffset: new THREE.Vector3(0.6, 0.5, 0.6), size: new THREE.Vector3(1.0, 1.0, 1.0), type: "box", color: "#a1887f", rotation: new THREE.Euler(0, 0.5, 0) },
      { id: "box_xs", localOffset: new THREE.Vector3(-0.5, 1.8, 0.2), size: new THREE.Vector3(0.8, 0.8, 0.8), type: "box", color: "#bcaaa4" },
      { id: "barrel_1", localOffset: new THREE.Vector3(0.7, 0.7, -0.7), size: new THREE.Vector3(0.9, 1.4, 0.9), type: "cylinder", color: "#6d4c41", segments: 12 },
      { id: "barrel_2", localOffset: new THREE.Vector3(-0.5, 1.9, -0.5), size: new THREE.Vector3(0.8, 1.2, 0.8), type: "cylinder", color: "#6d4c41", rotation: new THREE.Euler(0, 0, 1.57), segments: 12 }
    );
  } else if (type === "angry-cathedral") {
    parts.push(
      { id: "foundation", localOffset: new THREE.Vector3(0, 0.3, 0), size: new THREE.Vector3(5.5, 0.6, 7.5), type: "box", color: "#424242" },
      { id: "step_1", localOffset: new THREE.Vector3(0, 0.45, 3.85), size: new THREE.Vector3(2.4, 0.3, 0.6), type: "box", color: "#37474f" },
      { id: "step_2", localOffset: new THREE.Vector3(0, 0.55, 3.35), size: new THREE.Vector3(2.0, 0.3, 0.6), type: "box", color: "#37474f" },
      { id: "main_hall", localOffset: new THREE.Vector3(0, 2.1, -0.5), size: new THREE.Vector3(4.0, 3.6, 6.0), type: "box", color: "#616161" },
      { id: "transept_hall", localOffset: new THREE.Vector3(0, 2.1, -1.5), size: new THREE.Vector3(6.0, 3.6, 2.0), type: "box", color: "#616161" },
      { id: "roof_hall", localOffset: new THREE.Vector3(0, 3.95, -0.5), size: new THREE.Vector3(4.4, 0.3, 6.4), type: "box", color: "#c62828" },
      { id: "roof_hall_l", localOffset: new THREE.Vector3(-1.1, 4.5, -0.5), size: new THREE.Vector3(2.5, 0.25, 6.4), type: "box", color: "#c62828", rotation: new THREE.Euler(0, 0, 0.4) },
      { id: "roof_hall_r", localOffset: new THREE.Vector3(1.1, 4.5, -0.5), size: new THREE.Vector3(2.5, 0.25, 6.4), type: "box", color: "#c62828", rotation: new THREE.Euler(0, 0, -0.4) },
      { id: "transept_roof", localOffset: new THREE.Vector3(0, 3.95, -1.5), size: new THREE.Vector3(6.4, 0.3, 2.4), type: "box", color: "#c62828" },
      { id: "buttress_l1", localOffset: new THREE.Vector3(-2.2, 1.5, -3.0), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "buttress_l2", localOffset: new THREE.Vector3(-2.2, 1.5, -0.5), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "buttress_l3", localOffset: new THREE.Vector3(-2.2, 1.5, 2.0), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "buttress_r1", localOffset: new THREE.Vector3(2.2, 1.5, -3.0), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "buttress_r2", localOffset: new THREE.Vector3(2.2, 1.5, -0.5), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "buttress_r3", localOffset: new THREE.Vector3(2.2, 1.5, 2.0), size: new THREE.Vector3(0.4, 3.0, 0.4), type: "box", color: "#424242" },
      { id: "arch_span_l1", localOffset: new THREE.Vector3(-2.1, 2.8, -3.0), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, -0.5) },
      { id: "arch_span_l2", localOffset: new THREE.Vector3(-2.1, 2.8, -0.5), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, -0.5) },
      { id: "arch_span_l3", localOffset: new THREE.Vector3(-2.1, 2.8, 2.0), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, -0.5) },
      { id: "arch_span_r1", localOffset: new THREE.Vector3(2.1, 2.8, -3.0), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, 0.5) },
      { id: "arch_span_r2", localOffset: new THREE.Vector3(2.1, 2.8, -0.5), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, 0.5) },
      { id: "arch_span_r3", localOffset: new THREE.Vector3(2.1, 2.8, 2.0), size: new THREE.Vector3(0.8, 0.25, 0.3), type: "box", color: "#616161", rotation: new THREE.Euler(0, 0, 0.5) },
      { id: "stained_glass_l1", localOffset: new THREE.Vector3(-2.02, 2.2, -2.0), size: new THREE.Vector3(0.1, 1.6, 0.6), type: "box", color: "#ffeb3b" },
      { id: "stained_glass_l2", localOffset: new THREE.Vector3(-2.02, 2.2, 0.5), size: new THREE.Vector3(0.1, 1.6, 0.6), type: "box", color: "#ff9800" },
      { id: "stained_glass_r1", localOffset: new THREE.Vector3(2.02, 2.2, -2.0), size: new THREE.Vector3(0.1, 1.6, 0.6), type: "box", color: "#ffeb3b" },
      { id: "stained_glass_r2", localOffset: new THREE.Vector3(2.02, 2.2, 0.5), size: new THREE.Vector3(0.1, 1.6, 0.6), type: "box", color: "#ff9800" },
      { id: "spire_left", localOffset: new THREE.Vector3(-1.8, 3.0, 2.8), size: new THREE.Vector3(1.2, 6.0, 1.2), type: "cylinder", color: "#424242", segments: 12 },
      { id: "spire_right", localOffset: new THREE.Vector3(1.8, 3.0, 2.8), size: new THREE.Vector3(1.2, 6.0, 1.2), type: "cylinder", color: "#424242", segments: 12 },
      { id: "spire_cap_l", localOffset: new THREE.Vector3(-1.8, 7.4, 2.8), size: new THREE.Vector3(1.4, 2.8, 1.4), type: "cone", color: "#b71c1c", segments: 12 },
      { id: "spire_cap_r", localOffset: new THREE.Vector3(1.8, 7.4, 2.8), size: new THREE.Vector3(1.4, 2.8, 1.4), type: "cone", color: "#b71c1c", segments: 12 },
      { id: "pinnacle_l1", localOffset: new THREE.Vector3(-2.2, 6.0, 3.2), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_l2", localOffset: new THREE.Vector3(-1.4, 6.0, 3.2), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_l3", localOffset: new THREE.Vector3(-2.2, 6.0, 2.4), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_l4", localOffset: new THREE.Vector3(-1.4, 6.0, 2.4), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_r1", localOffset: new THREE.Vector3(2.2, 6.0, 3.2), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_r2", localOffset: new THREE.Vector3(1.4, 6.0, 3.2), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_r3", localOffset: new THREE.Vector3(2.2, 6.0, 2.4), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "pinnacle_r4", localOffset: new THREE.Vector3(1.4, 6.0, 2.4), size: new THREE.Vector3(0.2, 0.8, 0.2), type: "cone", color: "#b71c1c" },
      { id: "cross_shaft", localOffset: new THREE.Vector3(0, 6.5, 2.8), size: new THREE.Vector3(0.2, 1.8, 0.2), type: "box", color: "#ffeb3b" },
      { id: "cross_bar", localOffset: new THREE.Vector3(0, 6.9, 2.8), size: new THREE.Vector3(1.2, 0.2, 0.2), type: "box", color: "#ffeb3b" },
      { id: "gate_pillar_l", localOffset: new THREE.Vector3(-1.0, 1.1, 2.7), size: new THREE.Vector3(0.2, 2.2, 0.2), type: "cylinder", color: "#424242" },
      { id: "gate_pillar_r", localOffset: new THREE.Vector3(1.0, 1.1, 2.7), size: new THREE.Vector3(0.2, 2.2, 0.2), type: "cylinder", color: "#424242" },
      { id: "gate_arch_top", localOffset: new THREE.Vector3(0, 2.3, 2.7), size: new THREE.Vector3(2.2, 0.2, 0.2), type: "box", color: "#424242" },
      { id: "gate_entrance", localOffset: new THREE.Vector3(0, 1.1, 2.6), size: new THREE.Vector3(1.6, 2.2, 0.2), type: "box", color: "#212121" },
      { id: "angry_god_icon", localOffset: new THREE.Vector3(0, 3.5, 2.55), size: new THREE.Vector3(2.0, 2.0, 0.1), type: "box", color: "#ffffff", texture: "angry" }
    );
  } else if (type === "wizard-academy") {
    parts.push(
      { id: "island_base", localOffset: new THREE.Vector3(0, -0.5, 0), size: new THREE.Vector3(5.0, 2.2, 5.0), type: "cone", color: "#4e342e", rotation: new THREE.Euler(Math.PI, 0, 0), segments: 12 },
      { id: "under_chain1", localOffset: new THREE.Vector3(-1.5, -2.0, -1.5), size: new THREE.Vector3(0.2, 2.0, 0.2), type: "cylinder", color: "#78909c" },
      { id: "under_chain2", localOffset: new THREE.Vector3(1.5, -2.0, -1.5), size: new THREE.Vector3(0.2, 2.0, 0.2), type: "cylinder", color: "#78909c" },
      { id: "under_chain3", localOffset: new THREE.Vector3(-1.5, -2.0, 1.5), size: new THREE.Vector3(0.2, 2.0, 0.2), type: "cylinder", color: "#78909c" },
      { id: "under_chain4", localOffset: new THREE.Vector3(1.5, -2.0, 1.5), size: new THREE.Vector3(0.2, 2.0, 0.2), type: "cylinder", color: "#78909c" },
      { id: "ground_grass", localOffset: new THREE.Vector3(0, 0.6, 0), size: new THREE.Vector3(5.2, 0.3, 5.2), type: "cylinder", color: "#2e7d32", segments: 16 },
      { id: "step_outer", localOffset: new THREE.Vector3(0, 0.65, 0), size: new THREE.Vector3(4.8, 0.2, 4.8), type: "cylinder", color: "#90a4ae", segments: 16 },
      { id: "step_inner", localOffset: new THREE.Vector3(0, 0.85, 0), size: new THREE.Vector3(4.4, 0.2, 4.4), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "temple_base", localOffset: new THREE.Vector3(0, 1.05, 0), size: new THREE.Vector3(3.6, 0.6, 3.6), type: "cylinder", color: "#cfd8dc", segments: 16 },
      { id: "pillar_1", localOffset: new THREE.Vector3(-1.4, 2.25, 0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_2", localOffset: new THREE.Vector3(1.4, 2.25, 0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_3", localOffset: new THREE.Vector3(0, 2.25, -1.4), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_4", localOffset: new THREE.Vector3(0, 2.25, 1.4), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_5", localOffset: new THREE.Vector3(-1.0, 2.25, -1.0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_6", localOffset: new THREE.Vector3(1.0, 2.25, -1.0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_7", localOffset: new THREE.Vector3(-1.0, 2.25, 1.0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "pillar_8", localOffset: new THREE.Vector3(1.0, 2.25, 1.0), size: new THREE.Vector3(0.3, 2.4, 0.3), type: "cylinder", color: "#cfd8dc", segments: 8 },
      { id: "architrave", localOffset: new THREE.Vector3(0, 3.45, 0), size: new THREE.Vector3(3.6, 0.4, 3.6), type: "cylinder", color: "#b0bec5", segments: 16 },
      { id: "roof_cone", localOffset: new THREE.Vector3(0, 4.45, 0), size: new THREE.Vector3(3.8, 2.0, 3.8), type: "cone", color: "#283593", segments: 16 },
      { id: "tele_base", localOffset: new THREE.Vector3(0, 5.5, 0), size: new THREE.Vector3(0.6, 0.6, 0.6), type: "cylinder", color: "#ffb74d" },
      { id: "tele_shaft", localOffset: new THREE.Vector3(0.3, 6.2, 0.3), size: new THREE.Vector3(0.25, 1.6, 0.25), type: "cylinder", color: "#ffd54f", rotation: new THREE.Euler(0.6, 0, 0.6) },
      { id: "tele_lens", localOffset: new THREE.Vector3(0.7, 6.9, 0.7), size: new THREE.Vector3(0.4, 0.3, 0.4), type: "cylinder", color: "#00e5ff", rotation: new THREE.Euler(0.6, 0, 0.6) },
      { id: "brazier_chain", localOffset: new THREE.Vector3(0, 3.2, 0), size: new THREE.Vector3(0.05, 0.8, 0.05), type: "cylinder", color: "#ffd54f" },
      { id: "brazier_cup", localOffset: new THREE.Vector3(0, 2.7, 0), size: new THREE.Vector3(0.5, 0.2, 0.5), type: "cylinder", color: "#ffb74d" },
      { id: "float_step_1", localOffset: new THREE.Vector3(0, 0.2, 3.3), size: new THREE.Vector3(0.8, 0.15, 0.5), type: "box", color: "#b0bec5", rotation: new THREE.Euler(0.1, 0, 0) },
      { id: "float_step_2", localOffset: new THREE.Vector3(0.2, 0.0, 4.1), size: new THREE.Vector3(0.7, 0.15, 0.5), type: "box", color: "#90a4ae", rotation: new THREE.Euler(-0.1, 0.2, 0) },
      { id: "float_step_3", localOffset: new THREE.Vector3(-0.1, -0.2, 4.9), size: new THREE.Vector3(0.8, 0.15, 0.5), type: "box", color: "#78909c", rotation: new THREE.Euler(0, -0.2, -0.1) },
      { id: "rune_core", localOffset: new THREE.Vector3(0, 2.0, 0), size: new THREE.Vector3(1.0, 1.0, 1.0), type: "sphere", color: "#00e5ff", segments: 12, segmentsHeight: 8 },
      { id: "floating_rune_1", localOffset: new THREE.Vector3(-2.0, 2.0, 0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#e040fb", rotation: new THREE.Euler(0.4, 0.4, 0.4) },
      { id: "floating_rune_2", localOffset: new THREE.Vector3(2.0, 2.0, 0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#e040fb", rotation: new THREE.Euler(-0.4, -0.4, -0.4) },
      { id: "floating_rune_3", localOffset: new THREE.Vector3(0, 2.0, -2.0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#e040fb", rotation: new THREE.Euler(0.4, -0.4, 0.4) },
      { id: "floating_rune_4", localOffset: new THREE.Vector3(0, 2.0, 2.0), size: new THREE.Vector3(0.4, 0.4, 0.4), type: "box", color: "#e040fb", rotation: new THREE.Euler(-0.4, 0.4, -0.4) }
    );
  } else if (type === "ancient-portal") {
    parts.push(
      { id: "gate_base", localOffset: new THREE.Vector3(0, 0.3, 0), size: new THREE.Vector3(6.0, 0.6, 2.0), type: "box", color: "#37474f" },
      { id: "step_1", localOffset: new THREE.Vector3(0, 0.4, 1.4), size: new THREE.Vector3(4.0, 0.2, 0.8), type: "box", color: "#263238" },
      { id: "step_2", localOffset: new THREE.Vector3(0, 0.5, 1.1), size: new THREE.Vector3(3.6, 0.2, 0.8), type: "box", color: "#263238" },
      { id: "pillar_left", localOffset: new THREE.Vector3(-2.2, 3.35, 0), size: new THREE.Vector3(1.2, 5.5, 1.2), type: "box", color: "#455a64" },
      { id: "pillar_right", localOffset: new THREE.Vector3(2.2, 3.35, 0), size: new THREE.Vector3(1.2, 5.5, 1.2), type: "box", color: "#455a64" },
      { id: "pillar_l_inner", localOffset: new THREE.Vector3(-1.6, 3.35, -0.1), size: new THREE.Vector3(0.6, 5.5, 0.8), type: "box", color: "#37474f" },
      { id: "pillar_r_inner", localOffset: new THREE.Vector3(1.6, 3.35, -0.1), size: new THREE.Vector3(0.6, 5.5, 0.8), type: "box", color: "#37474f" },
      { id: "arch_top", localOffset: new THREE.Vector3(0, 6.7, 0), size: new THREE.Vector3(5.6, 1.2, 1.2), type: "box", color: "#37474f" },
      { id: "arch_top_inner", localOffset: new THREE.Vector3(0, 6.1, -0.1), size: new THREE.Vector3(3.8, 0.6, 0.8), type: "box", color: "#263238" },
      { id: "chevron_l1", localOffset: new THREE.Vector3(-2.3, 1.5, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "chevron_l2", localOffset: new THREE.Vector3(-2.3, 3.3, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "chevron_l3", localOffset: new THREE.Vector3(-2.3, 5.1, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "chevron_r1", localOffset: new THREE.Vector3(2.3, 1.5, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "chevron_r2", localOffset: new THREE.Vector3(2.3, 3.3, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "chevron_r3", localOffset: new THREE.Vector3(2.3, 5.1, 0.6), size: new THREE.Vector3(0.3, 0.4, 0.3), type: "box", color: "#ff3d00" },
      { id: "obelisk_base_l", localOffset: new THREE.Vector3(-3.8, 0.8, 0), size: new THREE.Vector3(0.8, 1.6, 0.8), type: "box", color: "#455a64" },
      { id: "obelisk_tip_l", localOffset: new THREE.Vector3(-3.8, 2.1, 0), size: new THREE.Vector3(0.6, 1.0, 0.6), type: "cone", color: "#ffd54f" },
      { id: "obelisk_base_r", localOffset: new THREE.Vector3(3.8, 0.8, 0), size: new THREE.Vector3(0.8, 1.6, 0.8), type: "box", color: "#455a64" },
      { id: "obelisk_tip_r", localOffset: new THREE.Vector3(3.8, 2.1, 0), size: new THREE.Vector3(0.6, 1.0, 0.6), type: "cone", color: "#ffd54f" },
      { id: "cooling_fin_1", localOffset: new THREE.Vector3(-1.5, 7.6, 0), size: new THREE.Vector3(0.2, 0.8, 1.0), type: "box", color: "#263238" },
      { id: "cooling_fin_2", localOffset: new THREE.Vector3(-0.5, 7.6, 0), size: new THREE.Vector3(0.2, 0.8, 1.0), type: "box", color: "#263238" },
      { id: "cooling_fin_3", localOffset: new THREE.Vector3(0.5, 7.6, 0), size: new THREE.Vector3(0.2, 0.8, 1.0), type: "box", color: "#263238" },
      { id: "cooling_fin_4", localOffset: new THREE.Vector3(1.5, 7.6, 0), size: new THREE.Vector3(0.2, 0.8, 1.0), type: "box", color: "#263238" },
      { id: "flare_1", localOffset: new THREE.Vector3(-1.0, 3.35, 0.2), size: new THREE.Vector3(0.3, 0.3, 0.3), type: "sphere", color: "#00e5ff" },
      { id: "flare_2", localOffset: new THREE.Vector3(1.0, 3.35, 0.2), size: new THREE.Vector3(0.3, 0.3, 0.3), type: "sphere", color: "#00e5ff" },
      { id: "portal_shield_l", localOffset: new THREE.Vector3(-1.4, 5.0, 0.6), size: new THREE.Vector3(0.4, 1.6, 0.4), type: "box", color: "#ffb74d", rotation: new THREE.Euler(0.5, 0.5, 0.5) },
      { id: "portal_shield_r", localOffset: new THREE.Vector3(1.4, 5.0, 0.6), size: new THREE.Vector3(0.4, 1.6, 0.4), type: "box", color: "#ffb74d", rotation: new THREE.Euler(-0.5, -0.5, -0.5) },
      { id: "portal_energy_core", localOffset: new THREE.Vector3(0, 3.35, 0), size: new THREE.Vector3(3.0, 4.2, 0.2), type: "sphere", color: "#00e5ff", segments: 16, segmentsHeight: 12 },
      { id: "portal_crystal", localOffset: new THREE.Vector3(0, 8.2, 0), size: new THREE.Vector3(0.8, 1.4, 0.8), type: "cone", color: "#e040fb", segments: 8 }
    );
  } else if (type === "angry-mirror") {
    parts.push(
      { id: "mirror_pedestal", localOffset: new THREE.Vector3(0, 0.4, 0), size: new THREE.Vector3(4.5, 0.8, 4.5), type: "box", color: "#263238" },
      { id: "mirror_step", localOffset: new THREE.Vector3(0, 0.9, 0), size: new THREE.Vector3(3.2, 0.4, 3.2), type: "box", color: "#37474f" },
      { id: "pillar_l", localOffset: new THREE.Vector3(-1.8, 3.2, 0), size: new THREE.Vector3(0.6, 4.2, 0.6), type: "box", color: "#455a64" },
      { id: "pillar_r", localOffset: new THREE.Vector3(1.8, 3.2, 0), size: new THREE.Vector3(0.6, 4.2, 0.6), type: "box", color: "#455a64" },
      { id: "frame_top", localOffset: new THREE.Vector3(0, 5.4, 0), size: new THREE.Vector3(4.2, 0.6, 0.6), type: "box", color: "#37474f" },
      { id: "mirror_surface", localOffset: new THREE.Vector3(0, 3.2, 0), size: new THREE.Vector3(3.0, 3.8, 0.2), type: "box", color: "#00e5ff" },
      { id: "angry_god_icon", localOffset: new THREE.Vector3(0, 6.2, 0), size: new THREE.Vector3(1.6, 1.6, 0.15), type: "box", color: "#ffffff", texture: "angry" },
      { id: "orb_l", localOffset: new THREE.Vector3(-1.8, 5.6, 0), size: new THREE.Vector3(0.6, 0.6, 0.6), type: "sphere", color: "#e040fb" },
      { id: "orb_r", localOffset: new THREE.Vector3(1.8, 5.6, 0), size: new THREE.Vector3(0.6, 0.6, 0.6), type: "sphere", color: "#e040fb" }
    );
  }
  return parts;
}

export const StructureEntity = React.memo(function StructureEntity({
  data,
  craters = [],
  spawnDebris
}: {
  data: StructureData;
  craters?: CraterType[];
  spawnDebris: (pos: THREE.Vector3, color: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const windmillBladesRef = useRef<THREE.Group>(null);
  const academyRunesRef = useRef<THREE.Group>(null);
  const portalGroupRef = useRef<THREE.Group>(null);
  const mirrorGroupRef = useRef<THREE.Group>(null);
  const destroyedPartsRef = useRef<Record<string, boolean>>({});

  const wobbleX = useRef(0);
  const wobbleZ = useRef(0);
  const wobbleVx = useRef(0);
  const wobbleVz = useRef(0);

  const squashY = useRef(1.0);
  const squashVy = useRef(0);

  const lastY = useRef(data.pos.y);
  const lastVy = useRef(0);

  const hitFlashTimer = useRef(0);
  const lastDestroyedCount = useRef(0);
  const lastCraterCount = useRef(craters.length);

  const timeOffset = useMemo(() => Math.random() * 100, []);

  const angryTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/face_angry.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const partStatuses = useMemo(() => {
    const statuses: Record<string, { isDestroyed: boolean; worldPos: THREE.Vector3 }> = {};
    data.parts.forEach((part) => {
      const rotatedOffset = part.localOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), data.rotation);
      const worldPos = data.pos.clone().add(rotatedOffset.multiplyScalar(data.scale));
      let isDestroyed = false;
      for (const c of craters) {
        const dx = worldPos.x - c.x;
        const dz = worldPos.z - c.z;
        if (dx * dx + dz * dz < c.r * c.r) {
          isDestroyed = true;
          break;
        }
      }
      statuses[part.id] = { isDestroyed, worldPos };
    });
    return statuses;
  }, [data.parts, data.pos, data.rotation, data.scale, craters]);

  useEffect(() => {
    Object.keys(partStatuses).forEach((id) => {
      const status = partStatuses[id];
      if (status.isDestroyed && !destroyedPartsRef.current[id]) {
        destroyedPartsRef.current[id] = true;
        const part = data.parts.find((p) => p.id === id);
        if (part) {
          spawnDebris(status.worldPos, part.color);
        }
      }
    });

    const currentDestroyedCount = Object.values(partStatuses).filter(v => v.isDestroyed).length;
    if (currentDestroyedCount > lastDestroyedCount.current) {
      hitFlashTimer.current = 0.25;
      wobbleVx.current += (Math.random() - 0.5) * 15;
      wobbleVz.current += (Math.random() - 0.5) * 15;
      lastDestroyedCount.current = currentDestroyedCount;
    }
  }, [partStatuses, data.parts, spawnDebris]);

  useFrame((state, delta) => {
    if (craters.length < lastCraterCount.current) {
      lastCraterCount.current = craters.length;
    }
    if (craters.length > lastCraterCount.current) {
      const newCraters = craters.slice(lastCraterCount.current);
      newCraters.forEach((crater) => {
        const dx = data.pos.x - crater.x;
        const dz = data.pos.z - crater.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const maxRange = crater.r * 2.5;
        if (dist < maxRange) {
          const forceIntensity = (1 - dist / maxRange) * 2.2;
          const angle = Math.atan2(dx, dz);
          wobbleVx.current += Math.sin(angle) * forceIntensity * 20;
          wobbleVz.current += Math.cos(angle) * forceIntensity * 20;
        }
      });
      lastCraterCount.current = craters.length;
    }

    const currentY = data.pos.y;
    const computedVy = delta > 0 ? (currentY - lastY.current) / delta : 0;
    if (lastVy.current < -1.0 && Math.abs(computedVy) < 0.1) {
      squashVy.current = lastVy.current * 0.15;
    }
    lastY.current = currentY;
    lastVy.current = computedVy;

    const kTilt = 180;
    const cTilt = 10;
    const ax = -kTilt * wobbleX.current - cTilt * wobbleVx.current;
    const az = -kTilt * wobbleZ.current - cTilt * wobbleVz.current;
    wobbleVx.current += ax * delta;
    wobbleVz.current += az * delta;
    wobbleX.current += wobbleVx.current * delta;
    wobbleZ.current += wobbleVz.current * delta;
    wobbleX.current = THREE.MathUtils.clamp(wobbleX.current, -0.6, 0.6);
    wobbleZ.current = THREE.MathUtils.clamp(wobbleZ.current, -0.6, 0.6);

    const kSquash = 120;
    const cSquash = 6;
    const aSquash = -kSquash * (squashY.current - 1.0) - cSquash * squashVy.current;
    squashVy.current += aSquash * delta;
    squashY.current += squashVy.current * delta;
    squashY.current = THREE.MathUtils.clamp(squashY.current, 0.4, 1.6);

    if (hitFlashTimer.current > 0) {
      hitFlashTimer.current -= delta;
    }

    if (ref.current) {
      const swayAngle = state.clock.elapsedTime * 1.5 + timeOffset;
      const swayX = Math.sin(swayAngle) * 0.012;
      const swayZ = Math.cos(swayAngle * 0.8) * 0.012;

      ref.current.position.copy(data.pos);
      ref.current.rotation.x = wobbleX.current + swayX;
      ref.current.rotation.y = data.rotation;
      ref.current.rotation.z = wobbleZ.current + swayZ;

      ref.current.scale.set(
        data.scale / Math.sqrt(squashY.current),
        data.scale * squashY.current,
        data.scale / Math.sqrt(squashY.current)
      );
    }

    if (windmillBladesRef.current) {
      windmillBladesRef.current.rotation.z = state.clock.elapsedTime * 1.5;
    }
    if (academyRunesRef.current) {
      academyRunesRef.current.rotation.y = state.clock.elapsedTime * 1.0;
      academyRunesRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.0) * 0.15;
    }
    if (portalGroupRef.current) {
      const crystalMesh = portalGroupRef.current.getObjectByName("portal_crystal");
      if (crystalMesh) {
        crystalMesh.position.y = 8.2 + Math.sin(state.clock.elapsedTime * 2.0) * 0.25;
        crystalMesh.rotation.y = state.clock.elapsedTime * 0.8;
      }
      const coreMesh = portalGroupRef.current.getObjectByName("portal_energy_core");
      if (coreMesh) {
        const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 4.0) * 0.04;
        coreMesh.scale.set(pulse, pulse, 1.0);
      }
    }
    if (mirrorGroupRef.current) {
      const surfaceMesh = mirrorGroupRef.current.getObjectByName("mirror_surface");
      if (surfaceMesh) {
        const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 3.0) * 0.05;
        surfaceMesh.scale.set(pulse, pulse, 1.0);
      }
      const orbL = mirrorGroupRef.current.getObjectByName("orb_l");
      const orbR = mirrorGroupRef.current.getObjectByName("orb_r");
      if (orbL) {
        orbL.position.y = 5.6 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
      }
      if (orbR) {
        orbR.position.y = 5.6 + Math.sin(state.clock.elapsedTime * 2.5 + Math.PI) * 0.15;
      }
    }
  });

  const renderGeometry = (part: StructurePart) => {
    if (part.type === "box") {
      return <boxGeometry args={[part.size.x, part.size.y, part.size.z]} />;
    } else if (part.type === "cylinder") {
      return <cylinderGeometry args={[part.size.x * 0.5, part.size.x * 0.5, part.size.y, part.segments ?? 8]} />;
    } else if (part.type === "cone") {
      return <coneGeometry args={[part.size.x * 0.5, part.size.y, part.segments ?? 8]} />;
    } else if (part.type === "sphere") {
      return <sphereGeometry args={[part.size.x * 0.5, part.segments ?? 12, part.segmentsHeight ?? 10]} />;
    }
    return null;
  };

  const renderPartMesh = (part: StructurePart) => {
    const status = partStatuses[part.id];
    if (status?.isDestroyed) return null;

    const rotationVal = part.rotation ?? new THREE.Euler();
    const flash = hitFlashTimer.current > 0;

    return (
      <mesh
        key={part.id}
        name={part.id}
        position={part.localOffset}
        rotation={rotationVal}
        castShadow
        receiveShadow
      >
        {renderGeometry(part)}
        {part.texture === "angry" && angryTexture ? (
          <meshStandardMaterial 
            map={angryTexture}
            emissive={flash ? "#ffffff" : "#000000"} 
            emissiveIntensity={flash ? 0.8 : 0} 
            flatShading 
            roughness={0.8} 
          />
        ) : (
          <meshStandardMaterial 
            color={flash ? "#ffffff" : part.color} 
            emissive={flash ? "#ffffff" : "#000000"} 
            emissiveIntensity={flash ? 0.8 : 0} 
            flatShading 
            roughness={0.8} 
          />
        )}
      </mesh>
    );
  };

  const isWindmill = data.type === "windmill";
  const isAcademy = data.type === "wizard-academy";
  const isPortal = data.type === "ancient-portal";
  const isMirror = data.type === "angry-mirror";

  const staticParts = data.parts.filter(
    (p) => 
      (!isWindmill || (p.id !== "hub" && !p.id.startsWith("blade_"))) &&
      (!isAcademy || !p.id.startsWith("floating_rune_")) &&
      (!isPortal || (p.id !== "portal_crystal" && p.id !== "portal_energy_core")) &&
      (!isMirror || (p.id !== "mirror_surface" && p.id !== "orb_l" && p.id !== "orb_r"))
  );

  const windmillDynamicParts = data.parts.filter(
    (p) => isWindmill && (p.id === "hub" || p.id.startsWith("blade_"))
  );

  const academyDynamicParts = data.parts.filter(
    (p) => isAcademy && p.id.startsWith("floating_rune_")
  );

  const portalDynamicParts = data.parts.filter(
    (p) => isPortal && (p.id === "portal_crystal" || p.id === "portal_energy_core")
  );

  const mirrorDynamicParts = data.parts.filter(
    (p) => isMirror && (p.id === "mirror_surface" || p.id === "orb_l" || p.id === "orb_r")
  );

  return (
    <group ref={ref}>
      {staticParts.map((part) => renderPartMesh(part))}
      {isWindmill && (
        <group ref={windmillBladesRef} position={[0, 7.15, 0]}>
          {windmillDynamicParts.map((part) => {
            const status = partStatuses[part.id];
            if (status?.isDestroyed) return null;

            const relativeOffset = part.localOffset.clone().sub(new THREE.Vector3(0, 7.15, 0));
            const rotationVal = part.rotation ?? new THREE.Euler();

            return (
              <mesh
                key={part.id}
                name={part.id}
                position={relativeOffset}
                rotation={rotationVal}
                castShadow
                receiveShadow
              >
                {renderGeometry(part)}
                <meshStandardMaterial 
                  color={hitFlashTimer.current > 0 ? "#ffffff" : part.color} 
                  emissive={hitFlashTimer.current > 0 ? "#ffffff" : "#000000"} 
                  emissiveIntensity={hitFlashTimer.current > 0 ? 0.8 : 0} 
                  flatShading 
                  roughness={0.8} 
                />
              </mesh>
            );
          })}
        </group>
      )}
      {isAcademy && (
        <group ref={academyRunesRef}>
          {academyDynamicParts.map((part) => renderPartMesh(part))}
        </group>
      )}
      {isPortal && (
        <group ref={portalGroupRef}>
          {portalDynamicParts.map((part) => renderPartMesh(part))}
        </group>
      )}
      {isMirror && (
        <group ref={mirrorGroupRef}>
          {mirrorDynamicParts.map((part) => renderPartMesh(part))}
        </group>
      )}
    </group>
  );
});
