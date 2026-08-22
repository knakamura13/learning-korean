/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { GOOD, EASY, grade, emptyState, DAY_MS } from '$lib/domain/srs';
import { memoryStorage } from '$lib/domain/storage';
import { createProgress } from './progress.svelte';
import { createLabSession } from './labSession.svelte';

afterEach(() => {
	localStorage.clear();
});

describe('progress.applyRemote', () => {
	it('merges a remote document in and persists the result', () => {
		const store = memoryStorage();
		const progress = createProgress(store);
		progress.unlock(['lab01']);

		const remote = grade(
			{ ...emptyState(), unlocked: ['lab01', 'lab02'] },
			'c0',
			GOOD,
			Date.now() - DAY_MS
		).state;

		expect(progress.applyRemote(remote)).toBe(true);
		expect(progress.isUnlocked('lab02')).toBe(true);
		expect(progress.state.cards.c0).toBeDefined();
		expect(JSON.parse(store.read()!).unlocked).toContain('lab02');
	});

	it('keeps the later local review over an older remote one', () => {
		const progress = createProgress(memoryStorage());
		progress.unlock(['lab01']);
		const local = progress.answer('c0', true, 1000);

		const remote = grade(emptyState(), 'c0', EASY, Date.now() - 5 * DAY_MS).state;
		progress.applyRemote(remote);
		expect(progress.state.cards.c0).toEqual(local.card);
	});

	it('is a no-op on an identical remote and while quarantined', () => {
		const progress = createProgress(memoryStorage());
		progress.unlock(['lab01']);
		expect(progress.applyRemote(JSON.parse(JSON.stringify(progress.state)))).toBe(false);

		const corrupt = createProgress(memoryStorage('{not-json'));
		expect(corrupt.corrupt).toBe(true);
		expect(corrupt.applyRemote({ version: 1, unlocked: ['lab01'] })).toBe(false);
	});
});

describe('labSession.applyRemote', () => {
	it('keeps the further-along sitting per lab', () => {
		const session = createLabSession(memoryStorage());
		session.save('0001', {
			nextIndex: 3,
			firstTry: 2,
			elapsedMs: 30_000,
			finished: false,
			outcomes: []
		});

		expect(
			session.applyRemote({
				version: 1,
				labs: {
					'0001': { nextIndex: 9, firstTry: 7, elapsedMs: 90_000, finished: false, outcomes: [] },
					'0002': { nextIndex: 1, firstTry: 1, elapsedMs: 5_000, finished: false, outcomes: [] }
				}
			})
		).toBe(true);
		expect(session.forLab('0001')?.nextIndex).toBe(9);
		expect(session.forLab('0002')).toBeDefined();
	});

	it('ignores unknown labs and stays inert while quarantined', () => {
		const session = createLabSession(memoryStorage());
		expect(
			session.applyRemote({
				version: 1,
				labs: { '9999': { nextIndex: 1, firstTry: 0, elapsedMs: 0, finished: false, outcomes: [] } }
			})
		).toBe(false);

		const corrupt = createLabSession(memoryStorage('{not-json'));
		expect(corrupt.corrupt).toBe(true);
		expect(corrupt.applyRemote({ version: 1, labs: {} })).toBe(false);
	});
});

describe('study prefs', () => {
	it('caps the new-card trickle at the account pace', () => {
		const progress = createProgress(memoryStorage());
		progress.unlock(['lab01']);
		progress.tick();
		expect(progress.queue.length).toBe(10);

		progress.setStudyPrefs({ newPerDay: 3, reviewsPerSitting: 10 });
		expect(progress.studyPrefs.newPerDay).toBe(3);
		expect(progress.queue.length).toBe(3);
		expect(progress.stats.newLeft).toBe(3);
	});
});
