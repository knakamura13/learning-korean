<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		article,
		well,
		after
	}: {
		article: Snippet;
		well: Snippet;
		after?: Snippet;
	} = $props();
</script>

<div class="spread">
	<div class="article">{@render article()}</div>
	<div class="stage">
		<div class="well">{@render well()}</div>
		{#if after}
			<div class="after">{@render after()}</div>
		{/if}
	</div>
</div>

<style>
	.spread {
		display: grid;
		gap: var(--s6);
		grid-template-areas:
			'article'
			'stage';
	}

	.article { grid-area: article; min-width: 0; }
	.stage {
		grid-area: stage;
		display: flex;
		flex-direction: column;
		gap: var(--s6);
		min-width: 0;
	}
	.after { min-width: 0; }

	.well {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		min-width: 0;
		min-height: 12rem;
		padding: var(--s5);
		background: var(--paper-sunk);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
	}

	@media (min-width: 72rem) {
		.spread {
			grid-template-columns: minmax(0, var(--measure)) minmax(280px, 1fr);
			grid-template-areas: 'article stage';
			align-items: start;
			max-width: var(--sitting);
		}

		.stage {
			position: sticky;
			inset-block-start: calc(44px + env(safe-area-inset-top) + var(--s3));
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
