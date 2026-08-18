import { describe, expect, it } from 'vitest';
import labRunner from './LabRunner.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

function railBlock(css: string): string {
	const match = css.match(/\.rail\s*\{[^}]*\}/s);
	if (!match) throw new Error('no .rail block');
	return match[0];
}

describe('LabRunner rail scrollbar', () => {
	it('exposes a thin scrollbar at all widths and keeps 44px pip hits', () => {
		const css = styleBlock(labRunner);
		const rail = railBlock(css);

		expect(rail).toMatch(/scrollbar-width:\s*thin/);
		expect(rail).not.toMatch(/scrollbar-width:\s*none/);
		expect(css).not.toMatch(/\.rail::-webkit-scrollbar\s*\{[^}]*display:\s*none/s);
		expect(css).toMatch(/\.rail::-webkit-scrollbar\s*\{[^}]*height:\s*4px/s);
		expect(css).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
	});
});
