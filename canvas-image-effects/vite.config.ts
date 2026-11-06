import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  server: {
    port: 3002,
    open: true,
  },
  // Keep the wasm-html-to-image runtime URL resolution (`new URL("./web-workers.js", import.meta.url)`)
  // working in dev exactly as in the built output.
  optimizeDeps: {
    exclude: ["wasm-html-to-image", "worker-lib"],
  },
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
