import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev only: parity.html posts its results here so they land in ./parity/<name>.json.
const saveParity = (): Plugin => ({
  name: "save-parity",
  configureServer(server) {
    server.middlewares.use("/__parity-save", (req, res) => {
      const name = new URL(req.url ?? "", "http://x").searchParams.get("name") ?? "";
      if (req.method !== "POST" || !/^[\w-]+$/.test(name)) {
        res.statusCode = 400;
        res.end("bad request");
        return;
      }
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const dir = resolve(import.meta.dirname, "parity");
        mkdirSync(dir, { recursive: true });
        const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "node_modules/mermaid/package.json"), "utf8"));
        const data = JSON.parse(body);
        writeFileSync(resolve(dir, `${name}.json`), JSON.stringify({ mermaid: pkg.version, ...data }, null, 2) + "\n");
        res.end("ok");
      });
    });
  },
});

// WASM_LOCAL=<path of a wasm-html-to-image checkout>: use that checkout's packages/html-to-image/dist instead of the
// npm package, so unreleased engine changes show up here (rebuild the checkout first: `pnpm build`).
const local = process.env.WASM_LOCAL;
const dist = local ? resolve(local, "packages/html-to-image/dist").replace(/\\/g, "/") : "";

export default defineConfig({
  base: "./",
  resolve: {
    alias: local
      ? [
          { find: /^wasm-html-to-image\/workers$/, replacement: `${dist}/workers-parent.js` },
          { find: /^wasm-html-to-image$/, replacement: `${dist}/single.js` },
        ]
      : [],
  },
  server: {
    fs: { allow: local ? [".", resolve(local)] : ["."] },
    port: 3001,
    // parity.html writes ./parity/*.json; do not reload the page that is writing them
    watch: { ignored: ["**/parity/**"] },
  },
  optimizeDeps: {
    exclude: ["wasm-html-to-image", "worker-lib"],
  },
  plugins: [tailwindcss(), react(), saveParity()],
});
