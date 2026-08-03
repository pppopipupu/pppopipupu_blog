"use client";

import React from "react";

export default class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[CozyRoom] scene render crashed:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          style={{
            width: "100%",
            height: "640px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a1a",
            color: "#ff6b6b",
            fontFamily: "monospace",
            fontSize: "1rem",
            textAlign: "center",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          ⚠ 3D 场景加载失败(WebGL 上下文不可用或已崩溃)。请刷新页面或更换浏览器重试。
        </div>
      );
    }
    return this.props.children;
  }
}
