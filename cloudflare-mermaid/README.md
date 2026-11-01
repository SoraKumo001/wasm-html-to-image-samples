# cloudflare-mermaid

https://cloudflare-mermaid.mofon001.workers.dev/ui

Cloudflare Workers 上で [`wasm-html-to-image`](https://www.npmjs.com/package/wasm-html-to-image) のネイティブ WASM エンジンを活用し、Mermaid ダイアグラムをオンザフライで **SVG / WebP / PNG / JPEG** 等に変換・配信する超軽量マイクロサービスです。

Headless Chrome やブラウザ DOM（D3 等）を一切使わず、ゼロ DOM かつエッジ環境で高速にレンダリングします。

---

## 🚀 特徴

- **プレイグラウンドUI完備**: `GET /playground`（または `/ui`）にアクセスすれば、ブラウザから各パラメータの調整、リアルタイムプレビュー、URL・cURLのコピーが可能。
- **ゼロコンフィグ表示**: パラメータなしで `GET /` にアクセスした場合でも、デフォルトのサンプル Mermaid 図を即座にレンダリング。
- **マルチフォーマット**: `svg` (ベクター), `webp`, `png`, `jpeg` (ラスター) に対応。
- **テーマ & モード指定**: `light`, `dark`, `forest`, `dracula`, `nord` などのテーマや、文法自動修復の `mode=compat` / `mode=recover` を指定可能。
- **エッジキャッシュ対応**: Cloudflare Cache API により同一パラメータのリクエストはエッジで即座にキャッシュレスポンス。
- **GET & POST 両対応**: URL クエリパラメータだけでなく、長文ダイアグラム用の POST（JSON / Plain Text）にも対応。

---

## 🎮 プレイグラウンド (`/playground` / `/ui`)

ブラウザから直接パラメータを調整しながら試行できるインタラクティブフォームを提供しています。

- **URL**: `http://127.0.0.1:8787/playground` (または `/ui`)
- **主な機能**:
  - **プリセットダイアグラム**: Flowchart, Sequence, Class, State, ER, Git Graph, Mindmap, Architecture, 構文自動修復などのサンプルをワンクリック読み込み
  - **リアルタイムプレビュー**: SVG インライン描画およびラスター画像（WebP/PNG/JPEG）のプレビュー、レンダリング時間 (ms) / データサイズ (KB) 計測
  - **パラメータ調整**: テーマ選択（全10種）、パースモード（strict / compat / recover）、パディング、背景色、ディレクティブ許可、ダウンロードフラグ
  - **ワンクリック共有 / エクスポート**: 生成された GET URL コピー、POST 用 cURL コマンドコピー、ダイアグラムファイルの直接ダウンロード

---

## 🛠️ パラメータ仕様（`GET /`）

| パラメータ | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `code` / `mermaid` | string | (サンプル図) | Mermaid ソースコード（URL エンコード） |
| `format` | string | `svg` | 出力形式: `svg`, `webp`, `png`, `jpeg`, `pdf` |
| `theme` | string | `light` | テーマ: `light`, `dark`, `neutral`, `forest`, `nord`, `dracula`, `solarized-light`, `solarized-dark`, `rose-pine`, `sepia` |
| `mode` | string | `strict` | パースモード: `strict`, `compat`, `recover` (自動修復) |
| `bg` / `background` | string | (テーマ依存) | 背景色（例: `#0f172a`, `transparent`） |
| `padding` | number | `16` | 図の周囲のパディング（px） |
| `directives` | boolean | `true` | `%%{init}%%` ディレクティブの許可 (`true` / `false`) |
| `download` | boolean | `false` | `true` の場合、ダウンロードヘッダーを付与 |

---

### 📖 各パラメータの詳細説明

#### 1. `code` / `mermaid` (ダイアグラムコード)
- **説明**: レンダリング対象の Mermaid ソーステキスト。
- **指定方法**:
  - `GET`: `encodeURIComponent` で URL エンコードして指定。
  - `POST`: リクエストボディ（JSON の `{ "code": "..." }` または `text/plain`）で送信。長大なダイアグラムで URL の長さ制限を回避したい場合に推奨。
- **省略時**: デフォルトのアーキテクチャ概要図（Client → Cloudflare Workers → Output）がレンダリングされます。

#### 2. `format` (出力画像フォーマット)
- **説明**: 生成する画像フォーマット。
- **選択肢**:
  - `svg` (デフォルト): 最も軽量で、拡大しても劣化しないベクター画像。GitHub Markdown や Web ページでのインライン表示に最適。
  - `webp`: 高圧縮率なラスター画像。Web 配信やモバイル向けに通信容量を最小化したい場合に最適。
  - `png`: 透過背景や可逆圧縮に対応した汎用ラスター画像。
  - `jpeg` / `jpg`: 写真系と同様の非可逆圧縮形式（透過は非対応）。
  - `pdf`: ドキュメント保存や印刷向けのベクター PDF 形式。

#### 3. `theme` (カラーテーマ)
- **説明**: ダイアグラム全体の配色（ノード背景、枠線、矢印、テキスト、背景色）。
- **選択肢**:
  - `light` (デフォルト): 標準的な白背景ベースのクリーンなテーマ。
  - `dark`: ダークモードに適した暗色テーマ。
  - `neutral`: モノクロ調の落ち着いたスタイル。
  - `forest`: グリーンとアースカラーを基調としたナチュラルなトーン。
  - `nord`: 北欧風のアイスブルーとグレーを取り入れたクールなテーマ。
  - `dracula`: コントラストの高いパープル・ピンク系の人気ダークテーマ。
  - `solarized-light`: アイボリー基調の目に優しい明色テーマ。
  - `solarized-dark`: 深緑・シアンがアクセントのダークテーマ。
  - `rose-pine`: レトロでソフトなパステル調ダークテーマ。
  - `sepia`: 古書風の温かみのあるセピア調テーマ。

#### 4. `mode` (構文パースモード)
- **説明**: Mermaid 記法の厳密さと自動修復レベル。
- **選択肢**:
  - `strict` (デフォルト): 構文規則を厳格にチェック。記述ミスがある場合はエラーを表示。
  - `compat`: 大文字小文字の揺れ（`flowchart td` など）や未完の括弧などを許容する互換モード。
  - `recover`: 軽微なタイポや未対応の行を自動修復・スキップして極力描画を完遂するリカバリーモード。

#### 5. `bg` / `background` (背景色)
- **説明**: テーマ標準の背景色を上書き指定。
- **指定例**:
  - `transparent`: 背景を透過（SVG や PNG/WebP で背景を透明にしたい場合に便利）。
  - `#0f172a`: 任意の 16 進カラーコード（URL では `%230f172a` とエンコード）。
  - `white`, `black` 等の CSS カラー名。

#### 6. `padding` (パディング)
- **説明**: ダイアグラムの外枠と画像の端との余白をピクセル単位で指定。
- **指定値**: 数値（px、例: `padding=0`, `padding=32`）。デフォルトは `16`。

#### 7. `directives` (ディレクティブ設定)
- **説明**: Mermaid ソース内の `%%{init: {...}}%%` やフロントマターによるテーマ変数の直接上書きを有効にするかどうか。
- **選択肢**: `true` (デフォルト) / `false`。

#### 8. `download` (ダウンロード強制)
- **説明**: ブラウザで開いた際にインライン表示せず、画像ファイルとして保存（ダウンロード）させるか。
- **選択肢**: `true` の場合、`Content-Disposition: attachment; filename="diagram.{format}"` ヘッダーを付与。

---

## 💡 リクエスト例

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

## 💻 開発・実行

```bash
# 依存関係のインストール
pnpm install

# ローカル開発サーバー起動
pnpm --filter cloudflare-mermaid dev

# 型チェック
pnpm --filter cloudflare-mermaid build

# スモークテスト（ローカル workerd 上での SVG / WebP / PNG / POST 出力検証）
pnpm --filter cloudflare-mermaid test

# Cloudflare Workers へデプロイ
pnpm --filter cloudflare-mermaid deploy
```
