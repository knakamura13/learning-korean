<script lang="ts">
	import LabRunner from '$lib/components/LabRunner.svelte';

	let { data } = $props();
	const lab = $derived(data.lab);
</script>

<svelte:head>
	<title>Lab {lab.number} — {lab.title}</title>
</svelte:head>

<div class="shell narrow">
	{#key lab.id}
		<LabRunner {lab} />
	{/key}

	<aside class="ask">
		<span class="h">Need a letter?</span>
		The <a href="/reference">reference</a> lists every jamo and rule, generated from the same
		module these cards use.
	</aside>
</div>

<style>
	.narrow { max-width: 44rem; }

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
