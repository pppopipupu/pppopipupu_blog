"use client";

import dynamic from "next/dynamic";

const GlassOverlay = dynamic(() => import("./GlassOverlay"), { ssr: false });

export default function DynamicGlassOverlay() {
  return <GlassOverlay />;
}
