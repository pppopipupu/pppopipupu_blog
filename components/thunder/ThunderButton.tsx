"use client";

import React, { useState, useCallback, useRef } from "react";
import { MiniLightningCanvas } from "./MiniLightningCanvas";
import { ThunderStrikeOverlay, StrikePoint } from "./ThunderStrikeOverlay";
import { thunderAudio } from "./ThunderAudio";
import { domPhysicsEngine } from "./DOMPhysicsEngine";

export function ThunderButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const [strikePoints, setStrikePoints] = useState<StrikePoint[]>([]);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleStrike = useCallback(() => {
    if (isStriking) return;

    setIsStriking(true);
    thunderAudio.playThunderClap(0.95);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const targets: StrikePoint[] = [
      { x: Math.min(180, screenWidth * 0.18), y: Math.max(screenHeight - 180, 500) },
      { x: screenWidth * 0.5, y: Math.min(320, screenHeight * 0.3) },
      { x: screenWidth * 0.25, y: Math.min(520, screenHeight * 0.5) },
      { x: screenWidth * 0.75, y: Math.min(560, screenHeight * 0.55) },
      { x: screenWidth * 0.5, y: Math.min(820, screenHeight * 0.8) },
    ];

    setStrikePoints(targets);
  }, [isStriking]);

  const handleStrikePeak = useCallback(() => {
    domPhysicsEngine.captureAndShatter(strikePoints);
    setIsShattered(true);
  }, [strikePoints]);

  const handleStrikeComplete = useCallback(() => {
    setIsStriking(false);
  }, []);

  const handleRevert = useCallback(() => {
    thunderAudio.playThunderClap(0.55);
    domPhysicsEngine.revertAll(() => {
      setIsShattered(false);
    });
  }, []);

  return (
    <>
      <div
        id="thunder-button-root"
        ref={buttonRef}
        style={{
          position: "fixed",
          top: "18px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "8px",
          fontFamily: "'Courier New', monospace, sans-serif",
          userSelect: "none",
        }}
      >
        <button
          onClick={handleStrike}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="RELEASE 终极天劫 POWER，SHATTER 全站 DOM 元素 INCLUDING CANVAS & MUSIC PLAYER！"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 16px 6px 8px",
            background: isHovered
              ? "linear-gradient(135deg, #001f3f 0%, #0052d4 35%, #4364f7 70%, #00ffff 100%)"
              : "linear-gradient(135deg, #001428 0%, #003b99 40%, #1e40af 75%, #00bfff 100%)",
            border: isHovered ? "3px outset #00ffff" : "3px outset #00d2ff",
            borderRadius: "4px",
            boxShadow: isHovered
              ? "0 0 25px #00ffff, 0 0 50px rgba(0, 210, 255, 0.6), inset 0 0 15px rgba(255,255,255,0.4)"
              : "0 0 15px rgba(0, 191, 255, 0.6), 4px 4px 0px #000040, inset 0 0 10px rgba(0, 229, 255, 0.2)",
            cursor: "crosshair",
            color: "#ffffff",
            transition: "all 0.15s ease",
            transform: isHovered ? "scale(1.04)" : "scale(1)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              position: "relative",
              filter: "drop-shadow(0 0 8px #00ffff)",
            }}
          >
            <MiniLightningCanvas isHovered={isHovered} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span
              style={{
                fontSize: "1.05rem",
                fontWeight: "900",
                color: "#e0f7ff",
                textShadow: "0 0 8px #00ffff, 2px 2px 0px #000033",
                letterSpacing: "0.08em",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⚡ UNLEASH THUNDER ⚡
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: "bold",
                color: "#7df9ff",
                textShadow: "1px 1px 0px #000",
                letterSpacing: "0.06em",
                opacity: 0.9,
              }}
            >
              {isShattered ? "▶ DOUBLE 轰炸 GRAVITY ◀" : "▶ CLICK 释放 MATRIX 打击 ◀"}
            </span>
          </div>
        </button>

        {isShattered && (
          <button
            onClick={handleRevert}
            title="EXECUTE 熵减 REVERSE，RESTORE 全局 UI MATRIX！"
            style={{
              padding: "5px 14px",
              background: "linear-gradient(135deg, #1b004a 0%, #4a00e0 50%, #8e2de2 100%)",
              border: "2px outset #ff00ff",
              borderRadius: "4px",
              boxShadow: "0 0 14px #ff00ff, 3px 3px 0px #000",
              cursor: "crosshair",
              color: "#ffff00",
              fontSize: "0.82rem",
              fontWeight: "bold",
              textShadow: "1px 1px 0px #ff0000",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🌀</span>
            <span>ROLLBACK PROTOCOL</span>
          </button>
        )}
      </div>

      <ThunderStrikeOverlay
        active={isStriking}
        strikePoints={strikePoints}
        onStrikePeak={handleStrikePeak}
        onComplete={handleStrikeComplete}
      />
    </>
  );
}
