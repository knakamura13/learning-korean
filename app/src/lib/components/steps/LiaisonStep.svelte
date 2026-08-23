<script lang="ts">
	import { applyLiaison, liaisonAction, liaisonSources } from '$lib/domain/hangul';
	import type { LiaisonStep } from '$lib/content/types';
	import { fly } from 'svelte/transition';
	import { motion } from '$lib/a11y/motion';

	let { step, onSettle, onNudge }: {
		step: LiaisonStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	const spoken = $derived(applyLiaison(step.word));
	const want = $derived(liaisonAction(step.word));
	const sources = $derived(liaisonSources(step.word));

	let picked = $state<string | null>(null);
	const solved = $derived(
		picked !== null &&
			(want.type === 'stay' ? picked === 'stay' : picked === want.jamo)
	);

	function missCopy(which: string): string {
		if (which === 'stay') {
			return '<p>The next block starts with an empty <span class="jamo">ㅇ</span>. Something can fill it.</p>';
		}
		if (which === 'ㅇ' && want.type === 'stay') {
			return '<p>If that <span class="jamo">ㅇ</span> leaves, it becomes a silent placeholder and the <em>ng</em> disappears.</p>';
		}
		if (want.type === 'move' && which !== want.jamo) {
			return '<p>That letter keeps the first block closed. The crowded-out one is the one that jumps.</p>';
		}
		return '<p>Not that one.</p>';
	}

	function pick(which: string) {
		if (solved) return;
		const ok = want.type === 'stay' ? which === 'stay' : which === want.jamo;
		picked = which;
		if (ok) onSettle();
		else onNudge(missCopy(which));
	}
</script>

<div class="word">
	<span class="w" lang="ko">{step.word}</span>
	{#if step.gloss}<span class="gloss">{step.gloss}</span>{/if}
</div>

<p class="q">Which letter jumps into the next <span class="cl" lang="ko">ㅇ</span>? Or does it stay?</p>

<div class="picks" role="group" aria-label="Liaison choices">
	{#each sources as jamo (jamo)}
		<button
			class="pick"
			class:right={solved && picked === jamo}
			class:wrong={picked === jamo && !solved}
			class:dim={solved && picked !== jamo}
			disabled={solved}
			onclick={() => pick(jamo)}
			lang="ko"
			aria-label="Move {jamo}"
		>{jamo}</button>
	{/each}
	<button
		class="pick stay"
		class:right={solved && picked === 'stay'}
		class:wrong={picked === 'stay' && !solved}
		class:dim={solved && picked !== 'stay'}
		disabled={solved}
		onclick={() => pick('stay')}
	>Stay</button>
</div>

{#if solved}
	<p class="pron" in:fly={motion({ y: 8, duration: 260 })}>
		<span class="hg" lang="ko">{step.word}</span>
		<span class="arr">is said</span>
		<span class="hg said" lang="ko">[{spoken}]</span>
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
	.picks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5.5rem, 1fr));
		gap: var(--s2);
	}
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
	.pick.stay {
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.pick:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.pick:active:not(:disabled) { transform: translateY(0); }
	.pick:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
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
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}
</style>
