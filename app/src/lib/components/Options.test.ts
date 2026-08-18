// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import Options from './Options.svelte';

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

describe('Options', () => {
	const props = {
		options: ['baseball', 'birthday', 'bookcase', 'backpack'],
		answer: 0
	};

	it('marks a wrong pick without revealing or locking the rest', () => {
		const onPick = vi.fn();
		const el = render(Options, { ...props, onPick });

		optionButton(el, 'bookcase').click();
		flushSync();

		expect(onPick).toHaveBeenCalledWith(false, expect.any(Number));
		expect(optionButton(el, 'bookcase').classList.contains('wrong')).toBe(true);
		expect(optionButton(el, 'bookcase').disabled).toBe(true);
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(false);
		expect(optionButton(el, 'baseball').disabled).toBe(false);
		expect(optionButton(el, 'birthday').disabled).toBe(false);
		expect(optionButton(el, 'backpack').classList.contains('dim')).toBe(false);
	});

	it('lets the learner pick again after a miss, then locks on a correct pick', () => {
		const onPick = vi.fn();
		const el = render(Options, { ...props, onPick });

		optionButton(el, 'bookcase').click();
		flushSync();
		optionButton(el, 'baseball').click();
		flushSync();

		expect(onPick).toHaveBeenLastCalledWith(true, expect.any(Number));
		expect(optionButton(el, 'baseball').classList.contains('right')).toBe(true);
		expect(optionButton(el, 'bookcase').classList.contains('wrong')).toBe(true);
		expect(optionButton(el, 'birthday').classList.contains('dim')).toBe(true);
		expect(optionButton(el, 'baseball').disabled).toBe(true);
		expect(optionButton(el, 'birthday').disabled).toBe(true);
	});
});
