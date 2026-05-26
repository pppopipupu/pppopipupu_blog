"use client";

import dynamic from "next/dynamic";

const MusicPlayer = dynamic(() => import("./MusicPlayer"), { ssr: false });

export default function DynamicMusicPlayer() {
  return <MusicPlayer />;
}
