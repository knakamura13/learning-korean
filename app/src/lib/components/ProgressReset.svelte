<script lang="ts">
	import { focusWhen } from '$lib/a11y/shortcuts';
	import { attachModalDialog } from '$lib/a11y/attachModalDialog';

	let { onReset }: { onReset: () => void } = $props();

	let confirming = $state(false);
	let status = $state<string | null>(null);

	function requestReset() {
		status = null;
		confirming = true;
	}

	function cancelReset() {
		confirming = false;
	}

	function confirmReset() {
		onReset();
		confirming = false;
		status = 'Progress cleared in this browser. Labs and Review start over.';
	}
</script>

<div class="reset">
	<button type="button" class="btn ghost" onclick={requestReset}>Reset progress…</button>

	{#if confirming}
		<dialog
			class="confirm"
			aria-labelledby="reset-copy"
			{@attach (node: HTMLDialogElement) => attachModalDialog(node, cancelReset)}
		>
			<p id="reset-copy">
				Clear all review history and lab place in this browser? This cannot be undone unless you
				have a backup file.
			</p>
			<div class="actions">
				<button type="button" class="btn" onclick={confirmReset}>Clear progress</button>
				<button type="button" class="btn ghost" use:focusWhen={true} onclick={cancelReset}>
					Cancel
				</button>
			</div>
		</dialog>
	{/if}

	{#if status}
		<p class="status" data-tone="right" role="status" aria-live="polite">{status}</p>
	{/if}
</div>

<style>
	.reset { margin-top: var(--s3); }

	.actions {
		display: flex;
		gap: var(--s2);
		flex-wrap: wrap;
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
		border-inline-start: 3px solid var(--good);
		background: var(--good-soft);
		color: var(--good);
	}

	@media (forced-colors: active) {
		.confirm { background: Canvas; border-inline-start-color: ButtonText; }
		.status { background: Canvas; border-inline-start-color: Highlight; color: CanvasText; }
	}
</style>
