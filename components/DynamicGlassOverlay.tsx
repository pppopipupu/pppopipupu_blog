"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const GlassOverlay = dynamic(() => import("./GlassOverlay"), { ssr: false });

export default function DynamicGlassOverlay() {
  const pathname = usePathname();
  
  return <GlassOverlay key={pathname} />;
}
