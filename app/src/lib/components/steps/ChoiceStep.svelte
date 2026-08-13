<script lang="ts">
	import Stage from '../Stage.svelte';
	import Options from '../Options.svelte';
	import type { ChoiceStep } from '$lib/content/types';

	let { step, onSettle, onNudge }: {
		step: ChoiceStep;
		onSettle: (teach?: string, correct?: boolean) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let picker = $state<Options | undefined>();

	// A choice always resolves — a wrong pick still advances, because the
	// teaching is in the explanation rather than in retrying a guess.
	function handle(correct: boolean) {
		if (correct) onSettle();
		else onSettle(step.miss ?? step.teach, false);
	}

	export function key(n: number) {
		picker?.keyPick(n);
	}
</script>

{#if step.stage?.length}
	<Stage items={step.stage} vs={step.vs} />
{/if}

<Options
	bind:this={picker}
	options={step.options}
	answer={step.answer}
	stack={step.stack}
	onPick={handle}
/>
