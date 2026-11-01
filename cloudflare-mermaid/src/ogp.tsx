import type { Context } from "hono";
import { raw } from "hono/html";
import type { FC } from "hono/jsx";
import { render, MERMAID_THEMES, type MermaidTheme } from "wasm-html-to-image";
import { PRESETS } from "./presets.js";

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

function makeSvgResponsive(svg: string): string {
  const rootTagMatch = svg.match(/<svg\b([^>]*)>/i);
  if (!rootTagMatch) return svg;

  let rootAttrs = rootTagMatch[1];
  const hasViewBox = /\bviewBox\s*=/i.test(rootAttrs);

  if (!hasViewBox) {
    const widthMatch = rootAttrs.match(/\bwidth\s*=\s*["']?([\d.]+)(?:px)?["']?/i);
    const heightMatch = rootAttrs.match(/\bheight\s*=\s*["']?([\d.]+)(?:px)?["']?/i);
    if (widthMatch && heightMatch) {
      const w = widthMatch[1];
      const h = heightMatch[1];
      rootAttrs += ` viewBox="0 0 ${w} ${h}"`;
    }
  }

  if (!/\bpreserveAspectRatio\s*=/i.test(rootAttrs)) {
    rootAttrs += ' preserveAspectRatio="xMidYMid meet"';
  }

  rootAttrs = rootAttrs
    .replace(/\bwidth\s*=\s*["']?[^"'\s>]+["']?/gi, 'width="100%"')
    .replace(/\bheight\s*=\s*["']?[^"'\s>]+["']?/gi, 'height="100%"');

  return svg.replace(rootTagMatch[0], `<svg ${rootAttrs}>`);
}

interface OgpCardProps {
  diagramSvg: string;
  presetName: string;
  theme: string;
  mode: string;
  bg: string;
}

export const OgpCard: FC<OgpCardProps> = ({
  diagramSvg,
  presetName,
  theme,
  mode,
  bg,
}) => {
  const canvasBg = bg === "transparent" ? "transparent" : bg;

  const styles = `
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

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .border-frame {
      position: absolute;
      inset: 20px;
      border: 1.5px solid rgba(51, 65, 85, 0.45);
      border-radius: 20px;
      pointer-events: none;
    }

    .left-col {
      position: relative;
      z-index: 10;
      width: 530px;
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
      font-size: 48px;
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
      font-size: 14px;
      line-height: 1.5;
      color: #cbd5e1;
      margin: 0 0 24px 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 22px;
    }
    .feature-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .feature-icon {
      font-size: 15px;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(2, 132, 199, 0.2);
      border-radius: 50%;
    }
    .feature-title {
      font-size: 12px;
      font-weight: 700;
      color: #f8fafc;
    }
    .feature-sub {
      font-size: 10px;
      color: #94a3b8;
      font-family: ui-monospace, Menlo, Monaco, monospace;
    }

    .footer-url {
      font-size: 12px;
      color: #64748b;
      font-family: ui-monospace, Menlo, Monaco, monospace;
    }
    .footer-url span { color: #38bdf8; font-weight: bold; }

    .right-col {
      position: relative;
      z-index: 10;
      width: 510px;
      display: flex;
      justify-content: center;
    }

    .window-card {
      width: 510px;
      height: 480px;
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
      shrink: 0;
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
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .window-badges {
      display: flex;
      gap: 6px;
    }
    .meta-tag {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      font-family: ui-monospace, monospace;
      font-weight: bold;
    }

    .diagram-body {
      flex: 1;
      min-height: 0;
      background-color: ${canvasBg};
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .diagram-container {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .diagram-container svg {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      display: block !important;
      margin: auto !important;
      object-fit: contain !important;
    }

    .checkered-pattern {
      background-color: #0f172a;
      background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1e293b 75%),
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    }

    .window-footer {
      background: #0f172a;
      border-top: 1px solid #1e293b;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      font-family: ui-monospace, monospace;
      color: #94a3b8;
    }
    .live-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #10b981;
      font-weight: bold;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }
  `;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body>
        <div class="container">
          <div class="glow-cyan" />
          <div class="glow-indigo" />
          <div class="glow-teal" />
          <div class="grid-overlay" />
          <div class="border-frame" />

          {/* Left Column */}
          <div class="left-col">
            <div class="badge">
              <div class="badge-dot" />
              CLOUDFLARE WORKERS ⚡ WASM
            </div>

            <h1 class="title">Mermaid Playground</h1>
            <div class="subtitle">Zero-DOM Edge Diagram Microservice</div>
            <p class="desc">
              High-speed on-the-fly Mermaid conversion into SVG, WebP, PNG &amp; JPEG.<br />
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
              ENDPOINT: <span>/ui</span> | <span>GET /?format=webp</span>
            </div>
          </div>

          {/* Right Column: Card Preview with Rendered Diagram */}
          <div class="right-col">
            <div class="window-card">
              <div class="window-header">
                <div class="window-dots">
                  <div class="dot dot-red" />
                  <div class="dot dot-yellow" />
                  <div class="dot dot-green" />
                </div>
                <div class="window-filename">{presetName}.svg</div>
                <div class="window-badges">
                  <span class="meta-tag">{theme}</span>
                  <span class="meta-tag">{mode}</span>
                </div>
              </div>

              <div class={`diagram-body ${bg === "transparent" ? "checkered-pattern" : ""}`}>
                <div class="diagram-container">
                  {raw(diagramSvg)}
                </div>
              </div>

              <div class="window-footer">
                <div class="live-badge">
                  <div class="live-dot" />
                  LIVE WASM RENDER
                </div>
                <div>200 OK (Edge)</div>
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  );
};

export async function handleOgpPng(c: Context): Promise<Response> {
  const cache = await caches.open("cloudflare-mermaid");
  const cacheKey = new Request(c.req.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(c.req.url);
  const presetId = url.searchParams.get("preset");
  const matchedPreset = PRESETS.find((p) => p.id === presetId);

  let code = url.searchParams.get("code") || url.searchParams.get("mermaid");
  if (!code) {
    code = matchedPreset ? matchedPreset.code : PRESETS[0].code;
  }

  const presetName = matchedPreset
    ? matchedPreset.name
    : (url.searchParams.get("title") || "diagram");
  const themeParam = url.searchParams.get("theme") || "light";
  const theme: MermaidTheme =
    themeParam in MERMAID_THEMES ? (themeParam as MermaidTheme) : "light";
  const mode = (url.searchParams.get("mode") ||
    (matchedPreset?.recommendedMode ?? "strict")) as
    | "strict"
    | "compat"
    | "recover";
  const bg =
    url.searchParams.get("bg") ||
    url.searchParams.get("background") ||
    "#ffffff";

  let diagramSvg = "";
  try {
    const result = await render({
      mermaid: {
        source: code,
        theme,
        mode,
        background: bg === "transparent" ? undefined : bg,
        padding: 16,
        directives: true,
      },
      format: "svg",
    });
    diagramSvg =
      typeof result.data === "string"
        ? result.data
        : new TextDecoder().decode(result.data as Uint8Array);
    diagramSvg = makeSvgResponsive(diagramSvg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const escaped = msg.replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[ch] || ch);
    diagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 140" width="450" height="140">
      <rect width="450" height="140" rx="8" fill="#450a0a" stroke="#dc2626" stroke-width="2"/>
      <text x="20" y="40" fill="#f87171" font-size="16" font-family="monospace" font-weight="bold">Mermaid Render Error</text>
      <text x="20" y="75" fill="#fca5a5" font-size="12" font-family="monospace">${escaped.slice(0, 60)}</text>
    </svg>`;
  }

  // Render JSX component to string
  const ogpComponent = (
    <OgpCard
      diagramSvg={diagramSvg}
      presetName={presetName}
      theme={theme}
      mode={mode}
      bg={bg}
    />
  );
  const html = `<!DOCTYPE html>\n${ogpComponent.toString()}`;

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
