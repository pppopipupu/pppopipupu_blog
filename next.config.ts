import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

const musicDir = path.join(process.cwd(), "public", "music");
try {
  if (fs.existsSync(musicDir)) {
    const files = fs.readdirSync(musicDir);
    const mp3Files = files.filter((file) => file.endsWith(".mp3"));
    fs.writeFileSync(
      path.join(musicDir, "list.json"),
      JSON.stringify(mp3Files, null, 2)
    );
  }
} catch {}

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/pppopipupu_blog" : "";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: false,
  images: { unoptimized: true },
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // TypeScript 7 is a native compiler with no JS compiler API, so Next cannot import it for its
  // built-in type check. The CLI checker runs the project-local `tsc` instead. It is the default
  // in Next 16.3, pinned explicitly here because `npm run build` depends on it: with the built-in
  // checker there is no way to type check a TypeScript 7 project at all. Upstream still marks the
  // key as experimental - keep it until it graduates.
  experimental: {
    useTypeScriptCli: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
        fs: false,
        path: false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
