<script lang="ts">
	import { batchimSound, clusterParts } from '$lib/domain/hangul';
	import type { ClusterStep } from '$lib/content/types';
	import { fly } from 'svelte/transition';

	let { step, onSettle, onNudge }: {
		step: ClusterStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	// Derived, never authored: a card cannot disagree with the phonology.
	const winner = $derived(batchimSound(step.cluster));
	const parts = $derived(clusterParts(step.cluster) ?? []);

	let picked = $state<string | null>(null);
	const solved = $derived(picked === winner);

	function pick(jamo: string) {
		if (solved) return;
		picked = jamo;
		if (jamo === winner) onSettle();
		else
			onNudge(
				'<p>Not that one. Say the word slowly — which consonant do you actually hear at the end of the first block?</p>'
			);
	}
</script>

<div class="word">
	<span class="w" lang="ko">{step.word}</span>
	{#if step.gloss}<span class="gloss">{step.gloss}</span>{/if}
</div>

<p class="q">
	The bottom slot holds <span class="cl" lang="ko">{step.cluster}</span> — two consonants. Only one of
	them is pronounced. Which?
</p>

<div class="picks">
	{#each parts as jamo (jamo)}
		<button
			class="pick"
			class:right={solved && jamo === winner}
			class:wrong={picked === jamo && jamo !== winner}
			class:dim={solved && jamo !== winner}
			disabled={solved}
			onclick={() => pick(jamo)}
			lang="ko"
		>{jamo}</button>
	{/each}
</div>

{#if solved}
	<p class="pron" in:fly={{ y: 8, duration: 260 }}>
		<span class="hg" lang="ko">{step.word}</span>
		<span class="arr">is said</span>
		<span class="hg said" lang="ko">{step.pron}</span>
	</p>
{/if}

<style>
	.word { text-align: center; padding: var(--s2) 0 var(--s3); }

	.w {
		font-family: var(--hangul);
		font-size: 4rem;
		font-weight: 500;
		line-height: 1.05;
		display: block;
	}

	.gloss {
		display: block;
		font-size: 0.78rem;
		color: var(--ink-faint);
		font-style: italic;
		margin-top: var(--s1);
	}

	.q {
		text-align: center;
		font-size: 0.86rem;
		color: var(--ink-soft);
		margin: 0 auto var(--s4);
		max-width: 26rem;
	}

	.cl {
		font-family: var(--hangul);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--blue);
		vertical-align: -0.22em;
	}

	.picks { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s2); }

	.pick {
		appearance: none;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		font-family: var(--hangul);
		font-size: 2.4rem;
		font-weight: 500;
		padding: 0.5rem;
		min-height: 4.2rem;
		cursor: pointer;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}
	.pick:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.pick:active:not(:disabled) { transform: translateY(0); }
	.pick:disabled { cursor: default; }
	.pick.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
	.pick.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }
	.pick.dim { opacity: 0.4; }

	@media (forced-colors: active) {
		.pick {
			background: ButtonFace;
			color: ButtonText;
			border-color: ButtonText;
		}
		.pick.right {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
		.pick.wrong { border-color: ButtonText; border-width: 3px; }
	}

	.pron {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s3);
		flex-wrap: wrap;
		margin: var(--s4) 0 0;
		padding: var(--s3);
		background: var(--paper-sunk);
		border-radius: var(--r-md);
	}
	.pron .hg { font-family: var(--hangul); font-size: 1.9rem; font-weight: 500; }
	.pron .said { color: var(--good); }
	.arr {
		font-size: 0.66rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}
</style>
