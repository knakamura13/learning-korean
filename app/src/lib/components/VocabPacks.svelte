<script lang="ts">
	import KoText from '$lib/components/KoText.svelte';
	import { DEFAULT_VOCAB_NEW_PER_DAY, tierCountLabel, type TierReviewProgress } from '$lib/domain/srs';
	import { progress } from '$lib/stores/progress.svelte';

	type PackRow = TierReviewProgress & { label: string };

	let {
		packs,
		ready = true,
		openable = false
	}: {
		packs: PackRow[];
		ready?: boolean;
		openable?: boolean;
	} = $props();

	function pct(part: number, whole: number) {
		return whole === 0 ? 0 : Math.round((part / whole) * 100);
	}

	function openPack(id: string) {
		progress.unlock([id]);
	}
</script>

<section id="vocabulary" class="vocab" aria-labelledby="sec-vocab-heading">
	<h2 id="sec-vocab-heading" class="sec" tabindex="-1">Vocabulary</h2>
	{#if !ready}
		<p class="pile-empty">Loading packs…</p>
	{:else if !openable}
		<p class="pile-empty">
			Word packs open after Lab 05 — real words use the whole letter inventory, clusters
			included.
		</p>
	{:else}
		<p class="pile-empty">
			Real words, two lanes: meaning, and — where the spelling lies — pronunciation. Words
			trickle in at {DEFAULT_VOCAB_NEW_PER_DAY} a day, beside the letters, never instead of
			them.
		</p>
		<div class="tiers card" role="region" aria-label="Vocabulary packs">
			{#each packs as pack (pack.id)}
				{@const pctMature = pct(pack.mature, pack.size)}
				{@const pctYoung = pct(pack.young, pack.size)}
				{@const pctUnseen = pct(pack.unseen, pack.size)}
				<div
					class="tier"
					class:locked={!pack.unlocked}
					role="group"
					aria-label="{pack.label}: {pack.unlocked
						? `${pack.mature} mastered, ${pack.young} learning, ${pack.unseen} not started (${pack.size} total)`
						: 'not opened yet'}"
				>
					<span class="nm"><KoText text={pack.label} /></span>
					<span class="track" aria-hidden="true">
						{#if pack.unlocked}
							<span
								class="m"
								style="width:{pctMature}%"
								title="{pack.mature} mastered ({pctMature}%)"
							></span>
							<span
								class="y"
								style="width:{pctYoung}%"
								title="{pack.young} learning ({pctYoung}%)"
							></span>
							<span
								class="n"
								style="width:{pctUnseen}%"
								title="{pack.unseen} not started ({pctUnseen}%)"
							></span>
						{/if}
					</span>
					{#if pack.unlocked}
						<span class="ct" aria-hidden="true">{tierCountLabel(pack)}</span>
					{:else}
						<button type="button" class="btn ghost open-pack" onclick={() => openPack(pack.id)}>
							Open · {pack.size} cards
						</button>
					{/if}
				</div>
			{/each}
			<p class="legend" aria-hidden="true">
				<i class="sw m"></i> mastered
				<i class="sw y"></i> learning
				<i class="sw n"></i> not started
			</p>
		</div>
	{/if}
</section>

<style>
	.vocab {
		margin-bottom: var(--s7);
	}

	.sec {
		font-family: var(--sans);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: 0 0 var(--s3);
	}

	.pile-empty {
		margin: 0 0 var(--s3);
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--ink-soft);
		max-width: 32rem;
	}

	.tiers {
		padding: var(--s4);
	}

	.tier {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) 0;
		border-bottom: 1px solid var(--rule);
		font-size: 0.82rem;
	}

	.tier:last-of-type {
		border-bottom: none;
	}

	.tier.locked {
		color: var(--ink-faint);
	}

	.nm {
		flex: 0 0 9rem;
	}

	.track {
		flex: 1 1 auto;
		height: 8px;
		background: var(--rule);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
	}

	.track .m {
		background: var(--good);
	}

	.track .y {
		background: var(--accent);
	}

	.track .n {
		background: var(--rule-strong);
	}

	.ct {
		flex: 0 0 auto;
		min-width: 8ch;
		text-align: end;
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
	}

	.open-pack {
		flex: 0 0 auto;
		font-size: 0.78rem;
		white-space: nowrap;
	}

	.legend {
		margin: var(--s3) 0 0;
		font-size: 0.75rem;
		color: var(--ink-faint);
		display: flex;
		gap: var(--s4);
		flex-wrap: wrap;
		align-items: center;
	}

	.sw {
		display: inline-block;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 2px;
		margin-inline-end: var(--s1);
	}

	.sw.m {
		background: var(--good);
	}

	.sw.y {
		background: var(--accent);
	}

	.sw.n {
		background: var(--rule-strong);
	}

	@media (forced-colors: active) {
		.track {
			background: Canvas;
		}
		.track .m {
			background: Highlight;
		}
		.track .y {
			background: ButtonText;
		}
		.track .n {
			background: GrayText;
		}
		.sw.m {
			background: Highlight;
		}
		.sw.y {
			background: ButtonText;
		}
		.sw.n {
			background: GrayText;
		}
	}

	@media (max-width: 40rem) {
		.tier {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'nm ct'
				'track track';
			column-gap: var(--s2);
			row-gap: var(--s1);
			align-items: baseline;
		}
		.nm {
			grid-area: nm;
			flex: none;
			min-width: 0;
		}
		.ct,
		.open-pack {
			grid-area: ct;
			min-width: 0;
		}
		.track {
			grid-area: track;
			width: 100%;
		}
	}
</style>
