<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { LABS } from '$lib/content';
	import {
		requiredLab,
		toCourseLab,
		type CourseNavView
	} from '$lib/domain/courseNav';
	import {
		decideUnlockedPress,
		isPressPointerType,
		labPreviewModels,
		type LabPreviewModel,
		type PreviewChipKind
	} from '$lib/domain/labPreview';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import { HoverPreview } from './hoverPreview.svelte';
	import LabPreview from './LabPreview.svelte';

	let { currentId = null }: { currentId?: string | null } = $props();

	const course = LABS.map(toCourseLab);
	const standfirsts = Object.fromEntries(LABS.map((lab) => [lab.id, lab.standfirst]));
	const hover = new HoverPreview({
		panelId: 'lab-index-preview',
		itemSelector: '[data-lab-index-item]',
		itemIdAttr: 'data-lab-id'
	});

	let ready = $state(false);
	let pendingPointer: { id: string; pointerType: string } | null = null;

	onMount(() => {
		progress.tick();
		ready = true;
		hover.syncViewport();
	});

	const navView = $derived.by((): CourseNavView => {
		const unlocked = new Set(
			course.filter((lab) => progress.isUnlocked(lab.unlocks)).map((lab) => lab.unlocks)
		);
		return {
			ready,
			isUnlocked: (tier) => unlocked.has(tier),
			sessionFor: (id) => labSession.all[id],
			queue: progress.stats.queue
		};
	});

	const items = $derived(
		labPreviewModels(course, standfirsts, navView, (requires) => requiredLab(course, requires))
	);

	const openModel = $derived(items.find((item) => item.id === hover.openId) ?? null);

	function takePointerType(itemId: string, e: MouseEvent): string {
		const pending = pendingPointer;
		pendingPointer = null;
		if (pending && pending.id === itemId) return pending.pointerType;
		if ('pointerType' in e && typeof (e as PointerEvent).pointerType === 'string') {
			const fromEvent = (e as PointerEvent).pointerType;
			if (fromEvent) return fromEvent;
		}
		return 'mouse';
	}

	function onItemPointerDown(item: LabPreviewModel, e: PointerEvent) {
		pendingPointer = { id: item.id, pointerType: e.pointerType || 'mouse' };
	}

	function toneClass(kind: PreviewChipKind): string {
		switch (kind) {
			case 'locked':
				return 'locked';
			case 'resume':
				return 'resume';
			case 'done':
				return 'done';
			case 'start':
				return 'go';
			case 'available':
				return 'open';
			default: {
				const _exhaustive: never = kind;
				return _exhaustive;
			}
		}
	}

	async function onLockedClick(item: LabPreviewModel, e: MouseEvent) {
		e.preventDefault();
		const pointerType = takePointerType(item.id, e);
		hover.openPreview(
			item.id,
			isPressPointerType(pointerType) ? 'press' : 'keyboard',
			hover.rectOf(e.currentTarget)
		);
		await tick();
		document.querySelector<HTMLAnchorElement>(`#${hover.panelId} a.btn`)?.focus();
	}

	function onUnlockedClick(item: LabPreviewModel, e: MouseEvent) {
		const pointerType = takePointerType(item.id, e);
		const decision = decideUnlockedPress(
			{
				openId: hover.openId,
				openedBy: hover.openedBy,
				armedForNavigate: hover.armedForNavigate
			},
			item.id,
			pointerType
		);
		switch (decision.action) {
			case 'navigate':
				return;
			case 'preview':
				e.preventDefault();
				hover.openPreview(item.id, decision.mode, hover.rectOf(e.currentTarget));
				hover.armedForNavigate = item.id;
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}

	async function onItemKeydown(item: LabPreviewModel, e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			hover.focusNeighbor(e.currentTarget, 1);
			return;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			hover.focusNeighbor(e.currentTarget, -1);
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			hover.closePreview();
			return;
		}
		if ((e.key === 'Enter' || e.key === ' ') && item.locked) {
			e.preventDefault();
			hover.openPreview(item.id, 'keyboard', hover.rectOf(e.currentTarget));
			await tick();
			document.querySelector<HTMLAnchorElement>(`#${hover.panelId} a.btn`)?.focus();
		}
	}
</script>

<svelte:window
	onpointerdown={hover.onWindowPointerDown}
	onkeydown={hover.onWindowKey}
	onresize={hover.syncViewport}
/>
<svelte:body onpointermove={hover.onHoverIntentMove} />

<nav class="lab-index" aria-label="Labs" {@attach hover.bindNav}>
	<ol>
		{#each items as item (item.id)}
			{@const current = currentId === item.id}
			{@const expanded = hover.openId === item.id}
			<li>
				{#if item.locked}
					<button
						type="button"
						class={['num', toneClass(item.chipKind), current && 'current']}
						data-lab-index-item
						data-lab-id={item.id}
						aria-label={item.accessibleName}
						aria-expanded={expanded}
						aria-controls={expanded ? hover.panelId : undefined}
						aria-current={current ? 'page' : undefined}
						onpointerdown={(e) => onItemPointerDown(item, e)}
						onpointerenter={(e) => hover.onPointerEnter(item.id, e)}
						onpointermove={(e) => hover.onItemPointerMove(item.id, e)}
						onpointerleave={hover.onItemPointerLeave}
						onfocus={(e) => hover.onItemFocus(item.id, e)}
						onfocusout={hover.onItemFocusOut}
						onclick={(e) => onLockedClick(item, e)}
						onkeydown={(e) => onItemKeydown(item, e)}
					>
						{item.numberLabel}
					</button>
				{:else}
					<a
						class={['num', toneClass(item.chipKind), current && 'current']}
						href={resolve('/lab/[id]', { id: item.id })}
						data-lab-index-item
						data-lab-id={item.id}
						aria-label={item.accessibleName}
						aria-expanded={expanded}
						aria-controls={expanded ? hover.panelId : undefined}
						aria-current={current ? 'page' : undefined}
						onpointerdown={(e) => onItemPointerDown(item, e)}
						onpointerenter={(e) => hover.onPointerEnter(item.id, e)}
						onpointermove={(e) => hover.onItemPointerMove(item.id, e)}
						onpointerleave={hover.onItemPointerLeave}
						onfocus={(e) => hover.onItemFocus(item.id, e)}
						onfocusout={hover.onItemFocusOut}
						onclick={(e) => onUnlockedClick(item, e)}
						onkeydown={(e) => onItemKeydown(item, e)}
					>
						{item.numberLabel}
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

{#if openModel && hover.anchor}
	<LabPreview
		model={openModel}
		placement={hover.placement}
		panelId={hover.panelId}
		mode={hover.mode}
		onClose={hover.closePreview}
		onPointerEnter={hover.onPreviewPointerEnter}
		onPointerLeave={hover.onItemPointerLeave}
		onMeasure={(size) => {
			hover.panelSize = size;
		}}
	/>
{/if}

<style>
	.lab-index {
		display: none;
	}

	@media (min-width: 72rem) {
		.lab-index {
			display: block;
			position: sticky;
			inset-block-start: calc(2.75rem + env(safe-area-inset-top) + var(--s3));
			align-self: start;
			z-index: 4;
			width: 56px;
		}
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: var(--s1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.num {
		appearance: none;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		min-width: 44px;
		min-height: 44px;
		margin: 0;
		padding: 0;
		border: 1px solid transparent;
		border-radius: var(--r-sm);
		background: transparent;
		font-family: var(--mono);
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-decoration: none;
		color: var(--ink-soft);
		cursor: pointer;
	}

	.num.go {
		color: var(--accent-ink);
		background: var(--accent);
		border-color: var(--accent);
	}
	.num.open {
		color: var(--accent);
	}
	.num.resume {
		color: var(--rose);
	}
	.num.done {
		color: var(--ink-faint);
	}
	.num.locked {
		color: var(--ink-faint);
	}
	.num.current {
		box-shadow: 0 0 0 2px var(--paper), 0 0 0 3px var(--accent);
	}

	.num:hover,
	.num:focus-visible {
		background: var(--paper-sunk);
		color: var(--ink);
	}
	.num.go:hover,
	.num.go:focus-visible {
		background: var(--accent);
		color: var(--accent-ink);
		filter: brightness(1.07);
	}

	@media (forced-colors: active) {
		.num {
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.num.current {
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
		}
		.num.resume {
			color: LinkText;
		}
	}
</style>
