// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { motion } from './motion';

function stubMatchMedia(reduceMotion: boolean) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
}

describe('motion', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('passes transition params through when motion is preferred', () => {
		stubMatchMedia(false);
		expect(motion({ y: 10, duration: 220 })).toEqual({ y: 10, duration: 220 });
		expect(motion({ duration: 150 })).toEqual({ duration: 150 });
		expect(motion()).toEqual({});
	});

	it('zeros duration when the learner prefers reduced motion', () => {
		stubMatchMedia(true);
		expect(motion({ y: 10, duration: 220 })).toEqual({ y: 10, duration: 0 });
		expect(motion({ duration: 150 })).toEqual({ duration: 0 });
		expect(motion()).toEqual({ duration: 0 });
	});

	it('treats a missing matchMedia as no preference', () => {
		vi.stubGlobal('matchMedia', undefined);
		expect(motion({ duration: 200 })).toEqual({ duration: 200 });
	});
});
