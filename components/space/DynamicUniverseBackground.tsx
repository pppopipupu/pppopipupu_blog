"use client";

import dynamic from "next/dynamic";

const UniverseBackground = dynamic(() => import("./UniverseBackground"), { ssr: false });

/** Loads the WebGPU universe canvas in the browser only, so the static export never evaluates vgpu. */
export default function DynamicUniverseBackground() {
  return <UniverseBackground />;
}
