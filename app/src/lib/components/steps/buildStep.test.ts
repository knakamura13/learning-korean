// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import BuildStepComponent from './BuildStep.svelte';
import type { BuildStep } from '$lib/content/types';

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

describe('BuildStep', () => {
	const step: BuildStep = {
		type: 'build',
		do: 'Derive ㅋ from ㄱ',
		teach: '<p>Adding a stroke to ㄱ produces ㅋ.</p>',
		start: 'ㄱ',
		target: 'ㅋ',
		targetName: 'kieuk'
	};

	it('renders derivation tool buttons with accessible ARIA labels', () => {
		const el = render(BuildStepComponent, {
			step,
			onSettle: vi.fn(),
			onNudge: vi.fn()
		});

		const buttons = [...el.querySelectorAll<HTMLButtonElement>('.tools button')];
		const labels = buttons.map((btn) => btn.getAttribute('aria-label'));

		expect(labels).toEqual(['Add stroke', 'Double stroke', 'Undo derivation step']);
	});
});
