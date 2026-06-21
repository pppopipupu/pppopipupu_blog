import { pipeline, TextStreamer, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

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

  // 1. 尝试第一级：WebGPU + q4f16 (针对支持 shader-f16 扩展的显卡，速度极快)
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

  // 2. 尝试第二级：WebGPU + q4 (针对不支持 shader-f16 但支持 WebGPU 的通用显卡，使用 fp32 累加)
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

  try {
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        if (shouldAbort) {
          throw new Error("GENERATION_ABORTED");
        }
        self.postMessage({ status: "chunk", text });
      },
    });

    await generator(messages, {
      max_new_tokens: maxTokens,
      streamer: streamer,
      temperature: 0.7,
      top_p: 0.9,
    });

    self.postMessage({ status: "complete" });
  } catch (error: any) {
    if (error.message === "GENERATION_ABORTED") {
      self.postMessage({ status: "complete" });
    } else {
      console.error("Inference generation error:", error);
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
