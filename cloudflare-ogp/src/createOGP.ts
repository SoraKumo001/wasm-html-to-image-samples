import type { JSX } from 'react';
import { toHtml } from 'wasm-html-to-image/react';
import { render } from 'wasm-html-to-image/workerd';

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const createOGP = async (
	element: JSX.Element,
	{
		width,
		height,
		scale = 1,
	}: {
		ctx?: ExecutionContext;
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
	const html = toHtml(element);
	const targetWidth = Math.round(width * scale);
	const targetHeight = height ? Math.round(height * scale) : undefined;

	const { data } = await render({
		value: html,
		width: targetWidth,
		height: targetHeight,
		format: 'png',
	});

	return data as Uint8Array;
};
