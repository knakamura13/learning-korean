import { describe, expect, it } from 'vitest';
import layout from '../routes/+layout.svelte?raw';
import home from '../routes/+page.svelte?raw';
import labPage from '../routes/lab/[id]/+page.svelte?raw';

function shellBeforeRail(src: string): boolean {
	const shellMatch = src.match(/class="shell[\s"]/);
	const railIdx = src.indexOf('<LabIndexRail');
	return shellMatch !== null && railIdx !== -1 && shellMatch.index! < railIdx;
}

describe('shell layout source contracts', () => {
	it('layout exposes focusable main and skip link that focuses it', () => {
		expect(layout).toMatch(/<main[^>]*id="main"/);
		expect(layout).toMatch(/<main[^>]*tabindex="-1"/);
		expect(layout).toMatch(/class="skip"[^>]*href="#main"/);
		expect(layout).toMatch(/onclick=\{[^}]*focus\(\)/);
		expect(layout).toMatch(/getElementById\(['"]main['"]\)/);
	});

	it('home and lab pages put .shell before LabIndexRail in DOM order', () => {
		expect(shellBeforeRail(home)).toBe(true);
		expect(shellBeforeRail(labPage)).toBe(true);
	});

	it('home wide layout aligns with header shell, not 90rem', () => {
		expect(home).toMatch(/max-width:\s*var\(--shell\)/);
		expect(home).toMatch(/padding-inline:\s*0/);
		expect(home).toMatch(/grid-template-areas:\s*'rail main'/);
		expect(home).toMatch(/\.with-rail \.shell\s*\{[^}]*grid-area:\s*main/);
		expect(home).toMatch(/\.with-rail :global\(\.lab-index\)\s*\{[^}]*grid-area:\s*rail/);
		expect(home).not.toMatch(/max-width:\s*90rem/);
	});

	it('lab page keeps sitting max-width on wide layout', () => {
		expect(labPage).toMatch(/max-width:\s*var\(--sitting\)/);
		expect(labPage).toMatch(/grid-template-areas:\s*'rail main'/);
		expect(labPage).toMatch(/\.with-rail \.shell\s*\{[^}]*grid-area:\s*main/);
		expect(labPage).toMatch(/\.with-rail :global\(\.lab-index\)\s*\{[^}]*grid-area:\s*rail/);
	});
});
