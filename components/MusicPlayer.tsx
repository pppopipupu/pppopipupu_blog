"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles({ isPlaying }: { isPlaying: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 150;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = isPlaying ? 3 : 0.5;
    const amp = isPlaying ? 0.5 : 0.1;
    for (let i = 0; i < count; i++) {
      const x = pos[i * 3];
      pos[i * 3 + 1] = Math.sin(x * 2.5 + time * speed) * amp + Math.cos(x * 1.5 - time * speed) * (amp * 0.5);
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = time * (isPlaying ? 0.15 : 0.02);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={isPlaying ? "#ff00ff" : "#00ffff"}
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
}

function BorderParticles({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const count = 30;
  const meshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const particlesData = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: 999,
        y: 999,
        z: 0,
        vx: 0,
        vy: 0,
        life: 100,
        maxLife: 100,
      });
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    for (let i = 0; i < count; i++) {
      const p = particlesData[i];
      const mesh = meshesRef.current[i];
      if (!mesh) continue;

      p.life += delta * 60;

      if (p.life >= p.maxLife) {
        if (!isPlaying) {
          p.x = 999;
          p.y = 999;
          p.life = p.maxLife;
        } else {
          p.life = 0;
          p.maxLife = 20 + Math.random() * 30;
          const edge = Math.floor(Math.random() * 4);
          const w = 1.45;
          const h = 1.15;

          if (edge === 0) {
            p.x = (Math.random() - 0.5) * w * 2;
            p.y = h;
            p.vx = (Math.random() - 0.5) * 0.4;
            p.vy = 0.4 + Math.random() * 0.8;
          } else if (edge === 1) {
            p.x = (Math.random() - 0.5) * w * 2;
            p.y = -h;
            p.vx = (Math.random() - 0.5) * 0.4;
            p.vy = -(0.4 + Math.random() * 0.8);
          } else if (edge === 2) {
            p.x = -w;
            p.y = (Math.random() - 0.5) * h * 2;
            p.vx = -(0.4 + Math.random() * 0.8);
            p.vy = (Math.random() - 0.5) * 0.4;
          } else {
            p.x = w;
            p.y = (Math.random() - 0.5) * h * 2;
            p.vx = 0.4 + Math.random() * 0.8;
            p.vy = (Math.random() - 0.5) * 0.4;
          }
          p.z = (Math.random() - 0.5) * 0.2;
        }
      } else {
        p.x += p.vx * delta * 1.5;
        p.y += p.vy * delta * 1.5;
      }

      mesh.position.set(p.x, p.y, p.z);
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const ratio = 1 - p.life / p.maxLife;
        mat.opacity = isPlaying ? Math.max(0, ratio * 0.8) : 0;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: count }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshesRef.current[idx] = el;
          }}
          position={[999, 999, 0]}
        >
          <boxGeometry args={[0.035, 0.035, 0.035]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<{ name: string; url: string }[]>([]);
  const [active, setActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [mounted, setMounted] = useState(false);

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGlitched, setIsGlitched] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("musicPlayerEnabled") === "true";
    setActive(stored);

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    fetch(`${basePath}/music/list.json`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((filename: string) => ({
            name: filename,
            url: `${basePath}/music/${encodeURIComponent(filename)}`
          }));
          setTracks(mapped);
          if (stored) {
            setIsPlaying(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;

    audioRef.current = new Audio(tracks[currentTrackIndex].url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleAudioEnded = () => {
      handleNext();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleAudioEnded);

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleAudioEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [tracks]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (tracks.length === 0 || !audioRef.current) return;
    const audio = audioRef.current;

    const wasPlaying = isPlaying;
    audio.pause();
    audio.src = tracks[currentTrackIndex].url;
    audio.load();

    if (wasPlaying) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    if (tracks.length === 0 || !audioRef.current) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, tracks]);

  useEffect(() => {
    if (!isPlaying) {
      setIsGlitched(false);
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setIsGlitched(true);
        setTimeout(() => {
          setIsGlitched(false);
        }, 3000);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsGlitched(false);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isGlitched || !containerRef.current) return;

    const el = containerRef.current;
    const originalTransition = el.style.transition;
    el.style.transition = "none";

    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    let dx = 0;
    let dy = 0;

    let vx = (Math.random() > 0.5 ? 1 : -1) * (3200 + Math.random() * 1800);
    let vy = (Math.random() > 0.5 ? 1 : -1) * (3200 + Math.random() * 1800);

    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const winW = window.innerWidth;
      const winH = window.innerHeight;

      dx += vx * dt;
      dy += vy * dt;

      if (30 + dx <= 0) {
        dx = -30;
        vx = -vx;
      } else if (30 + dx + W >= winW) {
        dx = winW - 30 - W;
        vx = -vx;
      }

      if (30 + dy <= 0) {
        dy = -30;
        vy = -vy;
      } else if (30 + dy + H >= winH) {
        dy = winH - 30 - H;
        vy = -vy;
      }

      el.style.transform = `translate(${dx}px, ${-dy}px)`;

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.style.transition = originalTransition;
      requestAnimationFrame(() => {
        el.style.transform = "";
      });
    };
  }, [isGlitched]);

  const handlePlayPause = () => {
    if (tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleStop = () => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleOpen = () => {
    setActive(true);
    localStorage.setItem("musicPlayerEnabled", "true");
    setIsPlaying(true);
  };

  const handleClose = () => {
    setActive(false);
    localStorage.setItem("musicPlayerEnabled", "false");
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredTracks = useMemo(() => {
    return tracks
      .map((track, idx) => ({ ...track, originalIndex: idx }))
      .filter((track) =>
        track.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [tracks, searchQuery]);

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee-music {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes spin-cd {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes jitter-shake {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            10% { transform: translate(-2px, -1px) scale(0.99) rotate(-0.5deg); }
            20% { transform: translate(1px, -2px) scale(1.01) rotate(0.5deg); }
            30% { transform: translate(-1px, 2px) scale(1) rotate(0deg); }
            40% { transform: translate(2px, 1px) scale(1.01) rotate(1deg); }
            50% { transform: translate(-2px, -2px) scale(0.99) rotate(-1deg); }
            60% { transform: translate(2px, 2px) scale(1) rotate(0deg); }
            70% { transform: translate(-1px, -1px) scale(1.01) rotate(0.5deg); }
            80% { transform: translate(1px, 2px) scale(0.99) rotate(-0.5deg); }
            90% { transform: translate(-2px, 1px) scale(1) rotate(0deg); }
            100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          }
          .jitter-active {
            animation: jitter-shake 0.15s infinite;
            box-shadow: 0 0 35px rgba(255, 0, 255, 0.9), inset 0 0 20px rgba(0, 255, 255, 0.7) !important;
          }
          .crazy-glitched {
            border-color: #ffff00 !important;
            box-shadow: 0 0 50px #ff00ff, 0 0 100px #00ffff !important;
          }
          .playlist-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .playlist-scroll::-webkit-scrollbar-track {
            background: #001100;
            border: 1px solid #00ff00;
          }
          .playlist-scroll::-webkit-scrollbar-thumb {
            background: #00ff00;
            box-shadow: 0 0 5px #00ff00;
          }
        `
      }} />

      <div
        onClick={handleOpen}
        style={{
          position: "fixed",
          bottom: "30px",
          left: "30px",
          zIndex: 9998,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          transform: active ? "translate(-150px, 150px) scale(0.5) rotate(-180deg)" : "translate(0, 0) scale(1) rotate(0deg)",
          opacity: active ? 0 : 1,
          pointerEvents: active ? "none" : "auto",
          transition: "transform 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 0.5s",
        }}
      >
        <div
          style={{
            width: "65px",
            height: "65px",
            borderRadius: "50%",
            background: "conic-gradient(from 0deg, #ff00ff, #00ffff, #ffff00, #ff00ff)",
            border: "3px solid #ffffff",
            boxShadow: "0 0 15px #ff00ff, inset 0 0 10px rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "spin-cd 4s linear infinite",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#000000",
              border: "2px solid #ffffff",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#ffffff",
            textShadow: "0 0 5px #ff00ff, 1px 1px 2px #000000",
            letterSpacing: "1px",
            userSelect: "none",
          }}
        >
          播放音乐
        </span>
      </div>

      <div
        ref={containerRef}
        className={isGlitched ? "crazy-glitched" : ""}
        style={{
          position: "fixed",
          bottom: active ? "30px" : "-600px",
          left: "30px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: active ? "auto" : "none",
          transition: "bottom 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            left: "-20px",
            width: "330px",
            height: "270px",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <Canvas camera={{ position: [0, 0, 3], fov: 60 }} style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}>
            <ambientLight intensity={1.5} />
            <BorderParticles isPlaying={isPlaying} color="#ff00ff" />
            <BorderParticles isPlaying={isPlaying} color="#00ffff" />
          </Canvas>
        </div>

        <div
          className={isPlaying ? "jitter-active" : ""}
          style={{
            position: "relative",
            width: "290px",
            height: "230px",
            zIndex: 2,
            background: "linear-gradient(135deg, rgba(18, 0, 36, 0.95) 0%, rgba(0, 18, 36, 0.95) 100%)",
            border: "4px ridge #ff00ff",
            boxShadow: "0 0 25px rgba(0, 255, 255, 0.8), inset 0 0 15px rgba(255, 0, 255, 0.5)",
            padding: "15px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: active ? 1 : 0,
            transform: active ? "scale(1)" : "scale(0.8)",
            transition: "opacity 0.5s, transform 0.5s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "13px",
                fontWeight: "900",
                color: "#00ffff",
                textShadow: "0 0 5px #00ffff",
                letterSpacing: "2px",
              }}
            >
              WINAMP LITE
            </span>
            <button
              onClick={handleClose}
              style={{
                width: "20px",
                height: "20px",
                background: "rgba(255, 0, 255, 0.2)",
                border: "2px outset #ff00ff",
                color: "#ff00ff",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
              onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
              onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
            >
              X
            </button>
          </div>

          <div
            style={{
              background: "#001100",
              border: "2px inset #00ff00",
              padding: "6px",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#00ff00",
              fontSize: "12px",
              height: "55px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              boxShadow: "inset 0 0 10px rgba(0, 255, 0, 0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>{isPlaying ? "PLAYING" : "PAUSED"}</div>
              <div>{formatTime(currentTime)} / {formatTime(duration)}</div>
            </div>
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "18px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  position: "absolute",
                  animation: "marquee-music 12s linear infinite",
                }}
              >
                {tracks[currentTrackIndex]?.name || "LOADING..."}
              </div>
            </div>
          </div>

          <div style={{ width: "100%", height: "65px", border: "2px inset #ff00ff", overflow: "hidden", background: "#000011" }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
              <ambientLight intensity={1.5} />
              <Particles isPlaying={isPlaying} />
            </Canvas>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={handlePrev}
                style={{
                  padding: "4px 8px",
                  background: "rgba(0, 255, 255, 0.1)",
                  border: "2px outset #00ffff",
                  color: "#00ffff",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
                onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
                onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
              >
                PREV
              </button>
              <button
                onClick={handlePlayPause}
                style={{
                  padding: "4px 10px",
                  background: "rgba(0, 255, 255, 0.1)",
                  border: "2px outset #00ffff",
                  color: "#00ffff",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
                onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
                onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
              >
                {isPlaying ? "PAUS" : "PLAY"}
              </button>
              <button
                onClick={handleNext}
                style={{
                  padding: "4px 8px",
                  background: "rgba(0, 255, 255, 0.1)",
                  border: "2px outset #00ffff",
                  color: "#00ffff",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
                onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
                onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
              >
                NEXT
              </button>
              <button
                onClick={handleStop}
                style={{
                  padding: "4px 8px",
                  background: "rgba(0, 255, 255, 0.1)",
                  border: "2px outset #00ffff",
                  color: "#00ffff",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
                onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
                onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
              >
                STOP
              </button>
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                style={{
                  padding: "4px 8px",
                  background: showPlaylist ? "rgba(0, 255, 255, 0.4)" : "rgba(0, 255, 255, 0.1)",
                  border: "2px outset #00ffff",
                  color: "#00ffff",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: showPlaylist ? "0 0 5px #00ffff" : "none",
                }}
                onMouseDown={(e) => (e.currentTarget.style.borderStyle = "inset")}
                onMouseUp={(e) => (e.currentTarget.style.borderStyle = "outset")}
                onMouseLeave={(e) => (e.currentTarget.style.borderStyle = "outset")}
              >
                LIST
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#00ff00" }}>VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  width: "40px",
                  cursor: "pointer",
                  accentColor: "#00ffff",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            width: "290px",
            height: showPlaylist ? "180px" : "0px",
            opacity: showPlaylist ? 1 : 0,
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(18, 0, 36, 0.95) 0%, rgba(0, 18, 36, 0.95) 100%)",
            border: showPlaylist ? "4px ridge #00ffff" : "none",
            boxShadow: "0 0 20px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(0, 255, 255, 0.4)",
            padding: showPlaylist ? "10px" : "0px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 2,
            transition: "height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.3s, padding 0.4s",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH TRACK..."
            style={{
              width: "100%",
              background: "#001100",
              border: "2px inset #00ff00",
              padding: "4px 8px",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#00ff00",
              fontSize: "11px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <div
            className="playlist-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "11px",
              color: "#00ffff",
            }}
          >
            {filteredTracks.map((track) => {
              const isCurrent = track.originalIndex === currentTrackIndex;
              return (
                <div
                  key={track.originalIndex}
                  onClick={() => {
                    setCurrentTrackIndex(track.originalIndex);
                    setIsPlaying(true);
                  }}
                  style={{
                    padding: "4px 6px",
                    cursor: "pointer",
                    background: isCurrent ? "rgba(0, 255, 255, 0.2)" : "transparent",
                    color: isCurrent ? "#00ff00" : "#00ffff",
                    textShadow: isCurrent ? "0 0 5px #00ff00" : "none",
                    border: isCurrent ? "1px solid #00ff00" : "1px solid transparent",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {isCurrent ? "▶ " : ""}{track.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
