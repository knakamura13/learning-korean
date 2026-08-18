<script lang="ts">
	import { onMount } from 'svelte';
	import {
		HOVER_CLOSE_MS,
		anchorPopover,
		decideHoverIntent,
		decideItemFocusOpen,
		decideWindowEscape,
		expandHoverBox,
		isHoverPointerType,
		isPointInHoverBridge,
		type PopoverAnchor,
		type PreviewOpenMode
	} from '$lib/domain/labPreview';
	import {
		REFERENCE_SECTIONS,
		referencePreviewModel,
		type ReferencePreviewModel
	} from '$lib/domain/referenceNav';
	import ReferencePreview from './ReferencePreview.svelte';

	let {
		activeId = null,
		onJump
	}: {
		activeId?: string | null;
		onJump: (id: string, event: MouseEvent) => void;
	} = $props();

	const items = REFERENCE_SECTIONS.map(referencePreviewModel);

	let openId = $state<string | null>(null);
	let mode = $state<PreviewOpenMode>('pointer');
	let followFrozen = $state(false);
	let lastPointer = $state<{ x: number; y: number } | null>(null);
	let anchor = $state<PopoverAnchor | null>(null);
	let panelSize = $state({ w: 320, h: 180 });
	let viewportSize = $state({ w: 1200, h: 800 });
	let closeTimer: number | undefined;
	let navEl = $state<HTMLElement | undefined>(undefined);
	let suppressFocusOpen = false;

	function bindNav(node: HTMLElement) {
		navEl = node;
		return () => {
			if (navEl === node) navEl = undefined;
		};
	}

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

	const panelId = 'ref-index-preview';

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
		followFrozen = false;
		lastPointer = null;
		anchor = null;
	}

	function rectOf(target: EventTarget | null): PopoverAnchor | null {
		if (!(target instanceof Element)) return null;
		const node = target.closest('[data-ref-index-item]');
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
		openId = id;
		mode = nextMode;
		followFrozen = nextMode !== 'pointer';
		if (nextAnchor) anchor = nextAnchor;
	}

	function rememberPointer(e: PointerEvent) {
		lastPointer = { x: e.clientX, y: e.clientY };
	}

	function pointerAnchor(e: PointerEvent): PopoverAnchor | null {
		const box = rectOf(e.currentTarget);
		if (box && 'right' in box) return { x: box.right, y: e.clientY };
		return { x: e.clientX, y: e.clientY };
	}

	function onPointerEnter(item: ReferencePreviewModel, e: PointerEvent) {
		if (!isHoverPointerType(e.pointerType)) return;
		rememberPointer(e);
		openPreview(
			item.id,
			'pointer',
			prefersReducedMotion() ? rectOf(e.currentTarget) : pointerAnchor(e)
		);
	}

	function onItemPointerMove(item: ReferencePreviewModel, e: PointerEvent) {
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
		const overItem = target instanceof Element && Boolean(target.closest('[data-ref-index-item]'));
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

	function onJumpClick(item: ReferencePreviewModel, e: MouseEvent) {
		suppressFocusOpen = true;
		closePreview();
		onJump(item.id, e);
	}

	function onItemFocus(item: ReferencePreviewModel, e: FocusEvent) {
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
		const nodes = [...navEl.querySelectorAll<HTMLElement>('[data-ref-index-item]')];
		const current = from.closest<HTMLElement>('[data-ref-index-item]');
		if (!current) return;
		const i = nodes.indexOf(current);
		if (i < 0) return;
		const next = nodes[(i + delta + nodes.length) % nodes.length];
		next?.focus();
	}

	function onItemKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
			e.preventDefault();
			focusNeighbor(e.currentTarget, 1);
			return;
		}
		if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
			e.preventDefault();
			focusNeighbor(e.currentTarget, -1);
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			closePreview();
			return;
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
				const restoreId = decision.restoreId;
				closePreview();
				navEl
					?.querySelector<HTMLElement>(`[data-ref-index-item][data-ref-id="${restoreId}"]`)
					?.focus();
				suppressFocusOpen = false;
				return;
			}
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	}

	onMount(() => {
		syncViewport();
	});
</script>

<svelte:window onkeydown={onWindowKey} onresize={syncViewport} />
<svelte:body onpointermove={onHoverIntentMove} />

<nav class="ref-index" aria-label="Jump to section" {@attach bindNav}>
	<p class="rail-label" aria-hidden="true">Jump to section</p>
	<ol>
		{#each items as item (item.id)}
			{@const current = activeId === item.id}
			{@const expanded = openId === item.id}
			<li>
				<a
					class={['jump', { current }]}
					href="#{item.id}"
					data-ref-index-item
					data-ref-id={item.id}
					aria-expanded={expanded}
					aria-controls={expanded ? panelId : undefined}
					aria-current={current ? 'location' : undefined}
					onpointerenter={(e) => onPointerEnter(item, e)}
					onpointermove={(e) => onItemPointerMove(item, e)}
					onpointerleave={onItemPointerLeave}
					onfocus={(e) => onItemFocus(item, e)}
					onfocusout={onItemFocusOut}
					onclick={(e) => onJumpClick(item, e)}
					onkeydown={onItemKeydown}
				>
					{item.nav}
				</a>
			</li>
		{/each}
	</ol>
</nav>

{#if openModel && anchor}
	<ReferencePreview
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
	.ref-index {
		position: sticky;
		inset-block-start: calc(44px + env(safe-area-inset-top));
		z-index: 4;
		margin: 0 0 var(--s6);
		padding: var(--s2) 0 var(--s3);
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--rule);
	}

	.rail-label {
		margin: 0 0 var(--s2);
		color: var(--ink-faint);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.jump {
		appearance: none;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin: 0;
		padding: 0.25rem 0.55rem;
		border: 1px solid transparent;
		border-radius: var(--r-sm);
		background: transparent;
		font-size: 0.74rem;
		font-weight: 500;
		text-decoration: none;
		color: var(--ink-soft);
		white-space: nowrap;
		cursor: pointer;
	}

	.jump.current {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
	}

	.jump:hover,
	.jump:focus-visible {
		background: var(--paper-sunk);
		color: var(--ink);
	}
	.jump.current:hover,
	.jump.current:focus-visible {
		background: var(--accent-soft);
		color: var(--accent);
	}

	@media (min-width: 72rem) {
		ol {
			flex-direction: column;
			flex-wrap: nowrap;
			gap: var(--s1);
		}
		.ref-index {
			inset-block-start: calc(2.75rem + env(safe-area-inset-top) + var(--s3));
			align-self: start;
			margin: 0;
			padding: 0;
			background: transparent;
			backdrop-filter: none;
			border-bottom: none;
			width: max-content;
		}
		.rail-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
		.jump {
			width: 100%;
			justify-content: start;
			padding-inline: 0.4rem;
		}
	}

	@media (forced-colors: active) {
		.ref-index {
			background: Canvas;
			border-bottom-color: ButtonBorder;
			backdrop-filter: none;
		}
		.jump {
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.jump.current {
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
