// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import ChoiceStep from './ChoiceStep.svelte';
import type { ChoiceStep as ChoiceStepData } from '$lib/content/types';
import { CHOICE_RETRY_COPY } from '$lib/domain/advancePick';

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

const teach = '<p><strong>ya-gu</strong> — baseball.</p>';

function step(miss?: string): ChoiceStepData {
	return {
		type: 'choice',
		do: 'What is it?',
		teach,
		miss,
		options: ['baseball', 'birthday', 'bookcase', 'backpack'],
		answer: 0
	};
}

describe('ChoiceStep', () => {
	it('nudges a wrong pick with the miss copy and does not settle', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(ChoiceStep, { step: step('<p>Think about the sport.</p>'), onSettle, onNudge });

		optionButton(el, 'bookcase').click();
		flushSync();

		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onNudge.mock.calls[0][0]).toBe('<p>Think about the sport.</p>');
		expect(onNudge.mock.calls[0][0]).not.toContain('ya-gu');
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(false);
	});

	it('does not reveal the teaching when a wrong pick has no miss copy', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(ChoiceStep, { step: step(), onSettle, onNudge });

		optionButton(el, 'bookcase').click();
		flushSync();

		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledWith(CHOICE_RETRY_COPY);
		expect(optionButton(el, 'baseball').disabled).toBe(false);
	});

	it('settles only after a correct pick, even following a miss', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(ChoiceStep, { step: step(), onSettle, onNudge });

		optionButton(el, 'bookcase').click();
		flushSync();
		optionButton(el, 'baseball').click();
		flushSync();

		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(onSettle.mock.calls[0][1] ?? true).toBe(true);
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(true);
	});
});
