<script lang="ts">
	import Options from '../Options.svelte';
	import type { ReadStep } from '$lib/content/types';
	import { fly } from 'svelte/transition';

	let { step, onSettle }: {
		step: ReadStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let opened = $state<Set<number>>(new Set());
	// Options stay locked until every block has been decoded — the point is to
	// sound the word out, not to recognise it from the answer list.
	const allOpen = $derived(opened.size === step.blocks.length);
	const remaining = $derived(step.blocks.length - opened.size);

	function reveal(i: number) {
		if (opened.has(i)) return;
		opened = new Set([...opened, i]);
	}
</script>

<div class="word">
	{#each step.blocks as b, i (i)}
		<button class="blk" class:open={opened.has(i)} onclick={() => reveal(i)}>
			<span class="ch">{b.block}</span>
			<span class="rd">{opened.has(i) ? b.reading : ''}</span>
		</button>
	{/each}
</div>

<p class="note">
	{#if allOpen}
		Now — what is it?
	{:else}
		Tap each block to check your reading — <b>{remaining}</b> to go
	{/if}
</p>

{#if allOpen}
	<div in:fly={{ y: 10, duration: 240 }}>
		<Options options={step.options} answer={step.answer} onPick={() => onSettle()} />
	</div>
{/if}

<style>
	.word {
		display: flex;
		justify-content: center;
		gap: var(--s2);
		flex-wrap: wrap;
		padding: var(--s3) 0 var(--s1);
	}

	.blk {
		appearance: none;
		font: inherit;
		border: 1px solid transparent;
		border-radius: var(--r-md);
		padding: 0.3rem 0.6rem 0.5rem;
		text-align: center;
		cursor: pointer;
		background: none;
		transition: background var(--fast) var(--ease), border-color var(--fast) var(--ease);
	}
	.blk:hover { background: var(--paper-sunk); border-color: var(--rule); }

	.ch {
		font-family: var(--hangul);
		font-size: 3.4rem;
		font-weight: 500;
		line-height: 1;
		display: block;
	}

	.rd {
		display: block;
		font-family: var(--mono);
		font-size: 0.82rem;
		color: var(--accent);
		margin-top: var(--s1);
		min-height: 1.1em;
		opacity: 0;
		transition: opacity var(--med) var(--ease);
	}

	.blk.open { background: var(--accent-soft); border-color: var(--accent); }
	.blk.open .rd { opacity: 1; }

	.note {
		text-align: center;
		font-size: 0.74rem;
		color: var(--ink-faint);
		margin: 0 0 var(--s4);
	}

	@media (max-width: 34rem) {
		.ch { font-size: 2.6rem; }
	}
</style>
