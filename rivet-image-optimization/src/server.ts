import http from "node:http";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  type CacheDatabase,
  handleImageRequest,
  IMAGE_CACHE_SCHEMA,
} from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../.image-cache.sqlite");

// Persistent SQLite database for local / standalone server execution
const sqliteDb = new DatabaseSync(dbPath);
sqliteDb.exec(IMAGE_CACHE_SCHEMA);

const localDb: CacheDatabase = {
  async execute<TRow extends Record<string, unknown> = Record<string, unknown>>(
    query: string,
    ...args: unknown[]
  ): Promise<TRow[]> {
    const stmt = sqliteDb.prepare(query);
    const params = args as SQLInputValue[];
    if (query.trim().toUpperCase().startsWith("SELECT")) {
      return stmt.all(...params) as TRow[];
    }
    stmt.run(...params);
    return [];
  },
};

function toWebHeaders(rawHeaders: http.IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  return headers;
}

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const fullUrl = `http://${host}${req.url}`;

  const webRequest = new Request(fullUrl, {
    method: req.method || "GET",
    headers: toWebHeaders(req.headers),
  });

  try {
    const webResponse = await handleImageRequest({ db: localDb }, webRequest);

    res.statusCode = webResponse.status;
    webResponse.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const body = Buffer.from(await webResponse.arrayBuffer());
    res.end(body);

    const imageUrl = new URL(fullUrl).searchParams.get("url");
    if (imageUrl) {
      const cacheStatus = webResponse.headers.get("x-cache") || "-";
      const contentType = webResponse.headers.get("content-type") || "-";
      console.log(
        `[${new Date().toLocaleTimeString()}] ${webResponse.status} ${contentType} (${body.length} bytes, Cache: ${cacheStatus}) <- ${imageUrl}`,
      );
    }
  } catch (err) {
    console.error("Handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Rivet Image Optimization Server running at:`);
  console.log(`   > http://localhost:${PORT}`);
  console.log(`   > SQLite cache stored at: ${dbPath}\n`);
  console.log(`Try accessing:`);
  console.log(
    `   http://localhost:${PORT}/?url=https://raw.githubusercontent.com/SoraKumo001/cloudflare-workers-image-optimization/master/images/test01.png&w=200\n`,
  );
});

const shutdown = () => {
  console.log("\nShutting down server...");
  server.close(() => {
    sqliteDb.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
