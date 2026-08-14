import { describe, expect, it } from 'vitest';
import {
	clearLab,
	emptySessions,
	resumable,
	reviveSessions,
	upsertLab,
	type LabProgress
} from './labSession';
import { emptyOutcomes } from './pipState';

const COUNTS = { '0001': 17, '0002': 16 };

const mid: LabProgress = {
	nextIndex: 7,
	firstTry: 5,
	elapsedMs: 90_000,
	finished: false,
	outcomes: emptyOutcomes(17)
};

describe('reviveSessions', () => {
	it('starts empty', () => {
		expect(emptySessions()).toEqual({ version: 1, labs: {} });
		expect(reviveSessions(null, COUNTS).labs).toEqual({});
		expect(reviveSessions('nonsense', COUNTS).labs).toEqual({});
	});

	it('keeps a well-formed in-progress lab', () => {
		const revived = reviveSessions({ version: 1, labs: { '0001': mid } }, COUNTS);
		expect(revived.labs['0001']).toEqual(mid);
	});

	it('drops unknown labs and out-of-range indexes', () => {
		const revived = reviveSessions(
			{
				version: 1,
				labs: {
					'9999': mid,
					'0001': { ...mid, nextIndex: 40 },
					'0002': { nextIndex: 3, firstTry: -1, elapsedMs: 0, finished: false }
				}
			},
			COUNTS
		);
		expect(revived.labs).toEqual({});
	});

	it('treats nextIndex at the end as finished', () => {
		const revived = reviveSessions(
			{ version: 1, labs: { '0001': { nextIndex: 17, firstTry: 14, elapsedMs: 100, finished: false } } },
			COUNTS
		);
		expect(revived.labs['0001']?.finished).toBe(true);
		expect(revived.labs['0001']?.nextIndex).toBe(17);
	});

	it('accepts a bare labs map so a future wrapper bump does not discard place', () => {
		const revived = reviveSessions({ '0001': mid }, COUNTS);
		expect(revived.labs['0001']).toEqual(mid);
	});

	it('pads missing outcomes so a pre-pip session still resumes', () => {
		const revived = reviveSessions(
			{
				version: 1,
				labs: { '0001': { nextIndex: 7, firstTry: 5, elapsedMs: 90_000, finished: false } }
			},
			COUNTS
		);
		expect(revived.labs['0001']?.outcomes).toEqual(emptyOutcomes(17));
	});

	it('keeps recorded right/wrong marks on revive', () => {
		const outcomes = emptyOutcomes(17);
		outcomes[0] = 'right';
		outcomes[1] = 'wrong';
		const revived = reviveSessions(
			{ version: 1, labs: { '0001': { ...mid, outcomes } } },
			COUNTS
		);
		expect(revived.labs['0001']?.outcomes[0]).toBe('right');
		expect(revived.labs['0001']?.outcomes[1]).toBe('wrong');
	});
});

describe('upsert and clear', () => {
	it('writes a new lab and is a no-op when unchanged', () => {
		const first = upsertLab(emptySessions(), '0001', mid, 17);
		expect(first.labs['0001']).toEqual(mid);
		expect(upsertLab(first, '0001', mid, 17)).toBe(first);
	});

	it('clears one lab without touching another', () => {
		let s = upsertLab(emptySessions(), '0001', mid, 17);
		s = upsertLab(s, '0002', { ...mid, nextIndex: 2 }, 16);
		s = clearLab(s, '0001');
		expect(s.labs['0001']).toBeUndefined();
		expect(s.labs['0002']?.nextIndex).toBe(2);
		expect(clearLab(s, '0001')).toBe(s);
	});
});

describe('resumable', () => {
	it('is only true for a mid-lab sitting', () => {
		expect(resumable(mid, 17)?.nextIndex).toBe(7);
		expect(resumable({ ...mid, nextIndex: 0 }, 17)).toBeNull();
		expect(resumable({ ...mid, finished: true }, 17)).toBeNull();
		expect(resumable({ ...mid, nextIndex: 17, finished: true }, 17)).toBeNull();
		expect(resumable(undefined, 17)).toBeNull();
	});
});
