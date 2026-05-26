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
} catch (e) {}

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/pppopipupu_blog" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
