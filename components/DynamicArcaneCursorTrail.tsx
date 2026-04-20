"use client";

import dynamic from "next/dynamic";

const ArcaneCursorTrail = dynamic(() => import("./ArcaneCursorTrail"), { ssr: false });

export default function DynamicArcaneCursorTrail() {
  return <ArcaneCursorTrail />;
}
