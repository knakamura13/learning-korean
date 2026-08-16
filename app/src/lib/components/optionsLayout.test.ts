import { describe, expect, it } from 'vitest';
import optionsSrc from './Options.svelte?raw';

function styleBlock(src: string): string {
	const match = src.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('Options.svelte has no style block');
	return match[1];
}

describe('choice shortcut chip layout', () => {
	const css = styleBlock(optionsSrc);

	it('keeps grid chips in flex flow so they cannot cover the label', () => {
		// Grid choices used absolute left: 20px chips over a full-width label,
		// so the first letter of "A longer sound" sat under the 1–4 chip.
		expect(css).not.toMatch(/\.opts:not\(\.stack\)\s+\.key\s*\{[^}]*position:\s*absolute/);
		expect(css).not.toMatch(/\.opts:not\(\.stack\)\s+\.txt\s*\{\s*width:\s*100%/);
	});
});
