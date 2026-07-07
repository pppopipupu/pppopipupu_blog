"use client";

import dynamic from "next/dynamic";

const AmmoTestScene = dynamic(
  () => import("./AmmoTestScene"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] text-[#00ff00] font-mono border-4 border-[#00ff00]">
        <div className="text-xl font-bold bg-[#00ff00] text-black px-4 py-1 mb-4">
          [ SYSTEM BOOT ]
        </div>
        <p className="tracking-widest">LOADING AMMO.JS WASM PHYSICS ENGINE...</p>
        <p className="text-xs text-[#008800] mt-2">DO NOT CLOSE THIS TERMINAL WINDOW</p>
      </div>
    ),
  }
);

export default function DynamicAmmoTestScene() {
  return <AmmoTestScene />;
}
