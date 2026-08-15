import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import labRunner from './components/LabRunner.svelte?raw';
import themeToggle from './components/ThemeToggle.svelte?raw';
import viteConfig from '../../vite.config.ts?raw';

const appCss = readFileSync(new URL('../app.css', import.meta.url), 'utf8');

describe('polish audit regressions', () => {
	it('requires confirmation before clearing a completed lab session', () => {
		expect(labRunner).toMatch(/let confirmingRestart = \$state\(false\)/);
		expect(labRunner).toMatch(/function requestRestart\(\)[\s\S]*confirmingRestart = true/);
		expect(labRunner).toMatch(/onclick=\{requestRestart\}/);
		expect(labRunner).toMatch(/Start over\? Your completed lab summary will be cleared\./);
		expect(labRunner).toMatch(/onclick=\{confirmRestart\}/);
	});

	it('gives the theme control pressed-state feedback', () => {
		expect(themeToggle).toMatch(/\.theme:active\s*\{/);
	});

	it('uses logical properties in shared directional layout', () => {
		expect(appCss).not.toMatch(/\bmargin-left\s*:/);
		expect(labRunner).not.toMatch(/\bleft\s*:\s*0/);
	});

	it('prevents a late Hangul font swap from causing layout shift', () => {
		expect(appCss).toMatch(/font-display:\s*optional/);
	});

	it('makes the Baseline Widely Available browser target explicit', () => {
		expect(viteConfig).toMatch(/build:\s*\{[\s\S]*?target:\s*'baseline-widely-available'/);
	});
});
