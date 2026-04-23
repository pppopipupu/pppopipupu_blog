"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text3D, Center, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function OrbitingCount({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime * 0.6;
      groupRef.current.position.x = Math.cos(t) * 6;
      groupRef.current.position.z = Math.sin(t) * 6;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.5 + 1;
      groupRef.current.rotation.y = -t + Math.PI;
    }
  });

  return (
    <group ref={groupRef} position={[6, 1, 0]}>
      <Center>
        <Text3D
          font="https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json"
          size={1.2}
          height={0.3}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.04}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={3}
        >
          {count.toString()}
          <meshStandardMaterial color="#ffff00" emissive="#ffaa00" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} toneMapped={false} />
        </Text3D>
      </Center>
    </group>
  );
}

function PressArm({ isPressed }: { isPressed: boolean }) {
  const armRef = useRef<THREE.Group>(null);
  const targetY = useRef(5.5);
  const currentY = useRef(5.5);

  useEffect(() => {
    if (isPressed) {
      targetY.current = 0.5;
      setTimeout(() => {
        targetY.current = 5.5;
      }, 100);
    }
  }, [isPressed]);

  useFrame(() => {
    if (armRef.current) {
      currentY.current = THREE.MathUtils.lerp(currentY.current, targetY.current, 0.4);
      armRef.current.position.y = currentY.current;
    }
  });

  return (
    <group ref={armRef} position={[0, 8, 0]}>
      <mesh>
        <boxGeometry args={[1.5, 6, 1.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#222222" metalness={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[0, -3.2, 0]}>
        <boxGeometry args={[2.0, 0.8, 2.0]} />
        <meshStandardMaterial color="#dddddd" emissive="#111111" metalness={0.6} roughness={0.1} />
      </mesh>
    </group>
  );
}

const ADJECTIVES = [
  "PUNY", "CLUMSY", "PITIFUL", "AWKWARD", "USELESS", "PATHETIC", "FEEBLE", "WEAK",
  "HOPEFUL", "EAGER", "STEADY", "WILLING", "CAPABLE", "SKILLED", "PRACTICED", "SEASONED",
  "RECKLESS", "DANGEROUS", "BATTLE-SCARRED", "BLOODTHIRSTY", "RUTHLESS", "MERCILESS",
  "FEARLESS", "VALIANT", "HEROIC", "GLORIOUS", "RENOWNED", "FAMOUS", "LEGENDARY",
  "EXALTED", "MYTHIC", "SUPREME", "TRANSCENDENT", "OMNIPOTENT", "GODLIKE",
  "ABSOLUTE", "INFINITE", "ETERNAL", "COSMIC", "UNIVERSAL", "ASTRAL",
  "DIMENSIONAL", "ALMIGHTY", "UNSTOPPABLE", "UNBREAKABLE", "INVINCIBLE",
  "SUPERNAL", "CELESTIAL", "DIVINE", "ULTIMATE"
];

const NOUNS = [
  { text: "COMMONER", color: "#ffffff", emissive: "#888888", intensity: 0.8 },
  { text: "PEASANT", color: "#dddddd", emissive: "#aaaaaa", intensity: 0.8 },
  { text: "SQUIRE", color: "#bbbbbb", emissive: "#888888", intensity: 0.8 },
  { text: "APPRENTICE", color: "#aaffaa", emissive: "#55aa55", intensity: 0.8 },
  { text: "NOVICE", color: "#55ff55", emissive: "#008800", intensity: 0.8 },
  { text: "ACOLYTE", color: "#55ffaa", emissive: "#008855", intensity: 0.8 },
  { text: "INITIATE", color: "#55ff55", emissive: "#008800", intensity: 0.8 },
  { text: "JOURNEYMAN", color: "#aaff55", emissive: "#55aa00", intensity: 0.8 },
  { text: "ADVENTURER", color: "#ffff55", emissive: "#aaaa00", intensity: 0.8 },
  { text: "VETERAN", color: "#ffaa55", emissive: "#aa5500", intensity: 0.8 },
  { text: "GLADIATOR", color: "#ff5555", emissive: "#aa0000", intensity: 0.8 },
  { text: "HERO", color: "#00ff00", emissive: "#00aa00", intensity: 0.8 },
  { text: "CHAMPION", color: "#00ffaa", emissive: "#00aa88", intensity: 0.8 },
  { text: "DEFENDER", color: "#00ccff", emissive: "#0088cc", intensity: 0.8 },
  { text: "GUARDIAN", color: "#00bbff", emissive: "#0077bb", intensity: 0.8 },
  { text: "MASTER", color: "#00ffff", emissive: "#00aaaa", intensity: 0.8 },
  { text: "GRANDMASTER", color: "#0088ff", emissive: "#0044aa", intensity: 0.8 },
  { text: "SAGE", color: "#0044ff", emissive: "#0000aa", intensity: 0.8 },
  { text: "SCHOLAR", color: "#5500ff", emissive: "#0000ff", intensity: 0.8 },
  { text: "ADEPT", color: "#8800ff", emissive: "#5500ff", intensity: 0.9 },
  { text: "MAGE", color: "#9900ff", emissive: "#6600ff", intensity: 0.9 },
  { text: "SORCERER", color: "#aa00ee", emissive: "#7700dd", intensity: 0.9 },
  { text: "WARLOCK", color: "#aa00ff", emissive: "#8800ff", intensity: 1.0 },
  { text: "ARCHMAGE", color: "#ff00ff", emissive: "#aa00ff", intensity: 1.1 },
  { text: "PROPHET", color: "#ff55ff", emissive: "#bb00ff", intensity: 1.1 },
  { text: "ORACLE", color: "#aaddff", emissive: "#00aaff", intensity: 1.1 },
  { text: "AVATAR", color: "#aaffff", emissive: "#00ffff", intensity: 1.2 },
  { text: "CRUSADER", color: "#ffffaa", emissive: "#ffaa00", intensity: 1.2 },
  { text: "PALADIN", color: "#ffffaa", emissive: "#ffff00", intensity: 1.3 },
  { text: "INQUISITOR", color: "#ff00aa", emissive: "#aa00aa", intensity: 1.4 },
  { text: "COMMANDER", color: "#ff4444", emissive: "#aa2222", intensity: 1.5 },
  { text: "WARLORD", color: "#ff0000", emissive: "#aa0000", intensity: 1.6 },
  { text: "CONQUEROR", color: "#cc0000", emissive: "#880000", intensity: 1.7 },
  { text: "VANGUARD", color: "#dddddd", emissive: "#aaaaaa", intensity: 1.7 },
  { text: "DEMIGOD", color: "#ff5500", emissive: "#ff0000", intensity: 1.8 },
  { text: "DEITY", color: "#ffaa00", emissive: "#ff5500", intensity: 1.9 },
  { text: "PANTHEON", color: "#ffff00", emissive: "#ffaa00", intensity: 2.0 },
  { text: "TITAN", color: "#ffdd00", emissive: "#ccaa00", intensity: 2.0 },
  { text: "PRIMORDIAL", color: "#ffff88", emissive: "#ffff00", intensity: 2.1 },
  { text: "ENTITY", color: "#00aaff", emissive: "#00ffff", intensity: 2.2 },
  { text: "BEHEMOTH", color: "#aaaaff", emissive: "#5555ff", intensity: 2.2 },
  { text: "LEVIATHAN", color: "#44aaff", emissive: "#0055ff", intensity: 2.3 },
  { text: "DREADNOUGHT", color: "#ffffff", emissive: "#ff00aa", intensity: 2.3 },
  { text: "SHIFTER", color: "#00ffff", emissive: "#0088ff", intensity: 2.4 },
  { text: "WALKER", color: "#220044", emissive: "#8800ff", intensity: 2.5 },
  { text: "LORDAEMON", color: "#440000", emissive: "#aa0000", intensity: 2.6 },
  { text: "OVERLORD", color: "#660000", emissive: "#ff0000", intensity: 2.7 },
  { text: "ELDER BRAIN", color: "#ff88ff", emissive: "#ff00ff", intensity: 2.8 },
  { text: "NECROMANCER", color: "#00ffcc", emissive: "#0088aa", intensity: 2.9 },
  { text: "LICH KING", color: "#00ffff", emissive: "#00ffff", intensity: 3.0 },
  { text: "DESTROYER", color: "#ff0000", emissive: "#ffaa00", intensity: 3.2 },
  { text: "OBLITERATOR", color: "#ff3300", emissive: "#ff5500", intensity: 3.3 },
  { text: "TARRASQUE", color: "#ffffff", emissive: "#ff00ff", intensity: 3.5 },
  { text: "UNWRITTEN RULE", color: "#000000", emissive: "#ff0000", intensity: 3.8 },
  { text: "ARCHITECT", color: "#ffffff", emissive: "#aaffff", intensity: 3.9 },
  { text: "CREATOR", color: "#ffffff", emissive: "#ffffff", intensity: 4.0 },
  { text: "ABSOLUTE GOD", color: "#000000", emissive: "#ffffff", intensity: 5.0 },
  { text: "PPPOPIPUPU", color: "#ff00ff", emissive: "#00ffff", intensity: 6.0 }
];

const NOUN_THRESHOLDS = [0];
let currentThreshold = 0;
for (let i = 1; i < NOUNS.length; i++) {
  currentThreshold += Math.floor(500 * Math.pow(1.15, i - 1));
  NOUN_THRESHOLDS.push(currentThreshold);
}

function RankTitle({ count }: { count: number }) {
  let nounIndex = 0;
  for (let i = NOUNS.length - 1; i >= 0; i--) {
    if (count >= NOUN_THRESHOLDS[i]) {
      nounIndex = i;
      break;
    }
  }

  const currentGap = nounIndex < NOUNS.length - 1
    ? NOUN_THRESHOLDS[nounIndex + 1] - NOUN_THRESHOLDS[nounIndex]
    : Math.floor(500 * Math.pow(1.15, nounIndex));

  const progressInGap = count - NOUN_THRESHOLDS[nounIndex];
  let adjIndex = Math.floor((progressInGap / currentGap) * ADJECTIVES.length);

  if (adjIndex >= ADJECTIVES.length) {
    adjIndex = ADJECTIVES.length - 1;
  }

  const adjText = ADJECTIVES[adjIndex];
  const nounObj = NOUNS[nounIndex];
  const title = `${adjText}\n${nounObj.text}`;

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
      groupRef.current.position.y = 3.5 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[-3.5, 3.5, -1]}>
      <Center>
        <Text3D
          font="https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json"
          size={0.4}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.01}
          bevelOffset={0}
          bevelSegments={3}
          lineHeight={1.2}
        >
          {title}
          <meshStandardMaterial color={nounObj.color} emissive={nounObj.emissive} emissiveIntensity={nounObj.intensity} metalness={0.5} roughness={0.2} toneMapped={false} />
        </Text3D>
      </Center>
    </group>
  );
}

function FloatingText({ id, startPos, onComplete }: { id: number, startPos: [number, number, number], onComplete: (id: number) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y += delta * 5;
      groupRef.current.position.x += Math.sin(state.clock.elapsedTime * 8 + id) * 0.03;

      if (materialRef.current) {
        materialRef.current.opacity -= delta * 0.7;
        if (materialRef.current.opacity <= 0) {
          onComplete(id);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={startPos}>
      <Center>
        <Text3D
          font="https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json"
          size={1.0}
          height={0.2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.03}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={3}
        >
          YOU NB!!!
          <meshStandardMaterial
            ref={materialRef}
            color="#ffff00"
            emissive="#ff0088"
            emissiveIntensity={2.5}
            transparent
            opacity={1}
            toneMapped={false}
            metalness={0.8}
            roughness={0.1}
          />
        </Text3D>
      </Center>
    </group>
  );
}

function ButtonModel({ onClick, isPressed }: { onClick: () => void, isPressed: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        isPressed ? -0.3 : 0,
        0.5
      );
    }
  });

  return (
    <group position={[0, -1, 0]}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[2.5, 2.8, 1, 32]} />
        <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.4} />
      </mesh>

      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <cylinderGeometry args={[2.3, 2.3, 1, 32]} />
        <meshStandardMaterial
          color={isPressed ? "#cc0000" : "#ff0033"}
          emissive={isPressed ? "#ff0000" : "#550000"}
          emissiveIntensity={isPressed ? 1 : 0.2}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export default function AngryButton3D({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const [rebirths, setRebirths] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number, pos: [number, number, number] }[]>([]);

  useEffect(() => {
    supabase
      .from("user_clicks")
      .select("click_count, rebirths")
      .eq("user_id", userId)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setCount(data.click_count || 0);
          setRebirths(data.rebirths || 0);
        } else if (error && error.code === 'PGRST116') {
          supabase.from("user_clicks").insert([{ user_id: userId, click_count: 0, rebirths: 0 }]).then();
        }
        setLoading(false);
      });
  }, [userId]);

  const handleFloatingTextComplete = (id: number) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  };

  const handleClick = async () => {
    const clickPower = Math.ceil(Math.pow(1.5, rebirths));
    const newCount = count + clickPower;
    setCount(newCount);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (Math.random() < 0.30) {
      const id = Date.now() + Math.random();
      const pos: [number, number, number] = [(Math.random() - 0.5) * 6, -1, (Math.random() - 0.5) * 3];
      setFloatingTexts(prev => [...prev, { id, pos }]);
    }

    await supabase
      .from("user_clicks")
      .upsert({ user_id: userId, click_count: newCount, rebirths });
  };

  const handleRebirth = async () => {
    const newRebirths = rebirths + 1;
    setRebirths(newRebirths);
    setCount(0);
    await supabase
      .from("user_clicks")
      .upsert({ user_id: userId, click_count: 0, rebirths: newRebirths });
  };

  const handleHardReset = async () => {
    if (!confirmReset) return;
    setCount(0);
    setRebirths(0);
    setConfirmReset(false);
    await supabase
      .from("user_clicks")
      .upsert({ user_id: userId, click_count: 0, rebirths: 0 });
  };

  const reqClicks = Math.floor(500 * Math.pow(1.5, rebirths));
  const canRebirth = count >= reqClicks;

  return (
    <div style={{ width: "100%", height: "400px", position: "relative", marginBottom: "30px", border: "5px inset #ff00ff", backgroundColor: "#000033", overflow: "hidden" }}>
      {loading && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10 }}>
          <p className="blink-text rainbow-text" style={{ fontSize: "1.5rem", margin: 0 }}>读取记录中 LOADING...</p>
        </div>
      )}

      {!loading && canRebirth && (
        <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 20 }}>
          <button
            onClick={handleRebirth}
            className="blink-text"
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff00ff",
              color: "#ffffff",
              border: "3px outset #ff00ff",
              fontSize: "1.2rem",
              cursor: "pointer",
              fontWeight: "bold",
              textShadow: "2px 2px #000"
            }}
          >
            🔥 ASCEND 🔥
          </button>
        </div>
      )}

      {!loading && (
        <div style={{ position: "absolute", bottom: "10px", left: "10px", zIndex: 10 }}>
          <p style={{ color: "#00ffff", margin: 0, textShadow: "1px 1px #000", fontFamily: "monospace", fontSize: "1.2rem", fontWeight: "bold" }}>
            牛逼指数: +{Math.ceil(Math.pow(1.5, rebirths))}
          </p>
        </div>
      )}

      {!loading && (
        <div
          onMouseEnter={() => setShowReset(true)}
          onMouseLeave={() => { setShowReset(false); setConfirmReset(false); }}
          style={{ position: "absolute", bottom: "10px", right: "10px", zIndex: 10 }}
        >
          {!showReset ? (
            <span style={{ fontSize: "1.5rem", cursor: "pointer", opacity: 0.4 }}>☠️</span>
          ) : (
            <div style={{ textAlign: "right", backgroundColor: "rgba(0,0,0,0.7)", padding: "10px", border: "2px solid #ff0000" }}>
              <label style={{ color: "#ff5555", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <input type="checkbox" checked={confirmReset} onChange={(e) => setConfirmReset(e.target.checked)} style={{ marginRight: "8px", width: "14px", height: "14px" }} />
                我确认要销毁一切修为
              </label>
              <button
                disabled={!confirmReset}
                onClick={handleHardReset}
                style={{
                  backgroundColor: confirmReset ? "#ff0000" : "#550000",
                  color: confirmReset ? "#ffffff" : "#aaaaaa",
                  border: "2px outset #ff0000",
                  padding: "4px 12px",
                  cursor: confirmReset ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "0.9rem"
                }}
              >
                ☠️ 硬重置 ☠️
              </button>
            </div>
          )}
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, 5, -5]} intensity={2} color="#ff00ff" />
        <React.Suspense fallback={null}>
          <ButtonModel onClick={handleClick} isPressed={isPressed} />
          <OrbitingCount count={count} />
          <PressArm isPressed={isPressed} />
          <RankTitle count={count} />

          {floatingTexts.map(ft => (
            <FloatingText key={ft.id} id={ft.id} startPos={ft.pos} onComplete={handleFloatingTextComplete} />
          ))}

          <ContactShadows position={[0, -1.5, 0]} opacity={1} scale={15} blur={1.5} far={4} color="#000000" />
          <EffectComposer>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={1.5} />
          </EffectComposer>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
