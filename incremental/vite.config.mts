import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Relative asset URLs so the bundle works under any basePath (/pppopipupu_blog).
  base: "./",
  plugins: [solid()],
  build: {
    outDir: "../public/incremental",
    emptyOutDir: true,
  },
});