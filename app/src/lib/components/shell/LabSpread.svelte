<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		article,
		well,
		after
	}: {
		article: Snippet;
		well?: Snippet;
		after?: Snippet;
	} = $props();
</script>

<div class={['spread', { solo: !well }]}>
	<div class="article">
		{@render article()}
		{#if !well && after}
			<div class="after">{@render after()}</div>
		{/if}
	</div>
	{#if well}
		<div class="spread-col">
			<div class="well">{@render well()}</div>
			{#if after}
				<div class="after">{@render after()}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.spread {
		display: grid;
		gap: var(--s6);
		grid-template-areas:
			'article'
			'spread-col';
	}

	.spread.solo {
		max-width: var(--measure);
		width: 100%;
		margin-inline: auto;
	}

	.article { grid-area: article; min-width: 0; }
	.spread-col {
		grid-area: spread-col;
		display: flex;
		flex-direction: column;
		gap: var(--s6);
		min-width: 0;
	}
	.after { min-width: 0; flex-shrink: 0; }

	.well {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		flex-shrink: 0;
		min-width: 0;
		min-height: 16rem;
		padding: var(--s5);
		background: var(--paper-sunk);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
	}

	@media (max-width: 40rem) {
		.spread:not(.solo) {
			display: flex;
			flex-direction: column;
			gap: var(--s3);
			min-height: calc(100svh - var(--sitting-bar-block, 48px) - var(--shell-pad-top, var(--s5)) - var(--shell-pad-bottom, var(--s7)));
		}

		.spread:not(.solo) .article {
			flex: 0 0 auto;
		}
		.spread:not(.solo) .spread-col {
			display: contents;
		}
		.spread:not(.solo) .well {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
			overscroll-behavior: contain;
			padding: var(--s3);
		}
		.spread:not(.solo) .after {
			flex: 0 0 auto;
		}
	}

	@media (min-width: 72rem) {
		.spread {
			grid-template-columns: minmax(0, var(--measure)) minmax(280px, 1fr);
			grid-template-areas: 'article spread-col';
			align-items: start;
			max-width: var(--sitting);
		}

		.spread.solo {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas: 'article';
			max-width: var(--measure);
		}

		.spread-col {
			position: sticky;
			inset-block-start: calc(2.75rem + 4px + env(safe-area-inset-top) + var(--s3));
			max-height: calc(100dvh - 2.75rem - 4px - env(safe-area-inset-top) - var(--s3) - var(--s4));
			overflow-y: auto;
			overscroll-behavior: contain;
			scrollbar-width: thin;
			scrollbar-color: var(--ink-faint) var(--paper-sunk);
			scrollbar-gutter: stable;
		}

		.well {
			min-height: 320px;
			min-width: 280px;
		}
	}

	@media (forced-colors: active) {
		.well {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
	}
</style>
