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
});
