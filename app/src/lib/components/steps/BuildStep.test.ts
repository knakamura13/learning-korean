// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import BuildStep from './BuildStep.svelte';
import type { BuildStep as BuildStepData } from '$lib/content/types';

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

const step: BuildStepData = {
	type: 'build',
	do: 'Add a stroke to ㄱ (k/g) to form ㅋ (k aspirated).',
	start: 'ㄱ',
	target: 'ㅋ',
	targetName: 'k aspirated',
	teach: 'Strokes add breath.'
};

describe('BuildStep', () => {
	it('renders tool buttons with dynamic ARIA labels and correct initial state', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(BuildStep, { step, onSettle, onNudge });

		const strokeBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Add stroke to ㄱ"]')!;
		const doubleBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Double ㄱ"]')!;
		const undoBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Undo derivation"]')!;

		expect(strokeBtn).not.toBeNull();
		expect(doubleBtn).not.toBeNull();
		expect(undoBtn).not.toBeNull();

		expect(strokeBtn.disabled).toBe(false);
		expect(doubleBtn.disabled).toBe(false); // ㄱ can double to ㄲ
		expect(undoBtn.disabled).toBe(true); // path length is 1
	});

	it('derives next character and calls onSettle when target is reached', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(BuildStep, { step, onSettle, onNudge });

		const strokeBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Add stroke to ㄱ"]')!;
		strokeBtn.click();
		flushSync();

		expect(onSettle).toHaveBeenCalledTimes(1);

		// Current letter is now ㅋ; check updated link
		const curLink = el.querySelector('.link.cur')!;
		expect(curLink.textContent).toBe('ㅋ');
	});

	it('allows undoing derivation', () => {
		const stepWithMulti: BuildStepData = {
			type: 'build',
			do: 'Derive ㄲ from ㄱ.',
			start: 'ㄱ',
			target: 'ㄲ',
			targetName: 'kk double',
			teach: 'Doubling makes tense sound.'
		};
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const el = render(BuildStep, { step: stepWithMulti, onSettle, onNudge });

		const strokeBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Add stroke to ㄱ"]')!;
		strokeBtn.click();
		flushSync();

		// Now current is ㅋ
		const undoBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Undo derivation"]')!;
		expect(undoBtn.disabled).toBe(false);

		undoBtn.click();
		flushSync();

		const curLink = el.querySelector('.link.cur')!;
		expect(curLink.textContent).toBe('ㄱ');
		expect(undoBtn.disabled).toBe(true);
	});
});
