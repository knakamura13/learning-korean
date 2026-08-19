import { describe, expect, it } from 'vitest';
import src from './ReferenceIndexRail.svelte?raw';
import preview from './ReferencePreview.svelte?raw';
import hoverPreview from './hoverPreview.svelte.ts?raw';

function styleBlock(markup: string): string {
	const match = markup.match(/<style>([\s\S]*?)<\/style>/);
	if (!match) throw new Error('no style block');
	return match[1];
}

describe('ReferenceIndexRail source contracts', () => {
	it('names the nav Jump to section and keeps 44px targets', () => {
		expect(src).toMatch(/aria-label="Jump to section"/);
		expect(src).toMatch(/min-height:\s*44px/);
		expect(styleBlock(src)).toMatch(/\.jump:active/);
		expect(styleBlock(src)).toMatch(/\.jump\s*\{[^}]*background:\s*transparent/s);
		expect(styleBlock(src)).not.toMatch(/\.jump\s*\{[^}]*background:\s*var\(--paper-sunk\)/s);
		expect(styleBlock(src)).not.toMatch(/\.jump\s*\{[^}]*background:\s*var\(--paper-raised\)/s);
	});

	it('wraps as a horizontal rail below the Labs breakpoint, then stacks like Labs', () => {
		const css = styleBlock(src);
		expect(css).toMatch(/flex-wrap:\s*wrap/);
		expect(css).not.toMatch(/overflow-x:\s*auto/);
		expect(css).toMatch(/min-width:\s*72rem[^}]*flex-direction:\s*column/s);
		expect(src).toMatch(/class="ref-index"/);
		expect(css).toMatch(/\.ref-index\s*\{[^}]*position:\s*sticky/s);
	});

	it('does not use title= as the section preview', () => {
		expect(src).not.toMatch(/title=\{/);
		expect(src).not.toMatch(/title="/);
		expect(preview).toMatch(/model\.covers/);
		expect(preview).toMatch(/model\.title/);
		expect(preview).toMatch(/PREVIEW_HOVER_BUFFER_PX/);
	});

	it('keeps a hover bridge between the jump and the preview', () => {
		expect(src).toMatch(/HoverPreview/);
		expect(hoverPreview).toMatch(/hoverBridgePolygon|isPointInHoverBridge/);
		expect(hoverPreview).toMatch(/decideHoverIntent/);
		expect(src).toMatch(/<svelte:body onpointermove=\{hover\.openId \? hover\.onHoverIntentMove : undefined\}/);
		expect(src).toMatch(/onPointerEnter=\{hover\.onPreviewPointerEnter\}/);
		expect(hoverPreview).toMatch(/isHoverPointerType/);
		expect(hoverPreview).toMatch(/expandHoverBox/);
		expect(src).not.toMatch(/matchMedia\('\(hover: hover\)/);
	});

	it('treats the preview as a disclosure, not a fake modal', () => {
		expect(preview).not.toMatch(/aria-modal="true"/);
		expect(preview).not.toMatch(/aria-modal/);
		expect(preview).not.toMatch(/role=["']dialog["']/);
		expect(preview).not.toMatch(/role=\{dialog/);
		expect(src).toMatch(/aria-expanded=\{expanded\}/);
		expect(src).toMatch(/aria-controls=\{expanded \? hover\.panelId : undefined\}/);
	});

	it('jumps on click instead of arming a second tap', () => {
		expect(src).toMatch(/onJump/);
		expect(src).toMatch(/hover\.prepareActivate/);
		expect(src).not.toMatch(/decideUnlockedPress/);
		expect(src).not.toMatch(/armedForNavigate/);
	});

	it('matches the lab rail selected mark: transparent fill, accent ring', () => {
		const css = styleBlock(src);
		expect(css).toMatch(
			/\.jump\.current\s*\{[^}]*box-shadow:\s*0 0 0 2px var\(--paper\), 0 0 0 3px var\(--accent\)/s
		);
		expect(css).toMatch(/\.jump\.current\s*\{[^}]*background:\s*transparent/s);
		expect(css).not.toMatch(/\.jump\.current\s*\{[^}]*background:\s*var\(--accent-soft\)/s);
		expect(css).toMatch(/\.jump\.current:hover/);
		expect(css).toMatch(/\.jump\.current:hover[^}]*background:\s*transparent/s);
		expect(css).not.toMatch(/\.jump\.current:hover[^}]*background:\s*var\(--paper-sunk\)/s);
	});
});
