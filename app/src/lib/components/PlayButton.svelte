<script lang="ts">
	import { consonantAudioSrc } from '$lib/audio/consonants';
	import ConsonantClip from './ConsonantClip.svelte';

	let {
		jamo,
		src
	}: {
		jamo: string;
		/** Override lookup; pass `null` to force a missing clip. */
		src?: string | null;
	} = $props();

	const resolved = $derived(src !== undefined ? src : consonantAudioSrc(jamo));
</script>

{#if resolved}
	{#key resolved}
		<ConsonantClip {jamo} src={resolved} />
	{/key}
{/if}
