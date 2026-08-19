<script lang="ts">
	import LookPicker from '$lib/components/LookPicker.svelte';

	/** Cleared when look/color localStorage writes fail this visit (Task 7 Backup note). */
	let appearanceSaved = $state(true);
</script>

<svelte:head><title>Settings</title></svelte:head>

<div class="shell">
	<header class="head">
		<h1>Settings</h1>
	</header>

	<section class="appearance" aria-labelledby="appearance-heading">
		<h2 id="appearance-heading">Appearance</h2>
		<LookPicker onPersistFail={() => (appearanceSaved = false)} />
	</section>
</div>

<style>
	.shell {
		max-width: var(--shell);
	}

	.head {
		margin-block-end: var(--s6);
	}

	.head h1 {
		margin: 0;
		font-family: var(--display);
		font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem);
		font-weight: 600;
		line-height: 1.2;
		color: var(--ink);
	}

	.appearance h2 {
		margin: 0 0 var(--s4);
		font-family: var(--display);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--ink);
	}
</style>
