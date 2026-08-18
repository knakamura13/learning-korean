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
		HOVER_CLOSE_MS,
		anchorPopover,
		decideHoverIntent,
		decideItemFocusOpen,
		decideUnlockedPress,
		decideWindowEscape,
		expandHoverBox,
		isHoverPointerType,
		isPointInHoverBridge,
		isPressPointerType,
		labPreviewModels,
		type LabPreviewModel,
		type PopoverAnchor,
		type PreviewChipKind,
		type PreviewOpenMode
	} from '$lib/domain/labPreview';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import LabPreview from './LabPreview.svelte';

	let { currentId = null }: { currentId?: string | null } = $props();

	const course = LABS.map(toCourseLab);
	const standfirsts = Object.fromEntries(LABS.map((lab) => [lab.id, lab.standfirst]));

	let ready = $state(false);
	let openId = $state<string | null>(null);
	let openedBy = $state<PreviewOpenMode | null>(null);
	let armedForNavigate = $state<string | null>(null);
	let mode = $state<PreviewOpenMode>('pointer');
	let followFrozen = $state(false);
	let lastPointer = $state<{ x: number; y: number } | null>(null);
	let anchor = $state<PopoverAnchor | null>(null);
	let panelSize = $state({ w: 320, h: 220 });
	let viewportSize = $state({ w: 1200, h: 800 });
	let closeTimer: number | undefined;
	let navEl = $state<HTMLElement | undefined>(undefined);
	let pendingPointer: { id: string; pointerType: string } | null = null;
	let suppressFocusOpen = false;

	function bindNav(node: HTMLElement) {
		navEl = node;
		return () => {
			if (navEl === node) navEl = undefined;
		};
	}

	onMount(() => {
		progress.tick();
		ready = true;
		syncViewport();
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

	const openModel = $derived(items.find((item) => item.id === openId) ?? null);

	const placement = $derived(
		anchor ? anchorPopover(anchor, panelSize, viewportSize) : { left: 8, top: 8 }
	);

	const panelBox = $derived(
		expandHoverBox({
			left: placement.left,
			top: placement.top,
			right: placement.left + panelSize.w,
			bottom: placement.top + panelSize.h
		})
	);

	const panelId = 'lab-index-preview';

	function prefersReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function syncViewport() {
		viewportSize = { w: window.innerWidth, h: window.innerHeight };
	}

	function cancelClose() {
		if (closeTimer === undefined) return;
		window.clearTimeout(closeTimer);
		closeTimer = undefined;
	}

	function scheduleClose() {
		cancelClose();
		closeTimer = window.setTimeout(() => {
			closePreview();
		}, HOVER_CLOSE_MS);
	}

	function closePreview() {
		cancelClose();
		openId = null;
		openedBy = null;
		armedForNavigate = null;
		followFrozen = false;
		lastPointer = null;
		anchor = null;
	}

	function rectOf(target: EventTarget | null): PopoverAnchor | null {
		if (!(target instanceof Element)) return null;
		const node = target.closest('[data-lab-index-item]');
		if (!node) return null;
		const box = node.getBoundingClientRect();
		return {
			x: box.x,
			y: box.y,
			width: box.width,
			height: box.height,
			top: box.top,
			right: box.right
		};
	}

	function openPreview(id: string, nextMode: PreviewOpenMode, nextAnchor: PopoverAnchor | null) {
		cancelClose();
		if (id !== openId) armedForNavigate = null;
		openId = id;
		openedBy = nextMode;
		mode = nextMode;
		followFrozen = nextMode !== 'pointer';
		if (nextAnchor) anchor = nextAnchor;
	}

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

	function toneClass(kind: PreviewChipKind, current: boolean): string {
		if (current) return 'current';
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

	function rememberPointer(e: PointerEvent) {
		lastPointer = { x: e.clientX, y: e.clientY };
	}

	function pointerAnchor(e: PointerEvent): PopoverAnchor | null {
		const box = rectOf(e.currentTarget);
		if (box && 'right' in box) return { x: box.right, y: e.clientY };
		return { x: e.clientX, y: e.clientY };
	}

	function onPointerEnter(item: LabPreviewModel, e: PointerEvent) {
		if (!isHoverPointerType(e.pointerType)) return;
		rememberPointer(e);
		openPreview(
			item.id,
			'pointer',
			prefersReducedMotion() ? rectOf(e.currentTarget) : pointerAnchor(e)
		);
	}

	function onItemPointerMove(item: LabPreviewModel, e: PointerEvent) {
		if (!isHoverPointerType(e.pointerType)) return;
		rememberPointer(e);
		if (prefersReducedMotion()) return;
		if (openId !== item.id || mode !== 'pointer' || followFrozen) return;
		const next = pointerAnchor(e);
		if (next) anchor = next;
	}

	function onItemPointerLeave(e: PointerEvent) {
		if (!isHoverPointerType(e.pointerType)) return;
		followFrozen = true;
		scheduleClose();
	}

	function onPreviewPointerEnter() {
		cancelClose();
		followFrozen = true;
	}

	function onHoverIntentMove(e: PointerEvent) {
		if (!openId || mode !== 'pointer' || !lastPointer || !isHoverPointerType(e.pointerType)) return;
		const target = e.target;
		const overItem = target instanceof Element && Boolean(target.closest('[data-lab-index-item]'));
		const overPanel = target instanceof Element && Boolean(target.closest(`#${panelId}`));
		const inBridge = isPointInHoverBridge(
			{ x: e.clientX, y: e.clientY },
			lastPointer,
			panelBox
		);
		const decision = decideHoverIntent(overItem, overPanel, inBridge);
		switch (decision.action) {
			case 'stay':
				cancelClose();
				if (decision.freezeFollow) followFrozen = true;
				return;
			case 'close':
				followFrozen = true;
				if (closeTimer === undefined) scheduleClose();
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}

	async function onLockedClick(item: LabPreviewModel, e: MouseEvent) {
		e.preventDefault();
		const pointerType = takePointerType(item.id, e);
		openPreview(
			item.id,
			isPressPointerType(pointerType) ? 'press' : 'keyboard',
			rectOf(e.currentTarget)
		);
		await tick();
		document.querySelector<HTMLAnchorElement>(`#${panelId} a.btn`)?.focus();
	}

	function onUnlockedClick(item: LabPreviewModel, e: MouseEvent) {
		const pointerType = takePointerType(item.id, e);
		const decision = decideUnlockedPress(
			{ openId, openedBy, armedForNavigate },
			item.id,
			pointerType
		);
		switch (decision.action) {
			case 'navigate':
				return;
			case 'preview':
				e.preventDefault();
				openPreview(item.id, decision.mode, rectOf(e.currentTarget));
				armedForNavigate = item.id;
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}

	function onWindowPointerDown(e: PointerEvent) {
		if (!openId || mode !== 'press') return;
		const target = e.target;
		if (target instanceof Node && navEl?.contains(target)) return;
		if (target instanceof Element && target.closest(`#${panelId}`)) return;
		closePreview();
	}

	function onItemFocus(item: LabPreviewModel, e: FocusEvent) {
		const decision = decideItemFocusOpen(suppressFocusOpen);
		suppressFocusOpen = false;
		switch (decision.action) {
			case 'skip':
				return;
			case 'open':
				openPreview(item.id, 'keyboard', rectOf(e.currentTarget));
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}

	function onItemFocusOut(e: FocusEvent) {
		const next = e.relatedTarget;
		if (next instanceof Node && navEl?.contains(next)) return;
		if (next instanceof Element && next.closest(`#${panelId}`)) return;
		closePreview();
	}

	function focusNeighbor(from: EventTarget | null, delta: number) {
		if (!navEl || !(from instanceof Element)) return;
		const nodes = [...navEl.querySelectorAll<HTMLElement>('[data-lab-index-item]')];
		const current = from.closest<HTMLElement>('[data-lab-index-item]');
		if (!current) return;
		const i = nodes.indexOf(current);
		if (i < 0) return;
		const next = nodes[(i + delta + nodes.length) % nodes.length];
		next?.focus();
	}

	async function onItemKeydown(item: LabPreviewModel, e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			focusNeighbor(e.currentTarget, 1);
			return;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusNeighbor(e.currentTarget, -1);
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			closePreview();
			return;
		}
		if ((e.key === 'Enter' || e.key === ' ') && item.locked) {
			e.preventDefault();
			openPreview(item.id, 'keyboard', rectOf(e.currentTarget));
			await tick();
			document.querySelector<HTMLAnchorElement>(`#${panelId} a.btn`)?.focus();
		}
	}

	function onWindowKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		const decision = decideWindowEscape(openId, mode);
		switch (decision.action) {
			case 'ignore':
				return;
			case 'dismiss': {
				e.preventDefault();
				suppressFocusOpen = true;
				closePreview();
				navEl
					?.querySelector<HTMLElement>(
						`[data-lab-index-item][data-lab-id="${decision.restoreId}"]`
					)
					?.focus();
				// focus() is sync; onItemFocus already consumed the flag. Clear if
				// focus was a no-op (number already focused).
				suppressFocusOpen = false;
				return;
			}
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}
</script>

<svelte:window
	onpointerdown={onWindowPointerDown}
	onkeydown={onWindowKey}
	onresize={syncViewport}
/>
<svelte:body onpointermove={onHoverIntentMove} />

<nav class="lab-index" aria-label="Labs" {@attach bindNav}>
	<ol>
		{#each items as item (item.id)}
			{@const current = currentId === item.id}
			{@const expanded = openId === item.id}
			<li>
				{#if item.locked}
					<button
						type="button"
						class={['num', toneClass(item.chipKind, current)]}
						data-lab-index-item
						data-lab-id={item.id}
						aria-label={item.accessibleName}
						aria-expanded={expanded}
						aria-controls={expanded ? panelId : undefined}
						aria-current={current ? 'page' : undefined}
						onpointerdown={(e) => onItemPointerDown(item, e)}
						onpointerenter={(e) => onPointerEnter(item, e)}
						onpointermove={(e) => onItemPointerMove(item, e)}
						onpointerleave={onItemPointerLeave}
						onfocus={(e) => onItemFocus(item, e)}
						onfocusout={onItemFocusOut}
						onclick={(e) => onLockedClick(item, e)}
						onkeydown={(e) => onItemKeydown(item, e)}
					>
						{item.numberLabel}
					</button>
				{:else}
					<a
						class={['num', toneClass(item.chipKind, current)]}
						href={resolve('/lab/[id]', { id: item.id })}
						data-lab-index-item
						data-lab-id={item.id}
						aria-label={item.accessibleName}
						aria-expanded={expanded}
						aria-controls={expanded ? panelId : undefined}
						aria-current={current ? 'page' : undefined}
						onpointerdown={(e) => onItemPointerDown(item, e)}
						onpointerenter={(e) => onPointerEnter(item, e)}
						onpointermove={(e) => onItemPointerMove(item, e)}
						onpointerleave={onItemPointerLeave}
						onfocus={(e) => onItemFocus(item, e)}
						onfocusout={onItemFocusOut}
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

{#if openModel && anchor}
	<LabPreview
		model={openModel}
		{placement}
		{panelId}
		{mode}
		onClose={closePreview}
		onPointerEnter={onPreviewPointerEnter}
		onPointerLeave={onItemPointerLeave}
		onMeasure={(size) => {
			panelSize = size;
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

	.num.go,
	.num.open {
		color: var(--accent);
	}
	.num.resume {
		color: var(--rose);
	}
	.num.done {
		color: var(--good);
	}
	.num.locked {
		color: var(--ink-faint);
	}
	.num.current {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.num:hover,
	.num:focus-visible {
		background: var(--paper-sunk);
		color: var(--ink);
	}
	.num.current:hover,
	.num.current:focus-visible {
		background: var(--accent-soft);
		color: var(--accent);
	}

	@media (forced-colors: active) {
		.num {
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.num.current {
			background: Highlight;
			color: HighlightText;
		}
		.num.resume {
			color: LinkText;
		}
	}
</style>
