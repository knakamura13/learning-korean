<script lang="ts">
	import { untrack } from 'svelte';
	import Target from '../Target.svelte';
	import { hasHangul } from '$lib/a11y/lang';
	import type { VowelStep } from '$lib/content/types';
	import {
		EMPTY_BOARD,
		PALETTE,
		applyLift,
		applyStamp,
		boardDocks,
		clearDock,
		compatibleStamps,
		dockInDirection,
		dockPosition,
		liftDock,
		occupant,
		recipeOf,
		sideOfDock,
		snapDock,
		stampLabel,
		towardTarget,
		vowelOf,
		type DockId,
		type Lift,
		type Stamp
	} from '$lib/domain/vowelBoard';

	let { step, onSettle, onNudge }: {
		step: VowelStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let board = $state(EMPTY_BOARD);
	let selected = $state<Stamp>(untrack(() => recipeOf(step.target)?.base ?? 'ㅣ'));
	let solved = $state(false);
	let boardEl = $state<HTMLDivElement>();
	let paletteEl = $state<HTMLDivElement>();
	let skipClick = $state(false);
	let pending = $state<{
		kind: 'palette' | 'dock';
		stamp: Stamp;
		dock: DockId | null;
		x: number;
		y: number;
		target: HTMLElement;
	} | null>(null);
	let drag = $state<{
		lift: Lift;
		origin: typeof EMPTY_BOARD;
		fromBoard: boolean;
		x: number;
		y: number;
	} | null>(null);
	let picker = $state<{ dock: DockId; index: number } | null>(null);
	let activeDock = $state<DockId>('base');
	let hadNudge = $state(false);

	const result = $derived(vowelOf(board));
	const won = $derived(result === step.target);
	const docks = $derived(boardDocks(board, step.target));
	const selectedIndex = $derived(Math.max(0, PALETTE.indexOf(selected)));
	const pickerOptions = $derived(picker ? compatibleStamps(board, picker.dock) : []);
	const tabDock = $derived((docks.includes(activeDock) ? activeDock : docks[0]) ?? 'base');
	const tickUpright = $derived((board.base ?? selected) === 'ㅡ');

	$effect(() => {
		if (won && !solved) {
			solved = true;
			picker = null;
			onSettle();
		} else if (!solved && (!result || towardTarget(board, step.target))) {
			if (hadNudge) {
				hadNudge = false;
				onNudge('');
			}
		} else if (result && !won && !solved) {
			hadNudge = true;
			onNudge(
				`<p>That builds <span class="jamo">${result}</span>. Keep going — which stroke, how many ticks, and which side make <span class="jamo">${step.target}</span>?</p>`,
				true
			);
		}
	});

	function focusNextOpen() {
		const open = docks.find((id) => occupant(board, id) === null);
		if (!open) return;
		activeDock = open;
		boardEl?.querySelector<HTMLButtonElement>(`[data-dock="${open}"]`)?.focus();
	}

	function place(dock: DockId) {
		if (solved) return;
		const next = applyStamp(board, dock, selected);
		if (next) board = next;
		focusNextOpen();
	}

	function seat(dock: DockId, stamp: Stamp) {
		if (solved) return;
		const next = applyStamp(board, dock, stamp);
		if (next) board = next;
		selected = stamp;
		picker = null;
		focusNextOpen();
	}

	function activateDock(dock: DockId) {
		if (solved) return;
		const options = compatibleStamps(board, dock);
		if (options.length === 0) return;
		if (options.length === 1) {
			seat(dock, options[0]);
			return;
		}
		picker = { dock, index: 0 };
	}

	function confirmPicker() {
		if (!picker) return;
		const stamp = pickerOptions[picker.index];
		if (!stamp) return;
		seat(picker.dock, stamp);
	}

	function dockName(id: DockId): string {
		if (id === 'base') return 'base';
		const side = sideOfDock(id);
		return id.endsWith('2') ? `${side} second tick` : `${side} tick`;
	}

	function dockAria(id: DockId): string {
		const seated = occupant(board, id);
		const fill = seated ? stampLabel(seated) : 'empty';
		return `${dockName(id)} dock, ${fill}`;
	}

	function arrowDir(key: string): 'left' | 'right' | 'up' | 'down' | null {
		switch (key) {
			case 'ArrowLeft':
				return 'left';
			case 'ArrowRight':
				return 'right';
			case 'ArrowUp':
				return 'up';
			case 'ArrowDown':
				return 'down';
			default:
				return null;
		}
	}

	function armClickSkip() {
		skipClick = true;
		queueMicrotask(() => {
			skipClick = false;
		});
	}

	function closePicker() {
		picker = null;
	}

	function onBoardFocusOut(e: FocusEvent) {
		if (!picker) return;
		const next = e.relatedTarget;
		if (next instanceof Node && boardEl?.contains(next)) {
			if (next instanceof HTMLElement && next.dataset.dock === picker.dock) return;
			if (next instanceof HTMLElement && next.closest('[data-shape-picker]')) return;
		}
		closePicker();
	}

	function onWindowKey(e: KeyboardEvent) {
		if (!picker || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key !== 'Escape') return;
		e.preventDefault();
		const id = picker.dock;
		closePicker();
		boardEl?.querySelector<HTMLButtonElement>(`[data-dock="${id}"]`)?.focus();
	}

	function onPaletteKey(e: KeyboardEvent) {
		if (solved || e.metaKey || e.ctrlKey || e.altKey) return;
		let delta = 0;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') delta = 1;
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') delta = -1;
		else return;
		const chips = paletteEl ? [...paletteEl.querySelectorAll<HTMLButtonElement>('.stamp')] : [];
		const from = e.target instanceof HTMLButtonElement ? chips.indexOf(e.target) : -1;
		if (chips.length === 0 || from < 0) return;
		e.preventDefault();
		const next = chips[(from + delta + chips.length) % chips.length];
		next.focus();
		selected = PALETTE[chips.indexOf(next)];
	}

	function onBoardKey(e: KeyboardEvent) {
		if (solved || e.metaKey || e.ctrlKey || e.altKey) return;
		const id = e.target instanceof HTMLElement ? e.target.dataset.dock : undefined;
		const i = id ? docks.indexOf(id as DockId) : -1;
		if (i < 0) return;
		const focused = docks[i];
		if (picker && picker.dock === focused) {
			if (e.key === 'Escape') {
				e.preventDefault();
				closePicker();
				return;
			}
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				armClickSkip();
				confirmPicker();
				return;
			}
			const cycleDir = arrowDir(e.key);
			if (!cycleDir) return;
			e.preventDefault();
			const n = pickerOptions.length;
			if (n === 0) return;
			const cycle = cycleDir === 'right' || cycleDir === 'down' ? 1 : -1;
			picker = { ...picker, index: (picker.index + cycle + n) % n };
			return;
		}
		if (e.key === 'Escape' && picker) {
			e.preventDefault();
			closePicker();
			return;
		}
		if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			board = clearDock(board, focused);
			return;
		}
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			armClickSkip();
			activateDock(focused);
			return;
		}
		const dir = arrowDir(e.key);
		if (!dir) return;
		e.preventDefault();
		if (picker) closePicker();
		const next = dockInDirection(board, focused, dir, docks);
		activeDock = next;
		boardEl?.querySelector<HTMLButtonElement>(`[data-dock="${next}"]`)?.focus();
	}

	function startPaletteDrag(stamp: Stamp, e: PointerEvent) {
		if (solved) return;
		selected = stamp;
		pending = {
			kind: 'palette',
			stamp,
			dock: null,
			x: e.clientX,
			y: e.clientY,
			target: e.currentTarget as HTMLElement
		};
	}

	function startDockDrag(id: DockId, e: PointerEvent) {
		if (solved || !occupant(board, id)) return;
		pending = {
			kind: 'dock',
			stamp: occupant(board, id)!,
			dock: id,
			x: e.clientX,
			y: e.clientY,
			target: e.currentTarget as HTMLElement
		};
	}

	function beginDrag(e: PointerEvent) {
		if (!pending || drag) return;
		if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < 8) return;
		const start = pending;
		pending = null;
		start.target.setPointerCapture(e.pointerId);
		if (start.kind === 'palette') {
			drag = {
				lift: { stamp: start.stamp, count: 1 },
				origin: board,
				fromBoard: false,
				x: e.clientX,
				y: e.clientY
			};
			return;
		}
		if (!start.dock) return;
		const lifted = liftDock(board, start.dock);
		if (!lifted) return;
		drag = { lift: lifted.lift, origin: board, fromBoard: true, x: e.clientX, y: e.clientY };
		board = lifted.remaining;
	}

	function onPointerMove(e: PointerEvent) {
		if (pending && !drag) beginDrag(e);
		if (!drag) return;
		drag = { ...drag, x: e.clientX, y: e.clientY };
	}

	function onPointerUp(e: PointerEvent) {
		pending = null;
		if (!drag) return;
		armClickSkip();
		const active = drag;
		drag = null;
		const rect = boardEl?.getBoundingClientRect();
		if (!rect) {
			if (active.fromBoard) board = active.origin;
			return;
		}
		const next = snapDock(
			board,
			active.lift,
			e.clientX - rect.left,
			e.clientY - rect.top,
			rect.width,
			docks
		);
		if (next) {
			const seated = applyLift(board, next, active.lift);
			if (seated) board = seated;
			else if (active.fromBoard) board = active.origin;
		} else if (active.fromBoard) {
			board = active.origin;
		}
	}

	function onDockClick(id: DockId, e: MouseEvent) {
		if (skipClick) {
			skipClick = false;
			return;
		}
		if (picker) {
			// Keyboard Enter on a <button> also synthesizes click (detail 0).
			// Closing on that click makes the wheel vanish as it opens.
			if (e.detail === 0) return;
			picker = null;
			return;
		}
		place(id);
	}
</script>

<svelte:window
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onkeydown={onWindowKey}
/>

<Target target={step.target} name={step.targetName} />

<div
	class={['zone', won && 'win', result && 'filled']}
	bind:this={boardEl}
	data-dock-board
	role="group"
	aria-label="vowel board"
	onfocusout={onBoardFocusOut}
>
	{#if result}
		<span class="glyph" lang="ko">{result}</span>
	{/if}
	{#each docks as id (id)}
		{@const pos = dockPosition(id, docks)}
		<button
			type="button"
			class={['dock', occupant(board, id) ? 'held' : 'open', id === 'base' && 'base']}
			data-dock={id}
			tabindex={solved ? -1 : id === tabDock ? 0 : -1}
			style:left="{pos.x * 100}%"
			style:top="{pos.y * 100}%"
			aria-label={dockAria(id)}
			aria-haspopup="listbox"
			aria-expanded={picker?.dock === id}
			aria-controls={picker?.dock === id ? 'vowel-shape-picker' : undefined}
			disabled={solved}
			onfocus={() => (activeDock = id)}
			onkeydown={onBoardKey}
			onpointerdown={(e) => startDockDrag(id, e)}
			onclick={(e) => onDockClick(id, e)}
		></button>
	{/each}
	{#if picker}
		{@const openDock = picker.dock}
		{@const pos = dockPosition(openDock, docks)}
		<div
			id="vowel-shape-picker"
			class="picker"
			data-shape-picker
			role="listbox"
			tabindex="-1"
			aria-label="choose a stroke"
			aria-activedescendant="vowel-pick-{picker.index}"
			style:left="{pos.x * 100}%"
			style:top="{pos.y * 100}%"
		>
			{#each pickerOptions as stamp, i (stamp)}
				<button
					id="vowel-pick-{i}"
					type="button"
					tabindex="-1"
					class={['choice', i === picker.index && 'on']}
					role="option"
					data-stamp={stamp}
					aria-selected={i === picker.index}
					lang={hasHangul(stamp) ? 'ko' : undefined}
					onclick={() => seat(openDock, stamp)}
				>
					{#if stamp === 'tick'}
						<span class={['tick-mark', tickUpright && 'upright']}></span>
					{:else}
						{stamp}
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<div
	class="palette"
	role="radiogroup"
	aria-labelledby="vowel-strokes-label"
	aria-disabled={solved ? 'true' : undefined}
	tabindex="-1"
	bind:this={paletteEl}
	onkeydown={onPaletteKey}
>
	<div class="label" id="vowel-strokes-label">strokes</div>
	<div class="row">
		{#each PALETTE as stamp, i (stamp)}
			<button
				type="button"
				class={['stamp', selected === stamp && 'on', stamp === 'tick' && 'tick']}
				role="radio"
				aria-checked={selected === stamp}
				aria-label="strokes: {stamp}"
				tabindex={i === selectedIndex ? 0 : -1}
				lang={hasHangul(stamp) ? 'ko' : undefined}
				disabled={solved}
				onpointerdown={(e) => startPaletteDrag(stamp, e)}
				onclick={() => (selected = stamp)}
			>
				{#if stamp === 'tick'}
					<span class={['tick-mark', tickUpright && 'upright']} aria-hidden="true"></span>
					<span class="mark">tick</span>
				{:else}
					<span class="glyph">{stamp}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

{#if drag}
	<div class="ghost" style:left="{drag.x}px" style:top="{drag.y}px" aria-hidden="true">
		{#if drag.lift.stamp === 'tick'}
			<span class={['tick-mark', tickUpright && 'upright']}></span>
		{:else}
			<span class="glyph" lang="ko">{drag.lift.stamp}</span>
		{/if}
	</div>
{/if}

<style>
	.zone {
		position: relative;
		width: min(12rem, 70vw);
		height: min(12rem, 70vw);
		margin: 0 auto var(--s5);
		border: 2px dashed var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		transition: border-color var(--med) var(--ease), background var(--med) var(--ease),
			color var(--med) var(--ease), transform var(--med) var(--ease);
	}
	.zone.filled {
		border-style: solid;
		border-color: var(--accent);
	}
	.zone.win {
		border-color: var(--good);
		background: var(--good-soft);
		color: var(--good);
		transform: scale(1.04);
	}

	.zone .glyph {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--hangul);
		font-size: 5rem;
		font-weight: 500;
		line-height: 1;
		color: var(--ink);
		pointer-events: none;
		z-index: 0;
	}
	.zone.win .glyph { color: var(--good); }

	.dock {
		appearance: none;
		position: absolute;
		z-index: 1;
		width: 2.75rem;
		height: 2.75rem;
		margin: 0;
		padding: 0;
		border: 2px dashed color-mix(in srgb, var(--accent) 28%, transparent);
		border-radius: 50%;
		background: transparent;
		transform: translate(-50%, -50%);
		cursor: pointer;
	}
	.dock.base {
		width: 3.4rem;
		height: 3.4rem;
		border-radius: var(--r-md);
	}
	.dock.held {
		border: none;
		background: transparent;
		cursor: grab;
		opacity: 0;
	}
	.dock.open {
		border: 2px dashed color-mix(in srgb, var(--accent) 28%, transparent);
	}
	.zone.filled .dock.open { opacity: 1; }
	.dock.held:focus-visible {
		outline: none;
		box-shadow: none;
	}
	.dock:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.dock:disabled {
		cursor: default;
	}

	.picker {
		position: absolute;
		z-index: 6;
		display: flex;
		gap: 0.28rem;
		padding: 0.28rem;
		border: 1px solid var(--accent);
		border-radius: var(--r-sm);
		background: var(--paper-raised);
		box-shadow: var(--shadow-2);
		transform: translate(-50%, calc(-100% - 0.5rem));
	}
	.choice {
		appearance: none;
		min-width: 2.4rem;
		min-height: 2.4rem;
		margin: 0;
		padding: 0;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-sm);
		background: var(--paper-raised);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--hangul);
		font-size: 1.35rem;
		cursor: pointer;
	}
	.choice.on {
		border-color: var(--accent);
		border-width: 2px;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.palette { margin-bottom: var(--s3); }
	.label {
		font-size: 0.62rem;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-bottom: var(--s1);
		font-weight: 500;
	}
	.row { display: flex; gap: var(--s2); flex-wrap: wrap; justify-content: center; }

	.stamp {
		appearance: none;
		border: 1px solid var(--rule-strong);
		background: var(--paper-raised);
		border-radius: var(--r-sm);
		min-width: 3.2rem;
		min-height: 44px;
		padding: 0.45rem 0.55rem;
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
			transform var(--fast) var(--ease);
	}
	.stamp:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.stamp:active:not(:disabled) { transform: translateY(0); }
	.stamp.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		border-width: 2px;
	}
	.stamp:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.stamp:disabled { cursor: default; opacity: 0.5; }

	.tick-mark {
		display: block;
		width: 0.7rem;
		height: 0.2rem;
		border-radius: 2px;
		background: currentColor;
	}
	.tick-mark.upright {
		width: 0.2rem;
		height: 0.7rem;
	}
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

	@media (forced-colors: active) {
		.stamp, .dock {
			background: ButtonFace;
			color: ButtonText;
			border-color: ButtonText;
		}
		.stamp.on, .dock.held {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
	}
</style>
