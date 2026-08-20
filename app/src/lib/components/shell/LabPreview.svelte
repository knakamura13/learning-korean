<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		PREVIEW_HOVER_BUFFER_PX,
		type PopoverPlacement,
		type PreviewOpenMode
	} from '$lib/domain/hoverPlacement';
	import type { LabPreviewModel } from '$lib/domain/labPreview';
	import { progress } from '$lib/stores/progress.svelte';

	let {
		model,
		placement,
		panelId,
		mode,
		onClose,
		onMeasure,
		onPointerEnter,
		onPointerLeave
	}: {
		model: LabPreviewModel;
		placement: PopoverPlacement;
		panelId: string;
		mode: PreviewOpenMode;
		onClose: () => void;
		onMeasure?: (size: { w: number; h: number }) => void;
		onPointerEnter?: () => void;
		onPointerLeave?: (e: PointerEvent) => void;
	} = $props();

	function actionClass(label: LabPreviewModel['actionLabel']): string {
		switch (label) {
			case 'Open lab':
				return 'btn';
			case 'Open anyway':
				return 'btn ghost';
			default: {
				const _exhaustive: never = label;
				return _exhaustive;
			}
		}
	}

	function reportSize(node: HTMLElement) {
		const notify = () => onMeasure?.({ w: node.offsetWidth, h: node.offsetHeight });
		const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(notify) : null;
		ro?.observe(node);
		notify();
		return () => ro?.disconnect();
	}
</script>

<div
	id={panelId}
	class="preview"
	style:--preview-x="{placement.left}px"
	style:--preview-y="{placement.top}px"
	style:--preview-buffer="{PREVIEW_HOVER_BUFFER_PX}px"
	role="group"
	aria-labelledby="{panelId}-title"
	onpointerenter={onPointerEnter}
	onpointerleave={onPointerLeave}
>
	<div class="face" {@attach reportSize}>
		<p class="eyebrow">{model.eyebrow}</p>
		<h2 id="{panelId}-title">{model.title}</h2>
		<p class="standfirst">{model.standfirst}</p>
		<p class="meta">~{model.minutes} min · {model.cardCount} cards</p>
		{#if model.chip}
			<p class="chip" data-kind={model.chipKind}>{model.chip}</p>
		{/if}
		<div class="actions">
			{#if model.priorId && model.priorActionLabel}
				<a class="btn" href={resolve('/lab/[id]', { id: model.priorId })}>
					{model.priorActionLabel}
				</a>
			{/if}
			<a
				class={actionClass(model.actionLabel)}
				href={resolve('/lab/[id]', { id: model.id })}
				title={model.locked
					? 'This skip stays open. Review still waits until you finish the sitting.'
					: undefined}
				onclick={() => {
					if (model.locked) progress.openLab(model.id);
				}}
			>
				{model.actionLabel}
			</a>
			{#if mode !== 'pointer'}
				<button class="btn ghost" type="button" onclick={onClose}>Close</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.preview {
		position: fixed;
		inset-inline-start: calc(var(--preview-x) - var(--preview-buffer));
		inset-block-start: calc(var(--preview-y) - var(--preview-buffer));
		z-index: 6;
		padding: var(--preview-buffer);
		background: transparent;
		border: none;
		box-shadow: none;
		color: var(--ink);
		opacity: 1;
		transition: opacity var(--fast) var(--ease);
	}

	.face {
		width: min(20rem, calc(100vw - 1.5rem));
		padding: var(--s4);
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-2);
	}

	.eyebrow {
		margin-bottom: var(--s1);
	}

	h2 {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.2rem;
		font-weight: 400;
		margin: 0 0 var(--s2);
		overflow-wrap: anywhere;
	}

	.standfirst {
		margin: 0 0 var(--s3);
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.meta {
		margin: 0 0 var(--s2);
		font-size: 0.75rem;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		margin: 0 0 var(--s3);
		padding: 0.12rem 0.5rem;
		border-radius: var(--r-pill);
		font-size: 0.66rem;
		font-weight: 600;
		line-height: 1.2;
		border: 1px solid transparent;
		cursor: default;
	}
	.chip[data-kind='locked'] {
		color: var(--warn);
		background: var(--warn-soft);
		border-color: color-mix(in srgb, var(--warn) 30%, transparent);
	}
	.chip[data-kind='resume'] {
		color: var(--rose);
		background: var(--rose-soft);
		border-color: color-mix(in srgb, var(--rose) 30%, transparent);
	}
	.chip[data-kind='start'] {
		color: var(--accent-ink);
		background: var(--accent);
		border-color: var(--accent);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		align-items: center;
	}

	@media (forced-colors: active) {
		.face {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
			box-shadow: none;
		}
		.chip[data-kind='resume'] {
			border-color: LinkText;
			color: LinkText;
		}
	}
</style>
