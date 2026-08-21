<script lang="ts">
	import { letterAudioSources, type AudioSlot } from '$lib/audio/letters';
	import AudioClip from './AudioClip.svelte';

	let {
		jamo,
		audioSlot,
		src
	}: {
		jamo: string;
		audioSlot: AudioSlot;
		/** Override lookup; pass `null` to force a missing clip. */
		src?: string | null;
	} = $props();

	const resolved = $derived(
		src !== undefined
			? src === null
				? null
				: { opus: src, mp3: src }
			: letterAudioSources(jamo, audioSlot)
	);
</script>

{#if resolved}
	{#key jamo + resolved.opus + resolved.mp3}
		<AudioClip {jamo} opus={resolved.opus} mp3={resolved.mp3} />
	{/key}
{/if}
