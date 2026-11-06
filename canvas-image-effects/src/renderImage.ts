import { render } from "wasm-html-to-image/workers";

/** A rendered PNG, decoded once and ready to be drawn by a 2D effect. */
export interface RenderedImage {
  /** Decoded PNG. Callers own it and should call `bitmap.close()` when done. */
  bitmap: ImageBitmap;
  /** Bitmap width in device pixels (layout width × scale). */
  width: number;
  /** Bitmap height in device pixels (layout height × scale). */
  height: number;
  /** PNG byte length. */
  bytes: number;
  /** Render wall time in milliseconds. */
  durationMs: number;
}

/** Debug hook passthrough (element border boxes in page coordinates). */
export type LayoutReporter = (boxes: unknown[]) => void;

export interface RenderImageOptions {
  /** HTML document to render. */
  value: string;
  /** Layout viewport width in CSS px. Defaults to 1200. */
  width?: number;
  /** Layout viewport height in CSS px. Defaults to 630. */
  height?: number;
  /** Pixel density of the raster output. Defaults to 2. */
  scale?: number;
  /** Accepted for future use: receives `render()`'s layout boxes. */
  onLayout?: LayoutReporter;
}

/**
 * Render HTML to a PNG with wasm-html-to-image, then decode it into an
 * `ImageBitmap` that canvas effects can draw directly.
 */
export async function renderImage({
  value,
  width = 1200,
  height = 630,
  scale = 2,
  onLayout,
}: RenderImageOptions): Promise<RenderedImage> {
  const started = performance.now();

  const result = await render({
    value,
    width,
    height,
    format: "png",
    scale,
    onLayout,
  });

  if (typeof result.data === "string") {
    throw new Error(
      `Expected binary PNG data from render(), got a ${typeof result.data} (format: ${result.format}).`,
    );
  }

  const bytes = result.data;
  const blob = new Blob([bytes.slice()], { type: "image/png" });
  const bitmap = await createImageBitmap(blob);

  return {
    bitmap,
    width: result.width ?? bitmap.width,
    height: result.height ?? bitmap.height,
    bytes: bytes.byteLength,
    durationMs: performance.now() - started,
  };
}
