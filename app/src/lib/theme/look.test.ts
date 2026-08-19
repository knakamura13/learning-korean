// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { academia } from './systems/academia';
import { DEFAULT_LOOK_ID } from './catalog';
import { LOOK_KEY, readLookId, writeLookId, paperFor } from './look';

describe('readLookId', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-look');
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-look');
	});

	it('round-trips taegeuk', () => {
		expect(writeLookId('taegeuk')).toBe(true);
		expect(readLookId()).toBe('taegeuk');
		expect(localStorage.getItem(LOOK_KEY)).toBe('taegeuk');
	});

	it.each([null, '', 'nope'] as const)(
		'returns botanicalKorea for %j without rewriting storage',
		(stored) => {
			if (stored === null) localStorage.removeItem(LOOK_KEY);
			else localStorage.setItem(LOOK_KEY, stored);

			const setItem = vi.spyOn(Storage.prototype, 'setItem');
			const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

			expect(readLookId()).toBe(DEFAULT_LOOK_ID);
			expect(setItem).not.toHaveBeenCalled();
			expect(removeItem).not.toHaveBeenCalled();

			setItem.mockRestore();
			removeItem.mockRestore();
		}
	);

	it('returns default when getItem throws', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});

		expect(readLookId()).toBe(DEFAULT_LOOK_ID);
	});
});

describe('writeLookId', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.setAttribute('data-look', 'taegeuk');
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-look');
		vi.restoreAllMocks();
	});

	it('returns false when setItem throws and does not change data-look', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota');
		});

		expect(writeLookId('watercolor')).toBe(false);
		expect(document.documentElement.getAttribute('data-look')).toBe('taegeuk');
	});
});

describe('paperFor', () => {
	it('returns the system paper for the resolved scheme', () => {
		expect(paperFor('academia', 'dark')).toBe(academia.dark.paper);
	});
});
