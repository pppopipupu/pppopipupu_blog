import { pipeline, TextStreamer, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

// 指定 ONNX Runtime Web 的 WASM 二进制文件路径至国内极速 CDN 镜像，规避 NetworkError
// @ts-ignore
env.backends.onnx.wasm.wasmPaths = "/wasm/";

// 配置 CPU/WASM 推理的多线程并发以大幅加速 CPU 推理速度
const numThreads = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) ? Math.min(8, navigator.hardwareConcurrency) : 4;
// @ts-ignore
env.backends.onnx.wasm.numThreads = numThreads;

let generator: any = null;
let currentModelId = "";

function sendProgressMessage(data: any) {
  if (data.status === "progress") {
    self.postMessage({
      status: "progress",
      file: data.file,
      progress: data.progress,
      loaded: data.loaded,
      total: data.total,
    });
  } else if (data.status === "progress_total") {
    self.postMessage({
      status: "progress_total",
      progress: data.progress,
    });
  } else if (data.status === "initiate") {
    self.postMessage({
      status: "initiate",
      file: data.file,
    });
  }
}

async function initPipeline(modelId: string) {
  if (generator && currentModelId === modelId) {
    self.postMessage({ status: "ready" });
    return;
  }

  currentModelId = modelId;
  generator = null;

  self.postMessage({ status: "loading", message: "Initializing neural pathways..." });

  // 1. 尝试第一级：WebGPU + q4f16 (在支持 shader-f16 扩展的显卡上极速且资源占用低，文件约 1GB)
  try {
    self.postMessage({ status: "loading", message: "Connecting WebGPU [q4f16] pipeline..." });
    generator = await pipeline("text-generation", modelId, {
      device: "webgpu",
      dtype: "q4f16",
      progress_callback: (data: any) => {
        sendProgressMessage(data);
      },
    });
    self.postMessage({ status: "ready", device: "webgpu" });
    return;
  } catch (error: any) {
    console.warn("WebGPU (q4f16) failed, trying WebGPU (q4) fallback:", error);
  }

  // 2. 尝试第二级：WebGPU + q4 (针对不支持 shader-f16 扩展但支持 WebGPU 的显卡，文件约 1.6GB)
  try {
    self.postMessage({ status: "loading", message: "Connecting WebGPU [q4] fallback pipeline..." });
    generator = await pipeline("text-generation", modelId, {
      device: "webgpu",
      dtype: "q4",
      progress_callback: (data: any) => {
        sendProgressMessage(data);
      },
    });
    self.postMessage({ status: "ready", device: "webgpu" });
    return;
  } catch (error: any) {
    console.warn("WebGPU (q4) fallback failed, trying WASM/CPU:", error);
  }

  // 3. 尝试第三级：WASM/CPU + q4 (全兼容 CPU 运行)
  try {
    self.postMessage({ status: "loading", message: "WebGPU failed. Initializing CPU/WASM [q4]..." });
    generator = await pipeline("text-generation", modelId, {
      device: "wasm",
      dtype: "q4",
      progress_callback: (data: any) => {
        sendProgressMessage(data);
      },
    });
    self.postMessage({ status: "ready", device: "wasm" });
  } catch (wasmError: any) {
    console.error("WASM initialization failed:", wasmError);
    self.postMessage({
      status: "error",
      error: wasmError.message || "Failed to load model on both WebGPU and WASM.",
    });
  }
}

let shouldAbort = false;

async function generate(messages: any[], maxTokens = 256) {
  if (!generator) {
    self.postMessage({ status: "error", error: "Cognitive core not initialized." });
    return;
  }

  console.log("=== [ai.worker.ts] Start Generation Process ===");
  console.log("Received messages array:", JSON.stringify(messages, null, 2));

  try {
    let chunkCount = 0;
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        if (shouldAbort) {
          console.log("[ai.worker.ts] Generation aborted by user request.");
          throw new Error("GENERATION_ABORTED");
        }
        chunkCount++;
        console.log(`[ai.worker.ts] Chunk #${chunkCount} generated:`, JSON.stringify(text));
        self.postMessage({ status: "chunk", text });
      },
    });

    console.log("[ai.worker.ts] Applying chat template...");
    const prompt = generator.tokenizer.apply_chat_template(messages, {
      tokenize: false,
      add_generation_prompt: true,
    });
    console.log("[ai.worker.ts] Rendered prompt text:\n", prompt);

    console.log("[ai.worker.ts] Running pipeline generator with options:", {
      max_new_tokens: maxTokens,
      do_sample: false,
    });

    const startTime = performance.now();
    const result = await generator(messages, {
      max_new_tokens: maxTokens,
      streamer: streamer,
      do_sample: false, // 禁用随机采样，强制 Greedy Search 避免 ORT WebGPU 采样算子死锁卡死
    });
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    console.log(`=== [ai.worker.ts] Generation Complete! Time taken: ${duration}s ===`);
    console.log("Pipeline generator raw result:", JSON.stringify(result));

    self.postMessage({ status: "complete" });
  } catch (error: any) {
    if (error.message === "GENERATION_ABORTED") {
      self.postMessage({ status: "complete" });
    } else {
      console.error("[ai.worker.ts] Critical error in generator run:", error);
      self.postMessage({
        status: "error",
        error: error.message || "Cognitive overflow during generation.",
      });
    }
  }
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, modelId, remoteHost, messages, maxTokens } = event.data;

  if (type === "start") {
    if (remoteHost) {
      env.remoteHost = remoteHost;
      if (remoteHost.includes("modelscope.cn")) {
        env.remotePathTemplate = "{model}/repo?Revision=master&FilePath=";
      } else {
        env.remotePathTemplate = "{model}/resolve/{revision}/";
      }
    }
    await initPipeline(modelId);
  } else if (type === "chat") {
    shouldAbort = false;
    await generate(messages, maxTokens);
  } else if (type === "abort") {
    shouldAbort = true;
  }
});
