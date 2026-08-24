/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount, type Component } from 'svelte';
import LabRunner from './LabRunner.svelte';
import type { Lab } from '$lib/content/types';
import { progress } from '$lib/stores/progress.svelte';
import { labSession } from '$lib/stores/labSession.svelte';

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
	progress.reset();
	labSession.reset();
	vi.unstubAllGlobals();
});

const lab: Lab = {
	id: '0001',
	number: 1,
	title: 'Persist lab',
	standfirst: 'One card.',
	minutes: 1,
	unlocks: 'lab01',
	finish: { title: 'Done', summary: 'Finished.' },
	phases: [{ title: 'Read from the letters alone', count: 1 }],
	steps: [
		{
			type: 'choice',
			do: 'Only question?',
			teach: '<p>ok</p>',
			options: ['alpha', 'bravo'],
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
	for (const btn of [
		...document.querySelectorAll<HTMLButtonElement>('button.opt:not([aria-disabled="true"])')
	]) {
		if (document.querySelector('.foot .btn')) break;
		btn.click();
		flushSync();
	}
}

describe('LabRunner persist and unlock', () => {
	it('unlocks the review tier when the last card settles', async () => {
		render(LabRunner, { lab });
		await waitForReady();
		expect(progress.isUnlocked('lab01')).toBe(false);
		settleCurrentCard();
		expect(progress.isUnlocked('lab01')).toBe(true);
		expect(labSession.forLab('0001')?.finished).toBe(true);
	});

	it('resumes a mid-sitting after remount', async () => {
		const twoStep: Lab = {
			...lab,
			phases: [{ title: 'Read from the letters alone', count: 2 }],
			steps: [
				lab.steps[0],
				{
					type: 'choice',
					do: 'Second question?',
					teach: '<p>two</p>',
					options: ['delta', 'gamma'],
					answer: 0
				}
			]
		};
		render(LabRunner, { lab: twoStep });
		await waitForReady();
		settleCurrentCard();
		const next = document.querySelector<HTMLButtonElement>('.foot .btn');
		next!.click();
		flushSync();
		await tick();
		flushSync();
		unmount(mounted.pop()!);

		render(LabRunner, { lab: twoStep });
		await waitForReady();
		expect(document.querySelector('h2.do')?.textContent).toContain('Second question');
	});
});
