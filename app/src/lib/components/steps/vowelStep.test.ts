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
	});

	it('builds ㅏ by seating ㅣ then a tick on the right', () => {
		const onSettle = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge: () => {} });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();
		stamp('tick').click();
		flushSync();
		dock('right').click();
		flushSync();
		expect(onSettle).toHaveBeenCalled();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅏ');
	});

	it('soft-nudges when a real but wrong vowel is built', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		render(VowelStep, { step: step('ㅏ', 'a'), onSettle, onNudge });
		stamp('ㅣ').click();
		flushSync();
		dock('base').click();
		flushSync();
		stamp('tick').click();
		flushSync();
		dock('left').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalled();
		const last = onNudge.mock.calls.at(-1);
		expect(last?.[1]).toBe(true);
		expect(String(last?.[0])).toContain('ㅓ');
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
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅣ');
		press(base, 'ArrowRight');
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅡ');
		press(base, 'ArrowRight');
		expect(picker?.querySelector('[aria-selected="true"]')?.getAttribute('data-stamp')).toBe('ㅣ');
		press(base, 'ArrowRight');
		press(base, 'Enter');
		expect(onSettle).toHaveBeenCalled();
		expect(document.querySelector('[data-shape-picker]')).toBeNull();
		expect(document.querySelector('[data-dock-board]')?.textContent).toContain('ㅡ');
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
});

function press(el: HTMLElement, key: string) {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	flushSync();
}
