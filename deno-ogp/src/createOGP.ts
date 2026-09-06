// deno-lint-ignore-file no-unversioned-import no-import-prefix
import { toHtml } from "npm:wasm-html-to-image/react";
import { render } from "npm:wasm-html-to-image";
import type { JSX } from "npm:react/jsx-runtime";

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const createOGP = async (
  element: JSX.Element,
  {
    width,
    height,
    scale = 1,
  }: {
    cache?: Cache;
    fonts?: (string | [string, Weight])[];
    emojis?: {
      url: string;
      upper?: boolean;
    }[];
    width: number;
    height?: number;
    scale?: number;
  },
) => {
  const html = toHtml(element as any);
  const targetWidth = Math.round(width * scale);
  const targetHeight = height ? Math.round(height * scale) : undefined;

  const { data } = await render({
    value: html,
    width: targetWidth,
    height: targetHeight,
    format: "png",
  });

  return data;
};
