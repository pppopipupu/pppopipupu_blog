import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider, BallCollider, RapierRigidBody } from "@react-three/rapier";

export interface PhysicalItem {
  id: string;
  type: "sphere" | "box" | "torus" | "octahedron";
  position: [number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  color: string;
  size: number;
}

function InvisibleContainer() {
  const size = 5.5;
  const thickness = 0.5;
  return (
    <group>
      <RigidBody type="fixed" position={[0, -size, 0]}>
        <CuboidCollider args={[size, thickness, size]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, size, 0]}>
        <CuboidCollider args={[size, thickness, size]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-size, 0, 0]}>
        <CuboidCollider args={[thickness, size, size]} />
      </RigidBody>
      <RigidBody type="fixed" position={[size, 0, 0]}>
        <CuboidCollider args={[thickness, size, size]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, -size]}>
        <CuboidCollider args={[size, size, thickness]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 0, size]}>
        <CuboidCollider args={[size, size, thickness]} />
      </RigidBody>
    </group>
  );
}

function MouseCollider() {
  const mouseBodyRef = useRef<RapierRigidBody>(null);

  useFrame((state) => {
    if (mouseBodyRef.current) {
      const x = state.pointer.x * 5.8;
      const y = state.pointer.y * 4.2;
      mouseBodyRef.current.setNextKinematicTranslation({ x, y, z: 0 });
    }
  });

  return (
    <RigidBody ref={mouseBodyRef} type="kinematicPosition">
      <BallCollider args={[0.8]} />
    </RigidBody>
  );
}

export default function PhysicsScreen({ items }: { items: PhysicalItem[] }) {
  React.useEffect(() => {
    return () => {
      // 显式清理 WebGL 渲染器资源，强制浏览器丢弃上下文并收回所有 GPU 显存
      const gl = (window as any).activeWebGLRenderer;
      if (gl) {
        try {
          gl.dispose();
          const extension = gl.getContext().getExtension('WEBGL_lose_context');
          if (extension) {
            extension.loseContext();
          }
        } catch (e) {
          console.warn("WebGL dispose failed:", e);
        }
        (window as any).activeWebGLRenderer = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "350px",
        position: "relative",
        backgroundColor: "#000000",
        border: "4px inset #00ffff",
        boxShadow: "inset 0 0 30px rgba(0,255,255,0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <Canvas 
        camera={{ position: [0, 0, 10], fov: 60 }}
        onCreated={({ gl }) => {
          (window as any).activeWebGLRenderer = gl;
        }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#ff00ff" />
        
        <React.Suspense fallback={null}>
          <Physics gravity={[0, -1.2, 0]}>
            <InvisibleContainer />
            <MouseCollider />

            {items.map((item) => (
              <RigidBody
                key={item.id}
                position={item.position}
                linearVelocity={item.velocity}
                angularVelocity={item.angularVelocity}
                restitution={1.05}
                friction={0.02}
                linearDamping={0.01}
                angularDamping={0.01}
              >
                <mesh castShadow>
                  {item.type === "sphere" && <sphereGeometry args={[item.size, 16, 16]} />}
                  {item.type === "box" && <boxGeometry args={[item.size * 1.5, item.size * 1.5, item.size * 1.5]} />}
                  {item.type === "torus" && <torusGeometry args={[item.size * 0.9, item.size * 0.35, 8, 16]} />}
                  {item.type === "octahedron" && <octahedronGeometry args={[item.size * 1.2]} />}

                  <meshStandardMaterial
                    color={item.color}
                    emissive={item.color}
                    emissiveIntensity={3.0}
                    roughness={0.1}
                    metalness={0.9}
                    toneMapped={false}
                  />
                </mesh>
              </RigidBody>
            ))}
          </Physics>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
