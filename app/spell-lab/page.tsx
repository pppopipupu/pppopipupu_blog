"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import DynamicSpellLabScene from "@/components/DynamicSpellLabScene";
import type { SpellType } from "@/components/DynamicSpellLabScene";
import { FireballIcon, LightningIcon, DisintegrateIcon, PrismaticWallIcon, AnimateDeadIcon } from "@/components/SpellIcons";

const SPELLS: { id: SpellType; name: string; icon: string; color: string; desc: string }[] = [
  { id: "fireball", name: "火球术", icon: "o", color: "#ff4400", desc: "向目标位置发射一枚火球" },
  { id: "lightning", name: "召雷术", icon: "z", color: "#4488ff", desc: "召唤闪电轰击目标位置" },
  { id: "disintegrate", name: "解离术", icon: "x", color: "#00ff00", desc: "射出一道绿色光线解离大面积地形" },
  { id: "prismatic-wall", name: "虹光法墙", icon: "w", color: "#ffffff", desc: "拖动鼠标释放一道绚丽光墙，每秒对敌人造成伤害" },
  { id: "animate-dead", name: "操控死尸", icon: "n", color: "#a020f0", desc: "点击小人尸体召唤一只自动寻敌攻击的僵尸，拥有100HP" }
];

export default function SpellLab() {
  const [selectedSpell, setSelectedSpell] = useState<SpellType>("fireball");
  const [viewDistance, setViewDistance] = useState<number>(3);
  const [fogEnabled, setFogEnabled] = useState<boolean>(true);
  const [waterEnabled, setWaterEnabled] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [dbCastCount, setDbCastCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [firstPerson, setFirstPerson] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key.toLowerCase() === "q") {
        setFirstPerson((prev) => {
          const next = !prev;
          if (next) {
            setPlayerHp(100);
          }
          return next;
        });
      }
      if (e.key.toLowerCase() === "e") {
        setSelectedSpell((prev) => {
          const currentIndex = SPELLS.findIndex((s) => s.id === prev);
          const nextIndex = (currentIndex + 1) % SPELLS.length;
          return SPELLS[nextIndex].id;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    el.addEventListener("mousedown", handleMouseDown, { passive: false });
    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("spell_lab_stats")
        .select("cast_count")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setDbCastCount(data.cast_count || 0);
          } else if (error && error.code === 'PGRST116') {
            supabase
              .from("spell_lab_stats")
              .insert([{ user_id: user.id, cast_count: 0 }])
              .then();
          }
        });
    } else {
      requestAnimationFrame(() => {
        setDbCastCount(0);
      });
    }
  }, [user]);

  const handleCastSpell = () => {
    if (!user) return;
    setDbCastCount((prev) => {
      const nextCount = prev + 1;
      supabase
        .from("spell_lab_stats")
        .upsert({ user_id: user.id, cast_count: nextCount })
        .then();
      return nextCount;
    });
  };

  useEffect(() => {
    const savedDist = localStorage.getItem("spell-lab-view-distance");
    const savedFog = localStorage.getItem("spell-lab-fog-enabled");
    const savedWater = localStorage.getItem("spell-lab-water-enabled");
    requestAnimationFrame(() => {
      if (savedDist !== null) {
        const num = parseInt(savedDist, 10);
        if (!isNaN(num) && num >= 1 && num <= 10) {
          setViewDistance(num);
        }
      }
      if (savedFog !== null) {
        setFogEnabled(savedFog === "true");
      }
      if (savedWater !== null) {
        setWaterEnabled(savedWater === "true");
      } else {
        setWaterEnabled(true);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("spell-lab-view-distance", viewDistance.toString());
  }, [viewDistance]);

  useEffect(() => {
    localStorage.setItem("spell-lab-fog-enabled", fogEnabled.toString());
  }, [fogEnabled]);

  useEffect(() => {
    localStorage.setItem("spell-lab-water-enabled", waterEnabled.toString());
  }, [waterEnabled]);

  const handleReset = () => {
    if (typeof window !== "undefined" && Reflect.has(window, "__spellLabReset")) {
      const resetFn = Reflect.get(window, "__spellLabReset");
      if (typeof resetFn === "function") {
        resetFn();
      }
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
      <style dangerouslySetInnerHTML={{ __html: `
        .y2k-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 150px;
          height: 12px;
          background: #020206;
          border: 3px inset #ff00ff !important;
          outline: none;
          margin: 0;
          border-radius: 0 !important;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.8);
        }
        .y2k-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 24px;
          background: #00ffff !important;
          border: 3px outset #00ffff !important;
          cursor: pointer;
          border-radius: 0 !important;
          box-shadow: 0 0 8px rgba(0,255,255,0.8);
        }
        .y2k-slider::-moz-range-thumb {
          width: 14px;
          height: 24px;
          background: #00ffff !important;
          border: 3px outset #00ffff !important;
          cursor: pointer;
          border-radius: 0 !important;
          box-shadow: 0 0 8px rgba(0,255,255,0.8);
        }
      ` }} />
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
                {spell.id === "animate-dead" && <AnimateDeadIcon active={true} />}
              </>
            )}
            {spell.name}
          </button>
        ))}
      </div>

      <p style={{ color: currentSpell.color, margin: "0 0 10px 0", fontSize: "0.9rem", textShadow: `0 0 8px ${currentSpell.color}55` }}>
        {currentSpell.desc} - {currentSpell.id === "animate-dead" ? "点击尸体施放!" : "点击草地施放!"}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 20px",
          border: "3px outset #ff00ff",
          backgroundColor: "rgba(32,0,64,0.8)",
          marginBottom: "15px",
          fontFamily: "inherit",
          color: "#00ffff",
          textShadow: "0 0 5px #00ffff55",
        }}
      >
        <span style={{ fontSize: "1rem", fontWeight: "bold", letterSpacing: "1px" }}>渲染视距:</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={viewDistance}
            onChange={(e) => setViewDistance(Number(e.target.value))}
            className="y2k-slider"
          />
          <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#00ffff", minWidth: "24px", textAlign: "center" }}>
            {viewDistance}
          </span>
        </div>
        <span style={{ fontSize: "0.85rem", color: "#ff00ff", minWidth: "120px" }}>
          {viewDistance === 1 && "极近 (极速)"}
          {viewDistance === 2 && "较近 (流畅)"}
          {viewDistance === 3 && "中等 (平衡)"}
          {viewDistance === 4 && "较远 (清晰)"}
          {viewDistance === 5 && "远 (宏伟)"}
          {viewDistance === 6 && "很远 (震撼)"}
          {viewDistance === 7 && "超远 (极高)"}
          {viewDistance === 8 && "完美 (电影级)"}
          {viewDistance === 9 && "极致 (发烧级)"}
          {viewDistance === 10 && "无限 (显卡杀手)"}
        </span>

        <button
          onClick={() => setWaterEnabled(!waterEnabled)}
          style={{
            marginLeft: "auto",
            padding: "4px 12px",
            border: waterEnabled ? "3px inset #00ffff" : "3px outset #555",
            backgroundColor: waterEnabled ? "#00ffff33" : "#111",
            color: waterEnabled ? "#00ffff" : "#888",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
        >
          水体: {waterEnabled ? "开启" : "关闭"}
        </button>

        <button
          onClick={() => setFogEnabled(!fogEnabled)}
          style={{
            marginLeft: "12px",
            padding: "4px 12px",
            border: fogEnabled ? "3px inset #00ffff" : "3px outset #555",
            backgroundColor: fogEnabled ? "#00ffff33" : "#111",
            color: fogEnabled ? "#00ffff" : "#888",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
        >
          雾效: {fogEnabled ? "开启" : "关闭"}
        </button>

        <button
          onClick={() => setFirstPerson((prev) => {
            const next = !prev;
            if (next) {
              setPlayerHp(100);
            }
            return next;
          })}
          style={{
            marginLeft: "12px",
            padding: "4px 12px",
            border: firstPerson ? "3px inset #00ffff" : "3px outset #555",
            backgroundColor: firstPerson ? "#00ffff33" : "#111",
            color: firstPerson ? "#00ffff" : "#888",
            fontSize: "0.9rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.1s",
          }}
        >
          第一人称 (Q): {firstPerson ? "开启" : "关闭"}
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: "98%",
          maxWidth: "1800px",
          height: "85vh",
          minHeight: "750px",
          border: "5px inset #ff00ff",
          backgroundColor: "#0a0a1a",
          position: "relative",
          boxShadow: "0 0 30px #ff00ff44, inset 0 0 30px #00000088",
        }}
      >
        <DynamicSpellLabScene
          spell={selectedSpell}
          viewDistance={viewDistance}
          fogEnabled={fogEnabled}
          waterEnabled={waterEnabled}
          onCastSpellAction={handleCastSpell}
          firstPerson={firstPerson}
          playerHp={playerHp}
          onPlayerHpChange={setPlayerHp}
        />

        {firstPerson && (
          <>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "24px",
                height: "24px",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 100,
              }}
            >
              <div style={{ position: "absolute", top: "10px", left: "0", width: "24px", height: "4px", backgroundColor: "#00ff00", boxShadow: "0 0 8px #00ff00" }} />
              <div style={{ position: "absolute", top: "0", left: "10px", width: "4px", height: "24px", backgroundColor: "#00ff00", boxShadow: "0 0 8px #00ff00" }} />
              <div style={{ position: "absolute", top: "9px", left: "9px", width: "6px", height: "6px", backgroundColor: "#ffffff", borderRadius: "50%", boxShadow: "0 0 10px #ffffff" }} />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "300px",
                height: "24px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                border: "3px outset #ff00ff",
                boxShadow: "0 0 15px #ff00ff44",
                display: "flex",
                alignItems: "center",
                padding: "2px",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: `${playerHp}%`,
                  height: "100%",
                  backgroundColor: playerHp > 50 ? "#00ff00" : playerHp > 20 ? "#ffaa00" : "#ff0000",
                  boxShadow: playerHp > 50 ? "0 0 10px #00ff00" : playerHp > 20 ? "0 0 10px #ffaa00" : "0 0 10px #ff0000",
                  transition: "width 0.2s ease-out",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  textShadow: "1px 1px 2px #000000",
                }}
              >
                HP: {playerHp} / 100
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                top: "15px",
                left: "15px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                border: "2px outset #00ffff",
                padding: "6px 12px",
                color: "#00ffff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
                zIndex: 100,
                pointerEvents: "none",
                boxShadow: "0 0 10px #00ffff33",
              }}
            >
              WASD 移动 | 鼠标控制视角 | 点击施法 | Q键退出第一人称
            </div>
          </>
        )}

        {firstPerson && playerHp <= 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(10, 0, 0, 0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
            }}
          >
            <h2
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                color: "#ff0000",
                textShadow: "0 0 20px #ff0000",
                marginBottom: "20px",
                letterSpacing: "4px",
              }}
            >
              YOU DIED
            </h2>
            <button
              onClick={() => setPlayerHp(100)}
              style={{
                padding: "12px 30px",
                border: "3px outset #00ff00",
                backgroundColor: "#003300",
                color: "#00ff00",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 0 15px #00ff00",
                fontFamily: "inherit",
              }}
            >
              重新复活
            </button>
          </div>
        )}

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
          margin: "20px 0 20px 0",
        }}
      >
        返回主页
      </Link>

      <div
        style={{
          fontSize: "0.8rem",
          opacity: 0.5,
          marginBottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#888",
        }}
      >
        {user ? (
          <>
            <span>{user.user_metadata?.preferred_username || user.email} 已静默记录 {dbCastCount} 次施法</span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                border: "none",
                background: "none",
                color: "#ff3333",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.8rem",
              }}
            >
              登出
            </button>
          </>
        ) : (
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: "github",
              options: { redirectTo: window.location.href }
            })}
            style={{
              border: "none",
              background: "none",
              color: "#00ff00",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.8rem",
            }}
          >
            使用github登录解锁秘密功能
          </button>
        )}
      </div>
    </div>
  );
}
