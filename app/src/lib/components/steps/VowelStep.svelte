<script lang="ts">
	import Slots from '../Slots.svelte';
	import Tray from '../Tray.svelte';
	import Target from '../Target.svelte';
	import { buildVowel, sidesFor, type TickSide } from '$lib/domain/hangul';
	import type { VowelStep } from '$lib/content/types';

	let { step, onSettle, onNudge }: {
		step: VowelStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let base = $state<string | null>(null);
	let ticks = $state(1);
	let side = $state<TickSide | null>(null);
	let solved = $state(false);

	const sides = $derived(base ? sidesFor(base) : (['left', 'right'] as TickSide[]));
	const result = $derived(base ? buildVowel(base, side, ticks) : '');
	const won = $derived(result === step.target);

	$effect(() => {
		if (won && !solved) {
			solved = true;
			onSettle();
		} else if (result && !won && !solved) {
			// Passing through a real vowel on the way is exploration, not error.
			onNudge(
				`<p>That builds <span class="jamo">${result}</span>. Keep going — which stroke, how many ticks, and which side make <span class="jamo">${step.target}</span>?</p>`,
				true
			);
		}
	});

	function pickBase(value: string) {
		base = value;
		if (side && !sidesFor(value).includes(side)) side = null;
	}
</script>

<Target target={step.target} name={step.targetName} />

<Slots
	slots={[{ value: base }, { value: ticks === 0 ? '—' : side ? String(ticks) : null }]}
	result={result}
	state={won ? 'win' : result ? 'partial' : 'empty'}
/>

<Tray label="base stroke" items={['ㅣ', 'ㅡ']} selected={base} onSelect={pickBase} />
<Tray
	label="ticks"
	items={['none', 'one', 'two']}
	selected={['none', 'one', 'two'][ticks]}
	text
	onSelect={(v) => (ticks = ['none', 'one', 'two'].indexOf(v))}
/>
<Tray
	label="tick side"
	items={sides}
	selected={side}
	text
	disabled={!base || ticks === 0}
	onSelect={(v) => (side = v as TickSide)}
/>
