# rivet-image-optimization

An image optimization proxy service built on [Rivet Actors](https://rivet.dev/) (RivetKit).  
Ported from [`cloudflare-image-optimization`](../cloudflare-image-optimization/) to fit the Rivet Actors architecture, combining **high-speed WebAssembly image conversion (`wasm-html-to-image`)** with **Actor-native persistent SQLite caching**.

---

## 🌟 Features

- **WebAssembly Image Optimization**: Uses the universal WebAssembly engine from [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) to resize and convert formats (AVIF, WebP, JPEG, PNG) at high speed.
- **Durable SQLite Cache**: Leverages each Actor's built-in SQLite database (`rivetkit/db`) to durably cache optimized image binaries without requiring external cache infrastructure (such as Redis).
- **Web Standard `Request` / `Response` Support**: Seamlessly integrates with Next.js `next/image` custom loaders and Cloudflare Workers via RivetKit's `onRequest` hook.
- **RPC Action Support**: Supports type-safe RPC invocations (`optimizer.optimize(...)`) from Rivet clients in addition to standard HTTP endpoints.
- **SVG / GIF Passthrough**: Vector images (SVG) and animated GIFs are preserved and cached directly without unnecessary re-encoding.

---

## 🚀 Quick Start

### 1. Install Dependencies

Run from the repository root:

```bash
pnpm install
```

### 2. Start the Development Server

```bash
pnpm --filter rivet-image-optimization dev
```

### 3. Build

```bash
pnpm --filter rivet-image-optimization build
```

### 4. Run Tests

Run automated tests for image conversion and SQLite caching using Vitest:

```bash
pnpm --filter rivet-image-optimization test
```

---

## 🚢 Deployment

Two deployment methods are available depending on your target environment:

### Method 1: Deploy with Rivet Cloud / Rivet CLI (Recommended)

To deploy to Rivet Cloud's managed cluster:

1. **Install Rivet CLI & Sign in**:
   ```bash
   npx @rivetkit/cli login
   ```
2. **Link the Project**:
   ```bash
   cd rivet-image-optimization
   npx @rivetkit/cli link
   ```
   *(Or configure `.rivet/project.json` based on `.rivet/project.json.example`)*
3. **Deploy**:
   ```bash
   npx @rivetkit/cli deploy
   ```
4. **Automate CI/CD with GitHub Actions**:
   ```bash
   npx @rivetkit/cli setup-ci
   ```
   *Note: In production environments, `RIVET_ENDPOINT` is automatically injected by the cluster to launch the Actor.*

---

### Method 2: Deploy with Docker / Cloud PaaS (Railway, Render, Fly.io, VPS)

To deploy as a standalone resident container:

1. **Build the Docker Image**:
   ```bash
   cd rivet-image-optimization
   docker build -t rivet-image-optimization .
   ```
2. **Run the Container**:
   ```bash
   docker run -d -p 3000:3000 --name image-optimizer rivet-image-optimization
   ```
3. **PaaS (Railway, Render, etc.)**:
   - Connect your Git repository and set the root/context to `rivet-image-optimization/Dockerfile` (context: `rivet-image-optimization`).
   - The image optimization proxy will be immediately accessible on port `3000`.

---

## 🔌 API Specification

### HTTP Endpoint (`onRequest`)

```http
GET /?url=<IMAGE_URL>&w=<WIDTH>&q=<QUALITY>&type=<FORMAT>
```

#### Query Parameters

| Parameter | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `url` | **Yes** | - | Target source image URL (must be a valid URL) |
| `w` | No | Original size | Resized image width (px) |
| `q` | No | Auto | Image quality (1–100) |
| `type` | No | Auto-negotiated | Output format (`avif`, `webp`, `png`, `jpeg`) |

#### Format Auto-Negotiation

If the `type` parameter is omitted, the optimal format is automatically determined based on the request's `Accept` header and the source image type:

1. If `Accept: image/avif` is present → **AVIF**
2. If `Accept: image/webp` is present → **WebP**
3. If source image is `image/jpeg` → **JPEG**
4. Otherwise → **PNG**

*Note: `image/svg+xml` and `image/gif` are returned as-is without re-encoding.*

---

## 💻 Next.js Integration Example

Configure a custom loader in Next.js (`next.config.js`) to route `next/image` requests through the optimizer:

```javascript
// next.config.js
module.exports = {
  images: {
    loader: "custom",
    loaderFile: "./imageLoader.js",
  },
};
```

```javascript
// imageLoader.js
export default function rivetImageLoader({ src, width, quality }) {
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
  });
  return `http://localhost:3000/?${params.toString()}`;
}
```

---

## 📁 Directory Structure

```
rivet-image-optimization/
├── .rivet/
│   └── project.json.example  # Sample Rivet cluster/org link configuration
├── src/
│   ├── index.ts              # ImageOptimizer Actor implementation, SQLite cache, and core optimization logic
│   └── server.ts             # Local development and standalone HTTP server
├── tests/
│   └── index.test.ts         # Unit & integration tests with Vitest
├── images/                   # Sample image assets for testing
├── Dockerfile                # Multi-stage build Dockerfile
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md
```
