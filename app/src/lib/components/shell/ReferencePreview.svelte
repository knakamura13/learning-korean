<script lang="ts">
	import {
		PREVIEW_HOVER_BUFFER_PX,
		type PopoverPlacement,
		type PreviewOpenMode
	} from '$lib/domain/labPreview';
	import type { ReferencePreviewModel } from '$lib/domain/referenceNav';

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
		model: ReferencePreviewModel;
		placement: PopoverPlacement;
		panelId: string;
		mode: PreviewOpenMode;
		onClose: () => void;
		onMeasure?: (size: { w: number; h: number }) => void;
		onPointerEnter?: () => void;
		onPointerLeave?: (e: PointerEvent) => void;
	} = $props();

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
		<p class="eyebrow">{model.nav}</p>
		<h2 id="{panelId}-title">{model.title}</h2>
		<p class="covers">{model.covers}</p>
		{#if mode !== 'pointer'}
			<div class="actions">
				<button class="btn ghost" type="button" onclick={onClose}>Close</button>
			</div>
		{/if}
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

	.covers {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		align-items: center;
		margin-top: var(--s3);
	}

	@media (forced-colors: active) {
		.face {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
			box-shadow: none;
		}
	}
</style>
