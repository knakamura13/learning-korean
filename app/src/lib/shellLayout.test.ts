import { describe, expect, it } from 'vitest';
import layout from '../routes/+layout.svelte?raw';
import home from '../routes/+page.svelte?raw';
import labPage from '../routes/lab/[id]/+page.svelte?raw';
import reference from '../routes/reference/+page.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

function shellBeforeRail(src: string, railTag: string): boolean {
	const shellMatch = src.match(/class="shell[\s"]/);
	const railIdx = src.indexOf(railTag);
	return shellMatch !== null && railIdx !== -1 && shellMatch.index! < railIdx;
}

describe('shell layout source contracts', () => {
	it('layout has no SiteFooter; frame still fills the viewport', () => {
		expect(layout).not.toMatch(/SiteFooter/);
		expect(layout).toMatch(/class="frame"/);
		expect(styleBlock(layout)).toMatch(/\.frame\s*\{[^}]*min-height:\s*100dvh/s);
		expect(styleBlock(layout)).toMatch(/main\s*\{[^}]*flex:\s*1 1 auto/s);
	});

	it('layout skip link lands on main without a permanent click-focus target', () => {
		expect(layout).toMatch(/<main[^>]*id="main"/);
		expect(layout).not.toMatch(/<main[^>]*tabindex="/);
		expect(layout).toMatch(/class="skip"[^>]*href="#main"/);
		expect(layout).toMatch(/onclick=\{skipToMain\}/);
		expect(layout).toMatch(/function skipToMain/);
		expect(layout).toMatch(/preventDefault\(\)/);
		expect(layout).toMatch(/getElementById\(['"]main['"]\)/);
		expect(layout).toMatch(/from '\$lib\/a11y\/skipLanding'/);
		expect(layout).toMatch(/armSkipLanding\(/);
		expect(layout).toMatch(/disarmSkipLanding\(/);
		expect(layout).toMatch(/onblur=\{/);
		expect(layout).not.toMatch(/skipLanded/);
		expect(layout).not.toMatch(/:global\(#main:focus\)/);
		expect(styleBlock(layout)).toMatch(/main\s*\{[^}]*position:\s*relative/s);
		expect(styleBlock(layout)).not.toMatch(/main:focus::after/);
		expect(styleBlock(layout)).not.toMatch(/main:focus-visible::after/);
		expect(styleBlock(layout)).not.toMatch(/data-skip-landed/);
	});

	it('home and lab pages put .shell before LabIndexRail in DOM order', () => {
		expect(shellBeforeRail(home, '<LabIndexRail')).toBe(true);
		expect(shellBeforeRail(labPage, '<LabIndexRail')).toBe(true);
	});

	it('reference page puts .shell before ReferenceIndexRail in DOM order', () => {
		expect(shellBeforeRail(reference, '<ReferenceIndexRail')).toBe(true);
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

	it('reference wide layout puts the jump rail left of content like Labs', () => {
		expect(reference).toMatch(/max-width:\s*var\(--shell\)/);
		expect(reference).toMatch(/grid-template-areas:\s*'rail head'\s*'rail main'/);
		expect(reference).toMatch(/\.with-rail \.head\s*\{[^}]*grid-area:\s*head/);
		expect(reference).toMatch(/\.with-rail \.page\s*\{[^}]*grid-area:\s*main/);
		expect(reference).toMatch(/\.with-rail :global\(\.ref-index\)\s*\{[^}]*grid-area:\s*rail/);
		expect(styleBlock(reference)).toMatch(/grid-template-areas:\s*'head'\s*'rail'\s*'main'/);
	});

	it('nav tabs keep a 1px border in both states so selecting one does not shift neighbors', () => {
		const css = styleBlock(layout);
		expect(css).toMatch(/nav a\s*\{[^}]*border:\s*1px solid transparent/s);
		expect(css).toMatch(/nav a\s*\{[^}]*border-block-end:\s*(?:none|0)/s);
		expect(css).toMatch(/nav a\.active\s*\{[^}]*border-color:\s*var\(--rule\)/s);
		expect(css).not.toMatch(/nav a\.active\s*\{[^}]*\bborder:\s*1px solid/s);
	});
});
