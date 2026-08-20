// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import SprintChoices from './SprintChoices.svelte';
import src from './SprintChoices.svelte?raw';

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

describe('SprintChoices', () => {
	it('fires onPick once and ignores a second tap', () => {
		const onPick = vi.fn();
		const el = render(SprintChoices, { options: ['ga', 'na', 'da', 'ma'], onPick });
		const buttons = [...el.querySelectorAll<HTMLButtonElement>('button.opt')];
		expect(buttons).toHaveLength(4);
		buttons[0].click();
		flushSync();
		buttons[1].click();
		flushSync();
		expect(onPick).toHaveBeenCalledTimes(1);
		expect(onPick).toHaveBeenCalledWith(0);
	});

	it('keeps 44px targets and a two-by-two grid', () => {
		expect(src).toMatch(/min-height:\s*44px/);
		expect(src).toMatch(/min-width:\s*44px/);
		expect(src).toMatch(/grid-template-columns:\s*1fr 1fr/);
	});
});
