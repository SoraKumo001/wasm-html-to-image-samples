import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "wasm-html-to-image/single";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(rootDir, "public");

/**
 * Pull the sample's default card out of App.tsx so the OGP image always
 * matches what the page renders on load. The constant is a plain template
 * literal with no interpolations.
 */
async function readDefaultCardHtml() {
  const appSource = await fs.readFile(
    path.resolve(rootDir, "src/App.tsx"),
    "utf-8",
  );
  const match = appSource.match(/const DEFAULT_HTML = `([\s\S]*?)`;/);

  if (!match) {
    throw new Error("Could not locate DEFAULT_HTML in src/App.tsx");
  }

  return match[1];
}

async function main() {
  const html = await readDefaultCardHtml();

  await fs.mkdir(publicDir, { recursive: true });

  console.log("Rendering 1200x630 og-image.png with wasm-html-to-image...");
  const png = await render({
    value: html,
    format: "png",
    width: 1200,
    height: 630,
    quality: 95,
  });

  if (!png.data) {
    throw new Error("wasm-html-to-image returned no PNG data");
  }

  const pngPath = path.resolve(publicDir, "og-image.png");
  await fs.writeFile(pngPath, png.data);
  console.log(`Generated ${pngPath} (${png.data.length} bytes)`);
}

main().catch((err) => {
  console.error("Error generating OGP image:", err);
  process.exit(1);
});
