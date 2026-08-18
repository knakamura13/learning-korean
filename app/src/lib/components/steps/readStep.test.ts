// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import ReadStep from './ReadStep.svelte';
import type { ReadStep as ReadStepData } from '$lib/content/types';
import { CHOICE_RETRY_COPY } from '$lib/domain/advancePick';

beforeAll(() => {
	Element.prototype.animate = vi.fn().mockReturnValue({
		finished: Promise.resolve(),
		cancel: vi.fn(),
		finish: vi.fn(),
		play: vi.fn(),
		pause: vi.fn()
	});
});

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

function optionButton(root: HTMLElement, text: string): HTMLButtonElement {
	const btn = [...root.querySelectorAll<HTMLButtonElement>('button.opt')].find(
		(b) => b.querySelector('.txt')?.textContent === text
	);
	if (!btn) throw new Error(`no option "${text}"`);
	return btn;
}

function openAllBlocks(root: HTMLElement) {
	for (const btn of root.querySelectorAll<HTMLButtonElement>('.blk')) {
		btn.click();
	}
	flushSync();
}

const teach = '<p><strong>ya-gu</strong> — baseball. From 野球, the same characters Japanese uses.</p>';

const step: ReadStepData = {
	type: 'read',
	do: 'One glide, one wide vowel.',
	teach,
	blocks: [
		{ block: '야', reading: 'ya' },
		{ block: '구', reading: 'gu' }
	],
	options: ['baseball', 'birthday', 'bookcase', 'backpack'],
	answer: 0
};

describe('ReadStep', () => {
	it('nudges a wrong identification and leaves the other options open', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(ReadStep, { step, onSettle, onNudge });
		openAllBlocks(el);

		optionButton(el, 'bookcase').click();
		flushSync();

		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledWith(CHOICE_RETRY_COPY);
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(false);
		expect(optionButton(el, 'baseball').disabled).toBe(false);
	});

	it('settles once the learner picks the right word after a miss', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(ReadStep, { step, onSettle, onNudge });
		openAllBlocks(el);

		optionButton(el, 'bookcase').click();
		flushSync();
		expect(onSettle).not.toHaveBeenCalled();

		optionButton(el, 'baseball').click();
		flushSync();

		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(true);
	});
});
