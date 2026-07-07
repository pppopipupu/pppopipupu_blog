"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import Giscus from "@giscus/react";

// ==================== 3D 产品组件 ====================

// 1. Spell Lab Pro - 悬浮多面体玻璃核
function SpellLabProProduct() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.12;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 外层磨砂玻璃多面体 */}
      <mesh>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshPhysicalMaterial
          color="#0066cc"
          emissive="#002288"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
          transmission={0.7}
          thickness={1.5}
          ior={1.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* 内层旋转发光线框核心 */}
      <mesh>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>
    </group>
  );
}

// 2. Fluid Simulation (浅水物理模拟) - 水波模拟芯片
function FluidProduct() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // 叠加正弦波模拟涟漪
      const z = Math.sin(x * 1.5 + time * 2.5) * Math.cos(y * 1.5 + time * 2.0) * 0.12 
              + Math.sin(Math.sqrt(x*x + y*y) - time * 3) * 0.08;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0.2, 0]}>
      <planeGeometry args={[4, 4, 32, 32]} />
      <meshStandardMaterial
        color="#0066cc"
        roughness={0.2}
        metalness={0.8}
        flatShading
      />
    </mesh>
  );
}

// 3. Infinite Terrain (无限地形生成) - 滚动地形线框
function TerrainProduct({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const geom = meshRef.current.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // 生成向前滚动的雷达地形高度
      const z = (Math.sin(x * 1.0) * Math.cos(y * 1.0 - time * 1.5) 
              + Math.sin(y * 0.5 - time) * Math.cos(x * 0.5)) * 0.25;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 3, 0, 0]} position={[0, 0.3, 0]}>
      <planeGeometry args={[4.5, 4.5, 24, 24]} />
      <meshStandardMaterial
        color={isDark ? "#2997ff" : "#0066cc"}
        roughness={0.3}
        metalness={0.8}
        wireframe
      />
    </mesh>
  );
}

// ==================== 3D 配件组件 ====================

// A. MCMOD - 三维高级材质旋转芯片立方体
function McmodCardProduct() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial
        color="#30d158" // 绿色
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

// B. STEAM - 三维发光旋转圆环
function SteamCardProduct() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.0) * 0.1;
    }
  });
  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[0.9, 0.25, 16, 100]} />
        <meshStandardMaterial
          color="#0066cc" // Action Blue
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

// C. GITHUB - 3D 旋转粒子星云
function GithubCardProduct() {
  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.1;
    }
  });

  const count = 120;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.0 + Math.random() * 0.4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#2997ff"
        size={0.06}
        sizeAttenuation
      />
    </points>
  );
}

// ==================== 主彩蛋组件 ====================

export default function MainFool() {
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [origin, setOrigin] = useState("");
  const [view, setView] = useState<"home" | "privacy" | "terms" | "compliance">("home");
  const [themeLoaded, setThemeLoaded] = useState(false);

  // 1. 初始化主题（自适应系统/缓存）与路由解析
  useEffect(() => {
    setOrigin(window.location.origin);
    
    const savedTheme = localStorage.getItem("apple-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    } else if (savedTheme === "light") {
      setIsDark(false);
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(systemDark);
    }
    
    // 主题加载就绪，随后激活过渡动画
    setThemeLoaded(true);

    const params = new URLSearchParams(window.location.search);
    const currentView = params.get("view");
    if (currentView === "privacy" || currentView === "terms" || currentView === "compliance") {
      setView(currentView);
    } else {
      setView("home");
    }
  }, []);

  // 2. 动态注入 MathJax
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        svg: {
          fontCache: 'global'
        }
      };

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
      script.async = true;
      document.head.appendChild(script);

      return () => {
        try {
          document.head.removeChild(script);
        } catch (e) {}
      };
    }
  }, []);

  // 3. 监听视图/主题变化并动态重排 LaTeX 公式
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).MathJax && (window as any).MathJax.typesetPromise) {
      setTimeout(() => {
        (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
      }, 80);
    }
  }, [view, isDark]);

  // 监听浏览器前进/后退
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setView(e.state.view);
      } else {
        const params = new URLSearchParams(window.location.search);
        const currentView = params.get("view") as any;
        if (currentView === "privacy" || currentView === "terms" || currentView === "compliance") {
          setView(currentView);
        } else {
          setView("home");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 极丝滑的无刷新页面内部跳转
  const navigateToView = (nextView: "home" | "privacy" | "terms" | "compliance") => {
    setView(nextView);
    const newUrl = nextView === "home" ? "/main_fool" : `/main_fool?view=${nextView}`;
    window.history.pushState({ view: nextView }, "", newUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 切换深浅色并写入本地缓存
  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("apple-theme", nextDark ? "dark" : "light");
  };

  // 深浅色模式下的色彩配置（严格匹配 DESIGN.md）
  const colorCanvas = isDark ? "#1d1d1f" : "#ffffff";
  const colorCanvasParchment = isDark ? "#2a2a2c" : "#f5f5f7";
  const colorText = isDark ? "#ffffff" : "#1d1d1f";
  const colorTextMuted = isDark ? "#cccccc" : "#86868b";
  const colorLink = isDark ? "#2997ff" : "#0066cc";
  const colorCardBg = isDark ? "#272729" : "#ffffff";
  const colorCardBorder = isDark ? "#3d3d3f" : "#e0e0e0";

  const giscusThemeUrl = origin
    ? `${origin}/giscus-apple-${isDark ? "dark" : "light"}.css`
    : "light";

  return (
    <div
      style={{
        backgroundColor: colorCanvas,
        color: colorText,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
      className={`apple-transition ${themeLoaded ? "apple-transition-active" : ""}`}
    >
      {/* 注入 Apple 风格的 Vanilla CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          h1, h2, h3, .apple-headline {
            letter-spacing: -0.02em;
            font-weight: 600;
          }
          
          .apple-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s ease, color 0.2s ease;
            cursor: pointer;
            user-select: none;
            text-decoration: none;
            border: none;
          }
          
          .apple-btn:active {
            transform: scale(0.95) !important;
          }
          
          .apple-card-hover {
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.5s ease, border-color 0.5s ease;
          }
          .apple-card-hover:hover {
            transform: translateY(-4px);
          }
          
          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
          
          .apple-subnav-sticky {
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            transition: background-color 0.5s ease, border-color 0.5s ease;
          }
          
          /* 主题就绪后的过渡动画定义 */
          .apple-transition-active {
            transition: background-color 0.5s cubic-bezier(0.25, 1, 0.5, 1),
                        color 0.5s cubic-bezier(0.25, 1, 0.5, 1),
                        border-color 0.5s cubic-bezier(0.25, 1, 0.5, 1),
                        box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          .apple-doc-p {
            font-size: 17px;
            line-height: 1.47;
            margin-bottom: 24px;
            letter-spacing: -0.374px;
          }
          
          /* 优化 MathJax 公式外边距及印刷级样式 */
          .mjx-chtml {
            margin: 24px 0 !important;
            font-size: 110% !important;
          }
        `
      }} />

      {/* ==================== 1. Global Nav (44px) ==================== */}
      <nav
        style={{
          backgroundColor: "#000000",
          height: "44px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 22px",
          boxSizing: "border-box",
          zIndex: 1001,
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <span
            onClick={() => navigateToView("home")}
            style={{
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.5px",
            }}
          >
             pppopipupu
          </span>
          
          {/* Menu Items */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "12px",
              color: "#cccccc",
            }}
          >
            <span onClick={() => navigateToView("home")} style={{ color: "inherit", cursor: "pointer" }} className="apple-btn">Store</span>
            <Link href="/spell-lab" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">Spell Lab</Link>
            <Link href="/games" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">Games</Link>
            <span onClick={() => navigateToView("privacy")} style={{ color: "inherit", cursor: "pointer" }} className="apple-btn">Privacy</span>
            <a href="https://github.com/pppopipupu/pppopipupu_blog" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">GitHub</a>
          </div>
        </div>
      </nav>

      {/* ==================== 2. Sub Nav (52px) ==================== */}
      <div
        className={`apple-subnav-sticky ${themeLoaded ? "apple-transition-active" : ""}`}
        style={{
          height: "52px",
          width: "100%",
          backgroundColor: isDark ? "rgba(29, 29, 31, 0.8)" : "rgba(245, 245, 247, 0.8)",
          borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1024px",
            height: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            boxSizing: "border-box",
          }}
        >
          <span
            onClick={() => navigateToView("home")}
            style={{ fontSize: "21px", fontWeight: 600, color: colorText, cursor: "pointer" }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            Spell Lab Pro
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            
            {/* 极简 iOS 胶囊 Switch 深色模式切换 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", userSelect: "none" }}>
              <span style={{ fontSize: "12px", color: isDark ? "#86868b" : "#1d1d1f", fontWeight: 600 }} className={themeLoaded ? "apple-transition-active" : ""}>Light</span>
              <button
                onClick={toggleTheme}
                className="apple-btn"
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "9999px",
                  backgroundColor: isDark ? "#30d158" : "#d1d1d6",
                  position: "relative",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    position: "absolute",
                    left: isDark ? "18px" : "2px",
                    transition: "left 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }}
                />
              </button>
              <span style={{ fontSize: "12px", color: isDark ? "#ffffff" : "#86868b", fontWeight: 600 }} className={themeLoaded ? "apple-transition-active" : ""}>Dark</span>
            </div>

            <Link
              href="/spell-lab"
              className="apple-btn"
              style={{
                backgroundColor: colorLink,
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 400,
                padding: "4px 12px",
                borderRadius: "9999px",
              }}
            >
              立即体验
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== 视图分流渲染 ==================== */}

      {view === "home" ? (
        <>
          {/* ==================== 3. Hero Tile (Spell Lab Pro - 主页面) ==================== */}
          <section
            id="spell-lab"
            style={{
              width: "100%",
              backgroundColor: colorCanvas,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "80px",
              paddingBottom: "80px",
              boxSizing: "border-box",
              position: "relative",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ textAlign: "center", zIndex: 10, padding: "0 20px" }}>
              <h1
                style={{
                  fontSize: "56px",
                  lineHeight: 1.07,
                  margin: "0 0 8px 0",
                  color: colorText,
                }}
                className={themeLoaded ? "apple-transition-active" : ""}
              >
                Spell Lab Pro
              </h1>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 400,
                  lineHeight: 1.14,
                  color: colorText,
                  margin: "0 0 16px 0",
                }}
                className={themeLoaded ? "apple-transition-active" : ""}
              >
                全新 M4 秘术芯片。为毁灭而生。
              </h2>
              
              {/* CTA Buttons */}
              <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
                <Link
                  href="/spell-lab"
                  className="apple-btn"
                  style={{
                    backgroundColor: colorLink,
                    color: "#ffffff",
                    fontSize: "17px",
                    padding: "11px 22px",
                    borderRadius: "9999px",
                    fontWeight: 400,
                  }}
                >
                  立即释放
                </Link>
                <a
                  href="#fluid-simulation"
                  className="apple-btn"
                  style={{
                    backgroundColor: "transparent",
                    color: colorLink,
                    fontSize: "17px",
                    padding: "11px 22px",
                    borderRadius: "9999px",
                    border: `1px solid ${colorLink}`,
                    fontWeight: 400,
                  }}
                >
                  了解更多
                </a>
              </div>
            </div>

            {/* 3D 产品模型 */}
            <div style={{ width: "100%", height: "400px", marginTop: "40px", position: "relative" }}>
              <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.8} color="#ffffff" />
                <directionalLight position={[-5, 5, -5]} intensity={0.6} color="#0066cc" />
                <pointLight position={[0, -2, 2]} intensity={0.8} color="#00ffc4" />
                <React.Suspense fallback={null}>
                  <SpellLabProProduct />
                  <ContactShadows position={[0, -1.8, 0]} opacity={0.35} scale={4.5} blur={1.8} far={3} />
                </React.Suspense>
              </Canvas>
            </div>
          </section>

          {/* ==================== 4. Tile 2 (Fluid Simulation) ==================== */}
          <section
            id="fluid-simulation"
            style={{
              width: "100%",
              backgroundColor: isDark ? "#000000" : "#272729",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "80px",
              paddingBottom: "80px",
              boxSizing: "border-box",
              position: "relative",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ textAlign: "center", zIndex: 10, padding: "0 20px" }}>
              <h2 style={{ fontSize: "40px", lineHeight: 1.1, margin: "0 0 8px 0", color: "#ffffff" }}>
                浅水物理模拟引擎
              </h2>
              <p style={{ fontSize: "24px", fontWeight: 300, lineHeight: 1.5, color: "#cccccc", margin: "0 0 16px 0", maxWidth: "650px" }}>
                实时元胞自动机浅水物理模拟。让火球在掌中泛起微澜。
              </p>
              
              {/* LaTeX 流体守恒方程 (MathML 渲染) */}
              <div style={{ margin: "24px 0", display: "inline-block" }}>
                {"$$\\frac{\\partial h}{\\partial t} + \\frac{\\partial (hu)}{\\partial x} + \\frac{\\partial (hv)}{\\partial y} = 0$$"}
                {"$$\\frac{\\partial (hu)}{\\partial t} + \\frac{\\partial}{\\partial x}\\left(hu^2 + \\frac{1}{2}gh^2\\right) = 0$$"}
              </div>

              <div style={{ marginTop: "16px" }}>
                <Link href="/spell-lab" className="apple-btn" style={{ backgroundColor: "transparent", color: "#2997ff", fontSize: "17px", fontWeight: 400, textDecoration: "none" }}>
                  体验流体物理 →
                </Link>
              </div>
            </div>

            <div style={{ width: "100%", height: "380px", marginTop: "40px", position: "relative" }}>
              <Canvas camera={{ position: [0, 2.5, 3.5], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[0, 5, 2]} intensity={2.0} color="#0066cc" />
                <directionalLight position={[3, 2, -1]} intensity={1.0} color="#00ffc4" />
                <React.Suspense fallback={null}>
                  <FluidProduct />
                  <ContactShadows position={[0, -0.6, 0]} opacity={0.3} scale={6} blur={2.0} far={2} />
                </React.Suspense>
              </Canvas>
            </div>
          </section>

          {/* ==================== 5. Tile 3 (Infinite Terrain) ==================== */}
          <section
            id="infinite-terrain"
            style={{
              width: "100%",
              backgroundColor: isDark ? "#252527" : "#f5f5f7",
              color: colorText,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "80px",
              paddingBottom: "80px",
              boxSizing: "border-box",
              position: "relative",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ textAlign: "center", zIndex: 10, padding: "0 20px" }}>
              <h2 style={{ fontSize: "40px", lineHeight: 1.1, margin: "0 0 8px 0", color: colorText }} className={themeLoaded ? "apple-transition-active" : ""}>
                无限地形生成技术
              </h2>
              <p style={{ fontSize: "24px", fontWeight: 300, lineHeight: 1.5, color: colorTextMuted, margin: "0 0 16px 0", maxWidth: "650px" }} className={themeLoaded ? "apple-transition-active" : ""}>
                基于柏林噪声的动态地形网格。目光所及，皆是坦途。
              </p>
              
              {/* LaTeX 柏林噪声 Hermite 缓和曲线公式 (MathML 渲染) */}
              <div style={{ margin: "24px 0", display: "inline-block" }}>
                {"$$S(t) = 6t^5 - 15t^4 + 10t^3$$"}
                {"$$P(x,y,z) = \\sum_{i,j,k} \\omega(i,j,k) \\cdot g(i,j,k)$$"}
              </div>

              <div style={{ marginTop: "16px" }}>
                <Link href="/spell-lab" className="apple-btn" style={{ backgroundColor: colorLink, color: "#ffffff", fontSize: "14px", fontWeight: 400, padding: "8px 16px", borderRadius: "9999px" }}>
                  进入实验室
                </Link>
              </div>
            </div>

            <div style={{ width: "100%", height: "380px", marginTop: "40px", position: "relative" }}>
              <Canvas camera={{ position: [0, 2.2, 3.8], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[0, 5, 2]} intensity={1.5} color={colorLink} />
                <React.Suspense fallback={null}>
                  <TerrainProduct isDark={isDark} />
                  <ContactShadows position={[0, -0.6, 0]} opacity={0.2} scale={6} blur={2.0} far={2} />
                </React.Suspense>
              </Canvas>
            </div>
          </section>

          {/* ==================== 6. Tile 4 (Articles Specs List) ==================== */}
          <section
            id="articles"
            style={{
              width: "100%",
              backgroundColor: isDark ? "#151517" : "#2a2a2c",
              color: "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "80px",
              paddingBottom: "80px",
              boxSizing: "border-box",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ textAlign: "center", width: "100%", maxWidth: "800px", padding: "0 20px" }}>
              <h2 style={{ fontSize: "40px", margin: "0 0 8px 0" }}>文献与研究规格</h2>
              <p style={{ fontSize: "17px", color: "#cccccc", margin: "0 0 40px 0" }}>
                选择您想要阅读的研究报告。专为视网膜屏幕优化的排版设计。
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
                
                {/* 文章卡片 1 */}
                <div
                  onClick={() => setSelectedArticle(1)}
                  style={{
                    backgroundColor: "#1d1d1f",
                    border: selectedArticle === 1 ? "2px solid #2997ff" : "1px solid #3d3d3f",
                    borderRadius: "12px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, transform 0.15s ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  className="apple-btn"
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#2997ff", fontWeight: 600 }}>PRO SPEC</span>
                    <h3 style={{ fontSize: "21px", margin: "4px 0", color: "#ffffff" }}>
                      第一篇文章！Who am I
                    </h3>
                    <p style={{ fontSize: "14px", color: "#cccccc", margin: 0 }}>
                      系统化探寻自我的终极之作，大师级极简报告。
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "17px", fontWeight: 600, color: "#ffffff", display: "block" }}>免费阅读</span>
                    <span style={{ fontSize: "12px", color: "#86868b" }}>★★★★★</span>
                  </div>
                </div>

                {/* 文章卡片 2 */}
                <div
                  onClick={() => setSelectedArticle(2)}
                  style={{
                    backgroundColor: "#1d1d1f",
                    border: selectedArticle === 2 ? "2px solid #2997ff" : "1px solid #3d3d3f",
                    borderRadius: "12px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, transform 0.15s ease",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  className="apple-btn"
                >
                  <div>
                    <span style={{ fontSize: "12px", color: "#86868b", fontWeight: 600 }}>EXTREME SPEC</span>
                    <h3 style={{ fontSize: "21px", margin: "4px 0", color: "#ffffff" }}>
                      如何制作一个安格瑞的网页
                    </h3>
                    <p style={{ fontSize: "14px", color: "#cccccc", margin: 0 }}>
                      闪烁霓虹极客精神，拒绝现代 Web 设计的不朽指南。
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "17px", fontWeight: 600, color: "#ffffff", display: "block" }}>免费阅读</span>
                    <span style={{ fontSize: "12px", color: "#86868b" }}>★★★</span>
                  </div>
                </div>
                
              </div>

              {selectedArticle && (
                <div style={{ marginTop: "32px", animation: "slideDown 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards" }}>
                  <Link
                    href={selectedArticle === 1 ? "/articles/first" : "#"}
                    className="apple-btn"
                    style={{
                      backgroundColor: "#0066cc",
                      color: "#ffffff",
                      fontSize: "17px",
                      padding: "12px 32px",
                      borderRadius: "9999px",
                    }}
                  >
                    立即开始阅读 {selectedArticle === 1 ? "《Who am I》" : "《安格瑞网页制作》"}
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* ==================== 7. Grid Section (Store Accessories - 3D Canvas) ==================== */}
          <section
            style={{
              width: "100%",
              backgroundColor: colorCanvasParchment,
              padding: "80px 22px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ maxWidth: "1024px", width: "100%" }}>
              <h2 style={{ fontSize: "34px", lineHeight: 1.2, marginBottom: "32px", color: colorText, textAlign: "left" }} className={themeLoaded ? "apple-transition-active" : ""}>
                联名配件与开放架构。
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {/* 配件 1 */}
                <div
                  className="apple-card-hover"
                  style={{
                    backgroundColor: colorCardBg,
                    border: `1px solid ${colorCardBorder}`,
                    borderRadius: "18px",
                    padding: "24px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "360px",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ width: "100%", height: "140px", borderRadius: "12px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
                      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ background: "transparent" }}>
                        <ambientLight intensity={0.7} />
                        <directionalLight position={[2, 2, 2]} intensity={1.2} />
                        <React.Suspense fallback={null}>
                          <McmodCardProduct />
                        </React.Suspense>
                      </Canvas>
                      <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", width: "60px", height: "8px", background: "rgba(0,0,0,0.1)", filter: "blur(4px)", borderRadius: "50%" }}></div>
                    </div>
                    <span style={{ fontSize: "12px", color: colorTextMuted, fontWeight: 600 }} className={themeLoaded ? "apple-transition-active" : ""}>MCMOD 联名芯片</span>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: colorText, margin: "4px 0 8px 0" }} className={themeLoaded ? "apple-transition-active" : ""}>
                      我的 MCMOD 作者专区
                    </h3>
                    <p style={{ fontSize: "14px", color: colorTextMuted, margin: 0 }} className={themeLoaded ? "apple-transition-active" : ""}>
                      插上它，即刻开启方块世界秘术之旅。
                    </p>
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <a href="https://www.mcmod.cn/author/31246.html" target="_blank" rel="noopener noreferrer" className="apple-btn" style={{ color: colorLink, fontSize: "14px", textDecoration: "none" }}>
                      立即获取 →
                    </a>
                  </div>
                </div>

                {/* 配件 2 */}
                <div
                  className="apple-card-hover"
                  style={{
                    backgroundColor: colorCardBg,
                    border: `1px solid ${colorCardBorder}`,
                    borderRadius: "18px",
                    padding: "24px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "360px",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ width: "100%", height: "140px", borderRadius: "12px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
                      <Canvas camera={{ position: [0, 0, 3.2], fov: 50 }} style={{ background: "transparent" }}>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[1, 3, 2]} intensity={1.5} color="#0066cc" />
                        <React.Suspense fallback={null}>
                          <SteamCardProduct />
                        </React.Suspense>
                      </Canvas>
                      <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", width: "60px", height: "8px", background: "rgba(0,0,0,0.1)", filter: "blur(4px)", borderRadius: "50%" }}></div>
                    </div>
                    <span style={{ fontSize: "12px", color: colorTextMuted, fontWeight: 600 }} className={themeLoaded ? "apple-transition-active" : ""}>STEAM 联谊组键</span>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: colorText, margin: "4px 0 8px 0" }} className={themeLoaded ? "apple-transition-active" : ""}>
                      STEAM 好友扩展链接
                    </h3>
                    <p style={{ fontSize: "14px", color: colorTextMuted, margin: 0 }} className={themeLoaded ? "apple-transition-active" : ""}>
                      点击添加好友。畅通无阻，即刻连机。
                    </p>
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <a href="https://steamcommunity.com/profiles/76561199106950429/" target="_blank" rel="noopener noreferrer" className="apple-btn" style={{ color: colorLink, fontSize: "14px", textDecoration: "none" }}>
                      添加好友 →
                    </a>
                  </div>
                </div>

                {/* 配件 3 */}
                <div
                  className="apple-card-hover"
                  style={{
                    backgroundColor: colorCardBg,
                    border: `1px solid ${colorCardBorder}`,
                    borderRadius: "18px",
                    padding: "24px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "360px",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ width: "100%", height: "140px", borderRadius: "12px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
                      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ background: "transparent" }}>
                        <ambientLight intensity={0.8} />
                        <React.Suspense fallback={null}>
                          <GithubCardProduct />
                        </React.Suspense>
                      </Canvas>
                      <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", width: "60px", height: "8px", background: "rgba(0,0,0,0.1)", filter: "blur(4px)", borderRadius: "50%" }}></div>
                    </div>
                    <span style={{ fontSize: "12px", color: colorTextMuted, fontWeight: 600 }} className={themeLoaded ? "apple-transition-active" : ""}>开源基础架构</span>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: colorText, margin: "4px 0 8px 0" }} className={themeLoaded ? "apple-transition-active" : ""}>
                      GITHUB 博客开源架构
                    </h3>
                    <p style={{ fontSize: "14px", color: colorTextMuted, margin: 0 }} className={themeLoaded ? "apple-transition-active" : ""}>
                      纯粹、透明、向每一位极客开放全部代码。
                    </p>
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <a href="https://github.com/pppopipupu/pppopipupu_blog" target="_blank" rel="noopener noreferrer" className="apple-btn" style={{ color: colorLink, fontSize: "14px", textDecoration: "none" }}>
                      获取 Star →
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ==================== 8. Giscus 评论区 (Apple Style) ==================== */}
          <section
            style={{
              width: "100%",
              backgroundColor: colorCanvas,
              padding: "60px 22px 80px 22px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderTop: isDark ? "1px solid #3d3d3f" : "1px solid #e0e0e0",
            }}
            className={themeLoaded ? "apple-transition-active" : ""}
          >
            <div style={{ maxWidth: "800px", width: "100%" }}>
              <h2 style={{ fontSize: "34px", lineHeight: 1.2, marginBottom: "32px", color: colorText, textAlign: "center" }} className={themeLoaded ? "apple-transition-active" : ""}>
                关于法术实验室的研讨
              </h2>
              <p style={{ fontSize: "17px", color: colorTextMuted, textAlign: "center", marginBottom: "48px" }} className={themeLoaded ? "apple-transition-active" : ""}>
                提交您的使用评测与魔导术优化建议。请自觉遵守法术安全条例。
              </p>

              <Giscus
                id="comments"
                repo="pppopipupu/pppopipupu_blog"
                repoId="R_kgDOSGKrKw"
                category="General"
                categoryId="DIC_kwDOSGKrK84C7SKr"
                mapping="specific"
                term="pppopipupu_blog"
                reactionsEnabled="1"
                emitMetadata="0"
                inputPosition="top"
                theme={giscusThemeUrl}
                lang="zh-CN"
                loading="lazy"
              />
            </div>
          </section>
        </>
      ) : (
        /* ==================== 独占渲染：愚人节荒诞法律文书子页面 ==================== */
        <main
          style={{
            maxWidth: "680px",
            width: "100%",
            margin: "0 auto",
            padding: "80px 22px 120px 22px",
            boxSizing: "border-box",
            flexGrow: 1,
          }}
        >
          {/* 返回按钮 */}
          <div style={{ marginBottom: "40px" }}>
            <span
              onClick={() => navigateToView("home")}
              style={{
                color: colorLink,
                fontSize: "17px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                fontWeight: 400,
              }}
              className="apple-btn"
            >
              〈 返回 Spell Lab Pro 介绍
            </span>
          </div>

          {/* 隐私政策条款 */}
          {view === "privacy" && (
            <article className={themeLoaded ? "apple-transition-active" : ""} style={{ color: colorText }}>
              <span style={{ fontSize: "14px", color: colorTextMuted, fontWeight: 600 }}>pppopipupu 秘术网络</span>
              <h1 style={{ fontSize: "40px", margin: "8px 0 16px 0", lineHeight: 1.1 }}>隐私政策</h1>
              <p style={{ fontSize: "14px", color: colorTextMuted, marginBottom: "48px" }}>最近更新日期：2026 年 7 月 7 日</p>
              
              <p className="apple-doc-p">
                pppopipupu Inc.（以下简称“我们”）深知您的灵魂指纹与施法隐私对您的重要性。本隐私政策阐明了当您访问和操作 **Spell Lab Pro** 时，我们如何通过网络魔网感应矩阵收集、使用、披露及保护您的奥术波动数据。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>1. 我们收集的奥术数据</h2>
              <p className="apple-doc-p">
                当您进入本法术实验室并释放火球术或操作流体模拟时，我们的页面前端探针将在本地读取您的法力池深度、奥术属性（如：冰霜、火焰、奥术、邪能）以及灵魂印记。这些数据完全留在您的浏览器运行时内解算，主要用于辅助矫正重力场偏角和法力抛物线。
              </p>
              <p className="apple-doc-p">
                {"为了实现特征值的代数隔离并保障量子态不退相干，所有用户的魂力参数都将映射入下列厄米特变换矩阵 $H$ 进行一重加密变换："}
              </p>
              
              {/* LaTeX: 3x3 量子哈密顿厄米特矩阵 */}
              {"$$H = \\begin{pmatrix} E_0 & V_{12} & V_{13} \\\\ V_{12}^* & E_1 & V_{23} \\\\ V_{13}^* & V_{23}^* & E_2 \\end{pmatrix}$$"}

              <p className="apple-doc-p" style={{ marginTop: "24px" }}>
                我们绝不会试图读取您脑海中未吟唱完毕的咒语，也不会扫描您的魔力晶格排序。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>2. 魔晶追踪与本地缓存 (Aether Cookies)</h2>
              <p className="apple-doc-p">
                我们使用以太 Cookies（LocalStorage）来在您的浏览器端保存您的主题偏好。此类数据完全为静态数据，仅供您的终端渲染器使用，绝对不会被上传至达拉然议会或任何第三方广告魔网上。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>3. 灵魂数据保护与第三方合规</h2>
              <p className="apple-doc-p">
                我们承诺，绝对不会将您的施法行为、法术输出日志或法力池消耗记录出售给燃烧军团、暗影议会、巫妖王及其相关的第三方邪能中介机构。
              </p>
              <p className="apple-doc-p">
                {"为了严格数学证明数据绝无溢出与泄漏风险，本隐私空间被约束在以下含时薛定谔概率流密度 $J$ 守恒方程，并确保魔力场波函数概率分布在整个三维闭合流形体积 $V$ 内的三重定积分恒等于 1："}
              </p>

              {/* LaTeX: 含时薛定谔方程概率流密度与三重体积积分 */}
              {"$$J = \\frac{\\hbar}{2mi} \\left( \\psi^* \\nabla \\psi - \\psi \\nabla \\psi^* \\right) \\quad \\text{and} \\quad \\iiint_V |\\psi(\\mathbf{r}, t)|^2 dV = 1$$"}

              <p className="apple-doc-p" style={{ marginTop: "24px" }}>
                这意味着您的施法概率永远在物理意义上绝对守恒，不会发生任何非自然折损或虚空逸散。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>4. 政策变更与公示</h2>
              <p className="apple-doc-p">
                本政策可能伴随大魔导师联合会的最新奥术法典修订而更新。在 4 月 1 日之外访问本页面，隐私政策将退化为普通静态博客存根。
              </p>
            </article>
          )}

          {/* 服务条款 */}
          {view === "terms" && (
            <article className={themeLoaded ? "apple-transition-active" : ""} style={{ color: colorText }}>
              <span style={{ fontSize: "14px", color: colorTextMuted, fontWeight: 600 }}>pppopipupu 秘术实验室</span>
              <h1 style={{ fontSize: "40px", margin: "8px 0 16px 0", lineHeight: 1.1 }}>服务条款</h1>
              <p style={{ fontSize: "14px", color: colorTextMuted, marginBottom: "48px" }}>生效日期：2026 年 7 月 7 日</p>
              
              <p className="apple-doc-p">
                {"欢迎您使用 **Spell Lab Pro**。本服务条款是您与 pppopipupu 秘术实验室之间就访问、体验及操作本站 3D 元胞物理引擎、无限地形以及评论区等功能所订立的契约。"}
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>1. 施法合规与操作规范</h2>
              <p className="apple-doc-p">
                {"本法术实验室属于学术性愚人节娱乐设施。您被授权在本地 Sandbox 运行环境下释放流体法术或生成柏林噪声地形。您在施法时应保持克制，不得利用元胞自动机在本地显存中引起魔力回流。"}
              </p>
              <p className="apple-doc-p">
                {"为了计算法术能量的边界条件并限制奇异发散，所有用户的魔法边界围道积分积分 $\\oint_{\\gamma}$ 必须遵从柯西积分公式和留数定理规范："}
              </p>

              {/* LaTeX: 复变围道积分 */}
              {"$$\\mathcal{R} = f(a) = \\frac{1}{2\\pi i} \\oint_{\\gamma} \\frac{f(z)}{z - a} dz$$"}

              <p className="apple-doc-p" style={{ marginTop: "24px" }}>
                {"如果您的施法路径不幸穿过了闭合围道中的极点，系统将会产生巨大的留数并导致显卡过载。严禁使用本实验室的物理流体溢出机制，在未经联合会授权的情况下擅自召唤上古邪神、地狱猎犬或从事高浓度的邪能冶炼活动。"}
              </p>
              <p className="apple-doc-p">
                {"任何高能粒子或虚拟生物的生成均需遵守狄拉克方程的高能物理自旋 1/2 自适应守恒原理："}
              </p>

              {/* LaTeX: 高能物理狄拉克方程 */}
              {"$$(i\\gamma^\\mu \\partial_\\mu - m)\\psi = 0$$"}

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>2. 法术冷却与聚变消耗循环</h2>
              <p className="apple-doc-p">
                {"本系统内置的“法术冷却周期与魔力衰减”，基于天体物理学中恒星内部 CNO 核聚变循环反应式 进行能量守恒解算，以精确推导每次施放火球术对魔导仪器的内能耗损："}
              </p>

              {/* LaTeX: 恒星 CNO 核反应循环 */}
              {"$$\\begin{aligned} ^{12}\\text{C} + \\text{p} &\\to ^{13}\\text{N} + \\gamma \\\\ ^{13}\\text{N} &\\to ^{13}\\text{C} + e^+ + \\nu_e \\\\ ^{13}\\text{C} + \\text{p} &\\to ^{14}\\text{N} + \\gamma \\\\ ^{14}\\text{N} + \\text{p} &\\to ^{15}\\text{O} + \\gamma \\\\ ^{15}\\text{O} &\\to ^{15}\\text{N} + e^+ + \\nu_e \\\\ ^{15}\\text{N} + \\text{p} &\\to ^{12}\\text{C} + \\alpha \\end{aligned}$$"}

              <p className="apple-doc-p" style={{ marginTop: "24px" }}>
                施法者每一次魔力循环，均会在微观尺度上完成一次完美的碳氮氧核反应模拟，以最大化保证魔法内能解算的热力学效率。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>3. 绝对免责声明</h2>
              <p className="apple-doc-p">
                由于魔法解算对本地 CPU/GPU 的负荷，若因操作员施法过载、手动连击或在不符合规格的古老终端上强制加载 3D 物理晶体，而导致包括但不仅限于：<strong>显卡物理烧毁碳化、键盘受火球术意外灼伤、浏览器崩溃导致的奥术熔断、或者屏幕被虚空裂缝撕裂</strong>等不良后果，pppopipupu Inc. 将不承担任何赔偿及复活灵魂的责任。
              </p>
            </article>
          )}

          {/* 合规信息 */}
          {view === "compliance" && (
            <article className={themeLoaded ? "apple-transition-active" : ""} style={{ color: colorText }}>
              <span style={{ fontSize: "14px", color: colorTextMuted, fontWeight: 600 }}>魔导合规与规范</span>
              <h1 style={{ fontSize: "40px", margin: "8px 0 16px 0", lineHeight: 1.1 }}>法术合规信息</h1>
              <p style={{ fontSize: "14px", color: colorTextMuted, marginBottom: "48px" }}>最新审核年度：2026 年</p>
              
              <p className="apple-doc-p">
                pppopipupu 秘术实验室致力于构建安全、低碳、对初学者友好的奥术交互环境。我们在此公示本实验室所通过的各项魔导行业标准认证：
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>1. 安全施法 2030 环保承诺</h2>
              <p className="apple-doc-p">
                本 Spell Lab Pro 已经通过大魔导师联合会的“安全施法 2030”环保低碳奥术认证。由于我们的 3D 渲染和粒子波动解算完全依赖客户端本地 WebGL/WebGPU 算力，不占用达拉然魔网的云端计算带宽，因此我们的法术释放已实现了 100% 的奥术碳中和。
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>2. 波动衰减与魔力辐射控制</h2>
              <p className="apple-doc-p">
                {"为了防止法力共振产生的三维强辐射对操作员造成精神污染，系统内核对所有渲染波形实施了如波导管衰减方程所示的电磁阻尼修正："}
              </p>

              {/* LaTeX: 魔力共振波动衰减方程 */}
              {"$$\\nabla^2 \\Psi - \\frac{1}{c^2} \\frac{\\partial^2 \\Psi}{\\partial t^2} - \\sigma \\frac{\\partial \\Psi}{\\partial t} = 0$$"}

              <p className="apple-doc-p" style={{ marginTop: "24px" }}>
                {"本实验室的奥术阻尼系数 \\sigma 经过科学配比，确保本地奥术驻波不危害操作员的现实健康。"}
              </p>

              <h2 style={{ fontSize: "24px", margin: "40px 0 16px 0" }}>3. 施法防沉迷与健康指引</h2>
              <p className="apple-doc-p">
                建议在光线充足的奥术工作台前使用本系统。若发生因法力过载产生的眩晕、恶心或幻听，请立即切断与魔网的连接并闭目冥想。
              </p>
            </article>
          )}
        </main>
      )}

      {/* ==================== 9. Footer (Parchment, 64px) ==================== */}
      <footer
        style={{
          backgroundColor: colorCanvasParchment,
          borderTop: isDark ? "1px solid #3d3d3f" : "1px solid #e0e0e0",
          padding: "64px 22px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: colorTextMuted,
          fontSize: "12px",
        }}
        className={themeLoaded ? "apple-transition-active" : ""}
      >
        <div style={{ maxWidth: "1024px", width: "100%" }}>
          
          {/* 页脚细则声明 */}
          <div style={{ paddingBottom: "20px", borderBottom: isDark ? "1px solid #3d3d3f" : "1px solid #d2d2d7", marginBottom: "20px", lineHeight: "1.6" }}>
            <p style={{ margin: "0 0 8px 0" }}>
              * 秘术与流体法术实验室（Spell Laboratory Pro）声明：实验室所有法术数据均基于元胞自动机和本地模拟。操作人员应在专业魔导士监督下运行，严禁在无遮蔽的室内释放高阶火球术或引起浅水模拟溢出。
            </p>
            <p style={{ margin: 0 }}>
              本站所有“产品”售价均为免费。用户可自愿贡献 Star，本站不对因狂热释放火球术而导致的电脑发热等不良影响承担任何法律责任。
            </p>
          </div>

          {/* 页脚链接网格 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            <div>
              <h4 style={{ color: colorText, fontWeight: 600, margin: "0 0 12px 0", fontSize: "12px" }} className={themeLoaded ? "apple-transition-active" : ""}>探索实验室</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><Link href="/spell-lab" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">Spell Lab Pro</Link></li>
                <li><a href="#fluid-simulation" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">流体引擎</a></li>
                <li><a href="#infinite-terrain" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">柏林地形</a></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: colorText, fontWeight: 600, margin: "0 0 12px 0", fontSize: "12px" }} className={themeLoaded ? "apple-transition-active" : ""}>联谊平台</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><a href="https://steamcommunity.com/profiles/76561199106950429/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">Steam 联组</a></li>
                <li><a href="https://www.mcmod.cn/author/31246.html" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">MCMOD 论坛</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: colorText, fontWeight: 600, margin: "0 0 12px 0", fontSize: "12px" }} className={themeLoaded ? "apple-transition-active" : ""}>pppopipupu 博客</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><Link href="/articles/first" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">关于我 (Who am I)</Link></li>
                <li><a href="https://github.com/pppopipupu/pppopipupu_blog" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="apple-btn">GitHub 源码</a></li>
              </ul>
            </div>
          </div>

          {/* 底部微型版权声明 */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", color: colorTextMuted }} className={themeLoaded ? "apple-transition-active" : ""}>
            <span>Copyright © 2026 pppopipupu Inc. 保留所有施法权利。</span>
            <div style={{ display: "flex", gap: "12px" }}>
              <span onClick={() => navigateToView("privacy")} style={{ cursor: "pointer", color: "inherit" }} className="apple-btn">隐私政策</span>
              <span onClick={() => navigateToView("terms")} style={{ cursor: "pointer", color: "inherit" }} className="apple-btn">服务条款</span>
              <span onClick={() => navigateToView("compliance")} style={{ cursor: "pointer", color: "inherit" }} className="apple-btn">法术合规信息</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
