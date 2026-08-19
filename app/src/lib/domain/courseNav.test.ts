import { describe, expect, it } from 'vitest';
import {
	canHighlightStart,
	continueAction,
	followingLab,
	labCardState,
	labTone,
	nextLabId,
	reviewPileDueCopy,
	reviewPileView,
	showPrerequisiteGate,
	type CourseLab,
	type CourseNavView
} from './courseNav';
import { emptyOutcomes } from './pipState';
import type { LabProgress } from './labSession';

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
	},
	{
		id: '0003',
		number: 3,
		title: 'Eleven Compounds, Seven Sounds',
		minutes: 9,
		stepCount: 16,
		unlocks: 'lab03',
		requires: '0002'
	}
];

function view(partial: {
	ready?: boolean;
	unlocked?: string[];
	opened?: string[];
	sessions?: Record<string, LabProgress>;
	queue?: number;
}): CourseNavView {
	const unlocked = new Set(partial.unlocked ?? []);
	const opened = new Set(partial.opened ?? []);
	return {
		ready: partial.ready ?? true,
		isUnlocked: (tier) => unlocked.has(tier),
		isOpened: (labId) => opened.has(labId),
		sessionFor: (id) => partial.sessions?.[id],
		queue: partial.queue ?? 0
	};
}

function mid(nextIndex: number, stepCount: number): LabProgress {
	return {
		nextIndex,
		firstTry: 1,
		elapsedMs: 12_000,
		finished: false,
		outcomes: emptyOutcomes(stepCount)
	};
}

describe('nextLabId', () => {
	it('points at Lab 01 before hydration, and locks later labs', () => {
		const unseen = view({ ready: false });
		expect(nextLabId(labs, unseen)).toBe('0001');
		expect(labCardState(labs[0], labs, unseen)).toMatchObject({
			locked: false,
			startHere: true,
			done: false,
			resumeAt: null
		});
		expect(labCardState(labs[1], labs, unseen)).toMatchObject({
			locked: true,
			startHere: false
		});
	});

	it('still points at Lab 01 for a new hydrated learner', () => {
		const fresh = view({ ready: true });
		expect(nextLabId(labs, fresh)).toBe('0001');
		expect(labCardState(labs[1], labs, fresh).locked).toBe(true);
	});

	it('advances to Lab 02 once Lab 01 is unlocked and not mid-sitting', () => {
		const after = view({ unlocked: ['lab01'] });
		expect(nextLabId(labs, after)).toBe('0002');
		expect(labCardState(labs[0], labs, after).done).toBe(true);
		expect(labCardState(labs[1], labs, after).locked).toBe(false);
		expect(labCardState(labs[1], labs, after).startHere).toBe(true);
		expect(labCardState(labs[2], labs, after).locked).toBe(true);
	});

	it('does not invert the next lab as start-here while Review is due', () => {
		const due = view({ unlocked: ['lab01'], queue: 10 });
		expect(nextLabId(labs, due)).toBe('0002');
		expect(labCardState(labs[1], labs, due)).toMatchObject({
			locked: false,
			done: false,
			startHere: false
		});
		expect(canHighlightStart(due)).toBe(false);
		expect(canHighlightStart(view({ ready: false, queue: 10 }))).toBe(true);
	});
});

describe('continueAction', () => {
	it('offers Lab 01 before hydration so first paint has a real CTA', () => {
		const action = continueAction(labs, view({ ready: false }));
		expect(action).toMatchObject({
			kind: 'start',
			href: '/lab/0001',
			kicker: 'Start here',
			title: 'Start Lab 01'
		});
	});

	it('resumes an in-progress lab ahead of a due review', () => {
		const action = continueAction(
			labs,
			view({
				unlocked: [],
				queue: 8,
				sessions: { '0001': mid(3, 17) }
			})
		);
		expect(action).toMatchObject({
			kind: 'resume',
			href: '/lab/0001',
			title: 'Resume Lab 01',
			detail: 'Card 4 of 17 · Find the Letters in Your Mouth'
		});
	});

	it('sends a learner to review after a lab, before the next lesson', () => {
		const action = continueAction(labs, view({ unlocked: ['lab01'], queue: 10 }));
		expect(action).toMatchObject({
			kind: 'review',
			href: '/review',
			title: 'Review 10 cards'
		});
	});

	it('starts the next locked-behind lab once the deck is clear', () => {
		const action = continueAction(labs, view({ unlocked: ['lab01'], queue: 0 }));
		expect(action).toMatchObject({
			kind: 'start',
			href: '/lab/0002',
			kicker: 'Next lab',
			title: 'Start Lab 02'
		});
	});

	it('reports a clear review when the course and queue are done', () => {
		const action = continueAction(
			labs,
			view({ unlocked: ['lab01', 'lab02', 'lab03'], queue: 0 })
		);
		expect(action).toMatchObject({
			kind: 'caught-up',
			href: '/review',
			title: 'Review is clear',
			detail: 'Nothing is due. Open Review if you want to check.'
		});
	});
});

describe('labTone', () => {
	it('maps mutually exclusive card flags to one visual tone', () => {
		expect(labTone({ locked: true, done: false, resumeAt: null, startHere: false })).toBe(
			'locked'
		);
		expect(labTone({ locked: false, done: false, resumeAt: 2, startHere: false })).toBe('resume');
		expect(labTone({ locked: false, done: false, resumeAt: null, startHere: true })).toBe('now');
		expect(labTone({ locked: false, done: true, resumeAt: null, startHere: false })).toBe('done');
		expect(labTone({ locked: false, done: false, resumeAt: null, startHere: false })).toBe(
			'idle'
		);
	});

	it('lets a sitting beat done and startHere so a resume is never archived or next-up', () => {
		expect(labTone({ locked: false, done: true, resumeAt: 1, startHere: true })).toBe('resume');
	});
});

describe('labCardState', () => {
	it('treats a peeked later lab as resumable rather than locked', () => {
		const peeked = view({
			sessions: { '0002': mid(2, 16) }
		});
		expect(labCardState(labs[1], labs, peeked)).toMatchObject({
			locked: false,
			resumeAt: 2,
			startHere: false
		});
	});

	it('treats a finished peeked lab as done and unlocked, not locked', () => {
		const peekedDone = view({ unlocked: ['lab02'] });
		expect(labCardState(labs[1], labs, peekedDone)).toMatchObject({
			locked: false,
			done: true,
			resumeAt: null
		});
	});

	it('treats a skip-ahead grant as unlocked access without finishing the lab', () => {
		const skipped = view({ opened: ['0002'] });
		expect(labCardState(labs[1], labs, skipped)).toMatchObject({
			locked: false,
			done: false,
			startHere: false
		});
		expect(labCardState(labs[0], labs, skipped).startHere).toBe(true);
		expect(showPrerequisiteGate(labs[1], labs, skipped)).toBe(false);
	});
});

describe('reviewPileView', () => {
	it('stays loading until progress is read so prerender cannot flash locked rows', () => {
		expect(reviewPileView(false, 0, 10)).toEqual({ body: 'loading', due: 0 });
		expect(reviewPileView(false, 19, 10)).toEqual({ body: 'loading', due: 0 });
	});

	it('uses an empty state when no family has unlocked yet', () => {
		expect(reviewPileView(true, 0, 0)).toEqual({ body: 'empty', due: 0 });
	});

	it('shows progress and due count once a family is in the pile', () => {
		expect(reviewPileView(true, 19, 10)).toEqual({ body: 'progress', due: 10 });
		expect(reviewPileView(true, 19, 0)).toEqual({ body: 'progress', due: 0 });
	});

	it('names the next lab when cards are due, and stays quiet when they are not', () => {
		expect(reviewPileDueCopy(10, labs[1])).toBe('Due now — before Lab 02.');
		expect(reviewPileDueCopy(1, null)).toBe('Due now.');
		expect(reviewPileDueCopy(0, labs[1])).toBeNull();
	});
});

describe('followingLab', () => {
	it('returns the next lab in course order, and nothing after the last', () => {
		expect(followingLab(labs, '0001')?.id).toBe('0002');
		expect(followingLab(labs, '0003')).toBeNull();
		expect(followingLab(labs, 'missing')).toBeNull();
	});
});

describe('showPrerequisiteGate', () => {
	it('shows on later labs until the required tier is unlocked', () => {
		expect(showPrerequisiteGate(labs[1], labs, view({ ready: false }))).toBe(true);
		expect(showPrerequisiteGate(labs[1], labs, view({ ready: true }))).toBe(true);
		expect(showPrerequisiteGate(labs[1], labs, view({ unlocked: ['lab01'] }))).toBe(false);
		expect(showPrerequisiteGate(labs[0], labs, view({ ready: true }))).toBe(false);
	});

	it('hides after a peeked lab is finished even without the prerequisite tier', () => {
		expect(showPrerequisiteGate(labs[1], labs, view({ unlocked: ['lab02'] }))).toBe(false);
	});

	it('still shows for a peeked lab that is in progress', () => {
		expect(
			showPrerequisiteGate(
				labs[1],
				labs,
				view({ sessions: { '0002': mid(2, 16) } })
			)
		).toBe(true);
	});
});
