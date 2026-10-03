"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Giscus from "@giscus/react";
import DynamicLLMPlayground from "../components/DynamicLLMPlayground";
import MainFool from "../components/MainFool";
import DynamicCozyRoom from "../components/cozy-room/DynamicCozyRoom";
import DynamicThunderExperience from "../components/thunder/DynamicThunderExperience";
import DynamicIntroPrelude from "@/components/intro/DynamicIntroPrelude";
import type { IntroTarget } from "@/components/intro/DynamicIntroPrelude";
import { INTRO_OVERLAY_Z_INDEX } from "@/components/intro/introConfig";
import {
  HERO_CAMERA,
  HERO_EMISSIVE_BASE,
  HERO_MATERIAL,
  HERO_TEXT,
  TEXT3D_FONT_URL,
  TEXT3D_FRONT_OFFSET,
  TEXT3D_GEOMETRY,
  visibleWorldHeight,
} from "@/lib/heroText";

// Landing-page hero word, built from lib/heroText.ts so the intro prelude can morph its letters
// onto this exact word and cross-fade without a pop.
//
// `spin` gates the animation and anchors its clock at zero: until the intro hands off (or when the
// intro is disabled) the word sits at the identity pose the intro morphs onto.
function RotatingGradientText({
  spin,
  onMeasure,
}: {
  spin: boolean;
  onMeasure?: (metrics: { width: number; height: number }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const driftRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const spinStart = useRef<number | null>(null);

  React.useLayoutEffect(() => {
    if (!onMeasure) return;
    const geometry = textRef.current?.geometry;
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (box) onMeasure({ width: box.max.x - box.min.x, height: box.max.y - box.min.y });
  }, [onMeasure]);

  useFrame((state) => {
    if (spin) {
      if (spinStart.current === null) spinStart.current = state.clock.elapsedTime;
    } else {
      spinStart.current = null;
    }
    const t = spinStart.current === null ? 0 : state.clock.elapsedTime - spinStart.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t);
      groupRef.current.position.y = Math.sin(t * 2) * 1.5;
    }
    if (driftRef.current) {
      // Hand-rolled instead of drei's <Float>: the same drift amplitudes, but phase-anchored at
      // t = 0 (Float starts from a random phase) so the intro handoff lands on the identity pose.
      driftRef.current.rotation.x = Math.sin(t / 2) / 16;
      driftRef.current.rotation.y = Math.sin(t / 2) / 16;
      driftRef.current.rotation.z = Math.sin(t / 2) / 40;
      driftRef.current.position.y = Math.sin(t / 2) / 5;
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = HERO_EMISSIVE_BASE + Math.sin(t * 10);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={driftRef}>
        <Center>
          <Text3D ref={textRef} font={TEXT3D_FONT_URL} {...TEXT3D_GEOMETRY}>
            {HERO_TEXT}
            <meshStandardMaterial
              ref={materialRef}
              {...HERO_MATERIAL}
              emissiveIntensity={HERO_EMISSIVE_BASE}
              toneMapped={false}
            />
          </Text3D>
        </Center>
      </group>
    </group>
  );
}

// Landing-page intro preference: "on" (default) plays the boot sequence on every load, "off" skips
// it. Stored locally and owned by the top-left drawer next to the replay button.
const INTRO_SETTING_KEY = "pppopipupu.intro-enabled";

export default function Home() {
  const [isLLMActive, setIsLLMActive] = React.useState(false);
  const [isAprilFools, setIsAprilFools] = React.useState(false);
  // null = preference not read yet (first paint shows a black plate so the page never flashes).
  const [introEnabled, setIntroEnabled] = useState<boolean | null>(null);
  const [introRun, setIntroRun] = useState(0);
  const [introFinished, setIntroFinished] = useState(false);
  const [canvasSpin, setCanvasSpin] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const heroMetrics = useRef<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const today = new Date();
    if (today.getMonth() === 3 && today.getDate() === 1) {
      setIsAprilFools(true);
    }
  }, []);

  useEffect(() => {
    const enabled = window.localStorage.getItem(INTRO_SETTING_KEY) !== "off";
    setIntroEnabled(enabled);
    setCanvasSpin(!enabled);
    setIntroFinished(!enabled);
    if (enabled) window.scrollTo(0, 0);
  }, []);

  const measureHeroText = useCallback((metrics: { width: number; height: number }) => {
    heroMetrics.current = metrics;
  }, []);

  // Screen rect the intro has to morph its word onto: the canvas box plus the hero word's own
  // world-space size projected through the canvas camera (same fov/z as the intro's).
  const getIntroTarget = useCallback((): IntroTarget | null => {
    const wrap = canvasWrapRef.current;
    const metrics = heroMetrics.current;
    if (!wrap || !metrics) return null;
    const rect = wrap.getBoundingClientRect();
    // Measure at the word's front face: that is the outline the eye sees, and the plane the intro
    // morphs its own front face onto.
    const pixelsPerWorld = rect.height / visibleWorldHeight(HERO_CAMERA.fov, HERO_CAMERA.z - TEXT3D_FRONT_OFFSET);
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: metrics.width * pixelsPerWorld,
      height: metrics.height * pixelsPerWorld,
    };
  }, []);

  const startIntro = useCallback(() => {
    setIntroFinished(false);
    setCanvasSpin(false);
    setIntroRun((run) => run + 1);
    window.scrollTo(0, 0);
  }, []);

  const handleIntroHandoff = useCallback(() => setCanvasSpin(true), []);
  const handleIntroFinish = useCallback(() => setIntroFinished(true), []);

  const toggleIntro = useCallback(() => {
    const next = introEnabled !== true;
    window.localStorage.setItem(INTRO_SETTING_KEY, next ? "on" : "off");
    setIntroEnabled(next);
    if (next) {
      startIntro();
    } else {
      setIntroFinished(true);
      setCanvasSpin(true);
    }
  }, [introEnabled, startIntro]);

  const showIntro = introEnabled === true && !introFinished && !isAprilFools;

  if (isAprilFools) {
    return <MainFool />;
  }

  return (
    <div
      style={{
        backgroundColor: "#000000",
        backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMBAC1PQQX268vAAAAAElFTkSuQmCC')",
        backgroundRepeat: "repeat",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "50px",
        color: "#00ff00",
        overflow: "hidden"
      }}
    >
      {introEnabled === null && (
        // Preference still unknown: hold the page behind the same black plate the intro starts on.
        <div style={{ position: "fixed", inset: 0, zIndex: INTRO_OVERLAY_Z_INDEX + 1, backgroundColor: "#000000" }} />
      )}
      {showIntro && (
        <DynamicIntroPrelude
          key={introRun}
          getTarget={getIntroTarget}
          onHandoff={handleIntroHandoff}
          onFinish={handleIntroFinish}
        />
      )}
      <DynamicThunderExperience />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          .blink-text {
            animation: blink 0.5s infinite;
          }
          @keyframes rainbow {
            0% { color: #ff0000; }
            20% { color: #ffff00; }
            40% { color: #00ff00; }
            60% { color: #00ffff; }
            80% { color: #0000ff; }
            100% { color: #ff00ff; }
          }
          .rainbow-text {
            animation: rainbow 1s linear infinite;
            text-shadow: 2px 2px 0px #000, 4px 4px 0px #fff;
          }
          .marquee-container {
            width: 80%;
            overflow: hidden;
            white-space: nowrap;
            background-color: blue;
            color: yellow;
            border: 3px solid red;
            padding: 5px;
            margin-bottom: 20px;
          }
          .marquee-text {
            display: inline-block;
            padding-left: 100%;
            animation: marquee 10s linear infinite;
          }
          @keyframes marquee {
            0%   { transform: translate(0, 0); }
            100% { transform: translate(-100%, 0); }
          }
          table {
            border: 5px outset #ff00ff;
            background-color: #000080;
            color: #ffffff;
          }
          td, th {
            border: 2px inset #00ffff;
            padding: 10px;
          }
          a:link { color: #0000ff; text-decoration: underline; }
          a:visited { color: #800080; text-decoration: underline; }
          a:hover { color: #ff0000; text-decoration: none; cursor: crosshair; }
          .article-table {
            border: 5px outset #FE0000;
            background-color: #E000E4;
            color: #FE0000;
          }
          .article-table td, .article-table th {
            border: 2px inset #FE0000;
          }
          /* Pinned article row: deep black and white, echoing the monochrome article it links to.
             The other rows keep the magenta/blood-red .article-table look. */
          .article-row-mono td {
            background-color: #000000;
            background-image: radial-gradient(circle at 50% 45%, #1c1c1c, #000000 72%);
            color: #ffffff;
            border: 2px inset #ffffff;
          }
          .article-row-mono a:link,
          .article-row-mono a:visited {
            color: #ffffff;
            text-decoration: underline;
          }
          .article-row-mono a:hover {
            color: #000000;
            background-color: #ffffff;
            text-decoration: none;
            cursor: crosshair;
          }
          @keyframes bounceX {
            0% { left: -30px; }
            100% { left: 30px; }
          }
          @keyframes bounceY {
            0% { top: -15px; }
            100% { top: 15px; }
          }
          .bouncing-text {
            display: inline-block;
            position: relative;
            animation-name: bounceX, bounceY;
            animation-timing-function: linear, linear;
            animation-iteration-count: infinite, infinite;
            animation-direction: alternate, alternate;
          }

          /* Intro controls: the tab is always there, the buttons slide out on hover or focus. */
          .intro-drawer-body {
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            padding-left: 0;
            transition: max-width 0.22s ease, opacity 0.22s ease, padding-left 0.22s ease;
          }
          .intro-drawer:hover .intro-drawer-body,
          .intro-drawer:focus-within .intro-drawer-body {
            max-width: 420px;
            opacity: 1;
            padding-left: 8px;
          }
          .intro-drawer:hover .intro-drawer-tab,
          .intro-drawer:focus-within .intro-drawer-tab {
            color: #ffffff;
            box-shadow: 3px 3px 0 #ff2a4d, 0 0 12px #00ffd0;
          }
          /* No hover to speak of: keep the drawer open so the buttons stay reachable. */
          @media (hover: none) {
            .intro-drawer-body {
              max-width: 420px;
              opacity: 1;
              padding-left: 8px;
            }
          }
        `
      }} />

      <h1
        className="rainbow-text"
        style={{
          fontSize: "6rem",
          fontWeight: "bold",
          textAlign: "center",
          margin: "0 0 20px 0",
          textTransform: "uppercase"
        }}
      >
        Angry rule world
      </h1>

      <div className="marquee-container">
        <span className="marquee-text">WELCOME TO MY AWESOME HOMEPAGE!!! DIVE IN TO THE ANGRY PARADISE!!!</span>
      </div>

      <h2 className="blink-text" style={{ color: "#ff00ff", fontSize: "2rem" }}>
        WIP!!!!!!
      </h2>

      <div ref={canvasWrapRef} style={{ width: "100%", height: "400px", margin: "20px 0" }}>
        <Canvas camera={{ position: [0, 0, HERO_CAMERA.z], fov: HERO_CAMERA.fov }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[-10, 0, 0]} intensity={2.0} color="#ff0040" />
          <directionalLight position={[10, 0, 0]} intensity={2.0} color="#0080ff" />
          <directionalLight position={[0, -10, 0]} intensity={2.0} color="#80ff80" />
          <directionalLight position={[0, 10, 0]} intensity={2.0} color="#ffff00" />
          <React.Suspense fallback={null}>
            <RotatingGradientText spin={canvasSpin} onMeasure={measureHeroText} />
            <EffectComposer>
              <Bloom luminanceThreshold={1.2} luminanceSmoothing={0.9} intensity={2.5} mipmapBlur />
            </EffectComposer>
          </React.Suspense>
        </Canvas>
      </div>

      {/* Intro controls: top-left drawer, collapsed until hovered so the page keeps its layout. */}
      {introEnabled !== null && (
        <div
          className="intro-drawer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "flex-start",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          <div
            className="intro-drawer-tab"
            style={{
              border: "3px outset #00ffff",
              borderLeft: "none",
              borderTop: "none",
              background: "linear-gradient(135deg, #001f26 0%, #003a44 60%, #001f26 100%)",
              boxShadow: "3px 3px 0 #ff2a4d",
              padding: "5px 10px 5px 8px",
              color: "#00ffd0",
              fontSize: "0.8rem",
              letterSpacing: "0.16em",
              textShadow: "0 0 8px #00ffd0, 1px 1px 0 #000",
              cursor: "crosshair",
              userSelect: "none",
            }}
          >
            ▸ INTRO
          </div>
          <div
            className="intro-drawer-body"
            style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "crosshair" }}
          >
            <button
              type="button"
              onClick={startIntro}
              style={{
                flex: "0 0 auto",
                whiteSpace: "nowrap",
                border: "3px outset #ff2a4d",
                background: "linear-gradient(135deg, #2a0006 0%, #6b0014 55%, #2a0006 100%)",
                boxShadow: "3px 3px 0 #00ffff",
                padding: "5px 14px",
                color: "#ffe9ec",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textShadow: "0 0 10px #ff003c, 1px 1px 0 #000",
                cursor: "crosshair",
              }}
            >
              ▶ 重播 / REPLAY
            </button>
            <button
              type="button"
              onClick={toggleIntro}
              aria-pressed={!introEnabled}
              style={{
                flex: "0 0 auto",
                whiteSpace: "nowrap",
                border: "3px inset #00ffff",
                backgroundColor: "#000044",
                color: "#00ffd0",
                padding: "5px 14px",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                letterSpacing: "0.12em",
                textShadow: "0 0 8px #00ffd0, 1px 1px 0 #000",
                cursor: "crosshair",
              }}
            >
              {introEnabled ? "禁用 / DISABLE" : "启用 / ENABLE"}
            </button>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th><span className="bouncing-text" style={{ animationDuration: '0.42s, 0.58s', animationDelay: '-0.1s, -0.3s' }}>Linkz</span></th>
            <th><span className="bouncing-text" style={{ animationDuration: '0.37s, 0.49s', animationDelay: '-0.4s, -0.2s' }}>Info</span></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="bouncing-text" style={{ animationDuration: '0.51s, 0.38s', animationDelay: '-0.2s, -0.6s' }}><a href="https://www.mcmod.cn/author/31246.html">MCMOD</a></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.45s, 0.61s', animationDelay: '-0.5s, -0.1s' }}>我的mcmod作者页😡</span></td>
          </tr>
          <tr>
            <td><span className="bouncing-text" style={{ animationDuration: '0.51s, 0.38s', animationDelay: '-0.2s, -0.6s' }}><a href="https://steamcommunity.com/profiles/76561199106950429/">STEAM</a></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.45s, 0.61s', animationDelay: '-0.5s, -0.1s' }}>我的steam，快来加我好友😡</span></td>
          </tr>
          <tr>
            <td><span className="bouncing-text" style={{ animationDuration: '0.47s, 0.42s', animationDelay: '-0.3s, -0.7s' }}><a href="https://github.com/pppopipupu/pppopipupu_blog">GITHUB</a></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.39s, 0.55s', animationDelay: '-0.6s, -0.4s' }}>本站源码，给我star😡</span></td>
          </tr>
        </tbody>
      </table>

      {/* 静态 Y2K SECRET 按钮（无动效，珠光金属质感） */}
      <div style={{ marginTop: "20px", marginBottom: "15px", textAlign: "center" }}>
        <Link href="/secret" style={{ textDecoration: "none" }}>
          <div
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #ffffff 0%, #ff80df 25%, #00ffff 50%, #ffff80 75%, #ffffff 100%)",
              border: "4px outset #ffffff",
              padding: "10px 28px",
              cursor: "crosshair",
              boxShadow: "4px 4px 0px #ff00ff, 8px 8px 0px #00ffff",
              color: "#000000",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "1.2rem",
              fontWeight: "900",
              letterSpacing: "0.15em",
              textShadow: "1px 1px 0px #ffffff"
            }}
          >
            ✧ SECRET ✧
          </div>
        </Link>
      </div>


      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spell-twitch {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(15deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(-15deg); }
            100% { transform: rotate(0deg); }
          }
          .spell-twitch {
            display: inline-block;
            animation: spell-twitch 0.2s ease-in-out infinite;
            transform-origin: center center;
          }
        `
      }} />

      <h2 className="blink-text" style={{ color: "#ffff00", fontSize: "2rem", marginTop: "40px", textShadow: "2px 2px #ff0000" }}>
        🔥🔥🔥 安格瑞法术实验室 🔥🔥🔥
      </h2>
      <div style={{
        border: "5px outset #ff00ff",
        backgroundColor: "#000080",
        width: "80%",
        maxWidth: "800px",
        textAlign: "center",
        padding: "15px",
        marginBottom: "30px",
        boxShadow: "6px 6px 0px #00ffff"
      }}>
        <Link href="/spell-lab" style={{ textDecoration: "none" }}>
          <div style={{
            border: "3px inset #00ffff",
            backgroundColor: "#000044",
            padding: "20px",
            cursor: "crosshair"
          }}>
            <div className="spell-twitch">
              <p className="rainbow-text" style={{ fontSize: "2rem", margin: "0 0 10px 0", fontWeight: "bold" }}>
                ▶ 安格瑞法术实验室 ◀
              </p>
              <p style={{ color: "#ffff00", margin: 0, fontSize: "1rem" }}>
                😡 来释放火球术吧！ 😡
              </p>
            </div>
          </div>
        </Link>
      </div>

      <h2 className="blink-text" style={{ color: "#00ffff", fontSize: "2rem", marginTop: "40px", textShadow: "2px 2px #ff00ff" }}>
        🕹️🕹️🕹️ 超牛逼的好玩游戏，快来玩 🕹️🕹️🕹️
      </h2>
      <div style={{
        border: "5px outset #ff00ff",
        backgroundColor: "#000080",
        width: "80%",
        maxWidth: "800px",
        textAlign: "center",
        padding: "15px",
        marginBottom: "30px",
        boxShadow: "6px 6px 0px #00ffff"
      }}>
        <Link href="/games" style={{ textDecoration: "none" }}>
          <div style={{
            border: "3px inset #00ffff",
            backgroundColor: "#000044",
            padding: "20px",
            cursor: "crosshair"
          }}>
            <p className="rainbow-text" style={{ fontSize: "2rem", margin: "0 0 10px 0", fontWeight: "bold" }}>
              ▶ 点我，求你了 ◀
            </p>
            <p style={{ color: "#ffff00", margin: 0, fontSize: "1rem" }}>
              😡 NB GAME MUST PLAY 😡
            </p>
          </div>
        </Link>
      </div>

      <h2 className="blink-text" style={{ color: "#ffff00", fontSize: "2rem", marginTop: "40px", textShadow: "2px 2px #ff0000" }}>
        ★★★ My Articles ★★★
      </h2>
      <table className="article-table" style={{ marginBottom: "50px", width: "80%", maxWidth: "800px", textAlign: "center" }}>
        <thead>
          <tr>
            <th><span className="bouncing-text" style={{ animationDuration: '0.41s, 0.53s', animationDelay: '-0.3s, -0.4s' }}>Date</span></th>
            <th><span className="bouncing-text" style={{ animationDuration: '0.55s, 0.39s', animationDelay: '-0.6s, -0.2s' }}>Title</span></th>
            <th><span className="bouncing-text" style={{ animationDuration: '0.46s, 0.62s', animationDelay: '-0.1s, -0.7s' }}>Info</span></th>
          </tr>
        </thead>
        <tbody>
          <tr className="article-row-mono">
            <td><span className="bouncing-text" style={{ animationDuration: '0.44s, 0.36s', animationDelay: '-0.2s, -0.5s' }}>2026-09-24</span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.41s, 0.57s', animationDelay: '-0.6s, -0.2s' }}><Link href="/articles/second"><b>[置顶]</b> root手机的混沌之路</Link></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.53s, 0.44s', animationDelay: '-0.3s, -0.8s' }}>此博客的第一篇正经文章，燃烧我100吨精血凝聚而成，阅读指数：超越之前的所有文章</span></td>
          </tr>
          <tr>
            <td><span className="bouncing-text" style={{ animationDuration: '0.38s, 0.47s', animationDelay: '-0.7s, -0.3s' }}>2026-04-20</span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.62s, 0.41s', animationDelay: '-0.2s, -0.5s' }}><Link href="/articles/first">第一篇文章！<b>Who am I</b></Link></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.43s, 0.59s', animationDelay: '-0.8s, -0.1s' }}>推荐阅读指数：★★★★★ Masterpiece！真正的大师之作！</span></td>
          </tr>
          <tr>
            <td><span className="bouncing-text" style={{ animationDuration: '0.52s, 0.36s', animationDelay: '-0.4s, -0.9s' }}>2026-04-18</span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.49s, 0.65s', animationDelay: '-0.5s, -0.2s' }}><a href="#">如何制作一个安格瑞的网页😡</a></span></td>
            <td><span className="bouncing-text" style={{ animationDuration: '0.58s, 0.42s', animationDelay: '-0.1s, -0.8s' }}>更多闪烁！更多彩色！拒绝现代Web设计！</span></td>
          </tr>
        </tbody>
      </table>

      {/* AI 本地大模型 对话区 */}
      <div style={{
        width: "80%",
        maxWidth: "800px",
        border: "5px outset #ff00ff",
        backgroundColor: "#000080",
        padding: "20px",
        marginBottom: "50px",
        boxShadow: "10px 10px 0px #00ffff"
      }}>
        <h2 className="rainbow-text blink-text" style={{
          fontSize: "2.5rem",
          textAlign: "center",
          margin: "0 0 20px 0",
          textTransform: "uppercase"
        }}>
          VERY NB LLM CHAT PLAYGROUND
        </h2>
        {isLLMActive ? (
          <DynamicLLMPlayground />
        ) : (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <button
              onClick={() => setIsLLMActive(true)}
              style={{
                border: "5px outset #ff00ff",
                backgroundColor: "#0a0040",
                padding: "20px 40px",
                cursor: "crosshair",
                textAlign: "center",
                boxShadow: "6px 6px 0px #00ffff, inset 0 0 30px rgba(255,0,255,0.15)",
                width: "100%",
                maxWidth: "500px"
              }}
            >
              <span className="blink-text" style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#ffff00",
                textShadow: "3px 3px 0px #ff0000, -2px -2px 0px #00ffff, 0 0 20px #ff00ff",
                letterSpacing: "0.15em",
              }}>
                ⚡ BOOTUP LOCAL LLM ENGINE ⚡
              </span>
            </button>
            <p style={{ color: "#00ff00", marginTop: "15px", fontSize: "0.9rem" }}>
              WARNING: Booting the system will prepare local transformers runtime & WebGPU.
            </p>
          </div>
        )}
      </div>

      <div style={{
        width: "80%",
        maxWidth: "800px",
        border: "5px outset #00ffff",
        backgroundColor: "#000080",
        padding: "20px",
        marginBottom: "50px",
        boxShadow: "10px 10px 0px #ff00ff"
      }}>
        <h2 className="rainbow-text blink-text" style={{
          fontSize: "2.5rem",
          textAlign: "center",
          margin: "0 0 20px 0",
          textTransform: "uppercase"
        }}>
          GUESTBOOK
        </h2>
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
          theme="https://pppopipupu.github.io/pppopipupu_blog/giscus-y2k.css"
          lang="zh-CN"
          loading="lazy"
        />
      </div>

      {/* 3D 低多边形卧室(懒加载,滚动到视口附近才加载) */}
      <DynamicCozyRoom />

      {/*/!* 警告区与空白占位区 *!/*/}
      {/*<div style={{*/}
      {/*  marginTop: "100px",*/}
      {/*  marginBottom: "20px",*/}
      {/*  display: "flex",*/}
      {/*  flexDirection: "column",*/}
      {/*  alignItems: "center",*/}
      {/*  justifyContent: "center",*/}
      {/*  width: "80%",*/}
      {/*  maxWidth: "800px",*/}
      {/*  textAlign: "center"*/}
      {/*}}>*/}
      {/*  <p className="blink-text" style={{*/}
      {/*    color: "#ff0000",*/}
      {/*    fontSize: "2rem",*/}
      {/*    fontWeight: "bold",*/}
      {/*    textShadow: "2px 2px 0px #000",*/}
      {/*    margin: "0 0 12px 0",*/}
      {/*    fontFamily: "monospace"*/}
      {/*  }}>*/}
      {/*    ⚠ WARNING // DANGER ZONE ⚠*/}
      {/*  </p>*/}
      {/*  <p style={{*/}
      {/*    color: "#ffff00",*/}
      {/*    fontSize: "1.1rem",*/}
      {/*    fontWeight: "bold",*/}
      {/*    fontFamily: "monospace",*/}
      {/*    lineHeight: "1.6",*/}
      {/*    margin: "0"*/}
      {/*  }}>*/}
      {/*    警告：下方为Archive区，非战斗人员请撤离。*/}
      {/*  </p>*/}
      {/*</div>*/}

      {/*/!* 巨大的空白延伸区 *!/*/}
      {/*<div style={{ height: "60vh" }} />*/}

      {/*/!* ARCHIVE PORTAL (LAZY-LOADED) *!/*/}
      {/*<DynamicArchivePortal />*/}
    </div>
  );
}
