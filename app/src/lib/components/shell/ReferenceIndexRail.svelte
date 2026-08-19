<script lang="ts">
	import { onMount } from 'svelte';
	import {
		REFERENCE_SECTIONS,
		referencePreviewModel,
		type ReferencePreviewModel
	} from '$lib/domain/referenceNav';
	import { HoverPreview } from './hoverPreview.svelte';
	import ReferencePreview from './ReferencePreview.svelte';

	let {
		activeId = null,
		onJump
	}: {
		activeId?: string | null;
		onJump: (id: string, event: MouseEvent) => void;
	} = $props();

	const items = REFERENCE_SECTIONS.map(referencePreviewModel);
	const hover = new HoverPreview({
		panelId: 'ref-index-preview',
		itemSelector: '[data-ref-index-item]',
		itemIdAttr: 'data-ref-id',
		panelSize: { w: 320, h: 180 }
	});

	const openModel = $derived(items.find((item) => item.id === hover.openId) ?? null);

	function onJumpClick(item: ReferencePreviewModel, e: MouseEvent) {
		hover.prepareActivate();
		onJump(item.id, e);
	}

	function onItemKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
			e.preventDefault();
			hover.focusNeighbor(e.currentTarget, 1);
			return;
		}
		if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
			e.preventDefault();
			hover.focusNeighbor(e.currentTarget, -1);
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			hover.closePreview();
			return;
		}
	}

	onMount(() => {
		hover.syncViewport();
	});
</script>

<svelte:window onkeydown={hover.onWindowKey} onresize={hover.syncViewport} />
<svelte:body onpointermove={hover.openId ? hover.onHoverIntentMove : undefined} />

<nav class="ref-index" aria-label="Jump to section" {@attach hover.bindNav}>
	<p class="rail-label" aria-hidden="true">Jump to section</p>
	<ol>
		{#each items as item (item.id)}
			{@const current = activeId === item.id}
			{@const expanded = hover.openId === item.id}
			<li>
				<a
					class={['jump', { current }]}
					href="#{item.id}"
					data-ref-index-item
					data-ref-id={item.id}
					aria-expanded={expanded}
					aria-controls={expanded ? hover.panelId : undefined}
					aria-current={current ? 'location' : undefined}
					onpointerenter={(e) => hover.onPointerEnter(item.id, e)}
					onpointermove={(e) => hover.onItemPointerMove(item.id, e)}
					onpointerleave={hover.onItemPointerLeave}
					onfocus={(e) => hover.onItemFocus(item.id, e)}
					onfocusout={hover.onItemFocusOut}
					onclick={(e) => onJumpClick(item, e)}
					onkeydown={onItemKeydown}
				>
					{item.nav}
				</a>
			</li>
		{/each}
	</ol>
</nav>

{#if openModel && hover.anchor}
	<ReferencePreview
		model={openModel}
		placement={hover.placement}
		panelId={hover.panelId}
		mode={hover.mode}
		onClose={hover.closePreview}
		onPointerEnter={hover.onPreviewPointerEnter}
		onPointerLeave={hover.onItemPointerLeave}
		onMeasure={(size) => {
			hover.panelSize = size;
		}}
	/>
{/if}

<style>
	.ref-index {
		position: sticky;
		inset-block-start: calc(44px + env(safe-area-inset-top));
		z-index: 4;
		margin: 0 0 var(--s6);
		padding: var(--s2) 0 var(--s3);
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--rule);
	}

	.rail-label {
		margin: 0 0 var(--s2);
		color: var(--ink-faint);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.jump {
		appearance: none;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin: 0;
		padding: 0.25rem 0.55rem;
		border: 1px solid transparent;
		border-radius: var(--r-sm);
		background: transparent;
		font-size: 0.74rem;
		font-weight: 500;
		text-decoration: none;
		color: var(--ink-soft);
		white-space: nowrap;
		cursor: pointer;
	}

	.jump.current {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.jump:hover,
	.jump:focus-visible {
		background: var(--paper-sunk);
		color: var(--ink);
	}
	.jump:active {
		background: var(--paper-sunk);
		color: var(--ink);
		transform: translateY(1px);
	}
	.jump.current:hover,
	.jump.current:focus-visible {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.jump.current:active {
		background: var(--accent-soft);
		color: var(--accent);
		transform: translateY(1px);
	}

	@media (min-width: 72rem) {
		ol {
			flex-direction: column;
			flex-wrap: nowrap;
			gap: var(--s1);
		}
		.ref-index {
			inset-block-start: calc(2.75rem + env(safe-area-inset-top) + var(--s3));
			align-self: start;
			margin: 0;
			padding: 0;
			background: transparent;
			backdrop-filter: none;
			border-bottom: none;
			width: max-content;
		}
		.rail-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.jump {
			width: 100%;
			justify-content: start;
			padding-inline: 0.4rem;
		}
	}

	@media (forced-colors: active) {
		.ref-index {
			background: Canvas;
			border-bottom-color: ButtonBorder;
			backdrop-filter: none;
		}
		.jump {
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.jump.current {
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
