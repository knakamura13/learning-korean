// @vitest-environment jsdom
/**
 * Composer trays are independent slots. Duplicate glyphs (Lab 03 fusion
 * first/second both include ㅏ/ㅓ; Lab 04 assemble top/batchim both include ㅂ)
 * must not share a click target.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import Tray from './Tray.svelte';
import FusionStep from './steps/FusionStep.svelte';
import AssembleStep from './steps/AssembleStep.svelte';
import type { AssembleStep as AssembleStepData, FusionStep as FusionStepData } from '$lib/content/types';

type Mounted = Record<string, never>;
const mounted: Mounted[] = [];

function render<P extends Record<string, unknown>>(
	component: Component<P>,
	props: P
): HTMLElement {
	const instance = mount(component, { target: document.body, props });
	mounted.push(instance);
	flushSync();
	return document.body;
}

afterEach(() => {
	while (mounted.length) unmount(mounted.pop()!);
	document.body.innerHTML = '';
});

function labeledGroup(root: ParentNode, label: string): HTMLElement {
	const groups = [...root.querySelectorAll<HTMLElement>('[role="radiogroup"]')];
	const match = groups.find((group) => {
		const id = group.getAttribute('aria-labelledby');
		if (!id) return false;
		return document.getElementById(id)?.textContent?.trim() === label;
	});
	if (!match) throw new Error(`no radiogroup labeled "${label}"`);
	return match;
}

function radios(group: HTMLElement): HTMLElement[] {
	return [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
}

function radioNamed(group: HTMLElement, glyph: string): HTMLElement {
	const hit = radios(group).find(
		(el) =>
			el.getAttribute('aria-label') === `${groupLabel(group)}: ${glyph}` ||
			el.textContent?.replace(/\s+/g, ' ').includes(glyph)
	);
	if (!hit) throw new Error(`no radio "${glyph}" in ${groupLabel(group)}`);
	return hit;
}

function groupLabel(group: HTMLElement): string {
	const id = group.getAttribute('aria-labelledby');
	return id ? (document.getElementById(id)?.textContent?.trim() ?? '') : '';
}

function slotValues(root: ParentNode): string[] {
	return [...root.querySelectorAll('.slot-value')].map((el) => el.textContent ?? '');
}

const fusionStep: FusionStepData = {
	type: 'fusion',
	do: 'Fuse',
	teach: 'ok',
	target: 'ㅝ',
	targetName: 'wo',
	first: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ'],
	second: ['ㅣ', 'ㅏ', 'ㅓ']
};

const assembleStep: AssembleStepData = {
	type: 'assemble',
	do: 'Build',
	teach: 'ok',
	target: '밥',
	targetName: 'bap',
	consonants: ['ㅂ', 'ㄷ', 'ㅁ'],
	vowels: ['ㅏ', 'ㅜ'],
	finals: ['ㅂ', 'ㄱ', 'ㅅ']
};

describe('Tray', () => {
	it('exposes one labeled radiogroup whose chips name the slot', () => {
		render(Tray, {
			label: 'second vowel',
			items: ['ㅣ', 'ㅏ', 'ㅓ'],
			selected: null,
			onSelect: () => {}
		});

		const group = labeledGroup(document.body, 'second vowel');
		expect(radios(group)).toHaveLength(3);
		const eo = radioNamed(group, 'ㅓ');
		expect(eo.getAttribute('role')).toBe('radio');
		expect(eo.getAttribute('aria-checked')).toBe('false');
		expect(eo.getAttribute('aria-label')).toBe('second vowel: ㅓ');
	});

	it('marks the selected chip checked and visually on', () => {
		render(Tray, {
			label: 'first vowel',
			items: ['ㅏ', 'ㅓ'],
			selected: 'ㅓ',
			onSelect: () => {}
		});

		const group = labeledGroup(document.body, 'first vowel');
		const eo = radioNamed(group, 'ㅓ');
		const a = radioNamed(group, 'ㅏ');
		expect(eo.getAttribute('aria-checked')).toBe('true');
		expect(eo.classList.contains('on')).toBe(true);
		expect(a.getAttribute('aria-checked')).toBe('false');
		expect(a.classList.contains('on')).toBe(false);
		expect(group.classList.contains('picked')).toBe(true);
		expect(eo.textContent).toMatch(/first/i);
	});

	it('keeps disabled chips unclickable', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'tick side',
			items: ['left', 'right'],
			selected: null,
			text: true,
			disabled: true,
			onSelect
		});

		const group = labeledGroup(document.body, 'tick side');
		expect(group.getAttribute('aria-disabled')).toBe('true');
		radioNamed(group, 'left').click();
		flushSync();
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('gives only the checked chip a tab stop, or the first chip when nothing is picked', () => {
		render(Tray, {
			label: 'base stroke',
			items: ['ㅣ', 'ㅡ'],
			selected: null,
			onSelect: () => {}
		});
		const unpicked = labeledGroup(document.body, 'base stroke');
		expect(radioNamed(unpicked, 'ㅣ').getAttribute('tabindex')).toBe('0');
		expect(radioNamed(unpicked, 'ㅡ').getAttribute('tabindex')).toBe('-1');

		render(Tray, {
			label: 'first vowel',
			items: ['ㅏ', 'ㅓ'],
			selected: 'ㅓ',
			onSelect: () => {}
		});
		const picked = labeledGroup(document.body, 'first vowel');
		expect(radioNamed(picked, 'ㅏ').getAttribute('tabindex')).toBe('-1');
		expect(radioNamed(picked, 'ㅓ').getAttribute('tabindex')).toBe('0');
	});

	it('moves focus and picks with the arrow keys, wrapping past either end', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'ticks',
			items: ['none', 'one', 'two'],
			selected: null,
			text: true,
			onSelect
		});
		const group = labeledGroup(document.body, 'ticks');
		const [none, one, two] = radios(group);

		none.focus();
		none.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(document.activeElement).toBe(one);
		expect(onSelect).toHaveBeenLastCalledWith('one');

		one.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(document.activeElement).toBe(two);
		expect(onSelect).toHaveBeenLastCalledWith('two');

		two.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(document.activeElement).toBe(none);
		expect(onSelect).toHaveBeenLastCalledWith('none');

		none.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
		expect(document.activeElement).toBe(two);
		expect(onSelect).toHaveBeenLastCalledWith('two');

		two.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		expect(document.activeElement).toBe(one);
		expect(onSelect).toHaveBeenLastCalledWith('one');
	});

	it('ignores arrow keys while disabled', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'tick side',
			items: ['left', 'right'],
			selected: null,
			text: true,
			disabled: true,
			onSelect
		});
		const group = labeledGroup(document.body, 'tick side');
		const [left] = radios(group);
		left.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(onSelect).not.toHaveBeenCalled();
	});
});

describe('FusionStep trays', () => {
	it('does not change the first slot when second-tray ㅓ is activated', () => {
		const root = render(FusionStep, {
			step: fusionStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		const first = labeledGroup(root, 'first vowel');
		const second = labeledGroup(root, 'second vowel');
		expect(radioNamed(first, 'ㅓ')).toBeTruthy();
		expect(radioNamed(second, 'ㅓ')).toBeTruthy();

		radioNamed(first, 'ㅜ').click();
		flushSync();
		radioNamed(second, 'ㅓ').click();
		flushSync();

		expect(radioNamed(first, 'ㅜ').getAttribute('aria-checked')).toBe('true');
		expect(radioNamed(first, 'ㅓ').getAttribute('aria-checked')).toBe('false');
		expect(radioNamed(second, 'ㅓ').getAttribute('aria-checked')).toBe('true');

		const [slotA, slotB] = slotValues(root);
		expect(slotA).toBe('ㅜ');
		expect(slotB).toBe('ㅓ');
		const slotEls = [...root.querySelectorAll<HTMLElement>('.slot')];
		expect(slotEls[0].classList.contains('on')).toBe(true);
		expect(slotEls[1].classList.contains('on')).toBe(true);
		expect(slotEls[0].querySelector('.slot-name')?.textContent).toBe('first');
		expect(slotEls[1].querySelector('.slot-name')?.textContent).toBe('second');
		expect(root.querySelector('.out')?.textContent).not.toContain('✕');
	});
});

describe('AssembleStep trays', () => {
	it('does not change the lead slot when batchim ㅂ is activated', () => {
		const root = render(AssembleStep, {
			step: assembleStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		const lead = labeledGroup(root, 'first consonant');
		const vowel = labeledGroup(root, 'vowel');
		const batchim = labeledGroup(root, 'batchim — the bottom slot');

		radioNamed(lead, 'ㅁ').click();
		flushSync();
		radioNamed(vowel, 'ㅏ').click();
		flushSync();
		radioNamed(batchim, 'ㅂ').click();
		flushSync();

		expect(radioNamed(lead, 'ㅁ').getAttribute('aria-checked')).toBe('true');
		expect(radioNamed(lead, 'ㅂ').getAttribute('aria-checked')).toBe('false');
		expect(radioNamed(batchim, 'ㅂ').getAttribute('aria-checked')).toBe('true');

		const [slotLead, slotVowel, slotFinal] = slotValues(root);
		expect(slotLead).toBe('ㅁ');
		expect(slotVowel).toBe('ㅏ');
		expect(slotFinal).toBe('ㅂ');
	});
});
