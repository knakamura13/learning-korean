<script lang="ts">
	import { hasHangul } from '$lib/a11y/lang';
	import { jamoReading, VOWELS, type JamoSlot } from '$lib/domain/hangul';
	import { trayLift } from './trayLift.svelte';

	/**
	 * The composer readout: filled slots on the left, result on the right.
	 *
	 * The result box has three distinct states, and keeping them visually
	 * separate matters pedagogically: `?` means "not finished yet", `✕` means
	 * "these pieces make nothing real" — which in Lab 03 is the whole lesson.
	 */
	interface Slot {
		value: string | null;
		/** The batchim slot sits lower and is drawn in blue. */
		bottom?: boolean;
		/** Tray name this slot belongs to — shown so readout matches the chip. */
		name?: string;
	}

	let { slots, result, state = 'empty' }: {
		slots: Slot[];
		result: string;
		state?: 'empty' | 'partial' | 'win' | 'dead';
	} = $props();

	/** Phonetic job from slot shape — fusion trays are named first/second, not vowel. */
	function phoneticColumn(slot: Slot): JamoSlot {
		if (slot.bottom) return 'batchim';
		if (slot.value && (VOWELS as readonly string[]).includes(slot.value)) return 'vowel';
		return 'lead';
	}

	function slotAriaLabel(slot: Slot, reading: string): string | undefined {
		if (!slot.name) return undefined;
		if (!slot.value) return `${slot.name}: empty`;
		if (!reading) return `${slot.name}: ${slot.value}`;
		return `${slot.name}: ${slot.value}, ${reading}`;
	}
</script>

<div class="asm">
	{#each slots as slot, i (i)}
		{@const reading = slot.value ? jamoReading(slot.value, phoneticColumn(slot)) : ''}
		{#if i > 0}<span class="op">+</span>{/if}
		<div
			class={[
				'slot',
				slot.value && 'filled',
				slot.value && 'on',
				slot.bottom && 'bottom',
				slot.name && trayLift.current?.dock === slot.name && 'hot'
			]}
			data-slot={slot.name}
			lang={hasHangul(slot.value ?? '') ? 'ko' : undefined}
			aria-label={slotAriaLabel(slot, reading)}
		>
			{#if slot.name}
				<span class="slot-name">{slot.name}</span>
			{/if}
			<span class="slot-value">{slot.value ?? ''}</span>
			<span class="slot-reading" lang="en" aria-hidden="true">{#if reading}{reading}{/if}</span>
		</div>
	{/each}
	<span class="op">=</span>
	<div
		class="out"
		class:win={state === 'win'}
		class:dead={state === 'dead'}
		lang={hasHangul(result) ? 'ko' : undefined}
	>
		{#if result}
			{result}
		{:else if state === 'dead'}
			<span class="mark bad">✕</span>
		{:else}
			<span class="mark">?</span>
		{/if}
	</div>
</div>

<style>
	.asm {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s3);
		flex-wrap: wrap;
		padding: var(--s2) 0 var(--s5);
	}

	.op { font-size: 1.2rem; color: var(--ink-faint); }

	.slot {
		min-width: 4.2rem;
		width: max-content;
		min-height: 4.92rem;
		padding: 0.4rem 0.9rem;
		border: 2px dashed var(--rule-strong);
		border-radius: var(--r-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.12rem;
		font-weight: 500;
		color: var(--ink-faint);
		position: relative;
		transition: border-color var(--med) var(--ease), color var(--med) var(--ease),
			background var(--med) var(--ease);
	}

	.slot.filled {
		border-style: solid;
		border-color: var(--accent);
		color: var(--ink);
	}

	.slot.on {
		box-shadow: 0 0 0 2px var(--accent-soft);
	}

	.slot.hot {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px var(--accent-soft);
	}
	.slot.bottom.hot {
		border-color: var(--blue);
		box-shadow: 0 0 0 2px var(--blue-soft);
	}

	.slot-name {
		font-family: var(--sans);
		font-size: 0.5rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		line-height: 1;
		color: var(--ink-faint);
		padding-inline: 0.2rem;
		white-space: nowrap;
		text-align: center;
	}

	.slot.filled .slot-name { color: var(--accent); }

	.slot:focus-visible,
	.out:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.slot-value {
		line-height: 1;
		font-family: var(--hangul);
		font-size: 2.3rem;
	}

	/* Spec A said 0.62/500; inherited Noto Sans KR ate Latin, and 0.62 vanished at sitting size. Hangul face is isolated on `.slot-value`; size stays readable. */
	.slot-reading {
		font-family: var(--mono);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		line-height: 1;
		min-height: 0.72rem;
		color: var(--ink-faint);
		text-transform: none;
		text-align: center;
		opacity: 0;
		transition: opacity var(--fast) var(--ease);
	}

	.slot.filled .slot-reading:not(:empty) {
		opacity: 1;
	}

	.slot.bottom {
		align-self: flex-end;
		border-bottom-width: 3px;
		border-color: var(--blue);
	}
	.slot.bottom.filled { border-color: var(--blue); }

	.out {
		width: 5.4rem;
		height: 5.4rem;
		border: 2px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--hangul);
		font-size: 3.2rem;
		font-weight: 500;
		line-height: 1;
		transition: border-color var(--med) var(--ease), background var(--med) var(--ease),
			color var(--med) var(--ease), transform var(--med) var(--ease);
	}

	.out.win {
		border-color: var(--good);
		background: var(--good-soft);
		color: var(--good);
		transform: scale(1.04);
	}

	.out.dead {
		border-color: var(--bad);
		border-style: dashed;
		background: var(--bad-soft);
	}

	.mark {
		font-family: var(--sans);
		font-size: 1.7rem;
		font-weight: 300;
		color: var(--ink-faint);
	}
	.mark.bad { color: var(--bad); }

	@media (max-width: 34rem) {
		.slot { min-width: 3.8rem; min-height: 4.32rem; padding: 0.3rem 0.6rem; }
		.slot-value { font-size: 1.8rem; }
		.slot-reading { font-size: 0.62rem; min-height: 0.64rem; }
		.out { width: 4.4rem; height: 4.4rem; font-size: 2.6rem; }
		.asm { gap: var(--s2); }
	}

	@media (forced-colors: active) {
		.slot-reading { color: CanvasText; }
	}
</style>
