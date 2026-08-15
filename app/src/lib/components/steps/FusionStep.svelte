<script lang="ts">
	import Slots from '../Slots.svelte';
	import Tray from '../Tray.svelte';
	import Target from '../Target.svelte';
	import { fuse, harmony } from '$lib/domain/hangul';
	import type { FusionStep } from '$lib/content/types';

	let { step, onSettle, onNudge }: {
		step: FusionStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	let a = $state<string | null>(null);
	let b = $state<string | null>(null);
	let solved = $state(false);

	const result = $derived(a && b ? fuse(a, b) : '');
	const won = $derived(result === step.target);
	const impossible = $derived(!!a && !!b && !result);

	$effect(() => {
		if (won && !solved) {
			solved = true;
			return onSettle();
		}
		if (solved || !a || !b) return;

		if (result) {
			onNudge(
				`<p>That fuses to <span class="jamo">${result}</span>. Which two pieces make <span class="jamo">${step.target}</span>?</p>`,
				true
			);
		} else {
			// The interesting failure: name *why* it does not exist.
			const clash =
				harmony(a) !== 'neutral' && harmony(b) !== 'neutral' && harmony(a) !== harmony(b);
			onNudge(
				`<p>Korean has no vowel <span class="jamo">${a}</span> + <span class="jamo">${b}</span>.` +
					(clash
						? ' One of those is a <em>bright</em> vowel and the other is <em>dark</em>, and Korean does not mix the two inside a single vowel.'
						: '') +
					`</p>`,
				true
			);
		}
	});
</script>

<Target target={step.target} name={step.targetName} verb="Fuse" />

<Slots
	slots={[{ value: a, name: 'first' }, { value: b, name: 'second' }]}
	result={result}
	state={won ? 'win' : impossible ? 'dead' : result ? 'partial' : 'empty'}
/>

<Tray label="first vowel" items={step.first} selected={a} onSelect={(v) => (a = v)} />
<Tray label="second vowel" items={step.second} selected={b} onSelect={(v) => (b = v)} />
