// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import VowelStep from './VowelStep.svelte';
import type { VowelStep as VowelStepData } from '$lib/content/types';

const mounted: Record<string, never>[] = [];

function render<P extends Record<string, unknown>>(component: Component<P>, props: P): HTMLElement {
	const instance = mount(component, { target: document.body, props });
	mounted.push(instance);
	flushSync();
	return document.body;
}

afterEach(() => {
	while (mounted.length) unmount(mounted.pop()!);
	document.body.innerHTML = '';
});

function step(target: string, targetName = 'x'): VowelStepData {
	return { type: 'vowel', do: 'Build', teach: 'ok', target, targetName };
}

function palette(): HTMLElement {
	const groups = [...document.querySelectorAll<HTMLElement>('[role="radiogroup"]')];
	const match = groups.find((group) => {
		const id = group.getAttribute('aria-labelledby');
		return id ? document.getElementById(id)?.textContent?.trim() === 'strokes' : false;
	});
	if (!match) throw new Error('no strokes palette');
	return match;
}

function stamp(name: string): HTMLElement {
	const hit = [...palette().querySelectorAll<HTMLElement>('[role="radio"]')].find(
		(el) => el.getAttribute('aria-label') === `strokes: ${name}`
	);
	if (!hit) throw new Error(`no stamp ${name}`);
	return hit;
}

function dock(id: string): HTMLElement {
	const el = document.querySelector<HTMLElement>(`[data-dock="${id}"]`);
	if (!el) throw new Error(`no dock ${id}`);
	return el;
}

function shownDocks(): string[] {
	return [...document.querySelectorAll<HTMLElement>('[data-dock]')].map((el) => el.dataset.dock!);
}

function openDocks(): string[] {
	return [...document.querySelectorAll<HTMLElement>('[data-dock]')].flatMap((el) =>
		el.classList.contains('held') ? [] : [el.dataset.dock!]
	);
}

describe('VowelStep dock board', () => {
	it('exposes a strokes palette and no ticks or side trays', () => {
		render(VowelStep, { step: step('ㅣ'), onSettle: () => {}, onNudge: () => {} });
		expect(palette()).toBeTruthy();
		expect(document.querySelector('[aria-labelledby]')?.textContent).not.toMatch(/tick side/i);
		expect(document.body.textContent).not.toMatch(/\bnone\b.*\bone\b.*\btwo\b/s);
		expect(document.querySelector('[data-dock-board]')).toBeTruthy();
		expect(document.querySelector('.slot')).toBeNull();
	});

	it('settles a bare standing stroke from palette then base dock', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅣ', 'i'), onSettle, onNudge: () => {} });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅣ');
		expect(document.querySelectorAll('[data-dock]')).toHaveLength(0);
	});

	it('builds ㅏ by seating ㅣ then a tick on the right', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge: () => {} });
		expect(shownDocks()).toEqual(['base', 'right']);
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();
		expect(shownDocks()).toEqual(['base', 'right']);
		expect(openDocks()).toEqual(['right']);
		expect(document.querySelector('[data-dock="left"]')).toBeNull();
		stamp('tick').click();
		flushSync();
		dock('right').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅏ');
		expect(document.querySelectorAll('[data-dock]')).toHaveLength(0);
	});

	it('does not treat the correct first stroke as a miss', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).not.toHaveBeenCalled();
	});

	it('soft-nudges when a real but wrong vowel is built', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge });
		stamp('ㅡ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalled();
		const last = onNudge.mock.calls.at(-1);
		expect(last?.[1]).toBe(true);
		expect(String(last?.[0])).toContain('ㅡ');
		expect(shownDocks()).toEqual(['base']);
		expect(document.querySelector('[data-dock="right"]')).toBeNull();
	});

	it('seats a tick on click even when the base stamp is still selected', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge: () => {} });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(stamp('ㅣ').getAttribute('aria-checked')).toBe('true');
		dock('right').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
	});

	it('lays out empty ㅛ like the letter, not a stacked column', () => {
		render(VowelStep, { step: step('ㅛ', 'yo'), onSettle: () => {}, onNudge: () => {} });
		expect(shownDocks()).toEqual(['base', 'above', 'above2']);
		expect(dock('above').style.top).toBe(dock('above2').style.top);
		expect(dock('above').style.left).not.toBe(dock('above2').style.left);
		const aboveLeft = parseFloat(dock('above').style.left);
		const above2Left = parseFloat(dock('above2').style.left);
		expect(aboveLeft).toBeLessThan(above2Left);
	});

	it('starts earth-vowel cards on the earth stroke', () => {
		render(VowelStep, { step: step('ㅛ', 'yo'), onSettle: () => {}, onNudge: () => {} });
		expect(stamp('ㅡ').getAttribute('aria-checked')).toBe('true');
		expect(stamp('ㅣ').getAttribute('aria-checked')).toBe('false');
		expect(document.querySelector('.tick-mark')?.classList.contains('upright')).toBe(true);
	});

	it('keeps a lone ㅗ hole on the midline', () => {
		render(VowelStep, { step: step('ㅗ', 'o'), onSettle: () => {}, onNudge: () => {} });
		expect(shownDocks()).toEqual(['base', 'above']);
		expect(dock('above').style.left).toBe('50%');
	});

	it('adds the y-glide with a second tick on the same side', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅑ', 'ya'), onSettle, onNudge: () => {} });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		stamp('tick').click();
		flushSync();
		dock('right').click();
		flushSync();
		dock('right2').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
	});

	it('stamps the selected piece onto a focused dock with Enter', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅣ', 'i'), onSettle, onNudge: () => {} });
		stamp('ㅣ').click();
		flushSync();
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		expect(document.querySelector('[data-shape-picker]')).toBeTruthy();
		expect(onSettle).not.toHaveBeenCalled();
		press(base, 'Enter');
		expect(onSettle).toHaveBeenCalled();
	});

	it('cycles the dock picker with arrows and wraps', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅡ', 'eu'), onSettle, onNudge: () => {} });
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		const picker = document.querySelector('[data-shape-picker]');
		expect(picker).toBeTruthy();
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅡ');
		press(base, 'ArrowRight');
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅣ');
		press(base, 'ArrowRight');
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅡ');
		press(base, 'Enter');
		expect(onSettle).toHaveBeenCalled();
		expect(document.querySelector('[data-shape-picker]')).toBeNull();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅡ');
	});

	it('opens the base picker on the selected palette stroke', () => {
		render(VowelStep, { step: step('ㅗ', 'o'), onSettle: () => {}, onNudge: () => {} });
		expect(stamp('ㅡ').getAttribute('aria-checked')).toBe('true');
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		expect(
			document.querySelector('[data-shape-picker] [aria-selected="true"]')?.getAttribute('data-stamp')
		).toBe('ㅡ');
	});

	it('places a tick immediately when the dock only accepts a tick', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge: () => {} });
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		press(base, 'Enter');
		expect(onSettle).not.toHaveBeenCalled();
		const right = dock('right');
		right.focus();
		press(right, 'Enter');
		expect(document.querySelector('[data-shape-picker]')).toBeNull();
		expect(onSettle).toHaveBeenCalled();
	});

	it('keeps the picker open when a native button click follows Enter', () => {
		render(VowelStep, { step: step('ㅡ', 'eu'), onSettle: () => {}, onNudge: () => {} });
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		base.click();
		flushSync();
		expect(document.querySelector('[data-shape-picker]')).toBeTruthy();
		expect(dock('base').getAttribute('aria-label')).toMatch(/empty/);
	});

	it('moves ArrowRight from the standing stroke to the right tick dock', () => {
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle: () => {}, onNudge: () => {} });
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		press(base, 'Enter');
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅣ');
		press(base, 'ArrowRight');
		expect(document.activeElement).toBe(dock('right'));
	});

	it('closes the picker when focus leaves the dock', () => {
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle: () => {}, onNudge: () => {} });
		const base = dock('base');
		base.focus();
		press(base, 'Enter');
		expect(document.querySelector('[data-shape-picker]')).toBeTruthy();
		stamp('ㅡ').focus();
		base.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: stamp('ㅡ') }));
		flushSync();
		expect(document.querySelector('[data-shape-picker]')).toBeNull();
	});

	it('still places on the next click after a drag that missed the board', async () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅣ', 'i'), onSettle, onNudge: () => {} });
		const chip = stamp('ㅣ');
		chip.setPointerCapture = () => {};
		firePointer(chip, 'pointerdown', 8, 8);
		firePointer(window, 'pointermove', 80, 80);
		flushSync();
		firePointer(window, 'pointerup', 80, 80);
		flushSync();
		await Promise.resolve();
		dock('base').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
	});

	it('teaches that the earth stroke must be seated before a tick on ㅗ', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		render(VowelStep, { step: step('ㅗ', 'o'), onSettle, onNudge });
		dock('above').click();
		flushSync();
		const tip = document.querySelector('[data-tick-hint]');
		expect(tip).toBeTruthy();
		expect(tip?.textContent).toMatch(/earth stroke/i);
		expect(tip?.textContent).toMatch(/modifier/i);
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).not.toHaveBeenCalled();
		expect(document.querySelector('[data-dock-board]')?.textContent).not.toContain('ㅗ');
	});

	it('dismisses the tick-first hint once the long stroke is seated', () => {
		render(VowelStep, { step: step('ㅗ', 'o'), onSettle: () => {}, onNudge: () => {} });
		dock('above').click();
		flushSync();
		expect(document.querySelector('[data-tick-hint]')).toBeTruthy();
		dock('base').click();
		flushSync();
		expect(document.querySelector('[data-tick-hint]')).toBeNull();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅡ');
	});

	it('shows the standing-stroke hint from the keyboard on an empty ㅏ tick hole', () => {
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle: () => {}, onNudge: () => {} });
		const right = dock('right');
		right.focus();
		press(right, 'Enter');
		const tip = document.querySelector('[data-tick-hint]');
		expect(tip).toBeTruthy();
		expect(tip?.textContent).toMatch(/standing stroke/i);
	});
});

function press(el: HTMLElement, key: string) {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	flushSync();
}

function firePointer(target: EventTarget, type: string, x: number, y: number) {
	const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
	Object.defineProperty(event, 'pointerId', { value: 1, configurable: true });
	target.dispatchEvent(event);
}
