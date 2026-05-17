"use client";
import dynamic from "next/dynamic";
import type { SpellType } from "./SpellLabScene";

const DynamicSpellLabScene = dynamic(() => import("./SpellLabScene"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0a1a",
      color: "#00ff00",
      fontFamily: "monospace",
      fontSize: "1.5rem",
    }}>
      Loading Spell Lab...
    </div>
  ),
});

export default DynamicSpellLabScene;
export type { SpellType };
