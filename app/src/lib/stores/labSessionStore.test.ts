import { describe, expect, it } from 'vitest';
import { memoryStorage, type Storage } from '$lib/domain/storage';
import { createLabSession } from './labSession.svelte';

const mid = {
	nextIndex: 2,
	firstTry: 1,
	elapsedMs: 1_000,
	finished: false,
	outcomes: [null, null, null]
};

describe('createLabSession persistence', () => {
	it('flips durable when a write fails after a successful probe', () => {
		let durable = true;
		const store: Storage = {
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
		const session = createLabSession(store);
		expect(session.durable).toBe(true);
		session.save('0001', mid);
		expect(session.durable).toBe(false);
	});

	it('replaces every lab from a backup snapshot', () => {
		const session = createLabSession(memoryStorage());
		session.save('0001', mid);
		session.replaceAll({
			version: 1,
			labs: { '0002': { ...mid, nextIndex: 1, outcomes: [null, null] } }
		});
		expect(session.forLab('0001')).toBeUndefined();
		expect(session.forLab('0002')?.nextIndex).toBe(1);
		expect(session.snapshot.labs['0002']).toBeTruthy();
	});

	it('reset clears place and restores the adapter durable flag', () => {
		const store = memoryStorage();
		const session = createLabSession(store);
		session.save('0001', mid);
		session.reset();
		expect(session.forLab('0001')).toBeUndefined();
		expect(session.durable).toBe(store.durable);
	});

	it('loads an empty sitting from missing or unreadable storage', () => {
		expect(createLabSession(memoryStorage()).all).toEqual({});
		expect(createLabSession(memoryStorage('{not-json')).all).toEqual({});
		expect(createLabSession(memoryStorage('null')).all).toEqual({});
	});

	it('saves, lists, and clears a known lab and ignores unknown ids', () => {
		const session = createLabSession(memoryStorage());
		session.save('unknown-lab', mid);
		expect(session.all).toEqual({});
		session.save('0001', mid);
		expect(session.all['0001']?.nextIndex).toBe(2);
		session.clear('0001');
		expect(session.forLab('0001')).toBeUndefined();
		session.clear('0001');
	});
});
