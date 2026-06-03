"use client";

import dynamic from "next/dynamic";
import React from "react";

const ArchivePortal = dynamic(() => import("./ArchivePortal"), {
  ssr: false,
  loading: () => (
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
      <span className="blink-text" style={{ color: "#ffff00", fontFamily: "monospace", fontSize: "1.2rem" }}>
        LOADING ARCHIVE PORTAL...
      </span>
    </div>
  )
});

export default function DynamicArchivePortal() {
  return <ArchivePortal />;
}
