import { describe, expect, it } from 'vitest';
import { absoluteAssetUrl, absolutePageUrl, normalizeSiteUrl } from './site';

describe('normalizeSiteUrl', () => {
	it('trims and drops trailing slashes', () => {
		expect(normalizeSiteUrl(' https://example.test/app/ ')).toBe('https://example.test/app');
		expect(normalizeSiteUrl('')).toBe('');
		expect(normalizeSiteUrl(undefined)).toBe('');
	});
});

describe('absolutePageUrl', () => {
	it('returns undefined without a configured origin', () => {
		expect(absolutePageUrl('', '/review')).toBeUndefined();
	});

	it('joins pathname and strips kit.paths.base', () => {
		expect(absolutePageUrl('https://example.test/app', '/app', '/app')).toBe(
			'https://example.test/app/'
		);
		expect(absolutePageUrl('https://example.test/app', '/app/review', '/app')).toBe(
			'https://example.test/app/review'
		);
	});
});

describe('absoluteAssetUrl', () => {
	it('prefixes a root-relative asset', () => {
		expect(absoluteAssetUrl('https://example.test/app', '/og.png')).toBe(
			'https://example.test/app/og.png'
		);
	});
});
