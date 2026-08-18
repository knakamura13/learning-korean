import { describe, expect, it } from 'vitest';
import { labCardState, type CourseLab, type CourseNavView } from './courseNav';
import {
	anchorPopover,
	decideItemFocusOpen,
	decideUnlockedPress,
	decideWindowEscape,
	labPreviewModel,
	previewChipKind,
	type PreviewOpenMode
} from './labPreview';

const labs: CourseLab[] = [
	{
		id: '0001',
		number: 1,
		title: 'Find the Letters in Your Mouth',
		minutes: 9,
		stepCount: 17,
		unlocks: 'lab01'
	},
	{
		id: '0002',
		number: 2,
		title: 'Ten Vowels From Two Strokes',
		minutes: 9,
		stepCount: 16,
		unlocks: 'lab02',
		requires: '0001'
	}
];

function view(partial: { ready?: boolean; unlocked?: string[] } = {}): CourseNavView {
	const unlocked = new Set(partial.unlocked ?? []);
	return {
		ready: partial.ready ?? true,
		isUnlocked: (tier) => unlocked.has(tier),
		sessionFor: () => undefined,
		queue: 0
	};
}

describe('anchorPopover', () => {
	it('places the panel 12px from the cursor and flips near the right edge', () => {
		const viewport = { w: 1200, h: 800 };
		const panel = { w: 320, h: 220 };
		const open = anchorPopover({ x: 80, y: 120 }, panel, viewport);
		expect(open.left).toBe(92);
		expect(open.top).toBe(132);
		const flipped = anchorPopover({ x: 1100, y: 120 }, panel, viewport);
		expect(flipped.left).toBeLessThan(1100 - 320);
	});

	it('clamps onto the viewport rather than overflowing', () => {
		const placed = anchorPopover({ x: 10, y: 790 }, { w: 320, h: 220 }, { w: 400, h: 800 });
		expect(placed.left).toBeGreaterThanOrEqual(8);
		expect(placed.top + 220).toBeLessThanOrEqual(800);
	});

	it('anchors to a number box when the cursor is a DOMRect-like', () => {
		const rect = { x: 20, y: 40, width: 44, height: 44, top: 40, right: 64 };
		const placed = anchorPopover(rect, { w: 320, h: 220 }, { w: 1200, h: 800 });
		expect(placed.left).toBe(76);
		expect(placed.top).toBe(52);
	});
});

describe('labPreviewModel', () => {
	it('exposes title, standfirst, minutes, and an honest chip — never plate copy', () => {
		const firstVisit = view({ ready: false });
		const model = labPreviewModel(
			labs[0],
			'No reading ahead.',
			labCardState(labs[0], labs, firstVisit),
			null
		);
		expect(model.eyebrow).toMatch(/Lab 01/);
		expect(model.title).toBe('Find the Letters in Your Mouth');
		expect(model.standfirst).toBe('No reading ahead.');
		expect(model.minutes).toBe(9);
		expect(model.cardCount).toBe(17);
		expect(model.actionLabel).toMatch(/Open lab|Open anyway/);
		expect(model.chip).toMatch(/start here/);
		expect(model.accessibleName).toMatch(/Lab 01/);
		expect(JSON.stringify(model)).not.toMatch(/Colophon|ToC|folio|plate/i);
	});

	it('uses Open anyway and the lock chip without duplicating prerequisite copy', () => {
		const firstVisit = view({ ready: false });
		const model = labPreviewModel(
			labs[1],
			'Vowels next.',
			labCardState(labs[1], labs, firstVisit),
			labs[0]
		);
		expect(model.locked).toBe(true);
		expect(model.actionLabel).toBe('Open anyway');
		expect(model.chip).toMatch(/Finish Lab 01 first/);
		expect(model.prerequisite).toBeNull();
	});

	it('covers every labCardState branch without a leftover kind', () => {
		const kinds = ['locked', 'resume', 'done', 'start', 'available'] as const;
		for (const kind of kinds) {
			const mapped = previewChipKind({
				locked: kind === 'locked',
				done: kind === 'done',
				resumeAt: kind === 'resume' ? 2 : null,
				startHere: kind === 'start'
			});
			expect(mapped).toBe(kind);
		}
	});
});

describe('decideUnlockedPress', () => {
	it('does not treat a focus-opened panel as a second tap', () => {
		const decision = decideUnlockedPress(
			{ openId: '0001', openedBy: 'keyboard', armedForNavigate: null },
			'0001',
			'touch'
		);
		expect(decision.action).toBe('preview');
		if (decision.action === 'preview') expect(decision.preventDefault).toBe(true);
	});
});

/**
 * Today's bug: closePreview(); number.focus(); onItemFocus always opened.
 * This is the same sequence LabIndexRail runs on Escape from the panel.
 */
function previewAfterEscapeRestoreFocus(
	openId: string | null,
	mode: PreviewOpenMode
): string | null {
	const escape = decideWindowEscape(openId, mode);
	switch (escape.action) {
		case 'ignore':
			return openId;
		case 'dismiss': {
			const focus = decideItemFocusOpen(true);
			switch (focus.action) {
				case 'skip':
					return null;
				case 'open':
					return escape.restoreId;
				default: {
					const _exhaustive: never = focus;
					return _exhaustive;
				}
			}
		}
		default: {
			const _exhaustive: never = escape;
			return _exhaustive;
		}
	}
}

function legacyEscapeRestoreWouldReopen(): boolean {
	let openId: string | null = '0001';
	openId = null;
	openId = '0001';
	return openId !== null;
}

describe('Escape restore-focus must not reopen the preview', () => {
	it('stays closed when close is followed by synthetic focus on the number', () => {
		expect(legacyEscapeRestoreWouldReopen()).toBe(true);
		expect(previewAfterEscapeRestoreFocus('0001', 'keyboard')).toBeNull();
		expect(previewAfterEscapeRestoreFocus('0001', 'press')).toBeNull();
	});

	it('does not claim window Escape for a hover-only preview', () => {
		expect(decideWindowEscape('0001', 'pointer')).toEqual({ action: 'ignore' });
		expect(previewAfterEscapeRestoreFocus('0001', 'pointer')).toBe('0001');
	});

	it('ignores Escape when nothing is open', () => {
		expect(decideWindowEscape(null, 'keyboard')).toEqual({ action: 'ignore' });
		expect(previewAfterEscapeRestoreFocus(null, 'press')).toBeNull();
	});

	it('opens on a later real focus after the restore-focus skip', () => {
		expect(decideItemFocusOpen(true)).toEqual({ action: 'skip' });
		expect(decideItemFocusOpen(false)).toEqual({ action: 'open' });
	});
});
