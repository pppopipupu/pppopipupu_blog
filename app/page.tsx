"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

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
        fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif",
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
            <th>Linkz</th>
            <th>Info</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="https://www.mcmod.cn/author/31246.html">MCMOD</a></td>
            <td>我的mcmod作者页😡</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
