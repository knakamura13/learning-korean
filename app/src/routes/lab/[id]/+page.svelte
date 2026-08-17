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

{#if gated && prior}
	<aside class="gate" role="status">
		<strong>Lab {String(prior.number).padStart(2, '0')} comes first.</strong>
		This lab assumes you have finished
		<a href="/lab/{prior.id}">{prior.title}</a>.
		You can still look around — the cards will make more sense in order.
	</aside>
{/if}

{#key lab.id}
	<LabRunner {lab} />
{/key}

<style>
	.gate {
		max-width: var(--measure);
		border: 1px solid var(--warn);
		background: var(--warn-soft);
		padding: var(--s3) var(--s4);
		margin: var(--s5) 0 0;
		font-size: 0.86rem;
		line-height: 1.55;
		border-radius: var(--r-sm);
	}
	.gate strong {
		display: block;
		margin-bottom: var(--s1);
		color: var(--warn);
	}

	@media (forced-colors: active) {
		.gate {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
	}
</style>
