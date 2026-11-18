"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const RemasteredCottageScene = dynamic(
  () => import("./remaster/RemasteredCottageScene"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1b182a",
          color: "#ffc266",
          fontFamily: "monospace",
          fontSize: "1.15rem",
        }}
      >
        <span className="blink-text">LOADING GEMINI 4 HYDROGEN REMASTER COTTAGE...</span>
      </div>
    ),
  }
);

const RemasteredLineVillageScene = dynamic(
  () => import("./remaster/RemasteredLineVillageScene"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "700px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f2ece1",
          color: "#181615",
          fontFamily: "monospace",
          fontSize: "1.15rem",
        }}
      >
        <span className="blink-text">LOADING GEMINI 4 HYDROGEN REMASTER VILLAGE...</span>
      </div>
    ),
  }
);

const CozyRoomScene = dynamic(() => import("./CozyRoomScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "700px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a1a",
        color: "#00ff00",
        fontFamily: "monospace",
        fontSize: "1.2rem",
      }}
    >
      <span className="blink-text">LOADING 3D COZY ROOM...</span>
    </div>
  ),
});

const LineArtScene = dynamic(() => import("./LineArtScene"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "700px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "monospace",
        fontSize: "1.2rem",
      }}
    >
      <span className="blink-text">LOADING 3D LINE ART...</span>
    </div>
  ),
});

type VersionId = "remaster" | "legacy";
type SceneId = "cottage" | "village";

const VERSION_BTN_BASE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.95rem",
  padding: "8px 18px",
  cursor: "pointer",
  border: "3px outset #00ffff",
  color: "#00ffff",
  backgroundColor: "#000055",
};

const VERSION_BTN_ACTIVE: React.CSSProperties = {
  ...VERSION_BTN_BASE,
  color: "#000000",
  backgroundColor: "#00ffff",
  fontWeight: "bold",
};

const BTN_BASE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "1rem",
  padding: "8px 18px",
  cursor: "pointer",
  border: "3px outset #ff00ff",
  color: "#00ff00",
  backgroundColor: "#000080",
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN_BASE,
  color: "#ffffff",
  backgroundColor: "#ff00ff",
  fontWeight: "bold",
};

export default function DynamicCozyRoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [version, setVersion] = useState<VersionId>("remaster");
  const [scene, setScene] = useState<SceneId>("cottage");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let active = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (!active) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMounted(true);
            setInView(true);
          } else {
            setInView(false);
          }
        });
      },
      { rootMargin: "300px 0px 300px 0px" }
    );
    io.observe(el);
    return () => {
      active = false;
      io.disconnect();
    };
  }, []);

  const frameloop = inView ? "always" : "never";

  return (
    <div
      ref={containerRef}
      style={{
        width: "92%",
        maxWidth: "1100px",
        border: "5px outset #ff00ff",
        backgroundColor: "#000080",
        padding: "20px",
        marginBottom: "50px",
        boxShadow: "10px 10px 0px #00ffff",
      }}
    >
      <h2
        className="rainbow-text blink-text"
        style={{
          fontSize: "2.2rem",
          textAlign: "center",
          margin: "0 0 12px 0",
          textTransform: "uppercase",
        }}
      >
        ★★★ 3D SCENE ROOM ★★★
      </h2>
      <p
        style={{
          color: "#00ff00",
          textAlign: "center",
          fontSize: "0.9rem",
          margin: "0 0 12px 0",
          fontFamily: "monospace",
        }}
      >
        {version === "remaster"
          ? "低多边形林间小屋 / 建筑墨线中世纪村庄（Gemini 4 Hydrogen Remaster版）"
          : "温馨低多边形卧室 / 黑白线条中世纪村庄（V4 Flash GA版（过去的回忆））"}
      </p>

      {/* Version Selector Tabs */}
      <div
        role="tablist"
        aria-label="3D场景版本选择"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          margin: "0 0 10px 0",
        }}
      >
        <button
          role="tab"
          aria-selected={version === "remaster"}
          style={version === "remaster" ? VERSION_BTN_ACTIVE : VERSION_BTN_BASE}
          onClick={() => setVersion("remaster")}
        >
          ★ Gemini 4 Hydrogen Remaster版
        </button>
        <button
          role="tab"
          aria-selected={version === "legacy"}
          style={version === "legacy" ? VERSION_BTN_ACTIVE : VERSION_BTN_BASE}
          onClick={() => setVersion("legacy")}
        >
          V4 Flash GA版（过去的回忆）
        </button>
      </div>

      {/* Scene Selector Tabs */}
      <div
        role="tablist"
        aria-label="3D场景切换"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          margin: "0 0 14px 0",
        }}
      >
        <button
          role="tab"
          aria-selected={scene === "cottage"}
          style={scene === "cottage" ? BTN_ACTIVE : BTN_BASE}
          onClick={() => setScene("cottage")}
        >
          {version === "remaster" ? "低多边形小屋 (Remaster)" : "温馨卧室 (旧版)"}
        </button>
        <button
          role="tab"
          aria-selected={scene === "village"}
          style={scene === "village" ? BTN_ACTIVE : BTN_BASE}
          onClick={() => setScene("village")}
        >
          {version === "remaster" ? "线条村庄 (Remaster)" : "线条村庄 (旧版)"}
        </button>
      </div>

      {mounted ? (
        version === "remaster" ? (
          scene === "cottage" ? (
            <RemasteredCottageScene frameloop={frameloop} />
          ) : (
            <RemasteredLineVillageScene frameloop={frameloop} />
          )
        ) : scene === "cottage" ? (
          <CozyRoomScene frameloop={frameloop} />
        ) : (
          <LineArtScene frameloop={frameloop} />
        )
      ) : (
        <div
          style={{
            width: "100%",
            height: "700px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a1a",
            color: "#ffff00",
            fontFamily: "monospace",
            fontSize: "1.1rem",
            gap: "12px",
          }}
        >
          <span className="blink-text">⚠ SCROLL DOWN TO LOAD 3D SCENE ⚠</span>
          <span style={{ color: "#00ffff", fontSize: "0.85rem" }}>↓ ↓ ↓ ↓ ↓ ↓</span>
        </div>
      )}
    </div>
  );
}
