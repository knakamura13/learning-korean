<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { assets } from '$app/paths';
	import { page } from '$app/state';
	import { pageCanonical, siteAsset } from '$lib/site';
	import { progress } from '$lib/stores/progress.svelte';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { fascicle } from '$lib/stores/fascicle.svelte';
	import { activeSystem } from '$lib/theme/active';
	import { LABS } from '$lib/content';
	import {
		buildCourseNavView,
		continueAction,
		labCardState,
		toCourseLab,
		type ContinueAction
	} from '$lib/domain/courseNav';
	import { jamoIndexEntries } from '$lib/domain/jamoIndex';
	import { plateViews } from '$lib/domain/plateCatalog';
	import {
		labIdFromPath,
		shellFolio,
		type LiveLabFolio
	} from '$lib/domain/sitting';
	import RunningHead from '$lib/components/shell/RunningHead.svelte';
	import PlateRail from '$lib/components/shell/PlateRail.svelte';
	import TocFlyleaf from '$lib/components/shell/TocFlyleaf.svelte';

	let { children } = $props();

	const canonical = $derived(pageCanonical(page.url.pathname));
	const ogImage = $derived(siteAsset('/og.png'));

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
	const currentLabId = $derived(labIdFromPath(page.url.pathname));
	const sittingKind = $derived.by((): ContinueAction['kind'] | null => {
		if (page.url.pathname.includes('/review')) {
			return progress.stats.queue > 0 ? 'review' : 'caught-up';
		}
		if (currentLabId) {
			const lab = course.find((item) => item.id === currentLabId);
			if (!lab) return action?.kind ?? null;
			const card = labCardState(lab, course, navView);
			return card.resumeAt !== null ? 'resume' : 'start';
		}
		return action?.kind ?? null;
	});
	const plates = $derived(
		plateViews(course, navView, { currentLabId, sittingKind })
	);
	const indexEntries = $derived(jamoIndexEntries(course, navView, currentLabId));

	const resumeCard = $derived.by((): LiveLabFolio | null => {
		for (const lab of course) {
			const card = labCardState(lab, course, navView);
			if (card.resumeAt !== null) {
				return { number: lab.number, card: card.resumeAt + 1, total: lab.stepCount };
			}
		}
		if (action?.kind === 'start') {
			const lab = course.find((item) => action.href.endsWith(item.id));
			if (lab) return { number: lab.number, card: 1, total: lab.stepCount };
		}
		return null;
	});

	const folio = $derived(
		shellFolio({
			pathname: page.url.pathname,
			action,
			liveLab: fascicle.liveLab,
			queue: progress.stats.queue,
			resumeCard
		})
	);

	const sittingTitle = $derived(action?.title ?? 'Korean');

	const latinFonts =
		'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600&family=Newsreader:ital,opsz,wght@0,16..72,300;0,16..72,400;1,16..72,400&family=Source+Serif+4:opsz,wght@8..60,400&display=swap';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link rel="stylesheet" href={latinFonts} />
	{#each activeSystem.fonts as face (face.file)}
		<link
			rel="preload"
			href="{assets}/fonts/{face.file}"
			as="font"
			type="font/woff2"
			crossorigin="anonymous"
		/>
	{/each}
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Korean — labs and review" />
	<meta property="og:description" content="Interactive labs and spaced repetition for reading Korean." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Korean — labs and review" />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<RunningHead folio={folio.text} pip={folio.pip} kind={folio.kind} {sittingTitle} />

<div class="spread">
	<PlateRail {plates} />
	<main id="main">
		{@render children()}
	</main>
</div>

<TocFlyleaf {plates} entries={indexEntries} />

<style>
	.skip {
		position: absolute;
		inset-inline-start: -9999px;
		inset-block-start: 0;
		background: var(--accent);
		color: var(--accent-ink);
		padding: var(--s2) var(--s4);
		z-index: 10;
	}
	.skip:focus { inset-inline-start: var(--s3); inset-block-start: var(--s3); }

	@media (forced-colors: active) {
		.skip:focus {
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
