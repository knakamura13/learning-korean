// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOVER_CLOSE_MS } from '$lib/domain/hoverPlacement';
import { HoverPreview } from './hoverPreview.svelte';

if (typeof PointerEvent === 'undefined') {
	class PointerEventPolyfill extends MouseEvent {
		pointerId: number;
		pointerType: string;
		constructor(type: string, init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 0;
			this.pointerType = init.pointerType ?? '';
		}
	}
	Object.defineProperty(globalThis, 'PointerEvent', { value: PointerEventPolyfill });
}

function stubMatchMedia(reduceMotion = false) {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
}

function makeItem(id: string): HTMLButtonElement {
	const el = document.createElement('button');
	el.setAttribute('data-rail-item', '');
	el.setAttribute('data-rail-id', id);
	el.getBoundingClientRect = () =>
		({
			x: 10,
			y: 40,
			width: 44,
			height: 44,
			top: 40,
			right: 54,
			bottom: 84,
			left: 10,
			toJSON: () => ({})
		}) as DOMRect;
	document.body.appendChild(el);
	return el;
}

function pointer(
	el: EventTarget,
	type: string,
	init: PointerEventInit = {}
): PointerEvent {
	const event = new PointerEvent(type, {
		bubbles: true,
		clientX: 20,
		clientY: 50,
		pointerType: 'mouse',
		...init
	});
	Object.defineProperty(event, 'currentTarget', { value: el });
	return event;
}

function createHover() {
	return new HoverPreview({
		panelId: 'test-preview',
		itemSelector: '[data-rail-item]',
		itemIdAttr: 'data-rail-id'
	});
}

describe('HoverPreview', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		stubMatchMedia(false);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		document.body.replaceChildren();
	});

	it('opens from a mouse enter and ignores touch enter', () => {
		const hover = createHover();
		const item = makeItem('batchim');
		hover.onPointerEnter('batchim', pointer(item, 'pointerenter'));
		expect(hover.openId).toBe('batchim');
		expect(hover.mode).toBe('pointer');
		expect(hover.anchor).toEqual({ x: 54, y: 50 });

		hover.closePreview();
		hover.onPointerEnter('batchim', pointer(item, 'pointerenter', { pointerType: 'touch' }));
		expect(hover.openId).toBeNull();
	});

	it('follows the cursor until leave freezes and the close timer fires', () => {
		const hover = createHover();
		const item = makeItem('vowels');
		hover.onPointerEnter('vowels', pointer(item, 'pointerenter', { clientY: 50 }));
		hover.onItemPointerMove('vowels', pointer(item, 'pointermove', { clientY: 80 }));
		expect(hover.anchor).toEqual({ x: 54, y: 80 });

		hover.onItemPointerLeave(pointer(item, 'pointerleave'));
		expect(hover.followFrozen).toBe(true);
		hover.onItemPointerMove('vowels', pointer(item, 'pointermove', { clientY: 120 }));
		expect(hover.anchor).toEqual({ x: 54, y: 80 });

		vi.advanceTimersByTime(HOVER_CLOSE_MS - 1);
		expect(hover.openId).toBe('vowels');
		vi.advanceTimersByTime(1);
		expect(hover.openId).toBeNull();
		expect(hover.anchor).toBeNull();
	});

	it('keeps the panel open on the hover bridge and cancels the close timer on the card', () => {
		const hover = createHover();
		const item = makeItem('batchim');
		hover.onPointerEnter('batchim', pointer(item, 'pointerenter', { clientX: 20, clientY: 50 }));
		hover.panelSize = { w: 320, h: 180 };
		hover.onItemPointerLeave(pointer(item, 'pointerleave'));

		hover.onHoverIntentMove(
			new PointerEvent('pointermove', {
				bubbles: true,
				clientX: 70,
				clientY: 50,
				pointerType: 'mouse'
			})
		);
		vi.advanceTimersByTime(HOVER_CLOSE_MS);
		expect(hover.openId).toBe('batchim');
		expect(hover.followFrozen).toBe(true);

		hover.onPreviewPointerEnter();
		vi.advanceTimersByTime(HOVER_CLOSE_MS);
		expect(hover.openId).toBe('batchim');
	});

	it('opens on keyboard focus, skips the restore-focus reopen, and claims Escape', () => {
		const hover = createHover();
		const item = makeItem('clusters');
		const nav = document.createElement('nav');
		nav.appendChild(item);
		document.body.appendChild(nav);
		hover.bindNav(nav);
		item.addEventListener('focus', (event) => hover.onItemFocus('clusters', event));

		hover.onItemFocus('clusters', { currentTarget: item } as unknown as FocusEvent);
		expect(hover.openId).toBe('clusters');
		expect(hover.mode).toBe('keyboard');
		item.focus();

		const dismiss = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		hover.onWindowKey(dismiss);
		expect(dismiss.defaultPrevented).toBe(true);
		expect(hover.openId).toBeNull();

		hover.onItemFocus('clusters', { currentTarget: item } as unknown as FocusEvent);
		expect(hover.openId).toBe('clusters');
	});

	it('closes a hover preview on Escape without claiming the key or restoring focus', () => {
		const hover = createHover();
		const item = makeItem('batchim');
		const nav = document.createElement('nav');
		nav.appendChild(item);
		document.body.appendChild(nav);
		hover.bindNav(nav);
		item.addEventListener('focus', (event) => hover.onItemFocus('batchim', event));

		hover.onPointerEnter('batchim', pointer(item, 'pointerenter'));
		expect(hover.mode).toBe('pointer');

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		hover.onWindowKey(event);
		expect(event.defaultPrevented).toBe(false);
		expect(hover.openId).toBeNull();
		expect(document.activeElement).not.toBe(item);

		hover.onItemPointerMove('batchim', pointer(item, 'pointermove', { clientY: 80 }));
		expect(hover.openId).toBeNull();
	});

	it('lets an activate close without reopening from the trailing focus', () => {
		const hover = createHover();
		const item = makeItem('sources');
		hover.onPointerEnter('sources', pointer(item, 'pointerenter'));
		hover.prepareActivate();
		expect(hover.openId).toBeNull();
		hover.onItemFocus('sources', { currentTarget: item } as unknown as FocusEvent);
		expect(hover.openId).toBeNull();
	});

	it('resets armedForNavigate when opening a different id', () => {
		const hover = createHover();
		const first = makeItem('0001');
		hover.openPreview('0001', 'press', null);
		hover.armedForNavigate = '0001';
		hover.openPreview('0002', 'keyboard', null);
		expect(hover.openId).toBe('0002');
		expect(hover.armedForNavigate).toBeNull();
		expect(hover.openedBy).toBe('keyboard');
		void first;
	});

	it('onItemFocusOut keeps the preview open while focus stays in the rail-and-panel group', () => {
		const hover = createHover();
		const item = makeItem('sources');
		const nav = document.createElement('nav');
		nav.appendChild(item);
		document.body.appendChild(nav);
		hover.bindNav(nav);

		const panel = document.createElement('div');
		panel.id = 'test-preview';
		const closeBtn = document.createElement('button');
		panel.appendChild(closeBtn);
		document.body.appendChild(panel);

		hover.openPreview('sources', 'keyboard', null);

		hover.onItemFocusOut({ relatedTarget: closeBtn } as FocusEvent);
		expect(hover.openId).toBe('sources');

		const nextItem = makeItem('batchim');
		nav.appendChild(nextItem);
		hover.onItemFocusOut({ relatedTarget: nextItem } as FocusEvent);
		expect(hover.openId).toBe('sources');
	});

	it('onItemFocusOut closes when focus leaves the rail-and-panel group', () => {
		const hover = createHover();
		const item = makeItem('sources');
		const nav = document.createElement('nav');
		nav.appendChild(item);
		document.body.appendChild(nav);
		hover.bindNav(nav);

		const panel = document.createElement('div');
		panel.id = 'test-preview';
		const closeBtn = document.createElement('button');
		panel.appendChild(closeBtn);
		document.body.appendChild(panel);

		const outside = document.createElement('a');
		outside.href = '#downstream';
		document.body.appendChild(outside);

		hover.openPreview('sources', 'keyboard', null);

		hover.onItemFocusOut({ relatedTarget: outside } as FocusEvent);
		expect(hover.openId).toBeNull();

		hover.openPreview('sources', 'keyboard', null);
		closeBtn.focus();
		hover.onItemFocusOut({ relatedTarget: outside } as FocusEvent);
		expect(hover.openId).toBeNull();
	});

	it('closes on Escape from outside the rail-and-panel group without restoring focus', () => {
		const hover = createHover();
		const item = makeItem('sources');
		const nav = document.createElement('nav');
		nav.appendChild(item);
		document.body.appendChild(nav);
		hover.bindNav(nav);

		const outside = document.createElement('a');
		outside.href = '#link';
		document.body.appendChild(outside);

		hover.openPreview('sources', 'keyboard', null);
		outside.focus();
		expect(document.activeElement).toBe(outside);

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		hover.onWindowKey(event);
		expect(event.defaultPrevented).toBe(false);
		expect(hover.openId).toBeNull();
		expect(document.activeElement).toBe(outside);
	});
});
