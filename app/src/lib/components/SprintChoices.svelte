<script lang="ts">
	import {
		choiceIndexFromKey,
		choiceKeyLabel,
		choiceKeyScheme
	} from '$lib/a11y/choiceKeys';

	let {
		options,
		onPick,
		disabled = false
	}: {
		options: string[];
		onPick: (index: number) => void;
		disabled?: boolean;
	} = $props();

	const keyScheme = $derived(choiceKeyScheme(options));
	let locked = $state(false);

	function pick(i: number) {
		if (locked || disabled) return;
		locked = true;
		onPick(i);
	}

	export function keyPick(key: string) {
		const i = choiceIndexFromKey(keyScheme, key, options.length);
		if (i !== null) pick(i);
	}

	/** WCAG 2.1.4: digit/letter picks are active only while a choice control is focused. */
	function onChoiceKeydown(e: KeyboardEvent) {
		if (locked || disabled || e.metaKey || e.ctrlKey || e.altKey) return;
		const i = choiceIndexFromKey(keyScheme, e.key, options.length);
		if (i === null) return;
		e.preventDefault();
		pick(i);
	}
</script>

<div class="opts" role="group" aria-label="answer choices">
	{#each options as text, i (text)}
		{@const inert = locked || disabled}
		<button
			class="opt"
			aria-disabled={inert ? 'true' : undefined}
			onclick={() => pick(i)}
			onkeydown={onChoiceKeydown}
			aria-label="Option {choiceKeyLabel(keyScheme, i)}: {text}"
		>
			<span class="key" aria-hidden="true"><span>{choiceKeyLabel(keyScheme, i)}</span></span>
			<span class="txt">{text}</span>
		</button>
	{/each}
</div>

<style>
	.opts {
		display: grid;
		gap: var(--s2);
		grid-template-columns: 1fr 1fr;
	}

	.opt {
		appearance: none;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		color: var(--ink);
		padding: 0.8rem 0.9rem;
		min-width: 44px;
		min-height: 44px;
		font-size: 0.94rem;
		font-weight: 500;
		line-height: 1.35;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		text-align: center;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease);
	}

	/* Key chip and focus treatment mirror Options.svelte — the lab grid and
	   the tap grid are the same control to the learner. */
	.key {
		box-sizing: border-box;
		font-family: var(--mono);
		font-size: 0.75rem;
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
	.key span {
		transform: translateY(1.5px);
	}

	.opt:hover:not([aria-disabled='true']) {
		border-color: var(--accent);
	}
	.opt:active:not([aria-disabled='true']) {
		transform: translateY(1px);
		border-color: var(--accent);
	}
	.opt:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.opt[aria-disabled='true'] {
		cursor: default;
	}

	@media (forced-colors: active) {
		.opt {
			background: ButtonFace;
			color: ButtonText;
			border: 1px solid ButtonText;
		}
	}
</style>
