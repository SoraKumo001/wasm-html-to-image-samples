/**
 * A drawable image plus the metadata an effect needs to slice or scale it.
 *
 * Snapshot mode passes a decoded `ImageBitmap`. Live mode passes a drawable
 * canvas that holds the latest `drawElementImage()` paint and a `refresh`
 * callback, which the effect invokes once per frame before drawing.
 */
export interface EffectSource {
  /** Source handed to `ctx.drawImage()`. */
  image: CanvasImageSource;
  /** Source width in pixels. */
  width: number;
  /** Source height in pixels. */
  height: number;
  /** Optional: repaint the source before it is read (live DOM mode). */
  refresh?: () => void;
}

/**
 * Common contract for every canvas effect in this sample.
 *
 * Coordinates passed to `setPointer` are CSS pixels relative to the canvas
 * element's top-left corner; the effect owns device-pixel-ratio handling.
 */
export interface EffectHandle {
  /** Attach to a canvas and begin the animation loop. */
  start(canvas: HTMLCanvasElement, source: EffectSource): void;
  /** Stop the loop and release per-effect resources. The source is not closed. */
  stop(): void;
  /** Feed pointer position (CSS px, relative to the canvas). */
  setPointer(x: number, y: number): void;
}
