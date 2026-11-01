import React, { useMemo } from "react";
import type { WasmRenderResult } from "../utils/renderWasm.ts";
import type { OfficialRenderResult } from "../utils/renderOfficial.ts";
import { type ScaleMode, type CanvasBgSettings, getCanvasBgStyle } from "./CanvasToolbar.tsx";
import { ZoomControl } from "./ZoomControl.tsx";
import { getSvgDimensions, type SvgDimensions } from "../utils/svgUtils.ts";

interface ViewerSideBySideProps {
  wasmResult: WasmRenderResult | null;
  officialResult: OfficialRenderResult | null;
  mode: "side-by-side" | "wasm-only" | "official-only";
  scaleMode: ScaleMode;
  wasmZoom: number;
  onChangeWasmZoom: (zoom: number) => void;
  officialZoom: number;
  onChangeOfficialZoom: (zoom: number) => void;
  bgSettings: CanvasBgSettings;
}

function getDiagramContainerStyle(
  scaleMode: ScaleMode,
  zoom: number,
  dims: SvgDimensions | null
): React.CSSProperties {
  const factor = zoom / 100;
  if (scaleMode === "fit") {
    // In fit mode: 100% fits container width & height.
    // Zoom expands or contracts relative to that container.
    return {
      width: `${100 * factor}%`,
      height: `${100 * factor}%`,
      maxWidth: factor <= 1 ? "100%" : "none",
      maxHeight: factor <= 1 ? "100%" : "none",
    };
  } else {
    // Original 1:1 mode: use actual SVG dimensions if available
    if (dims) {
      return {
        width: `${Math.round(dims.width * factor)}px`,
        height: `${Math.round(dims.height * factor)}px`,
        minWidth: `${Math.round(dims.width * factor)}px`,
        minHeight: `${Math.round(dims.height * factor)}px`,
      };
    }
    // Fallback if dimensions not parsed
    return {
      transform: `scale(${factor})`,
      transformOrigin: "center center",
    };
  }
}

export const ViewerSideBySide: React.FC<ViewerSideBySideProps> = ({
  wasmResult,
  officialResult,
  mode,
  scaleMode,
  wasmZoom,
  onChangeWasmZoom,
  officialZoom,
  onChangeOfficialZoom,
  bgSettings,
}) => {
  // Extract SVG dimensions
  const wasmDimensions = useMemo(() => {
    if (typeof wasmResult?.data === "string") {
      return getSvgDimensions(wasmResult.data);
    }
    return null;
  }, [wasmResult]);

  const officialDimensions = useMemo(() => {
    if (officialResult?.svg) {
      return getSvgDimensions(officialResult.svg);
    }
    return null;
  }, [officialResult]);

  // Create object URL for wasm binary raster formats (PNG, WebP)
  const wasmImageUrl = useMemo(() => {
    if (!wasmResult?.data) return null;
    if (typeof wasmResult.data === "string") return null;
    const blob = new Blob([wasmResult.data as BlobPart], {
      type: wasmResult.format === "png" ? "image/png" : "image/webp",
    });
    return URL.createObjectURL(blob);
  }, [wasmResult]);

  const handleDownloadWasm = () => {
    if (!wasmResult?.data) return;
    const a = document.createElement("a");
    if (typeof wasmResult.data === "string") {
      const blob = new Blob([wasmResult.data], { type: "image/svg+xml" });
      a.href = URL.createObjectURL(blob);
      a.download = "mermaid-wasm.svg";
    } else if (wasmImageUrl) {
      a.href = wasmImageUrl;
      a.download = `mermaid-wasm.${wasmResult.format}`;
    }
    a.click();
  };

  const handleDownloadOfficial = () => {
    if (!officialResult?.svg) return;
    const blob = new Blob([officialResult.svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mermaid-official.svg";
    a.click();
  };

  const bgStyle = getCanvasBgStyle(bgSettings);

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/80 min-h-0 overflow-hidden">
      {/* WASM Column */}
      {(mode === "side-by-side" || mode === "wasm-only") && (
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            mode === "wasm-only" ? "col-span-2" : ""
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-xs shrink-0 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://www.npmjs.com/package/wasm-html-to-image"
                target="_blank"
                rel="noopener noreferrer"
                title="View wasm-html-to-image on npm"
                className="font-semibold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
              >
                wasm-html-to-image
                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {wasmResult && (
                <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                  {wasmResult.format.toUpperCase()}
                </span>
              )}
              {wasmDimensions && (
                <span
                  title="Rendered SVG Dimensions"
                  className="hidden sm:inline-block text-[10px] text-slate-400 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800"
                >
                  {wasmDimensions.width}×{wasmDimensions.height}
                </span>
              )}
            </div>

            {/* Zoom Control & Download */}
            <div className="flex items-center gap-2 shrink-0">
              <ZoomControl
                zoom={wasmZoom}
                onChangeZoom={onChangeWasmZoom}
              />
              {wasmResult?.data && !wasmResult.error && (
                <button
                  type="button"
                  onClick={handleDownloadWasm}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Download
                </button>
              )}
            </div>
          </div>

          {/* Canvas Scroll Area */}
          <div
            className="flex-1 overflow-auto min-h-0 transition-colors duration-200"
            style={bgStyle.style}
          >
            <div className="min-w-full min-h-full p-4 flex">
              {wasmResult?.error ? (
                <div className="m-auto p-4 bg-red-950/90 border border-red-700/80 rounded-lg text-red-200 text-xs font-mono max-w-md shadow-xl">
                  <div className="flex items-center gap-2 mb-1 text-red-400 font-semibold">
                    <span>WASM Render Error:</span>
                  </div>
                  <p className="break-words leading-relaxed text-[11px]">{wasmResult.error}</p>
                </div>
              ) : typeof wasmResult?.data === "string" ? (
                <div
                  className="m-auto flex items-center justify-center transition-all [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                  style={getDiagramContainerStyle(scaleMode, wasmZoom, wasmDimensions)}
                  dangerouslySetInnerHTML={{ __html: wasmResult.data }}
                />
              ) : wasmImageUrl ? (
                <div
                  className="m-auto flex items-center justify-center transition-all"
                  style={getDiagramContainerStyle(scaleMode, wasmZoom, null)}
                >
                  <img
                    src={wasmImageUrl}
                    alt="WASM Rendered Diagram"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <span className="m-auto text-xs text-slate-500">No output yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Column */}
      {(mode === "side-by-side" || mode === "official-only") && (
        <div
          className={`flex flex-col min-h-0 overflow-hidden ${
            mode === "official-only" ? "col-span-2" : ""
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700 text-xs shrink-0 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://www.npmjs.com/package/mermaid"
                target="_blank"
                rel="noopener noreferrer"
                title="View official mermaid on npm"
                className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                Official Mermaid
                <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                SVG
              </span>
              {officialDimensions && (
                <span
                  title="Rendered SVG Dimensions"
                  className="hidden sm:inline-block text-[10px] text-slate-400 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800"
                >
                  {officialDimensions.width}×{officialDimensions.height}
                </span>
              )}
            </div>

            {/* Zoom Control & Download */}
            <div className="flex items-center gap-2 shrink-0">
              <ZoomControl
                zoom={officialZoom}
                onChangeZoom={onChangeOfficialZoom}
              />
              {officialResult?.svg && !officialResult.error && (
                <button
                  type="button"
                  onClick={handleDownloadOfficial}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Download
                </button>
              )}
            </div>
          </div>

          {/* Canvas Scroll Area */}
          <div
            className="flex-1 overflow-auto min-h-0 transition-colors duration-200"
            style={bgStyle.style}
          >
            <div className="min-w-full min-h-full p-4 flex">
              {officialResult?.error ? (
                <div className="m-auto p-4 bg-red-950/90 border border-red-700/80 rounded-lg text-red-200 text-xs font-mono max-w-md shadow-xl">
                  <div className="flex items-center gap-2 mb-1 text-red-400 font-semibold">
                    <span>Official Mermaid Error:</span>
                  </div>
                  <p className="break-words leading-relaxed text-[11px]">{officialResult.error}</p>
                </div>
              ) : officialResult?.svg ? (
                <div
                  className="m-auto flex items-center justify-center transition-all [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                  style={getDiagramContainerStyle(scaleMode, officialZoom, officialDimensions)}
                  dangerouslySetInnerHTML={{ __html: officialResult.svg }}
                />
              ) : (
                <span className="m-auto text-xs text-slate-500">No output yet</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
