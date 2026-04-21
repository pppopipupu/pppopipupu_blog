"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Giscus from "@giscus/react";

function RotatingGradientText() {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime);
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 10);
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
        <Center>
          <Text3D
            font="https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json"
            size={2}
            height={0.5}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.1}
            bevelSize={0.05}
            bevelOffset={0}
            bevelSegments={5}
          >
            pppopipupu
            <meshStandardMaterial 
              ref={materialRef}
              color="#ffffff" 
              roughness={0.2} 
              metalness={0.8} 
              emissive="#ffd700"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </Text3D>
        </Center>
      </Float>
    </group>
  );
}

export default function Home() {
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

      <div style={{ width: "100%", height: "400px", margin: "20px 0" }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[-10, 0, 0]} intensity={2.0} color="#ff0040" />
          <directionalLight position={[10, 0, 0]} intensity={2.0} color="#0080ff" />
          <directionalLight position={[0, -10, 0]} intensity={2.0} color="#80ff80" />
          <directionalLight position={[0, 10, 0]} intensity={2.0} color="#ffff00" />
          <React.Suspense fallback={null}>
            <RotatingGradientText />
            <EffectComposer>
              <Bloom luminanceThreshold={1.2} luminanceSmoothing={0.9} intensity={2.5} mipmapBlur />
            </EffectComposer>
          </React.Suspense>
        </Canvas>
      </div>

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
        </tbody>
      </table>

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
          mapping="pathname"
          term="Welcome to @giscus/react component!"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme="https://pppopipupu.github.io/pppopipupu_blog/giscus-y2k.css"
          lang="zh-CN"
          loading="lazy"
        />
      </div>
    </div>
  );
}
