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

export function generateOgpSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811" />
      <stop offset="50%" stop-color="#0a101f" />
      <stop offset="100%" stop-color="#060913" />
    </linearGradient>

    <!-- Card Background Gradient -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>

    <!-- Ambient Glow Orbs -->
    <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="indigoGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="tealGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
    </radialGradient>

    <!-- Title Gradient -->
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f0f9ff" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>

    <!-- Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.2" />
    </pattern>

    <!-- Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&amp;family=JetBrains+Mono:wght@500;700;800&amp;display=swap');
    .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', ui-monospace, Menlo, Monaco, Consolas, monospace; }
  </style>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Ambient Glow Orbs -->
  <circle cx="160" cy="140" r="360" fill="url(#cyanGlow)" />
  <circle cx="1060" cy="180" r="400" fill="url(#indigoGlow)" />
  <circle cx="680" cy="560" r="300" fill="url(#tealGlow)" />

  <!-- Grid Overlay -->
  <rect width="1200" height="630" fill="url(#grid)" />

  <!-- Border Frame -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#334155" stroke-width="1.5" stroke-opacity="0.5" />

  <!-- ================= LEFT COLUMN: INFO & BRANDING ================= -->
  <g transform="translate(68, 70)" class="font-sans">
    
    <!-- Top Pill Badge -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="310" height="34" rx="17" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.7" />
      <circle cx="18" cy="17" r="4.5" fill="#38bdf8" />
      <text x="32" y="22" fill="#93c5fd" font-size="12" font-weight="700" letter-spacing="1.2" class="font-mono">CLOUDFLARE WORKERS ⚡ WASM</text>
    </g>

    <!-- Main Title -->
    <text x="0" y="96" fill="url(#titleGrad)" font-size="52" font-weight="900" letter-spacing="-1">
      Mermaid Playground
    </text>

    <!-- Subtitle -->
    <text x="0" y="136" fill="#94a3b8" font-size="20" font-weight="600" letter-spacing="-0.2">
      Zero-DOM Native Diagram Rendering Microservice
    </text>

    <!-- Description -->
    <text x="0" y="178" fill="#cbd5e1" font-size="15" font-weight="400">
      <tspan x="0" dy="0">High-speed on-the-fly Mermaid conversion into SVG, WebP, PNG &amp; JPEG.</tspan>
      <tspan x="0" dy="24">Interactive GUI with 26+ presets, 10 themes, syntax auto-fix &amp; cache.</tspan>
    </text>

    <!-- Feature Badges Grid -->
    <g transform="translate(0, 240)">
      <!-- Feature 1: Engine -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="220" height="56" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <circle cx="24" cy="28" r="10" fill="#0284c7" fill-opacity="0.25" />
        <text x="24" y="32" text-anchor="middle" fill="#38bdf8" font-size="12">⚡</text>
        <text x="44" y="23" fill="#f8fafc" font-size="13" font-weight="700">WASM Engine</text>
        <text x="44" y="42" fill="#94a3b8" font-size="11" class="font-mono">~10ms Cold Start</text>
      </g>

      <!-- Feature 2: Multi format -->
      <g transform="translate(236, 0)">
        <rect x="0" y="0" width="220" height="56" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <circle cx="24" cy="28" r="10" fill="#6366f1" fill-opacity="0.25" />
        <text x="24" y="32" text-anchor="middle" fill="#818cf8" font-size="12">🎨</text>
        <text x="44" y="23" fill="#f8fafc" font-size="13" font-weight="700">Multi-Format</text>
        <text x="44" y="42" fill="#94a3b8" font-size="11" class="font-mono">SVG, WebP, PNG, JPG</text>
      </g>

      <!-- Feature 3: Presets -->
      <g transform="translate(0, 68)">
        <rect x="0" y="0" width="220" height="56" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <circle cx="24" cy="28" r="10" fill="#14b8a6" fill-opacity="0.25" />
        <text x="24" y="32" text-anchor="middle" fill="#2dd4bf" font-size="12">📊</text>
        <text x="44" y="23" fill="#f8fafc" font-size="13" font-weight="700">26+ Presets</text>
        <text x="44" y="42" fill="#94a3b8" font-size="11" class="font-mono">Flow, Seq, ER, Git...</text>
      </g>

      <!-- Feature 4: Edge Cache -->
      <g transform="translate(236, 68)">
        <rect x="0" y="0" width="220" height="56" rx="10" fill="#0f172a" stroke="#334155" stroke-width="1" />
        <circle cx="24" cy="28" r="10" fill="#f59e0b" fill-opacity="0.25" />
        <text x="24" y="32" text-anchor="middle" fill="#fbbf24" font-size="12">🛡️</text>
        <text x="44" y="23" fill="#f8fafc" font-size="13" font-weight="700">Cache API</text>
        <text x="44" y="42" fill="#94a3b8" font-size="11" class="font-mono">Edge Cached Delivery</text>
      </g>
    </g>

    <!-- Bottom URL Link -->
    <g transform="translate(0, 396)">
      <text x="0" y="16" fill="#64748b" font-size="12" class="font-mono">ENDPOINT: <tspan fill="#38bdf8">/playground</tspan> | <tspan fill="#818cf8">GET /?format=webp</tspan></text>
    </g>
  </g>

  <!-- ================= RIGHT COLUMN: LIVE DIAGRAM PREVIEW CARD ================= -->
  <g transform="translate(620, 65)">
    <!-- Main Preview Window Card -->
    <rect x="0" y="0" width="510" height="480" rx="16" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" filter="url(#shadow)" />

    <!-- Window Title Bar -->
    <rect x="0" y="0" width="510" height="42" rx="16" fill="#0f172a" />
    <rect x="0" y="32" width="510" height="10" fill="#0f172a" />
    <line x1="0" y1="42" x2="510" y2="42" stroke="#1e293b" stroke-width="1" />

    <!-- Window Controls (Red / Yellow / Green) -->
    <circle cx="24" cy="21" r="5.5" fill="#ef4444" />
    <circle cx="42" cy="21" r="5.5" fill="#f59e0b" />
    <circle cx="60" cy="21" r="5.5" fill="#10b981" />

    <!-- Window Title -->
    <text x="255" y="26" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="600" class="font-mono">
      cloudflare-mermaid-flow.svg
    </text>

    <!-- Diagram Canvas Area -->
    <rect x="18" y="58" width="474" height="404" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />

    <!-- Diagram Nodes & Arrows Inside White Canvas -->
    <g transform="translate(42, 90)" class="font-sans">
      <!-- Title inside diagram -->
      <text x="210" y="16" text-anchor="middle" fill="#0f172a" font-size="14" font-weight="800">
        Cloudflare Edge Mermaid Pipeline
      </text>

      <!-- Node 1: Client -->
      <g transform="translate(15, 60)">
        <rect x="0" y="0" width="110" height="60" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
        <text x="55" y="28" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="700">Client 💻</text>
        <text x="55" y="44" text-anchor="middle" fill="#94a3b8" font-size="9" class="font-mono">HTTP Request</text>
      </g>

      <!-- Arrow 1 -->
      <path d="M 125 90 L 155 90" stroke="#0ea5e9" stroke-width="2.5" fill="none" />
      <polygon points="155,86 163,90 155,94" fill="#0ea5e9" />
      <text x="144" y="80" text-anchor="middle" fill="#0284c7" font-size="9" font-weight="700" class="font-mono">GET/POST</text>

      <!-- Node 2: Worker -->
      <g transform="translate(165, 50)">
        <rect x="0" y="0" width="130" height="80" rx="10" fill="#0ea5e9" stroke="#38bdf8" stroke-width="2" />
        <text x="65" y="32" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="800">Worker ⚡</text>
        <text x="65" y="48" text-anchor="middle" fill="#e0f2fe" font-size="10">Hono + WASM</text>
        <text x="65" y="64" text-anchor="middle" fill="#bae6fd" font-size="9" class="font-mono">Cache API</text>
      </g>

      <!-- Arrow 2 -->
      <path d="M 295 90 L 325 90" stroke="#0ea5e9" stroke-width="2.5" fill="none" />
      <polygon points="325,86 333,90 325,94" fill="#0ea5e9" />
      <text x="314" y="80" text-anchor="middle" fill="#0284c7" font-size="9" font-weight="700" class="font-mono">Render</text>

      <!-- Node 3: Output -->
      <g transform="translate(335, 60)">
        <rect x="0" y="0" width="110" height="60" rx="8" fill="#10b981" stroke="#34d399" stroke-width="1.5" />
        <text x="55" y="28" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="700">Output 🎨</text>
        <text x="55" y="44" text-anchor="middle" fill="#ecfdf5" font-size="9" class="font-mono">SVG / WebP</text>
      </g>

      <!-- Second Flow (Formats) -->
      <g transform="translate(30, 180)">
        <rect x="0" y="0" width="390" height="90" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
        <text x="16" y="24" fill="#475569" font-size="11" font-weight="700">Supported Output Formats &amp; Themes:</text>
        
        <!-- Format Pills -->
        <g transform="translate(16, 38)">
          <rect x="0" y="0" width="58" height="24" rx="4" fill="#0284c7" />
          <text x="29" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" class="font-mono">SVG</text>

          <rect x="66" y="0" width="64" height="24" rx="4" fill="#6366f1" />
          <text x="98" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" class="font-mono">WebP</text>

          <rect x="138" y="0" width="58" height="24" rx="4" fill="#10b981" />
          <text x="167" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" class="font-mono">PNG</text>

          <rect x="204" y="0" width="58" height="24" rx="4" fill="#f59e0b" />
          <text x="233" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" class="font-mono">JPEG</text>

          <rect x="270" y="0" width="86" height="24" rx="4" fill="#64748b" />
          <text x="313" y="16" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700" class="font-mono">10 Themes</text>
        </g>
      </g>

      <!-- Status Footer Badge -->
      <g transform="translate(110, 305)">
        <rect x="0" y="0" width="230" height="26" rx="13" fill="#ecfdf5" stroke="#10b981" stroke-width="1" />
        <circle cx="14" cy="13" r="4" fill="#10b981" />
        <text x="120" y="17" text-anchor="middle" fill="#065f46" font-size="10" font-weight="700" class="font-mono">STATUS: 200 OK (8ms Edge)</text>
      </g>

    </g>
  </g>

</svg>`;
}

export async function handleOgpPng(c: Context): Promise<Response> {
  // Cache lookup
  const cache = await caches.open("cloudflare-mermaid");
  const cacheKey = new Request(c.req.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const svg = generateOgpSvg();
  const result = await render({
    value: svg,
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
