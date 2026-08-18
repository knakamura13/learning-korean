import { describe, expect, it } from 'vitest';
import {
	isThemePref,
	nextThemePref,
	PAPER_DARK,
	PAPER_LIGHT,
	resolvedTheme,
	themeToggleGlyph,
	themeToggleLabel
} from './index';
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

describe('themeToggleGlyph', () => {
	it('shows the resolved sun or moon on first visit (empty storage → system)', () => {
		expect(themeToggleGlyph('system', false)).toBe('sun');
		expect(themeToggleGlyph('system', true)).toBe('moon');
	});

	it('honors an explicit choice over the system scheme', () => {
		expect(themeToggleGlyph('light', true)).toBe('sun');
		expect(themeToggleGlyph('dark', false)).toBe('moon');
	});
});

describe('themeToggleLabel', () => {
	it('names the stored pref, system follow-through, and the next cycle step', () => {
		expect(themeToggleLabel('system', false)).toBe('Theme: System, following Light. Next: Light');
		expect(themeToggleLabel('system', true)).toBe('Theme: System, following Dark. Next: Light');
		expect(themeToggleLabel('light', true)).toBe('Theme: Light. Next: Dark');
		expect(themeToggleLabel('dark', false)).toBe('Theme: Dark. Next: System');
	});
});

describe('paper colours', () => {
	it('come from the active design system', () => {
		expect(PAPER_LIGHT).toBe(activeSystem.light.paper);
		expect(PAPER_DARK).toBe(activeSystem.dark.paper);
	});
});
