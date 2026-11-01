import {
  render,
  MERMAID_THEMES,
  type MermaidTheme,
  type OutputFormat,
} from "wasm-html-to-image";

const DEFAULT_MERMAID = `graph LR
  Client[Client 💻] -->|Query| Worker[Cloudflare Workers ⚡]
  Worker -->|WASM Engine| Output[Fast SVG / WebP 🎨]
  classDef accent fill:#0ea5e9,stroke:#38bdf8,stroke-width:2px,color:#ffffff
  classDef node fill:#1e293b,stroke:#475569,stroke-width:1.5px,color:#f8fafc
  class Client,Worker node
  class Output accent`;

const CONTENT_TYPES: Record<string, string> = {
  svg: "image/svg+xml; charset=utf-8",
  webp: "image/webp",
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  avif: "image/avif",
  pdf: "application/pdf",
};

export default {
  async fetch(
    request: Request,
    _env: unknown,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Only allow GET and POST
    if (request.method !== "GET" && request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Cache lookup for GET requests
    const cache = await caches.open("cloudflare-mermaid");
    const cacheKey = new Request(url.toString(), { method: "GET" });
    if (request.method === "GET") {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Parse parameters
    let code: string | null = null;
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const body = (await request.json()) as {
            code?: string;
            mermaid?: string;
          };
          code = body.code || body.mermaid || null;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
      } else {
        code = await request.text();
      }
    }

    if (!code) {
      code =
        url.searchParams.get("code") ||
        url.searchParams.get("mermaid") ||
        DEFAULT_MERMAID;
    }

    const format = (
      url.searchParams.get("format") || "svg"
    ).toLowerCase() as OutputFormat;
    const themeParam = url.searchParams.get("theme") || "light";
    const theme: MermaidTheme =
      themeParam in MERMAID_THEMES ? (themeParam as MermaidTheme) : "light";
    const mode = (url.searchParams.get("mode") || "strict") as
      | "strict"
      | "compat"
      | "recover";
    const bg =
      url.searchParams.get("bg") ||
      url.searchParams.get("background") ||
      undefined;
    const paddingParam = url.searchParams.get("padding");
    const padding =
      paddingParam !== null ? Math.max(0, parseInt(paddingParam, 10) || 0) : 16;
    const directives = url.searchParams.get("directives") !== "false";
    const isDownload = url.searchParams.get("download") === "true";

    try {
      const result = await render({
        mermaid: {
          source: code,
          theme,
          mode,
          background: bg,
          padding,
          directives,
        },
        format,
      });

      const contentType =
        CONTENT_TYPES[format] || "image/svg+xml; charset=utf-8";
      const headers = new Headers({
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      });

      if (isDownload) {
        headers.set(
          "Content-Disposition",
          `attachment; filename="diagram.${format}"`,
        );
      }

      const response = new Response(result.data as BodyInit, {
        status: 200,
        headers,
      });

      // Save to cache for GET requests
      if (request.method === "GET") {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Return error as SVG for image consumers, or 400 status
      if (format === "svg") {
        const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <rect width="500" height="120" rx="8" fill="#450a0a" stroke="#dc2626" stroke-width="2"/>
  <text x="20" y="35" fill="#f87171" font-size="16" font-family="monospace" font-weight="bold">Mermaid Render Error</text>
  <text x="20" y="70" fill="#fca5a5" font-size="12" font-family="monospace">${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] || c)}</text>
</svg>`;
        return new Response(errorSvg, {
          status: 400,
          headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
        });
      }

      return new Response(`Mermaid Render Error: ${message}`, {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  },
};
