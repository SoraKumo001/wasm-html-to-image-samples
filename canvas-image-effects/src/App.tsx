import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { renderImage } from "./renderImage";
import { createSpotlightEffect } from "./effects/spotlight";
import { createTiltEffect } from "./effects/tilt";
import type { EffectHandle, EffectSource } from "./effects/types";

type EffectKind = "tilt" | "spotlight";

const EFFECT_FACTORIES: Record<EffectKind, () => EffectHandle> = {
  tilt: createTiltEffect,
  spotlight: createSpotlightEffect,
};

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

type RenderMeta = {
  width: number;
  height: number;
  bytes: number;
  durationMs: number;
};

/** Chrome's drawable-canvas additions are not in the DOM lib yet. */
type DrawableCanvas = HTMLCanvasElement & {
  content?: string;
  requestPaint?: () => void;
};

type DrawableContext = CanvasRenderingContext2D & {
  drawElementImage?: (
    element: Element,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number,
  ) => void;
};

/**
 * Live DOM painting is available only when the browser reflects the
 * `content="drawable"` attribute and exposes `drawElementImage()` on a 2D
 * context. Both are required: the attribute alone does not paint anything.
 */
function detectLiveCanvasSupport(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as DrawableCanvas;
  probe.setAttribute("content", "drawable");
  if (probe.content !== "drawable") return false;
  const ctx = probe.getContext("2d") as DrawableContext | null;
  return typeof ctx?.drawElementImage === "function";
}

type LiveDocument = {
  /** Inline `<style>` text carried over from the document head. */
  css: string;
  /** `body.innerHTML`, mounted inside the drawable subtree. */
  body: string;
};

/**
 * Split the user's full HTML document into the parts that can live inside a
 * drawable subtree. Scripts are intentionally not executed; inline styles and
 * markup are enough for the card previews in this sample.
 */
function parseLiveDocument(value: string): LiveDocument {
  const doc = new DOMParser().parseFromString(value, "text/html");
  const css = Array.from(doc.head.querySelectorAll("style"))
    .map((node) => node.textContent ?? "")
    .join("\n");
  return { css, body: doc.body.innerHTML };
}

/** OGP-like 1200×630 card. Inline styles only (no external fonts or assets). */
const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>html,body{margin:0;padding:0}</style>
</head>
<body>
<div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(135deg,#0b1220 0%,#312e81 48%,#0e7490 100%);color:#f8fafc;font-family:sans-serif;">
  <div style="display:flex;align-items:center;gap:18px;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:#a5b4fc;">
    <div style="width:54px;height:54px;border-radius:16px;background:linear-gradient(140deg,#818cf8,#22d3ee);box-shadow:0 12px 32px rgba(34,211,238,0.35);"></div>
    wasm-html-to-image
  </div>
  <div>
    <div style="font-size:28px;color:#c7d2fe;letter-spacing:0.02em;">Canvas effects sample</div>
    <div style="font-size:76px;line-height:1.05;font-weight:700;margin-top:16px;max-width:920px;">Render once.<br/>Animate forever.</div>
    <div style="font-size:28px;line-height:1.4;color:#cbd5e1;margin-top:28px;max-width:820px;">HTML to PNG in a Web Worker, then tilt and spotlight it on a plain 2D canvas.</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#94a3b8;">
    <span>pnpm --filter canvas-image-effects dev</span>
    <span style="padding:10px 22px;border:1px solid rgba(255,255,255,0.25);border-radius:999px;color:#e2e8f0;">1200 × 630</span>
  </div>
</div>
</body>
</html>`;

export function App() {
  // Auto mode: live DOM where the browser supports it, PNG snapshot otherwise.
  const [liveSupported] = useState(detectLiveCanvasSupport);

  const [html, setHtml] = useState(DEFAULT_HTML);
  /** HTML applied to the live drawable subtree (live mode only). */
  const [liveHtml, setLiveHtml] = useState(DEFAULT_HTML);
  const [effectKind, setEffectKind] = useState<EffectKind>("tilt");
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<RenderMeta | null>(null);
  /** Incremented when the effect source changes; drives the effect restart. */
  const [sourceVersion, setSourceVersion] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const liveCanvasRef = useRef<DrawableCanvas | null>(null);
  const liveNodeRef = useRef<HTMLDivElement | null>(null);
  const effectRef = useRef<EffectHandle | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const renderSeq = useRef(0);
  const aliveRef = useRef(true);
  const didInit = useRef(false);

  const liveDocument = useMemo(() => parseLiveDocument(liveHtml), [liveHtml]);

  const handleRender = useCallback(async () => {
    setError(null);

    if (liveSupported) {
      // Live mode: update the drawable subtree and restart the effect so
      // spotlight rebuilds its blurred base. No WASM round-trip is needed.
      setLiveHtml(html);
      setSourceVersion((version) => version + 1);
      return;
    }

    const seq = ++renderSeq.current;
    setRendering(true);

    try {
      const result = await renderImage({
        value: html,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        scale: 2,
      });

      if (seq !== renderSeq.current || !aliveRef.current) {
        result.bitmap.close();
        return;
      }

      // Publish the new bitmap, then bump the version. The effect lifecycle
      // hook below stops the previous loop before starting the selected effect
      // on the new bitmap, so rendering never leaves the canvas static.
      bitmapRef.current = result.bitmap;

      setMeta({
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        durationMs: result.durationMs,
      });

      setSourceVersion((version) => version + 1);
    } catch (cause) {
      console.error("[canvas-image-effects] render failed", cause);
      if (seq === renderSeq.current) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      if (seq === renderSeq.current && aliveRef.current) setRendering(false);
    }
  }, [html, liveSupported]);

  // Snapshot fallback: rasterize the default card once on load. Live mode
  // starts from the mounted drawable subtree instead.
  useEffect(() => {
    if (didInit.current || liveSupported) return;
    didInit.current = true;
    void handleRender();
  }, [handleRender, liveSupported]);

  // (Re)create the selected effect whenever the effect kind or the effect
  // source changes. React runs the previous cleanup — which stops that loop —
  // before this body, so exactly one rAF loop exists at a time, including
  // under StrictMode's double-invoked effects.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let source: EffectSource;
    let bitmap: ImageBitmap | null = null;

    if (liveSupported) {
      const liveCanvas = liveCanvasRef.current;
      const liveNode = liveNodeRef.current;
      if (!liveCanvas || !liveNode) return;

      const ctx = liveCanvas.getContext("2d") as DrawableContext | null;
      if (!ctx || typeof ctx.drawElementImage !== "function") return;

      const draw = ctx.drawElementImage;
      source = {
        image: liveCanvas,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        // Repaint the hidden drawable canvas from the live DOM once per frame.
        refresh: () => {
          try {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
            draw.call(ctx, liveNode, 0, 0, liveCanvas.width, liveCanvas.height);
          } catch {
            // Keep the last successfully painted frame rather than ending the
            // animation loop; support is feature-detected before this point.
          }
        },
      };
    } else {
      bitmap = bitmapRef.current;
      // No bitmap yet: normal before the first snapshot render resolves.
      if (!bitmap) return;
      // A closed ImageBitmap reports zero dimensions; starting a loop on one
      // would animate forever without drawing, so bail with a visible reason.
      if (bitmap.width === 0 || bitmap.height === 0) {
        console.error(
          "[canvas-image-effects] closed bitmap handed to the effect",
          bitmap,
        );
        return;
      }
      source = { image: bitmap, width: bitmap.width, height: bitmap.height };
    }

    const handle = EFFECT_FACTORIES[effectKind]();
    effectRef.current = handle;
    let started = false;
    try {
      handle.start(canvas, source);
      started = true;
    } catch (cause) {
      // A failed start must not leave a half-attached handle around: clear it
      // so the next render/effect change can retry cleanly. Firefox only
      // reports these as unhandled draw errors, so log explicitly.
      console.error("[canvas-image-effects] effect start failed", cause);
      handle.stop();
      if (effectRef.current === handle) effectRef.current = null;
    }

    if (started) {
      // Carry the last pointer position over to the fresh handle, so a
      // re-render does not snap the effect back to its neutral/idle pose.
      const pointer = pointerRef.current;
      if (pointer) handle.setPointer(pointer.x, pointer.y);
    }

    return () => {
      // stop() is idempotent, so teardown is safe even after a failed start.
      handle.stop();
      if (effectRef.current === handle) effectRef.current = null;

      // A successful render superseded this bitmap. Close it only now, after
      // its loop has been stopped, so no frame can draw a closed bitmap.
      if (bitmap && bitmapRef.current !== bitmap) bitmap.close();
    };
  }, [effectKind, sourceVersion, liveSupported]);

  // Stop the loop and free the decoded bitmap on unmount. Note: StrictMode
  // runs this cleanup once during its mount simulation, so the body must
  // re-arm `aliveRef` on the follow-up effect run.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      effectRef.current?.stop();
      effectRef.current = null;
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, []);

  const handleEffectChange = (kind: EffectKind) => {
    // The lifecycle effect restarts the loop on the current source.
    setEffectKind(kind);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointerRef.current = { x, y };
    effectRef.current?.setPointer(x, y);
  };

  const handlePointerLeave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Return to the neutral pose instead of freezing at the edge.
    const x = canvas.clientWidth / 2;
    const y = canvas.clientHeight / 2;
    pointerRef.current = { x, y };
    effectRef.current?.setPointer(x, y);
  };

  const sourceLabel = liveSupported ? "LIVE DOM" : "PNG snapshot";

  const status = liveSupported
    ? `LIVE DOM · ${CARD_WIDTH}×${CARD_HEIGHT} · drawElementImage() per frame`
    : rendering
      ? "Rendering HTML → PNG in a worker…"
      : meta
        ? `PNG snapshot · ${meta.width}×${meta.height} · ${(meta.bytes / 1024).toFixed(0)} KB · ${meta.durationMs.toFixed(0)} ms`
        : "Ready — click Render to rasterize the HTML.";

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">wasm-html-to-image sample</p>
        <h1>canvas-image-effects</h1>
        <p className="lede">
          The same HTML card drives a parallax tilt and a lens spotlight on a
          plain 2D canvas. When Chrome exposes{" "}
          <code>content=&quot;drawable&quot;</code> the canvas repaints the live
          DOM every frame; otherwise it falls back to a PNG rendered by{" "}
          <code>wasm-html-to-image/workers</code>.
        </p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>HTML input</h2>
          <span className={`source-badge ${liveSupported ? "live" : "snapshot"}`}>
            {sourceLabel}
          </span>
          <span className="hint">1200 × 630 · scale 2</span>
        </div>

        <textarea
          className="editor"
          value={html}
          spellCheck={false}
          onChange={(event) => setHtml(event.target.value)}
          aria-label="HTML input"
        />

        <div className="toolbar">
          <button
            type="button"
            className="primary"
            onClick={() => void handleRender()}
            disabled={rendering}
          >
            {rendering ? "Rendering…" : "Render"}
          </button>

          <label className="field">
            Effect
            <select
              value={effectKind}
              onChange={(event) =>
                handleEffectChange(event.target.value as EffectKind)
              }
            >
              <option value="tilt">Tilt — 2D parallax</option>
              <option value="spotlight">Spotlight — lens reveal</option>
            </select>
          </label>

          <span className="status" role="status">
            {status}
          </span>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="stage">
        <div className="canvas-frame">
          <canvas
            ref={canvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
        </div>
        <p className="hint">
          Move the pointer over the image. The loop is <code>requestAnimationFrame</code>{" "}
          on a 2D context;{" "}
          {liveSupported
            ? "each frame repaints the live drawable subtree with ctx.drawElementImage(), then slices it for the effect."
            : "the bitmap is drawn from a PNG rasterized once with wasm-html-to-image."}
        </p>
      </section>

      {liveSupported && (
        // Kept in the render tree (opacity: 0, not display: none) so the
        // drawable subtree can be laid out and sampled by drawElementImage.
        <div className="live-source" aria-hidden="true">
          <canvas
            ref={liveCanvasRef}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            {...({ content: "drawable" } as Record<string, string>)}
          >
            <div
              ref={liveNodeRef}
              className="live-source-node"
              {...({ drawable: "" } as Record<string, string>)}
            >
              {liveDocument.css && <style>{liveDocument.css}</style>}
              <div
                className="live-source-body"
                dangerouslySetInnerHTML={{ __html: liveDocument.body }}
              />
            </div>
          </canvas>
        </div>
      )}
    </main>
  );
}
