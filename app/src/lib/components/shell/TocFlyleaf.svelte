<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { fascicle } from '$lib/stores/fascicle.svelte';
	import type { PlateView } from '$lib/domain/plateCatalog';
	import { filterJamoIndex, type JamoIndexEntry } from '$lib/domain/jamoIndex';

	let {
		plates,
		entries
	}: {
		plates: PlateView[];
		entries: JamoIndexEntry[];
	} = $props();

	let query = $state('');
	const shown = $derived(filterJamoIndex(entries, query));

	function close() {
		fascicle.setToc(false);
	}

	function onBackdrop(e: MouseEvent) {
		if (e.currentTarget === e.target) close();
	}
</script>

{#if fascicle.tocOpen}
	<div
		id="toc-flyleaf"
		class="scrim"
		role="presentation"
		onclick={onBackdrop}
	>
		<div
			class="flyleaf"
			role="dialog"
			aria-modal="true"
			aria-labelledby="toc-title"
		>
			<header class="head">
				<h2 id="toc-title">Index of plates</h2>
				<button type="button" class="close" onclick={close}>Close</button>
			</header>
			<label class="search-label" for="toc-query">Search</label>
			<input
				id="toc-query"
				class="search"
				type="search"
				bind:value={query}
				placeholder="A romanization or a single jamo"
			/>

			<ol class="plates">
				{#each plates as plate (plate.id)}
					<li>
						{#if plate.locked}
							<span class="plate locked" title="Not yet derived.">
								<span class="num">{plate.label}</span>
								<span class="ttl">{plate.title}</span>
								<span class="cap">Not yet derived.</span>
							</span>
						{:else}
							<a
								class="plate"
								class:here={plate.tone === 'current'}
								href={resolve(plate.href as Pathname)}
								title={plate.tooltip}
								onclick={close}
							>
								<span class="num">{plate.label}</span>
								<span class="ttl">{plate.title}</span>
								{#if plate.tone === 'done'}
									<span class="cap">Read this plate again</span>
								{/if}
							</a>
						{/if}
					</li>
				{/each}
			</ol>

			<h3 class="sub">Letters</h3>
			{#if shown.length === 0}
				<p class="empty">No plate matches. Try a romanization or a single jamo.</p>
			{:else}
				<ul class="letters">
					{#each shown as entry (`${entry.plateId}-${entry.jamo}`)}
						<li>
							<span class="letter" class:locked={entry.locked} class:here={entry.current}>
								<span class="jamo" lang="ko">{entry.jamo}</span>
								<span class="rom">[{entry.rom}]</span>
								<span class="cap" title={entry.caption}>{entry.caption}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}

			<p class="permalink">
				<a href={resolve('/reference')} onclick={close}>Open plate text</a>
				— full encyclopedia, permalink.
			</p>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--ink) 40%, transparent);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: var(--s7) var(--s4);
		overflow: auto;
	}

	.flyleaf {
		width: min(36rem, 100%);
		max-height: 80dvh;
		overflow: auto;
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		padding: var(--s5);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--s3);
		margin-bottom: var(--s4);
	}
	h2 {
		font-size: 1.35rem;
		margin: 0;
	}
	.close {
		appearance: none;
		border: 0;
		background: transparent;
		min-width: 44px;
		min-height: 44px;
		font-size: 12px;
		color: var(--ink-soft);
		cursor: pointer;
		text-decoration: underline;
		text-decoration-thickness: 1px;
	}
	.close:hover { text-decoration-thickness: 2px; color: var(--ink); }

	.search-label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-bottom: var(--s1);
	}
	.search {
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		background: var(--paper-sunk);
		color: var(--ink);
		font-family: var(--mono);
		font-size: 1rem;
		padding: 0.5rem 0.75rem;
		margin-bottom: var(--s5);
	}

	.plates, .letters {
		list-style: none;
		margin: 0 0 var(--s5);
		padding: 0;
	}

	.plate {
		display: grid;
		grid-template-columns: 3ch 1fr;
		column-gap: var(--s3);
		row-gap: var(--s1);
		align-items: baseline;
		padding: var(--s2) 0;
		min-height: 44px;
		text-decoration: none;
		color: inherit;
		border-block-end: 1px solid var(--rule);
	}
	.plate.locked { opacity: 0.7; }
	.plate.here .num { color: var(--accent); }
	.num {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		color: var(--ink-faint);
	}
	.ttl {
		overflow: hidden;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.cap {
		grid-column: 2;
		font-size: 12px;
		color: var(--ink-soft);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.sub {
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: 0 0 var(--s3);
	}

	.letter {
		display: grid;
		grid-template-columns: 2.4rem 4ch 1fr;
		gap: var(--s2);
		align-items: baseline;
		padding: var(--s2) 0;
		border-block-end: 1px solid var(--rule);
		min-height: 44px;
	}
	.letter.locked { opacity: 0.55; }
	.letter.here { box-shadow: inset 2px 0 0 var(--accent); padding-inline-start: var(--s3); }
	.jamo {
		font-family: var(--hangul);
		font-size: 1.25rem;
		font-weight: 500;
	}
	.rom {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--ink-soft);
	}

	.empty {
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.permalink {
		font-size: 12px;
		color: var(--ink-soft);
		margin: 0;
	}

	@media (forced-colors: active) {
		.scrim { background: Canvas; }
		.flyleaf { background: Canvas; border-color: CanvasText; }
		.letter.here { box-shadow: inset 2px 0 0 Highlight; }
	}
</style>
