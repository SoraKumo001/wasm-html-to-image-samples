import { describe, expect, it } from "vitest";
import {
  type CacheDatabase,
  generateOgpImage,
  handleOgpRequest,
  IMAGE_CACHE_SCHEMA,
  ogpGenerator,
} from "../src/index.js";

// In-memory SQLite or mock for testing
function createMockDb(): CacheDatabase {
  const store = new Map<string, { content_type: string; data: Uint8Array }>();

  return {
    async execute<
      TRow extends Record<string, unknown> = Record<string, unknown>,
    >(query: string, ...args: unknown[]): Promise<TRow[]> {
      const trimmed = query.trim().toUpperCase();
      if (trimmed.startsWith("SELECT")) {
        const key = args[0] as string;
        const entry = store.get(key);
        if (entry) {
          return [
            { content_type: entry.content_type, data: entry.data } as unknown as TRow,
          ];
        }
        return [];
      }
      if (trimmed.startsWith("INSERT OR REPLACE")) {
        const key = args[0] as string;
        const content_type = args[1] as string;
        const data = args[2] as Uint8Array;
        store.set(key, { content_type, data });
        return [];
      }
      return [];
    },
  };
}

describe("Rivet OGP Generation", () => {
  it("should generate a default OGP image in PNG format with Cache MISS then HIT", async () => {
    const db = createMockDb();

    // 1st request: Cache MISS
    const req1 = new Request("http://localhost:3000/");
    const res1 = await handleOgpRequest({ db }, req1);

    expect(res1.status).toBe(200);
    expect(res1.headers.get("content-type")).toBe("image/png");
    expect(res1.headers.get("x-cache")).toBe("MISS");

    const bytes1 = new Uint8Array(await res1.arrayBuffer());
    expect(bytes1.length).toBeGreaterThan(1000);
    // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47
    expect(bytes1[0]).toBe(0x89);
    expect(bytes1[1]).toBe(0x50);
    expect(bytes1[2]).toBe(0x4e);
    expect(bytes1[3]).toBe(0x47);

    // 2nd request: Cache HIT
    const req2 = new Request("http://localhost:3000/");
    const res2 = await handleOgpRequest({ db }, req2);

    expect(res2.status).toBe(200);
    expect(res2.headers.get("content-type")).toBe("image/png");
    expect(res2.headers.get("x-cache")).toBe("HIT");

    const bytes2 = new Uint8Array(await res2.arrayBuffer());
    expect(bytes2).toEqual(bytes1);
  }, 30000);

  it("should generate custom OGP with title, subtitle, and vertical text", async () => {
    const db = createMockDb();

    const url = new URL("http://localhost:3000/");
    url.searchParams.set("title", "Custom Title");
    url.searchParams.set("subtitle", "Custom Subtitle");
    url.searchParams.set("vertical", "縦書きテスト");

    const req = new Request(url.toString());
    const res = await handleOgpRequest({ db }, req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-cache")).toBe("MISS");

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
  }, 30000);

  it("should support programmatic RPC generate action", async () => {
    const db = createMockDb();

    const result = await generateOgpImage(db, {
      title: "RPC Title",
      subtitle: "RPC Subtitle",
    });

    expect(result.contentType).toBe("image/png");
    expect(result.cached).toBe(false);
    expect(result.data.length).toBeGreaterThan(1000);
    expect(result.data[0]).toBe(0x89);
    expect(result.data[1]).toBe(0x50);
  }, 30000);
});
