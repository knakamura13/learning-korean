import { describe, expect, it } from 'vitest';
import {
	absoluteAssetUrl,
	absolutePageUrl,
	normalizeSiteUrl,
	pageShareTitle,
	OG_IMAGE_ALT,
	SITE_DESCRIPTION
} from './site';

describe('normalizeSiteUrl', () => {
	it('trims and drops trailing slashes', () => {
		expect(normalizeSiteUrl(' https://example.test/app/ ')).toBe('https://example.test/app');
		expect(normalizeSiteUrl('')).toBe('');
		expect(normalizeSiteUrl(undefined)).toBe('');
	});

	it('adds https when the value is a host without a scheme', () => {
		expect(normalizeSiteUrl('learning-korean-production.up.railway.app')).toBe(
			'https://learning-korean-production.up.railway.app'
		);
		expect(normalizeSiteUrl('example.test/app/')).toBe('https://example.test/app');
	});

	it('keeps an explicit http origin', () => {
		expect(normalizeSiteUrl('http://localhost:3000/')).toBe('http://localhost:3000');
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

describe('sharing copy', () => {
	it('names the OG image instead of leaving alt empty', () => {
		expect(SITE_DESCRIPTION).toMatch(/labs and spaced repetition/i);
		expect(OG_IMAGE_ALT).toMatch(/한/);
		expect(OG_IMAGE_ALT).toMatch(/Korean — labs and review/);
	});
});

describe('pageShareTitle', () => {
	it('matches the per-page document title, not a site-wide default', () => {
		expect(pageShareTitle('/')).toBe('Korean — labs and review');
		expect(pageShareTitle('/review')).toBe('Daily review');
		expect(pageShareTitle('/drill')).toBe('Drill');
		expect(pageShareTitle('/settings')).toBe('Settings');
		expect(pageShareTitle('/reference')).toBe('Reference — every letter and rule');
		expect(pageShareTitle('/lab/0001', { number: 1, title: 'Find the Letters in Your Mouth' })).toBe(
			'Lab 1 — Find the Letters in Your Mouth'
		);
		expect(pageShareTitle('/lab/0001')).toBe('Lab');
	});
});
