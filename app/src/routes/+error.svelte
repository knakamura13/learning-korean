<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const isMissing = $derived(status === 404);
	const detail = $derived(
		page.error?.message && page.error.message !== 'Not Found' ? page.error.message : null
	);
</script>

<svelte:head>
	<title>{status} — Korean</title>
</svelte:head>

<div class="shell">
	<div class="card empty">
		<span class="big" lang="ko">{isMissing ? '한' : '잠깐'}</span>
		<p class="eyebrow">HTTP {status}</p>
		<h2>{isMissing ? 'This page is not in the course' : 'Something went wrong'}</h2>
		<p>
			{#if isMissing}
				That address is not a lab, a review, or the reference. The course lives on the
				home page.
			{:else if detail}
				{detail}
			{:else}
				The page could not be shown. Head back to the labs and try that step again.
			{/if}
		</p>
		<a class="btn" href="/">Back to labs</a>
	</div>
</div>

<style>
	.empty { padding: var(--s7) var(--s5); text-align: center; }
	.empty .big {
		font-family: var(--hangul);
		font-size: 3.2rem;
		display: block;
		margin-bottom: var(--s3);
	}
	.empty h2 { margin-bottom: var(--s2); }
	.empty p:not(.eyebrow) {
		color: var(--ink-soft);
		font-size: 0.92rem;
		max-width: 28rem;
		margin: 0 auto var(--s4);
	}
</style>
