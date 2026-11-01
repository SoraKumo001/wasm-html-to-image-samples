# cloudflare-ogp

Cloudflare Workers 上で [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) と **Hono JSX** を活用し、高品質なソーシャルプレビュー画像（OGP: 1200×630 PNG）をエッジで動的に生成・配信するマイクロサービスです。

Headless Chrome や Puppeteer を使わず、WASM ベースのレンダリングエンジン（Skia + litehtml）により、ミリ秒単位の高速処理・低メモリで OGP 画像を生成します。

---

## 特徴

- **Hono & Hono JSX**: 軽量なルーティングと、`.toString()` で直接 HTML 化できる直感的な JSX 記述。
- **UnoCSS / Tailwind CSS**: `wasm-html-to-image/tailwind` の `createCSS()` により、ユーティリティクラスからインライン CSS を自動抽出・適用。
- **Mermaid ダイアグラムのネイティブ描画**: WASM エンジンの `<div class="mermaid">` サポートにより、外部ライブラリなしでエッジ上で Mermaid 図を直接描画。
- **アセットのバンドル**: Wrangler の Data モジュールルールにより、ローカル画像（`assets/image.jpg`）を Worker に直接バンドルし、外部通信不要で即座に描画。
- **レイヤード OGP デザイン**:
  - タイトル・サブタイトル・バッジ
  - 1:1 正方形のアイキャッチ画像カード（縦横比を完全維持）
  - macOS 風の Mermaid アーキテクチャウィンドウカード（絶妙なオーバーラップ配置）
- **エッジキャッシュ**: Cloudflare Cache API により生成済み画像をキャッシュ配信。

---

## クエリパラメータ仕様 (`GET /`)

| パラメータ | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `title` | string | `Title` | メインタイトル |
| `subtitle` | string | `subtitle` | サブタイトル |
| `image` | string | (バンドルされたローカル画像) | 右上カードに表示する画像 URL または Data URL |
| `mermaid` | string | (サンプルアーキテクチャ図) | Mermaid ソースコード（URL エンコード） |
| `vertical` | string | `超高速エッジ生成` | 中央に配置される縦書きピルバッジのテキスト（`none` で非表示） |

### レンダリング例

```
+---------------------------------------------------------------+
|  -- FEATURED CONTENT               +-----------------------+  |
|                         [超]       |                       |  |
|  Title                  [高]       |      Cover Photo      |  |
|                         [速]       |   (1:1 Square Image)  |  |
|  subtitle               [エ]       +------------+----------+  |
|                         [ッ]       | ● ● ● mmd  | Mermaid  |  |
|                         [ジ]       |-----------------------|  |
|  [satoru-cloudflare-ogp][生]       | Client -> Worker->... |  |
|                         [成]       +-----------------------+  |
+---------------------------------------------------------------+
```

---

## リクエスト例

### 1. デフォルト設定で画像取得
```bash
curl "http://127.0.0.1:8787/?title=Hello%20World&subtitle=Edge%20Rendering" --output ogp.png
```

### 2. Mermaid 図を動的に変更
```bash
curl "http://127.0.0.1:8787/?title=My%20Architecture&mermaid=graph%20LR%3B%20A%5BApp%5D--%3EB%5BWorker%5D" --output ogp.png
```

---

## 開発・テスト

```bash
# 依存関係のインストール（リポジトリルートから）
pnpm install

# ローカル開発サーバー起動
pnpm --filter cloudflare-ogp dev

# 型チェック (TypeScript)
pnpm --filter cloudflare-ogp build

# スモークテスト (wrangler dev + HTTP アサーション)
pnpm --filter cloudflare-ogp test
```
