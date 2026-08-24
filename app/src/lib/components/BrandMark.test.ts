import { describe, expect, it } from 'vitest';
import src from './BrandMark.svelte?raw';
import layout from '../../routes/+layout.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('BrandMark.svelte has no style block');
	return match[1];
}

describe('BrandMark', () => {
	const css = styleBlock(src);

	it('splits 한 into three independent jamo SVGs', () => {
		expect(src).toMatch(/class="mark" lang="ko"/);
		expect(src).toMatch(/class="vh">한</);
		expect(src.match(/<svg class="jamo /g)?.length).toBe(3);
		expect(src).toMatch(/jamo-h/);
		expect(src).toMatch(/jamo-a/);
		expect(src).toMatch(/jamo-n/);
		expect(src).toMatch(/aria-hidden="true"/);
		expect(src).not.toMatch(/aria-label="Korean 한"/);
	});

	it('wiggles each jamo on brand hover with a reduced-motion fallback', () => {
		expect(css).toMatch(/@keyframes -global-han-wiggle-h/);
		expect(css).toMatch(/@keyframes -global-han-wiggle-a/);
		expect(css).toMatch(/@keyframes -global-han-wiggle-n/);
		expect(css).toMatch(/:global\(a\.brand:hover\) \.jamo-h/);
		expect(css).toMatch(/han-wiggle-a 640ms var\(--ease-in-out\) 80ms infinite/);
		expect(css).toMatch(/han-wiggle-n 640ms var\(--ease-in-out\) 160ms infinite/);
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
		expect(css).toMatch(/animation:\s*none/);
		expect(css).toMatch(/color:\s*var\(--ink\)/);
		expect(css).toMatch(/@media \(forced-colors: active\)/);
	});
});

describe('layout BrandMark entry', () => {
	it('mounts BrandMark beside the English name', () => {
		expect(layout).toMatch(/BrandMark/);
		expect(layout).toMatch(/class="name">Korean/);
		expect(layout).toMatch(/class=\{\['brand', \{ wiggling: brandHot \}\]\}/);
		expect(layout).toMatch(/onpointerenter/);
		expect(layout).toMatch(/han-wiggle-h/);
		expect(layout).not.toMatch(/class="mark" lang="ko">한/);
	});
});
