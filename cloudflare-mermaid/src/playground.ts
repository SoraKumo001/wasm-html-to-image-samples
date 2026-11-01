import { PRESETS } from "./presets.js";
import { MERMAID_THEMES } from "wasm-html-to-image";

export function renderPlaygroundHtml(origin: string = "", search: string = ""): string {
  const ogImageUrl = `${origin}/og.png${search}`;
  const themeOptions = Object.keys(MERMAID_THEMES)
    .map((theme) => `<option value="${theme}" ${theme === "light" ? "selected" : ""}>${theme}</option>`)
    .join("");

  // Group presets by category
  const categories = new Map<string, typeof PRESETS>();
  for (const p of PRESETS) {
    const list = categories.get(p.category) || [];
    list.push(p);
    categories.set(p.category, list);
  }

  let presetOptions = "";
  for (const [cat, items] of categories.entries()) {
    presetOptions += `<optgroup label="${cat}">`;
    for (const item of items) {
      presetOptions += `<option value="${item.id}">${item.name}</option>`;
    }
    presetOptions += `</optgroup>`;
  }

  const presetsJson = JSON.stringify(PRESETS).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="ja" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cloudflare Mermaid Playground ⚡ - WASM Powered Microservice</title>
  <meta name="description" content="Cloudflare Workers 上で WASM エンジンを活用し、Mermaid ダイアグラムをオンザフライで SVG / WebP / PNG / JPEG 等に高速変換・配信するプレイグラウンド。全26種プリセット、10テーマ、構文自動修復に対応。">
  <meta name="theme-color" content="#0f172a">
  <link rel="icon" type="image/svg+xml" href="${origin}/favicon.svg">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/ui${search}">
  <meta property="og:site_name" content="Cloudflare Mermaid">
  <meta property="og:title" content="Cloudflare Mermaid Playground ⚡ - WASM Powered Microservice">
  <meta property="og:description" content="Cloudflare Workers WASM エンジンによる超高速 Mermaid レンダリングマイクロサービス。SVG/WebP/PNG/JPEG 変換や各種テーマ、構文修復、パラメータ調整をリアルタイムに試せるプレイグラウンド。">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:secure_url" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Cloudflare Mermaid Playground - Zero-DOM WASM diagram renderer preview">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${origin}/ui${search}">
  <meta name="twitter:title" content="Cloudflare Mermaid Playground ⚡ - WASM Powered Microservice">
  <meta name="twitter:description" content="Cloudflare Workers WASM エンジンによる超高速 Mermaid レンダリングマイクロサービス。SVG/WebP/PNG/JPEG 変換や各種テーマ、構文修復、パラメータ調整をリアルタイムに試せるプレイグラウンド。">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:image:alt" content="Cloudflare Mermaid Playground - Zero-DOM WASM diagram renderer preview">

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' }
          }
        }
      }
    }
  </script>
  <style>
    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #475569; }
    
    #diagramCard {
      transition: background-color 0.2s, box-shadow 0.2s;
    }
    #svgContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: calc(100vh - 160px);
    }
    #svgContainer svg {
      display: block;
      margin: auto;
      max-width: 100%;
      max-height: calc(100vh - 160px);
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .checkered-pattern {
      background-color: #0f172a;
      background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1e293b 75%),
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">

  <!-- Header -->
  <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xl">⚡</span>
        <h1 class="text-base sm:text-lg font-bold bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
          Cloudflare Mermaid Playground
        </h1>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono hidden sm:inline">
        WASM Engine v1.1.0 (${PRESETS.length} Presets)
      </span>
    </div>

    <div class="flex items-center gap-2 text-xs">
      <a href="/" target="_blank" class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 border border-slate-700">
        <span>Raw API</span>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
      </a>
      <a href="https://github.com/mermaid-js/mermaid" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors hidden md:inline border border-slate-700">
        Mermaid Docs
      </a>
    </div>
  </header>

  <!-- Main Grid -->
  <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">

    <!-- Left Column: Controls & Code Editor (5 cols) -->
    <section class="lg:col-span-5 bg-slate-900/60 border-r border-slate-800 flex flex-col min-h-0 overflow-y-auto">
      
      <!-- Presets & Quick Action -->
      <div class="p-3 border-b border-slate-800 bg-slate-900/40">
        <label class="block text-xs font-semibold text-slate-400 mb-1">Preset Diagrams (${PRESETS.length} available)</label>
        <select id="presetSelect" class="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer">
          ${presetOptions}
        </select>
        <p id="presetDesc" class="text-[11px] text-slate-400 mt-1 truncate"></p>
      </div>

      <!-- Parameter Controls Grid -->
      <div class="p-3 border-b border-slate-800 bg-slate-900/20 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        
        <!-- Theme -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Theme</label>
          <select id="themeSelect" class="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer">
            ${themeOptions}
          </select>
        </div>

        <!-- Format -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Format</label>
          <select id="formatSelect" class="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer">
            <option value="svg" selected>SVG (Vector)</option>
            <option value="webp">WebP (Raster)</option>
            <option value="png">PNG (Raster)</option>
            <option value="jpeg">JPEG (Raster)</option>
          </select>
        </div>

        <!-- Mode -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Parse Mode</label>
          <select id="modeSelect" class="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer">
            <option value="strict" selected>strict (Standard)</option>
            <option value="compat">compat (Tolerant)</option>
            <option value="recover">recover (Auto-fix)</option>
          </select>
        </div>

        <!-- Padding -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-400 mb-1">Padding (px)</label>
          <div class="flex items-center gap-1.5">
            <input type="number" id="paddingInput" min="0" max="100" step="4" value="16" class="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-sky-500">
          </div>
        </div>

        <!-- Options: Directives & Download -->
        <div class="col-span-2 sm:col-span-2 flex items-center justify-around bg-slate-950/60 border border-slate-800 rounded-md px-2 py-1">
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="directivesCheck" checked class="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-950">
            <span class="text-slate-300 text-[11px]">Allow %%directives%%</span>
          </label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" id="downloadCheck" class="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-950">
            <span class="text-slate-300 text-[11px]">Download Header</span>
          </label>
        </div>

      </div>

      <!-- Background Selector Section (Full Width) -->
      <div class="px-3 py-2.5 border-b border-slate-800 bg-slate-900/40 text-xs">
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-[11px] font-semibold text-slate-400">Background Color (Default: White #ffffff)</label>
          <!-- Quick Color Palette -->
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-slate-500 mr-0.5">Quick:</span>
            <button type="button" data-color="#ffffff" title="White (Default)" class="color-preset-btn w-4 h-4 rounded-full border border-slate-400 bg-white shadow-sm hover:scale-110 transition-transform"></button>
            <button type="button" data-color="transparent" title="Transparent" class="color-preset-btn w-4 h-4 rounded-full border border-slate-600 bg-slate-800 relative overflow-hidden shadow-sm hover:scale-110 transition-transform">
              <span class="absolute inset-0 block text-[8px] leading-3 text-slate-400 font-mono">⛶</span>
            </button>
            <button type="button" data-color="#f8fafc" title="Slate 50 (Soft White)" class="color-preset-btn w-4 h-4 rounded-full border border-slate-500 bg-[#f8fafc] shadow-sm hover:scale-110 transition-transform"></button>
            <button type="button" data-color="#0f172a" title="Slate 900 (Dark)" class="color-preset-btn w-4 h-4 rounded-full border border-slate-700 bg-[#0f172a] shadow-sm hover:scale-110 transition-transform"></button>
            <button type="button" data-color="#1e293b" title="Slate 800" class="color-preset-btn w-4 h-4 rounded-full border border-slate-600 bg-[#1e293b] shadow-sm hover:scale-110 transition-transform"></button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Color Picker Button with Swatch -->
          <div class="relative flex items-center">
            <input type="color" id="bgColorPicker" value="#ffffff" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-700 bg-slate-950 p-0.5 transition-colors">
          </div>
          <!-- Text Input for Color / Transparent -->
          <div class="relative flex-1">
            <input type="text" id="bgInput" value="#ffffff" placeholder="#ffffff or transparent" class="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs">
          </div>
          <!-- Reset to White button -->
          <button type="button" id="resetBgBtn" title="Reset to White" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors">
            Reset White
          </button>
        </div>
      </div>

      <!-- Editor Section -->
      <div class="flex-1 flex flex-col p-3 min-h-[280px]">
        <div class="flex items-center justify-between mb-1.5">
          <label for="codeInput" class="text-xs font-semibold text-slate-400">Mermaid Code</label>
          <div class="flex items-center gap-2 text-xs">
            <label class="flex items-center gap-1 cursor-pointer select-none text-slate-400 text-[11px]">
              <input type="checkbox" id="autoRenderCheck" checked class="rounded border-slate-700 text-sky-500 focus:ring-0 bg-slate-950">
              Auto Render
            </label>
            <span class="text-slate-600">|</span>
            <span class="text-[10px] text-slate-500 hidden sm:inline">Ctrl + Enter to render</span>
          </div>
        </div>
        <textarea id="codeInput" spellcheck="false" class="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none leading-relaxed transition-colors shadow-inner"></textarea>
      </div>

      <!-- Render Button -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
        <button id="renderBtn" type="button" class="flex-1 py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2">
          <svg id="spinner" class="hidden w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span id="renderBtnText">Render Diagram</span>
        </button>
      </div>

    </section>

    <!-- Right Column: Live Preview & URL Inspector (7 cols) -->
    <section class="lg:col-span-7 flex flex-col min-h-0 bg-slate-950">
      
      <!-- Preview Header & Metrics -->
      <div class="border-b border-slate-800 px-4 py-2 bg-slate-900/40 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-400">Preview</span>
          <div class="flex items-center gap-2 text-[11px] text-slate-400">
            <span id="metricTime" class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">-- ms</span>
            <span id="metricSize" class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">-- KB</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button id="openNewTabBtn" title="Open Image in New Tab" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
          <button id="downloadBtn" title="Download Image File" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
        </div>
      </div>

      <!-- Preview Canvas Area -->
      <div id="canvasWrapper" class="flex-1 relative overflow-auto p-6 flex flex-col min-h-0 checkered-pattern transition-colors">
        <!-- Diagram Card Box (Centrally aligned, never clipped) -->
        <div id="diagramCard" class="m-auto max-w-full flex items-center justify-center p-6 rounded-xl shadow-2xl transition-all border border-slate-800">
          <!-- SVG container -->
          <div id="svgContainer" class="flex items-center justify-center max-w-full"></div>
          <!-- Raster Image Preview -->
          <img id="rasterPreview" class="hidden max-w-full max-h-[72vh] object-contain rounded" alt="Diagram preview" />
        </div>
        <!-- Error box -->
        <div id="errorAlert" class="hidden m-auto max-w-lg p-4 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs shadow-xl">
          <div class="font-bold mb-1 flex items-center gap-1.5 text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Render Error
          </div>
          <p id="errorMsg" class="font-mono whitespace-pre-wrap"></p>
        </div>
      </div>

      <!-- URL & API Inspector Toolbar (Bottom) -->
      <div class="border-t border-slate-800 bg-slate-900/80 p-3 flex flex-col gap-2 shrink-0">
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] font-semibold text-slate-400">Request URL (GET) &amp; Share</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button id="copyPageUrlBtn" type="button" class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors">
                Copy Page Link
              </button>
              <button id="copyUrlBtn" type="button" class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors">
                Copy Raw URL
              </button>
              <button id="copyCurlBtn" type="button" class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors">
                Copy cURL
              </button>
            </div>
          </div>
          <input type="text" id="requestUrlInput" readonly class="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300 select-all focus:outline-none focus:border-sky-500">
        </div>
      </div>

    </section>

  </main>

  <script>
    const PRESETS = ${presetsJson};

    const dom = {
      presetSelect: document.getElementById('presetSelect'),
      presetDesc: document.getElementById('presetDesc'),
      themeSelect: document.getElementById('themeSelect'),
      formatSelect: document.getElementById('formatSelect'),
      modeSelect: document.getElementById('modeSelect'),
      paddingInput: document.getElementById('paddingInput'),
      bgInput: document.getElementById('bgInput'),
      bgColorPicker: document.getElementById('bgColorPicker'),
      resetBgBtn: document.getElementById('resetBgBtn'),
      directivesCheck: document.getElementById('directivesCheck'),
      downloadCheck: document.getElementById('downloadCheck'),
      autoRenderCheck: document.getElementById('autoRenderCheck'),
      codeInput: document.getElementById('codeInput'),
      renderBtn: document.getElementById('renderBtn'),
      renderBtnText: document.getElementById('renderBtnText'),
      spinner: document.getElementById('spinner'),
      canvasWrapper: document.getElementById('canvasWrapper'),
      diagramCard: document.getElementById('diagramCard'),
      svgContainer: document.getElementById('svgContainer'),
      rasterPreview: document.getElementById('rasterPreview'),
      errorAlert: document.getElementById('errorAlert'),
      errorMsg: document.getElementById('errorMsg'),
      metricTime: document.getElementById('metricTime'),
      metricSize: document.getElementById('metricSize'),
      requestUrlInput: document.getElementById('requestUrlInput'),
      copyPageUrlBtn: document.getElementById('copyPageUrlBtn'),
      copyUrlBtn: document.getElementById('copyUrlBtn'),
      copyCurlBtn: document.getElementById('copyCurlBtn'),
      openNewTabBtn: document.getElementById('openNewTabBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
    };

    let debounceTimer = null;
    let currentBlobUrl = null;

    const STORAGE_KEY_PRESET = 'cf_mermaid_preset';

    // Load preset by ID and optionally force recommended mode
    function loadPreset(presetId, updateCode = true) {
      const preset = PRESETS.find(p => p.id === presetId) || PRESETS[0];
      dom.presetSelect.value = preset.id;
      dom.presetDesc.textContent = preset.description || '';
      try {
        localStorage.setItem(STORAGE_KEY_PRESET, preset.id);
      } catch (e) {}

      if (updateCode) {
        dom.codeInput.value = preset.code;
        if (preset.recommendedMode) {
          dom.modeSelect.value = preset.recommendedMode;
        }
      }
    }

    // Set background color helper
    function setBackgroundColor(color, triggerRender = true) {
      dom.bgInput.value = color;
      if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
        dom.bgColorPicker.value = color.length === 4 
          ? '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3] 
          : color;
      }
      updatePreviewBackground();
      updateUrlDisplay();
      syncAddressBarUrl();
      if (triggerRender) {
        scheduleAutoRender();
      }
    }

    function updatePreviewBackground() {
      const bg = dom.bgInput.value.trim().toLowerCase();
      if (!bg || bg === 'transparent') {
        dom.canvasWrapper.classList.add('checkered-pattern');
        dom.canvasWrapper.style.backgroundColor = '';
        dom.diagramCard.style.backgroundColor = 'transparent';
        dom.diagramCard.classList.remove('shadow-2xl', 'border-slate-800');
        dom.diagramCard.classList.add('border-dashed', 'border-slate-800');
        dom.rasterPreview.style.backgroundColor = 'transparent';
      } else {
        dom.canvasWrapper.classList.remove('checkered-pattern');
        dom.canvasWrapper.style.backgroundColor = '#0b0f19';
        dom.diagramCard.style.backgroundColor = bg;
        dom.diagramCard.classList.remove('border-dashed');
        dom.diagramCard.classList.add('shadow-2xl', 'border-slate-800');
        dom.rasterPreview.style.backgroundColor = bg;
      }
    }

    // Build URL query string for Raw API (GET /)
    function buildQuery(download = false) {
      const params = new URLSearchParams();
      const code = dom.codeInput.value.trim();
      const format = dom.formatSelect.value;
      const theme = dom.themeSelect.value;
      const mode = dom.modeSelect.value;
      const padding = dom.paddingInput.value;
      const bg = dom.bgInput.value.trim();
      const directives = dom.directivesCheck.checked;

      if (code) params.set('code', code);
      if (format !== 'svg') params.set('format', format);
      if (theme !== 'light') params.set('theme', theme);
      if (mode !== 'strict') params.set('mode', mode);
      if (padding && padding !== '16') params.set('padding', padding);
      if (bg && bg !== '#ffffff') params.set('bg', bg);
      if (!directives) params.set('directives', 'false');
      if (download || dom.downloadCheck.checked) params.set('download', 'true');

      return params;
    }

    // Sync state into browser address bar (window.location.search)
    function syncAddressBarUrl() {
      const params = new URLSearchParams();
      const currentPreset = PRESETS.find(p => p.id === dom.presetSelect.value) || PRESETS[0];
      const code = dom.codeInput.value.trim();

      // Always save preset ID to URL and localStorage
      params.set('preset', currentPreset.id);
      try {
        localStorage.setItem(STORAGE_KEY_PRESET, currentPreset.id);
      } catch (e) {}

      // If code was customized from the preset's original code, save code parameter
      if (code && code !== currentPreset.code.trim()) {
        params.set('code', code);
      }

      const format = dom.formatSelect.value;
      if (format !== 'svg') params.set('format', format);

      const theme = dom.themeSelect.value;
      if (theme !== 'light') params.set('theme', theme);

      const mode = dom.modeSelect.value;
      const defaultMode = currentPreset.recommendedMode || 'strict';
      if (mode !== defaultMode) params.set('mode', mode);

      const padding = dom.paddingInput.value;
      if (padding && padding !== '16') params.set('padding', padding);

      const bg = dom.bgInput.value.trim();
      if (bg && bg !== '#ffffff') params.set('bg', bg);

      if (!dom.directivesCheck.checked) params.set('directives', 'false');
      if (dom.downloadCheck.checked) params.set('download', 'true');

      const queryString = params.toString();
      const newPath = queryString ? \`\${window.location.pathname}?\${queryString}\` : window.location.pathname;
      window.history.replaceState(null, '', newPath);

      // Dynamically update OGP image meta tags to match current parameters
      const origin = window.location.origin;
      const ogUrl = queryString ? \`\${origin}/og.png?\${queryString}\` : \`\${origin}/og.png\`;
      const metaOgImage = document.querySelector('meta[property="og:image"]');
      const metaTwitterImage = document.querySelector('meta[name="twitter:image"]');
      if (metaOgImage) metaOgImage.setAttribute('content', ogUrl);
      if (metaTwitterImage) metaTwitterImage.setAttribute('content', ogUrl);
    }

    // Read state from URL on initial load or popstate (falls back to localStorage)
    function loadStateFromUrl() {
      const params = new URLSearchParams(window.location.search);

      // 1. Preset (check URL parameter first, fallback to localStorage)
      let presetId = params.get('preset');
      if (!presetId) {
        try {
          presetId = localStorage.getItem(STORAGE_KEY_PRESET);
        } catch (e) {}
      }
      const matchedPreset = PRESETS.find(p => p.id === presetId);
      if (matchedPreset) {
        dom.presetSelect.value = matchedPreset.id;
      }
      const activePreset = PRESETS.find(p => p.id === dom.presetSelect.value) || PRESETS[0];
      dom.presetDesc.textContent = activePreset.description || '';

      // 2. Code
      const codeParam = params.get('code') || params.get('mermaid');
      if (codeParam !== null && codeParam.trim().length > 0) {
        dom.codeInput.value = codeParam;
      } else {
        dom.codeInput.value = activePreset.code;
      }

      // 3. Theme
      const themeParam = params.get('theme');
      if (themeParam && dom.themeSelect.querySelector(\`option[value="\${themeParam}"]\`)) {
        dom.themeSelect.value = themeParam;
      }

      // 4. Format
      const formatParam = params.get('format');
      if (formatParam && dom.formatSelect.querySelector(\`option[value="\${formatParam}"]\`)) {
        dom.formatSelect.value = formatParam;
      }

      // 5. Mode
      const modeParam = params.get('mode');
      if (modeParam && ['strict', 'compat', 'recover'].includes(modeParam)) {
        dom.modeSelect.value = modeParam;
      } else if (codeParam === null && activePreset.recommendedMode) {
        dom.modeSelect.value = activePreset.recommendedMode;
      }

      // 6. Padding
      const paddingParam = params.get('padding');
      if (paddingParam !== null && !isNaN(parseInt(paddingParam, 10))) {
        dom.paddingInput.value = paddingParam;
      }

      // 7. Background
      const bgParam = params.get('bg') || params.get('background');
      if (bgParam !== null) {
        setBackgroundColor(bgParam, false);
      } else {
        setBackgroundColor('#ffffff', false);
      }

      // 8. Directives
      const directivesParam = params.get('directives');
      if (directivesParam === 'false' || directivesParam === 'off') {
        dom.directivesCheck.checked = false;
      }

      // 9. Download
      if (params.get('download') === 'true') {
        dom.downloadCheck.checked = true;
      }
    }

    function updateUrlDisplay() {
      const params = buildQuery();
      const origin = window.location.origin;
      const fullUrl = \`\${origin}/?\${params.toString()}\`;
      dom.requestUrlInput.value = fullUrl;
    }

    function normalizeSvg(svg) {
      if (!svg || typeof svg !== 'string') return svg;
      return svg.replace(/<svg\b([^>]*?)>/i, (_match, attrs) => {
        let newAttrs = attrs;
        const widthMatch = newAttrs.match(/\\bwidth=["']?([\\d.]+)(?:px)?["']?/i);
        const heightMatch = newAttrs.match(/\\bheight=["']?([\\d.]+)(?:px)?["']?/i);
        const hasViewBox = /\\bviewBox=/i.test(newAttrs);
        let vb = '';
        if (!hasViewBox && widthMatch && heightMatch) {
          vb = \`viewBox="0 \${widthMatch[1]} \${heightMatch[1]}"\`;
        }
        newAttrs = newAttrs.replace(/\\bstyle="([^"]*)"/i, (_, styleContent) => {
          const cleaned = styleContent
            .replace(/max-width:\\s*[^;]+;?/gi, '')
            .replace(/width:\\s*[^;]+;?/gi, '')
            .trim();
          return cleaned ? \`style="\${cleaned}"\` : '';
        });
        if (!/\\bpreserveAspectRatio=/i.test(newAttrs)) {
          newAttrs += ' preserveAspectRatio="xMidYMid meet"';
        }
        if (vb) {
          newAttrs += \` \${vb}\`;
        }
        return \`<svg \${newAttrs}>\`;
      });
    }

    async function executeRender() {
      const code = dom.codeInput.value.trim();
      const format = dom.formatSelect.value;
      updatePreviewBackground();
      updateUrlDisplay();
      syncAddressBarUrl();

      dom.spinner.classList.remove('hidden');
      dom.renderBtnText.textContent = 'Rendering...';
      dom.errorAlert.classList.add('hidden');

      const startTime = performance.now();

      try {
        // Use POST to avoid URL length issues with larger diagrams
        const params = buildQuery();
        params.delete('code');
        const postUrl = \`/?\${params.toString()}\`;

        const response = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const elapsed = Math.round(performance.now() - startTime);
        dom.metricTime.textContent = \`\${elapsed} ms\`;

        const blob = await response.blob();
        const sizeKb = (blob.size / 1024).toFixed(1);
        dom.metricSize.textContent = \`\${sizeKb} KB\`;

        if (!response.ok) {
          const errorText = await blob.text();
          throw new Error(errorText);
        }

        if (currentBlobUrl) {
          URL.revokeObjectURL(currentBlobUrl);
          currentBlobUrl = null;
        }

        if (format === 'svg') {
          const rawSvgText = await blob.text();
          const svgText = normalizeSvg(rawSvgText);
          dom.rasterPreview.classList.add('hidden');
          dom.svgContainer.classList.remove('hidden');
          dom.svgContainer.innerHTML = svgText;
        } else {
          currentBlobUrl = URL.createObjectURL(blob);
          dom.svgContainer.classList.add('hidden');
          dom.rasterPreview.classList.remove('hidden');
          dom.rasterPreview.src = currentBlobUrl;
        }
      } catch (err) {
        console.error('Render failure:', err);
        dom.svgContainer.innerHTML = '';
        dom.rasterPreview.classList.add('hidden');
        dom.errorAlert.classList.remove('hidden');
        dom.errorMsg.textContent = err.message || String(err);
      } finally {
        dom.spinner.classList.add('hidden');
        dom.renderBtnText.textContent = 'Render Diagram';
      }
    }

    function scheduleAutoRender() {
      syncAddressBarUrl();
      if (!dom.autoRenderCheck.checked) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(executeRender, 350);
    }

    // Event Listeners
    dom.presetSelect.addEventListener('change', (e) => {
      loadPreset(e.target.value, true);
      updateUrlDisplay();
      syncAddressBarUrl();
      executeRender();
    });

    [dom.themeSelect, dom.formatSelect, dom.modeSelect, dom.paddingInput, dom.directivesCheck, dom.downloadCheck].forEach((el) => {
      el.addEventListener('change', () => {
        updateUrlDisplay();
        scheduleAutoRender();
      });
    });

    // Background color input handlers
    dom.bgInput.addEventListener('input', () => {
      const val = dom.bgInput.value.trim();
      if (val.startsWith('#') && (val.length === 7 || val.length === 4)) {
        dom.bgColorPicker.value = val.length === 4
          ? '#' + val[1]+val[1]+val[2]+val[2]+val[3]+val[3]
          : val;
      }
      updatePreviewBackground();
      updateUrlDisplay();
      scheduleAutoRender();
    });

    dom.bgColorPicker.addEventListener('input', (e) => {
      dom.bgInput.value = e.target.value;
      updatePreviewBackground();
      updateUrlDisplay();
      scheduleAutoRender();
    });

    dom.resetBgBtn.addEventListener('click', () => {
      setBackgroundColor('#ffffff', true);
    });

    // Quick color preset buttons
    document.querySelectorAll('.color-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        if (color) setBackgroundColor(color, true);
      });
    });

    dom.codeInput.addEventListener('input', () => {
      updateUrlDisplay();
      scheduleAutoRender();
    });

    // Keyboard shortcut: Ctrl/Cmd + Enter
    dom.codeInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeRender();
      }
    });

    dom.renderBtn.addEventListener('click', executeRender);

    // Copy Page URL (Playground URL with full query parameters)
    dom.copyPageUrlBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(window.location.href);
      dom.copyPageUrlBtn.textContent = 'Copied! ✓';
      setTimeout(() => (dom.copyPageUrlBtn.textContent = 'Copy Page Link'), 1500);
    });

    // Copy Raw API URL
    dom.copyUrlBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(dom.requestUrlInput.value);
      dom.copyUrlBtn.textContent = 'Copied! ✓';
      setTimeout(() => (dom.copyUrlBtn.textContent = 'Copy Raw URL'), 1500);
    });

    // Copy cURL
    dom.copyCurlBtn.addEventListener('click', async () => {
      const code = dom.codeInput.value.trim();
      const params = buildQuery();
      params.delete('code');
      const origin = window.location.origin;
      const curl = \`curl -X POST "\${origin}/?\${params.toString()}" \\\\\\n  -H "Content-Type: application/json" \\\\\\n  -d '\${JSON.stringify({ code })}' \\\\\\n  -o "diagram.\${dom.formatSelect.value}"\`;
      await navigator.clipboard.writeText(curl);
      dom.copyCurlBtn.textContent = 'Copied! ✓';
      setTimeout(() => (dom.copyCurlBtn.textContent = 'Copy cURL'), 1500);
    });

    // Open in New Tab
    dom.openNewTabBtn.addEventListener('click', () => {
      window.open(dom.requestUrlInput.value, '_blank');
    });

    // Download File
    dom.downloadBtn.addEventListener('click', () => {
      const params = buildQuery(true);
      window.location.href = \`/?\${params.toString()}\`;
    });

    // Respond to browser back/forward buttons
    window.addEventListener('popstate', () => {
      loadStateFromUrl();
      executeRender();
    });

    // Initialize from URL query parameters
    loadStateFromUrl();
    updatePreviewBackground();
    updateUrlDisplay();
    syncAddressBarUrl();
    executeRender();
  </script>
</body>
</html>`;
}
