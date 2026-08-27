<script lang="ts">
	import { resolve } from '$app/paths';
	import { fly } from 'svelte/transition';
	import { attachModalDialog, requestModalClose } from '$lib/a11y/attachModalDialog';
	import { motion } from '$lib/a11y/motion';
	import type { LockedLabPopoverCopy } from '$lib/domain/lockedLab';

	let {
		copy,
		priorId,
		skipId,
		onDismiss,
		onSkip
	}: {
		copy: LockedLabPopoverCopy;
		priorId: string | null;
		skipId: string;
		onDismiss: () => void;
		onSkip: () => void;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	function attachLockedDialog(node: HTMLDialogElement) {
		dialogEl = node;
		const stopModal = attachModalDialog(node, onDismiss);
		queueMicrotask(() => node.querySelector<HTMLElement>('a.btn, button')?.focus());
		return () => {
			dialogEl = null;
			stopModal();
		};
	}

	function dismiss() {
		if (dialogEl) requestModalClose(dialogEl, onDismiss);
		else onDismiss();
	}

	function onBackdropPointerDown(e: PointerEvent) {
		if (e.target === e.currentTarget) dismiss();
	}
</script>

<dialog
	id="locked-lab-pop"
	class="pop"
	aria-labelledby="locked-lab-pop-title"
	aria-describedby="locked-lab-pop-body"
	{@attach attachLockedDialog}
	onpointerdown={onBackdropPointerDown}
	in:fly={motion({ y: 28, duration: 220 })}
>
	<div class="sheet-head">
		<h2 id="locked-lab-pop-title">{copy.title}</h2>
		<button type="button" class="close" aria-label="Close" title="Close" onclick={dismiss}>
			<span aria-hidden="true">×</span>
		</button>
	</div>
	<p class="lead" id="locked-lab-pop-body">{copy.body}</p>
	<div class="actions">
		{#if priorId && copy.priorLabel}
			<a class="btn" href={resolve('/lab/[id]', { id: priorId })}>{copy.priorLabel}</a>
		{/if}
		<a
			class="btn ghost"
			href={resolve('/lab/[id]', { id: skipId })}
			onclick={onSkip}
		>{copy.skipLabel}</a>
		<button class="btn ghost" type="button" onclick={dismiss}>{copy.dismissLabel}</button>
	</div>
</dialog>

<style>
	.pop {
		position: fixed;
		inset: 0;
		margin: auto;
		z-index: 7;
		width: var(--popover-max);
		max-width: calc(100% - 2rem);
		height: fit-content;
		max-height: min(90dvh, 36rem);
		padding: var(--s4);
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-2);
		color: var(--ink);
		overscroll-behavior: contain;
		overflow: auto;
	}
	.pop::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}

	.sheet-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--s3);
		margin-bottom: var(--s2);
	}

	.close {
		appearance: none;
		display: inline-grid;
		place-items: center;
		flex: 0 0 auto;
		width: 44px;
		height: 44px;
		margin: calc(-1 * var(--s2)) calc(-1 * var(--s2)) 0 0;
		padding: 0;
		border: 0;
		border-radius: var(--r-md);
		background: transparent;
		color: var(--ink-soft);
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
	}
	.close:hover,
	.close:focus-visible {
		color: var(--ink);
		background: var(--paper-sunk);
	}

	.sheet-head h2 {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.15rem;
		font-weight: 400;
		margin: 0;
		padding-block-start: 0.35rem;
		min-width: 0;
		flex: 1 1 auto;
	}

	.lead {
		margin: 0 0 var(--s4);
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--s2);
	}
	.actions :global(.btn) {
		justify-content: center;
		width: 100%;
	}

	/* Phones: bottom sheet, not tap-anchored or mid-screen floating. */
	@media (max-width: 40rem) {
		.pop {
			inset: auto 0 0 0;
			margin: 0;
			width: 100%;
			max-width: none;
			max-height: min(88dvh, 34rem);
			padding-bottom: max(var(--s4), env(safe-area-inset-bottom));
			border-radius: var(--r-md) var(--r-md) 0 0;
			border-bottom: 0;
		}
	}

	@media (forced-colors: active) {
		.pop {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
			box-shadow: none;
		}
		.pop::backdrop {
			background: Canvas;
		}
		.close {
			color: ButtonText;
		}
	}
</style>
