# wasm-html-to-image-samples

Sample implementations showcasing [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) across various platforms, frameworks, and runtime environments.

---

## 🚀 Quick Start

This repository is managed as a **pnpm workspace**. You can install and build all packages from the project root:

```bash
# Install dependencies across all workspace packages
pnpm install

# Build all projects
pnpm -r build
```

---

## 📊 Samples Overview

| Sample                                                            | Category                    | Framework / Runtime         | Build Tool / Bundler        | Subpath / Entry Point                                                                        |
| :---------------------------------------------------------------- | :-------------------------- | :-------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------- |
| [**`playground`**](./playground/)                                 | Interactive Web App         | Browser (React 19)          | Vite 8 + Tailwind CSS v4    | `wasm-html-to-image/workers`                                                                 |
| [**`mermaid-compare`**](./mermaid-compare/)                       | Visual & Perf Comparison    | Browser (React 19)          | Vite 8 + Tailwind CSS v4    | `wasm-html-to-image/workers`                                                                 |
| [**`canvas-image-effects`**](./canvas-image-effects/)             | Animated Canvas Effects     | Browser (React 19)          | Vite 8                      | `wasm-html-to-image/workers`                                                                 |
| [**`next-image-convert`**](./next-image-convert/)                 | Client-Side Image Converter | Next.js 16 (App Router)     | Turbopack + Tailwind CSS v4 | `wasm-html-to-image/workers`                                                                 |
| [**`react-router-image-convert`**](./react-router-image-convert/) | Client-Side Image Converter | React Router v7             | Vite 7 + Tailwind CSS v4    | `wasm-html-to-image/workers`                                                                 |
| [**`node-image-convert`**](./node-image-convert/)                 | CLI Batch Converter         | Node.js (ESM)               | TypeScript (`tsc -b`), tsx  | `wasm-html-to-image/single`<br>`wasm-html-to-image/workers`                                  |
| [**`cloudflare-ogp`**](./cloudflare-ogp/)                         | Dynamic OGP Generator       | Cloudflare Workers (Hono)   | Wrangler                    | `wasm-html-to-image/workerd`<br>`wasm-html-to-image/tailwind` |
| [**`cloudflare-mermaid`**](./cloudflare-mermaid/)                 | On-the-fly Mermaid API      | Cloudflare Workers (workerd)| Wrangler                    | `wasm-html-to-image/workerd`                                                                 |

---

## 🛠️ Sample Details

### 1. [playground](./playground/)

Interactive web UI for testing HTML-to-image rendering and image format optimization in real time.

- **Runtime**: Browser SPA (React 19)
- **Build Tool**: Vite 8, Tailwind CSS v4, TypeScript
- **Package Feature**: Uses `wasm-html-to-image/workers` to run rendering in background Web Workers without blocking the UI. Includes bundled test templates and assets.
- **Run**:
  ```bash
  pnpm --filter playground dev
  ```

---

### 2. [mermaid-compare](./mermaid-compare/)

Interactive visual and performance comparison app between `wasm-html-to-image`'s native Mermaid renderer and the official `mermaid` package.

- **Runtime**: Browser SPA (React 19)
- **Build Tool**: Vite 8, Tailwind CSS v4, TypeScript
- **Package Feature**:
  - Compares layout, fonts, and arrows using Side-by-Side and draggable Split Slider views.
  - Profiles rendering latency (ms) in real-time.
  - Tests themes (`light`, `dark`, `forest`, `dracula`, etc.) and error recovery modes (`strict`, `compat`, `recover`).
  - Supports exporting diagrams as SVG or raster (PNG, WebP).
- **Deploy to Cloudflare**:
  ```bash
  # Cloudflare Workers (Static Assets)
  pnpm --filter mermaid-compare deploy

  # Or Cloudflare Pages
  pnpm --filter mermaid-compare deploy:pages
  ```

---

### 3. [next-image-convert](./next-image-convert/)

Batch image format conversion (AVIF, WebP, JPEG, PNG) on Next.js.

- **Runtime**: Next.js 16 (App Router, Client Component)
- **Build Tool**: Next.js (Turbopack), Tailwind CSS v4
- **Package Feature**: Uses `wasm-html-to-image/workers` with configurable worker pool concurrency (`setLimit`, `launchWorker`, `waitReady`) to convert multiple images in parallel on client-side Web Workers.
- **Run**:
  ```bash
  pnpm --filter next-image-convert dev
  ```

---

### 4. [react-router-image-convert](./react-router-image-convert/)

Batch image format conversion using React Router v7.

- **Runtime**: React Router v7 (SSR / Client)
- **Build Tool**: Vite 7, Tailwind CSS v4, Wrangler
- **Package Feature**: Demonstrates client-side multithreaded image processing via `wasm-html-to-image/workers` in a Vite + React Router environment.
- **Run**:
  ```bash
  pnpm --filter react-router-image-convert dev
  ```

---

### 5. [node-image-convert](./node-image-convert/)

Batch image conversion CLI utility on Node.js with single-threaded and multi-threaded modes.

- **Runtime**: Node.js (ESM)
- **Build Tool**: TypeScript (`tsc -b`), `tsx`
- **Package Feature**:
  - `src/index.ts`: Uses `wasm-html-to-image/single` for zero-config single-thread rendering.
  - `src/worker.ts`: Uses `wasm-html-to-image/workers` with Node.js worker threads for high-throughput parallel processing.
- **Run**:

  ```bash
  # Single thread
  pnpm --filter node-image-convert dev

  # Multi thread
  pnpm --filter node-image-convert dev:worker
  ```

---

### 6. [cloudflare-ogp](./cloudflare-ogp/)

Dynamic Social Preview (OGP) image generation running at the edge using Hono JSX, native Mermaid diagrams, and Tailwind CSS.

- **Build Tool**: Wrangler, Hono 4, TypeScript
- **Package Feature**:
  - Uses Hono JSX to construct rich, responsive OGP layouts at the edge.
  - Native Mermaid diagram rendering directly within HTML via `<div class="mermaid">`.
  - Uses `createCSS` from `wasm-html-to-image/tailwind` to extract utility classes and dynamically generate Tailwind styles.
  - Bundles local assets via Wrangler Data rules without external network dependencies.
  - Renders to PNG at the edge via `wasm-html-to-image/workerd`.
- **Run / Test**:
  ```bash
  pnpm --filter cloudflare-ogp test
  ```

---

### 7. [cloudflare-image-optimization](./cloudflare-image-optimization/)

Edge image optimization and resizing proxy for Next.js (`next/image` compatible).

- **Runtime**: Cloudflare Workers (`workerd`)
- **Build Tool**: Wrangler, Jest (with `wrangler unstable_dev`)
- **Package Feature**: Inspects the client's `Accept` header to dynamically convert remote images into optimal formats (AVIF, WebP, JPEG, PNG) and caches responses using the Cloudflare Cache API.
- **Run / Test**:

  ```bash
  # Run dev server
  pnpm --filter cloudflare-workers-image-optimization dev

  # Run integration tests
  pnpm --filter cloudflare-workers-image-optimization test
  ```

---

### 7. [deno-ogp](./deno-ogp/)

Dynamic OGP image generation on Deno.

- **Runtime**: Deno 2+
- **Build Tool**: Deno CLI
- **Package Feature**: Imports `npm:wasm-html-to-image` and `npm:wasm-html-to-image/react` directly via Deno's npm specifiers to generate OGP cards from JSX templates.
- **Run**:
  ```bash
  cd deno-ogp && deno run --allow-all src/index.tsx
  ```

---

### 9. [cloudflare-mermaid](./cloudflare-mermaid/)

Ultra-lightweight on-the-fly Mermaid diagram renderer running on Cloudflare Workers. Converts Mermaid code to SVG, WebP, PNG, or JPEG directly via query parameters (`GET /?code=...&format=webp&theme=dark`).

- **Runtime**: Cloudflare Workers (`workerd`)
- **Build Tool**: Wrangler, TypeScript
- **Package Feature**: Native WASM rendering via `wasm-html-to-image/workerd` with zero-DOM and built-in edge caching.
- **Run**:
  ```bash
  pnpm --filter cloudflare-mermaid dev
  pnpm --filter cloudflare-mermaid test
  ```

---

### 10. [canvas-image-effects](./canvas-image-effects/)

Render an HTML card on a plain 2D canvas: live DOM via `content="drawable"` when supported, PNG snapshot fallback otherwise.

- **Runtime**: Browser SPA (React 19)
- **Build Tool**: Vite 8, TypeScript
- **Package Feature**:
  - `src/renderImage.ts` calls `render()` from `wasm-html-to-image/workers` (PNG, `scale: 2`) and decodes the bytes into an `ImageBitmap` (snapshot fallback path).
  - `src/effects/tilt.ts`: 2D parallax — the source is drawn as 24 horizontal strips, squashed and offset by virtual `rotateX` / `rotateY`, with a moving specular gradient (`globalCompositeOperation = "overlay"`) and a blurred drop shadow.
  - `src/effects/spotlight.ts`: lens reveal — a pre-blurred copy sits underneath, while the sharp image is masked by a radial-gradient `destination-out` hole that expands on intro and then follows the pointer.
  - Auto source mode: when Chrome exposes `content="drawable"` and `ctx.drawElementImage()`, a hidden drawable subtree repaints the live DOM each frame and the effects consume that canvas directly; otherwise the same effects consume the wasm-rendered `ImageBitmap`. A badge shows `LIVE DOM` vs `PNG snapshot`.
- **Run**:
  ```bash
  pnpm --filter canvas-image-effects dev      # http://localhost:3002
  pnpm --filter canvas-image-effects build
  ```
- **Deploy to Cloudflare**:
  ```bash
  # Cloudflare Workers (Static Assets)
  pnpm --filter canvas-image-effects deploy
  ```

