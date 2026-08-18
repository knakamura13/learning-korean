import { describe, expect, it } from 'vitest';
import mouthSrc from './MouthStep.svelte?raw';
import appCss from '../../../app.css?raw';

function styleBlock(src: string): string {
	const match = src.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('MouthStep.svelte has no style block');
	return match[1];
}

describe('mouth hit press geometry', () => {
	const css = styleBlock(mouthSrc);

	it('keeps the chip centering transform while pressed', () => {
		// The chips are absolutely placed with translate(-50%, -50%). A global
		// `button:active { transform }` would replace that, jump the label
		// down-right, and drop the click because mouseup misses the button.
		expect(css).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
		const activeAt = css.search(/\.hit:active/);
		expect(activeAt).toBeGreaterThanOrEqual(0);
		const ruleBrace = css.indexOf('{', activeAt);
		const ruleEnd = css.indexOf('}', ruleBrace);
		const activeRule = css.slice(Math.max(0, activeAt - 40), ruleEnd + 1);
		expect(activeRule).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
	});

	it('does not let a global button:active transform clobber layout', () => {
		expect(appCss).not.toMatch(/button:not\(:disabled\):active/);
	});

	it('sizes the mouth to the well and keeps hits on the SVG frame', () => {
		expect(css).toMatch(/\.mouth-wrap\s*\{[^}]*width:\s*100%/s);
		expect(css).not.toMatch(/\.mouth-wrap\s*\{[^}]*max-width:\s*30rem/s);
		expect(css).toMatch(/\.mouth-stage\s*\{[^}]*position:\s*relative/s);
		expect(css).toMatch(/\.mouth\s*\{[^}]*width:\s*100%/s);
		expect(css).toMatch(/\.zones\s*\{[^}]*inset:\s*0/s);
		expect(mouthSrc).toMatch(/class="mouth-stage"/);
		expect(mouthSrc).toMatch(/viewBox="0 0 440 300"/);
	});
});
