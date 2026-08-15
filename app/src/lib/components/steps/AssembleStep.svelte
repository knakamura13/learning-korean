<script lang="ts">
	import Slots from '../Slots.svelte';
	import Tray from '../Tray.svelte';
	import Target from '../Target.svelte';
	import { compose } from '$lib/domain/hangul';
	import type { AssembleStep } from '$lib/content/types';

	let { step, onSettle, onNudge }: {
		step: AssembleStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let lead = $state<string | null>(null);
	let vowel = $state<string | null>(null);
	let final = $state<string | null>(null);
	let solved = $state(false);

	const hasFinal = $derived(!!step.finals?.length);
	const result = $derived(lead && vowel ? compose(lead, vowel, final ?? '') : '');
	const won = $derived(result === step.target);

	$effect(() => {
		if (won && !solved) {
			solved = true;
			return onSettle();
		}
		if (solved || !result || won) return;
		// With a batchim slot the block is only a real answer once all three
		// are filled — before that it is mid-build, not a wrong guess.
		if (hasFinal && !final) return;
		onNudge(
			`<p>That builds <span class="hg">${result}</span>. Which pieces make <span class="hg">${step.target}</span>?</p>`
		);
	});

	const slots = $derived(
		hasFinal
			? [
					{ value: lead, name: 'consonant' },
					{ value: vowel, name: 'vowel' },
					{ value: final, name: 'batchim', bottom: true }
				]
			: [
					{ value: lead, name: 'consonant' },
					{ value: vowel, name: 'vowel' }
				]
	);
</script>

<Target target={step.target} name={step.targetName} />

<Slots {slots} {result} state={won ? 'win' : result ? 'partial' : 'empty'} />

<Tray
	label={hasFinal ? 'first consonant' : 'consonant'}
	items={step.consonants}
	selected={lead}
	onSelect={(v) => (lead = v)}
/>
<Tray label="vowel" items={step.vowels} selected={vowel} onSelect={(v) => (vowel = v)} />
{#if hasFinal}
	<Tray
		label="batchim — the bottom slot"
		items={step.finals!}
		selected={final}
		tone="blue"
		onSelect={(v) => (final = v)}
	/>
{/if}
