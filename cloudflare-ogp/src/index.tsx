import { Hono } from "hono";
import { render } from "wasm-html-to-image/workerd";
import { createCSS } from "wasm-html-to-image/tailwind";
import defaultImageBuffer from "../assets/image.jpg";

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

const DEFAULT_IMAGE = `data:image/jpeg;base64,${toBase64(defaultImageBuffer)}`;

const DEFAULT_MERMAID = `flowchart LR
  Client([Client 🌐]) --> Worker[Worker ⚡]
  Worker --> Cache{Cache?}
  Cache -- Yes --> Image([OGP 🎨])
  Cache -- No --> WASM[WASM 🦀] --> Image
  classDef default fill:#1e1e2e,stroke:#818cf8,stroke-width:1.5px,color:#cdd6f4`;

const DEFAULT_VERTICAL =
  "縦書き上等！、縦書き上等！、縦書き上等！、縦書き上等！、縦書き上等！";

const app = new Hono();

app.get("/", async (c) => {
  const subtitle = c.req.query("subtitle") ?? "subtitle";
  const title = c.req.query("title") ?? "Title";
  const image = c.req.query("image") ?? DEFAULT_IMAGE;
  const mermaidSource = c.req.query("mermaid") ?? DEFAULT_MERMAID;
  const verticalText = c.req.query("vertical") ?? DEFAULT_VERTICAL;

  const cache = await caches.open("satoru-cloudflare-ogp");
  const cacheKey = new Request(c.req.url);

  // Define OGP layout using JSX
  const html = (
    <html className="m-0 p-0">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          .mermaid {
            --mermaid-theme: dark;
            color: #cdd6f4;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
          .mermaid svg {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
          }
          .vertical-pill {
            writing-mode: vertical-rl;
            text-orientation: upright;
            letter-spacing: 0.35em;
            line-height: 1.8;
            word-break: break-all;
            font-family: 'Noto Sans JP', sans-serif;
          }
        `}</style>
      </head>
      <body className="m-0 p-0">
        <div className="w-[1200px] h-[630px] flex relative bg-[#0a0a0c] overflow-hidden">
          {/* Background decorative gradients */}
          <div className="absolute top-[-150px] right-[-150px] w-[600px] h-[600px] rounded-[300px] bg-[radial-gradient(circle,_rgba(79,70,229,0.3)_0%,_rgba(79,70,229,0)_70%)] flex" />
          <div className="absolute bottom-[-100px] left-[-50px] w-[400px] h-[400px] rounded-[200px] bg-[radial-gradient(circle,_rgba(168,85,247,0.2)_0%,_rgba(168,85,247,0)_70%)] flex" />

          {/* Left Column: Typography & Info */}
          <div className="flex flex-col w-[530px] h-full p-[60px] justify-between z-10">
            <div className="flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-10 h-1 bg-[#6366f1] mr-[15px] rounded-sm" />
                <div className="text-2xl font-bold color-[#818cf8] tracking-widest uppercase flex">
                  Featured Content
                </div>
              </div>

              <div className="text-[68px] font-black text-white leading-[1.1] mb-[24px] break-words flex">
                {title}
              </div>

              <div className="text-[28px] font-normal text-[#94a3b8] leading-[1.4] flex">
                {subtitle}
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="flex items-center">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-[10px] text-lg text-[#e2e8f0] font-medium flex">
                satoru-cloudflare-ogp
              </div>
            </div>
          </div>

          {/* Vertical Text Accent Pill (Floating between columns) */}
          {verticalText && verticalText !== "none" ? (
            <div className="absolute top-[60px] left-[570px] z-20">
              <div
                className="vertical-pill text-[13px] font-bold text-[#c7d2fe] backdrop-blur-xs border border-[#818cf8]/40 shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-md inline-block"
                style={{
                  height: "510px",
                  padding: "24px 12px",
                  borderRadius: "24px",
                  boxSizing: "border-box",
                }}
              >
                {verticalText}
              </div>
            </div>
          ) : null}

          {/* Right Column: Layered 1:1 Image + Overlapping Mermaid Window */}
          <div className="relative flex-1 h-full z-10">
            {/* Decorative angled backdrop for the image card */}
            <div className="absolute top-[40px] right-[50px] w-[390px] h-[390px] rounded-[36px] border border-white/10 bg-white/3 rotate-[-3deg] flex" />

            {/* Back Layer: Square Image Card (1:1 Aspect Ratio preserved) */}
            <div className="absolute top-[50px] right-[60px] w-[370px] h-[370px] rounded-[32px] overflow-hidden border-2 border-white/15 shadow-2xl flex">
              <img className="w-full h-full object-cover" src={image} alt="" />
            </div>

            {/* Front Layer: Mermaid Architecture Window (Overlapping) */}
            <div className="absolute bottom-[50px] right-[60px] w-[520px] h-[240px] rounded-[24px] overflow-hidden border border-white/20  p-4 flex flex-col justify-between shadow-[0_25px_50px_rgba(0,0,0,0.8)] back backdrop-blur-xs">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#eab308] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block" />
                  <span className="text-xs text-white/50 ml-2 font-mono">
                    Mermaidも全種類出力可能
                  </span>
                </div>
                <span className="text-[11px] text-[#818cf8] font-mono px-2 py-0.5 rounded bg-[#6366f1]/10 border border-[#6366f1]/20">
                  Mermaid
                </span>
              </div>

              {/* Diagram Body */}
              <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                <div className="mermaid">{mermaidSource}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  ).toString();

  // Render to PNG with automatic font resolution
  const png = await render({
    value: html,
    css: await createCSS(html),
    width: 1200,
    height: 630,
    format: "png",
  });
  const response = new Response(png.data as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      date: new Date().toUTCString(),
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 31536000,
    },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

export default app;
