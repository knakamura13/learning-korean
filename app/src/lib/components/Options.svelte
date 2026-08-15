<script lang="ts">
	import { hasHangul } from '$lib/a11y/lang';
	import {
		choiceIndexFromKey,
		choiceKeyLabel,
		choiceKeyScheme
	} from '$lib/a11y/choiceKeys';

	/**
	 * A grid of answer buttons with right/wrong reveal.
	 *
	 * Options are shuffled on mount so the correct answer is not positionally
	 * predictable. Authoring rule (enforced by review, not code): every option
	 * in a set should be the same length, or shape alone leaks the answer.
	 */
	let {
		options,
		answer,
		stack = false,
		hangul = false,
		disabled = false,
		onPick
	}: {
		options: string[];
		answer: number;
		stack?: boolean;
		hangul?: boolean;
		disabled?: boolean;
		onPick: (correct: boolean, index: number) => void;
	} = $props();

	interface Choice { text: string; correct: boolean }

	function shuffled(items: Choice[]): Choice[] {
		const a = items.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	// Re-shuffles whenever the option set changes, i.e. on each new step.
	const choices = $derived(
		shuffled(options.map((text, i) => ({ text, correct: i === answer })))
	);
	// Digit chips collide with numeric answers after shuffle (Lab 04/05 counts).
	const keyScheme = $derived(choiceKeyScheme(options));

	let picked = $state<number | null>(null);
	const settled = $derived(picked !== null);

	function pick(i: number) {
		if (settled || disabled) return;
		picked = i;
		onPick(choices[i].correct, i);
	}

	export function keyPick(key: string) {
		const i = choiceIndexFromKey(keyScheme, key, choices.length);
		if (i !== null) pick(i);
	}
</script>

<div class="opts" class:stack role="group" aria-label="answer choices">
	{#each choices as choice, i (choice.text)}
		<button
			class="opt"
			class:hangul
			class:right={settled && choice.correct}
			class:wrong={settled && picked === i && !choice.correct}
			class:dim={settled && !choice.correct && picked !== i}
			disabled={settled || disabled}
			onclick={() => pick(i)}
			aria-label="Option {choiceKeyLabel(keyScheme, i)}: {choice.text}"
		>
			<span class="key" aria-hidden="true"><span>{choiceKeyLabel(keyScheme, i)}</span></span>
			<span class="txt" lang={hasHangul(choice.text) ? 'ko' : undefined}>{choice.text}</span>
		</button>
	{/each}
</div>

<style>
	.opts {
		display: grid;
		gap: var(--s2);
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
	}
	.opts.stack { grid-template-columns: 1fr; }

	.opt {
		appearance: none;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		padding: 0.8rem 0.9rem;
		min-height: 44px;
		font-size: 0.94rem;
		font-weight: 500;
		line-height: 1.35;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: var(--s2);
		text-align: left;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease);
	}

	.opts:not(.stack) .opt {
		position: relative;
		justify-content: center;
		text-align: center;
	}
	.opts:not(.stack) .txt { width: 100%; }
	.opts:not(.stack) .key {
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
	}

	.opt.hangul { font-family: var(--hangul); font-size: 1.9rem; font-weight: 500; min-height: 4rem; }

	.key {
		box-sizing: border-box;
		font-family: var(--mono);
		font-size: 0.44rem;
		font-weight: 600;
		line-height: 1;
		color: var(--ink-faint);
		border: 1px solid var(--rule);
		border-radius: 2px;
		min-width: 1.4em;
		height: 1.4em;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}
	.key span { transform: translateY(1.5px); }

	.opt:hover:not(:disabled) {
		border-color: var(--accent);
		transform: translateY(-1px);
		box-shadow: var(--shadow-1);
	}
	.opt:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}
	.opt:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.opt:disabled { cursor: default; }

	.opt.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
	.opt.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }
	.opt.dim { opacity: 0.4; }

	.opt.right .key, .opt.wrong .key { opacity: 0.5; }

	@media (forced-colors: active) {
		.opt {
			background: ButtonFace;
			color: ButtonText;
			border: 1px solid ButtonText;
		}
		.opt.right {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
		.opt.wrong {
			border-color: ButtonText;
			border-width: 3px;
		}
	}

	@media (max-width: 34rem) {
		.opts { grid-template-columns: 1fr 1fr; }
		.opts.stack { grid-template-columns: 1fr; }
	}
</style>
