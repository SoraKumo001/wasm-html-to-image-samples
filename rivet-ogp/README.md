# rivet-ogp

High-performance dynamic Open Graph Protocol (OGP) image generation engine powered by [RivetKit](https://rivet.gg/) Actors, [wasm-html-to-image](https://github.com/SoraKumo001/wasm-html-to-image), [Hono](https://hono.dev/) JSX, and UnoCSS / Tailwind.

Ported from Cloudflare Workers (`cloudflare-ogp`) to Rivet Actors with embedded durable SQLite caching.

---

## 🚀 Features

- **Dynamic OGP Rendering**: Render 1200x630 high-resolution social preview cards using pure HTML/CSS and JSX.
- **WASM-Powered Engine**: Uses `wasm-html-to-image` for serverless, headless browser-free PNG rasterization.
- **Embedded Durable SQLite Caching**:
  - Automatically caches generated images in an embedded SQLite database (`image_cache` table) powered by RivetKit's state layer.
  - Returns `X-Cache: HIT` / `MISS` headers to indicate cache status.
  - Instant response times for repeat queries.
- **Rich Layout Components**:
  - Gradient lighting and modern dark aesthetic.
  - Noto Sans JP Japanese typography.
  - Floating vertical text pill (`writing-mode: vertical-rl`).
  - Layered 1:1 image card with glassmorphism backdrop.
  - Integrated Mermaid diagram rendering window.
- **Dual API Access**:
  - **Raw HTTP Gateway**: Directly access via query parameters (e.g. `/` with `?title=...&subtitle=...`).
  - **Actor RPC**: Strongly typed method invocation (`ogpGenerator.actions.generate`) from client SDKs.
- **Universal Runtime**: Runs locally via `node:http`, inside Docker containers, or directly deployed to Rivet Cloud.

---

## 🛠️ Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `"Title"` | Main headline text (large bold Japanese typography) |
| `subtitle` | `string` | `"subtitle"` | Supporting description / category text |
| `image` | `string` | Sample asset (base64) | Image URL or base64 data URI for the 1:1 preview card |
| `mermaid` | `string` | Default architecture diagram | Mermaid diagram code rendered inside the preview box |
| `vertical` | `string` | Japanese vertical sample | Vertical pill text (set to `"none"` to disable) |

---

## 📦 Getting Started

### 1. Install Dependencies

From the repository root or the package directory:

```bash
pnpm install
```

### 2. Run Local Development Server

```bash
pnpm --filter rivet-ogp dev
```

The server will start at `http://localhost:3000`.

Try opening in your browser:

- Default template:
  ```
  http://localhost:3000/
  ```
- Custom title and subtitle:
  ```
  http://localhost:3000/?title=Hello+Rivet&subtitle=WASM+OGP+Generation
  ```
- Custom vertical pill:
  ```
  http://localhost:3000/?title=Deep+Dive&subtitle=Rivet+Actors&vertical=分散アクター最高
  ```

---

## 🧪 Testing

Run the test suite using Vitest:

```bash
pnpm --filter rivet-ogp test
```

---

## 🐳 Docker Build

Build and run using the optimized multi-stage `Dockerfile`:

```bash
docker build -t rivet-ogp .
docker run -p 3000:3000 rivet-ogp
```

---

## ☁️ Deployment to Rivet Cloud

### Prerequisites

1. Install the Rivet CLI:
   ```bash
   npm install -g @rivetkit/cli
   ```
2. Log in and configure your project:
   ```bash
   rivet login
   ```
3. Prepare `.rivet/project.json`:
   ```bash
   cp .rivet/project.json.example .rivet/project.json
   ```

### Deploy

```bash
rivet deploy
```

Once deployed, your actor will be accessible at:
```
https://<cluster-endpoint>.onrivet.dev/
```

---

## 📄 License

MIT
