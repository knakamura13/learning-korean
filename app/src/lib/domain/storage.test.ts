/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage, memoryStorage } from './storage';

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe('memoryStorage', () => {
	it('reports writes as successful even though they are not durable', () => {
		const store = memoryStorage(null);
		expect(store.durable).toBe(false);
		expect(store.write('{"v":1}')).toBe(true);
		expect(store.read()).toBe('{"v":1}');
	});
});

describe('browserStorage', () => {
	it('stays durable when localStorage accepts the write', () => {
		const store = browserStorage('korean-srs-v1');
		expect(store.durable).toBe(true);
		expect(store.write('{"version":1}')).toBe(true);
		expect(store.durable).toBe(true);
		expect(store.read()).toBe('{"version":1}');
	});

	it('falls back to memory and durable:false when the probe fails', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		const store = browserStorage('korean-srs-v1');
		expect(store.durable).toBe(false);
		expect(store.write('in-memory')).toBe(true);
		expect(store.read()).toBe('in-memory');
	});

	it('flips durable and reports failure when a later write is quota-blocked', () => {
		const store = browserStorage('korean-srs-v1');
		expect(store.durable).toBe(true);

		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});
		expect(store.write('too-big')).toBe(false);
		expect(store.durable).toBe(false);
	});
});
