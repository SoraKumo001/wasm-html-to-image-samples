import type { EffectHandle, EffectSource } from "./types";

const STRIPS = 24;
const MAX_DPR = 2;
const EASE = 0.09;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Frame = {
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
};

/**
 * 2D parallax tilt.
 *
 * The PNG is sliced into horizontal strips. Each strip is squashed and
 * horizontally offset according to a virtual rotateX / rotateY, which reads as
 * a perspective tilt without a 3D context. A moving specular gradient (drawn
 * with `globalCompositeOperation = "overlay"`) plus a blurred drop shadow sells
 * the lighting change.
 */
export function createTiltEffect(): EffectHandle {
  let canvas: HTMLCanvasElement | null = null;
  let source: EffectSource | null = null;
  let raf = 0;
  let running = false;
  let startTime = 0;

  // Current (eased) rotation, -1..1 on each axis.
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let hasPointer = false;

  const syncCanvas = (): Frame | null => {
    if (!canvas) return null;
    const dpr = clamp(window.devicePixelRatio || 1, 1, MAX_DPR);
    const cssWidth = canvas.clientWidth || canvas.width || 1;
    const cssHeight = canvas.clientHeight || canvas.height || 1;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, cssWidth, cssHeight };
  };

  const frame = (now: number) => {
    if (!running) return;

    // Live mode: repaint the drawable canvas from the DOM before reading it.
    source?.refresh?.();
    const view = syncCanvas();

    if (!view || !source || source.width === 0 || source.height === 0) {
      // Source not ready: keep the loop alive so a later start() is the only
      // thing that needs to supply new pixels.
      raf = requestAnimationFrame(frame);
      return;
    }

    const { ctx, cssWidth: w, cssHeight: h } = view;
    const elapsed = (now - startTime) / 1000;

    // Gentle idle drift until the pointer takes over.
    if (!hasPointer) {
      targetX = Math.sin(elapsed * 0.55) * 0.35;
      targetY = Math.cos(elapsed * 0.45) * 0.28;
    }

    x = lerp(x, targetX, EASE);
    y = lerp(y, targetY, EASE);

    // Virtual rotation angles (small angles, used as perspective factors).
    const rx = y * 0.5;
    const ry = x * 0.5;

    ctx.clearRect(0, 0, w, h);

    // Drop shadow: painted underneath with a slight inset so the warped strips
    // always cover the solid rect itself.
    const insetX = w * 0.05;
    ctx.save();
    ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
    ctx.shadowBlur = Math.max(18, w * 0.05);
    ctx.shadowOffsetY = Math.max(8, w * 0.022);
    ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
    ctx.beginPath();
    ctx.roundRect(insetX, h * 0.07, w - insetX * 2, h * 0.86, w * 0.02);
    ctx.fill();
    ctx.restore();

    // Warped strips.
    const stripHeight = h / STRIPS;
    const sourceStripHeight = source.height / STRIPS;
    const stripScaleX = 1 - Math.abs(ry) * 0.05;
    const destWidth = w * stripScaleX;
    let destY = 0;

    for (let i = 0; i < STRIPS; i++) {
      // -0.5 (top) .. 0.5 (bottom) — the row's position through the image.
      const v = (i + 0.5) / STRIPS - 0.5;
      const depth = 1 + v * rx * 0.9;
      const stripDestHeight = stripHeight * depth;
      const offsetX = ry * v * 2 * w * 0.07;

      ctx.drawImage(
        source.image,
        0,
        i * sourceStripHeight,
        source.width,
        sourceStripHeight,
        (w - destWidth) / 2 + offsetX,
        destY,
        destWidth,
        // Small overlap hides seams from row rounding.
        stripDestHeight + 0.6,
      );

      destY += stripDestHeight;
    }

    // Moving specular highlight.
    const highlightX = w * (0.1 + (x + 1) * 0.28);
    const intensity = 0.1 + Math.abs(x) * 0.13;
    const gradient = ctx.createLinearGradient(
      highlightX,
      -h * 0.15,
      highlightX + w * 0.85,
      h * 1.15,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.45, `rgba(255, 255, 255, ${intensity.toFixed(3)})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    raf = requestAnimationFrame(frame);
  };

  const stopLoop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  /** Idempotent teardown: safe to call twice, or before `start`. */
  const reset = () => {
    stopLoop();
    canvas = null;
    source = null;
    x = 0;
    y = 0;
    targetX = 0;
    targetY = 0;
    hasPointer = false;
  };

  return {
    start(nextCanvas, nextSource) {
      reset();
      canvas = nextCanvas;
      source = nextSource;
      startTime = performance.now();
      x = targetX = 0;
      y = targetY = 0;
      hasPointer = false;
      running = true;
      raf = requestAnimationFrame(frame);
    },

    stop: reset,

    setPointer(px, py) {
      if (!canvas) return;
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      targetX = clamp((px / width) * 2 - 1, -1, 1);
      targetY = clamp((py / height) * 2 - 1, -1, 1);
      hasPointer = true;
    },
  };
}
