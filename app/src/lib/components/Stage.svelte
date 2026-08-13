<script lang="ts">
	import type { StageItem } from '$lib/content/types';

	let { items, vs, size = 'lg' }: {
		items: StageItem[];
		vs?: string;
		size?: 'lg' | 'md';
	} = $props();

	// More than two glyphs on the stage would overflow at full size.
	const scale = $derived(size === 'md' || items.length > 3 ? 'md' : 'lg');
</script>

<div class="stage" class:md={scale === 'md'}>
	{#each items as item, i (item.glyph + i)}
		{#if i > 0 && vs}
			<span class="vs">{vs}</span>
		{/if}
		<div class="item">
			<span class="glyph" lang="ko">{item.glyph}</span>
			{#if item.caption}<span class="cap">{item.caption}</span>{/if}
		</div>
	{/each}
</div>

<style>
	.stage {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s5);
		flex-wrap: wrap;
		padding: var(--s5) 0 var(--s6);
	}

	.item { text-align: center; }

	.glyph {
		font-family: var(--hangul);
		font-size: 4.6rem;
		font-weight: 500;
		line-height: 1;
		display: block;
	}

	.stage.md .glyph { font-size: 3rem; }

	.cap {
		display: block;
		font-size: 0.66rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-top: var(--s2);
	}

	.vs {
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ink-faint);
		align-self: center;
	}

	@media (max-width: 34rem) {
		.glyph { font-size: 3.2rem; }
		.stage.md .glyph { font-size: 2.3rem; }
		.stage { gap: var(--s4); }
	}
</style>
