<script lang="ts">
	import { compose, decompose } from '$lib/domain/hangul';
	import type { ComposeTrial } from '$lib/domain/blockCompose';

	let { trial, disabled = false, onPick }: {
		trial: ComposeTrial;
		disabled?: boolean;
		onPick: (correct: boolean, composed: string) => void;
	} = $props();

	let lead = $state<string | null>(null);
	let vowel = $state<string | null>(null);
	let final = $state<string | null>(null);
	let fired = $state(false);

	const wantFinal = $derived(trial.finals !== null);
	const complete = $derived(lead !== null && vowel !== null && (!wantFinal || final !== null));
	const assembled = $derived(
		complete ? compose(lead!, vowel!, wantFinal ? final! : '') : ''
	);
	const answer = $derived(decompose(trial.target)!);

	function maybeSettle() {
		if (!complete || fired) return;
		fired = true;
		onPick(assembled === trial.target, assembled);
	}

	function select(slot: 'lead' | 'vowel' | 'final', jamo: string) {
		if (disabled || fired) return;
		if (slot === 'lead') lead = jamo;
		else if (slot === 'vowel') vowel = jamo;
		else final = jamo;
		maybeSettle();
	}

	function chipState(slot: 'lead' | 'vowel' | 'final', jamo: string): string {
		const picked = slot === 'lead' ? lead : slot === 'vowel' ? vowel : final;
		if (!fired) return picked === jamo ? 'picked' : '';
		const correct =
			slot === 'lead' ? answer.lead : slot === 'vowel' ? answer.vowel : answer.final;
		if (jamo === correct) return 'right';
		if (picked === jamo) return 'wrong';
		return 'dim';
	}

	function chipVerdict(slot: 'lead' | 'vowel' | 'final', jamo: string): 'correct' | 'incorrect' | null {
		const state = chipState(slot, jamo);
		if (state === 'right') return 'correct';
		if (state === 'wrong') return 'incorrect';
		return null;
	}
</script>

<div class="compose">
	<div class="built" aria-live="polite">
		<span class="slot" lang="ko">{assembled || '·'}</span>
	</div>

	{#each [
		{ slot: 'lead' as const, label: 'First sound', chips: trial.leads },
		{ slot: 'vowel' as const, label: 'Vowel', chips: trial.vowels },
		...(trial.finals ? [{ slot: 'final' as const, label: 'Batchim', chips: trial.finals }] : [])
	] as row (row.slot)}
		<div class="row" role="group" aria-label={row.label}>
			<span class="label">{row.label}</span>
			<div class="chips">
				{#each row.chips as jamo (jamo)}
					{@const verdict = chipVerdict(row.slot, jamo)}
					<button
						type="button"
						class="chip {chipState(row.slot, jamo)}"
						aria-pressed={(row.slot === 'lead' ? lead : row.slot === 'vowel' ? vowel : final) === jamo}
						disabled={disabled || fired}
						onclick={() => select(row.slot, jamo)}
					>
						<span lang="ko">{jamo}</span>{#if verdict}<span class="vh">, {verdict}</span>{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.compose {
		display: flex;
		flex-direction: column;
		gap: var(--s3);
	}

	.built {
		text-align: center;
	}
	.slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-inline-size: 4.5rem;
		min-block-size: 4.5rem;
		font-family: var(--hangul);
		font-size: 2.6rem;
		font-weight: 500;
		color: var(--ink);
		background: var(--paper-sunk);
		border: 1px dashed var(--rule-strong);
		border-radius: var(--r-md);
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: var(--s1);
	}
	.label {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}
	.chips {
		display: grid;
		grid-template-columns: repeat(4, minmax(44px, 1fr));
		gap: var(--s2);
	}

	.chip {
		appearance: none;
		min-height: 44px;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		font-family: var(--hangul);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--ink);
		cursor: pointer;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}
	.chip:hover:not(:disabled) {
		border-color: var(--accent);
		transform: translateY(-1px);
	}
	.chip:active:not(:disabled) {
		transform: translateY(0);
	}
	.chip:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.chip:disabled {
		cursor: default;
	}
	.chip.picked {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}
	.chip.right {
		border-color: var(--good);
		background: var(--good-soft);
		color: var(--good);
	}
	.chip.wrong {
		border-color: var(--bad);
		background: var(--bad-soft);
		color: var(--bad);
	}
	.chip.dim {
		opacity: 0.4;
	}

	@media (forced-colors: active) {
		.chip {
			background: ButtonFace;
			color: ButtonText;
			border-color: ButtonText;
		}
		.chip.right,
		.chip.picked {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
		.chip.wrong {
			border-color: ButtonText;
			border-width: 3px;
		}
		.slot {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
	}
</style>
