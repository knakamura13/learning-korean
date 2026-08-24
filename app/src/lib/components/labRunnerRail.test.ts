import { describe, expect, it } from 'vitest';
import labPipRail from './LabPipRail.svelte?raw';
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

describe('LabPipRail', () => {
	it('exposes a thin scrollbar at all widths and keeps 44px pip hits', () => {
		const css = styleBlock(labPipRail);
		const rail = railBlock(css);

		expect(rail).toMatch(/scrollbar-width:\s*thin/);
		expect(rail).not.toMatch(/scrollbar-width:\s*none/);
		expect(css).not.toMatch(/\.rail::-webkit-scrollbar\s*\{[^}]*display:\s*none/s);
		expect(css).toMatch(/\.rail::-webkit-scrollbar\s*\{[^}]*height:\s*4px/s);
		expect(css).toMatch(/\.pip\s*\{[^}]*min-width:\s*44px/s);
	});

	it('owns the numbered rail so LabRunner does not', () => {
		expect(labPipRail).toMatch(/aria-label="Lab card navigation, \{/);
		expect(labPipRail).toMatch(/attachPipRail/);
		expect(styleBlock(labRunner)).not.toMatch(/\.pip\s*\{/);
		expect(styleBlock(labRunner)).not.toMatch(/\.rail\s*\{/);
	});

	it('names the rail with the active phase and marks other-phase pips', () => {
		expect(labPipRail).toMatch(/aria-label="Lab card navigation, \{/);
		expect(labPipRail).toMatch(/data-phase=\{/);
		expect(labPipRail).toMatch(/cardInActivePhase/);
		expect(labPipRail).toMatch(/opacity:\s*0\.4/);
		expect(labPipRail).toMatch(/\[data-phase='other'\][^{]*\{[^}]*GrayText/s);
		expect(labRunner).toMatch(/class="phase-title"/);
		expect(labRunner).toMatch(/phaseAt\(lab\.phases,\s*index\)/);
		expect(labRunner).not.toMatch(/formatStepEyebrow/);
		expect(labRunner).not.toMatch(/step\.act/);
	});
});
