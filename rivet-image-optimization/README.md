# rivet-image-optimization

[Rivet Actors](https://rivet.dev/) (RivetKit) 上で動作する画像最適化プロキシサービス。  
[`cloudflare-image-optimization`](../cloudflare-image-optimization/) の機能を Rivet Actors のアーキテクチャに合わせて移植し、**WebAssembly による高速画像変換 (`wasm-html-to-image`)** と **Actor 内蔵の永続 SQLite キャッシュ** を組み合わせた実装です。

---

## 🌟 特徴

- **WebAssembly 画像最適化**: [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) の Universal WASM エンジンを採用し、AVIF, WebP, JPEG, PNG へのリサイズ・フォーマット変換を高速処理。
- **Durable SQLite キャッシュ**: 各 Actor に自動プロビジョニングされる内蔵 SQLite データベース（`rivetkit/db`）を活用。外部キャッシュサーバー（Redis等）なしで、最適化済みバイナリを永続キャッシュ。
- **Web 標準 `Request` / `Response` 対応**: RivetKit の `onRequest` フックにより、Cloudflare Workers や Next.js `next/image` のカスタムローダーとシームレスに連携。
- **RPC Action 対応**: HTTP 経由だけでなく、Rivet クライアントからの型安全な RPC 呼び出し（`optimizer.optimize(...)`）もサポート。
- **SVG / GIF パススルー**: ベクター画像やアニメーション GIF は不要な再エンコードを行わず、そのままキャッシュ＆返却。

---

## 🚀 クイックスタート

### 1. 依存関係のインストール

プロジェクトルートから実行:

```bash
pnpm install
```

### 2. 開発サーバーの起動

```bash
pnpm --filter rivet-image-optimization dev
```

### 3. ビルド

```bash
pnpm --filter rivet-image-optimization build
```

### 4. テストの実行

Vitest による画像変換および SQLite キャッシュの自動テスト:

```bash
pnpm --filter rivet-image-optimization test
```

---

## 🚢 デプロイ方法

環境に応じて以下の2つのデプロイ方法が選択できます。

### 方法 1: Rivet Cloud / Rivet CLI でデプロイ（推奨）

Rivet 公式のマネージド環境へデプロイする場合：

1. **Rivet CLI のインストール & ログイン**:
   ```bash
   npx @rivetkit/cli login
   ```
2. **プロジェクトのリンク**:
   ```bash
   cd rivet-image-optimization
   npx @rivetkit/cli link
   ```
3. **デプロイの実行**:
   ```bash
   npx @rivetkit/cli deploy
   ```
4. **CI/CD（GitHub Actions）の自動設定**:
   ```bash
   npx @rivetkit/cli setup-ci
   ```
   ※ 本番環境ではクラスタから自動的に `RIVET_ENDPOINT` が注入され、Actor が起動します。

---

### 方法 2: Docker / クラウド PaaS（Railway, Render, Fly.io, VPS）へデプロイ

Docker コンテナとしてスタンドアロンに常駐起動する場合：

1. **Docker イメージのビルド**:
   ```bash
   cd rivet-image-optimization
   docker build -t rivet-image-optimization .
   ```
2. **コンテナの実行**:
   ```bash
   docker run -d -p 3000:3000 --name image-optimizer rivet-image-optimization
   ```
3. **Railway / Render 等の PaaS**:
   - リポジトリを連携し、`rivet-image-optimization/Dockerfile`（ビルドコンテキスト: `rivet-image-optimization`）を指定するだけで自動ビルド・デプロイされます。
   - ポート `3000` で画像最適化プロキシとして即座に利用可能になります。

---

## 🔌 API 仕様

### HTTP エンドポイント (`onRequest`)

```http
GET /?url=<IMAGE_URL>&w=<WIDTH>&q=<QUALITY>&type=<FORMAT>
```

#### クエリパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
| :--- | :---: | :--- | :--- |
| `url` | **Yes** | - | 最適化対象の元画像 URL（有効な URL 形式） |
| `w` | No | 原寸 | リサイズ後の幅（px） |
| `q` | No | 自動 | 画質（1〜100） |
| `type` | No | 自動ネゴシエーション | 出力フォーマット（`avif`, `webp`, `png`, `jpeg`） |

#### フォーマット自動ネゴシエーション

`type` パラメータが省略された場合、リクエストの `Accept` ヘッダーに応じて最適なフォーマットを自動選択します:

1. `Accept: image/avif` を含む場合 → **AVIF**
2. `Accept: image/webp` を含む場合 → **WebP**
3. 元画像が `image/jpeg` の場合 → **JPEG**
4. その他 → **PNG**

※ `image/svg+xml` および `image/gif` は変換されず、原画像のまま返却されます。

---

## 💻 Next.js との連携例

Next.js の `next.config.js` でカスタムローダーを設定することで、`next/image` のリクエスト先として利用できます:

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
  return `http://localhost:6420/gateway/imageOptimizer/request?${params.toString()}`;
}
```

---

## 📁 ディレクトリ構成

```
rivet-image-optimization/
├── .rivet/
│   └── project.json.example  # Rivet クラスタ・組織リンク設定のサンプル
├── src/
│   ├── index.ts              # ImageOptimizer Actor 本体、SQLiteキャッシュ、最適化ロジック
│   └── server.ts             # ローカル開発・スタンドアロン実行用 HTTP サーバー
├── tests/
│   └── index.test.ts         # Vitest による単体・統合テスト
├── images/                   # テスト用画像アセット
├── Dockerfile                # マルチステージビルド対応 Dockerfile
├── package.json              # 依存関係およびスクリプト
├── tsconfig.json             # TypeScript 設定
└── README.md
```
