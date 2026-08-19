/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount, type Component } from 'svelte';
import LabRunner from './LabRunner.svelte';
import type { Lab } from '$lib/content/types';

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

beforeEach(() => {
	vi.stubGlobal('scrollTo', vi.fn());
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
});

afterEach(() => {
	while (mounted.length) unmount(mounted.pop()!);
	document.body.innerHTML = '';
	localStorage.clear();
	vi.unstubAllGlobals();
});

const lab: Lab = {
	id: 'focus-lab',
	number: 1,
	title: 'Focus lab',
	standfirst: 'Two choice cards.',
	minutes: 1,
	unlocks: 'none',
	finish: { title: 'Done', summary: 'Finished.' },
	steps: [
		{
			type: 'choice',
			do: 'First question?',
			teach: '<p>one</p>',
			options: ['alpha', 'bravo'],
			answer: 0
		},
		{
			type: 'choice',
			do: 'Second question?',
			teach: '<p>two</p>',
			options: ['delta', 'gamma'],
			answer: 0
		}
	]
};

async function waitForReady(): Promise<void> {
	flushSync();
	await tick();
	flushSync();
}

function settleCurrentCard(): void {
	for (const btn of [...document.querySelectorAll<HTMLButtonElement>('button.opt:not(:disabled)')]) {
		if (document.querySelector('.foot .btn')) break;
		btn.click();
		flushSync();
	}
}

describe('LabRunner card-change focus', () => {
	it('does not steal focus when the first card becomes ready', async () => {
		render(LabRunner, { lab });
		await waitForReady();

		expect(document.querySelector('h2.do')?.textContent).toContain('First question');
		expect(document.activeElement === document.body || document.activeElement === document.documentElement).toBe(
			true
		);
	});

	it('lands on the first well control after Next, not the instruction heading', async () => {
		render(LabRunner, { lab });
		await waitForReady();

		expect(document.querySelector('h2.do')?.textContent).toContain('First question');
		settleCurrentCard();

		const next = document.querySelector<HTMLButtonElement>('.foot .btn');
		expect(next).toBeTruthy();
		next!.click();
		flushSync();
		await tick();
		flushSync();

		const heading = document.querySelector('h2.do');
		expect(heading?.textContent).toContain('Second question');
		expect(document.activeElement).toBeInstanceOf(HTMLButtonElement);
		expect(document.activeElement).not.toBe(heading);
		expect((document.activeElement as HTMLElement).closest('.work')).toBeTruthy();
		expect((document.activeElement as HTMLElement).classList.contains('opt')).toBe(true);
		expect(document.querySelector('[data-prompt-live]')?.textContent).toContain('Second question');
	});
});
