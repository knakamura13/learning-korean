<script lang="ts">
	import { hasHangul } from '$lib/a11y/lang';
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
</script>

<div class="asm">
	{#each slots as slot, i (i)}
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
			aria-label={slot.name ? `${slot.name}: ${slot.value ?? 'empty'}` : undefined}
		>
			{#if slot.name}
				<span class="slot-name">{slot.name}</span>
			{/if}
			<span class="slot-value">{slot.value ?? ''}</span>
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
		width: 4.2rem;
		height: 4.2rem;
		border: 2px dashed var(--rule-strong);
		border-radius: var(--r-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		font-family: var(--hangul);
		font-size: 2.3rem;
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
		letter-spacing: 0.08em;
		text-transform: uppercase;
		line-height: 1;
		color: var(--ink-faint);
	}

	.slot.filled .slot-name { color: var(--accent); }

	.slot:focus-visible,
	.out:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.slot-value { line-height: 1; }

	.slot.bottom {
		align-self: flex-end;
		border-bottom-width: 3px;
		border-color: var(--blue);
	}
	.slot.bottom.filled { background: var(--blue-soft); border-color: var(--blue); }

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
		.slot { width: 3.4rem; height: 3.4rem; font-size: 1.8rem; }
		.out { width: 4.4rem; height: 4.4rem; font-size: 2.6rem; }
		.asm { gap: var(--s2); }
	}
</style>
