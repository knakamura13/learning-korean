/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { browserStorage, memoryStorage, type Storage } from '$lib/domain/storage';
import { LABS } from '$lib/content';
import { createLabSession, LAB_STEP_COUNTS } from './labSession.svelte';

const mid = {
	nextIndex: 2,
	firstTry: 1,
	elapsedMs: 1_000,
	finished: false,
	outcomes: [null, null, null]
};

afterEach(() => {
	localStorage.clear();
	window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
});

describe('LAB_STEP_COUNTS', () => {
	it('is the sitting length map restore uses, one entry per lab', () => {
		expect(Object.keys(LAB_STEP_COUNTS).sort()).toEqual(LABS.map((lab) => lab.id).sort());
		for (const lab of LABS) {
			expect(LAB_STEP_COUNTS[lab.id]).toBe(lab.steps.length);
		}
	});
});

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

	it('loads an empty sitting from missing storage', () => {
		expect(createLabSession(memoryStorage()).all).toEqual({});
	});

	it('does not overwrite a corrupt sitting blob on save', () => {
		const raw = '{not-json';
		const store = memoryStorage(raw);
		const session = createLabSession(store);
		expect(session.corrupt).toBe(true);
		expect(session.all).toEqual({});
		session.save('0001', mid);
		expect(store.read()).toBe(raw);
	});

	it('clears the sitting quarantine after reset', () => {
		const store = memoryStorage('{not-json');
		const session = createLabSession(store);
		expect(session.corrupt).toBe(true);
		session.reset();
		expect(session.corrupt).toBe(false);
		expect(store.read()).toBeNull();
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

	it('adopts a sitting write from another tab', () => {
		const key = 'korean-lab-session-v1';
		localStorage.removeItem(key);
		const session = createLabSession(browserStorage(key));
		expect(session.forLab('0001')).toBeUndefined();

		localStorage.setItem(
			key,
			JSON.stringify({
				version: 1,
				labs: { '0001': mid }
			})
		);
		window.dispatchEvent(
			new StorageEvent('storage', {
				key,
				newValue: localStorage.getItem(key),
				storageArea: localStorage
			})
		);
		expect(session.forLab('0001')?.nextIndex).toBe(2);
	});
});
