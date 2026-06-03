"use client";

import React from "react";
import Link from "next/link";

export default function ArchivePortal() {
  return (
    <div style={{
      width: "80%",
      maxWidth: "800px",
      border: "5px outset #ff00ff",
      backgroundColor: "#000080",
      padding: "20px",
      marginBottom: "50px",
      boxShadow: "10px 10px 0px #00ffff",
      textAlign: "center",
    }}>
      <h2 className="rainbow-text blink-text" style={{
        fontSize: "2.5rem",
        margin: "0 0 15px 0",
        textTransform: "uppercase"
      }}>
        ★★★ ARCHIVE!（Icerainboww Fandom相关） ★★★
      </h2>
      <p style={{ color: "#ffff00", fontSize: "1.1rem", marginBottom: "20px", lineHeight: "1.5" }}>
        Fandom界面存档，以供后人考究冻蓝虹-神女事件后续冻蓝虹修的史……
        （我也不知道为什么我要把它放到我的界面,可能因为我跟这件事也有关吧）
      </p>
      <Link href="/archive" style={{ textDecoration: "none" }}>
        <div className="spell-btn" style={{
          border: "3px inset #00ffff",
          backgroundColor: "#000044",
          padding: "15px 30px",
          cursor: "crosshair",
          display: "inline-block",
          boxShadow: "4px 4px 0px #ff00ff"
        }}>
          <span style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#00ff00",
            textShadow: "2px 2px 0px #000"
          }}>
            ▶ 进入时光隧道 ◀
          </span>
        </div>
      </Link>
    </div>
  );
}
