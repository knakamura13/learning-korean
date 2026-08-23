<script lang="ts">
	import { focusWhen } from '$lib/a11y/shortcuts';
	import { attachModalDialog } from '$lib/a11y/attachModalDialog';
	import { backupFilename, exportedStatus, importedStatus, MAX_BACKUP_BYTES, type BackupStatus } from '$lib/domain/backup';

	/**
	 * `exportJson`/`importJson` are injected rather than importing the
	 * `progress` store directly, so this component can be unit-tested with a
	 * fake — the same "storage as a port" pattern `storage.ts` uses.
	 */
	let {
		exportJson,
		importJson,
		now = () => Date.now()
	}: {
		exportJson: () => string;
		importJson: (json: string) => boolean;
		now?: () => number;
	} = $props();

	let fileInput = $state<HTMLInputElement | undefined>();
	let pending = $state<File | null>(null);
	let status = $state<BackupStatus | null>(null);
	let busy = $state(false);

	function download() {
		status = null;
		const filename = backupFilename(now());
		const blob = new Blob([exportJson()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		status = exportedStatus(filename);
	}

	function chooseFile() {
		status = null;
		fileInput?.click();
	}

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		pending = input.files?.[0] ?? null;
		status = null;
	}

	function readText(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result ?? ''));
			reader.onerror = () => reject(reader.error);
			reader.readAsText(file);
		});
	}

	async function confirmRestore() {
		const file = pending;
		if (!file) return;
		if (file.size > MAX_BACKUP_BYTES) {
			status = importedStatus(false);
			pending = null;
			if (fileInput) fileInput.value = '';
			return;
		}
		busy = true;
		try {
			const text = await readText(file);
			status = importedStatus(importJson(text));
		} catch {
			status = importedStatus(false);
		} finally {
			busy = false;
			pending = null;
			if (fileInput) fileInput.value = '';
		}
	}

	function cancelRestore() {
		pending = null;
		status = null;
		if (fileInput) fileInput.value = '';
	}
</script>

<div class="backup" role="group" aria-label="Back up or restore your progress">
	<div class="actions">
		<button type="button" class="btn ghost" onclick={download}>Back up progress</button>
		<button type="button" class="btn ghost" onclick={chooseFile}>Restore from file…</button>
	</div>
	<input
		bind:this={fileInput}
		class="file-input"
		type="file"
		accept="application/json,.json"
		tabindex="-1"
		aria-hidden="true"
		onchange={onFileChange}
	/>

	{#if pending}
		<dialog
			class="confirm"
			aria-labelledby="restore-copy"
			{@attach (node: HTMLDialogElement) => attachModalDialog(node, cancelRestore)}
		>
			<p id="restore-copy">
				Replace current progress with <strong>{pending.name}</strong>? Everything you have
				reviewed since that backup will be lost.
			</p>
			<div class="actions">
				<button
					type="button"
					class="btn ghost"
					disabled={busy}
					use:focusWhen={true}
					onclick={cancelRestore}
				>
					Cancel
				</button>
				<button type="button" class="btn" disabled={busy} onclick={confirmRestore}>
					{busy ? 'Restoring…' : 'Replace progress'}
				</button>
			</div>
		</dialog>
	{/if}

	{#if status}
		<p class="status" data-tone={status.tone} role="status" aria-live="polite">{status.message}</p>
	{/if}
</div>

<style>
	.backup { margin-top: var(--s3); }

	.actions {
		display: flex;
		gap: var(--s2);
		flex-wrap: wrap;
	}

	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.confirm {
		margin-top: var(--s3);
		padding: var(--s3) var(--s4);
		max-width: 36rem;
		width: min(36rem, calc(100% - 2rem));
		border-radius: var(--r-md);
		border: none;
		border-inline-start: 3px solid var(--warn);
		background: var(--warn-soft);
		color: inherit;
		font-size: 0.87rem;
		line-height: 1.6;
		overscroll-behavior: contain;
	}
	.confirm::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.confirm p { margin: 0 0 var(--s3); }
	.confirm .actions { margin: 0; }

	.status {
		margin: var(--s3) 0 0;
		padding: var(--s2) var(--s3);
		border-radius: var(--r-sm);
		font-size: 0.85rem;
		line-height: 1.5;
		border-inline-start: 3px solid var(--rule-strong);
		background: var(--paper-sunk);
	}
	.status[data-tone='right'] { border-inline-start-color: var(--good); background: var(--good-soft); color: var(--good); }
	.status[data-tone='wrong'] { border-inline-start-color: var(--bad); background: var(--bad-soft); color: var(--bad); }

	@media (forced-colors: active) {
		.confirm { background: Canvas; border-inline-start-color: ButtonText; }
		.status { background: Canvas; border-inline-start-color: ButtonBorder; }
		.status[data-tone='right'] { border-inline-start-color: Highlight; color: CanvasText; }
		.status[data-tone='wrong'] { border-inline-start-color: ButtonText; color: CanvasText; }
	}
</style>
