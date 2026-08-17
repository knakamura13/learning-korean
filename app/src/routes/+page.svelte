<script lang="ts">
	import { onMount } from 'svelte';
	import { LABS } from '$lib/content';
	import {
		buildCourseNavView,
		continueAction,
		labCardState,
		toCourseLab
	} from '$lib/domain/courseNav';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { sittingCopy, isTitlePage, stripInstructionHtml } from '$lib/domain/sitting';
	import FascicleSpread from '$lib/components/shell/FascicleSpread.svelte';
	import SittingArticle from '$lib/components/shell/SittingArticle.svelte';
	import SpecimenWell from '$lib/components/shell/SpecimenWell.svelte';

	let ready = $state(false);
	onMount(() => {
		progress.tick();
		ready = true;
	});

	const course = LABS.map(toCourseLab);
	const navView = $derived(
		buildCourseNavView({
			ready,
			isUnlocked: (tier) => progress.isUnlocked(tier),
			sessionFor: (id) => labSession.forLab(id),
			queue: progress.stats.queue
		})
	);
	const action = $derived(continueAction(course, navView));
	const hasSession = $derived(Object.keys(labSession.all).length > 0);
	const titlePage = $derived(
		isTitlePage({
			ready,
			kind: action?.kind ?? null,
			unlocked: progress.stats.unlocked,
			hasSession
		})
	);

	const resumeLead = $derived.by(() => {
		if (!action || action.kind !== 'resume') return null;
		const lab = LABS.find((item) => action.href.endsWith(item.id));
		if (!lab) return null;
		const card = labCardState(toCourseLab(lab), course, navView);
		if (card.resumeAt === null) return null;
		const step = lab.steps[card.resumeAt];
		return step ? stripInstructionHtml(step.do) : null;
	});

	const copy = $derived(
		action
			? sittingCopy(action, {
					titlePage,
					storageBlocked: ready && !progress.durable,
					resumeLead
				})
			: null
	);

	const wellVariant = $derived.by(() => {
		if (!action || !ready) return 'empty' as const;
		if (action.kind === 'caught-up') return 'caught-up' as const;
		return 'empty' as const;
	});
</script>

<svelte:head><title>Korean — today’s sitting</title></svelte:head>

{#if action && copy}
	<FascicleSpread>
		{#snippet article()}
			<SittingArticle
				{action}
				{copy}
				{titlePage}
				{ready}
				footnoteQueue={action.kind === 'resume' ? progress.stats.queue : 0}
			/>
		{/snippet}
		{#snippet well()}
			<SpecimenWell variant={wellVariant} />
		{/snippet}
	</FascicleSpread>
{/if}
