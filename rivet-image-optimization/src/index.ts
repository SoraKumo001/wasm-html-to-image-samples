import fs from "node:fs";
import { actor, setup } from "rivetkit";
import { db } from "rivetkit/db";
import { render } from "wasm-html-to-image";

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isType = (accept: string | null, type: string) => {
  return (
    accept
      ?.split(",")
      .map((format) => format.trim())
      .some((format) => [`image/${type}`, "*/*", "image/*"].includes(format)) ??
    true
  );
};

interface CacheRow extends Record<string, unknown> {
  content_type: string;
  data: Uint8Array;
}

export const imageOptimizer = actor({
  // SQLite database for caching optimized images permanently
  db: db({
    onMigrate: async (db) => {
      await db.execute(`
				CREATE TABLE IF NOT EXISTS image_cache (
					key TEXT PRIMARY KEY,
					content_type TEXT NOT NULL,
					data BLOB NOT NULL,
					created_at INTEGER NOT NULL
				);
				CREATE INDEX IF NOT EXISTS idx_image_cache_created_at ON image_cache(created_at);
			`);
    },
  }),

  // Low-level HTTP handler handling raw incoming web requests
  async onRequest(c, request) {
    const url = new URL(request.url);
    const params = url.searchParams;
    const type = ["avif", "webp", "png", "jpeg"].find(
      (v) => v === params.get("type"),
    ) as "avif" | "webp" | "png" | "jpeg" | undefined;
    const accept = request.headers.get("accept");
    const isAvif = isType(accept, "avif");
    const isWebp = isType(accept, "webp");

    const imageUrl = params.get("url");
    if (!imageUrl || !isValidUrl(imageUrl)) {
      return new Response("url is required and must be a valid URL", {
        status: 400,
      });
    }

    const width = params.get("w");
    const quality = params.get("q");

    // Determine expected format
    const format = type ?? (isAvif ? "avif" : isWebp ? "webp" : "jpeg");

    // Cache key based on URL, dimensions, quality, and format
    const cacheKey = `${imageUrl}?w=${width || ""}&q=${quality || ""}&format=${format}`;

    // 1. Query SQLite cache
    try {
      const rows = await c.db.execute<CacheRow>(
        "SELECT content_type, data FROM image_cache WHERE key = ?",
        cacheKey,
      );
      if (rows.length > 0) {
        const cached = rows[0];
        return new Response(Buffer.from(cached.data), {
          headers: {
            "Content-Type": cached.content_type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Cache": "HIT",
          },
        });
      }
    } catch (err) {
      console.error("Cache query failed:", err);
    }

    // 2. Fetch original image
    let srcImage: Uint8Array | null = null;
    let contentType: string | null = null;

    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        contentType = res.headers.get("content-type");
        srcImage = new Uint8Array(await res.arrayBuffer());
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }

    if (!srcImage) {
      return new Response("image not found", { status: 404 });
    }

    // 3. SVG / GIF images are returned directly without conversion
    if (contentType && ["image/svg+xml", "image/gif"].includes(contentType)) {
      try {
        await c.db.execute(
          "INSERT OR REPLACE INTO image_cache (key, content_type, data, created_at) VALUES (?, ?, ?, ?)",
          cacheKey,
          contentType,
          srcImage,
          Date.now(),
        );
      } catch (err) {
        console.error("Cache write failed:", err);
      }

      return new Response(Buffer.from(srcImage), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache": "MISS",
        },
      });
    }

    // 4. Optimize image using wasm-html-to-image
    const targetFormat =
      type ??
      (isAvif
        ? "avif"
        : isWebp
          ? "webp"
          : contentType === "image/jpeg"
            ? "jpeg"
            : "png");

    const { data } = await render({
      value: srcImage,
      width: width ? Number(width) : 0,
      quality: quality ? Number(quality) : undefined,
      format: targetFormat,
      speed: 9,
    });

    const responseData =
      typeof data === "string" ? new TextEncoder().encode(data) : data;
    const finalContentType = `image/${targetFormat}`;

    // 5. Store in SQLite cache
    try {
      await c.db.execute(
        "INSERT OR REPLACE INTO image_cache (key, content_type, data, created_at) VALUES (?, ?, ?, ?)",
        cacheKey,
        finalContentType,
        responseData,
        Date.now(),
      );
    } catch (err) {
      console.error("Cache store failed:", err);
    }

    return new Response(Buffer.from(responseData), {
      headers: {
        "Content-Type": finalContentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        date: new Date().toUTCString(),
        "X-Cache": "MISS",
      },
    });
  },

  // RPC action for typed client invocation
  actions: {
    async optimize(
      c,
      params: {
        url: string;
        width?: number;
        quality?: number;
        format?: "avif" | "webp" | "png" | "jpeg";
      },
    ) {
      if (!params.url || !isValidUrl(params.url)) {
        throw new Error("Invalid URL parameter");
      }

      const format = params.format || "webp";
      const cacheKey = `${params.url}?w=${params.width || ""}&q=${params.quality || ""}&format=${format}`;

      // Check SQLite cache
      const rows = await c.db.execute<CacheRow>(
        "SELECT content_type, data FROM image_cache WHERE key = ?",
        cacheKey,
      );
      if (rows.length > 0) {
        return {
          contentType: rows[0].content_type,
          data: rows[0].data,
          cached: true,
        };
      }

      // Fetch original image
      const res = await fetch(params.url);
      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type") || "";
      const srcImage = new Uint8Array(await res.arrayBuffer());

      // Direct passthrough for SVG / GIF
      if (["image/svg+xml", "image/gif"].includes(contentType)) {
        await c.db.execute(
          "INSERT OR REPLACE INTO image_cache (key, content_type, data, created_at) VALUES (?, ?, ?, ?)",
          cacheKey,
          contentType,
          srcImage,
          Date.now(),
        );
        return {
          contentType,
          data: srcImage,
          cached: false,
        };
      }

      // Convert
      const { data } = await render({
        value: srcImage,
        width: params.width || 0,
        quality: params.quality,
        format,
        speed: 9,
      });

      const responseData =
        typeof data === "string" ? new TextEncoder().encode(data) : data;
      const finalContentType = `image/${format}`;

      await c.db.execute(
        "INSERT OR REPLACE INTO image_cache (key, content_type, data, created_at) VALUES (?, ?, ?, ?)",
        cacheKey,
        finalContentType,
        responseData,
        Date.now(),
      );

      return {
        contentType: finalContentType,
        data: responseData,
        cached: false,
      };
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
