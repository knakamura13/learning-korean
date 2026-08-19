/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DAY_MS, RELEARN_MS } from '$lib/domain/srs';
import { memoryStorage, type Storage } from '$lib/domain/storage';
import { createProgress } from './progress.svelte';

afterEach(() => {
	vi.useRealTimers();
});

function failingDurableStore(): Storage {
	let durable = true;
	return {
		read: () => null,
		write: () => {
			durable = false;
			return false;
		},
		clear: () => {},
		get durable() {
			return durable;
		}
	};
}

describe('createProgress persistence', () => {
	it('does not overwrite a corrupt blob on tick or unlock, and exports the raw payload', () => {
		const raw = '{not-json';
		const store = memoryStorage(raw);
		const progress = createProgress(store);

		expect(progress.corrupt).toBe(true);
		progress.tick();
		expect(progress.unlock(['lab01'])).toBe(0);
		expect(store.read()).toBe(raw);
		expect(progress.export()).toBe(raw);
	});

	it('flips durable when a write fails after a successful probe', () => {
		const progress = createProgress(failingDurableStore());
		expect(progress.durable).toBe(true);
		progress.unlock(['lab01']);
		expect(progress.durable).toBe(false);
	});

	it('clears the quarantine after a successful restore', () => {
		const store = memoryStorage('{not-json');
		const progress = createProgress(store);
		const ok = progress.import(
			JSON.stringify({
				version: 1,
				unlocked: ['lab01'],
				cards: {}
			})
		);
		expect(ok).toBe(true);
		expect(progress.corrupt).toBe(false);
		expect(progress.isUnlocked('lab01')).toBe(true);
		expect(store.read()).toContain('"unlocked"');
	});

	it('keeps the unread blob if a valid restore cannot be written', () => {
		const raw = '{not-json';
		let durable = true;
		const store: Storage = {
			read: () => raw,
			write: () => {
				durable = false;
				return false;
			},
			clear: () => {},
			get durable() {
				return durable;
			}
		};
		const progress = createProgress(store);
		const ok = progress.import(
			JSON.stringify({
				version: 1,
				unlocked: ['lab01'],
				cards: {}
			})
		);
		expect(ok).toBe(false);
		expect(progress.corrupt).toBe(true);
		expect(progress.export()).toBe(raw);
		progress.tick();
		expect(store.read()).toBe(raw);
	});

	it('does not write when the queue is only read', () => {
		let writes = 0;
		const inner = memoryStorage(
			JSON.stringify({
				version: 1,
				unlocked: ['lab01'],
				openedLabs: [],
				cards: {},
				days: {},
				newDate: '',
				newCount: 0,
				newIds: []
			})
		);
		const store: Storage = {
			read: () => inner.read(),
			write: (value) => {
				writes += 1;
				return inner.write(value);
			},
			clear: () => inner.clear(),
			get durable() {
				return inner.durable;
			}
		};
		const progress = createProgress(store);
		expect(writes).toBe(0);
		expect(progress.queue.length).toBeGreaterThan(0);
		expect(writes).toBe(0);
		progress.tick();
		expect(writes).toBeGreaterThan(0);
	});

	it('grades against the clock at answer time so stats match the write', () => {
		const t0 = Date.UTC(2026, 0, 1, 12);
		vi.useFakeTimers();
		vi.setSystemTime(t0);
		const progress = createProgress(
			memoryStorage(
				JSON.stringify({
					version: 1,
					unlocked: ['lab01'],
					openedLabs: [],
					cards: {},
					days: {},
					newDate: '',
					newCount: 0,
					newIds: []
				})
			)
		);
		progress.tick();
		const id = progress.queue[0]?.id;
		expect(id).toBeTruthy();
		vi.setSystemTime(t0 + 8 * DAY_MS);
		progress.answer(id!, false, 400);
		expect(progress.state.cards[id!]?.due).toBe(t0 + 8 * DAY_MS + RELEARN_MS);
		expect(progress.stats.reviewedToday).toBe(1);
	});

	it('unlocks, grades, opens labs, and exports a readable document', () => {
		const progress = createProgress(memoryStorage());
		expect(progress.unlock(['lab01'])).toBeGreaterThan(0);
		expect(progress.unlock(['lab01'])).toBe(0);
		expect(progress.isUnlocked('lab01')).toBe(true);
		progress.tick();
		const id = progress.queue[0]?.id;
		expect(id).toBeTruthy();
		progress.grade(id!, 0);
		expect(progress.state.cards[id!]).toBeTruthy();
		expect(progress.nextDue).toEqual(expect.any(Number));
		expect(progress.weakest.length).toBeGreaterThan(0);
		expect(progress.stats.unlocked).toBeGreaterThan(0);
		expect(progress.tierProgress.some((row) => row.id === 'lab01' && row.unlocked)).toBe(true);
		expect(JSON.parse(progress.export()).version).toBe(1);
		progress.openLab('0001');
		expect(progress.isOpened('0001')).toBe(true);
		progress.openLab('0001');
		progress.reset();
		expect(progress.isUnlocked('lab01')).toBe(false);
		expect(progress.corrupt).toBe(false);
	});

	it('rejects an import that is not an SRS document', () => {
		const progress = createProgress(memoryStorage());
		expect(progress.import('{"nope":true}')).toBe(false);
	});
});
