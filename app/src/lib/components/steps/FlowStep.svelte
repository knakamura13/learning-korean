<script lang="ts">
	import { applyFlow, flowAction, type FlowAction } from '$lib/domain/hangul';
	import type { FlowStep } from '$lib/content/types';
	import { fly } from 'svelte/transition';

	let { step, onSettle, onNudge }: {
		step: FlowStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	const spoken = $derived(applyFlow(step.word));
	const want = $derived(flowAction(step.word));

	type PickId = FlowAction['type'];

	const choices = [
		{ id: 'lateral' as const, label: 'Flow (ㄹㄹ)' },
		{ id: 'nasal' as const, label: 'Yield (ㄴ)' },
		{ id: 'stay' as const, label: 'Stay' }
	];

	let picked = $state<PickId | null>(null);
	const solved = $derived(picked === want.type);

	function missCopy(which: PickId): string {
		if (which === 'nasal' && want.type === 'lateral') {
			return '<p><span class="jamo">ㄴ</span> is touching <span class="jamo">ㄹ</span> directly. Direct contact flows to <span class="jamo">ㄹㄹ</span>.</p>';
		}
		if (which === 'lateral' && want.type === 'nasal') {
			return '<p>The batchim is <span class="jamo">ㅁ</span> or <span class="jamo">ㅇ</span> — a nasal wall. <span class="jamo">ㄹ</span> cannot flow through it.</p>';
		}
		if (which === 'stay' && want.type === 'lateral') {
			return '<p>Try saying <span class="jamo">ㄴ</span> then <span class="jamo">ㄹ</span> at full speed. The tongue refuses.</p>';
		}
		if (which === 'stay' && want.type === 'nasal') {
			return '<p>A lead <span class="jamo">ㄹ</span> after <span class="jamo">ㅁ</span>/<span class="jamo">ㅇ</span> never survives as written.</p>';
		}
		return '<p>Look at the junction again: is <span class="jamo">ㄹ</span> even involved?</p>';
	}

	function pick(which: PickId) {
		if (solved) return;
		picked = which;
		if (which === want.type) onSettle();
		else onNudge(missCopy(which));
	}
</script>

<div class="word">
	<span class="w" lang="ko">{step.word}</span>
	{#if step.gloss}<span class="gloss">{step.gloss}</span>{/if}
</div>

<p class="q">An <span class="jamo">ㄹ</span> at the junction. Flow to ㄹㄹ, yield to ㄴ, or stay?</p>

<div class="picks" role="group" aria-label="ㄹ junction choices">
	{#each choices as choice (choice.id)}
		<button
			class="pick stay"
			class:right={solved && picked === choice.id}
			class:wrong={picked === choice.id && !solved}
			class:dim={solved && picked !== choice.id}
			disabled={solved}
			onclick={() => pick(choice.id)}
		>{choice.label}</button>
	{/each}
</div>

{#if solved}
	<p class="pron" in:fly={{ y: 8, duration: 260 }}>
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
