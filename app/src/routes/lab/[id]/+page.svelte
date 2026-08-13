<script lang="ts">
	import LabRunner from '$lib/components/LabRunner.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let { data } = $props();
	const lab = $derived(data.lab);
	const alreadyDone = $derived(progress.isUnlocked(lab.unlocks));
</script>

<svelte:head>
	<title>Lab {lab.number} — {lab.title}</title>
</svelte:head>

<div class="shell narrow">
	<header class="head">
		<p class="eyebrow">
			Lab {String(lab.number).padStart(2, '0')} · ~{lab.minutes} minutes
			{#if alreadyDone}· completed{/if}
		</p>
		<h1>{lab.title}</h1>
		<p class="standfirst">{lab.standfirst}</p>
	</header>

	<LabRunner {lab} />

	<aside class="ask">
		<span class="h">Stuck on any card?</span>
		Tell me which one and what you picked. A wrong answer here is the most useful thing
		either of us gets — it shows exactly where the system hasn’t clicked.
	</aside>
</div>

<style>
	.narrow { max-width: 44rem; }

	.head { margin-bottom: var(--s6); }

	h1 { margin: var(--s2) 0 var(--s3); }

	.standfirst {
		font-family: var(--serif);
		font-size: 1.1rem;
		font-style: italic;
		color: var(--ink-soft);
		line-height: 1.5;
		margin: 0;
		max-width: var(--measure);
	}

	.ask {
		margin-top: var(--s7);
		padding: var(--s4);
		border: 1px dashed var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		font-size: 0.86rem;
		line-height: 1.6;
		color: var(--ink-soft);
	}

	.ask .h {
		display: block;
		font-weight: 700;
		font-size: 0.64rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: var(--s1);
	}
</style>
