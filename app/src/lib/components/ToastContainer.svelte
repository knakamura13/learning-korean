<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { motion } from '$lib/a11y/motion';
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

<div class="toast-container" aria-live="polite" aria-atomic="false">
	{#each toastStore.toasts as toast (toast.id)}
		<div
			class="toast-item"
			role="status"
			in:fly={motion({ y: 12, duration: 200 })}
			out:fade={motion({ duration: 150 })}
		>
			<span class="toast-text">{toast.message}</span>
			<button
				type="button"
				class="toast-close"
				aria-label="Dismiss message"
				onclick={() => toastStore.dismiss(toast.id)}
			>
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: var(--s4);
		right: var(--s4);
		z-index: 999;
		display: flex;
		flex-direction: column;
		gap: var(--s2);
		max-width: min(24rem, calc(100vw - var(--s8)));
		pointer-events: none;
	}

	.toast-item {
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s3);
		padding: var(--s3) var(--s4);
		border-radius: var(--r-md);
		border: 1px solid var(--rule-strong);
		background: var(--paper-raised);
		color: var(--ink);
		box-shadow: var(--shadow-2);
		font-size: 0.86rem;
		line-height: 1.4;
	}

	.toast-text {
		flex: 1 1 auto;
	}

	.toast-close {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		min-height: 32px;
		padding: 0;
		border: none;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--ink-faint);
		font-size: 0.85rem;
		cursor: pointer;
		line-height: 1;
		flex: 0 0 auto;
		transition:
			color var(--fast) var(--ease),
			background var(--fast) var(--ease);
	}

	.toast-close:hover {
		color: var(--ink);
		background: var(--paper-sunk);
	}

	.toast-close:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
		color: var(--ink);
	}

	@media (max-width: 40rem) {
		.toast-container {
			left: var(--s4);
			right: var(--s4);
			bottom: var(--s4);
			max-width: none;
		}
	}

	@media (forced-colors: active) {
		.toast-item {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.toast-close {
			color: ButtonText;
		}
		.toast-close:focus-visible {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
