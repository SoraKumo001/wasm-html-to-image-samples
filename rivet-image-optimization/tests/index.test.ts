import { describe, expect, test } from "vitest";
import { imageOptimizer } from "../src/index.js";

const images = ["test01.png", "test02.jpg", "test03.avif", "test04.gif"];
const imageUrl = (image: string) =>
	`https://raw.githubusercontent.com/SoraKumo001/cloudflare-workers-image-optimization/master/images/${image}`;

// Helper to create an in-memory DB context for testing Actor behavior
function createMockContext() {
	const cache = new Map<string, { content_type: string; data: Uint8Array }>();

	const mockDb = {
		async execute<TRow extends Record<string, unknown> = Record<string, unknown>>(
			query: string,
			...args: unknown[]
		): Promise<TRow[]> {
			if (query.includes("SELECT")) {
				const key = args[0] as string;
				const found = cache.get(key);
				if (found) {
					return [found as unknown as TRow];
				}
				return [];
			}
			if (query.includes("INSERT")) {
				const key = args[0] as string;
				const content_type = args[1] as string;
				const data = args[2] as Uint8Array;
				cache.set(key, { content_type, data });
				return [];
			}
			return [];
		},
		cache,
	};

	return {
		db: mockDb,
	};
}

describe("rivet-image-optimization onRequest", () => {
	const onRequest = (imageOptimizer as any).config.onRequest;
	const actions = (imageOptimizer as any).config.actions;

	test("GET / without url returns 400", async () => {
		const ctx = createMockContext();
		const req = new Request("http://localhost:6420/");
		const res = await onRequest(ctx, req);

		expect(res.status).toBe(400);
		expect(await res.text()).toBe("url is required and must be a valid URL");
	});

	test("not found image returns 404", async () => {
		const ctx = createMockContext();
		const notFoundUrl = imageUrl("_non_existent_image.png");
		const req = new Request(`http://localhost:6420/?url=${encodeURIComponent(notFoundUrl)}`);
		const res = await onRequest(ctx, req);

		expect(res.status).toBe(404);
	});

	test("webp format conversion with Accept header", async () => {
		const ctx = createMockContext();
		const url = imageUrl("test01.png");
		const req = new Request(`http://localhost:6420/?url=${encodeURIComponent(url)}&w=150`, {
			headers: { accept: "image/webp,image/jpeg,image/png" },
		});
		const res = await onRequest(ctx, req);

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("image/webp");
		expect(res.headers.get("x-cache")).toBe("MISS");

		const bytes = new Uint8Array(await res.arrayBuffer());
		expect(bytes.length).toBeGreaterThan(0);

		// Second request should HIT the cache
		const req2 = new Request(`http://localhost:6420/?url=${encodeURIComponent(url)}&w=150`, {
			headers: { accept: "image/webp,image/jpeg,image/png" },
		});
		const res2 = await onRequest(ctx, req2);

		expect(res2.status).toBe(200);
		expect(res2.headers.get("content-type")).toBe("image/webp");
		expect(res2.headers.get("x-cache")).toBe("HIT");
	}, 30000);

	test("SVG/GIF passthrough without conversion", async () => {
		const ctx = createMockContext();
		const gifUrl = imageUrl("test04.gif");
		const req = new Request(`http://localhost:6420/?url=${encodeURIComponent(gifUrl)}&w=100`, {
			headers: { accept: "image/webp" },
		});
		const res = await onRequest(ctx, req);

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toBe("image/gif");
		expect(res.headers.get("x-cache")).toBe("MISS");

		// Second request should HIT cache
		const res2 = await onRequest(ctx, req);
		expect(res2.status).toBe(200);
		expect(res2.headers.get("x-cache")).toBe("HIT");
	}, 30000);

	test("RPC action optimize", async () => {
		const ctx = createMockContext();
		const url = imageUrl("test02.jpg");
		const result = await actions.optimize(ctx, {
			url,
			width: 200,
			format: "webp",
		});

		expect(result).toBeDefined();
		expect(result.contentType).toBe("image/webp");
		expect(result.data.length).toBeGreaterThan(0);
		expect(result.cached).toBe(false);

		// Second call returns cached=true
		const cachedResult = await actions.optimize(ctx, {
			url,
			width: 200,
			format: "webp",
		});
		expect(cachedResult.cached).toBe(true);
	}, 30000);
});
