<script lang="ts">
	import Target from '../Target.svelte';
	import { hasHangul } from '$lib/a11y/lang';
	import type { VowelStep } from '$lib/content/types';
	import {
		EMPTY_BOARD,
		PALETTE,
		applyLift,
		applyStamp,
		clearDock,
		dockPosition,
		liftDock,
		occupant,
		sideOfDock,
		snapDock,
		stampLabel,
		visibleDocks,
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
	let selected = $state<Stamp>('ㅣ');
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

	const result = $derived(vowelOf(board));
	const won = $derived(result === step.target);
	const docks = $derived(visibleDocks(board));
	const selectedIndex = $derived(Math.max(0, PALETTE.indexOf(selected)));

	$effect(() => {
		if (won && !solved) {
			solved = true;
			onSettle();
		} else if (result && !won && !solved) {
			onNudge(
				`<p>That builds <span class="jamo">${result}</span>. Keep going — which stroke, how many ticks, and which side make <span class="jamo">${step.target}</span>?</p>`,
				true
			);
		}
	});

	function place(dock: DockId) {
		if (solved) return;
		const next = applyStamp(board, dock, selected);
		if (next) board = next;
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
		if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			board = clearDock(board, docks[i]);
			return;
		}
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			place(docks[i]);
			return;
		}
		let delta = 0;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') delta = 1;
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') delta = -1;
		else return;
		e.preventDefault();
		const next = docks[(i + delta + docks.length) % docks.length];
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
		skipClick = true;
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
			rect.width
		);
		if (next) {
			const seated = applyLift(board, next, active.lift);
			if (seated) board = seated;
			else if (active.fromBoard) board = active.origin;
		} else if (active.fromBoard) {
			board = active.origin;
		}
	}

	function onDockClick(id: DockId) {
		if (skipClick) {
			skipClick = false;
			return;
		}
		place(id);
	}
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

<Target target={step.target} name={step.targetName} />

<div
	class={['zone', won && 'win', result && 'filled']}
	bind:this={boardEl}
	data-dock-board
	role="group"
	aria-label="vowel board"
>
	{#if result}
		<span class="glyph" lang="ko">{result}</span>
	{/if}
	{#each docks as id (id)}
		{@const pos = dockPosition(id)}
		<button
			type="button"
			class={['dock', occupant(board, id) && 'held', id === 'base' && 'base']}
			data-dock={id}
			style:left="{pos.x * 100}%"
			style:top="{pos.y * 100}%"
			aria-label={dockAria(id)}
			disabled={solved}
			onkeydown={onBoardKey}
			onpointerdown={(e) => startDockDrag(id, e)}
			onclick={() => onDockClick(id)}
		></button>
	{/each}
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
					<span class="tick-mark" aria-hidden="true"></span>
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
			<span class="tick-mark"></span>
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
		font-size: 4.4rem;
		font-weight: 500;
		line-height: 1;
		pointer-events: none;
	}

	.dock {
		appearance: none;
		position: absolute;
		width: 2.75rem;
		height: 2.75rem;
		margin: 0;
		padding: 0;
		border: 2px dashed color-mix(in srgb, var(--accent) 35%, transparent);
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
		border-style: solid;
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.zone.win .dock {
		border-color: color-mix(in srgb, var(--good) 45%, transparent);
	}
	.dock:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.dock:disabled {
		cursor: default;
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
		align-items: center;
		justify-content: center;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}
	.stamp:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
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
		width: 1.15rem;
		height: 0.22rem;
		border-radius: 2px;
		background: currentColor;
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
