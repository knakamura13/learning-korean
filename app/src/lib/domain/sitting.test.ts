import { describe, expect, it } from 'vitest';
import { continueAction, type CourseLab, type CourseNavView } from './courseNav';
import { emptyOutcomes } from './pipState';
import type { LabProgress } from './labSession';
import {
	folioPip,
	folioText,
	isTitlePage,
	labIdFromPath,
	sittingCopy,
	sittingCtaLabel,
	stripInstructionHtml,
	TITLE_PAGE_LEAD
} from './sitting';

const labs: CourseLab[] = [
	{
		id: '0001',
		number: 1,
		title: 'Find the Letters in Your Mouth',
		minutes: 9,
		stepCount: 17,
		unlocks: 'lab01'
	}
];

function view(partial: Partial<CourseNavView> & { unlocked?: string[] }): CourseNavView {
	const unlocked = new Set(partial.unlocked ?? []);
	return {
		ready: partial.ready ?? true,
		isUnlocked: (tier) => unlocked.has(tier),
		sessionFor: partial.sessionFor ?? (() => undefined),
		queue: partial.queue ?? 0
	};
}

describe('folioText', () => {
	it('formats lab, due, and clear folios with tabular padding', () => {
		expect(folioText({ mode: 'lab', labNumber: 3, card: 7, total: 14 })).toBe('03 · 07/14');
		expect(folioText({ mode: 'due', queue: 12 })).toBe('DUE 12');
		expect(folioText({ mode: 'clear' })).toBe('CLEAR');
	});
});

describe('folioPip', () => {
	it('maps resume and review to rose, start to moss, caught-up to good', () => {
		expect(folioPip('resume')).toBe('rose');
		expect(folioPip('review')).toBe('rose');
		expect(folioPip('start')).toBe('moss');
		expect(folioPip('caught-up')).toBe('good');
	});
});

describe('sittingCopy', () => {
	it('uses the title-page kicker and lead before the first sitting', () => {
		const action = continueAction(labs, view({ ready: false }))!;
		const copy = sittingCopy(action, { titlePage: true, storageBlocked: false, resumeLead: null });
		expect(copy.kicker).toMatch(/Fascicle/i);
		expect(copy.lead).toBe(TITLE_PAGE_LEAD);
		expect(copy.cta).toBe('Start Lab 01');
	});

	it('prefers the card instruction when resuming', () => {
		const session: LabProgress = {
			nextIndex: 3,
			firstTry: 1,
			elapsedMs: 1,
			finished: false,
			outcomes: emptyOutcomes(17)
		};
		const action = continueAction(labs, view({ sessionFor: (id) => (id === '0001' ? session : undefined) }))!;
		const copy = sittingCopy(action, {
			titlePage: false,
			storageBlocked: false,
			resumeLead: 'Say mmm. Hold it.'
		});
		expect(sittingCtaLabel(action)).toBe('Resume the sitting');
		expect(copy.lead).toBe('Say mmm. Hold it.');
	});

	it('replaces the lead when storage is blocked', () => {
		const action = continueAction(labs, view({ ready: true }))!;
		const copy = sittingCopy(action, { titlePage: false, storageBlocked: true, resumeLead: null });
		expect(copy.lead).toMatch(/will not keep a record/);
	});
});

describe('isTitlePage', () => {
	it('is true before hydration and for a fresh start', () => {
		expect(isTitlePage({ ready: false, kind: 'start', unlocked: 0, hasSession: false })).toBe(true);
		expect(isTitlePage({ ready: true, kind: 'start', unlocked: 0, hasSession: false })).toBe(true);
		expect(isTitlePage({ ready: true, kind: 'resume', unlocked: 0, hasSession: true })).toBe(false);
	});
});

describe('stripInstructionHtml', () => {
	it('drops tags so a resume lead can be plain English', () => {
		expect(stripInstructionHtml('Say <em>mmm</em>. Hold it.')).toBe('Say mmm. Hold it.');
	});
});

describe('labIdFromPath', () => {
	it('reads a lab id and ignores other routes', () => {
		expect(labIdFromPath('/lab/0003')).toBe('0003');
		expect(labIdFromPath('/review')).toBeNull();
	});
});
