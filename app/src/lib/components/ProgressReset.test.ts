// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import ProgressReset from './ProgressReset.svelte';

let instance: ReturnType<typeof mount> | undefined;

function render(props: { onReset: () => void }) {
	instance = mount(ProgressReset, { target: document.body, props });
	flushSync();
	return document.body;
}

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
});

function confirmButtons(root: ParentNode) {
	const buttons = [...root.querySelectorAll<HTMLButtonElement>('.confirm button')];
	const cancel = buttons.find((b) => /^\s*Cancel\s*$/.test(b.textContent ?? ''));
	const confirm = buttons.find((b) => /Clear progress/i.test(b.textContent ?? ''));
	return { buttons, cancel, confirm };
}

describe('ProgressReset', () => {
	it('asks for confirmation before clearing progress, and does nothing on cancel', () => {
		const onReset = vi.fn();
		const root = render({ onReset });

		root.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		const dialog = root.querySelector('dialog.confirm');
		expect(dialog).toBeTruthy();
		expect(dialog?.textContent).toMatch(/cannot be undone/i);
		expect(onReset).not.toHaveBeenCalled();

		const { cancel } = confirmButtons(root);
		cancel!.click();
		flushSync();

		expect(root.querySelector('dialog.confirm')).toBeNull();
		expect(onReset).not.toHaveBeenCalled();
	});

	it('puts Cancel first so a reflex Enter cannot wipe progress', () => {
		const root = render({ onReset: vi.fn() });
		root.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		const { buttons, cancel, confirm } = confirmButtons(root);
		expect(buttons[0]).toBe(cancel);
		expect(buttons[1]).toBe(confirm);
		expect(document.activeElement).toBe(cancel);
	});

	it('resets on confirm and reports that progress was cleared', () => {
		const onReset = vi.fn();
		const root = render({ onReset });

		root.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();
		const { confirm } = confirmButtons(root);
		confirm!.click();
		flushSync();

		expect(onReset).toHaveBeenCalledOnce();
		expect(root.querySelector('dialog.confirm')).toBeNull();
		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('right');
		expect(status?.textContent).toMatch(/cleared/i);
	});
});
