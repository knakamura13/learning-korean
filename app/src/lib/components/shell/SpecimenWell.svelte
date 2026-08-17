<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CAUGHT_UP_WELL, EMPTY_WELL_CAPTION } from '$lib/domain/sitting';

	let {
		variant = 'figure',
		caption,
		children
	}: {
		variant?: 'empty' | 'caught-up' | 'figure' | 'quiz';
		caption?: string;
		children?: Snippet;
	} = $props();

	const emptyCaption = $derived(
		variant === 'caught-up' ? CAUGHT_UP_WELL : EMPTY_WELL_CAPTION
	);
</script>

<div
	class="well"
	data-variant={variant}
	style:--enter-delay="80ms"
>
	<span class="tick" data-corner="nw" aria-hidden="true"></span>
	<span class="tick" data-corner="ne" aria-hidden="true"></span>
	<span class="tick" data-corner="sw" aria-hidden="true"></span>
	<span class="tick" data-corner="se" aria-hidden="true"></span>

	<div class="figure">
		{#if children}
			{@render children()}
		{:else if variant === 'caught-up'}
			<p class="gap">
				<span class="han" lang="ko">한</span>
				{emptyCaption}
			</p>
		{:else}
			<p class="empty-caption">{emptyCaption}</p>
		{/if}
	</div>
	{#if caption}
		<p class="caption">{caption}</p>
	{/if}
</div>

<style>
	.well {
		position: relative;
		background: var(--paper-sunk);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		min-height: 320px;
		padding: var(--s6) var(--s5);
		animation: rise var(--slow) var(--ease) var(--enter-delay) both;
	}

	@media (min-width: 72rem) {
		.well { min-height: 420px; }
	}

	.tick {
		position: absolute;
		width: 12px;
		height: 12px;
		pointer-events: none;
		border-color: var(--rule-strong);
		border-style: solid;
		border-width: 0;
	}
	.tick[data-corner='nw'] {
		top: 8px;
		inset-inline-start: 8px;
		border-block-start-width: 2px;
		border-inline-start-width: 2px;
	}
	.tick[data-corner='ne'] {
		top: 8px;
		inset-inline-end: 8px;
		border-block-start-width: 2px;
		border-inline-end-width: 2px;
	}
	.tick[data-corner='sw'] {
		bottom: 8px;
		inset-inline-start: 8px;
		border-block-end-width: 2px;
		border-inline-start-width: 2px;
	}
	.tick[data-corner='se'] {
		bottom: 8px;
		inset-inline-end: 8px;
		border-block-end-width: 2px;
		border-inline-end-width: 2px;
	}

	.figure {
		min-height: 12rem;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
	}

	.empty-caption,
	.gap {
		margin: 0;
		text-align: center;
		font-family: var(--serif);
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-soft);
	}

	.han {
		display: block;
		font-family: var(--hangul);
		font-size: 18px;
		font-weight: 500;
		color: var(--accent);
		margin-bottom: var(--s3);
	}

	.caption {
		margin: var(--s4) 0 0;
		text-align: center;
		font-family: var(--display);
		font-style: italic;
		font-size: 13px;
		color: var(--ink-soft);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (forced-colors: active) {
		.well {
			background: Canvas;
			border-color: CanvasText;
		}
		.tick { border-color: CanvasText; }
		.han { color: Highlight; }
	}
</style>
