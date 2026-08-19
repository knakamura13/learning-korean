import { describe, expect, it } from 'vitest';
import { emptyOutcomes } from './pipState';
import {
	hydrateLabRunner,
	labProgressFromRunner,
	shouldPersistOnLeave
} from './labRunnerSession';
import type { LabProgress } from './labSession';

const mid: LabProgress = {
	nextIndex: 3,
	firstTry: 2,
	elapsedMs: 12_000,
	finished: false,
	outcomes: ['right', 'wrong', null, null]
};

describe('hydrateLabRunner', () => {
	it('starts a fresh sitting when nothing is saved', () => {
		expect(hydrateLabRunner(undefined, 4)).toEqual({
			firstTry: 0,
			elapsedMs: 0,
			outcomes: emptyOutcomes(4),
			furthest: 0,
			index: 0,
			showResumeNote: false,
			shouldFinish: false
		});
	});

	it('resumes an in-progress sitting', () => {
		expect(hydrateLabRunner(mid, 4)).toEqual({
			firstTry: 2,
			elapsedMs: 12_000,
			outcomes: ['right', 'wrong', null, null],
			furthest: 3,
			index: 3,
			showResumeNote: true,
			shouldFinish: false
		});
	});

	it('finishes when the saved sitting already completed the lab', () => {
		const done: LabProgress = { ...mid, nextIndex: 4, finished: true, outcomes: emptyOutcomes(4) };
		expect(hydrateLabRunner(done, 4).shouldFinish).toBe(true);
	});
});

describe('shouldPersistOnLeave', () => {
	it('skips a pristine sitting and writes once the learner has a place', () => {
		expect(
			shouldPersistOnLeave({
				ready: true,
				finished: false,
				settled: false,
				furthest: 0,
				firstTry: 0,
				outcomes: emptyOutcomes(4)
			})
		).toBe(false);
		expect(
			shouldPersistOnLeave({
				ready: true,
				finished: false,
				settled: false,
				furthest: 2,
				firstTry: 1,
				outcomes: emptyOutcomes(4)
			})
		).toBe(true);
		expect(
			shouldPersistOnLeave({
				ready: true,
				finished: true,
				settled: false,
				furthest: 4,
				firstTry: 3,
				outcomes: emptyOutcomes(4)
			})
		).toBe(false);
	});
});

describe('labProgressFromRunner', () => {
	it('snapshots the runner fields the store persists', () => {
		expect(
			labProgressFromRunner({
				nextIndex: 2,
				firstTry: 1,
				elapsedMs: 500,
				finished: false,
				outcomes: ['right', null]
			})
		).toEqual({
			nextIndex: 2,
			firstTry: 1,
			elapsedMs: 500,
			finished: false,
			outcomes: ['right', null]
		});
	});
});
