<script lang="ts">
	import { onDestroy } from 'svelte';
	import { hasHangul } from '$lib/a11y/lang';
	import { movedEnough, snapSlot, type SlotBox } from '$lib/domain/composerSnap';
	import { trayLift } from './trayLift.svelte';

	/** A labeled row of selectable chips — one independent composer slot. */
	let {
		label,
		items,
		selected = null,
		text = false,
		disabled = false,
		tone = 'accent',
		/** Matching `data-slot` on the composer readout. Omit for click-only trays. */
		dock = undefined,
		onSelect
	}: {
		label: string;
		items: string[];
		selected?: string | null;
		/** Render as words (ticks, sides) rather than Hangul glyphs. */
		text?: boolean;
		disabled?: boolean;
		tone?: 'accent' | 'blue';
		dock?: string;
		onSelect: (value: string) => void;
	} = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const picked = $derived(selected != null && selected !== '');
	/** Short tag on the selected chip so duplicate glyphs still name their row. */
	const mark = $derived(slotMark(label));

	function slotMark(name: string): string {
		const head = name.split(/[—]/)[0]?.trim() ?? name;
		const words = head.split(/\s+/).filter(Boolean);
		if (words[0] === 'first' || words[0] === 'second') return words[0];
		return words[0] ?? name;
	}

	/**
	 * Roving tabindex for the radiogroup: only one chip is a Tab stop — the
	 * checked one, or the first when nothing is picked yet — matching how a
	 * native radio group behaves. Arrow keys move that stop and pick as they
	 * go, same as native radios.
	 */
	const activeIndex = $derived.by(() => {
		const i = selected == null ? -1 : items.indexOf(selected);
		return i >= 0 ? i : 0;
	});

	let groupEl = $state<HTMLDivElement>();
	let pending = $state<{ item: string; x: number; y: number } | null>(null);
	let drag = $state<{ item: string; x: number; y: number } | null>(null);
	/** Swallow the click that follows a pointer drag so a missed drop does not auto-fill. */
	let skipClick = false;

	/** Roving tabindex lives on the radiogroup element itself, per the ARIA pattern. */
	function onGroupKeydown(e: KeyboardEvent) {
		if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
		let delta = 0;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') delta = 1;
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') delta = -1;
		else return;
		const chips = groupEl ? [...groupEl.querySelectorAll<HTMLButtonElement>('.chip')] : [];
		const from = e.target instanceof HTMLButtonElement ? chips.indexOf(e.target) : -1;
		if (chips.length === 0 || from < 0) return;
		e.preventDefault();
		const next = chips[(from + delta + chips.length) % chips.length];
		next.focus();
		onSelect(items[chips.indexOf(next)]);
	}

	function startLift(item: string, e: PointerEvent) {
		if (disabled || !dock || e.button !== 0) return;
		skipClick = false;
		pending = { item, x: e.clientX, y: e.clientY };
	}

	function beginDrag(e: PointerEvent) {
		if (!pending || drag || !dock) return;
		if (!movedEnough(pending.x, pending.y, e.clientX, e.clientY)) return;
		const item = pending.item;
		pending = null;
		drag = { item, x: e.clientX, y: e.clientY };
		trayLift.current = { dock, item, x: e.clientX, y: e.clientY };
	}

	function onPointerMove(e: PointerEvent) {
		if (pending && !drag) beginDrag(e);
		if (!drag || !dock) return;
		drag = { ...drag, x: e.clientX, y: e.clientY };
		trayLift.current = { dock, item: drag.item, x: e.clientX, y: e.clientY };
	}

	function slotBoxes(): SlotBox[] {
		return [...document.querySelectorAll<HTMLElement>('[data-slot]')].map((el) => {
			const r = el.getBoundingClientRect();
			return {
				id: el.dataset.slot ?? '',
				left: r.left,
				top: r.top,
				right: r.right,
				bottom: r.bottom
			};
		});
	}

	function endLift(e: PointerEvent) {
		pending = null;
		if (!drag) return;
		skipClick = true;
		const item = drag.item;
		drag = null;
		trayLift.current = null;
		if (!dock) return;
		const hit = snapSlot(slotBoxes(), e.clientX, e.clientY, dock);
		if (hit) onSelect(item);
	}

	function onChipClick(item: string) {
		if (skipClick) {
			skipClick = false;
			return;
		}
		onSelect(item);
	}

	onDestroy(() => {
		if (dock && trayLift.current?.dock === dock) trayLift.current = null;
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={endLift} onpointercancel={endLift} />

<div
	class={['tray', disabled && 'off', picked && 'picked']}
	role="radiogroup"
	aria-labelledby={labelId}
	aria-disabled={disabled ? 'true' : undefined}
	tabindex="-1"
	bind:this={groupEl}
	onkeydown={onGroupKeydown}
>
	<div class="label" id={labelId}>{label}</div>
	<div class="row">
		{#each items as item, i (item)}
			{@const on = selected === item}
			<button
				type="button"
				class={[
					'chip',
					text && 'text',
					on && 'on',
					tone === 'blue' && 'blue',
					dock && 'draggable',
					drag?.item === item && 'lifted'
				]}
				role="radio"
				aria-checked={on}
				aria-label="{label}: {item}"
				tabindex={i === activeIndex ? 0 : -1}
				{disabled}
				lang={hasHangul(item) ? 'ko' : undefined}
				onpointerdown={(e) => startLift(item, e)}
				onclick={() => onChipClick(item)}
			>
				<span class="glyph">{item}</span>
				{#if on}
					<span class="mark">{mark}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

{#if drag}
	<div class="ghost" style:left="{drag.x}px" style:top="{drag.y}px" aria-hidden="true">
		<span class={['glyph', text && 'text']}>{drag.item}</span>
	</div>
{/if}

<style>
	.tray { margin-bottom: var(--s3); }
	.tray.off { opacity: 0.45; }

	.label {
		font-size: 0.62rem;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-bottom: var(--s1);
		font-weight: 500;
	}

	.tray.picked .label {
		font-weight: 700;
		color: var(--ink);
	}

	.row { display: flex; gap: var(--s2); flex-wrap: wrap; }

	.chip {
		appearance: none;
		border: 1px solid var(--rule-strong);
		background: var(--paper-raised);
		border-radius: var(--r-sm);
		min-width: 3.2rem;
		min-height: 44px;
		padding: 0.5rem 1.15rem;
		font-family: var(--hangul);
		font-size: 1.55rem;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.08rem;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease), color var(--fast) var(--ease);
	}

	.chip.text {
		font-family: var(--sans);
		font-size: 0.84rem;
		font-weight: 600;
		min-width: 4.4rem;
		min-height: 44px;
		padding: 0.62rem 0.7rem;
	}

	.chip:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.chip:active:not(:disabled) { transform: translateY(0); }
	.chip:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.chip:disabled { cursor: default; opacity: 0.5; }

	.chip.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		border-width: 2px;
	}
	.chip.on.blue { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }

	.chip.draggable { touch-action: none; user-select: none; }
	.chip.lifted { opacity: 0.4; }

	.mark {
		font-family: var(--sans);
		font-size: 0.52rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		line-height: 1;
		padding-inline: 0.2rem;
		text-align: center;
	}

	.ghost {
		position: fixed;
		z-index: 20;
		pointer-events: none;
		transform: translate(-50%, -50%);
		font-family: var(--hangul);
		font-size: 2rem;
		color: var(--accent);
		filter: drop-shadow(0 4px 10px color-mix(in srgb, var(--ink) 18%, transparent));
	}
	.ghost .text {
		font-family: var(--sans);
		font-size: 0.84rem;
		font-weight: 600;
	}

	@media (forced-colors: active) {
		.chip {
			background: ButtonFace;
			color: ButtonText;
			border: 1px solid ButtonText;
		}
		.chip.on,
		.chip.on.blue {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
	}
</style>
