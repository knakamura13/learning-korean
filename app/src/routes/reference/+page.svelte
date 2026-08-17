<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { page } from '$app/state';
	import FascicleSpread from '$lib/components/shell/FascicleSpread.svelte';
	import SpecimenWell from '$lib/components/shell/SpecimenWell.svelte';
	import PlateText from '$lib/components/shell/PlateText.svelte';
	import { LABS } from '$lib/content';
	import { buildCourseNavView, labCardState, toCourseLab } from '$lib/domain/courseNav';
	import { progress } from '$lib/stores/progress.svelte';
	import { labSession } from '$lib/stores/labSession.svelte';
	import {
		PLATE_TEXT_CATALOG,
		plateTextFromHash,
		plateTextKind,
		plateTextPermalink,
		type PlateTextId
	} from '$lib/domain/plateText';

	let ready = $state(false);
	let hash = $state('');

	onMount(() => {
		progress.tick();
		ready = true;
		hash = window.location.hash;
	});

	function onHashChange() {
		hash = window.location.hash;
	}

	function backToCatalog(event: MouseEvent) {
		event.preventDefault();
		hash = '';
		history.replaceState(null, '', resolve('/reference'));
	}

	const course = LABS.map(toCourseLab);
	const navView = $derived(
		buildCourseNavView({
			ready,
			isUnlocked: (tier) => progress.isUnlocked(tier),
			sessionFor: (id) => labSession.forLab(id),
			queue: progress.stats.queue
		})
	);

	function locked(id: PlateTextId): boolean {
		if (plateTextKind(id) === 'apparatus') return false;
		const lab = course.find((item) => item.id === id);
		if (!lab) return true;
		return labCardState(lab, course, navView).locked;
	}

	const requested = $derived(plateTextFromHash(hash || page.url.hash));
	const selected = $derived(requested && !locked(requested) ? requested : null);
	const wellCaption = $derived(
		selected
			? PLATE_TEXT_CATALOG.find((plate) => plate.id === selected)?.caption ??
				'Plate text — generated from the same module the labs use.'
			: 'Catalog of plates. Open plate text for one family at a time.'
	);
</script>

<svelte:window onhashchange={onHashChange} />

<svelte:head><title>Reference — index of plates</title></svelte:head>

<FascicleSpread>
	{#snippet article()}
		{#if selected}
			<p class="back">
				<a href={resolve('/reference')} onclick={backToCatalog}>Back to catalog</a>
			</p>
			<PlateText plateId={selected} />
		{:else}
			<div class="catalog">
				<header class="head">
					<p class="eyebrow">Reference</p>
					<h1>Index of plates</h1>
					<p class="lede">
						A catalog of plates — accession, jamo, one-line caption. Full prose is a second step.
					</p>
				</header>
				<ol class="plates">
					{#each PLATE_TEXT_CATALOG as plate (plate.id)}
						<li>
							{#if locked(plate.id)}
								<span class="row locked" title="Not yet derived.">
									<span class="num">{plate.labNumber ? String(plate.labNumber).padStart(2, '0') : '—'}</span>
									<span class="jamo" lang="ko">{plate.jamo}</span>
									<span class="ttl">{plate.title}</span>
									<span class="cap">Not yet derived.</span>
								</span>
							{:else}
								<a class="row" href={resolve(plateTextPermalink(plate.id) as Pathname)}>
									<span class="num">{plate.labNumber ? String(plate.labNumber).padStart(2, '0') : '—'}</span>
									<span class="jamo" lang="ko">{plate.jamo}</span>
									<span class="ttl">{plate.title}</span>
									<span class="cap">{plate.caption}</span>
								</a>
							{/if}
						</li>
					{/each}
				</ol>
			</div>
		{/if}
	{/snippet}
	{#snippet well()}
		<SpecimenWell caption={wellCaption} />
	{/snippet}
</FascicleSpread>

<style>
	.back {
		margin: 0 0 var(--s4);
		font-size: 12px;
	}
	.back a {
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		text-decoration-thickness: 1px;
	}
	.back a:hover { text-decoration-thickness: 2px; }

	.head { margin-bottom: var(--s6); }
	h1 { margin: var(--s2) 0 var(--s3); }
	.lede { color: var(--ink-soft); }

	.plates {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 3ch 4.5rem 1fr;
		column-gap: var(--s3);
		row-gap: var(--s1);
		align-items: baseline;
		padding: var(--s2) 0;
		min-height: 44px;
		text-decoration: none;
		color: inherit;
		border-block-end: 1px solid var(--rule);
	}
	.row.locked { opacity: 0.7; }
	.num {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		color: var(--ink-faint);
	}
	.jamo {
		font-family: var(--hangul);
		font-size: 1.25rem;
		font-weight: 500;
	}
	.ttl {
		overflow: hidden;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.cap {
		grid-column: 2 / -1;
		font-size: 12px;
		color: var(--ink-soft);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
