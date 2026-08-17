<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import FascicleSpread from '$lib/components/shell/FascicleSpread.svelte';
	import SpecimenWell from '$lib/components/shell/SpecimenWell.svelte';

	const status = $derived(page.status);
	const isMissing = $derived(status === 404);
	const detail = $derived(
		page.error?.message && page.error.message !== 'Not Found' ? page.error.message : null
	);
</script>

<svelte:head>
	<title>{status} — Korean</title>
</svelte:head>

<FascicleSpread>
	{#snippet article()}
		<p class="kicker">HTTP {status}</p>
		<h1>{isMissing ? 'This page is not in the course' : 'Something went wrong'}</h1>
		<p class="lead">
			{#if isMissing}
				That address is not a lab, a review, or the reference. Today’s sitting is on the
				home page.
			{:else if detail}
				{detail}
			{:else}
				The page could not be shown. Head back to the sitting and try that step again.
			{/if}
		</p>
		<a class="btn" href={resolve('/')}>Back to the sitting</a>
	{/snippet}
	{#snippet well()}
		<SpecimenWell>
			<span class="big" lang="ko">{isMissing ? '한' : '잠깐'}</span>
		</SpecimenWell>
	{/snippet}
</FascicleSpread>

<style>
	.kicker {
		margin: 0 0 var(--s5);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}
	h1 {
		margin: 0 0 var(--s4);
		font-size: clamp(1.35rem, 3vw, 1.6rem);
	}
	.lead {
		font-family: var(--serif);
		font-size: 18px;
		line-height: 1.6;
		margin: 0 0 var(--s6);
		color: var(--ink-soft);
	}
	.big {
		font-family: var(--hangul);
		font-size: 3.2rem;
		display: block;
		text-align: center;
		color: var(--accent);
	}
</style>
