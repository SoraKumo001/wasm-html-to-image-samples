import http from "node:http";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { imageOptimizer } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../.image-cache.sqlite");

// Persistent SQLite database for local development
const db = new DatabaseSync(dbPath);
db.exec(`
	CREATE TABLE IF NOT EXISTS image_cache (
		key TEXT PRIMARY KEY,
		content_type TEXT NOT NULL,
		data BLOB NOT NULL,
		created_at INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_image_cache_created_at ON image_cache(created_at);
`);

const localCtx = {
	db: {
		async execute<TRow extends Record<string, unknown> = Record<string, unknown>>(
			query: string,
			...args: unknown[]
		): Promise<TRow[]> {
			const stmt = db.prepare(query);
			if (query.trim().toUpperCase().startsWith("SELECT")) {
				return stmt.all(...(args as any[])) as TRow[];
			} else {
				stmt.run(...(args as any[]));
				return [];
			}
		},
	},
};

const onRequest = (imageOptimizer as any).config.onRequest;
const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
	const host = req.headers.host || `localhost:${PORT}`;
	const fullUrl = `http://${host}${req.url}`;

	// Collect request headers
	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value) {
			headers.set(key, Array.isArray(value) ? value.join(", ") : value);
		}
	}

	const webRequest = new Request(fullUrl, {
		method: req.method || "GET",
		headers,
	});

	try {
		const webResponse = await onRequest(localCtx, webRequest);

		res.statusCode = webResponse.status;
		webResponse.headers.forEach((val: string, key: string) => {
			res.setHeader(key, val);
		});

		const body = Buffer.from(await webResponse.arrayBuffer());
		res.end(body);

		const urlObj = new URL(fullUrl);
		const imageUrl = urlObj.searchParams.get("url");
		if (imageUrl) {
			const cacheStatus = webResponse.headers.get("x-cache") || "-";
			const contentType = webResponse.headers.get("content-type") || "-";
			console.log(
				`[${new Date().toLocaleTimeString()}] ${webResponse.status} ${contentType} (${body.length} bytes, Cache: ${cacheStatus}) <- ${imageUrl}`
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
	console.log(`\n🚀 Rivet Image Optimization (Local Dev Server) running at:`);
	console.log(`   > http://localhost:${PORT}`);
	console.log(`   > SQLite cache stored at: ${dbPath}\n`);
	console.log(`Try accessing:`);
	console.log(`   http://localhost:${PORT}/?url=https://raw.githubusercontent.com/SoraKumo001/cloudflare-workers-image-optimization/master/images/test01.png&w=200\n`);
});

process.on("SIGINT", () => {
	console.log("\nShutting down dev server...");
	server.close(() => {
		db.close();
		process.exit(0);
	});
});
