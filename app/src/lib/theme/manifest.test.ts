import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { activeSystem } from './active';
import { webManifest } from './manifest';

describe('webManifest', () => {
	it('uses the design system paper colour for PWA chrome', () => {
		const light = JSON.parse(webManifest(activeSystem, 'light')) as {
			theme_color: string;
			background_color: string;
		};
		const dark = JSON.parse(webManifest(activeSystem, 'dark')) as {
			theme_color: string;
			background_color: string;
		};
		expect(light.theme_color).toBe(activeSystem.light.paper);
		expect(light.background_color).toBe(activeSystem.light.paper);
		expect(dark.theme_color).toBe(activeSystem.dark.paper);
		expect(dark.background_color).toBe(activeSystem.dark.paper);
	});

	it('matches the committed static manifests so they cannot drift', () => {
		const lightFile = readFileSync(new URL('../../../static/manifest.webmanifest', import.meta.url), 'utf8');
		const darkFile = readFileSync(
			new URL('../../../static/manifest-dark.webmanifest', import.meta.url),
			'utf8'
		);
		expect(JSON.parse(lightFile)).toEqual(JSON.parse(webManifest(activeSystem, 'light')));
		expect(JSON.parse(darkFile)).toEqual(JSON.parse(webManifest(activeSystem, 'dark')));
	});
});
