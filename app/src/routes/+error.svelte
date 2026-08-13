<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong');
</script>

<svelte:head>
	<title>{status} — Korean</title>
</svelte:head>

<div class="shell">
	<div class="card empty">
		<span class="big">한</span>
		<p class="eyebrow">{status}</p>
		<h1>{status === 404 ? 'This page is not in the course' : 'Something went wrong'}</h1>
		<p>{message}</p>
		<a class="btn" href="/">Back to labs</a>
	</div>
</div>

<style>
	.empty { padding: var(--s7) var(--s5); text-align: center; }
	.big {
		font-family: var(--hangul);
		font-size: 3.2rem;
		display: block;
		margin-bottom: var(--s3);
	}
	.empty h1 { margin-bottom: var(--s2); }
	.empty p:not(.eyebrow) {
		color: var(--ink-soft);
		font-size: 0.92rem;
		max-width: 28rem;
		margin: 0 auto var(--s4);
	}
</style>
