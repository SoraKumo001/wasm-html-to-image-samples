import type { EffectHandle, EffectSource } from "./types";

const MAX_DPR = 2;
const TAU = Math.PI * 2;
const INTRO_MS = 900;
const SETTLE_MS = 800;
const EASE = 0.12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * `ctx.filter` is not implemented everywhere, and assigning it can be silently
 * ignored. Probe once and remember the answer so the base layer degrades to a
 * sharp copy instead of an unblurred `none`.
 */
let filterSupport: boolean | null = null;

const supportsFilter = (ctx: CanvasRenderingContext2D): boolean => {
  if (filterSupport !== null) return filterSupport;
  try {
    const previous = ctx.filter;
    ctx.filter = "blur(1px)";
    filterSupport = ctx.filter === "blur(1px)";
    ctx.filter = previous;
  } catch {
    filterSupport = false;
  }
  return filterSupport;
};

type Frame = {
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
};

/**
 * 2D lens reveal.
 *
 * A pre-blurred copy of the PNG is the base layer. The sharp image sits on an
 * offscreen layer and is punched out with a radial-gradient `destination-out`
 * fill, leaving a soft-edged hole that follows the pointer. The intro expands
 * the hole from a pinhole to the full frame, then settles to the lens radius.
 */
export function createSpotlightEffect(): EffectHandle {
  let canvas: HTMLCanvasElement | null = null;
  let source: EffectSource | null = null;
  let layer: HTMLCanvasElement | null = null;
  let layerCtx: CanvasRenderingContext2D | null = null;
  let blurred: HTMLCanvasElement | null = null;

  let raf = 0;
  let running = false;
  let startTime = 0;

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let pointerReady = false;
  let hasTarget = false;

  const makeBlurredCopy = (current: EffectSource) => {
    const copy = document.createElement("canvas");
    copy.width = current.width;
    copy.height = current.height;
    const ctx = copy.getContext("2d");
    if (!ctx) return copy;

    const blur = `blur(${Math.max(6, Math.round(current.width * 0.008))}px)`;
    if (supportsFilter(ctx)) {
      try {
        // Blur in bitmap space, so the softness is resolution-independent.
        ctx.filter = blur;
        ctx.drawImage(current.image, 0, 0);
        ctx.filter = "none";
        return copy;
      } catch (error) {
        ctx.filter = "none";
        console.error(
          "[spotlight] canvas filter failed; using an unblurred base",
          error,
        );
      }
    }

    // No usable `ctx.filter`: fall back to a sharp base rather than failing.
    ctx.drawImage(current.image, 0, 0);
    return copy;
  };

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

    if (layer && (layer.width !== width || layer.height !== height)) {
      layer.width = width;
      layer.height = height;
    }

    return { ctx, cssWidth, cssHeight, dpr };
  };

  const drawFrame = (now: number) => {
    // Live mode: repaint the drawable canvas from the DOM before reading it.
    source?.refresh?.();
    const view = syncCanvas();

    if (
      !view ||
      !source ||
      source.width === 0 ||
      source.height === 0 ||
      !layer ||
      !layerCtx ||
      !blurred
    ) {
      // Missing pixels or resources: skip this frame. The loop keeps running so
      // a later start() simply swaps in the new bitmap.
      return;
    }

    const { ctx, cssWidth: w, cssHeight: h, dpr } = view;
    // Firefox can hand a rAF callback a timestamp older than the
    // performance.now() captured in start(). A negative elapsed time used to
    // produce a negative gradient radius, which throws and kills the loop.
    const elapsed = Math.max(0, now - startTime);

    if (!pointerReady) {
      if (hasTarget) {
        // Seeded from a previous handle: start where the pointer already was
        // instead of jumping to the centre.
        pointer.x = target.x;
        pointer.y = target.y;
      } else {
        pointer.x = w / 2;
        pointer.y = h / 2;
        target.x = pointer.x;
        target.y = pointer.y;
      }
      pointerReady = true;
    }
    if (hasTarget) {
      pointer.x = lerp(pointer.x, target.x, EASE);
      pointer.y = lerp(pointer.y, target.y, EASE);
    }

    const cx = clamp(pointer.x, 0, w);
    const cy = clamp(pointer.y, 0, h);

    const maxRadius = Math.hypot(w, h) * 0.55;
    const lensRadius = Math.min(w, h) * 0.3;
    const startRadius = Math.min(w, h) * 0.03;

    let radius: number;
    if (elapsed < INTRO_MS) {
      radius = lerp(startRadius, maxRadius, easeOutCubic(elapsed / INTRO_MS));
    } else if (elapsed < INTRO_MS + SETTLE_MS) {
      const t = (elapsed - INTRO_MS) / SETTLE_MS;
      radius = lerp(maxRadius, lensRadius, easeInOutCubic(t));
    } else {
      radius = lensRadius;
    }
    // Radial gradients reject a negative radius (Firefox throws, Chrome
    // clamps), so never let time or easing push it below zero.
    radius = Math.max(0, radius);

    // 1. Blurred base.
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(blurred, 0, 0, w, h);
    ctx.fillStyle = "rgba(2, 6, 23, 0.28)";
    ctx.fillRect(0, 0, w, h);

    // 2. Sharp image through a soft radial hole (destination-out on the layer).
    layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layerCtx.clearRect(0, 0, w, h);
    layerCtx.drawImage(source.image, 0, 0, w, h);

    layerCtx.globalCompositeOperation = "destination-out";
    const hole = layerCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    hole.addColorStop(0, "rgba(0, 0, 0, 0)");
    hole.addColorStop(0.62, "rgba(0, 0, 0, 0.12)");
    hole.addColorStop(1, "rgba(0, 0, 0, 1)");
    layerCtx.fillStyle = hole;
    layerCtx.fillRect(0, 0, w, h);
    layerCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(layer, 0, 0, w, h);

    // 3. Lens rim + inner glow.
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.stroke();

    const glow = ctx.createRadialGradient(
      cx,
      cy,
      radius * 0.86,
      cx,
      cy,
      radius * 1.15,
    );
    glow.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  /**
   * Loop wrapper. A throw inside a frame must not end the loop: Firefox drops
   * the rejected rAF callback, so the canvas would stay frozen until the
   * effect is re-created (which is what re-selecting the effect did).
   */
  const frame = (now: number) => {
    if (!running) return;
    try {
      drawFrame(now);
    } catch (error) {
      console.error("[spotlight] frame failed", error);
    }
    if (running) raf = requestAnimationFrame(frame);
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
    layer = null;
    layerCtx = null;
    blurred = null;
    pointer.x = 0;
    pointer.y = 0;
    target.x = 0;
    target.y = 0;
    pointerReady = false;
    hasTarget = false;
  };

  return {
    start(nextCanvas, nextSource) {
      reset();
      canvas = nextCanvas;
      source = nextSource;

      // Live mode must paint once before the blurred copy is sampled.
      nextSource.refresh?.();

      layer = document.createElement("canvas");
      layer.width = canvas.width;
      layer.height = canvas.height;
      layerCtx = layer.getContext("2d");
      blurred = makeBlurredCopy(nextSource);

      startTime = performance.now();
      pointerReady = false;
      hasTarget = false;
      running = true;

      raf = requestAnimationFrame(frame);
    },

    stop: reset,

    setPointer(px, py) {
      target.x = px;
      target.y = py;
      hasTarget = true;
    },
  };
}
