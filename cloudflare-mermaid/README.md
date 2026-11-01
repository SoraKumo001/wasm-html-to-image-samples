# cloudflare-mermaid

https://cloudflare-mermaid.mofon001.workers.dev/ui

Cloudflare Workers 上で [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) の WASM エンジンを活用し、Mermaid ダイアグラムを SVG や WebP、PNG、JPEG 等に変換・配信するマイクロサービスです。

Headless Chrome やブラウザ DOM（D3 等）を使用せず、エッジ環境でレンダリングします。

---

## 特徴

- プレイグラウンド UI (`/ui`): パラメータ調整、プレビュー、URL や cURL のコピー
- ゼロコンフィグ表示: パラメータ未指定の `GET /` でもサンプルの Mermaid 図を表示
- 複数フォーマット対応: SVG（ベクター）、WebP、PNG、JPEG（ラスター）
- テーマ・構文修復: 各種テーマ（light / dark / dracula 等）および構文自動修復（mode=compat / recover）
- エッジキャッシュ: Cloudflare Cache API によるキャッシュ配信
- GET / POST 対応: URL クエリによる取得と、長文ダイアグラム用の POST（JSON / Plain Text）

---

## プレイグラウンド (/ui)

ブラウザからパラメータを試せる Web UI を提供しています。

- URL: `http://127.0.0.1:8787/ui`（ローカル時）
- 主な機能:
  - 26 種類のプリセット（シーケンス図、フローチャート、クラス図、マインドマップなど）
  - リアルタイムプレビュー（レンダリング時間や画像サイズの表示）
  - テーマ、フォーマット、パースモード、背景色、パディングの変更
  - 生成された URL や cURL コマンドのコピー、画像ダウンロード
  - OGP（`/og.png`）およびファビコン（`/favicon.svg`）対応

---

## パラメータ仕様 (`GET /`)

| パラメータ | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `code` / `mermaid` | string | (サンプル図) | Mermaid ソースコード（URL エンコード） |
| `format` | string | `svg` | 出力形式: `svg`, `webp`, `png`, `jpeg`, `pdf` |
| `theme` | string | `light` | テーマ: `light`, `dark`, `neutral`, `forest`, `nord`, `dracula`, `solarized-light`, `solarized-dark`, `rose-pine`, `sepia` |
| `mode` | string | `strict` | パースモード: `strict`, `compat`, `recover` (自動修復) |
| `bg` / `background` | string | (テーマ依存) | 背景色（例: `#0f172a`, `transparent`） |
| `padding` | number | `16` | 図の周囲のパディング (px) |
| `directives` | boolean | `true` | `%%{init}%%` ディレクティブの有効化 |
| `download` | boolean | `false` | `true` の場合、ダウンロードヘッダーを付与 |

### パラメータの補足

- **コード指定 (`code`)**: GET では URL エンコードした文字列、POST ではリクエストボディ（JSON の `{ "code": "..." }` または `text/plain`）で送信します。URL 長制限を避ける場合は POST を推奨します。
- **フォーマット (`format`)**:
  - `svg`: ベクター形式。GitHub Markdown や Web ページでの埋め込み向け。
  - `webp`: 高圧縮ラスター形式。Web 配信やモバイル向け。
  - `png`: 透過背景や可逆圧縮に対応。
  - `jpeg`: 非可逆圧縮形式（透過非対応）。
- **パースモード (`mode`)**:
  - `strict`: 構文規則を厳格にチェックします（エラー時はエラー画像を返却）。
  - `compat`: 大文字小文字の揺れや未完の括弧などを許容します。
  - `recover`: 軽微なタイポや未対応の構文をスキップ・自動修復して描画を試みます。
- **背景色 (`bg`)**: `#ffffff` や `#0f172a` のカラーコードのほか、`transparent` で背景透過が可能です。

---

## リクエスト例

### 1. デフォルトのサンプル図を表示 (SVG)

```bash
curl https://<your-worker>.workers.dev/
```

### 2. クエリパラメータで指定 (ダークテーマの WebP)

```bash
curl "https://<your-worker>.workers.dev/?code=graph%20LR%3B%20A--%3EB&format=webp&theme=dark" --output diagram.webp
```

### 3. Markdown 内での画像埋め込み

```markdown
![Architecture Diagram](https://<your-worker>.workers.dev/?code=flowchart%20TD%3B%20A%5BClient%5D--%3EB%5BServer%5D&format=svg&theme=nord)
```

### 4. POST リクエスト（長文ダイアグラム）

```bash
curl -X POST https://<your-worker>.workers.dev/?format=png&theme=dracula \
  -H "Content-Type: application/json" \
  -d '{"code": "sequenceDiagram\n  autonumber\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi"}' \
  --output diagram.png
```

---

## 開発・テスト

```bash
# 依存関係のインストール
pnpm install

# ローカル開発サーバー起動
pnpm dev

# 型チェック
pnpm build

# スモークテスト（ローカル workerd 上での出力検証）
pnpm test

# Cloudflare Workers へデプロイ
pnpm deploy
```
