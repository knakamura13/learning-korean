import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = dirname(fileURLToPath(import.meta.url));
const mouthSrc = readFileSync(resolve(dir, 'MouthStep.svelte'), 'utf8');
const appCss = readFileSync(resolve(dir, '../../../app.css'), 'utf8');

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
		const ruleStart = css.lastIndexOf('{', css.indexOf('{', activeAt));
		const ruleEnd = css.indexOf('}', Math.max(ruleStart, activeAt));
		const activeRule = css.slice(Math.max(0, activeAt - 40), ruleEnd + 1);
		expect(activeRule).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
	});

	it('does not let a global button:active transform clobber layout', () => {
		expect(appCss).not.toMatch(/button:not\(:disabled\):active/);
	});
});
