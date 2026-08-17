import { describe, expect, it } from 'vitest';
import { isThemePref, nextThemePref, PAPER_DARK, PAPER_LIGHT, resolvedTheme } from './index';
import { activeSystem } from './active';

describe('isThemePref', () => {
	it('accepts the three stored values', () => {
		expect(isThemePref('light')).toBe(true);
		expect(isThemePref('dark')).toBe(true);
		expect(isThemePref('system')).toBe(true);
		expect(isThemePref('auto')).toBe(false);
		expect(isThemePref(null)).toBe(false);
	});
});

describe('resolvedTheme', () => {
	it('honors an explicit choice', () => {
		expect(resolvedTheme('light', true)).toBe('light');
		expect(resolvedTheme('dark', false)).toBe('dark');
	});

	it('follows the system flag when unset', () => {
		expect(resolvedTheme('system', true)).toBe('dark');
		expect(resolvedTheme('system', false)).toBe('light');
	});
});

describe('nextThemePref', () => {
	it('cycles light → dark → system → light', () => {
		expect(nextThemePref('light')).toBe('dark');
		expect(nextThemePref('dark')).toBe('system');
		expect(nextThemePref('system')).toBe('light');
	});
});

describe('paper colours', () => {
	it('come from the active design system', () => {
		expect(PAPER_LIGHT).toBe(activeSystem.light.paper);
		expect(PAPER_DARK).toBe(activeSystem.dark.paper);
	});
});
