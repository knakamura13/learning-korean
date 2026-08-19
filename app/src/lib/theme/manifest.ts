import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { activeSystem } from './active.ts';
import type { DesignSystem } from './types.ts';

const ICONS = [
	{
		src: 'favicon.svg',
		type: 'image/svg+xml',
		sizes: 'any',
		purpose: 'any'
	},
	{
		src: 'icon-192.png',
		type: 'image/png',
		sizes: '192x192',
		purpose: 'any'
	},
	{
		src: 'apple-touch-icon.png',
		type: 'image/png',
		sizes: '180x180',
		purpose: 'any'
	},
	{
		src: 'icon-maskable.png',
		type: 'image/png',
		sizes: '512x512',
		purpose: 'maskable'
	}
] as const;

export function webManifest(system: DesignSystem, scheme: 'light' | 'dark'): string {
	let paper: string;
	switch (scheme) {
		case 'light':
			paper = system.light.paper;
			break;
		case 'dark':
			paper = system.dark.paper;
			break;
		default: {
			const _exhaustive: never = scheme;
			return _exhaustive;
		}
	}
	return `${JSON.stringify(
		{
			name: 'Korean — labs and review',
			short_name: 'Korean',
			description: 'Interactive labs and spaced repetition for reading Korean.',
			start_url: './',
			scope: './',
			display: 'standalone',
			background_color: paper,
			theme_color: paper,
			icons: ICONS
		},
		null,
		'\t'
	)}\n`;
}

export function writeManifests(dir = new URL('../../../static/', import.meta.url)): void {
	writeIfChanged(new URL('manifest.webmanifest', dir), webManifest(activeSystem, 'light'));
	writeIfChanged(new URL('manifest-dark.webmanifest', dir), webManifest(activeSystem, 'dark'));
}

function writeIfChanged(url: URL, contents: string): void {
	if (existsSync(url) && readFileSync(url, 'utf8') === contents) return;
	writeFileSync(url, contents);
}
