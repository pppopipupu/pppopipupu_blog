"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import AngryButton3D from "@/components/AngryButton3D";

function GameTitle() {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 8);
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={3} rotationIntensity={0.3} floatIntensity={1.5}>
        <Center>
          <Text3D
            font="https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json"
            size={3}
            height={0.8}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.15}
            bevelSize={0.08}
            bevelOffset={0}
            bevelSegments={5}
          >
            GAME
            <meshStandardMaterial 
              ref={materialRef}
              color="#ff00ff" 
              roughness={0.1} 
              metalness={0.9} 
              emissive="#ff0040"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </Text3D>
        </Center>
      </Float>
    </group>
  );
}

export default function GamePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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
        overflow: "auto"
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
          @keyframes scanline {
            0% { top: 0; }
            100% { top: 100%; }
          }
          .scanline-overlay {
            pointer-events: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15) 0px,
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 3px
            );
            z-index: 999;
          }
          a:link { color: #0000ff; text-decoration: underline; }
          a:visited { color: #800080; text-decoration: underline; }
          a:hover { color: #ff0000; text-decoration: none; cursor: crosshair; }
          .github-login-btn {
            border: 3px outset #00ff00;
            background-color: #008000;
            color: #000000;
            font-weight: bold;
            font-size: 1.2rem;
            padding: 12px 30px;
            cursor: crosshair;
            text-transform: uppercase;
            font-family: inherit;
          }
          .github-login-btn:hover {
            background-color: #00aa00;
            border-style: inset;
          }
          .logout-btn {
            border: 3px outset #ff0000;
            background-color: #800000;
            color: #ffff00;
            font-weight: bold;
            font-size: 1rem;
            padding: 8px 20px;
            cursor: crosshair;
            text-transform: uppercase;
            font-family: inherit;
          }
          .logout-btn:hover {
            background-color: #aa0000;
            border-style: inset;
          }
          .user-card {
            border: 4px outset #ff00ff;
            background-color: #000066;
            padding: 20px;
            text-align: center;
            box-shadow: 6px 6px 0px #00ffff;
          }
          .user-avatar {
            border: 3px outset #00ffff;
            image-rendering: pixelated;
          }
        `
      }} />

      <div className="scanline-overlay" />

      <div style={{ width: "100%", height: "350px", margin: "0 0 20px 0" }}>
        <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
          <ambientLight intensity={0.1} />
          <directionalLight position={[-10, 0, 5]} intensity={3.0} color="#ff00ff" />
          <directionalLight position={[10, 0, 5]} intensity={3.0} color="#00ffff" />
          <directionalLight position={[0, -10, 5]} intensity={2.0} color="#ff0000" />
          <directionalLight position={[0, 10, 5]} intensity={2.0} color="#ffff00" />
          <React.Suspense fallback={null}>
            <GameTitle />
            <EffectComposer>
              <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} intensity={3.0} mipmapBlur />
            </EffectComposer>
          </React.Suspense>
        </Canvas>
      </div>

      <div style={{
        border: "5px outset #ff00ff",
        backgroundColor: "#000080",
        padding: "30px",
        width: "80%",
        maxWidth: "800px",
        textAlign: "center",
        boxShadow: "8px 8px 0px #00ffff",
        marginBottom: "30px"
      }}>
        <h2 className="blink-text" style={{ color: "#ffff00", fontSize: "2rem", margin: "0 0 15px 0", textShadow: "3px 3px #ff0000" }}>
          🕹️ 安格瑞的冒险传说 🕹️
        </h2>

        {loading ? (
          <p className="rainbow-text" style={{ fontSize: "1.5rem" }}>
            读取中...
          </p>
        ) : user ? (
          <div>
            <div className="user-card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="avatar"
                    width={60}
                    height={60}
                    className="user-avatar"
                  />
                )}
                <div>
                  <p style={{ color: "#00ff00", fontSize: "1rem", margin: "0 0 5px 0" }}>
                    ✅ 已登录 NB USER LOGIN IS READY YOU MUST ENTER THE DEEP DARK WORLD RIGHT NOW!!!!!!!!
                  </p>
                  <p style={{ color: "#ffff00", fontSize: "1.3rem", margin: "0", fontWeight: "bold" }}>
                    {user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.email}
                  </p>
                </div>
              </div>
            </div>

            <AngryButton3D userId={user.id} />

            <p className="rainbow-text" style={{ fontSize: "1.5rem", margin: "0 0 20px 0" }}>
              ★ 对不起，真正最牛逼的游戏还没有完成，但您可以先试一下这个同样牛逼安格瑞按钮游戏，记录点击次数，支持跨平台存档，点的越多越牛逼，还有多周目机制 ★
            </p>
            <button onClick={handleLogout} className="logout-btn">
              🚪 登出 LOGOUT
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: "#00ff00", fontSize: "1.2rem", margin: "0 0 15px 0" }}>
              投币继续 INSERT COIN...
            </p>
            <div style={{
              border: "3px inset #ff00ff",
              backgroundColor: "#000044",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <p style={{ color: "#ffff00", fontSize: "1rem", margin: "0 0 10px 0" }}>
                🔒 需要登录才能游玩 🔒
              </p>
              <p style={{ color: "#00cccc", fontSize: "0.85rem", margin: "0 0 20px 0" }}>
                使用GitHub账号登录以解锁全宇宙最牛逼的游戏
              </p>
              <button onClick={handleGithubLogin} className="github-login-btn">
                🐙 使用GitHub登录
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginBottom: "50px" }}>
        <Link href="/">[ 返回主页 ]</Link>
      </p>
    </div>
  );
}
