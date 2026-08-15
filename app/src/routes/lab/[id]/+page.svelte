<script lang="ts">
	import { onMount } from 'svelte';
	import LabRunner from '$lib/components/LabRunner.svelte';
	import { LABS } from '$lib/content';
	import { requiredLab, showPrerequisiteGate, toCourseLab } from '$lib/domain/courseNav';
	import { progress } from '$lib/stores/progress.svelte';

	let { data } = $props();
	const lab = $derived(data.lab);
	const course = LABS.map(toCourseLab);

	let ready = $state(false);
	onMount(() => {
		ready = true;
	});

	const item = $derived(toCourseLab(lab));
	const gated = $derived.by(() => {
		const unlocked = new Set(
			course.filter((entry) => progress.isUnlocked(entry.unlocks)).map((entry) => entry.unlocks)
		);
		return showPrerequisiteGate(item, course, {
			ready,
			isUnlocked: (tier) => unlocked.has(tier)
		});
	});
	const prior = $derived(requiredLab(course, lab.requires));
</script>

<svelte:head>
	<title>Lab {lab.number} — {lab.title}</title>
</svelte:head>

<div class="shell narrow">
	{#if gated && prior}
		<aside class="gate card" role="status">
			<strong>Lab {String(prior.number).padStart(2, '0')} comes first.</strong>
			This lab assumes you have finished
			<a href="/lab/{prior.id}">{prior.title}</a>.
			You can still look around — the cards will make more sense in order.
		</aside>
	{/if}

	{#key lab.id}
		<LabRunner {lab}>
			{#snippet letterAsk()}
				<aside class="ask">
					<span class="h">Need a letter?</span>
					The <a href="/reference">reference</a> lists every jamo and rule, generated from the same
					module these cards use.
				</aside>
			{/snippet}
		</LabRunner>
	{/key}
</div>

<style>
	.narrow { max-width: 44rem; }

	.gate {
		border-color: var(--warn);
		background: var(--warn-soft);
		padding: var(--s3) var(--s4);
		margin-bottom: var(--s4);
		font-size: 0.86rem;
		line-height: 1.55;
	}
	.gate strong {
		display: block;
		margin-bottom: var(--s1);
		color: var(--warn);
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

	@media (forced-colors: active) {
		.gate {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
	}
</style>
