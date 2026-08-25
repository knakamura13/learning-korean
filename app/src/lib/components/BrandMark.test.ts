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

	it('renders one Noto-split 한 SVG with three jamo groups', () => {
		expect(src).toMatch(/class="mark" lang="ko"/);
		expect(src).toMatch(/class="vh">한</);
		expect(src.match(/<svg[\s>]/g)?.length).toBe(1);
		expect(src).toMatch(/jamo-h/);
		expect(src).toMatch(/jamo-a/);
		expect(src).toMatch(/jamo-n/);
		expect(src).toMatch(/aria-hidden="true"/);
		expect(src).toMatch(/fill="currentColor"/);
		expect(src).toMatch(/jamo-h[\s\S]*fill-rule="evenodd"/);
		expect(src).not.toMatch(
			/fill-rule="evenodd"[\s\S]*264\.20 0\.00H368\.88V146\.16/
		);
		expect(src).not.toMatch(/clip-path|clipPath/);
		expect(src).not.toMatch(/aria-label="Korean 한"/);
	});

	it('nods each jamo once on brand hover with a reduced-motion fallback', () => {
		expect(css).toMatch(/@keyframes -global-han-nod-h/);
		expect(css).toMatch(/@keyframes -global-han-nod-a/);
		expect(css).toMatch(/@keyframes -global-han-nod-n/);
		expect(css).not.toMatch(/han-wiggle/);
		expect(css).not.toMatch(/infinite/);
		expect(css).toMatch(/:global\(a\.brand:hover\) \.jamo-h/);
		expect(css).toMatch(/:global\(a\.brand:focus-visible\) \.jamo-h/);
		expect(css).toMatch(/han-nod-h 450ms ease-out 0ms 1 both/);
		expect(css).toMatch(/han-nod-a 450ms ease-out 60ms 1 both/);
		expect(css).toMatch(/han-nod-n 450ms ease-out 120ms 1 both/);
		expect(css).toMatch(/transform-box:\s*fill-box/);
		expect(css).toMatch(/transform-origin:\s*center/);
		expect(css).toMatch(/rotate\(5\.5deg\) translateY\(-1px\)/);
		expect(css).toMatch(/rotate\(-5deg\) translateY\(-1px\)/);
		expect(css).toMatch(/rotate\(4\.5deg\) translateY\(1px\)/);
		expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
		expect(css).toMatch(/color:\s*var\(--ink\)/);
		expect(css).toMatch(/@media \(forced-colors: active\)/);
	});
});

describe('layout BrandMark entry', () => {
	it('mounts BrandMark beside the English name without a pointer polyfill', () => {
		expect(layout).toMatch(/BrandMark/);
		expect(layout).toMatch(/class="name">Korean/);
		expect(layout).toMatch(/class="brand"/);
		expect(layout).not.toMatch(/brandHot/);
		expect(layout).not.toMatch(/wiggling/);
		expect(layout).not.toMatch(/onpointerenter/);
		expect(layout).not.toMatch(/han-wiggle/);
		expect(layout).not.toMatch(/class="mark" lang="ko">한/);
	});
});
