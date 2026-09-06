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
| [**`next-image-convert`**](./next-image-convert/)                 | Client-Side Image Converter | Next.js 16 (App Router)     | Turbopack + Tailwind CSS v4 | `wasm-html-to-image/workers`                                                                 |
| [**`react-router-image-convert`**](./react-router-image-convert/) | Client-Side Image Converter | React Router v7             | Vite 7 + Tailwind CSS v4    | `wasm-html-to-image/workers`                                                                 |
| [**`node-image-convert`**](./node-image-convert/)                 | CLI Batch Converter         | Node.js (ESM)               | TypeScript (`tsc -b`), tsx  | `wasm-html-to-image/single`<br>`wasm-html-to-image/workers`                                  |
| [**`cloudflare-ogp`**](./cloudflare-ogp/)                         | Dynamic OGP Generator       | Cloudflare Workers (Preact) | Wrangler                    | `wasm-html-to-image/workerd`<br>`wasm-html-to-image/preact`<br>`wasm-html-to-image/tailwind` |
| [**`deno-ogp`**](./deno-ogp/)                                     | Dynamic OGP Generator       | Deno                        | Deno CLI                    | `npm:wasm-html-to-image`<br>`npm:wasm-html-to-image/react`                                   |
| [**`deno-image-optimization`**](./deno-image-optimization/)       | Image Optimization Proxy    | Deno                        | Deno CLI                    | `npm:wasm-html-to-image`                                                                     |

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

### 2. [next-image-convert](./next-image-convert/)

Batch image format conversion (AVIF, WebP, JPEG, PNG) on Next.js.

- **Runtime**: Next.js 16 (App Router, Client Component)
- **Build Tool**: Next.js (Turbopack), Tailwind CSS v4
- **Package Feature**: Uses `wasm-html-to-image/workers` with configurable worker pool concurrency (`setLimit`, `launchWorker`, `waitReady`) to convert multiple images in parallel on client-side Web Workers.
- **Run**:
  ```bash
  pnpm --filter next-image-convert dev
  ```

---

### 3. [react-router-image-convert](./react-router-image-convert/)

Batch image format conversion using React Router v7.

- **Runtime**: React Router v7 (SSR / Client)
- **Build Tool**: Vite 7, Tailwind CSS v4, Wrangler
- **Package Feature**: Demonstrates client-side multithreaded image processing via `wasm-html-to-image/workers` in a Vite + React Router environment.
- **Run**:
  ```bash
  pnpm --filter react-router-image-convert dev
  ```

---

### 4. [node-image-convert](./node-image-convert/)

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

### 5. [cloudflare-ogp](./cloudflare-ogp/)

Dynamic Social Preview (OGP) image generation running at the edge using Preact and Tailwind CSS.

- **Build Tool**: Wrangler, Preact 10, TypeScript
- **Package Feature**:
  - Uses `toHtml` from `wasm-html-to-image/preact` to render Preact JSX components to HTML.
  - Uses `createCSS` from `wasm-html-to-image/tailwind` to extract utility classes and dynamically generate Tailwind styles.
  - Renders to PNG at the edge via `wasm-html-to-image/workerd`.
    pnpm --filter cloudflare-ogp test

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

### 8. [deno-image-optimization](./deno-image-optimization/)

On-demand image optimization and format conversion server on Deno.

- **Runtime**: Deno 2+
- **Build Tool**: Deno CLI
- **Package Feature**: Simple HTTP proxy server using `Deno.serve` and `npm:wasm-html-to-image` to transcode and resize images on the fly.
- **Run**:
  ```bash
  cd deno-image-optimization && deno run --allow-all src/index.ts
  ```
