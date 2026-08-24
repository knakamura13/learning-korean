<script lang="ts">
	import KoText from '$lib/components/KoText.svelte';
	import { tierCountLabel, type TierReviewProgress } from '$lib/domain/srs';

	type TierRow = TierReviewProgress & { label: string };

	let {
		tiers,
		ready = true,
		emptyCopy = 'Letters land here after you finish a lab.'
	}: {
		tiers: TierRow[];
		ready?: boolean;
		emptyCopy?: string;
	} = $props();

	const unlockedCount = $derived(tiers.filter((tier) => tier.unlocked).length);

	function pct(part: number, whole: number) {
		return whole === 0 ? 0 : Math.round((part / whole) * 100);
	}
</script>

<div
	class="tiers card"
	role="region"
	aria-busy={!ready}
	aria-label="Mastery by letter family"
>
	{#if !ready}
		<div class="pile-skel" aria-hidden="true">
			{#each tiers as tier (tier.id)}
				<div class="tier skel-row">
					<span class="nm"><span class="skel line-ph"></span></span>
					<span class="track"></span>
					<span class="ct"><span class="skel line-ph short"></span></span>
				</div>
			{/each}
		</div>
	{:else if unlockedCount === 0}
		<p class="pile-empty">{emptyCopy}</p>
	{:else}
		{#each tiers as tier (tier.id)}
			{@const pctMature = pct(tier.mature, tier.size)}
			{@const pctYoung = pct(tier.young, tier.size)}
			{@const pctUnseen = pct(tier.unseen, tier.size)}
			<div
				class="tier"
				class:locked={!tier.unlocked}
				role="group"
				aria-label="{tier.label}: {tier.unlocked
					? `${tier.mature} mastered, ${tier.young} learning, ${tier.unseen} not started (${tier.size} total)`
					: 'locked'}"
			>
				<span class="nm"><KoText text={tier.label} /></span>
				<span class="track" aria-hidden="true">
					{#if tier.unlocked}
						<span
							class="m"
							style="width:{pctMature}%"
							title="{tier.mature} mastered ({pctMature}%)"
						></span>
						<span
							class="y"
							style="width:{pctYoung}%"
							title="{tier.young} learning ({pctYoung}%)"
						></span>
						<span
							class="n"
							style="width:{pctUnseen}%"
							title="{tier.unseen} not started ({pctUnseen}%)"
						></span>
					{/if}
				</span>
				<span class="ct" aria-hidden="true">{tierCountLabel(tier)}</span>
			</div>
		{/each}
		<p class="legend" aria-hidden="true">
			<i class="sw m"></i> mastered (21+ day gap)
			<i class="sw y"></i> learning
			<i class="sw n"></i> not started
		</p>
	{/if}
</div>

<style>
	.tiers {
		padding: var(--s4);
	}

	.pile-empty {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--ink-soft);
		max-width: 32rem;
	}

	.pile-skel {
		min-height: 16rem;
	}

	.pile-skel .line-ph {
		width: 7rem;
		max-width: 90%;
	}

	.pile-skel .line-ph.short {
		width: 4.5rem;
	}

	.skel-row .track {
		background: var(--paper-sunk);
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
		.ct {
			grid-area: ct;
			min-width: 0;
		}
		.track {
			grid-area: track;
			width: 100%;
		}
	}
</style>
