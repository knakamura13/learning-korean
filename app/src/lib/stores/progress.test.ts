/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { memoryStorage, type Storage } from '$lib/domain/storage';
import { createProgress } from './progress.svelte';

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
		progress.unlock(['lab01']);
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
});
