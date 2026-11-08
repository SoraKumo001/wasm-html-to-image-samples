import { actor, setup } from "rivetkit";
import { db } from "rivetkit/db";
import { render } from "wasm-html-to-image";

export const SUPPORTED_FORMATS = ["avif", "webp", "png", "jpeg"] as const;
export type ImageFormat = (typeof SUPPORTED_FORMATS)[number];

const PASSTHROUGH_MIMES = new Set(["image/svg+xml", "image/gif"]);
const CACHE_CONTROL_HEADER = "public, max-age=31536000, immutable";

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

export interface OptimizeOptions {
  url: string;
  width?: number;
  quality?: number;
  format?: ImageFormat;
  accept?: string | null;
}

export interface OptimizeResult {
  contentType: string;
  data: Uint8Array;
  cached: boolean;
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isAcceptType = (accept: string | null, type: string): boolean => {
  return (
    accept
      ?.split(",")
      .map((format) => format.trim())
      .some((format) => [`image/${type}`, "*/*", "image/*"].includes(format)) ??
    true
  );
};

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

export async function optimizeImage(
  database: CacheDatabase,
  options: OptimizeOptions,
): Promise<OptimizeResult | null> {
  const { url, width, quality, format, accept = null } = options;
  const isAvif = isAcceptType(accept, "avif");
  const isWebp = isAcceptType(accept, "webp");

  const formatKey = format ?? (isAvif ? "avif" : isWebp ? "webp" : "auto");
  const cacheKey = `${url}?w=${width || ""}&q=${quality || ""}&format=${formatKey}`;

  // 1. Check SQLite cache
  const cached = await getCachedImage(database, cacheKey);
  if (cached) {
    return {
      contentType: cached.content_type,
      data: new Uint8Array(cached.data),
      cached: true,
    };
  }

  // 2. Fetch original image
  let srcImage: Uint8Array | null = null;
  let contentType: string | null = null;

  try {
    const res = await fetch(url);
    if (res.ok) {
      contentType = res.headers.get("content-type")?.split(";")[0].trim() ?? null;
      srcImage = new Uint8Array(await res.arrayBuffer());
    }
  } catch (err) {
    console.error("Failed to fetch image:", err);
  }

  if (!srcImage) {
    return null;
  }

  // 3. SVG / GIF images are returned directly without conversion
  if (contentType && PASSTHROUGH_MIMES.has(contentType)) {
    await setCachedImage(database, cacheKey, contentType, srcImage);
    return {
      contentType,
      data: srcImage,
      cached: false,
    };
  }

  // 4. Optimize image using wasm-html-to-image
  const targetFormat: ImageFormat =
    format ??
    (isAvif
      ? "avif"
      : isWebp
        ? "webp"
        : contentType === "image/jpeg"
          ? "jpeg"
          : "png");

  const { data } = await render({
    value: srcImage,
    width: width || 0,
    quality,
    format: targetFormat,
    speed: 9,
  });

  const responseData =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);
  const finalContentType = `image/${targetFormat}`;

  // 5. Store in SQLite cache
  await setCachedImage(database, cacheKey, finalContentType, responseData);

  return {
    contentType: finalContentType,
    data: responseData,
    cached: false,
  };
}

export async function handleImageRequest(
  c: { db: CacheDatabase },
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const params = url.searchParams;
  const imageUrl = params.get("url");

  if (!imageUrl || !isValidUrl(imageUrl)) {
    return new Response("url is required and must be a valid URL", {
      status: 400,
    });
  }

  const typeParam = params.get("type");
  const format = SUPPORTED_FORMATS.find((v) => v === typeParam);
  const widthParam = params.get("w");
  const qualityParam = params.get("q");

  const result = await optimizeImage(c.db, {
    url: imageUrl,
    width: widthParam ? Number(widthParam) : undefined,
    quality: qualityParam ? Number(qualityParam) : undefined,
    format,
    accept: request.headers.get("accept"),
  });

  if (!result) {
    return new Response("image not found", { status: 404 });
  }

  return new Response(Buffer.from(result.data), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": CACHE_CONTROL_HEADER,
      Date: new Date().toUTCString(),
      "X-Cache": result.cached ? "HIT" : "MISS",
    },
  });
}

export const imageOptimizer = actor({
  // SQLite database for caching optimized images permanently
  db: db({
    onMigrate: async (database) => {
      await database.execute(IMAGE_CACHE_SCHEMA);
    },
  }),

  // Low-level HTTP handler handling raw incoming web requests
  onRequest: handleImageRequest,

  // RPC action for typed client invocation
  actions: {
    async optimize(
      c,
      params: {
        url: string;
        width?: number;
        quality?: number;
        format?: ImageFormat;
      },
    ): Promise<OptimizeResult> {
      if (!params.url || !isValidUrl(params.url)) {
        throw new Error("Invalid URL parameter");
      }

      const result = await optimizeImage(c.db, {
        url: params.url,
        width: params.width,
        quality: params.quality,
        format: params.format ?? "webp",
      });

      if (!result) {
        throw new Error(`Failed to fetch image: ${params.url}`);
      }

      return result;
    },
  },
});

export const registry = setup({
  use: {
    imageOptimizer,
  },
});

// Auto-start in Rivet Cloud or Node runner environment where RIVET_ENDPOINT is provided
if (process.env.RIVET_ENDPOINT || process.env.RIVET_RUNNER) {
  registry.start();
}
