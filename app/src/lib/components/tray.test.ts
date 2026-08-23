// @vitest-environment jsdom
/**
 * Composer trays are independent slots. Duplicate glyphs (Lab 03 fusion
 * first/second both include ㅏ/ㅓ; Lab 04 assemble top/batchim both include ㅂ)
 * must not share a click target.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount, type Component } from 'svelte';
import Tray from './Tray.svelte';
import FusionStep from './steps/FusionStep.svelte';
import AssembleStep from './steps/AssembleStep.svelte';
import type { AssembleStep as AssembleStepData, FusionStep as FusionStepData } from '$lib/content/types';
import { DRAG_THRESHOLD_PX } from '$lib/domain/composerSnap';
import { flushLabDrag } from './labDrag';

if (typeof PointerEvent === 'undefined') {
	class PointerEventPolyfill extends MouseEvent {
		pointerId: number;
		pointerType: string;
		constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 0;
			this.pointerType = init.pointerType ?? '';
		}
	}
	Object.defineProperty(globalThis, 'PointerEvent', { value: PointerEventPolyfill });
}

type Mounted = Record<string, never>;
const mounted: Mounted[] = [];

function render<P extends Record<string, unknown>>(
	component: Component<P>,
	props: P
): HTMLElement {
	const instance = mount(component, { target: document.body, props });
	mounted.push(instance);
	flushSync();
	return document.body;
}

afterEach(() => {
	while (mounted.length) unmount(mounted.pop()!);
	document.body.innerHTML = '';
});

function labeledGroup(root: ParentNode, label: string): HTMLElement {
	const groups = [...root.querySelectorAll<HTMLElement>('[role="radiogroup"]')];
	const match = groups.find((group) => {
		const id = group.getAttribute('aria-labelledby');
		if (!id) return false;
		return document.getElementById(id)?.textContent?.trim() === label;
	});
	if (!match) throw new Error(`no radiogroup labeled "${label}"`);
	return match;
}

function radios(group: HTMLElement): HTMLElement[] {
	return [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
}

function radioNamed(group: HTMLElement, glyph: string): HTMLElement {
	const hit = radios(group).find(
		(el) =>
			el.getAttribute('aria-label') === `${groupLabel(group)}: ${glyph}` ||
			el.textContent?.replace(/\s+/g, ' ').includes(glyph)
	);
	if (!hit) throw new Error(`no radio "${glyph}" in ${groupLabel(group)}`);
	return hit;
}

function groupLabel(group: HTMLElement): string {
	const id = group.getAttribute('aria-labelledby');
	return id ? (document.getElementById(id)?.textContent?.trim() ?? '') : '';
}

function slotValues(root: ParentNode): string[] {
	return [...root.querySelectorAll('.slot-value')].map((el) => el.textContent ?? '');
}

const fusionStep: FusionStepData = {
	type: 'fusion',
	do: 'Fuse',
	teach: 'ok',
	target: 'ㅝ',
	targetName: 'wo',
	first: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ'],
	second: ['ㅣ', 'ㅏ', 'ㅓ']
};

const assembleStep: AssembleStepData = {
	type: 'assemble',
	do: 'Build',
	teach: 'ok',
	target: '밥',
	targetName: 'bap',
	consonants: ['ㅂ', 'ㄷ', 'ㅁ'],
	vowels: ['ㅏ', 'ㅜ'],
	finals: ['ㅂ', 'ㄱ', 'ㅅ']
};

const cvAssemble: AssembleStepData = {
	type: 'assemble',
	do: 'Build',
	teach: 'ok',
	target: '누',
	targetName: 'nu',
	consonants: ['ㄴ', 'ㅁ', 'ㅅ'],
	vowels: ['ㅏ', 'ㅜ', 'ㅡ']
};

function firePointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			button: 0,
			clientX: x,
			clientY: y,
			pointerId: 1,
			pointerType: 'mouse'
		})
	);
}

async function frame() {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function mockSlot(
	root: ParentNode,
	name: string,
	box: { left: number; top: number; right: number; bottom: number }
) {
	const el = root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
	if (!el) throw new Error(`no slot ${name}`);
	vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
		...box,
		width: box.right - box.left,
		height: box.bottom - box.top,
		x: box.left,
		y: box.top,
		toJSON() {}
	} as DOMRect);
	return el;
}

/** Pointer-down on a chip, drag past the click threshold, release. Optionally synthesize the trailing click. */
async function dragChip(
	chip: HTMLElement,
	to: { x: number; y: number },
	opts: { click?: boolean } = {}
) {
	await flushLabDrag();
	firePointer(chip, 'pointerdown', 10, 10);
	firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX, 10);
	await frame();
	flushSync();
	firePointer(window, 'pointermove', to.x, to.y);
	await frame();
	flushSync();
	firePointer(window, 'pointerup', to.x, to.y);
	await frame();
	flushSync();
	if (opts.click) {
		chip.click();
		flushSync();
	}
}

describe('Tray', () => {
	it('exposes one labeled radiogroup whose chips name the slot', () => {
		render(Tray, {
			label: 'second vowel',
			items: ['ㅣ', 'ㅏ', 'ㅓ'],
			selected: null,
			onSelect: () => {}
		});

		const group = labeledGroup(document.body, 'second vowel');
		expect(radios(group)).toHaveLength(3);
		const eo = radioNamed(group, 'ㅓ');
		expect(eo.getAttribute('role')).toBe('radio');
		expect(eo.getAttribute('aria-checked')).toBe('false');
		expect(eo.getAttribute('aria-label')).toBeNull();
		expect(eo.getAttribute('lang')).toBe('ko');
		expect(eo.textContent).toContain('ㅓ');
		expect(group.getAttribute('aria-labelledby')).toBeTruthy();
	});

	it('marks the selected chip checked and visually on', () => {
		render(Tray, {
			label: 'first vowel',
			items: ['ㅏ', 'ㅓ'],
			selected: 'ㅓ',
			onSelect: () => {}
		});

		const group = labeledGroup(document.body, 'first vowel');
		const eo = radioNamed(group, 'ㅓ');
		const a = radioNamed(group, 'ㅏ');
		expect(eo.getAttribute('aria-checked')).toBe('true');
		expect(eo.classList.contains('on')).toBe(true);
		expect(a.getAttribute('aria-checked')).toBe('false');
		expect(a.classList.contains('on')).toBe(false);
		expect(group.classList.contains('picked')).toBe(true);
		expect(eo.textContent).toMatch(/first/i);
	});

	it('labels the selected consonant chip with the slot name', () => {
		render(Tray, {
			label: 'consonant',
			items: ['ㄴ', 'ㅁ', 'ㅅ'],
			selected: 'ㄴ',
			onSelect: () => {}
		});

		const nieun = radioNamed(labeledGroup(document.body, 'consonant'), 'ㄴ');
		expect(nieun.classList.contains('on')).toBe(true);
		expect(nieun.querySelector('.mark')?.textContent?.trim()).toBe('consonant');
	});

	it('keeps disabled chips unclickable', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'tick side',
			items: ['left', 'right'],
			selected: null,
			text: true,
			disabled: true,
			onSelect
		});

		const group = labeledGroup(document.body, 'tick side');
		expect(group.getAttribute('aria-disabled')).toBe('true');
		radioNamed(group, 'left').click();
		flushSync();
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('gives only the checked chip a tab stop, or the first chip when nothing is picked', () => {
		render(Tray, {
			label: 'base stroke',
			items: ['ㅣ', 'ㅡ'],
			selected: null,
			onSelect: () => {}
		});
		const unpicked = labeledGroup(document.body, 'base stroke');
		expect(radioNamed(unpicked, 'ㅣ').getAttribute('tabindex')).toBe('0');
		expect(radioNamed(unpicked, 'ㅡ').getAttribute('tabindex')).toBe('-1');

		render(Tray, {
			label: 'first vowel',
			items: ['ㅏ', 'ㅓ'],
			selected: 'ㅓ',
			onSelect: () => {}
		});
		const picked = labeledGroup(document.body, 'first vowel');
		expect(radioNamed(picked, 'ㅏ').getAttribute('tabindex')).toBe('-1');
		expect(radioNamed(picked, 'ㅓ').getAttribute('tabindex')).toBe('0');
	});

	it('moves focus and picks with the arrow keys, wrapping past either end', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'ticks',
			items: ['none', 'one', 'two'],
			selected: null,
			text: true,
			onSelect
		});
		const group = labeledGroup(document.body, 'ticks');
		const [none, one, two] = radios(group);

		none.focus();
		none.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(document.activeElement).toBe(one);
		expect(onSelect).toHaveBeenLastCalledWith('one');

		one.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
		expect(document.activeElement).toBe(two);
		expect(onSelect).toHaveBeenLastCalledWith('two');

		two.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(document.activeElement).toBe(none);
		expect(onSelect).toHaveBeenLastCalledWith('none');

		none.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
		expect(document.activeElement).toBe(two);
		expect(onSelect).toHaveBeenLastCalledWith('two');

		two.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		expect(document.activeElement).toBe(one);
		expect(onSelect).toHaveBeenLastCalledWith('one');
	});

	it('ignores arrow keys while disabled', () => {
		const onSelect = vi.fn();
		render(Tray, {
			label: 'tick side',
			items: ['left', 'right'],
			selected: null,
			text: true,
			disabled: true,
			onSelect
		});
		const group = labeledGroup(document.body, 'tick side');
		const [left] = radios(group);
		left.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(onSelect).not.toHaveBeenCalled();
	});
});

describe('FusionStep trays', () => {
	it('does not change the first slot when second-tray ㅓ is activated', () => {
		const root = render(FusionStep, {
			step: fusionStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		const first = labeledGroup(root, 'first vowel');
		const second = labeledGroup(root, 'second vowel');
		expect(radioNamed(first, 'ㅓ')).toBeTruthy();
		expect(radioNamed(second, 'ㅓ')).toBeTruthy();

		radioNamed(first, 'ㅜ').click();
		flushSync();
		radioNamed(second, 'ㅓ').click();
		flushSync();

		expect(radioNamed(first, 'ㅜ').getAttribute('aria-checked')).toBe('true');
		expect(radioNamed(first, 'ㅓ').getAttribute('aria-checked')).toBe('false');
		expect(radioNamed(second, 'ㅓ').getAttribute('aria-checked')).toBe('true');

		const [slotA, slotB] = slotValues(root);
		expect(slotA).toBe('ㅜ');
		expect(slotB).toBe('ㅓ');
		const slotEls = [...root.querySelectorAll<HTMLElement>('.slot')];
		expect(slotEls[0].classList.contains('on')).toBe(true);
		expect(slotEls[1].classList.contains('on')).toBe(true);
		expect(slotEls[0].querySelector('.slot-name')?.textContent).toBe('first');
		expect(slotEls[1].querySelector('.slot-name')?.textContent).toBe('second');
		expect(root.querySelector('.out')?.textContent).not.toContain('✕');
	});

	it('prints independent readings under filled slots, not on trays or the result', () => {
		const root = render(FusionStep, {
			step: fusionStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		const emptySlots = [...root.querySelectorAll<HTMLElement>('.slot')];
		expect(emptySlots).toHaveLength(2);
		for (const slot of emptySlots) {
			expect(slot.getAttribute('aria-label')).toBeNull();
			expect(slot.getAttribute('role')).toBe('group');
			expect(slot.getAttribute('aria-labelledby')).toBeTruthy();
			expect(slot.querySelector('.slot-reading')?.textContent).toBe('empty');
		}
		expect(root.querySelector('.out .slot-reading')).toBeNull();

		radioNamed(labeledGroup(root, 'first vowel'), 'ㅜ').click();
		flushSync();
		radioNamed(labeledGroup(root, 'second vowel'), 'ㅓ').click();
		flushSync();

		const [first, second] = [...root.querySelectorAll<HTMLElement>('.slot')];
		expect(first.querySelector('.slot-reading')?.textContent).toBe('u');
		expect(second.querySelector('.slot-reading')?.textContent).toBe('eo');
		expect(first.querySelector('.slot-value')?.getAttribute('lang')).toBe('ko');
		expect(first.getAttribute('aria-labelledby')).toMatch(/name|value|reading/);
		expect(first.getAttribute('aria-label')).toBeNull();
		expect(second.getAttribute('aria-label')).toBeNull();

		const tray = labeledGroup(root, 'first vowel');
		expect(radioNamed(tray, 'ㅜ').getAttribute('aria-label')).toBeNull();
		expect(radioNamed(tray, 'ㅜ').getAttribute('lang')).toBe('ko');
		expect(radioNamed(tray, 'ㅜ').querySelector('.slot-reading')).toBeNull();
		expect(root.querySelector('.out')?.textContent?.replace(/\s+/g, '')).toBe('ㅝ');
	});

	it('seats a dragged second-tray vowel onto the second slot', async () => {
		const root = render(FusionStep, {
			step: fusionStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		mockSlot(root, 'first', { left: 0, top: 0, right: 80, bottom: 80 });
		mockSlot(root, 'second', { left: 200, top: 0, right: 280, bottom: 80 });

		radioNamed(labeledGroup(root, 'first vowel'), 'ㅜ').click();
		flushSync();

		await dragChip(radioNamed(labeledGroup(root, 'second vowel'), 'ㅓ'), { x: 240, y: 40 });

		const [slotA, slotB] = slotValues(root);
		expect(slotA).toBe('ㅜ');
		expect(slotB).toBe('ㅓ');
	});
});

describe('AssembleStep trays', () => {
	it('does not change the lead slot when batchim ㅂ is activated', () => {
		const root = render(AssembleStep, {
			step: assembleStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		const lead = labeledGroup(root, 'first consonant');
		const vowel = labeledGroup(root, 'vowel');
		const batchim = labeledGroup(root, 'batchim — the bottom slot');

		radioNamed(lead, 'ㅁ').click();
		flushSync();
		radioNamed(vowel, 'ㅏ').click();
		flushSync();
		radioNamed(batchim, 'ㅂ').click();
		flushSync();

		expect(radioNamed(lead, 'ㅁ').getAttribute('aria-checked')).toBe('true');
		expect(radioNamed(lead, 'ㅂ').getAttribute('aria-checked')).toBe('false');
		expect(radioNamed(batchim, 'ㅂ').getAttribute('aria-checked')).toBe('true');

		const [slotLead, slotVowel, slotFinal] = slotValues(root);
		expect(slotLead).toBe('ㅁ');
		expect(slotVowel).toBe('ㅏ');
		expect(slotFinal).toBe('ㅂ');

		const [leadSlot, vowelSlot, batchimSlot] = [...root.querySelectorAll<HTMLElement>('.slot')];
		expect(leadSlot.querySelector('.slot-reading')?.textContent).toBe('m');
		expect(vowelSlot.querySelector('.slot-reading')?.textContent).toBe('a');
		expect(batchimSlot.querySelector('.slot-reading')?.textContent).toBe('p');
		expect(leadSlot.getAttribute('aria-label')).toBeNull();
		expect(leadSlot.getAttribute('aria-labelledby')).toBeTruthy();
		expect(leadSlot.querySelector('.slot-value')?.textContent).toBe('ㅁ');
		expect(batchimSlot.querySelector('.slot-value')?.textContent).toBe('ㅂ');
		expect(batchimSlot.getAttribute('aria-label')).toBeNull();
	});

	it('leaves a silent lead ㅇ unlabeled on the plate', () => {
		const root = render(AssembleStep, {
			step: {
				type: 'assemble',
				do: 'Build',
				teach: 'ok',
				target: '위',
				targetName: 'wi',
				consonants: ['ㅇ', 'ㄱ', 'ㅁ'],
				vowels: ['ㅟ', 'ㅜ', 'ㅣ']
			},
			onSettle: () => {},
			onNudge: () => {}
		});

		radioNamed(labeledGroup(root, 'consonant'), 'ㅇ').click();
		flushSync();
		radioNamed(labeledGroup(root, 'vowel'), 'ㅟ').click();
		flushSync();

		const [leadSlot, vowelSlot] = [...root.querySelectorAll<HTMLElement>('.slot')];
		const reading = leadSlot.querySelector('.slot-reading');
		expect(reading?.textContent).toBe('');
		expect(reading?.matches(':empty')).toBe(true);
		expect(leadSlot.getAttribute('aria-label')).toBeNull();
		expect(leadSlot.querySelector('.slot-value')?.textContent).toBe('ㅇ');
		expect(leadSlot.getAttribute('aria-labelledby')).toBeTruthy();
		expect(vowelSlot.querySelector('.slot-reading')?.textContent).toBe('wi');
	});

	it('seats a dragged vowel onto the vowel slot without a click', async () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});

		mockSlot(root, 'consonant', { left: 0, top: 0, right: 80, bottom: 80 });
		mockSlot(root, 'vowel', { left: 200, top: 0, right: 280, bottom: 80 });

		const vowel = labeledGroup(root, 'vowel');
		await dragChip(radioNamed(vowel, 'ㅜ'), { x: 240, y: 40 });

		const [slotLead, slotVowel] = slotValues(root);
		expect(slotLead).toBe('');
		expect(slotVowel).toBe('ㅜ');
		expect(radioNamed(vowel, 'ㅜ').getAttribute('aria-checked')).toBe('true');
	});

	it('still auto-fills a slot from a click when the pointer never drags', () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});

		const lead = labeledGroup(root, 'consonant');
		radioNamed(lead, 'ㄴ').click();
		flushSync();

		expect(slotValues(root)[0]).toBe('ㄴ');
		expect(radioNamed(lead, 'ㄴ').getAttribute('aria-checked')).toBe('true');
	});

	it('treats a short pointer jitter as a click, not a missed drag', async () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});
		await flushLabDrag();

		const lead = labeledGroup(root, 'consonant');
		const chip = radioNamed(lead, 'ㄴ');
		firePointer(chip, 'pointerdown', 10, 10);
		firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX - 1, 10);
		await frame();
		flushSync();
		firePointer(window, 'pointerup', 10 + DRAG_THRESHOLD_PX - 1, 10);
		await frame();
		flushSync();
		chip.click();
		flushSync();

		expect(slotValues(root)[0]).toBe('ㄴ');
	});

	it('highlights the matching slot while a chip is in flight', async () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});
		await flushLabDrag();

		const vowelSlot = mockSlot(root, 'vowel', { left: 200, top: 0, right: 280, bottom: 80 });
		mockSlot(root, 'consonant', { left: 0, top: 0, right: 80, bottom: 80 });

		const chip = radioNamed(labeledGroup(root, 'vowel'), 'ㅜ');
		firePointer(chip, 'pointerdown', 10, 10);
		firePointer(window, 'pointermove', 10 + DRAG_THRESHOLD_PX, 10);
		await frame();
		flushSync();

		expect(vowelSlot.classList.contains('hot')).toBe(true);
		expect(root.querySelector('[data-slot="consonant"]')?.classList.contains('hot')).toBe(false);
		expect(root.querySelector('.ghost')?.textContent).toContain('ㅜ');

		firePointer(window, 'pointerup', 500, 500);
		await frame();
		flushSync();
		expect(vowelSlot.classList.contains('hot')).toBe(false);
	});

	it('does not auto-fill after a missed drag, even when a click follows the release', async () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});

		mockSlot(root, 'consonant', { left: 0, top: 0, right: 80, bottom: 80 });
		mockSlot(root, 'vowel', { left: 200, top: 0, right: 280, bottom: 80 });

		const vowel = labeledGroup(root, 'vowel');
		const chip = radioNamed(vowel, 'ㅜ');
		await dragChip(chip, { x: 500, y: 500 }, { click: true });

		expect(slotValues(root)[1]).toBe('');
		expect(chip.getAttribute('aria-checked')).toBe('false');

		chip.click();
		flushSync();
		expect(slotValues(root)[1]).toBe('ㅜ');
	});

	it('bounces a vowel dropped on the consonant slot and still lets the next click fill the vowel', async () => {
		const root = render(AssembleStep, {
			step: cvAssemble,
			onSettle: () => {},
			onNudge: () => {}
		});

		mockSlot(root, 'consonant', { left: 0, top: 0, right: 80, bottom: 80 });
		mockSlot(root, 'vowel', { left: 200, top: 0, right: 280, bottom: 80 });

		const vowel = labeledGroup(root, 'vowel');
		const chip = radioNamed(vowel, 'ㅜ');
		await dragChip(chip, { x: 40, y: 40 }, { click: true });

		const [slotLead, slotVowel] = slotValues(root);
		expect(slotLead).toBe('');
		expect(slotVowel).toBe('');

		chip.click();
		flushSync();
		expect(slotValues(root)[1]).toBe('ㅜ');
	});

	it('seats a dragged batchim onto the bottom slot without changing the lead', async () => {
		const root = render(AssembleStep, {
			step: assembleStep,
			onSettle: () => {},
			onNudge: () => {}
		});

		mockSlot(root, 'consonant', { left: 0, top: 0, right: 80, bottom: 80 });
		mockSlot(root, 'vowel', { left: 200, top: 0, right: 280, bottom: 80 });
		mockSlot(root, 'batchim', { left: 100, top: 120, right: 180, bottom: 200 });

		const lead = labeledGroup(root, 'first consonant');
		radioNamed(lead, 'ㅁ').click();
		flushSync();

		const batchim = labeledGroup(root, 'batchim — the bottom slot');
		await dragChip(radioNamed(batchim, 'ㅂ'), { x: 140, y: 160 });

		const [slotLead, , slotFinal] = slotValues(root);
		expect(slotLead).toBe('ㅁ');
		expect(slotFinal).toBe('ㅂ');
		expect(radioNamed(lead, 'ㅂ').getAttribute('aria-checked')).toBe('false');
	});
});
