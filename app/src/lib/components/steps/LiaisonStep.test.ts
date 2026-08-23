// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import LiaisonStep from './LiaisonStep.svelte';
import type { LiaisonStep as LiaisonStepData } from '$lib/content/types';

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
	type: 'liaison' as const,
	do: 'Make the jump.',
	teach: '<p>teach</p>'
};

function click(el: HTMLElement, label: string) {
	const btn = [...el.querySelectorAll('button')].find((b) => {
		const glyph = b.querySelector('[lang="ko"]')?.textContent?.trim();
		if (glyph === label) return true;
		return b.textContent?.trim() === label;
	});
	if (!btn) throw new Error(`no button "${label}"`);
	btn.click();
	flushSync();
}

describe('LiaisonStep', () => {
	it('settles when the jumper is tapped and reveals derived speech', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: LiaisonStepData = { ...base, word: '음악', gloss: 'music' };
		const el = render(LiaisonStep, { step, onSettle, onNudge });
		expect(el.textContent).toContain('음악');
		click(el, 'ㅁ');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(onNudge).not.toHaveBeenCalled();
		expect(el.textContent).toContain('으막');
	});

	it('nudges Stay on a jumping word and does not settle', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: LiaisonStepData = { ...base, word: '음악' };
		const el = render(LiaisonStep, { step, onSettle, onNudge });
		click(el, 'Stay');
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalledTimes(1);
		expect(onNudge.mock.calls[0][1] ?? false).toBeFalsy();
	});

	it('settles Stay when ㅇ-batchim must not jump', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: LiaisonStepData = { ...base, word: '강이', gloss: 'river' };
		const el = render(LiaisonStep, { step, onSettle, onNudge });
		click(el, 'Stay');
		expect(onSettle).toHaveBeenCalledTimes(1);
		click(el, 'ㅇ');
		expect(onNudge).not.toHaveBeenCalled();
	});

	it('nudges the staying cluster member', () => {
		const onSettle = vi.fn();
		const onNudge = vi.fn();
		const step: LiaisonStepData = { ...base, word: '읽어요' };
		const el = render(LiaisonStep, { step, onSettle, onNudge });
		click(el, 'ㄹ');
		expect(onSettle).not.toHaveBeenCalled();
		expect(onNudge).toHaveBeenCalled();
		click(el, 'ㄱ');
		expect(onSettle).toHaveBeenCalledTimes(1);
		expect(el.textContent).toContain('일거요');
	});
});
