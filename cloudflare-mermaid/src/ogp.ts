import type { Context } from "hono";
import { render } from "wasm-html-to-image";

export function generateFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#favBg)" />
  <!-- Diagram node connectors & lightning bolt -->
  <path d="M 16 38 L 26 24 L 38 40 L 48 26" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="16" cy="38" r="4" fill="#ffffff" />
  <circle cx="26" cy="24" r="4" fill="#38bdf8" />
  <circle cx="38" cy="40" r="4" fill="#818cf8" />
  <circle cx="48" cy="26" r="4" fill="#ffffff" />
  <path d="M 33 12 L 23 30 L 31 30 L 29 48 L 41 28 L 33 28 Z" fill="#facc15" />
</svg>`;
}

export function generateOgpHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background-color: #050811;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #f8fafc;
    }

    .container {
      position: relative;
      width: 1200px;
      height: 630px;
      padding: 50px 60px;
      background: linear-gradient(135deg, #050811 0%, #0a1120 50%, #060913 100%);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Glow Orbs */
    .glow-cyan {
      position: absolute;
      top: -100px;
      left: -100px;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, rgba(2, 132, 199, 0) 70%);
      pointer-events: none;
    }
    .glow-indigo {
      position: absolute;
      top: -80px;
      right: -80px;
      width: 550px;
      height: 550px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%);
      pointer-events: none;
    }
    .glow-teal {
      position: absolute;
      bottom: -150px;
      left: 350px;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, rgba(20, 184, 166, 0) 70%);
      pointer-events: none;
    }

    /* Grid overlay */
    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    /* Outer border frame */
    .border-frame {
      position: absolute;
      inset: 20px;
      border: 1.5px solid rgba(51, 65, 85, 0.45);
      border-radius: 20px;
      pointer-events: none;
    }

    /* Left column */
    .left-col {
      position: relative;
      z-index: 10;
      width: 550px;
      display: flex;
      flex-direction: column;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      padding: 6px 16px;
      border-radius: 20px;
      background: #0f172a;
      border: 1.2px solid #38bdf8;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #93c5fd;
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }

    .title {
      font-size: 50px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -1px;
      margin: 0 0 12px 0;
      background: linear-gradient(90deg, #ffffff 0%, #f0f9ff 60%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 19px;
      font-weight: 600;
      color: #94a3b8;
      margin: 0 0 16px 0;
      letter-spacing: -0.2px;
    }

    .desc {
      font-size: 15px;
      line-height: 1.5;
      color: #cbd5e1;
      margin: 0 0 28px 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .feature-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .feature-icon {
      font-size: 16px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(2, 132, 199, 0.2);
      border-radius: 50%;
    }
    .feature-title {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
    }
    .feature-sub {
      font-size: 11px;
      color: #94a3b8;
      font-family: ui-monospace, Menlo, Monaco, monospace;
    }

    .footer-url {
      font-size: 12px;
      color: #64748b;
      font-family: ui-monospace, Menlo, Monaco, monospace;
    }
    .footer-url span { color: #38bdf8; font-weight: bold; }

    /* Right column: Card Window */
    .right-col {
      position: relative;
      z-index: 10;
      width: 480px;
      display: flex;
      justify-content: center;
    }

    .window-card {
      width: 480px;
      background: #1e293b;
      border: 1.5px solid #334155;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .window-header {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .window-dots {
      display: flex;
      gap: 6px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .window-filename {
      font-size: 11px;
      font-family: ui-monospace, Menlo, Monaco, monospace;
      color: #94a3b8;
      font-weight: 600;
    }

    .diagram-body {
      background: #ffffff;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }

    .diagram-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
    }

    .flow-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
    }

    .node {
      padding: 8px 14px;
      border-radius: 8px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .node-client {
      background: #1e293b;
      border: 1.5px solid #475569;
      color: #ffffff;
    }
    .node-worker {
      background: #0ea5e9;
      border: 2px solid #38bdf8;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
    }
    .node-output {
      background: #10b981;
      border: 1.5px solid #34d399;
      color: #ffffff;
    }

    .node-main { font-size: 12px; font-weight: 700; }
    .node-sub { font-size: 9px; opacity: 0.85; font-family: ui-monospace, monospace; }

    .arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #0284c7;
      font-size: 9px;
      font-weight: 700;
      font-family: ui-monospace, monospace;
    }
    .arrow-line {
      width: 28px;
      height: 2px;
      background: #0ea5e9;
      position: relative;
    }
    .arrow-line::after {
      content: '';
      position: absolute;
      right: 0;
      top: -3px;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 6px solid #0ea5e9;
    }

    .formats-box {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .formats-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
    }
    .pills-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .pill {
      font-size: 9px;
      font-weight: 700;
      font-family: ui-monospace, monospace;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 14px;
      border-radius: 12px;
      background: #ecfdf5;
      border: 1px solid #10b981;
      font-size: 10px;
      font-weight: 700;
      color: #065f46;
      font-family: ui-monospace, monospace;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="glow-cyan"></div>
    <div class="glow-indigo"></div>
    <div class="glow-teal"></div>
    <div class="grid-overlay"></div>
    <div class="border-frame"></div>

    <!-- Left Column -->
    <div class="left-col">
      <div class="badge">
        <div class="badge-dot"></div>
        CLOUDFLARE WORKERS ⚡ WASM
      </div>

      <h1 class="title">Mermaid Playground</h1>
      <div class="subtitle">Zero-DOM Edge Diagram Microservice</div>
      <p class="desc">
        High-speed on-the-fly Mermaid conversion into SVG, WebP, PNG &amp; JPEG.<br>
        Interactive GUI with 26+ presets, 10 themes, syntax auto-fix &amp; edge cache.
      </p>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <div>
            <div class="feature-title">WASM Engine</div>
            <div class="feature-sub">~10ms Cold Start</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon" style="background: rgba(99, 102, 241, 0.2);">🎨</div>
          <div>
            <div class="feature-title">Multi-Format</div>
            <div class="feature-sub">SVG, WebP, PNG, JPG</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon" style="background: rgba(20, 184, 166, 0.2);">📊</div>
          <div>
            <div class="feature-title">26+ Presets</div>
            <div class="feature-sub">Flow, Seq, ER, Git...</div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon" style="background: rgba(245, 158, 11, 0.2);">🛡️</div>
          <div>
            <div class="feature-title">Cache API</div>
            <div class="feature-sub">Edge Cached Delivery</div>
          </div>
        </div>
      </div>

      <div class="footer-url">
        ENDPOINT: <span>/playground</span> | <span>GET /?format=webp</span>
      </div>
    </div>

    <!-- Right Column: Card Preview -->
    <div class="right-col">
      <div class="window-card">
        <div class="window-header">
          <div class="window-dots">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
          </div>
          <div class="window-filename">cloudflare-mermaid-flow.svg</div>
          <div style="width: 42px;"></div>
        </div>

        <div class="diagram-body">
          <div class="diagram-title">Cloudflare Edge Mermaid Pipeline</div>

          <div class="flow-row">
            <div class="node node-client">
              <div class="node-main">Client 💻</div>
              <div class="node-sub">HTTP Request</div>
            </div>

            <div class="arrow">
              <span>GET/POST</span>
              <div class="arrow-line"></div>
            </div>

            <div class="node node-worker">
              <div class="node-main">Worker ⚡</div>
              <div class="node-sub">Hono + WASM</div>
            </div>

            <div class="arrow">
              <span>Render</span>
              <div class="arrow-line"></div>
            </div>

            <div class="node node-output">
              <div class="node-main">Output 🎨</div>
              <div class="node-sub">SVG / WebP</div>
            </div>
          </div>

          <div class="formats-box">
            <div class="formats-title">Supported Formats &amp; Features:</div>
            <div class="pills-row">
              <span class="pill" style="background: #0284c7;">SVG</span>
              <span class="pill" style="background: #6366f1;">WebP</span>
              <span class="pill" style="background: #10b981;">PNG</span>
              <span class="pill" style="background: #f59e0b;">JPEG</span>
              <span class="pill" style="background: #475569;">10 Themes</span>
              <span class="pill" style="background: #0d9488;">Auto-Fix Mode</span>
            </div>
          </div>

          <div class="status-badge">
            <div class="status-dot"></div>
            STATUS: 200 OK (8ms Edge)
          </div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}

export async function handleOgpPng(c: Context): Promise<Response> {
  // Cache lookup
  const cache = await caches.open("cloudflare-mermaid");
  const cacheKey = new Request(c.req.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const html = generateOgpHtml();
  const result = await render({
    value: html,
    format: "png",
    width: 1200,
    height: 630,
  });

  const response = new Response(result.data as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });

  if (c.executionCtx) {
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
