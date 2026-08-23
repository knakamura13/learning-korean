import { describe, expect, it } from 'vitest';
import { IMMUTABLE_CACHE_CONTROL, isImmutableStaticAsset } from './assetCache';

describe('isImmutableStaticAsset', () => {
	it('matches self-hosted look fonts, including a query string', () => {
		expect(isImmutableStaticAsset('/fonts/NotoSansKR-subset.woff2')).toBe(true);
		expect(isImmutableStaticAsset('/fonts/Newsreader-Italic-latin.woff2?v=1')).toBe(true);
		expect(isImmutableStaticAsset('/fonts/Newsreader-Italic-latin.WOFF2')).toBe(true);
	});

	it('leaves HTML, manifests, and other static files to revalidate', () => {
		expect(isImmutableStaticAsset('/fonts/OFL.txt')).toBe(false);
		expect(isImmutableStaticAsset('/favicon.svg')).toBe(false);
		expect(isImmutableStaticAsset('/manifest.webmanifest')).toBe(false);
		expect(isImmutableStaticAsset('/_app/immutable/chunks/x.js')).toBe(false);
		expect(isImmutableStaticAsset('/api/me')).toBe(false);
	});

	it('uses the same Cache-Control token adapter-node stamps on hashed app assets', () => {
		expect(IMMUTABLE_CACHE_CONTROL).toBe('public,max-age=31536000,immutable');
	});
});
