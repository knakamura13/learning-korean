<script lang="ts">
	/** "Build 김 — Kim" — the goal line above every composer. */
	let { target, name, verb = 'Build' }: {
		target: string;
		name?: string;
		verb?: string;
	} = $props();
</script>

<p class="target">
	{verb}
	<b lang="ko">{target}</b>
	{#if name}<span class="name">— {name}</span>{/if}
</p>

<style>
	.target {
		text-align: center;
		font-size: 0.82rem;
		color: var(--ink-soft);
		margin: 0 0 var(--s3);
	}

	b {
		font-family: var(--hangul);
		font-size: 1.6rem;
		font-weight: 600;
		color: var(--accent);
		vertical-align: -0.22em;
		margin: 0 0.15rem;
	}

	.name { font-style: italic; }
</style>
