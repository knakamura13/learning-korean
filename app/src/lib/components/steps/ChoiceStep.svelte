<script lang="ts">
	import Stage from '../Stage.svelte';
	import Options from '../Options.svelte';
	import type { ChoiceStep } from '$lib/content/types';
	import { resolveChoicePick } from '$lib/domain/advancePick';

	let { step, onSettle, onNudge }: {
		step: ChoiceStep;
		onSettle: (teach?: string, correct?: boolean) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let picker = $state<Options | undefined>();

	function handle(correct: boolean) {
		const result = resolveChoicePick(correct, step);
		switch (result.action) {
			case 'settle':
				onSettle(undefined, result.correct);
				return;
			case 'nudge':
				onNudge(result.html);
				return;
			default: {
				const _exhaustive: never = result;
				return _exhaustive;
			}
		}
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
