import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { actor, setup } from "rivetkit";
import { db } from "rivetkit/db";
import { render } from "wasm-html-to-image";
import { createCSS } from "wasm-html-to-image/tailwind";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDefaultImageBase64(): string {
  const candidatePaths = [
    path.resolve(process.cwd(), "assets/image.jpg"),
    path.resolve(__dirname, "../assets/image.jpg"),
    path.resolve(__dirname, "../../assets/image.jpg"),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const buffer = fs.readFileSync(candidate);
        return `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Minimal 1x1 transparent GIF fallback if asset file is missing
  return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}

export const DEFAULT_IMAGE = resolveDefaultImageBase64();

export const DEFAULT_MERMAID = `flowchart LR
  Client([Client 🌐]) --> Worker[Rivet Actor ⚡]
  Worker --> Cache{Cache?}
  Cache -- Yes --> Image([OGP 🎨])
  Cache -- No --> WASM[WASM 🦀] --> Image
  classDef default fill:#1e1e2e,stroke:#818cf8,stroke-width:1.5px,color:#cdd6f4`;

export const DEFAULT_VERTICAL =
  "縦書き上等！、縦書き上等！、縦書き上等！、縦書き上等！、縦書き上等！";

export const CACHE_CONTROL_HEADER = "public, max-age=31536000, immutable";

export const IMAGE_CACHE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS image_cache (
    key TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    data BLOB NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_image_cache_created_at ON image_cache(created_at);
`;

export interface CacheRow extends Record<string, unknown> {
  content_type: string;
  data: Uint8Array;
}

export interface CacheDatabase {
  execute<TRow extends Record<string, unknown> = Record<string, unknown>>(
    query: string,
    ...args: unknown[]
  ): Promise<TRow[]>;
}

export interface OgpOptions {
  title?: string;
  subtitle?: string;
  image?: string;
  mermaid?: string;
  vertical?: string;
}

export interface OgpResult {
  contentType: string;
  data: Uint8Array;
  cached: boolean;
}

export function buildCacheKey(options: OgpOptions): string {
  const title = options.title ?? "Title";
  const subtitle = options.subtitle ?? "subtitle";
  const image = options.image ?? DEFAULT_IMAGE;
  const mermaid = options.mermaid ?? DEFAULT_MERMAID;
  const vertical = options.vertical ?? DEFAULT_VERTICAL;
  return `ogp:${title}:${subtitle}:${vertical}:${image}:${mermaid}`;
}

export function renderOgpTemplate(options: OgpOptions): string {
  const title = options.title ?? "Title";
  const subtitle = options.subtitle ?? "subtitle";
  const image = options.image ?? DEFAULT_IMAGE;
  const mermaidSource = options.mermaid ?? DEFAULT_MERMAID;
  const verticalText = options.vertical ?? DEFAULT_VERTICAL;

  return (
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
                rivet-ogp
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
            <div className="absolute bottom-[50px] right-[60px] w-[520px] h-[240px] rounded-[24px] overflow-hidden border border-white/20 p-4 flex flex-col justify-between shadow-[0_25px_50px_rgba(0,0,0,0.8)] backdrop-blur-xs">
              {/* Window Titlebar */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#eab308] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block" />
                  <span className="text-xs text-white/50 ml-2 font-mono">
                    Mermaid Diagram
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
}

async function getCachedImage(
  database: CacheDatabase,
  key: string,
): Promise<CacheRow | null> {
  try {
    const rows = await database.execute<CacheRow>(
      "SELECT content_type, data FROM image_cache WHERE key = ?",
      key,
    );
    return rows[0] ?? null;
  } catch (err) {
    console.error("Cache query failed:", err);
    return null;
  }
}

async function setCachedImage(
  database: CacheDatabase,
  key: string,
  contentType: string,
  data: Uint8Array,
): Promise<void> {
  try {
    await database.execute(
      "INSERT OR REPLACE INTO image_cache (key, content_type, data, created_at) VALUES (?, ?, ?, ?)",
      key,
      contentType,
      data,
      Date.now(),
    );
  } catch (err) {
    console.error("Cache write failed:", err);
  }
}

export async function generateOgpImage(
  database: CacheDatabase,
  options: OgpOptions,
): Promise<OgpResult> {
  const cacheKey = buildCacheKey(options);

  // 1. Check SQLite Cache
  const cached = await getCachedImage(database, cacheKey);
  if (cached) {
    return {
      contentType: cached.content_type,
      data: new Uint8Array(cached.data),
      cached: true,
    };
  }

  // 2. Generate HTML & CSS
  const html = renderOgpTemplate(options);
  const css = await createCSS(html);

  // 3. Render with wasm-html-to-image
  const rendered = await render({
    value: html,
    css,
    width: 1200,
    height: 630,
    format: "png",
  });

  const responseData =
    typeof rendered.data === "string"
      ? new TextEncoder().encode(rendered.data)
      : new Uint8Array(rendered.data);

  const contentType = "image/png";

  // 4. Save to SQLite Cache
  await setCachedImage(database, cacheKey, contentType, responseData);

  return {
    contentType,
    data: responseData,
    cached: false,
  };
}

export async function handleOgpRequest(
  c: { db: CacheDatabase },
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const params = url.searchParams;

  const title = params.get("title") ?? undefined;
  const subtitle = params.get("subtitle") ?? undefined;
  const image = params.get("image") ?? undefined;
  const mermaid = params.get("mermaid") ?? undefined;
  const vertical = params.get("vertical") ?? undefined;

  const result = await generateOgpImage(c.db, {
    title,
    subtitle,
    image,
    mermaid,
    vertical,
  });

  return new Response(Buffer.from(result.data), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": CACHE_CONTROL_HEADER,
      Date: new Date().toUTCString(),
      "X-Cache": result.cached ? "HIT" : "MISS",
    },
  });
}

export const ogpGenerator = actor({
  // SQLite database for caching generated OGP images
  db: db({
    onMigrate: async (database) => {
      await database.execute(IMAGE_CACHE_SCHEMA);
    },
  }),

  // Low-level HTTP handler handling raw incoming web requests
  onRequest: handleOgpRequest,

  // RPC action for typed client invocation
  actions: {
    async generate(c, params: OgpOptions): Promise<OgpResult> {
      return generateOgpImage(c.db, params);
    },
  },
});

export const registry = setup({
  use: {
    ogpGenerator,
  },
});

// Auto-start in Rivet Cloud or Node runner environment where RIVET_ENDPOINT is provided
if (process.env.RIVET_ENDPOINT || process.env.RIVET_RUNNER) {
  registry.start();
}
