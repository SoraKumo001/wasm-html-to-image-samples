import mermaid from "mermaid";
import { normalizeSvg } from "./svgUtils.ts";

export interface OfficialRenderResult {
  svg: string;
  durationMs: number;
  error?: string;
}

let mermaidCounter = 0;

export async function renderOfficial(
  source: string,
  theme: string = "default"
): Promise<OfficialRenderResult> {
  const startTime = performance.now();
  const renderId = `mermaid-official-${++mermaidCounter}`;

  // Map theme name to official mermaid theme
  let officialTheme: "default" | "dark" | "forest" | "neutral" | "base" = "default";
  if (theme === "dark" || theme === "dracula" || theme === "solarized-dark" || theme === "rose-pine") {
    officialTheme = "dark";
  } else if (theme === "forest") {
    officialTheme = "forest";
  } else if (theme === "neutral" || theme === "sepia") {
    officialTheme = "neutral";
  } else {
    officialTheme = "default";
  }

  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: officialTheme,
      securityLevel: "loose",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });

    const { svg } = await mermaid.render(renderId, source);
    const durationMs = performance.now() - startTime;
    return {
      svg: normalizeSvg(svg),
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = performance.now() - startTime;
    // Mermaid creates an error element in the DOM on failure, remove it if present
    const el = document.getElementById(renderId);
    if (el) el.remove();
    const dEl = document.getElementById(`d${renderId}`);
    if (dEl) dEl.remove();

    return {
      svg: "",
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
