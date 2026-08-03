"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

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

export default function DynamicCozyRoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);

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
          margin: "0 0 15px 0",
          textTransform: "uppercase",
        }}
      >
        ★★★ 3D COZY ROOM ★★★
      </h2>
      <p style={{ color: "#00ff00", textAlign: "center", fontSize: "0.9rem", margin: "0 0 12px 0", fontFamily: "monospace" }}>
        温馨低多边形卧室
          （deepsleep v4 flash ga制造，写了一堆深度冲突，但是不重要，消耗0刀乐）
      </p>
      {mounted ? (
        <CozyRoomScene frameloop={inView ? "always" : "never"} />
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
          <span className="blink-text">⚠ SCROLL DOWN TO LOAD 3D COZY ROOM ⚠</span>
          <span style={{ color: "#00ffff", fontSize: "0.85rem" }}>↓ ↓ ↓ ↓ ↓ ↓</span>
        </div>
      )}
    </div>
  );
}
