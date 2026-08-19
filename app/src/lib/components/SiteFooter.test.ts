import { describe, expect, it } from 'vitest';
import src from './SiteFooter.svelte?raw';
import layout from '../../routes/+layout.svelte?raw';
import review from '../../routes/review/+page.svelte?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

describe('SiteFooter — quiet progress backup', () => {
	it('lives in the site footer, not on the Review sitting', () => {
		expect(layout).toMatch(/import SiteFooter from '\$lib\/components\/SiteFooter\.svelte'/);
		expect(layout).toMatch(/\{#if !labRoute\}/);
		expect(layout).toMatch(/<SiteFooter \/>/);
		expect(review).not.toMatch(/ProgressBackup/);
		expect(review).not.toMatch(/backupPanel/);
		expect(review).not.toMatch(/backup-card/);
		expect(review).not.toMatch(/showBackup/);
		expect(review).not.toMatch(/backupFirst/);
	});

	it('keeps backup behind a collapsed disclosure until storage is not durable or progress is unreadable', () => {
		expect(src).toMatch(/<footer\b/);
		expect(src).toMatch(/id="progress-backup"/);
		expect(src).toMatch(/<details[^>]*class="backup-fold"/);
		expect(src).toMatch(
			/open=\{ready && storageNeedsBackup\(progress\.durable, labSession\.durable, progress\.corrupt\)\}/
		);
		expect(src).toMatch(/wrapExport\(progress\.export\(\), labSession\.snapshot\)/);
		expect(src).toMatch(/unwrapImport/);
		expect(src).toMatch(/labSession\.replaceAll/);
		expect(src).toMatch(/<summary>Back up or restore your progress<\/summary>/);
		expect(src).toMatch(/<ProgressBackup /);
		expect(src).not.toMatch(/class="[^"]*card/);
	});

	it('points the Review storage warning at the footer instead of embedding the buttons', () => {
		expect(review).toMatch(/href="#progress-backup"/);
		expect(review).toMatch(/Download a backup/);
		expect(review).toMatch(/progress\.corrupt/);
		expect(review).toMatch(/labSession\.durable/);
	});

	it('keeps a 44px summary, pressed state, and logical layout', () => {
		const css = styleBlock(src);
		expect(css).toMatch(/\.backup-fold summary\s*\{[^}]*min-height:\s*44px/s);
		expect(css).toMatch(/\.backup-fold summary:active\s*\{/);
		expect(css).toMatch(/\.backup-fold summary:hover\s*\{[^}]*background:\s*var\(--accent-soft\)/s);
		expect(css).toMatch(/summary:focus-visible/);
		expect(css).not.toMatch(/(?:margin|padding|border)-(?:left|right)\s*:/);
		expect(css).not.toMatch(/(?:^|[^\w-])(?:left|right)\s*:/m);
	});
});
