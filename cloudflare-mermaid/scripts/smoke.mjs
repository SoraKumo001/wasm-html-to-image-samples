import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PKG_DIR = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const READY_TIMEOUT_MS = 60_000;
const PNG_MAGIC = "89504e47";
const RIFF_MAGIC = "52494646"; // 'RIFF' in hex (WebP)

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function headHex(bytes) {
  return Array.from(bytes.subarray(0, 4))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

async function waitForReady(port, child, deadline) {
  for (;;) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `wrangler dev exited early (code=${child.exitCode} signal=${child.signalCode})`
      );
    }
    if (Date.now() > deadline) {
      throw new Error("timed out waiting for wrangler dev to become ready");
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.status === 200) return;
      await sleep(500);
    } catch {
      await sleep(500);
    }
  }
}

async function main() {
  const port = await getFreePort();
  console.log(`[smoke] starting wrangler dev on port ${port}`);

  const { createRequire } = await import("node:module");
  const require = createRequire(new URL("../package.json", import.meta.url));
  const wranglerPkg = require.resolve("wrangler/package.json");
  const wranglerEntry = path.join(path.dirname(wranglerPkg), "bin", "wrangler.js");

  const child = spawn(process.execPath, [wranglerEntry, "dev", "--port", String(port)], {
    cwd: PKG_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });

  let tail = "";
  const onData = (d) => {
    const s = String(d);
    tail += s;
    if (tail.length > 20000) tail = tail.slice(-20000);
    process.stdout.write(`[wrangler] ${s}`);
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on("error", (e) => console.error(`[smoke] wrangler spawn error: ${e.message}`));

  const kill = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      const done = () => resolve();
      child.once("exit", done);
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          try {
            if (process.platform === "win32" && child.pid) {
              const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
                stdio: "ignore",
              });
              killer.on("exit", done);
              setTimeout(done, 3000);
            } else {
              child.kill("SIGKILL");
              setTimeout(done, 3000);
            }
          } catch {
            done();
          }
        }
      }, 5000);
    });

  try {
    await waitForReady(port, child, Date.now() + READY_TIMEOUT_MS);
    console.log(`[smoke] wrangler dev ready on port ${port}`);

    // 1) Test default GET / -> returns SVG
    console.log("[smoke] Test 1: GET / (default SVG)");
    const svgRes = await fetch(`http://127.0.0.1:${port}/`);
    const svgText = await svgRes.text();
    const svgContentType = svgRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET / -> status=${svgRes.status} contentType=${svgContentType} len=${svgText.length}`);
    if (svgRes.status !== 200) throw new Error(`expected 200, got ${svgRes.status}`);
    if (!svgContentType.includes("image/svg+xml")) throw new Error(`expected image/svg+xml, got ${svgContentType}`);
    if (!svgText.includes("<svg")) throw new Error(`expected SVG content to contain '<svg'`);

    // 2) Test GET /?code=...&format=webp&theme=dark -> returns WebP binary
    console.log("[smoke] Test 2: GET /?format=webp&theme=dark");
    const code = "graph LR\n  A[Start] --> B[End]";
    const webpRes = await fetch(`http://127.0.0.1:${port}/?code=${encodeURIComponent(code)}&format=webp&theme=dark`);
    const webpBuf = new Uint8Array(await webpRes.arrayBuffer());
    const webpContentType = webpRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET webp -> status=${webpRes.status} contentType=${webpContentType} bytes=${webpBuf.length} head=${headHex(webpBuf)}`);
    if (webpRes.status !== 200) throw new Error(`expected 200 for webp, got ${webpRes.status}`);
    if (!webpContentType.includes("image/webp")) throw new Error(`expected image/webp, got ${webpContentType}`);
    if (headHex(webpBuf) !== RIFF_MAGIC) throw new Error(`expected RIFF header for webp, got ${headHex(webpBuf)}`);

    // 3) Test GET /?code=...&format=png&theme=forest -> returns PNG binary
    console.log("[smoke] Test 3: GET /?format=png&theme=forest");
    const pngRes = await fetch(`http://127.0.0.1:${port}/?code=${encodeURIComponent(code)}&format=png&theme=forest`);
    const pngBuf = new Uint8Array(await pngRes.arrayBuffer());
    const pngContentType = pngRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET png -> status=${pngRes.status} contentType=${pngContentType} bytes=${pngBuf.length} head=${headHex(pngBuf)}`);
    if (pngRes.status !== 200) throw new Error(`expected 200 for png, got ${pngRes.status}`);
    if (!pngContentType.includes("image/png")) throw new Error(`expected image/png, got ${pngContentType}`);
    if (headHex(pngBuf) !== PNG_MAGIC) throw new Error(`expected PNG magic, got ${headHex(pngBuf)}`);

    // 4) Test POST / with JSON body
    console.log("[smoke] Test 4: POST / with JSON body");
    const postRes = await fetch(`http://127.0.0.1:${port}/?format=svg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "flowchart TD\n  X --> Y" }),
    });
    const postSvg = await postRes.text();
    console.log(`[smoke] POST svg -> status=${postRes.status} len=${postSvg.length}`);
    if (postRes.status !== 200) throw new Error(`expected 200 for POST, got ${postRes.status}`);
    if (!postSvg.includes("<svg")) throw new Error(`expected SVG in POST response`);

    // 5) Test GET /playground -> returns HTML form UI with OGP tags
    console.log("[smoke] Test 5: GET /playground");
    const playgroundRes = await fetch(`http://127.0.0.1:${port}/playground`);
    const playgroundHtml = await playgroundRes.text();
    const playgroundContentType = playgroundRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET /playground -> status=${playgroundRes.status} contentType=${playgroundContentType} len=${playgroundHtml.length}`);
    if (playgroundRes.status !== 200) throw new Error(`expected 200 for playground, got ${playgroundRes.status}`);
    if (!playgroundContentType.includes("text/html")) throw new Error(`expected text/html, got ${playgroundContentType}`);
    if (!playgroundHtml.includes("Cloudflare Mermaid Playground")) throw new Error(`expected title in playground HTML`);
    if (!playgroundHtml.includes(`og:image`)) throw new Error(`expected og:image meta tag in playground HTML`);
    if (!playgroundHtml.includes(`twitter:image`)) throw new Error(`expected twitter:image meta tag in playground HTML`);

    // 6) Test GET /api/presets -> returns JSON array
    console.log("[smoke] Test 6: GET /api/presets");
    const presetsRes = await fetch(`http://127.0.0.1:${port}/api/presets`);
    const presetsJson = await presetsRes.json();
    console.log(`[smoke] GET /api/presets -> status=${presetsRes.status} count=${presetsJson.length}`);
    if (presetsRes.status !== 200) throw new Error(`expected 200 for presets, got ${presetsRes.status}`);
    if (!Array.isArray(presetsJson) || presetsJson.length === 0) throw new Error(`expected non-empty presets array`);

    // 7) Test GET /og-image.svg -> returns OGP SVG
    console.log("[smoke] Test 7: GET /og-image.svg");
    const ogSvgRes = await fetch(`http://127.0.0.1:${port}/og-image.svg`);
    const ogSvgText = await ogSvgRes.text();
    const ogSvgContentType = ogSvgRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET /og-image.svg -> status=${ogSvgRes.status} contentType=${ogSvgContentType} len=${ogSvgText.length}`);
    if (ogSvgRes.status !== 200) throw new Error(`expected 200 for og-image.svg, got ${ogSvgRes.status}`);
    if (!ogSvgContentType.includes("image/svg+xml")) throw new Error(`expected image/svg+xml, got ${ogSvgContentType}`);
    if (!ogSvgText.includes("<svg")) throw new Error(`expected SVG content in og-image.svg`);

    // 8) Test GET /og-image.png -> returns 1200x630 OGP PNG binary
    console.log("[smoke] Test 8: GET /og-image.png");
    const ogPngRes = await fetch(`http://127.0.0.1:${port}/og-image.png`);
    const ogPngBuf = new Uint8Array(await ogPngRes.arrayBuffer());
    const ogPngContentType = ogPngRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET /og-image.png -> status=${ogPngRes.status} contentType=${ogPngContentType} bytes=${ogPngBuf.length} head=${headHex(ogPngBuf)}`);
    if (ogPngRes.status !== 200) throw new Error(`expected 200 for og-image.png, got ${ogPngRes.status}`);
    if (!ogPngContentType.includes("image/png")) throw new Error(`expected image/png, got ${ogPngContentType}`);
    if (headHex(ogPngBuf) !== PNG_MAGIC) throw new Error(`expected PNG magic, got ${headHex(ogPngBuf)}`);

    // 9) Test GET /favicon.svg -> returns favicon SVG
    console.log("[smoke] Test 9: GET /favicon.svg");
    const favRes = await fetch(`http://127.0.0.1:${port}/favicon.svg`);
    const favText = await favRes.text();
    const favContentType = favRes.headers.get("content-type") ?? "";
    console.log(`[smoke] GET /favicon.svg -> status=${favRes.status} contentType=${favContentType} len=${favText.length}`);
    if (favRes.status !== 200) throw new Error(`expected 200 for favicon.svg, got ${favRes.status}`);
    if (!favContentType.includes("image/svg+xml")) throw new Error(`expected image/svg+xml, got ${favContentType}`);
    if (!favText.includes("<svg")) throw new Error(`expected SVG content in favicon.svg`);

    console.log("[smoke] ALL TESTS PASSED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error(`[smoke] FAILED: ${err?.stack ?? err}`);
    console.error(`[smoke] wrangler log tail:\n${tail.slice(-4000)}`);
    process.exitCode = 1;
  } finally {
    await kill();
  }
}

await main();
