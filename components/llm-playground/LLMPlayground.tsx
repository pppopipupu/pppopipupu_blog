import React, { useState, useRef, useEffect } from "react";
import PhysicsScreen, { PhysicalItem } from "./PhysicsScreen";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function LLMPlayground() {
  const [modelState, setModelState] = useState<"unloaded" | "loading" | "ready">("unloaded");
  const [selectedModel, setSelectedModel] = useState("onnx-community/gemma-4-E2B-it-ONNX");
  const [selectedSource, setSelectedSource] = useState("https://hf-mirror.com/");
  const [progress, setProgress] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("Awaiting neural connection...");
  const [activeFile, setActiveFile] = useState("");
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [setTotalBytes] = useState(0);
  const [activeDevice, setActiveDevice] = useState<"webgpu" | "wasm" | "">("");

  // 聊天状态
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "system",
      content:
        "You are a funny local AI speaking in Chinglish. Rules: 1. Alternate sentence by sentence: 1 sentence in English, 1 sentence in Chinese. 2. Call the user 'boss'. 3. Use many emojis!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 物理 3D 小球状态
  const [physicalItems, setPhysicalItems] = useState<PhysicalItem[]>([]);
  const prevProgressRef = useRef(0);
  // 记录单个文件上一次进度的 Ref
  const fileProgressRef = useRef<Record<string, number>>({});

  // Worker 引用
  const workerRef = useRef<Worker | null>(null);

  // 累积各文件的下载大小，计算精确进度
  const fileSizesRef = useRef<Record<string, { loaded: number; total: number }>>({});

  // 滚动区域 Ref
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  // 发射一个物理 3D 几何体
  const spawnPhysicsItem = () => {
    const types: ("sphere" | "box" | "torus" | "octahedron")[] = ["sphere", "box", "torus", "octahedron"];
    const colors = ["#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#ff3300", "#3300ff"];
    const newItem: PhysicalItem = {
      id: Math.random().toString(),
      type: types[Math.floor(Math.random() * types.length)],
      position: [Math.random() * 2 - 1, 4.5, Math.random() * 2 - 1], // 顶部边缘落下
      velocity: [Math.random() * 8 - 4, Math.random() * 5 + 3, Math.random() * 8 - 4], // 随机抛出速度
      angularVelocity: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 0.35 + Math.random() * 0.45,
    };

    setPhysicalItems((prev) => {
      // 限制最大 50 个几何体，以防卡顿
      if (prev.length >= 50) {
        return [...prev.slice(1), newItem];
      }
      return [...prev, newItem];
    });
  };

  // 初始化 Web Worker
  const initWorker = () => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.addEventListener("message", (event: MessageEvent) => {
      const data = event.data;

      if (data.status === "loading") {
        setLoadingMsg(`📡 [NEURAL CORE]: ${data.message} 🧠`);
      } else if (data.status === "initiate") {
        setLoadingMsg(`📡 [INITIATE сегмент]: Connecting neural file segment: ${data.file.split("/").pop()}... 🌐`);
        setActiveFile(data.file || "");
      } else if (data.status === "progress") {
        setActiveFile(data.file || "");
        if (data.loaded) setLoadedBytes(data.loaded);
        if (data.total) setTotalBytes(data.total);

        // 按单文件下载进度增量触发 3D 物理 Bloom 小球爆出
        const lastProg = fileProgressRef.current[data.file] || 0;
        if (data.progress - lastProg >= 2.0) { // 该文件下载进度每增长 2%
          spawnPhysicsItem();
          fileProgressRef.current[data.file] = data.progress;
        }
      } else if (data.status === "progress_total") {
        // 使用真正的官方 progress_total 作为整体进度
        const newProgress = Math.round(data.progress);
        setProgress(newProgress);
      } else if (data.status === "ready") {
        setModelState("ready");
        setIsGenerating(false);
        if (data.device) {
          setActiveDevice(data.device);
        }
      } else if (data.status === "chunk") {
        // 流式追加打字机字符
        setChatHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [...prev.slice(0, prev.length - 1), { ...last, content: last.content + data.text }];
          } else {
            return [...prev, { role: "assistant", content: data.text }];
          }
        });
      } else if (data.status === "complete") {
        setIsGenerating(false);
      } else if (data.status === "error") {
        alert("CRITICAL ERROR: " + data.error);
        setModelState("unloaded");
        setIsGenerating(false);
      }
    });

    workerRef.current = worker;
    return worker;
  };

  // 激活脑节点
  const handleActivate = () => {
    setModelState("loading");
    setProgress(0);
    setLoadedBytes(0);
    setTotalBytes(0);
    fileSizesRef.current = {};
    prevProgressRef.current = 0;
    setPhysicalItems([]);

    const worker = initWorker();
    worker.postMessage({
      type: "start",
      modelId: selectedModel,
      remoteHost: selectedSource,
    });
  };

  // 卸载脑节点，释放内存/显存
  const handleDeactivate = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setModelState("unloaded");
    setActiveDevice("");
    setChatHistory([
      {
        role: "system",
        content:
          "You are a funny local AI speaking in Chinglish. Rules: 1. Alternate sentence by sentence: 1 sentence in English, 1 sentence in Chinese. 2. Call the user 'boss'. 3. Use many emojis!",
      },
    ]);
    setPhysicalItems([]);
    fileProgressRef.current = {};
  };

  // 发送消息
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating || modelState !== "ready") return;

    const userMsg: Message = { role: "user", content: inputText };
    setChatHistory((prev) => [...prev, userMsg]);
    setInputText("");
    setIsGenerating(true);

    // 将系统提示词和对话历史整理，发送给模型
    const apiMessages = chatHistory.concat(userMsg).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "chat",
        messages: apiMessages,
        maxTokens: 256,
      });
    }
  };

  // 清空历史
  const handlePurge = () => {
    setChatHistory([
      {
        role: "system",
        content:
          "You are a funny local AI speaking in Chinglish. Rules: 1. Alternate sentence by sentence: 1 sentence in English, 1 sentence in Chinese. 2. Call the user 'boss'. 3. Use many emojis!",
      },
    ]);
  };

  // 终止回复生成
  const handleStopGeneration = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "abort" });
    }
    setIsGenerating(false);
  };

  // 对话重置到某轮
  const handleResume = (index: number) => {
    setChatHistory((prev) => prev.slice(0, index + 1));
    setIsGenerating(false);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "abort" });
    }
  };

  // 格式化文件字节大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // 生成字符进度条
  const getProgressChar = () => {
    const totalChars = 20;
    const filledChars = Math.round((progress / 100) * totalChars);
    const emptyChars = totalChars - filledChars;
    return "[" + "■".repeat(filledChars) + "□".repeat(emptyChars) + "]";
  };

  return (
    <div style={{ padding: "10px", color: "#00ff00", fontFamily: "Maple Mono NL, monospace" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blink-cursor {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .cursor-blink {
            display: inline-block;
            width: 8px;
            height: 15px;
            background-color: #00ff00;
            margin-left: 4px;
            vertical-align: middle;
            animation: blink-cursor 0.8s infinite;
          }
          .retro-dialog {
            border: 4px outset #808080;
            background-color: #c0c0c0;
            color: #000000;
            padding: 4px;
            box-shadow: 4px 4px 0px #000000;
          }
          .retro-header {
            background: linear-gradient(90deg, #000080, #0080ff);
            color: #ffffff;
            font-weight: bold;
            padding: 4px 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .retro-content {
            border: 3px inset #808080;
            background-color: #000000;
            color: #00ff00;
            padding: 15px;
            margin-top: 5px;
          }
          .retro-btn {
            background-color: #c0c0c0;
            border: 3px outset #ffffff;
            color: #000000;
            padding: 5px 12px;
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
          }
          .retro-btn:active {
            border: 3px inset #ffffff;
            background-color: #b0b0b0;
          }
          .retro-btn:hover {
            color: #ff00ff;
          }
          .crt-scanlines {
            position: relative;
          }
          .crt-scanlines::after {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 4px, 6px 100%;
            pointer-events: none;
            z-index: 10;
          }
        `
      }} />

      <div className="retro-dialog">
        <div className="retro-header">
          <span>🧠 SYSTEM MEMORY DUMP: LOCAL_LLM_CORE.EXE</span>
          <span style={{ color: "#ffff00" }}>[ONLINE]</span>
        </div>

        {/* 1. 未激活状态 */}
        {modelState === "unloaded" && (
          <div className="retro-content" style={{ textAlign: "center" }}>
            <p className="blink-text" style={{ color: "#ff0000", fontSize: "1.4rem", fontWeight: "bold", margin: "0 0 15px 0" }}>
              警告：本地脑细胞目前处于完全死机状态！🧠
            </p>
            <p style={{ color: "#ffff00", fontSize: "1rem", margin: "0 0 20px 0" }}>
              No active intelligence nodes detected. Please configure and load neural cores. 📡
            </p>
            
            <div style={{
              margin: "20px auto",
              maxWidth: "500px",
              border: "3px double #00ffff",
              padding: "15px",
              backgroundColor: "#000044",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ color: "#00ffff", fontWeight: "bold", fontSize: "0.9rem" }}>
                  🧠 选择脑容量 (MODEL SIZE):
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    backgroundColor: "#000000",
                    color: "#00ff00",
                    border: "2px inset #00ffff",
                    padding: "5px",
                    fontSize: "0.9rem",
                    fontFamily: "monospace",
                    cursor: "crosshair"
                  }}
                >
                  <option value="onnx-community/gemma-4-E2B-it-ONNX">
                    Gemma-4 E2B (~500MB) [GPU Enabled] 🧠
                  </option>
                  <option value="onnx-community/SmolLM2-135M-Instruct-ONNX">
                    SmolLM2 135M (~130MB) [CPU Friendly] ⚡
                  </option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ color: "#00ffff", fontWeight: "bold", fontSize: "0.9rem" }}>
                  📡 选择数据通道 (GATEWAY):
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  style={{
                    backgroundColor: "#000000",
                    color: "#00ff00",
                    border: "2px inset #00ffff",
                    padding: "5px",
                    fontSize: "0.9rem",
                    fontFamily: "monospace",
                    cursor: "crosshair"
                  }}
                >
                  <option value="https://hf-mirror.com/">
                    hf-mirror.com (China Mirror)
                  </option>
                  <option value="https://modelscope.cn/api/v1/models/">
                    ModelScope (Alibaba Mirror - May CORS)
                  </option>
                  <option value="https://huggingface.co/">
                    HuggingFace Hub (Official CDN)
                  </option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "30px", marginBottom: "10px" }}>
              <button className="retro-btn" onClick={handleActivate} style={{ fontSize: "1.2rem", border: "4px outset #ffffff" }}>
                ACTIVATE NEURAL CELLS
              </button>
            </div>
          </div>
        )}

        {/* 2. 下载加载状态 */}
        {modelState === "loading" && (
          <div className="retro-content crt-scanlines">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
              <div className="blink-text" style={{ color: "#ffff00", fontSize: "1.2rem", fontWeight: "bold" }}>
                📡 ESTABLISHING NEURAL SYNAPSE...
              </div>
              <div style={{ color: "#00ffff" }}>
                {loadingMsg}
              </div>
              
              {/* 文件与进度 */}
              {activeFile && (
                <div style={{ fontSize: "0.9rem", color: "#ff8800", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  FILE INJECTING: {activeFile.split("/").pop()}
                </div>
              )}

              {/* 进度条 */}
              <div style={{ fontSize: "1.2rem", color: "#00ff00", letterSpacing: "1px" }}>
                COGNITIVE DOWNLOAD: {getProgressChar()} {progress}%
              </div>

              {loadedBytes > 0 && (
                <div style={{ fontSize: "0.9rem", color: "#888" }}>
                  CURRENT SEGMENT LOADED: {formatBytes(loadedBytes)}
                </div>
              )}

              <div style={{ color: "#ff0000", fontSize: "0.85rem", marginTop: "8px", fontWeight: "bold" }} className="blink-text">
                🚨 警告老板：在低配手机或移动端设备上强行运行 Gemma-4 E2B 模型可能会导致设备过载并直接当场爆炸！
              </div>
              <div style={{ color: "#888", fontSize: "0.8rem", marginTop: "2px" }}>
                💡 友情提示：如遇下载失败或推理时显卡崩溃（WebGL context lost），建议点击下方中止并改选 SmolLM2 135M 模型；如遇跨域报错请尝试切换到 HuggingFace Hub 官方源。
              </div>
            </div>

            {/* 3D 物理小球乱飞 Canvas */}
            <PhysicsScreen items={physicalItems} />

            <div style={{ marginTop: "15px", textAlign: "center" }}>
              <p style={{ color: "#ff00ff", fontSize: "0.9rem", margin: "5px 0" }}>
                大批脑细胞正在物理小球中疯狂具现化，移动鼠标可以弹开它们！
              </p>
              <button className="retro-btn" onClick={handleDeactivate} style={{ marginTop: "10px", fontSize: "0.9rem" }}>
                ABORT DOWNLOAD
              </button>
            </div>
          </div>
        )}

        {/* 3. 已加载/聊天状态 */}
        {modelState === "ready" && (
          <div className="retro-content crt-scanlines" style={{ padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #00ff00", paddingBottom: "5px", marginBottom: "10px" }}>
              <span style={{ color: "#ffff00", fontWeight: "bold" }}>
                🤖 CORE HOST: ONLINE (CORE: [{activeDevice.toUpperCase()}], MODEL: {selectedModel.split("/")[1]})
              </span>
              <div>
                <button
                  className="retro-btn"
                  onClick={spawnPhysicsItem}
                  style={{ fontSize: "0.8rem", padding: "2px 8px", marginRight: "10px", border: "2px outset #ffffff" }}
                >
                  ⚛ SPAWN CELL
                </button>
                <button
                  className="retro-btn"
                  onClick={handlePurge}
                  style={{ fontSize: "0.8rem", padding: "2px 8px", marginRight: "10px", border: "2px outset #ffffff" }}
                >
                  ☠ PURGE MEMORY
                </button>
                <button
                  className="retro-btn"
                  onClick={handleDeactivate}
                  style={{ fontSize: "0.8rem", padding: "2px 8px", border: "2px outset #ffffff" }}
                >
                  🚪 DEACTIVATE
                </button>
              </div>
            </div>

            {/* 聊天显示区域 */}
            <div
              ref={chatContainerRef}
              style={{
                height: "350px",
                overflowY: "auto",
                border: "2px inset #00ff00",
                backgroundColor: "#050505",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "1rem",
              }}
            >
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column" }}>
                  {msg.role === "system" && (
                    <div style={{ color: "#888888", fontSize: "0.9rem", fontStyle: "italic" }}>
                      [SYSTEM]: {msg.content}
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div style={{ color: "#00ffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: "bold" }}>USER&gt;</span> {msg.content}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResume(idx)}
                        className="retro-btn"
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          border: "2px outset #ffffff",
                          lineHeight: "1",
                        }}
                      >
                        RESUME
                      </button>
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div style={{ color: "#00ff00", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ whiteSpace: "pre-wrap", marginRight: "10px" }}>
                        <span style={{ color: "#ff00ff", fontWeight: "bold" }}>AI&gt;</span> {msg.content}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResume(idx)}
                        className="retro-btn"
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          border: "2px outset #ffffff",
                          lineHeight: "1",
                          flexShrink: 0,
                        }}
                      >
                        RESUME
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div style={{ color: "#00ff00" }}>
                  <span style={{ color: "#ff00ff", fontWeight: "bold" }}>AI&gt;</span> Thinking...<span className="cursor-blink" />
                </div>
              )}
            </div>

            {/* 输入命令区域 */}
            <form onSubmit={handleSendMessage} style={{ display: "flex", marginTop: "10px", gap: "10px" }}>
              <span style={{ color: "#00ffff", fontSize: "1.2rem", fontWeight: "bold", alignSelf: "center" }}>
                USER&gt;
              </span>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isGenerating}
                placeholder={isGenerating ? "Processing thoughts..." : "Type neural signal command..."}
                style={{
                  flexGrow: 1,
                  backgroundColor: "#000000",
                  color: "#00ff00",
                  border: "2px inset #00ff00",
                  padding: "8px",
                  fontSize: "1.1rem",
                  fontFamily: "Maple Mono NL, monospace",
                  outline: "none",
                  boxShadow: "inset 0 0 10px rgba(0,255,0,0.15)"
                }}
              />
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="retro-btn"
                  style={{ border: "3px outset #ffffff", fontSize: "1rem", color: "#ff0000" }}
                >
                  STOP
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="retro-btn"
                  style={{ border: "3px outset #ffffff", fontSize: "1rem" }}
                >
                  EXECUTE
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
