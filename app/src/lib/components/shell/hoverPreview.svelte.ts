/**
 * Shared hover/focus preview controller for the Labs and Reference rails.
 *
 * Placement, hover-bridge geometry, and pointer-type gating stay in
 * `labPreview.ts`. This class owns the open/close timer, cursor follow,
 * Escape restore-focus (keyboard/press), hover Escape without claiming the key,
 * and the DOM selectors each rail passes in.
 * Click semantics and preview cards stay on the rails.
 */

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

export interface HoverPreviewOptions {
	panelId: string;
	itemSelector: string;
	itemIdAttr: string;
	panelSize?: { w: number; h: number };
}

export class HoverPreview {
	readonly panelId: string;
	readonly itemSelector: string;
	readonly itemIdAttr: string;

	openId = $state<string | null>(null);
	openedBy = $state<PreviewOpenMode | null>(null);
	armedForNavigate = $state<string | null>(null);
	mode = $state<PreviewOpenMode>('pointer');
	followFrozen = $state(false);
	lastPointer = $state<{ x: number; y: number } | null>(null);
	anchor = $state<PopoverAnchor | null>(null);
	panelSize = $state({ w: 320, h: 220 });
	viewportSize = $state({ w: 1200, h: 800 });
	navEl = $state<HTMLElement | undefined>(undefined);

	#closeTimer: number | undefined;
	#suppressFocusOpen = false;

	constructor(options: HoverPreviewOptions) {
		this.panelId = options.panelId;
		this.itemSelector = options.itemSelector;
		this.itemIdAttr = options.itemIdAttr;
		if (options.panelSize) this.panelSize = options.panelSize;
	}

	placement = $derived(
		this.anchor ? anchorPopover(this.anchor, this.panelSize, this.viewportSize) : { left: 8, top: 8 }
	);

	panelBox = $derived(
		expandHoverBox({
			left: this.placement.left,
			top: this.placement.top,
			right: this.placement.left + this.panelSize.w,
			bottom: this.placement.top + this.panelSize.h
		})
	);

	bindNav = (node: HTMLElement) => {
		this.navEl = node;
		return () => {
			if (this.navEl === node) this.navEl = undefined;
		};
	};

	syncViewport = () => {
		this.viewportSize = { w: window.innerWidth, h: window.innerHeight };
	};

	cancelClose = () => {
		if (this.#closeTimer === undefined) return;
		window.clearTimeout(this.#closeTimer);
		this.#closeTimer = undefined;
	};

	scheduleClose = () => {
		this.cancelClose();
		this.#closeTimer = window.setTimeout(() => {
			this.closePreview();
		}, HOVER_CLOSE_MS);
	};

	closePreview = () => {
		this.cancelClose();
		this.openId = null;
		this.openedBy = null;
		this.armedForNavigate = null;
		this.followFrozen = false;
		this.lastPointer = null;
		this.anchor = null;
	};

	prepareActivate = () => {
		this.#suppressFocusOpen = true;
		this.closePreview();
	};

	openPreview = (id: string, nextMode: PreviewOpenMode, nextAnchor: PopoverAnchor | null) => {
		this.cancelClose();
		if (id !== this.openId) this.armedForNavigate = null;
		this.openId = id;
		this.openedBy = nextMode;
		this.mode = nextMode;
		this.followFrozen = nextMode !== 'pointer';
		if (nextAnchor) this.anchor = nextAnchor;
	};

	rectOf = (target: EventTarget | null): PopoverAnchor | null => {
		if (!(target instanceof Element)) return null;
		const node = target.closest(this.itemSelector);
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
	};

	pointerAnchor = (e: PointerEvent): PopoverAnchor | null => {
		const box = this.rectOf(e.currentTarget);
		if (box && 'right' in box) return { x: box.right, y: e.clientY };
		return { x: e.clientX, y: e.clientY };
	};

	#prefersReducedMotion() {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	onPointerEnter = (id: string, e: PointerEvent) => {
		if (!isHoverPointerType(e.pointerType)) return;
		this.lastPointer = { x: e.clientX, y: e.clientY };
		this.openPreview(
			id,
			'pointer',
			this.#prefersReducedMotion() ? this.rectOf(e.currentTarget) : this.pointerAnchor(e)
		);
	};

	onItemPointerMove = (id: string, e: PointerEvent) => {
		if (!isHoverPointerType(e.pointerType)) return;
		this.lastPointer = { x: e.clientX, y: e.clientY };
		if (this.#prefersReducedMotion()) return;
		if (this.openId !== id || this.mode !== 'pointer' || this.followFrozen) return;
		const next = this.pointerAnchor(e);
		if (next) this.anchor = next;
	};

	onItemPointerLeave = (e: PointerEvent) => {
		if (!isHoverPointerType(e.pointerType)) return;
		this.followFrozen = true;
		this.scheduleClose();
	};

	onPreviewPointerEnter = () => {
		this.cancelClose();
		this.followFrozen = true;
	};

	onHoverIntentMove = (e: PointerEvent) => {
		if (!this.openId || this.mode !== 'pointer' || !this.lastPointer || !isHoverPointerType(e.pointerType)) {
			return;
		}
		const target = e.target;
		const overItem =
			target instanceof Element && Boolean(target.closest(this.itemSelector));
		const overPanel = target instanceof Element && Boolean(target.closest(`#${this.panelId}`));
		const inBridge = isPointInHoverBridge(
			{ x: e.clientX, y: e.clientY },
			this.lastPointer,
			this.panelBox
		);
		const decision = decideHoverIntent(overItem, overPanel, inBridge);
		switch (decision.action) {
			case 'stay':
				this.cancelClose();
				if (decision.freezeFollow) this.followFrozen = true;
				return;
			case 'close':
				this.followFrozen = true;
				if (this.#closeTimer === undefined) this.scheduleClose();
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	};

	onItemFocus = (id: string, e: FocusEvent) => {
		const decision = decideItemFocusOpen(this.#suppressFocusOpen);
		this.#suppressFocusOpen = false;
		switch (decision.action) {
			case 'skip':
				return;
			case 'open':
				this.openPreview(id, 'keyboard', this.rectOf(e.currentTarget));
				return;
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	};

	onItemFocusOut = (e: FocusEvent) => {
		const next = e.relatedTarget;
		if (next instanceof Node && this.navEl?.contains(next)) return;
		if (next instanceof Element && next.closest(`#${this.panelId}`)) return;
		this.closePreview();
	};

	onWindowPointerDown = (e: PointerEvent) => {
		if (!this.openId || this.mode !== 'press') return;
		const target = e.target;
		if (target instanceof Node && this.navEl?.contains(target)) return;
		if (target instanceof Element && target.closest(`#${this.panelId}`)) return;
		this.closePreview();
	};

	onWindowKey = (e: KeyboardEvent) => {
		if (e.key !== 'Escape') return;
		const decision = decideWindowEscape(this.openId, this.mode);
		switch (decision.action) {
			case 'ignore':
				return;
			case 'close':
				this.closePreview();
				return;
			case 'dismiss': {
				e.preventDefault();
				this.#suppressFocusOpen = true;
				this.closePreview();
				this.navEl
					?.querySelector<HTMLElement>(
						`${this.itemSelector}[${this.itemIdAttr}="${decision.restoreId}"]`
					)
					?.focus();
				this.#suppressFocusOpen = false;
				return;
			}
			default: {
				const _exhaustive: never = decision;
				return _exhaustive;
			}
		}
	};

	focusNeighbor = (from: EventTarget | null, delta: number) => {
		if (!this.navEl || !(from instanceof Element)) return;
		const nodes = [...this.navEl.querySelectorAll<HTMLElement>(this.itemSelector)];
		const current = from.closest<HTMLElement>(this.itemSelector);
		if (!current) return;
		const i = nodes.indexOf(current);
		if (i < 0) return;
		const next = nodes[(i + delta + nodes.length) % nodes.length];
		next?.focus();
	};
}
