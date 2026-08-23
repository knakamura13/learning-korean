// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import ProgressBackup from './ProgressBackup.svelte';

let instance: ReturnType<typeof mount> | undefined;

function render(props: {
	exportJson: () => string;
	importJson: (json: string) => boolean;
	now?: () => number;
}) {
	instance = mount(ProgressBackup, { target: document.body, props });
	flushSync();
	return document.body;
}

function macrotask(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/** jsdom's FileReader resolves over a real task, not a microtask — poll for it. */
async function waitFor(check: () => boolean, tries = 20): Promise<void> {
	for (let i = 0; i < tries; i++) {
		flushSync();
		if (check()) return;
		await macrotask();
	}
	flushSync();
}

async function selectFile(root: ParentNode, file: File) {
	const input = root.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('no file input');
	Object.defineProperty(input, 'files', { value: [file], configurable: true });
	// Real browsers bubble `change`; jsdom's Event does not unless asked.
	input.dispatchEvent(new Event('change', { bubbles: true }));
	flushSync();
}

beforeEach(() => {
	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: vi.fn(() => 'blob:mock'),
		revokeObjectURL: vi.fn()
	});
	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	document.body.innerHTML = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('ProgressBackup — export', () => {
	it('names the download after today and reports success', () => {
		const exportJson = vi.fn(() => '{"version":1}');
		const root = render({
			exportJson,
			importJson: () => true,
			now: () => new Date(2026, 0, 3).getTime()
		});

		root.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		expect(exportJson).toHaveBeenCalledOnce();
		expect(URL.createObjectURL).toHaveBeenCalledOnce();
		expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('right');
		expect(status?.textContent).toContain('korean-progress-2026-01-03.json');
	});
});

function restoreButtons(root: ParentNode) {
	const buttons = [...root.querySelectorAll<HTMLButtonElement>('.confirm button')];
	const cancel = buttons.find((b) => /^\s*Cancel\s*$/.test(b.textContent ?? ''));
	const confirm = buttons.find((b) => /Replace progress|Restoring/i.test(b.textContent ?? ''));
	return { buttons, cancel, confirm };
}

describe('ProgressBackup — restore', () => {
	it('asks for confirmation before replacing progress, and does nothing on cancel', async () => {
		const importJson = vi.fn(() => true);
		const root = render({ exportJson: () => '{}', importJson });

		const file = new File(['{"version":1}'], 'my-backup.json', { type: 'application/json' });
		await selectFile(root, file);

		const dialog = root.querySelector('dialog.confirm');
		expect(dialog).toBeTruthy();
		expect(dialog?.textContent).toContain('my-backup.json');
		expect(importJson).not.toHaveBeenCalled();

		const { cancel } = restoreButtons(root);
		cancel!.click();
		flushSync();

		expect(root.querySelector('dialog.confirm')).toBeNull();
		expect(importJson).not.toHaveBeenCalled();
	});

	it('puts Cancel first so a reflex Enter cannot replace progress', async () => {
		const root = render({ exportJson: () => '{}', importJson: () => true });
		const file = new File(['{"version":1}'], 'safe.json', { type: 'application/json' });
		await selectFile(root, file);

		const { buttons, cancel, confirm } = restoreButtons(root);
		expect(buttons[0]).toBe(cancel);
		expect(buttons[1]).toBe(confirm);
		expect(document.activeElement).toBe(cancel);
	});

	it('imports the chosen file and reports success on confirm', async () => {
		const importJson = vi.fn(() => true);
		const root = render({ exportJson: () => '{}', importJson });

		const file = new File(['{"version":1}'], 'good.json', { type: 'application/json' });
		await selectFile(root, file);

		const { confirm } = restoreButtons(root);
		confirm!.click();
		flushSync();
		await waitFor(() => importJson.mock.calls.length > 0);

		expect(importJson).toHaveBeenCalledWith('{"version":1}');
		expect(root.querySelector('dialog.confirm')).toBeNull();
		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('right');
	});

	it('rejects an oversized file before reading it', async () => {
		const importJson = vi.fn(() => true);
		const root = render({ exportJson: () => '{}', importJson });
		const file = new File(['{"version":1}'], 'huge.json', { type: 'application/json' });
		Object.defineProperty(file, 'size', { value: 200_001 });
		await selectFile(root, file);
		const { confirm } = restoreButtons(root);
		confirm!.click();
		flushSync();
		await macrotask();

		expect(importJson).not.toHaveBeenCalled();
		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('wrong');
	});

	it('reports failure without alarming the learner into thinking data was lost', async () => {
		const importJson = vi.fn(() => false);
		const root = render({ exportJson: () => '{}', importJson });

		const file = new File(['not json'], 'bad.json', { type: 'application/json' });
		await selectFile(root, file);
		const { confirm } = restoreButtons(root);
		confirm!.click();
		flushSync();
		await waitFor(() => importJson.mock.calls.length > 0);

		const status = root.querySelector('.status');
		expect(status?.getAttribute('data-tone')).toBe('wrong');
		expect(status?.textContent).toMatch(/nothing was changed/);
	});
});
