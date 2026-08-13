import { describe, expect, it } from 'vitest';
import { hasHangul, splitKo, withLangKo } from './lang';

describe('hasHangul', () => {
	it('detects syllables and jamo', () => {
		expect(hasHangul('한글')).toBe(true);
		expect(hasHangul('ㄱ')).toBe(true);
		expect(hasHangul('abc')).toBe(false);
	});
});

describe('splitKo', () => {
	it('splits mixed English and Hangul', () => {
		expect(splitKo('velar · 아음')).toEqual([
			{ text: 'velar · ', ko: false },
			{ text: '아음', ko: true }
		]);
	});
});

describe('withLangKo', () => {
	it('wraps Hangul runs in lang=ko', () => {
		expect(withLangKo('<p>Say ㄱ slowly</p>')).toBe(
			'<p>Say <span lang="ko">ㄱ</span> slowly</p>'
		);
	});

	it('does not wrap Hangul already inside lang=ko', () => {
		expect(withLangKo('<span lang="ko">한글</span>')).toBe('<span lang="ko">한글</span>');
	});

	it('does not wrap Hangul in attributes', () => {
		expect(withLangKo('<span title="한글">x</span>')).toBe('<span title="한글">x</span>');
	});
});
