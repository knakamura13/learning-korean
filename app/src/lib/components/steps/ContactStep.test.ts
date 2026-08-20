// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import ContactStep from './ContactStep.svelte';
import type { ContactStep as ContactStepData } from '$lib/content/types';

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

const base = {
	type: 'contact' as const,
	do: 'Pick the change.',
	teach: '<p>teach</p>'
};

function click(el: HTMLElement, label: string) {
	const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
	if (!btn) throw new Error(`no button "${label}"`);
	btn.click();
	flushSync();
}

describe('ContactStep', () => {
	it('settles Tense on 학교 and reveals derived speech', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '학교', gloss: 'school' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		expect(el.textContent).toContain('학교');
		click(el, 'Tense');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(onNudge).not.toHaveBeenCalled();
		expect(el.textContent).toContain('학꾜');
	});

	it('nudges Nasal on a tensification word and does not settle', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '학교' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Nasal');
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onNudge.mock.calls[0][1] ?? false).toBeFalsy();
	});

	it('settles Nasal on 국물 and reveals 궁물', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '국물', gloss: 'broth' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Nasal');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(el.textContent).toContain('궁물');
	});

	it('settles Stay on 한국', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: ContactStepData = { ...base, word: '한국', gloss: 'Korea' };
		const el = render(ContactStep, { step, onSettle, onNudge });
		click(el, 'Stay');
		expect(onSettle).toHaveBeenCalledTimes(1);
		click(el, 'Tense');
		expect(onNudge).not.toHaveBeenCalled();
	});
});
