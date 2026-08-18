import { describe, expect, it } from 'vitest';
import {
	decideItemFocusOpen,
	decideUnlockedPress,
	decideWindowEscape,
	type PreviewOpenMode,
	type RailPressState
} from '$lib/domain/labPreview';
import src from './LabIndexRail.svelte?raw';
import preview from './LabPreview.svelte?raw';
import spread from './LabSpread.svelte?raw';

function legacyUnlockedWouldPreventDefault(
	openId: string | null,
	itemId: string,
	matchMediaFine: boolean
): boolean {
	if (matchMediaFine) return false;
	return openId !== itemId;
}

describe('LabIndexRail source contracts', () => {
	it('names the nav Labs and keeps 44px targets', () => {
		expect(src).toMatch(/aria-label="Labs"/);
		expect(src).toMatch(/min-height:\s*44px/);
		expect(src).not.toMatch(/Plate/);
		expect(src).not.toMatch(/ToC/);
		expect(src).not.toMatch(/Colophon/);
		expect(src).not.toMatch(/folio/i);
	});

	it('does not use title= as the lab preview', () => {
		expect(src).not.toMatch(/title=\{/);
		expect(src).not.toMatch(/title="/);
	});

	it('decides unlocked navigation from this event pointerType, not matchMedia', () => {
		expect(src).toMatch(/decideUnlockedPress/);
		expect(src).toMatch(/e\.pointerType/);
		expect(src).toMatch(/armedForNavigate/);
		expect(preview).toMatch(/model\.actionLabel/);
		expect(preview).toMatch(/Close/);
		expect(preview).toMatch(/btn ghost/);
	});

	it('freezes cursor-follow so the panel action can be clicked', () => {
		expect(src).toMatch(/followFrozen/);
		expect(src).not.toMatch(/<svelte:window[^>]*onpointermove/);
		expect(src).toMatch(/onpointerdown=\{onWindowPointerDown\}/);
	});

	it('keeps a hover bridge between the number and the preview', () => {
		expect(src).toMatch(/hoverBridgePolygon|isPointInHoverBridge/);
		expect(src).toMatch(/decideHoverIntent/);
		expect(src).toMatch(/<svelte:body onpointermove=\{onHoverIntentMove\}/);
		expect(src).toMatch(/onPointerEnter=\{onPreviewPointerEnter\}/);
		expect(src).toMatch(/expandHoverBox/);
		expect(preview).toMatch(/PREVIEW_HOVER_BUFFER_PX|--preview-buffer|padding:\s*4px/);
	});

	it('treats the preview as a disclosure, not a fake modal', () => {
		expect(preview).not.toMatch(/aria-modal="true"/);
		expect(preview).not.toMatch(/aria-modal/);
		expect(preview).not.toMatch(/role=["']dialog["']/);
		expect(preview).not.toMatch(/role=\{dialog/);
		expect(src).toMatch(/aria-expanded=\{expanded\}/);
		expect(src).toMatch(/aria-controls=\{expanded \? panelId : undefined\}/);
	});
});

describe('unlocked number press (would fail today’s first tap)', () => {
	const focusAlreadyOpened: RailPressState = {
		openId: '0001',
		openedBy: 'keyboard',
		armedForNavigate: null
	};

	it('prevents navigation on the first coarse/touch click even if focus already opened this id', () => {
		expect(legacyUnlockedWouldPreventDefault('0001', '0001', false)).toBe(false);

		const decision = decideUnlockedPress(focusAlreadyOpened, '0001', 'touch');
		expect(decision).toEqual({ action: 'preview', mode: 'press', preventDefault: true });
	});

	it('allows navigation on a second touch of the same id after the panel was armed', () => {
		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'press', armedForNavigate: '0001' },
			'0001',
			'touch'
		);
		expect(decision).toEqual({ action: 'navigate' });
	});

	it('lets a fine mouse click through on an unlocked number', () => {
		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'pointer', armedForNavigate: null },
			'0001',
			'mouse'
		);
		expect(decision).toEqual({ action: 'navigate' });
	});

	it('does not navigate on first tap when pointerType is touch on a fine-hover device', () => {
		expect(legacyUnlockedWouldPreventDefault('0001', '0001', true)).toBe(false);

		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'pointer', armedForNavigate: null },
			'0001',
			'touch'
		);
		expect(decision).toEqual({ action: 'preview', mode: 'press', preventDefault: true });
	});

	it('treats pen like touch and keyboard-generated clicks like mouse', () => {
		expect(decideUnlockedPress(focusAlreadyOpened, '0001', 'pen')).toEqual({
			action: 'preview',
			mode: 'press',
			preventDefault: true
		});
		expect(decideUnlockedPress(focusAlreadyOpened, '0001', '')).toEqual({ action: 'navigate' });
	});

	it('opens the preview on a first touch when nothing is open yet', () => {
		const decision = decideUnlockedPress(
			{ openId: null, openedBy: null, armedForNavigate: null },
			'0001',
			'touch'
		);
		expect(decision).toEqual({ action: 'preview', mode: 'press', preventDefault: true });
	});

	it('does not treat a different number as the armed second tap', () => {
		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'press', armedForNavigate: '0001' },
			'0002',
			'touch'
		);
		expect(decision).toEqual({ action: 'preview', mode: 'press', preventDefault: true });
	});
});

function legacyCloseThenNumberFocusLeavesOpen(): boolean {
	let openId: string | null = '0001';
	openId = null;
	openId = '0001';
	return openId !== null;
}

function closeThenSyntheticNumberFocus(mode: PreviewOpenMode): string | null {
	const escape = decideWindowEscape('0001', mode);
	switch (escape.action) {
		case 'ignore':
			return '0001';
		case 'dismiss': {
			let openId: string | null = null;
			const focus = decideItemFocusOpen(true);
			switch (focus.action) {
				case 'skip':
					break;
				case 'open':
					openId = escape.restoreId;
					break;
				default: {
					const _exhaustive: never = focus;
					return _exhaustive;
				}
			}
			return openId;
		}
		default: {
			const _exhaustive: never = escape;
			return _exhaustive;
		}
	}
}

describe('Escape from the panel (would fail today’s reopen loop)', () => {
	it('closes and stays closed when restore-focus hits the number', () => {
		expect(legacyCloseThenNumberFocusLeavesOpen()).toBe(true);
		expect(closeThenSyntheticNumberFocus('keyboard')).toBeNull();
		expect(closeThenSyntheticNumberFocus('press')).toBeNull();
	});

	it('does not window-claim Escape for hover-only', () => {
		expect(decideWindowEscape('0001', 'pointer')).toEqual({ action: 'ignore' });
		expect(closeThenSyntheticNumberFocus('pointer')).toBe('0001');
	});

	it('wires dismiss and focus-open through the extracted decisions', () => {
		expect(src).toMatch(/decideWindowEscape\(openId,\s*mode\)/);
		expect(src).toMatch(/decideItemFocusOpen\(suppressFocusOpen\)/);
		expect(src).toMatch(/suppressFocusOpen = true/);
	});
});

describe('LabSpread source contracts', () => {
	it('sits instruction beside a tickless well on wide screens', () => {
		expect(spread).toMatch(/class="well"/);
		expect(spread).toMatch(/minmax\(280px,\s*1fr\)/);
		expect(spread).not.toMatch(/\.well::before/);
		expect(spread).not.toMatch(/\.well::after/);
		expect(spread).not.toMatch(/Colophon|ToC|folio/i);
	});

	it('keeps settle UI under the well on wide screens', () => {
		expect(spread).toMatch(/class="spread-col"/);
		expect(spread).toMatch(/'article spread-col'/);
		expect(spread).not.toMatch(/'after well'/);
		expect(spread).toMatch(/\.spread-col\s*\{[^}]*position:\s*sticky/s);
		expect(spread).toMatch(/max-height:\s*calc\(100dvh/);
	});
});
