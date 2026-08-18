<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import LabRunner from '$lib/components/LabRunner.svelte';
	import LabIndexRail from '$lib/components/shell/LabIndexRail.svelte';
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

<div class="with-rail">
	<div class="shell sitting">
	{#if gated && prior}
		<aside class="gate card" role="status">
			<strong>Lab {String(prior.number).padStart(2, '0')} comes first.</strong>
			This lab assumes you have finished
			<a href={resolve('/lab/[id]', { id: prior.id })}>{prior.title}</a>.
			You can still look around — the cards will make more sense in order.
		</aside>
	{/if}

	{#key lab.id}
		<LabRunner {lab} />
	{/key}
	</div>
	<LabIndexRail currentId={lab.id} />
</div>

<style>
	.with-rail {
		display: block;
	}
	@media (min-width: 72rem) {
		.with-rail {
			display: grid;
			grid-template-areas: 'rail main';
			grid-template-columns: 56px minmax(0, 1fr);
			column-gap: var(--s4);
			max-width: var(--sitting);
			margin-inline: auto;
		}
		.with-rail .shell {
			grid-area: main;
			max-width: none;
			width: 100%;
		}
		.with-rail :global(.lab-index) {
			grid-area: rail;
		}
	}

	.sitting { max-width: 44rem; }
	@media (min-width: 72rem) {
		.sitting { max-width: none; }
	}

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

	@media (forced-colors: active) {
		.gate {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
	}
</style>
