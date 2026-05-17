"use client";

import Link from "next/link";
import { useState } from "react";
import DynamicSpellLabScene from "@/components/DynamicSpellLabScene";
import type { SpellType } from "@/components/DynamicSpellLabScene";
import { FireballIcon, LightningIcon, DisintegrateIcon, PrismaticWallIcon } from "@/components/SpellIcons";

const SPELLS: { id: SpellType; name: string; icon: string; color: string; desc: string }[] = [
  { id: "fireball", name: "火球术", icon: "o", color: "#ff4400", desc: "向目标位置发射一枚火球" },
  { id: "lightning", name: "召雷术", icon: "z", color: "#4488ff", desc: "召唤闪电轰击目标位置" },
  { id: "disintegrate", name: "解离术", icon: "x", color: "#00ff00", desc: "射出一道绿色光线解离大面积地形" },
  { id: "prismatic-wall", name: "虹光法墙", icon: "w", color: "#ffffff", desc: "拖动鼠标释放一道绚丽光墙，每秒对敌人造成伤害" },
];

export default function SpellLab() {
  const [selectedSpell, setSelectedSpell] = useState<SpellType>("fireball");

  const handleReset = () => {
    if (typeof window !== "undefined" && (window as any).__spellLabReset) {
      (window as any).__spellLabReset();
    }
  };

  const currentSpell = SPELLS.find((s) => s.id === selectedSpell)!;

  return (
    <div
      style={{
        backgroundColor: "#000000",
        backgroundImage:
          "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMBAC1PQQX268vAAAAAElFTkSuQmCC')",
        backgroundRepeat: "repeat",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "#00ff00",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          textAlign: "center",
          color: "#ff00ff",
          textShadow: "3px 3px 0px #00ffff, -3px -3px 0px #ffff00",
          margin: "20px 0 10px 0",
          textTransform: "uppercase",
        }}
      >
        法术试验场
      </h1>

      {/* Spell Selector */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          padding: "10px 20px",
          border: "3px outset #00ffff",
          backgroundColor: "rgba(0,0,128,0.8)",
          marginBottom: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {SPELLS.map((spell) => (
          <button
            key={spell.id}
            onClick={() => setSelectedSpell(spell.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "4px 20px 4px 10px",
              border: selectedSpell === spell.id ? `3px inset ${spell.color}` : "3px outset #555",
              backgroundColor: selectedSpell === spell.id ? spell.color + "33" : "#111",
              color: selectedSpell === spell.id ? spell.color : "#888",
              fontSize: "1.1rem",
              cursor: "pointer",
              fontWeight: selectedSpell === spell.id ? "bold" : "normal",
              textShadow: selectedSpell === spell.id ? `0 0 10px ${spell.color}` : "none",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {selectedSpell === spell.id && (
              <>
                {spell.id === "fireball" && <FireballIcon active={true} />}
                {spell.id === "lightning" && <LightningIcon active={true} />}
                {spell.id === "disintegrate" && <DisintegrateIcon active={true} />}
                {spell.id === "prismatic-wall" && <PrismaticWallIcon active={true} />}
              </>
            )}
            {spell.name}
          </button>
        ))}
      </div>

      <p style={{ color: currentSpell.color, margin: "0 0 10px 0", fontSize: "0.9rem", textShadow: `0 0 8px ${currentSpell.color}55` }}>
        {currentSpell.desc} - 点击草地施放!
      </p>

      {/* Canvas Container */}
      <div
        style={{
          width: "95%",
          maxWidth: "1600px",
          height: "80vh",
          minHeight: "600px",
          border: "5px inset #ff00ff",
          backgroundColor: "#0a0a1a",
          position: "relative",
          boxShadow: "0 0 30px #ff00ff44, inset 0 0 30px #00000088",
        }}
      >
        <DynamicSpellLabScene spell={selectedSpell} />

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            position: "absolute",
            bottom: "15px",
            left: "15px",
            padding: "8px 16px",
            border: "3px outset #00ffff",
            backgroundColor: "#000080",
            color: "#00ffff",
            fontSize: "0.9rem",
            cursor: "pointer",
            zIndex: 10,
            fontFamily: "inherit",
          }}
        >
          RESET
        </button>
      </div>

      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "10px 30px",
          border: "3px outset #00ffff",
          backgroundColor: "#000080",
          color: "#00ff00",
          fontSize: "1.2rem",
          textDecoration: "none",
          cursor: "crosshair",
          margin: "20px 0 40px 0",
        }}
      >
        返回主页
      </Link>
    </div>
  );
}
