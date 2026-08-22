// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import LabSwitcher from './LabSwitcher.svelte';
import { LABS } from '$lib/content';

let instance: ReturnType<typeof mount> | undefined;

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
	localStorage.clear();
});

function render(currentId: string) {
	instance = mount(LabSwitcher, { target: document.body, props: { currentId } });
	flushSync();
	return document.body;
}

function openSheet(root: ParentNode): HTMLDialogElement {
	const trigger = root.querySelector<HTMLButtonElement>('.trigger');
	expect(trigger).toBeTruthy();
	trigger!.click();
	flushSync();
	const sheet = root.querySelector<HTMLDialogElement>('dialog.sheet');
	expect(sheet).toBeTruthy();
	return sheet!;
}

describe('LabSwitcher', () => {
	it('names the current lab on the 44px trigger', () => {
		const root = render('0004');
		const trigger = root.querySelector<HTMLButtonElement>('.trigger')!;
		expect(trigger.textContent).toContain('04');
		expect(trigger.textContent).toContain(LABS[3].title);
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});

	it('opens a dialog listing every lab with the current one marked', () => {
		const root = render('0001');
		const sheet = openSheet(root);
		const rows = [...sheet.querySelectorAll('a')];
		expect(rows.length).toBe(LABS.length);
		expect(rows[0].getAttribute('aria-current')).toBe('page');
		expect(rows[1].getAttribute('aria-current')).toBeNull();
		expect(rows[0].getAttribute('href')).toBe('/lab/0001');
		// Fresh storage: labs 02+ carry a prerequisite chip via the shared models.
		expect(rows[1].getAttribute('aria-label')).toMatch(/locked/);
	});

	it('closes when a row is picked and when dismissed', () => {
		const root = render('0001');
		const sheet = openSheet(root);
		const row = sheet.querySelector('a')!;
		row.addEventListener('click', (e) => e.preventDefault()); // no jsdom navigation
		row.click();
		flushSync();
		expect(root.querySelector('dialog.sheet')).toBeNull();
		expect(root.querySelector<HTMLButtonElement>('.trigger')!.getAttribute('aria-expanded')).toBe(
			'false'
		);

		const again = openSheet(root);
		again.querySelector<HTMLButtonElement>('.close')!.click();
		flushSync();
		expect(root.querySelector('dialog.sheet')).toBeNull();
	});
});
