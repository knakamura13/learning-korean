<script lang="ts">
	import { hasHangul } from '$lib/a11y/lang';

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

	let picked = $state<number | null>(null);
	const settled = $derived(picked !== null);

	function pick(i: number) {
		if (settled || disabled) return;
		picked = i;
		onPick(choices[i].correct, i);
	}

	export function keyPick(n: number) {
		if (n >= 1 && n <= choices.length) pick(n - 1);
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
		>
			<span class="key">{i + 1}</span>
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

	.opts:not(.stack) .opt { justify-content: center; text-align: center; }

	.opt.hangul { font-family: var(--hangul); font-size: 1.9rem; font-weight: 500; min-height: 4rem; }

	.key {
		font-family: var(--mono);
		font-size: 0.62rem;
		color: var(--ink-faint);
		border: 1px solid var(--rule);
		border-radius: 3px;
		padding: 0.05rem 0.3rem;
		flex: 0 0 auto;
	}

	.opt:hover:not(:disabled) {
		border-color: var(--accent);
		transform: translateY(-1px);
		box-shadow: var(--shadow-1);
	}
	.opt:disabled { cursor: default; }

	.opt.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
	.opt.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }
	.opt.dim { opacity: 0.4; }

	.opt.right .key, .opt.wrong .key { opacity: 0.5; }

	@media (max-width: 34rem) {
		.opts { grid-template-columns: 1fr 1fr; }
		.opts.stack { grid-template-columns: 1fr; }
	}
</style>
