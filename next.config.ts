import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGithubPages ? "/pppopipupu_blog" : "",
  assetPrefix: isGithubPages ? "/pppopipupu_blog" : "",
  trailingSlash: true,
};

export default nextConfig;
